#!/usr/bin/env python3
"""
Mintlify Research Agent V2 - Folder-Specific Parallel Processing

A next-generation agent that generates comprehensive Mintlify documentation from 
specific folder analysis with intelligent file screening and parallel processing.

Key Features:
- Folder-specific analysis instead of entire repository
- Multi-phase file screening using cheapest models
- Resource-aware parallel processing (max 20 sub-agents)
- Framework-specific intelligence (Express, Next.js, FastAPI, etc.)
- Cost optimization with two-tier model usage
- Intelligent grouping and batching

Architecture:
1. EnhancedFolderStructureAnalyzer - Multi-phase folder analysis
2. FileScreener - Parallel file classification using cheap models
3. IntelligentTaskPlanner - Resource-aware task planning
4. ParallelTaskExecutor - Manages sub-agent distribution
5. MintlifySubAgent - Individual documentation processors
6. ResultAggregator - Collects and synthesizes results
7. MDXValidator - Validates and fixes generated MDX

Usage:
    python mintlify_research_agent_v2.py /path/to/folder YOUR_API_KEY --output ./docs
    
    # Target specific folder
    python mintlify_research_agent_v2.py ./api YOUR_API_KEY --max-agents 15
    
    # Use different models for screening vs documentation
    python mintlify_research_agent_v2.py ./components YOUR_API_KEY --screen-model gemini-2.0-flash --doc-model gemini-2.5-pro
"""

import asyncio
import os
import json
import logging
import time
from dataclasses import dataclass, field
from typing import AsyncIterable, List, Dict, Any, Optional, Tuple
from pathlib import Path
import tempfile
import subprocess
import shutil
import urllib.parse
import re

# Check for required dependencies
try:
    # genai-processors imports
    from genai_processors import content_api, processor, streams  # type: ignore
    from genai_processors.core import genai_model  # type: ignore
    # Try to import OpenAI model support
    try:
        from genai_processors.core import openai_model  # type: ignore
        OPENAI_AVAILABLE = True
    except ImportError:
        OPENAI_AVAILABLE = False
        print("Warning: OpenAI model support not available in genai-processors")
except ImportError as e:
    print("Error: genai-processors not found. Please install with: pip install genai-processors")
    print(f"Import error: {e}")
    exit(1)

try:
    # AdalFlow imports for RAG functionality
    import adalflow as adal
    from api.rag import RAG
    from api.data_pipeline import DatabaseManager
    RAG_AVAILABLE = True
except ImportError as e:
    print("Warning: AdalFlow components not found. RAG functionality will be disabled.")
    print(f"Import error: {e}")
    RAG = None
    DatabaseManager = None
    RAG_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce Google API logging noise
logging.getLogger("google_genai.models").setLevel(logging.WARNING)
logging.getLogger("google.generativeai").setLevel(logging.WARNING)
logging.getLogger("api.openai_client").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

# Reduce RAG/data pipeline logging noise
logging.getLogger("api.data_pipeline").setLevel(logging.WARNING)
logging.getLogger("api.rag").setLevel(logging.WARNING)
logging.getLogger("adalflow").setLevel(logging.WARNING)

# Helper function to create model instances (reuse from v1)
def create_model_instance(api_key: str, model_name: str, provider: str = "google", **kwargs):
    """Create a model instance based on provider and model name."""
    if provider.lower() in ["openai", "openrouter", "custom"]:
        if not OPENAI_AVAILABLE:
            raise ValueError("OpenAI support not available. Please install the modified genai-processors with OpenAI support.")

        temperature = kwargs.get("temperature", 1)
        system_instruction = kwargs.get("system_instruction", None)

        config = openai_model.GenerateContentConfig(temperature=temperature)
        if system_instruction:
            config.system_instruction = system_instruction

        if provider.lower() == "openrouter":
            return openai_model.OpenAIModel(
                api_key=api_key,
                model_name=model_name,
                generate_content_config=config,
                base_url="https://openrouter.ai/api/v1"
            )
        elif provider.lower() == "custom":
            base_url = kwargs.get("base_url")
            if not base_url:
                raise ValueError("base_url is required for custom provider")
            return openai_model.OpenAIModel(
                api_key=api_key,
                model_name=model_name,
                generate_content_config=config,
                base_url=base_url
            )
        else:
            return openai_model.OpenAIModel(
                api_key=api_key,
                model_name=model_name,
                generate_content_config=config
            )
    else:
        # Default to Google Gemini
        from google.genai import types as genai_types

        temperature = kwargs.get("temperature", 0.7)
        top_p = kwargs.get("top_p", 0.8)
        top_k = kwargs.get("top_k", 20)

        config = genai_types.GenerateContentConfig(
            temperature=temperature,
            top_p=top_p,
            top_k=top_k
        )

        return genai_model.GenaiModel(
            api_key=api_key,
            model_name=model_name,
            generate_content_config=config
        )

# Data structures for V2
@dataclass
class FileScreeningResult:
    """Result from file screening phase"""
    file_path: str
    relative_path: str
    summary: str
    documentation_score: int  # 0-10
    file_type: str  # api_route, component, utility, test, config, etc.
    complexity: str  # low, medium, high
    dependencies: List[str]
    estimated_doc_value: str  # high, medium, low, skip
    skip_reason: Optional[str] = None
    framework_category: Optional[str] = None

@dataclass
class RepositoryAnalysisResult:
    """Result of repository-wide analysis"""
    repo_url: str
    local_path: str
    total_folders: int
    selected_folders: List[Dict[str, Any]]
    repository_summary: str
    framework_detected: Optional[str] = None
    estimated_complexity: int = 5  # routes, models, controllers, etc.

@dataclass
class DocumentationTask:
    """A documentation task for parallel execution"""
    task_id: str
    task_name: str
    description: str
    target_filename: str  # e.g., "api/auth-routes.mdx"
    section: str  # e.g., "api-reference"
    file_group: List[FileScreeningResult]  # Files to document together
    priority: int  # 1-10
    estimated_complexity: str  # low, medium, high
    mintlify_components: List[str]  # Suggested components to use

@dataclass
class FolderAnalysisResult:
    """Complete folder analysis result"""
    folder_path: str
    framework_detected: Optional[str]
    total_files_found: int
    files_screened: int
    files_selected: int
    screening_results: List[FileScreeningResult]
    documentation_tasks: List[DocumentationTask]
    resource_plan: Dict[str, Any]

@dataclass
class DocumentationResult:
    """Result from a single documentation task"""
    task: DocumentationTask
    mdx_content: str
    sources: List[str]
    confidence: float
    generation_time: float
    tokens_used: int

# Framework detection patterns
FRAMEWORK_PATTERNS = {
    "express": {
        "indicators": ["package.json", "app.js", "server.js", "routes/", "middleware/"],
        "file_priorities": {
            "routes/*.js": 10,
            "middleware/*.js": 7,
            "models/*.js": 9,
            "controllers/*.js": 9,
            "utils/*.js": 6,
            "tests/*.js": 3
        }
    },
    "nextjs": {
        "indicators": ["next.config.js", "pages/", "components/", "public/"],
        "file_priorities": {
            "pages/api/*.js": 10,
            "components/*.jsx": 9,
            "components/*.tsx": 9,
            "hooks/*.js": 7,
            "utils/*.js": 6,
            "__tests__/*.js": 3
        }
    },
    "fastapi": {
        "indicators": ["main.py", "routers/", "models/", "requirements.txt"],
        "file_priorities": {
            "routers/*.py": 10,
            "models/*.py": 9,
            "dependencies/*.py": 7,
            "utils/*.py": 6,
            "tests/*.py": 3
        }
    },
    "django": {
        "indicators": ["manage.py", "settings.py", "urls.py", "models.py"],
        "file_priorities": {
            "views.py": 10,
            "models.py": 9,
            "urls.py": 8,
            "serializers.py": 8,
            "utils.py": 6,
            "tests.py": 3
        }
    }
}

# File type classifications
FILE_TYPE_PATTERNS = {
    "api_route": ["/routes/", "/api/", "/endpoints/", "router", "route"],
    "model": ["/models/", "/schemas/", "model.py", "schema.py"],
    "controller": ["/controllers/", "/views/", "controller", "view"],
    "middleware": ["/middleware/", "middleware.py", "middleware.js"],
    "utility": ["/utils/", "/helpers/", "util", "helper"],
    "component": ["/components/", ".jsx", ".tsx", ".vue"],
    "hook": ["/hooks/", "use", "hook"],
    "config": ["config", "settings", ".env", "environment"],
    "test": ["/tests/", "/test/", ".test.", ".spec.", "__tests__"],
    "documentation": [".md", ".rst", ".txt", "README", "CHANGELOG"],
    "build": ["build/", "dist/", ".build", "webpack", "rollup", "vite"],
    "dependency": ["node_modules/", "__pycache__/", ".git/", "vendor/"]
}

class GitHubRepositoryHandler:
    """Handles GitHub repository cloning and analysis"""

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or "gemini-2.0-flash"
        self.base_url = base_url

    def is_github_url(self, path: str) -> bool:
        """Check if the path is a GitHub URL"""
        return path.startswith(('https://github.com/', 'http://github.com/', 'github.com/'))

    def parse_github_url(self, url: str) -> Tuple[str, str]:
        """Parse GitHub URL to extract owner and repo"""
        # Clean up the URL
        url = url.replace('http://', 'https://')
        if not url.startswith('https://'):
            url = 'https://' + url

        # Parse the URL
        parsed = urllib.parse.urlparse(url)
        path_parts = parsed.path.strip('/').split('/')

        if len(path_parts) >= 2:
            owner = path_parts[0]
            repo = path_parts[1]
            return owner, repo
        else:
            raise ValueError(f"Invalid GitHub URL format: {url}")

    def extract_folder_path_from_url(self, url: str) -> str:
        """Extract the folder path from a GitHub URL (e.g., tree/main/packages/base/src/lib/components)"""
        # Clean up the URL
        url = url.replace('http://', 'https://')
        if not url.startswith('https://'):
            url = 'https://' + url

        # Parse the URL
        parsed = urllib.parse.urlparse(url)
        path_parts = parsed.path.strip('/').split('/')

        # GitHub URL format: /owner/repo/tree/branch/folder/path
        if len(path_parts) >= 4 and path_parts[2] == 'tree':
            # Skip owner, repo, 'tree', and branch, return the rest as folder path
            folder_parts = path_parts[4:]  # Skip owner/repo/tree/branch
            return '/'.join(folder_parts) if folder_parts else ''
        else:
            return ''

    def get_repository_url(self, url: str) -> str:
        """Get the clean repository URL for cloning from any GitHub URL"""
        owner, repo = self.parse_github_url(url)
        return f"https://github.com/{owner}/{repo}.git"

    async def clone_repository(self, repo_url: str, target_dir: str = None) -> str:
        """Clone GitHub repository to local directory and return path to specific folder if specified"""
        if target_dir is None:
            owner, repo = self.parse_github_url(repo_url)
            target_dir = f"./temp_repos/{owner}_{repo}"

        # Remove existing directory if it exists
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

        # Create parent directory
        os.makedirs(os.path.dirname(target_dir), exist_ok=True)

        # Get the clean repository URL for cloning
        clean_repo_url = self.get_repository_url(repo_url)

        # Clone the repository
        logger.info(f"🔄 Cloning repository: {clean_repo_url}")
        try:
            result = subprocess.run(
                ['git', 'clone', '--depth', '1', clean_repo_url, target_dir],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )

            if result.returncode != 0:
                raise Exception(f"Git clone failed: {result.stderr}")

            logger.info(f"✅ Repository cloned to: {target_dir}")

            # Check if the original URL pointed to a specific folder
            folder_path = self.extract_folder_path_from_url(repo_url)
            if folder_path:
                specific_folder_path = os.path.join(target_dir, folder_path)
                if os.path.exists(specific_folder_path):
                    logger.info(f"📁 Targeting specific folder: {folder_path}")
                    return specific_folder_path
                else:
                    logger.warning(f"⚠️ Specified folder '{folder_path}' not found in repository, using root")
                    return target_dir

            return target_dir

        except subprocess.TimeoutExpired:
            raise Exception("Repository cloning timed out (5 minutes)")
        except FileNotFoundError:
            raise Exception("Git is not installed or not in PATH")

    async def analyze_repository_structure(self, repo_path: str) -> RepositoryAnalysisResult:
        """Analyze repository structure and select top folders for documentation"""

        # Generate file tree
        file_tree = self._generate_file_tree(repo_path)

        # Use LLM to analyze and select important folders
        selected_folders = await self._llm_select_important_folders(repo_path, file_tree)

        # Generate repository summary
        repo_summary = await self._generate_repository_summary(repo_path, file_tree, selected_folders)

        return RepositoryAnalysisResult(
            repo_url=getattr(self, 'current_repo_url', ''),
            local_path=repo_path,
            total_folders=len([d for d in os.listdir(repo_path) if os.path.isdir(os.path.join(repo_path, d))]),
            selected_folders=selected_folders,
            repository_summary=repo_summary,
            framework_detected=self._detect_framework_from_tree(file_tree),
            estimated_complexity=min(10, len(selected_folders) * 2)
        )

    def _generate_file_tree(self, repo_path: str, max_depth: int = 3) -> str:
        """Generate a file tree representation of the repository"""
        tree_lines = []

        def add_tree_line(path: str, prefix: str = "", depth: int = 0):
            if depth > max_depth:
                return

            try:
                items = sorted(os.listdir(path))
                # Filter out common unimportant directories
                items = [item for item in items if not item.startswith('.') and
                        item not in ['node_modules', '__pycache__', 'dist', 'build', 'target', 'vendor']]

                for i, item in enumerate(items):
                    item_path = os.path.join(path, item)
                    is_last = i == len(items) - 1
                    current_prefix = "└── " if is_last else "├── "
                    tree_lines.append(f"{prefix}{current_prefix}{item}")

                    if os.path.isdir(item_path) and depth < max_depth:
                        next_prefix = prefix + ("    " if is_last else "│   ")
                        add_tree_line(item_path, next_prefix, depth + 1)

            except PermissionError:
                pass

        tree_lines.append(os.path.basename(repo_path))
        add_tree_line(repo_path)
        return "\n".join(tree_lines)

    def _detect_framework_from_tree(self, file_tree: str) -> Optional[str]:
        """Detect framework/technology from file tree"""
        tree_lower = file_tree.lower()

        if 'package.json' in tree_lower:
            if 'next.config' in tree_lower or 'pages/' in tree_lower or 'app/' in tree_lower:
                return 'Next.js'
            elif 'src/components' in tree_lower or 'components/' in tree_lower:
                return 'React'
            else:
                return 'Node.js'
        elif 'requirements.txt' in tree_lower or 'pyproject.toml' in tree_lower:
            if 'fastapi' in tree_lower or 'main.py' in tree_lower:
                return 'FastAPI'
            elif 'django' in tree_lower or 'manage.py' in tree_lower:
                return 'Django'
            elif 'flask' in tree_lower or 'app.py' in tree_lower:
                return 'Flask'
            else:
                return 'Python'
        elif 'cargo.toml' in tree_lower:
            return 'Rust'
        elif 'go.mod' in tree_lower:
            return 'Go'
        elif 'pom.xml' in tree_lower or 'build.gradle' in tree_lower:
            return 'Java'
        elif 'composer.json' in tree_lower:
            return 'PHP'

        return None

    async def _llm_select_important_folders(self, repo_path: str, file_tree: str) -> List[Dict[str, Any]]:
        """Use LLM to analyze file tree and select most important folders for documentation"""

        # Create AI model for analysis
        model = create_model_instance(
            api_key=self.api_key,
            provider=self.provider,
            model_name=self.model_name,
            base_url=self.base_url
        )

        prompt = f"""
Analyze this repository file tree and select the TOP 3-5 most important folders that should be documented for developers.

Repository Structure:
{file_tree}

Consider these factors when selecting folders:
1. **Core Application Logic**: Main source code, business logic
2. **API/Routes**: REST endpoints, GraphQL resolvers, API handlers
3. **Components**: Reusable UI components, modules
4. **Models/Schemas**: Data models, database schemas
5. **Services/Utils**: Business services, utility functions
6. **Documentation Value**: Folders that would benefit developers most

AVOID these folders:
- Build/dist folders (build/, dist/, target/)
- Dependencies (node_modules/, vendor/, __pycache__/)
- Config-only folders with just configuration files
- Test folders (unless they contain important integration tests)
- Documentation folders (docs/, .github/)

Return your analysis as JSON in this exact format:
{{
  "selected_folders": [
    {{
      "path": "src/api",
      "name": "API Routes",
      "priority": 10,
      "reason": "Contains all REST API endpoints and route handlers",
      "estimated_files": 15,
      "documentation_value": "high"
    }},
    {{
      "path": "src/components",
      "name": "React Components",
      "priority": 9,
      "reason": "Reusable UI components that developers need to understand",
      "estimated_files": 25,
      "documentation_value": "high"
    }}
  ],
  "framework_detected": "React/Node.js",
  "repository_type": "Full-stack web application"
}}

Focus on folders that contain actual code that developers would need to understand, modify, or extend.
"""

        try:
            # Use streaming approach like other parts of the codebase
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in model(input_stream):
                response_text += response_part.text

            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                selected_folders = result.get('selected_folders', [])

                # Validate that folders actually exist
                validated_folders = []
                for folder in selected_folders:
                    folder_path = os.path.join(repo_path, folder['path'])
                    if os.path.exists(folder_path) and os.path.isdir(folder_path):
                        # Count actual files in the folder
                        actual_files = self._count_files_in_folder(folder_path)
                        folder['actual_files'] = actual_files
                        folder['full_path'] = folder_path
                        validated_folders.append(folder)
                        logger.info(f"✅ Selected folder: {folder['path']} ({actual_files} files) - {folder['reason']}")
                    else:
                        logger.warning(f"⚠️ Folder not found: {folder['path']}")

                return validated_folders
            else:
                logger.error("Failed to parse LLM response for folder selection")
                return self._fallback_folder_selection(repo_path)

        except Exception as e:
            logger.error(f"LLM folder selection failed: {e}")
            return self._fallback_folder_selection(repo_path)

    def _count_files_in_folder(self, folder_path: str) -> int:
        """Count relevant files in a folder (excluding common non-documentation files)"""
        count = 0
        for root, dirs, files in os.walk(folder_path):
            # Skip common build/dependency directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__', '.git', 'dist', 'build']]

            for file in files:
                # Count relevant file types
                if file.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.rs', '.java', '.php', '.rb', '.cpp', '.c', '.h')):
                    count += 1
        return count

    def _fallback_folder_selection(self, repo_path: str) -> List[Dict[str, Any]]:
        """Fallback folder selection when LLM fails"""
        common_important_folders = ['src', 'api', 'components', 'routes', 'services', 'models', 'lib', 'utils']
        selected = []

        for folder_name in common_important_folders:
            folder_path = os.path.join(repo_path, folder_name)
            if os.path.exists(folder_path) and os.path.isdir(folder_path):
                file_count = self._count_files_in_folder(folder_path)
                if file_count > 0:
                    selected.append({
                        'path': folder_name,
                        'name': folder_name.title(),
                        'priority': 8,
                        'reason': f'Common important folder with {file_count} files',
                        'actual_files': file_count,
                        'full_path': folder_path,
                        'documentation_value': 'medium'
                    })

                if len(selected) >= 3:
                    break

        return selected

    async def _generate_repository_summary(self, repo_path: str, file_tree: str, selected_folders: List[Dict]) -> str:
        """Generate a summary of the repository"""

        # Create AI model for analysis
        model = create_model_instance(
            api_key=self.api_key,
            provider=self.provider,
            model_name=self.model_name,
            base_url=self.base_url
        )

        folder_descriptions = "\n".join([
            f"- {folder['path']}: {folder['reason']} ({folder['actual_files']} files)"
            for folder in selected_folders
        ])

        prompt = f"""
Analyze this repository and provide a concise summary for documentation purposes.

Repository Structure:
{file_tree}

Selected Folders for Documentation:
{folder_descriptions}

Provide a 2-3 sentence summary that describes:
1. What this repository/project does
2. The main technology stack
3. Key architectural components

Keep it concise and developer-focused.
"""

        try:
            # Use streaming approach like other parts of the codebase
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in model(input_stream):
                response_text += response_part.text

            return response_text.strip()
        except Exception as e:
            logger.warning(f"Failed to generate repository summary: {e}")
            return f"Repository with {len(selected_folders)} main folders selected for documentation."

class EnhancedFolderStructureAnalyzer(processor.Processor):
    """
    Multi-phase folder analyzer that implements:
    - Phase 1A: Structural analysis and framework detection
    - Phase 1B: Parallel file screening using cheapest model
    - Phase 1C: Intelligent grouping and resource planning
    """

    def __init__(self, api_key: str, provider: str = "google",
                 screen_model: str = None, doc_model: str = None,
                 max_parallel_agents: int = 20, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.base_url = base_url
        self.max_parallel_agents = max_parallel_agents

        # Set default models based on provider
        if screen_model is None:
            if provider.lower() == "openai":
                screen_model = "gpt-4o-mini"  # Cheapest OpenAI model
            elif provider.lower() == "openrouter":
                screen_model = "openai/gpt-4o-mini"
            elif provider.lower() == "custom":
                screen_model = "gpt-4o-mini"
            else:
                screen_model = "gemini-2.0-flash-thinking"  # Cheapest Google model

        if doc_model is None:
            if provider.lower() == "openai":
                doc_model = "gpt-4o"
            elif provider.lower() == "openrouter":
                doc_model = "openai/gpt-4o"
            elif provider.lower() == "custom":
                doc_model = "gpt-4o"
            else:
                doc_model = "gemini-2.5-pro"

        self.screen_model = screen_model
        self.doc_model = doc_model

        # Create model instances
        model_kwargs = {
            "api_key": api_key,
            "provider": provider,
            "temperature": 0.3  # Low temperature for consistent screening
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        # Screening model (cheap, fast)
        self.screening_model = create_model_instance(
            model_name=screen_model, **model_kwargs
        )

        # Documentation model (smart, expensive) - will be used later
        self.documentation_model = create_model_instance(
            model_name=doc_model, **model_kwargs
        )

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute the complete multi-phase folder analysis"""
        async for part in content:
            if content_api.is_text(part.mimetype):
                folder_path = part.text.strip()
                logger.info(f"🔍 Starting enhanced folder analysis: {folder_path}")

                # Validate folder exists (skip validation for GitHub URLs as they'll be handled later)
                def is_github_url(path: str) -> bool:
                    return path.startswith(('https://github.com/', 'http://github.com/', 'github.com/'))

                if not is_github_url(folder_path) and not os.path.exists(folder_path):
                    raise ValueError(f"Folder path does not exist: {folder_path}")

                # Phase 1A: Structural Analysis
                logger.info("📁 Phase 1A: Structural analysis and framework detection")
                structural_info = self._phase_1a_structural_analysis(folder_path)

                # Phase 1B: Parallel File Screening
                logger.info("🔍 Phase 1B: Parallel file screening with cheap model")
                screening_results = await self._phase_1b_parallel_screening(
                    folder_path, structural_info
                )

                # Phase 1C: Intelligent Grouping
                logger.info("🎯 Phase 1C: Intelligent grouping and resource planning")
                analysis_result = self._phase_1c_intelligent_grouping(
                    folder_path, structural_info, screening_results
                )

                # Yield the complete analysis result
                result_json = json.dumps({
                    'folder_path': analysis_result.folder_path,
                    'framework_detected': analysis_result.framework_detected,
                    'total_files_found': analysis_result.total_files_found,
                    'files_screened': analysis_result.files_screened,
                    'files_selected': analysis_result.files_selected,
                    'screening_results': [self._screening_result_to_dict(sr) for sr in analysis_result.screening_results],
                    'documentation_tasks': [self._task_to_dict(task) for task in analysis_result.documentation_tasks],
                    'resource_plan': analysis_result.resource_plan
                })

                result_part = content_api.ProcessorPart(
                    result_json,
                    mimetype="application/json; type=FolderAnalysisResult",
                    metadata={"folder_analysis_result": analysis_result}
                )
                yield result_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"✅ Folder analysis complete: {analysis_result.files_selected}/{analysis_result.total_files_found} files selected, {len(analysis_result.documentation_tasks)} tasks planned",
                    substream_name="status"
                )
                yield status_part
            else:
                yield part

    def _phase_1a_structural_analysis(self, folder_path: str) -> Dict[str, Any]:
        """Phase 1A: Quick structural analysis and framework detection"""
        logger.info(f"Analyzing folder structure: {folder_path}")

        file_tree = {}
        file_types = {}
        total_files = 0
        all_files = []

        # Walk through folder
        for root, dirs, files in os.walk(folder_path):
            # Skip hidden and common build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in [
                'node_modules', '__pycache__', 'build', 'dist', '.git',
                'coverage', '.pytest_cache', '.mypy_cache', 'vendor'
            ]]

            rel_root = os.path.relpath(root, folder_path)
            if rel_root == '.':
                rel_root = ''

            # Track directory structure
            current_level = file_tree
            if rel_root:
                for part in rel_root.split(os.sep):
                    if part not in current_level:
                        current_level[part] = {}
                    current_level = current_level[part]

            # Analyze files in this directory
            for file in files:
                if file.startswith('.') and file not in ['.env', '.gitignore']:
                    continue

                total_files += 1
                ext = Path(file).suffix.lower()
                file_types[ext] = file_types.get(ext, 0) + 1

                # Store full file info for screening
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, folder_path)
                all_files.append({
                    'full_path': full_path,
                    'relative_path': relative_path,
                    'filename': file,
                    'extension': ext
                })

                # Add file to tree
                current_level[file] = None

        # Detect framework
        framework = self._detect_framework(file_tree, all_files)

        return {
            'folder_path': folder_path,
            'file_tree': file_tree,
            'file_types': file_types,
            'total_files': total_files,
            'all_files': all_files,
            'framework_detected': framework
        }

    def _detect_framework(self, file_tree: Dict, all_files: List[Dict]) -> Optional[str]:
        """Detect the framework based on file patterns"""
        tree_str = str(file_tree).lower()
        file_paths = [f['relative_path'].lower() for f in all_files]

        framework_scores = {}

        for framework, config in FRAMEWORK_PATTERNS.items():
            score = 0
            for indicator in config['indicators']:
                if indicator.lower() in tree_str or any(indicator.lower() in path for path in file_paths):
                    score += 1
            framework_scores[framework] = score

        # Return framework with highest score, or None if no clear match
        if framework_scores:
            best_framework = max(framework_scores, key=framework_scores.get)
            if framework_scores[best_framework] >= 2:  # Require at least 2 indicators
                logger.info(f"🎯 Framework detected: {best_framework}")
                return best_framework

        logger.info("🤷 No specific framework detected, using generic analysis")
        return None

    async def _phase_1b_parallel_screening(self, folder_path: str, structural_info: Dict) -> List[FileScreeningResult]:
        """Phase 1B: Parallel file screening using cheap model"""
        all_files = structural_info['all_files']
        framework = structural_info['framework_detected']

        logger.info(f"Screening {len(all_files)} files in parallel using {self.screen_model}")

        # Create screening tasks for each file
        screening_tasks = []
        for file_info in all_files:
            # Skip obviously irrelevant files
            if self._should_skip_file(file_info):
                continue
            screening_tasks.append(file_info)

        logger.info(f"Created {len(screening_tasks)} screening tasks (skipped {len(all_files) - len(screening_tasks)} obvious non-doc files)")

        # Process files in parallel using genai-processors
        screening_results = []

        # Create individual screening streams
        screening_streams = []
        for file_info in screening_tasks:
            async def create_screening_stream(captured_file_info):
                result = await self._screen_single_file(captured_file_info, framework)
                return result

            screening_streams.append(create_screening_stream(file_info))

        # Execute all screening tasks in parallel
        if screening_streams:
            results = await asyncio.gather(*screening_streams, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    logger.warning(f"Screening task failed: {result}")
                    continue
                if result and result.documentation_score > 0:  # Only include files worth documenting
                    screening_results.append(result)

        # Sort by documentation score (highest first)
        screening_results.sort(key=lambda x: x.documentation_score, reverse=True)

        logger.info(f"✅ Screening complete: {len(screening_results)} files selected for documentation")
        return screening_results

    def _should_skip_file(self, file_info: Dict) -> bool:
        """Quick check to skip obviously irrelevant files"""
        path = file_info['relative_path'].lower()
        filename = file_info['filename'].lower()
        ext = file_info['extension'].lower()

        # Skip build/dependency directories
        skip_dirs = ['node_modules/', '__pycache__/', '.git/', 'build/', 'dist/', 'coverage/', 'vendor/']
        if any(skip_dir in path for skip_dir in skip_dirs):
            return True

        # Skip log files, temp files, etc.
        skip_extensions = ['.log', '.tmp', '.cache', '.lock', '.pid', '.swp']
        if ext in skip_extensions:
            return True

        # Skip binary files
        binary_extensions = ['.jpg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll']
        if ext in binary_extensions:
            return True

        # Skip very large files (likely not documentation-worthy)
        try:
            file_size = os.path.getsize(file_info['full_path'])
            if file_size > 1024 * 1024:  # Skip files larger than 1MB
                return True
        except:
            pass

        return False

    async def _screen_single_file(self, file_info: Dict, framework: Optional[str]) -> Optional[FileScreeningResult]:
        """Screen a single file using the cheap model"""
        try:
            # Read file content (with size limit)
            file_path = file_info['full_path']
            relative_path = file_info['relative_path']

            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(8192)  # Read first 8KB only for screening
            except Exception as e:
                logger.warning(f"Could not read file {relative_path}: {e}")
                return None

            # Skip empty files
            if not content.strip():
                return None

            # Create screening prompt
            prompt = self._create_screening_prompt(file_info, content, framework)

            # Query the cheap model
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.screening_model(input_stream):
                response_text += response_part.text

            # Parse the response
            return self._parse_screening_response(response_text, file_info)

        except Exception as e:
            logger.warning(f"Error screening file {file_info['relative_path']}: {e}")
            return None

    def _create_screening_prompt(self, file_info: Dict, content: str, framework: Optional[str]) -> str:
        """Create a prompt for file screening"""
        relative_path = file_info['relative_path']
        filename = file_info['filename']

        framework_context = ""
        if framework:
            framework_context = f"\nDetected Framework: {framework.upper()}"

        prompt = f"""
Analyze this file and provide a JSON response with screening information.

File: {relative_path}
Filename: {filename}{framework_context}

File Content (first 8KB):
{content}

Provide a JSON response with these fields:
{{
  "summary": "Brief 1-sentence description of what this file does",
  "documentation_score": 0-10,
  "file_type": "api_route|model|controller|middleware|utility|component|hook|config|test|documentation|build|dependency",
  "complexity": "low|medium|high",
  "dependencies": ["list", "of", "imported", "modules"],
  "estimated_doc_value": "high|medium|low|skip",
  "skip_reason": "reason if score is 0-1, otherwise null",
  "framework_category": "routes|models|controllers|middleware|components|hooks|utils|tests|config|other"
}}

Scoring Guidelines:
- 10: Core API endpoints, main components, public interfaces
- 8-9: Important business logic, key utilities, configuration
- 5-7: Supporting files, helpers, secondary features
- 2-4: Tests, examples, documentation files
- 0-1: Build files, logs, dependencies, generated code

Return ONLY the JSON, no other text:
"""
        return prompt

    def _parse_screening_response(self, response_text: str, file_info: Dict) -> Optional[FileScreeningResult]:
        """Parse the screening response from the model"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)

                return FileScreeningResult(
                    file_path=file_info['full_path'],
                    relative_path=file_info['relative_path'],
                    summary=data.get('summary', 'No summary available'),
                    documentation_score=max(0, min(10, data.get('documentation_score', 0))),
                    file_type=data.get('file_type', 'unknown'),
                    complexity=data.get('complexity', 'medium'),
                    dependencies=data.get('dependencies', []),
                    estimated_doc_value=data.get('estimated_doc_value', 'low'),
                    skip_reason=data.get('skip_reason'),
                    framework_category=data.get('framework_category', 'other')
                )
        except Exception as e:
            logger.warning(f"Failed to parse screening response for {file_info['relative_path']}: {e}")

        # Fallback: create basic result
        return FileScreeningResult(
            file_path=file_info['full_path'],
            relative_path=file_info['relative_path'],
            summary="File analysis failed",
            documentation_score=1,
            file_type="unknown",
            complexity="medium",
            dependencies=[],
            estimated_doc_value="low",
            skip_reason="Parsing failed"
        )

    def _phase_1c_intelligent_grouping(self, folder_path: str, structural_info: Dict,
                                     screening_results: List[FileScreeningResult]) -> FolderAnalysisResult:
        """Phase 1C: Intelligent grouping and resource planning"""
        framework = structural_info['framework_detected']

        # Filter out low-value files
        high_value_files = [sr for sr in screening_results if sr.documentation_score >= 5]
        medium_value_files = [sr for sr in screening_results if 2 <= sr.documentation_score < 5]

        logger.info(f"File value distribution: {len(high_value_files)} high-value, {len(medium_value_files)} medium-value")

        # Apply strict selection to limit to max 5 batches
        max_batches = 5
        max_total_tasks = self.max_parallel_agents * max_batches
        total_files = len(high_value_files) + len(medium_value_files)

        if total_files > max_total_tasks:
            logger.warning(f"⚠️ Too many files ({total_files}) for resource limits ({max_total_tasks})")
            logger.info("🎯 Applying extra selective filtering...")

            # Prioritize high-value files first, sorted by documentation score
            high_sorted = sorted(high_value_files, key=lambda f: f.documentation_score, reverse=True)
            selected_files = high_sorted[:max_total_tasks]

            # If we still have room, add top medium-value files
            remaining_slots = max_total_tasks - len(selected_files)
            if remaining_slots > 0:
                medium_sorted = sorted(medium_value_files, key=lambda f: f.documentation_score, reverse=True)
                selected_files.extend(medium_sorted[:remaining_slots])

            # Update the file lists with selected files
            high_value_files = [f for f in selected_files if f.documentation_score >= 5]
            medium_value_files = [f for f in selected_files if 2 <= f.documentation_score < 5]

            logger.info(f"📊 Selected {len(selected_files)} files out of {total_files} total")
            logger.info(f"   - High-value: {len(high_value_files)}")
            logger.info(f"   - Medium-value: {len(medium_value_files)}")

        # Group files by logical documentation units
        documentation_tasks = self._create_documentation_tasks(
            high_value_files, medium_value_files, framework
        )

        # Sort by priority (highest first) for optimal batch processing
        documentation_tasks.sort(key=lambda x: x.priority, reverse=True)

        # Calculate batching strategy
        total_tasks = len(documentation_tasks)
        max_batches = 5

        if total_tasks > self.max_parallel_agents:
            num_batches = (total_tasks + self.max_parallel_agents - 1) // self.max_parallel_agents

            # Enforce maximum batch limit
            if num_batches > max_batches:
                logger.error(f"❌ Too many batches required ({num_batches}) - maximum allowed is {max_batches}")
                logger.error(f"   Consider reducing file count or increasing max_parallel_agents")
                # Truncate tasks to fit within batch limit
                max_tasks_allowed = self.max_parallel_agents * max_batches
                documentation_tasks = documentation_tasks[:max_tasks_allowed]
                total_tasks = len(documentation_tasks)
                num_batches = max_batches
                logger.warning(f"⚠️ Truncated to {total_tasks} tasks to fit in {max_batches} batches")

            logger.info(f"📦 Batching strategy: {total_tasks} tasks will be processed in {num_batches} batches of max {self.max_parallel_agents} tasks each")
        else:
            logger.info(f"✅ All {total_tasks} tasks can be processed in a single batch")

        # Create resource plan
        resource_plan = {
            'max_parallel_agents': self.max_parallel_agents,
            'actual_tasks': len(documentation_tasks),
            'total_files_to_document': sum(len(task.file_group) for task in documentation_tasks),
            'estimated_cost_screening': len(screening_results) * 0.001,  # Rough estimate
            'estimated_cost_documentation': len(documentation_tasks) * 0.05,  # Rough estimate
            'framework_optimized': framework is not None
        }

        return FolderAnalysisResult(
            folder_path=folder_path,
            framework_detected=framework,
            total_files_found=structural_info['total_files'],
            files_screened=len(screening_results),
            files_selected=sum(len(task.file_group) for task in documentation_tasks),
            screening_results=screening_results,
            documentation_tasks=documentation_tasks,
            resource_plan=resource_plan
        )

    def _create_documentation_tasks(self, high_value_files: List[FileScreeningResult],
                                   medium_value_files: List[FileScreeningResult],
                                   framework: Optional[str]) -> List[DocumentationTask]:
        """Create individual documentation tasks for each file (no grouping)"""
        tasks = []
        task_counter = 1

        # Process all files individually
        all_files = high_value_files + medium_value_files
        used_filenames = set()  # Track used filenames to prevent duplicates

        for file_result in all_files:
            # Determine task properties for individual file
            task_name, target_filename, section, priority = self._determine_individual_task_properties(
                file_result, framework, used_filenames
            )

            # Add to used filenames
            used_filenames.add(target_filename)

            # Suggest Mintlify components based on file type
            mintlify_components = self._suggest_mintlify_components(file_result.file_type, file_result.framework_category)

            task = DocumentationTask(
                task_id=f"task_{task_counter:03d}",
                task_name=task_name,
                description=f"Create Mintlify MDX documentation for {file_result.relative_path}",
                target_filename=target_filename,
                section=section,
                file_group=[file_result],  # Single file per task
                priority=priority,
                estimated_complexity=file_result.complexity,
                mintlify_components=mintlify_components
            )

            tasks.append(task)
            task_counter += 1

        return tasks

    def _determine_individual_task_properties(self, file_result: FileScreeningResult,
                                            framework: Optional[str], used_filenames: set) -> Tuple[str, str, str, int]:
        """Determine task properties for individual file"""

        # Extract file info
        relative_path = file_result.relative_path
        file_type = file_result.file_type
        category = file_result.framework_category or 'other'

        # Create clean filename for MDX
        # Convert path like "user/user-router.ts" to "user-router"
        path_parts = relative_path.replace('\\', '/').split('/')
        filename_base = path_parts[-1]  # Get the actual filename
        clean_name = filename_base.split('.')[0]  # Remove extension

        # Include parent directory if filename is too generic to avoid conflicts
        if clean_name in ['route', 'page', 'index', 'main', 'app'] and len(path_parts) > 1:
            parent_dir = path_parts[-2]  # Get parent directory
            clean_name = f"{parent_dir}-{clean_name}"

        # Create descriptive task name
        task_name = f"{clean_name.replace('-', ' ').replace('_', ' ').title()}"

        # Determine target filename and section based on file type
        if file_type == 'api_route' or 'router' in filename_base.lower():
            base_target = f"api/{clean_name}.mdx"
            section = "api-reference"
            priority = 9
        elif file_type == 'component':
            base_target = f"components/{clean_name}.mdx"
            section = "components"
            priority = 8
        elif file_type == 'model':
            base_target = f"models/{clean_name}.mdx"
            section = "architecture"
            priority = 8
        elif file_type == 'config':
            base_target = f"configuration/{clean_name}.mdx"
            section = "configuration"
            priority = 7
        elif file_type == 'utility':
            base_target = f"utilities/{clean_name}.mdx"
            section = "reference"
            priority = 6
        elif file_type == 'test':
            base_target = f"testing/{clean_name}.mdx"
            section = "guides"
            priority = 4
        else:
            base_target = f"general/{clean_name}.mdx"
            section = "reference"
            priority = 5

        # Ensure unique filename by adding counter if needed
        target_filename = base_target
        counter = 1
        while target_filename in used_filenames:
            name_part, ext = os.path.splitext(base_target)
            target_filename = f"{name_part}-{counter}{ext}"
            counter += 1

        return task_name, target_filename, section, priority

    def _determine_task_properties(self, category: str, file_type: str, files: List[FileScreeningResult],
                                 framework: Optional[str]) -> Tuple[str, str, str, int]:
        """Determine task name, filename, section, and priority"""

        # Create descriptive task name
        if len(files) == 1:
            task_name = f"{category.title()} {file_type.replace('_', ' ').title()}"
        else:
            task_name = f"{category.title()} {file_type.replace('_', ' ').title()} ({len(files)} files)"

        # Determine target filename
        safe_category = category.replace('_', '-').lower()
        safe_type = file_type.replace('_', '-').lower()

        if category == 'routes' or file_type == 'api_route':
            target_filename = f"api/{safe_category}-{safe_type}.mdx"
            section = "api-reference"
            priority = 9
        elif file_type == 'component':
            target_filename = f"components/{safe_category}-{safe_type}.mdx"
            section = "components"
            priority = 8
        elif file_type == 'model':
            target_filename = f"models/{safe_category}-{safe_type}.mdx"
            section = "architecture"
            priority = 8
        elif file_type == 'config':
            target_filename = f"configuration/{safe_category}-{safe_type}.mdx"
            section = "configuration"
            priority = 7
        elif file_type == 'utility':
            target_filename = f"utilities/{safe_category}-{safe_type}.mdx"
            section = "reference"
            priority = 6
        elif file_type == 'test':
            target_filename = f"testing/{safe_category}-{safe_type}.mdx"
            section = "guides"
            priority = 4
        else:
            target_filename = f"general/{safe_category}-{safe_type}.mdx"
            section = "reference"
            priority = 5

        return task_name, target_filename, section, priority

    def _suggest_mintlify_components(self, file_type: str, category: str) -> List[str]:
        """Suggest appropriate Mintlify components based on file type"""
        base_components = ["Note", "Tip", "Warning"]

        if file_type == 'api_route' or category == 'routes':
            return base_components + ["ParamField", "ResponseField", "CodeGroup", "Steps"]
        elif file_type == 'component':
            return base_components + ["Tabs", "CodeGroup", "Cards"]
        elif file_type == 'config':
            return base_components + ["Steps", "CodeGroup", "Accordion"]
        elif file_type == 'utility':
            return base_components + ["CodeGroup", "Accordion"]
        elif file_type == 'test':
            return base_components + ["Steps", "CodeGroup"]
        else:
            return base_components + ["CodeGroup"]

    def _calculate_average_complexity(self, files: List[FileScreeningResult]) -> str:
        """Calculate average complexity of a group of files"""
        complexity_scores = {'low': 1, 'medium': 2, 'high': 3}
        total_score = sum(complexity_scores.get(f.complexity, 2) for f in files)
        avg_score = total_score / len(files)

        if avg_score <= 1.3:
            return 'low'
        elif avg_score <= 2.3:
            return 'medium'
        else:
            return 'high'

    def _screening_result_to_dict(self, sr: FileScreeningResult) -> Dict:
        """Convert FileScreeningResult to dictionary for JSON serialization"""
        return {
            'file_path': sr.file_path,
            'relative_path': sr.relative_path,
            'summary': sr.summary,
            'documentation_score': sr.documentation_score,
            'file_type': sr.file_type,
            'complexity': sr.complexity,
            'dependencies': sr.dependencies,
            'estimated_doc_value': sr.estimated_doc_value,
            'skip_reason': sr.skip_reason,
            'framework_category': sr.framework_category
        }

    def _task_to_dict(self, task: DocumentationTask) -> Dict:
        """Convert DocumentationTask to dictionary for JSON serialization"""
        return {
            'task_id': task.task_id,
            'task_name': task.task_name,
            'description': task.description,
            'target_filename': task.target_filename,
            'section': task.section,
            'file_group': [self._screening_result_to_dict(sr) for sr in task.file_group],
            'priority': task.priority,
            'estimated_complexity': task.estimated_complexity,
            'mintlify_components': task.mintlify_components
        }

class IntelligentTaskPlanner(processor.Processor):
    """
    Creates detailed execution plans from folder analysis results.
    Generates human-readable task plans and optimizes for parallel execution.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.base_url = base_url

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"
            elif provider.lower() == "custom":
                model_name = "gpt-4o"
            else:
                model_name = "gemini-2.5-pro"  # Use smart model for planning

        model_kwargs = {
            "api_key": api_key,
            "model_name": model_name,
            "provider": provider,
            "temperature": 0.7
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.genai_model = create_model_instance(**model_kwargs)

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Generate detailed execution plan from folder analysis"""
        async for part in content:
            if part.mimetype == "application/json; type=FolderAnalysisResult":
                # Get analysis result from metadata or parse JSON
                analysis_result = part.get_metadata("folder_analysis_result")
                if analysis_result is None:
                    analysis_data = json.loads(part.text)
                    # Reconstruct the analysis result from JSON
                    analysis_result = self._reconstruct_analysis_result(analysis_data)

                logger.info(f"📋 Creating execution plan for {len(analysis_result.documentation_tasks)} tasks")

                # Generate detailed execution plan
                execution_plan = await self._create_execution_plan(analysis_result)

                # Yield the execution plan
                plan_json = json.dumps({
                    'folder_path': analysis_result.folder_path,
                    'total_tasks': len(analysis_result.documentation_tasks),
                    'execution_plan': execution_plan,
                    'resource_summary': analysis_result.resource_plan,
                    'tasks': [self._task_to_dict(task) for task in analysis_result.documentation_tasks]
                })

                plan_part = content_api.ProcessorPart(
                    plan_json,
                    mimetype="application/json; type=ExecutionPlan",
                    metadata={
                        "execution_plan": execution_plan,
                        "analysis_result": analysis_result
                    }
                )
                yield plan_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"📋 Execution plan created: {len(analysis_result.documentation_tasks)} parallel tasks ready",
                    substream_name="status"
                )
                yield status_part

                # Also pass through the original analysis result
                yield part
            else:
                yield part

    async def _create_execution_plan(self, analysis_result: FolderAnalysisResult) -> Dict[str, Any]:
        """Create a detailed execution plan with human-readable task descriptions"""

        # Generate human-readable task descriptions using LLM
        task_descriptions = await self._generate_task_descriptions(analysis_result)

        # Create execution phases
        phases = self._organize_tasks_into_phases(analysis_result.documentation_tasks)

        # Calculate resource requirements
        resource_requirements = self._calculate_resource_requirements(analysis_result)

        # Generate execution timeline
        timeline = self._estimate_execution_timeline(analysis_result.documentation_tasks)

        execution_plan = {
            'plan_overview': {
                'folder_path': analysis_result.folder_path,
                'framework_detected': analysis_result.framework_detected,
                'total_files_analyzed': analysis_result.total_files_found,
                'files_selected_for_documentation': analysis_result.files_selected,
                'documentation_tasks_created': len(analysis_result.documentation_tasks)
            },
            'task_descriptions': task_descriptions,
            'execution_phases': phases,
            'resource_requirements': resource_requirements,
            'estimated_timeline': timeline,
            'parallel_execution_strategy': {
                'max_concurrent_tasks': min(len(analysis_result.documentation_tasks), 20),
                'batching_strategy': 'priority_based',
                'resource_optimization': 'enabled'
            }
        }

        return execution_plan

    async def _generate_task_descriptions(self, analysis_result: FolderAnalysisResult) -> List[str]:
        """Generate human-readable task descriptions like the user's example"""

        # Create context for the LLM
        folder_context = f"Folder: {analysis_result.folder_path}"
        framework_context = f"Framework: {analysis_result.framework_detected or 'Generic'}"

        tasks_summary = []
        for task in analysis_result.documentation_tasks:
            file_list = [f.relative_path for f in task.file_group]
            tasks_summary.append({
                'task_name': task.task_name,
                'target_file': task.target_filename,
                'files_included': file_list[:5],  # Limit for prompt size
                'file_count': len(task.file_group),
                'category': task.section
            })

        prompt = f"""
Create a human-readable task execution plan for Mintlify documentation generation.

{folder_context}
{framework_context}

Tasks to be executed:
{json.dumps(tasks_summary, indent=2)}

Generate a task list in this format (like a project plan):
[ ] Examine all route files to understand overall structure/overview
[ ] Create Mintlify MDX documentation for all-access routes
[ ] Create Mintlify MDX documentation for beats routes
[ ] Create Mintlify MDX documentation for chain routes
[ ] Create Mintlify MDX documentation for claim routes
[ ] Create Mintlify MDX documentation for distribution routes
[ ] Create Mintlify MDX documentation for exchange routes
[ ] Create Mintlify MDX documentation for healthcheck routes
[ ] Create Mintlify MDX documentation for like routes
[ ] Create Mintlify MDX documentation for mint routes
[ ] Create Mintlify MDX documentation for mixtape routes
[ ] Create Mintlify MDX documentation for node routes
[ ] Create Mintlify MDX documentation for opensea routes
[ ] Create Mintlify MDX documentation for performance routes
[ ] Create Mintlify MDX documentation for rewards routes
[ ] Create Mintlify MDX documentation for self-service routes
[ ] Create Mintlify MDX documentation for song routes
[ ] Create Mintlify MDX documentation for song-plays routes
[ ] Create Mintlify MDX documentation for stage-urls routes
[ ] Create Mintlify MDX documentation for stream routes
[ ] Create Mintlify MDX documentation for track routes
[ ] Create Mintlify MDX documentation for user routes
[ ] Create Mintlify MDX documentation for userPlaylist routes

Make each task description clear and specific. Start with an overview task if appropriate.
Return ONLY the task list, one task per line, each starting with "[ ]":
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Parse the response into individual task descriptions
        task_descriptions = []
        for line in response_text.strip().split('\n'):
            line = line.strip()
            if line.startswith('[ ]'):
                task_descriptions.append(line[3:].strip())  # Remove "[ ]" prefix

        return task_descriptions

    def _organize_tasks_into_phases(self, tasks: List[DocumentationTask]) -> List[Dict[str, Any]]:
        """Organize tasks into execution phases based on priority and dependencies"""

        # Sort tasks by priority (highest first)
        sorted_tasks = sorted(tasks, key=lambda x: x.priority, reverse=True)

        phases = []

        # Phase 1: High priority tasks (API routes, core components)
        high_priority_tasks = [t for t in sorted_tasks if t.priority >= 8]
        if high_priority_tasks:
            phases.append({
                'phase_name': 'Phase 1: Core Documentation',
                'description': 'Generate documentation for core API routes and main components',
                'tasks': [t.task_id for t in high_priority_tasks],
                'parallel_execution': True,
                'estimated_duration': '5-10 minutes'
            })

        # Phase 2: Medium priority tasks (utilities, configurations)
        medium_priority_tasks = [t for t in sorted_tasks if 5 <= t.priority < 8]
        if medium_priority_tasks:
            phases.append({
                'phase_name': 'Phase 2: Supporting Documentation',
                'description': 'Generate documentation for utilities, configurations, and supporting files',
                'tasks': [t.task_id for t in medium_priority_tasks],
                'parallel_execution': True,
                'estimated_duration': '3-7 minutes'
            })

        # Phase 3: Low priority tasks (tests, examples)
        low_priority_tasks = [t for t in sorted_tasks if t.priority < 5]
        if low_priority_tasks:
            phases.append({
                'phase_name': 'Phase 3: Supplementary Documentation',
                'description': 'Generate documentation for tests, examples, and other supplementary files',
                'tasks': [t.task_id for t in low_priority_tasks],
                'parallel_execution': True,
                'estimated_duration': '2-5 minutes'
            })

        return phases

    def _calculate_resource_requirements(self, analysis_result: FolderAnalysisResult) -> Dict[str, Any]:
        """Calculate estimated resource requirements"""

        total_files = sum(len(task.file_group) for task in analysis_result.documentation_tasks)

        # Estimate token usage
        avg_tokens_per_file = 2000  # Conservative estimate
        screening_tokens = analysis_result.files_screened * 500  # Cheaper model
        documentation_tokens = total_files * avg_tokens_per_file  # Expensive model

        # Estimate costs (rough approximations)
        screening_cost = screening_tokens * 0.000001  # Very cheap
        documentation_cost = documentation_tokens * 0.00001  # More expensive

        return {
            'parallel_agents_required': min(len(analysis_result.documentation_tasks), 20),
            'total_files_to_process': total_files,
            'estimated_tokens': {
                'screening_phase': screening_tokens,
                'documentation_phase': documentation_tokens,
                'total': screening_tokens + documentation_tokens
            },
            'estimated_cost_usd': {
                'screening_phase': round(screening_cost, 4),
                'documentation_phase': round(documentation_cost, 4),
                'total': round(screening_cost + documentation_cost, 4)
            },
            'memory_requirements': 'Medium (parallel processing)',
            'network_requirements': 'High (multiple API calls)'
        }

    def _estimate_execution_timeline(self, tasks: List[DocumentationTask]) -> Dict[str, Any]:
        """Estimate execution timeline"""

        # Base time estimates per complexity level
        complexity_times = {
            'low': 30,      # 30 seconds
            'medium': 60,   # 1 minute
            'high': 120     # 2 minutes
        }

        # Calculate sequential time (if run one by one)
        sequential_time = sum(complexity_times.get(task.estimated_complexity, 60) for task in tasks)

        # Calculate parallel time (assuming max 20 parallel agents)
        max_parallel = min(len(tasks), 20)
        if max_parallel > 0:
            # Group tasks into batches
            batches = (len(tasks) + max_parallel - 1) // max_parallel
            avg_batch_time = sequential_time / batches if batches > 0 else 0
            parallel_time = avg_batch_time + (30 * batches)  # Add overhead per batch
        else:
            parallel_time = 0

        return {
            'sequential_execution_time_seconds': sequential_time,
            'parallel_execution_time_seconds': int(parallel_time),
            'time_savings_seconds': sequential_time - parallel_time,
            'time_savings_percentage': round(((sequential_time - parallel_time) / sequential_time * 100), 1) if sequential_time > 0 else 0,
            'estimated_completion_time': f"{int(parallel_time // 60)}m {int(parallel_time % 60)}s",
            'phases': [
                {
                    'phase': 'Folder Analysis',
                    'estimated_time': '30-60 seconds'
                },
                {
                    'phase': 'Parallel Documentation Generation',
                    'estimated_time': f"{int(parallel_time // 60)}m {int(parallel_time % 60)}s"
                },
                {
                    'phase': 'Result Aggregation & Validation',
                    'estimated_time': '30-90 seconds'
                }
            ]
        }

    def _reconstruct_analysis_result(self, analysis_data: Dict) -> FolderAnalysisResult:
        """Reconstruct FolderAnalysisResult from JSON data"""

        # Reconstruct screening results
        screening_results = []
        for sr_data in analysis_data.get('screening_results', []):
            screening_results.append(FileScreeningResult(
                file_path=sr_data['file_path'],
                relative_path=sr_data['relative_path'],
                summary=sr_data['summary'],
                documentation_score=sr_data['documentation_score'],
                file_type=sr_data['file_type'],
                complexity=sr_data['complexity'],
                dependencies=sr_data['dependencies'],
                estimated_doc_value=sr_data['estimated_doc_value'],
                skip_reason=sr_data.get('skip_reason'),
                framework_category=sr_data.get('framework_category')
            ))

        # Reconstruct documentation tasks
        documentation_tasks = []
        for task_data in analysis_data.get('documentation_tasks', []):
            # Reconstruct file group
            file_group = []
            for fg_data in task_data['file_group']:
                file_group.append(FileScreeningResult(
                    file_path=fg_data['file_path'],
                    relative_path=fg_data['relative_path'],
                    summary=fg_data['summary'],
                    documentation_score=fg_data['documentation_score'],
                    file_type=fg_data['file_type'],
                    complexity=fg_data['complexity'],
                    dependencies=fg_data['dependencies'],
                    estimated_doc_value=fg_data['estimated_doc_value'],
                    skip_reason=fg_data.get('skip_reason'),
                    framework_category=fg_data.get('framework_category')
                ))

            documentation_tasks.append(DocumentationTask(
                task_id=task_data['task_id'],
                task_name=task_data['task_name'],
                description=task_data['description'],
                target_filename=task_data['target_filename'],
                section=task_data['section'],
                file_group=file_group,
                priority=task_data['priority'],
                estimated_complexity=task_data['estimated_complexity'],
                mintlify_components=task_data['mintlify_components']
            ))

        return FolderAnalysisResult(
            folder_path=analysis_data['folder_path'],
            framework_detected=analysis_data.get('framework_detected'),
            total_files_found=analysis_data['total_files_found'],
            files_screened=analysis_data['files_screened'],
            files_selected=analysis_data['files_selected'],
            screening_results=screening_results,
            documentation_tasks=documentation_tasks,
            resource_plan=analysis_data.get('resource_plan', {})
        )

    def _task_to_dict(self, task: DocumentationTask) -> Dict:
        """Convert DocumentationTask to dictionary for JSON serialization"""
        return {
            'task_id': task.task_id,
            'task_name': task.task_name,
            'description': task.description,
            'target_filename': task.target_filename,
            'section': task.section,
            'file_group': [self._screening_result_to_dict(sr) for sr in task.file_group],
            'priority': task.priority,
            'estimated_complexity': task.estimated_complexity,
            'mintlify_components': task.mintlify_components
        }

    def _screening_result_to_dict(self, sr: FileScreeningResult) -> Dict:
        """Convert FileScreeningResult to dictionary for JSON serialization"""
        return {
            'file_path': sr.file_path,
            'relative_path': sr.relative_path,
            'summary': sr.summary,
            'documentation_score': sr.documentation_score,
            'file_type': sr.file_type,
            'complexity': sr.complexity,
            'dependencies': sr.dependencies,
            'estimated_doc_value': sr.estimated_doc_value,
            'skip_reason': sr.skip_reason,
            'framework_category': sr.framework_category
        }

class MintlifySubAgent(processor.PartProcessor):
    """
    Individual sub-agent that processes a single documentation task.
    Each sub-agent handles one DocumentationTask independently.
    """

    def __init__(self, api_key: str, rag_instance: Optional[Any] = None,
                 provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.rag = rag_instance
        self.provider = provider

        # Set default model based on provider (use smart model for documentation)
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"
            elif provider.lower() == "custom":
                model_name = "gpt-4o"
            else:
                model_name = "gemini-2.5-pro"

        model_kwargs = {
            "api_key": api_key,
            "model_name": model_name,
            "provider": provider,
            "temperature": 0.7
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.genai_model = create_model_instance(**model_kwargs)

    def match(self, part: content_api.ProcessorPart) -> bool:
        """Only process DocumentationTask parts"""
        return part.mimetype == "application/json; type=DocumentationTask"

    async def call(self, content: content_api.ProcessorPart) -> AsyncIterable[content_api.ProcessorPart]:
        """Process a single documentation task"""
        if self.match(content):
            start_time = time.time()

            # Get task from metadata or parse JSON
            task_data = content.get_metadata("documentation_task")
            if task_data is None:
                task_data = json.loads(content.text)

            # Reconstruct DocumentationTask if needed
            if isinstance(task_data, dict):
                task = self._reconstruct_task_from_dict(task_data)
            else:
                task = task_data

            logger.info(f"🔧 SubAgent processing: {task.task_name} -> {task.target_filename}")

            # Debug: Check if target_filename is empty
            if not task.target_filename:
                logger.error(f"❌ Task has empty target_filename! Task: {task.task_id}, Name: {task.task_name}")
                logger.error(f"   Task dict: {task.__dict__ if hasattr(task, '__dict__') else 'no __dict__'}")
            else:
                logger.info(f"✅ Task has target_filename: '{task.target_filename}'")

            # Yield status update
            status_part = content_api.ProcessorPart(
                f"🔧 Starting: {task.task_name}",
                substream_name="status"
            )
            yield status_part

            # Generate documentation
            try:
                result = await self._generate_documentation(task)
                result.generation_time = time.time() - start_time

                # Yield the result
                result_json = json.dumps({
                    'task_id': task.task_id,
                    'task_name': task.task_name,
                    'target_filename': task.target_filename,  # This should work, but let's debug
                    'mdx_content': result.mdx_content,
                    'sources': result.sources,
                    'confidence': result.confidence,
                    'generation_time': result.generation_time,
                    'tokens_used': result.tokens_used
                })

                # Debug: Check what we're actually serializing
                logger.info(f"🔍 Serializing result for task: {task.task_name}")
                logger.info(f"   task.target_filename: '{task.target_filename}'")
                logger.info(f"   task.task_id: '{task.task_id}'")
                logger.info(f"   task.task_name: '{task.task_name}'")

                result_part = content_api.ProcessorPart(
                    result_json,
                    mimetype="application/json; type=DocumentationResult",
                    metadata={"documentation_result": result}
                )
                yield result_part

                # Yield completion status
                completion_part = content_api.ProcessorPart(
                    f"✅ Completed: {task.task_name} ({result.generation_time:.1f}s)",
                    substream_name="status"
                )
                yield completion_part

            except Exception as e:
                logger.error(f"❌ Error processing task {task.task_name}: {e}")
                error_part = content_api.ProcessorPart(
                    f"❌ Failed: {task.task_name} - {str(e)}",
                    substream_name="error"
                )
                yield error_part
        else:
            # Pass through non-matching parts
            yield content

    async def _generate_documentation(self, task: DocumentationTask) -> DocumentationResult:
        """Generate MDX documentation for a task"""

        # Collect content from all files in the task
        all_content = []
        sources = []

        for file_result in task.file_group:
            try:
                # Read file content
                with open(file_result.file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    file_content = f.read()

                # Add file content with clear separation
                file_section = f"""
=== FILE: {file_result.relative_path} ===
Summary: {file_result.summary}
Type: {file_result.file_type}
Complexity: {file_result.complexity}

{file_content}

=== END FILE: {file_result.relative_path} ===
"""
                all_content.append(file_section)
                sources.append(file_result.relative_path)

            except Exception as e:
                logger.warning(f"Could not read file {file_result.relative_path}: {e}")
                continue

        # Use RAG for additional context only if we have limited file content
        # Priority: Full file content > RAG context
        if self.rag and len(all_content) < 3:  # Only use RAG if we have very few files
            try:
                logger.info(f"🔍 Using RAG for additional context (only {len(all_content)} files in task)")
                # Generate RAG queries based on task
                rag_queries = self._generate_rag_queries(task)

                for query in rag_queries[:2]:  # Limit to 2 queries
                    retrieved_docs = self.rag.call(query)
                    if retrieved_docs and len(retrieved_docs) > 0:
                        if hasattr(retrieved_docs[0], 'documents'):
                            docs = retrieved_docs[0].documents
                            for doc in docs[:3]:  # Limit to 3 docs per query to avoid overwhelming
                                if hasattr(doc, 'text') and hasattr(doc, 'meta_data'):
                                    file_path = doc.meta_data.get('file_path', 'unknown')
                                    if file_path not in sources:  # Avoid duplicates
                                        rag_content = f"=== RAG CONTEXT: {file_path} ===\n{doc.text}\n=== END RAG CONTEXT ===\n"
                                        all_content.append(rag_content)
                                        sources.append(f"RAG:{file_path}")
            except Exception as e:
                logger.warning(f"RAG query failed for task {task.task_name}: {e}")
        else:
            logger.info(f"📄 Using full file content for documentation ({len(all_content)} files) - skipping RAG")

        # Generate MDX content
        if all_content:
            mdx_content = await self._synthesize_mdx_content(task, all_content)
            confidence = min(0.95, len(all_content) / 10.0)  # Higher confidence with more content
        else:
            # Fallback: generate basic template
            mdx_content = await self._generate_basic_template(task)
            confidence = 0.3

        return DocumentationResult(
            task=task,
            mdx_content=mdx_content,
            sources=sources,
            confidence=confidence,
            generation_time=0.0,  # Will be set by caller
            tokens_used=len(mdx_content.split()) * 1.3  # Rough estimate
        )

    def _generate_rag_queries(self, task: DocumentationTask) -> List[str]:
        """Generate RAG queries based on the task"""
        queries = []

        # Add task-specific queries
        queries.append(task.description)

        # Add queries based on file types in the task
        file_types = set(f.file_type for f in task.file_group)
        for file_type in file_types:
            if file_type == 'api_route':
                queries.extend([
                    "API endpoints routes handlers",
                    "authentication authorization middleware"
                ])
            elif file_type == 'component':
                queries.extend([
                    "React components UI elements",
                    "component props interfaces"
                ])
            elif file_type == 'model':
                queries.extend([
                    "data models schemas database",
                    "model relationships validation"
                ])
            elif file_type == 'utility':
                queries.extend([
                    "utility functions helpers",
                    "common shared functions"
                ])

        return queries[:3]  # Limit to 3 queries

    async def _synthesize_mdx_content(self, task: DocumentationTask, content_pieces: List[str]) -> str:
        """Synthesize content into properly formatted Mintlify MDX"""

        combined_content = "\n\n".join(content_pieces)

        # Log content size for debugging
        logger.info(f"📊 Content size for {task.task_name}: {len(combined_content):,} characters ({len(content_pieces)} files)")

        # Load Mintlify writing rules (simplified version)
        writing_rules = self._get_mintlify_writing_rules()

        prompt = f"""
{writing_rules}

Based on the following code and documentation content, create a comprehensive Mintlify MDX page for: {task.task_name}

Target filename: {task.target_filename}
Section: {task.section}
Description: {task.description}
Suggested Mintlify Components: {', '.join(task.mintlify_components)}

Available Content:
{combined_content}  # Use full content for individual files

Create a complete MDX page that:

1. STARTS with proper YAML frontmatter (NO code fences around it):
---
title: "Clear, specific title"
description: "Concise description explaining page purpose"
---

2. FOLLOWS ALL MINTLIFY TECHNICAL WRITING RULES from above
3. ONLY uses information found in the provided content
4. Includes specific file references and examples from actual code
5. Organizes content logically with proper markdown structure
6. Uses appropriate Mintlify components for the content type

CRITICAL FORMATTING RULES:
- DO NOT wrap your response in markdown code fences (```)
- DO NOT start with ```yaml or ```mdx
- START IMMEDIATELY with the frontmatter: ---
- The file should begin directly with --- (three dashes)

Generate the complete MDX page ONLY:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Clean up the response
        cleaned_response = response_text.strip()

        # Remove leading/trailing code fences if present
        if cleaned_response.startswith('```'):
            lines = cleaned_response.split('\n')
            if lines[0].strip() in ['```', '```yaml', '```mdx']:
                lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned_response = '\n'.join(lines)

        return cleaned_response

    async def _generate_basic_template(self, task: DocumentationTask) -> str:
        """Generate a basic template when no content is available"""

        prompt = f"""
Create a basic Mintlify MDX template for: {task.task_name}

Target filename: {task.target_filename}
Section: {task.section}
Description: {task.description}
Suggested Components: {', '.join(task.mintlify_components)}

Create a well-structured template that:
1. Starts with proper frontmatter
2. Includes placeholder sections
3. Uses appropriate Mintlify components
4. Provides realistic examples

CRITICAL: Start directly with --- (frontmatter), no code fences.

Generate the template:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        return response_text.strip()

    def _get_mintlify_writing_rules(self) -> str:
        """Get simplified Mintlify writing rules"""
        return """
# Mintlify Technical Writing Rules

## CRITICAL MDX SYNTAX RULES
- NEVER use <CodeGroup> for single code blocks - use regular ```language blocks instead
- ONLY use <CodeGroup> when showing the SAME concept in multiple programming languages (minimum 2)
- All Mintlify components must be properly closed (e.g., <Note>...</Note>)
- Always use <AccordionGroup> wrapper with individual <Accordion> items
- Use code blocks for Mermaid diagrams: ```mermaid, not <mermaid> tags

## Component Usage
- <Steps> for procedures and sequential instructions
- <Note>, <Tip>, <Warning> for important information
- <ParamField> for API parameters
- <Tabs> for platform-specific content
- <CodeGroup> ONLY for multi-language examples
"""

    def _reconstruct_task_from_dict(self, task_data: Dict) -> DocumentationTask:
        """Reconstruct DocumentationTask from dictionary"""

        # Reconstruct file group
        file_group = []
        for fg_data in task_data.get('file_group', []):
            file_group.append(FileScreeningResult(
                file_path=fg_data['file_path'],
                relative_path=fg_data['relative_path'],
                summary=fg_data['summary'],
                documentation_score=fg_data['documentation_score'],
                file_type=fg_data['file_type'],
                complexity=fg_data['complexity'],
                dependencies=fg_data['dependencies'],
                estimated_doc_value=fg_data['estimated_doc_value'],
                skip_reason=fg_data.get('skip_reason'),
                framework_category=fg_data.get('framework_category')
            ))

        return DocumentationTask(
            task_id=task_data['task_id'],
            task_name=task_data['task_name'],
            description=task_data['description'],
            target_filename=task_data['target_filename'],
            section=task_data['section'],
            file_group=file_group,
            priority=task_data['priority'],
            estimated_complexity=task_data['estimated_complexity'],
            mintlify_components=task_data['mintlify_components']
        )

class ParallelTaskExecutor(processor.Processor):
    """
    Manages the parallel execution of documentation tasks using multiple sub-agents.
    Distributes tasks efficiently and collects results.
    """

    def __init__(self, api_key: str, rag_instance: Optional[Any] = None,
                 provider: str = "google", model_name: str = None, base_url: str = None,
                 max_parallel_agents: int = 20):
        self.api_key = api_key
        self.rag = rag_instance
        self.provider = provider
        self.model_name = model_name
        self.base_url = base_url
        self.max_parallel_agents = max_parallel_agents

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute documentation tasks in parallel using sub-agents"""

        # Collect execution plan and tasks
        execution_plan = None
        analysis_result = None

        async for part in content:
            if part.mimetype == "application/json; type=ExecutionPlan":
                execution_plan = part.get_metadata("execution_plan")
                analysis_result = part.get_metadata("analysis_result")

                if execution_plan is None:
                    plan_data = json.loads(part.text)
                    execution_plan = plan_data

                logger.info(f"🚀 Starting parallel execution of {len(analysis_result.documentation_tasks)} tasks")

                # Execute tasks in parallel
                async for result in self._execute_tasks_parallel(analysis_result.documentation_tasks):
                    yield result

                # Yield completion status
                completion_part = content_api.ProcessorPart(
                    f"🎉 Parallel execution complete: {len(analysis_result.documentation_tasks)} tasks processed",
                    substream_name="status"
                )
                yield completion_part

                # Pass through the original execution plan
                yield part

            elif part.substream_name == "status":
                # Pass through status updates
                yield part
            else:
                # Pass through other parts
                yield part

    async def _execute_tasks_parallel(self, tasks: List[DocumentationTask]):
        """Execute all tasks in batches using sub-agents"""

        total_tasks = len(tasks)
        max_parallel = min(self.max_parallel_agents, 20)  # Safety limit

        # Calculate batches
        batches = []
        for i in range(0, total_tasks, max_parallel):
            batch = tasks[i:i + max_parallel]
            batches.append(batch)

        logger.info(f"📦 Processing {total_tasks} tasks in {len(batches)} batches (max {max_parallel} parallel per batch)")

        # Process each batch
        for batch_num, batch_tasks in enumerate(batches, 1):
            logger.info(f"🔄 Processing batch {batch_num}/{len(batches)}: {len(batch_tasks)} tasks")

            # Create sub-agent streams for this batch
            sub_agent_streams = []

            for task in batch_tasks:
                # Create a sub-agent for this task
                sub_agent = MintlifySubAgent(
                    self.api_key,
                    self.rag,
                    self.provider,
                    self.model_name,
                    self.base_url
                )

                # Create task part
                task_json = json.dumps({
                    'task_id': task.task_id,
                    'task_name': task.task_name,
                    'description': task.description,
                    'target_filename': task.target_filename,
                    'section': task.section,
                    'file_group': [self._screening_result_to_dict(sr) for sr in task.file_group],
                    'priority': task.priority,
                    'estimated_complexity': task.estimated_complexity,
                    'mintlify_components': task.mintlify_components
                })

                task_part = content_api.ProcessorPart(
                    task_json,
                    mimetype="application/json; type=DocumentationTask",
                    metadata={"documentation_task": task}
                )

                # Create stream for this sub-agent
                async def create_sub_agent_stream(agent, part):
                    async for result_part in agent.call(part):
                        yield result_part

                sub_agent_streams.append(create_sub_agent_stream(sub_agent, task_part))

            # Process this batch in parallel
            if sub_agent_streams:
                logger.info(f"⚡ Executing batch {batch_num} with {len(sub_agent_streams)} parallel sub-agents")
                merged_stream = streams.merge(sub_agent_streams)

                async for part in merged_stream:
                    # Yield all parts from sub-agents
                    yield part

                logger.info(f"✅ Batch {batch_num}/{len(batches)} completed")
            else:
                logger.warning(f"❌ No sub-agent streams for batch {batch_num}")

        logger.info(f"🎉 All {len(batches)} batches completed! Total tasks processed: {total_tasks}")

    def _screening_result_to_dict(self, sr: FileScreeningResult) -> Dict:
        """Convert FileScreeningResult to dictionary for JSON serialization"""
        return {
            'file_path': sr.file_path,
            'relative_path': sr.relative_path,
            'summary': sr.summary,
            'documentation_score': sr.documentation_score,
            'file_type': sr.file_type,
            'complexity': sr.complexity,
            'dependencies': sr.dependencies,
            'estimated_doc_value': sr.estimated_doc_value,
            'skip_reason': sr.skip_reason,
            'framework_category': sr.framework_category
        }

class ResultAggregator(processor.Processor):
    """
    Collects parallel documentation results and creates the final documentation structure.
    Generates docs.json and organizes MDX files.
    """

    def __init__(self, output_dir: str = "./mintlify-docs"):
        self.output_dir = output_dir

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Collect all documentation results and create final structure"""

        documentation_results = []
        execution_plan = None

        async for part in content:
            if part.mimetype == "application/json; type=DocumentationResult":
                # ALWAYS use the JSON text, not the metadata object (which has empty values)
                result_data = json.loads(part.text)
                documentation_results.append(result_data)

                # IMPORTANT: Pass through DocumentationResult parts for MDXValidator
                yield part

            elif part.mimetype == "application/json; type=ExecutionPlan":
                execution_plan = part.get_metadata("execution_plan")
                if execution_plan is None:
                    execution_plan = json.loads(part.text)

            elif part.substream_name in ["status", "error"]:
                # Pass through status updates
                yield part
            else:
                # Pass through other parts
                yield part

        if documentation_results:
            logger.info(f"📋 Aggregating {len(documentation_results)} documentation results")

            # Create final documentation structure
            final_docs = await self._create_final_documentation(documentation_results, execution_plan)

            # Write files to disk
            await self._write_documentation_files(final_docs)

            # Yield final result
            final_json = json.dumps({
                'output_directory': self.output_dir,
                'total_files_generated': len(documentation_results),
                'documentation_structure': final_docs,
                'generation_summary': {
                    'total_tasks': len(documentation_results),
                    'avg_confidence': sum(r.get('confidence', 0) for r in documentation_results) / len(documentation_results),
                    'total_generation_time': sum(r.get('generation_time', 0) for r in documentation_results),
                    'total_tokens_used': sum(r.get('tokens_used', 0) for r in documentation_results)
                }
            })

            final_part = content_api.ProcessorPart(
                final_json,
                mimetype="application/json; type=FinalDocumentation",
                metadata={"final_documentation": final_docs}
            )
            yield final_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"🎉 Documentation generation complete! {len(documentation_results)} files created in {self.output_dir}",
                substream_name="status"
            )
            yield completion_part

    async def _create_final_documentation(self, results: List[Dict], execution_plan: Optional[Dict]) -> Dict[str, Any]:
        """Create the final documentation structure"""

        # Group results by section
        sections = {}
        for result in results:
            # Extract section from target filename
            target_file = result.get('target_filename', 'general/unknown.mdx')
            section_name = target_file.split('/')[0] if '/' in target_file else 'general'

            if section_name not in sections:
                sections[section_name] = {
                    'section_name': section_name.replace('-', ' ').title(),
                    'files': [],
                    'icon': self._get_section_icon(section_name)
                }

            sections[section_name]['files'].append({
                'filename': target_file,
                'title': result.get('task_name', 'Unknown'),
                'confidence': result.get('confidence', 0),
                'generation_time': result.get('generation_time', 0),
                'sources': result.get('sources', [])
            })

        # Generate docs.json
        docs_json = self._generate_docs_json(sections, execution_plan)

        return {
            'sections': sections,
            'docs_json': docs_json,
            'total_files': len(results),
            'output_directory': self.output_dir
        }

    def _get_section_icon(self, section_name: str) -> str:
        """Get appropriate icon for section"""
        icon_map = {
            'api': 'terminal',
            'components': 'puzzle',
            'models': 'database',
            'configuration': 'gear',
            'utilities': 'wrench',
            'testing': 'check',
            'general': 'file-text'
        }
        return icon_map.get(section_name, 'file-text')

    def _generate_docs_json(self, sections: Dict, execution_plan: Optional[Dict]) -> Dict[str, Any]:
        """Generate docs.json configuration"""

        # Build navigation groups
        navigation_groups = []
        for section_name, section_data in sections.items():
            pages = []
            for file_info in section_data['files']:
                # Remove .mdx extension for navigation
                page_path = file_info['filename'].replace('.mdx', '')
                pages.append(page_path)

            group = {
                'group': section_data['section_name'],
                'icon': section_data['icon'],
                'pages': pages
            }
            navigation_groups.append(group)

        # Determine project name from execution plan
        project_name = "Documentation"
        if execution_plan and 'plan_overview' in execution_plan:
            folder_path = execution_plan['plan_overview'].get('folder_path', '')
            if folder_path:
                project_name = os.path.basename(folder_path).title() + " Documentation"

        docs_json = {
            '$schema': 'https://mintlify.com/docs.json',
            'theme': 'mint',
            'name': project_name,
            'description': f'Comprehensive documentation generated by Mintlify Research Agent V2',
            'colors': {
                'primary': '#3B82F6',
                'light': '#F8FAFC',
                'dark': '#0F172A'
            },
            'navigation': {
                'groups': navigation_groups
            },
            'logo': {
                'light': '/logo-light.svg',
                'dark': '/logo-dark.svg'
            },
            'navbar': {
                'links': [
                    {
                        'label': 'GitHub',
                        'href': 'https://github.com/your-org/your-repo'
                    }
                ]
            }
        }

        return docs_json

    async def _write_documentation_files(self, final_docs: Dict[str, Any]):
        """Write all documentation files to disk"""

        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)

        # Accumulate docs.json instead of overwriting
        docs_json_path = os.path.join(self.output_dir, 'docs.json')

        # Load existing docs.json if it exists
        if os.path.exists(docs_json_path):
            try:
                with open(docs_json_path, 'r', encoding='utf-8') as f:
                    existing_docs = json.load(f)

                # Handle different navigation structures
                new_docs = final_docs['docs_json']

                # Ensure both have the correct structure
                if 'navigation' not in existing_docs:
                    existing_docs['navigation'] = {"groups": []}
                if 'groups' not in existing_docs['navigation']:
                    existing_docs['navigation'] = {"groups": existing_docs['navigation']}

                if 'navigation' not in new_docs:
                    new_docs['navigation'] = {"groups": []}
                if 'groups' not in new_docs['navigation']:
                    new_docs['navigation'] = {"groups": new_docs['navigation']}

                # Merge navigation groups
                existing_docs['navigation']['groups'].extend(new_docs['navigation']['groups'])
                final_docs_json = existing_docs

            except Exception as e:
                logger.warning(f"Failed to load existing docs.json: {e}, creating new one")
                final_docs_json = final_docs['docs_json']
        else:
            final_docs_json = final_docs['docs_json']

        # Write updated docs.json
        with open(docs_json_path, 'w', encoding='utf-8') as f:
            json.dump(final_docs_json, f, indent=2, ensure_ascii=False)

        logger.info(f"✅ Written docs.json to {docs_json_path}")

        # Note: MDX files are written by the validator, so we don't write them here
        # This aggregator focuses on creating the overall structure and docs.json

class MDXValidator(processor.Processor):
    """
    Validates and fixes MDX content using @mdx-js/mdx compile function.
    Writes final MDX files to disk after validation.
    """

    def __init__(self, api_key: str, output_dir: str = "./mintlify-docs",
                 provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.output_dir = output_dir
        self.provider = provider

        # Set default model for fixing (use smart model)
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"
            elif provider.lower() == "custom":
                model_name = "gpt-4o"
            else:
                model_name = "gemini-2.5-pro"

        model_kwargs = {
            "api_key": api_key,
            "model_name": model_name,
            "provider": provider,
            "temperature": 0.1  # Low temperature for precise fixes
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.genai_model = create_model_instance(**model_kwargs)

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Validate and fix all MDX files, then write to disk"""

        documentation_results = []

        # Collect all documentation results
        async for part in content:
            if part.mimetype == "application/json; type=DocumentationResult":
                # ALWAYS use the JSON text, not the metadata object (which has empty values)
                result_data = json.loads(part.text)
                documentation_results.append(result_data)

            elif part.substream_name in ["status", "error"]:
                # Pass through status updates
                yield part
            else:
                # Pass through other parts
                yield part

        if documentation_results:
            logger.info(f"🔧 Validating and fixing {len(documentation_results)} MDX files")

            # Debug: Check what we actually received
            for i, result in enumerate(documentation_results):
                logger.info(f"Debug result {i}: type={type(result)}, keys={list(result.keys()) if isinstance(result, dict) else 'not dict'}")
                if isinstance(result, dict):
                    logger.info(f"  target_filename: '{result.get('target_filename', 'MISSING')}'")
                    logger.info(f"  mdx_content length: {len(result.get('mdx_content', ''))}")
                else:
                    logger.info(f"  Result is not a dict: {result}")

            # Write initial files for validation
            await self._write_initial_files(documentation_results)

            # Run validation and fixing loop
            fixed_results = await self._validate_and_fix_mdx_files(documentation_results)

            # Write final validated files
            await self._write_final_files(fixed_results)

            # Yield validation completion status
            validation_part = content_api.ProcessorPart(
                f"✅ MDX validation complete: {len(fixed_results)} files validated and written to {self.output_dir}",
                substream_name="status"
            )
            yield validation_part

    async def _write_initial_files(self, results: List[Dict]):
        """Write initial MDX files for validation"""
        os.makedirs(self.output_dir, exist_ok=True)

        for result in results:
            try:
                # Debug: log the result structure
                logger.debug(f"Processing result: {type(result)} with keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")

                target_filename = result.get('target_filename', 'unknown.mdx')
                mdx_content = result.get('mdx_content', '')

                # Additional validation
                if not target_filename or target_filename == 'unknown.mdx':
                    logger.warning(f"Invalid target_filename: '{target_filename}' for result: {result}")
                    continue

                if not mdx_content:
                    logger.warning(f"No MDX content found for {target_filename}")
                    continue

                file_path = os.path.join(self.output_dir, target_filename)

                # Create directory if needed
                dir_path = os.path.dirname(file_path)
                if dir_path and dir_path != self.output_dir:
                    os.makedirs(dir_path, exist_ok=True)

                # Write MDX file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(mdx_content)

                logger.info(f"📝 Written initial MDX file: {file_path}")

            except Exception as e:
                target_filename = result.get('target_filename', 'unknown') if isinstance(result, dict) else 'unknown'
                logger.error(f"❌ Failed to write {target_filename}: {e}")
                continue

    async def _validate_and_fix_mdx_files(self, results: List[Dict]) -> List[Dict]:
        """Validate MDX files and fix parsing errors iteratively"""
        max_iterations = 3
        iteration = 0

        current_results = results.copy()

        while iteration < max_iterations:
            iteration += 1
            logger.info(f"🔍 MDX validation iteration {iteration}/{max_iterations}")

            # Run MDX validation
            parsing_errors = await self._validate_mdx_with_compile()

            if not parsing_errors:
                logger.info("✅ No MDX parsing errors found! Validation complete.")
                break

            logger.info(f"Found {len(parsing_errors)} MDX parsing errors to fix")

            # Fix errors
            for error in parsing_errors:
                await self._fix_mdx_error(error, current_results)

            # Write updated files
            await self._write_updated_files(current_results)

        if iteration >= max_iterations:
            logger.warning(f"⚠️ Reached maximum iterations ({max_iterations}). Some MDX errors may remain.")

        return current_results

    async def _validate_mdx_with_compile(self) -> List[Dict]:
        """Validate MDX files using @mdx-js/mdx compile function"""
        try:
            # Create validation script
            validation_script = """
import { compile } from '@mdx-js/mdx';
import fs from 'fs';
import path from 'path';

async function validateMdxFiles(outputDir) {
    const errors = [];

    function findMdxFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...findMdxFiles(fullPath));
            } else if (item.endsWith('.mdx')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    const mdxFiles = findMdxFiles(outputDir);

    for (const filePath of mdxFiles) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            await compile(content);
        } catch (error) {
            const relativePath = path.relative(outputDir, filePath);

            let line = 1;
            let column = 1;
            let message = error.message || 'MDX compilation failed';

            const lineMatch = message.match(/line (\\d+)/i);
            const columnMatch = message.match(/column (\\d+)/i);

            if (lineMatch) line = parseInt(lineMatch[1]);
            if (columnMatch) column = parseInt(columnMatch[1]);

            errors.push({
                file: relativePath,
                line: line,
                column: column,
                message: message
            });
        }
    }

    return errors;
}

(async () => {
    try {
        const outputDir = process.argv[2];
        if (!outputDir) {
            console.error('Output directory not provided');
            process.exit(1);
        }

        const errors = await validateMdxFiles(outputDir);
        console.log(JSON.stringify(errors));
    } catch (error) {
        console.error('Validation script error:', error.message);
        process.exit(1);
    }
})();
"""

            # Write validation script to current directory (where node_modules exists)
            script_path = os.path.join(os.getcwd(), 'mdx_validator_temp.mjs')

            try:
                with open(script_path, 'w') as script_file:
                    script_file.write(validation_script)

                result = subprocess.run(
                    ['node', script_path, self.output_dir],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=os.getcwd()  # Ensure we run from the directory with node_modules
                )

                if result.returncode == 0:
                    try:
                        parsing_errors = json.loads(result.stdout)
                        logger.info(f"MDX validation completed: {len(parsing_errors)} errors found")
                        return parsing_errors
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse validation output: {result.stdout}")
                        return []
                else:
                    logger.error(f"Validation script failed: {result.stderr}")
                    return []

            finally:
                try:
                    if os.path.exists(script_path):
                        os.unlink(script_path)
                except Exception as e:
                    logger.debug(f"Failed to cleanup validation script: {e}")

        except Exception as e:
            logger.error(f"Error during MDX validation: {e}")
            return []

    async def _fix_mdx_error(self, error: Dict, results: List[Dict]):
        """Fix a specific MDX parsing error"""
        target_file = error['file']

        # Find the result for this file
        result_to_fix = None
        for result in results:
            result_filename = result.get('target_filename', '')
            # Try exact match first
            if result_filename == target_file:
                result_to_fix = result
                break
            # Try matching just the filename part
            elif os.path.basename(result_filename) == os.path.basename(target_file):
                result_to_fix = result
                break
            # Try matching without extension
            elif os.path.splitext(result_filename)[0] == os.path.splitext(target_file)[0]:
                result_to_fix = result
                break

        if not result_to_fix:
            logger.warning(f"Could not find result for file: {target_file}")
            logger.debug(f"Available files: {[r.get('target_filename', 'unknown') for r in results]}")

            # Check if the file actually exists on disk
            full_path = os.path.join(self.output_dir, target_file)
            if not os.path.exists(full_path):
                logger.debug(f"File {target_file} doesn't exist on disk, skipping error fix")
                return

            # If file exists but no result found, it might be from a previous run
            logger.warning(f"File exists but no result found - this might be from a previous folder processing")
            return

        logger.info(f"🔧 Fixing error in {target_file} at line {error['line']}: {error['message']}")

        # Fix the content using LLM
        current_content = result_to_fix.get('mdx_content', '')
        fixed_content = await self._fix_mdx_with_llm(current_content, error)

        # Update the result
        result_to_fix['mdx_content'] = fixed_content

    async def _fix_mdx_with_llm(self, mdx_content: str, error: Dict) -> str:
        """Fix MDX content using LLM based on specific error"""

        lines = mdx_content.split('\n')
        error_line_num = error['line'] - 1

        # Get context around the error
        start_line = max(0, error_line_num - 3)
        end_line = min(len(lines), error_line_num + 4)
        context_lines = lines[start_line:end_line]
        context = '\n'.join(f"{start_line + i + 1}: {line}" for i, line in enumerate(context_lines))

        prompt = f"""
Fix this specific MDX parsing error:

ERROR: {error['message']}
FILE: {error['file']}
LINE: {error['line']}
COLUMN: {error['column']}

CONTEXT (lines {start_line + 1}-{end_line}):
{context}

COMMON FIXES:
- "Unexpected closing slash / in tag" → Remove self-closing syntax like `<Component />`, use `<Component></Component>`
- "Expected a closing tag" → Add missing closing tag
- Invalid HTML tags → Replace with backticks: `<server_address>` → `server_address`
- Leading triple backticks → Remove any ```yaml or ```mdx at the start of the file
- File should start directly with --- (frontmatter), not with code fences

CRITICAL: Return ONLY the corrected full MDX content. Do NOT wrap your response in markdown code fences (```).

{mdx_content}
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Clean up the response
        cleaned_response = response_text.strip()

        if cleaned_response.startswith('```'):
            lines = cleaned_response.split('\n')
            if lines[0].strip().startswith('```'):
                lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned_response = '\n'.join(lines)

        return cleaned_response

    async def _write_updated_files(self, results: List[Dict]):
        """Write updated MDX files after fixing"""
        for result in results:
            target_filename = result.get('target_filename', 'unknown.mdx')
            mdx_content = result.get('mdx_content', '')

            file_path = os.path.join(self.output_dir, target_filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(mdx_content)

    async def _write_final_files(self, results: List[Dict]):
        """Write final validated MDX files"""
        await self._write_updated_files(results)
        logger.info(f"📝 Written {len(results)} validated MDX files to {self.output_dir}")

        # List the files that were actually created
        for result in results:
            target_filename = result.get('target_filename', 'unknown.mdx')
            file_path = os.path.join(self.output_dir, target_filename)
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                logger.info(f"✅ Created: {target_filename} ({file_size} bytes)")
            else:
                logger.error(f"❌ Missing: {target_filename}")

class MintlifyResearchAgentV2(processor.Processor):
    """
    Main orchestrator for Mintlify Research Agent V2.
    Coordinates all phases of folder-specific parallel documentation generation.
    """

    def __init__(self, api_key: str, folder_path: str,
                 output_dir: str = "./mintlify-docs",
                 provider: str = "google",
                 screen_model: str = None,
                 doc_model: str = None,
                 max_parallel_agents: int = 20,
                 use_rag: bool = True,
                 base_url: str = None):

        self.api_key = api_key
        self.folder_path = folder_path
        self.output_dir = output_dir
        self.provider = provider
        self.screen_model = screen_model
        self.doc_model = doc_model

        # Initialize GitHub handler
        self.github_handler = GitHubRepositoryHandler(api_key, provider, screen_model, base_url)

        # Global docs.json accumulator for multi-folder processing
        self.global_docs_json = {
            "name": "Documentation",
            "navigation": []
        }
        self.max_parallel_agents = max_parallel_agents
        self.use_rag = use_rag
        self.base_url = base_url

        # RAG will be initialized later with the actual folder path
        self.rag = None

        # Initialize all components
        self.folder_analyzer = EnhancedFolderStructureAnalyzer(
            api_key, provider, screen_model, doc_model, max_parallel_agents, base_url
        )

        self.task_planner = IntelligentTaskPlanner(
            api_key, provider, doc_model, base_url
        )

        # Task executor will be initialized after RAG is set up
        self.task_executor = None

        self.result_aggregator = ResultAggregator(output_dir)

        self.mdx_validator = MDXValidator(
            api_key, output_dir, provider, doc_model, base_url
        )

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute the complete V2 pipeline"""

        logger.info("🚀 Starting Mintlify Research Agent V2 pipeline")
        logger.info(f"📁 Target folder: {self.folder_path}")
        logger.info(f"📂 Output directory: {self.output_dir}")
        logger.info(f"🤖 Provider: {self.provider}")
        logger.info(f"🔧 Max parallel agents: {self.max_parallel_agents}")
        logger.info(f"🔍 RAG enabled: {self.use_rag}")

        # Check if input is a GitHub URL
        if self.github_handler.is_github_url(self.folder_path):
            logger.info("🐙 GitHub repository detected - cloning...")
            try:
                original_url = self.folder_path
                cloned_path = await self.github_handler.clone_repository(self.folder_path)
                self.github_handler.current_repo_url = original_url
                self.folder_path = cloned_path
                logger.info(f"✅ Repository cloned, analyzing: {self.folder_path}")

                # Check if we're targeting a specific subfolder within the repository
                folder_path_in_url = self.github_handler.extract_folder_path_from_url(original_url)

                if folder_path_in_url:
                    # We're targeting a specific subfolder - process it directly as a single folder
                    logger.info(f"🎯 Targeting specific subfolder: {folder_path_in_url}")
                    logger.info("📁 Processing specific folder directly (skipping repository-level analysis)")

                    # Process the specific folder through the normal single folder pipeline
                    async for part in self._process_single_folder():
                        yield part

                    return
                else:
                    # We're targeting the entire repository - perform smart folder selection
                    logger.info("🧠 Analyzing repository structure and selecting important folders...")
                    repo_analysis = await self.github_handler.analyze_repository_structure(self.folder_path)

                    logger.info(f"📊 Repository Analysis:")
                    logger.info(f"   Framework: {repo_analysis.framework_detected}")
                    logger.info(f"   Total folders: {repo_analysis.total_folders}")
                    logger.info(f"   Selected folders: {len(repo_analysis.selected_folders)}")
                    logger.info(f"   Summary: {repo_analysis.repository_summary}")

                    # Process all selected folders together in a single batch
                    logger.info(f"📁 Processing all {len(repo_analysis.selected_folders)} folders together in single batch")

                    # Log the folders being processed
                    for i, folder_info in enumerate(repo_analysis.selected_folders, 1):
                        logger.info(f"   {i}. {folder_info['path']} ({folder_info['actual_files']} files)")

                    # Create a temporary combined folder by copying all files to a single location
                    combined_folder = await self._create_combined_folder(repo_analysis.selected_folders)

                    # Set the folder_path to the combined folder
                    original_folder_path = self.folder_path
                    self.folder_path = combined_folder

                    # Process the combined folder through the normal pipeline
                    async for part in self._process_single_folder():
                        yield part

                    # Restore original folder path
                    self.folder_path = original_folder_path

                    # Clean up temporary combined folder
                    self._cleanup_combined_folder(combined_folder)

                    # Final step: Create a consolidated summary
                    logger.info("📋 Creating final consolidated documentation summary")
                    self._create_final_summary(repo_analysis)

                    return

            except Exception as e:
                logger.error(f"❌ Failed to clone repository: {e}")
                raise

        # Process single folder
        async for part in self._process_single_folder():
            yield part

    async def _create_combined_folder(self, selected_folders: List[Dict]) -> str:
        """Create a temporary combined folder with all selected files"""
        import tempfile
        import shutil

        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix="mintlify_combined_")
        logger.info(f"📁 Creating combined folder: {temp_dir}")

        # Copy files from each selected folder to the combined folder
        for folder_info in selected_folders:
            source_folder = folder_info['full_path']
            folder_name = folder_info['path'].replace('/', '_').replace('\\', '_')

            # Create subdirectory in temp folder
            dest_folder = os.path.join(temp_dir, folder_name)

            try:
                # Copy the entire folder structure
                shutil.copytree(source_folder, dest_folder)
                logger.info(f"   ✅ Copied {folder_info['path']} -> {folder_name}")
            except Exception as e:
                logger.warning(f"   ⚠️ Failed to copy {folder_info['path']}: {e}")

        return temp_dir

    def _cleanup_combined_folder(self, combined_folder: str):
        """Clean up the temporary combined folder"""
        try:
            shutil.rmtree(combined_folder)
            logger.info(f"🧹 Cleaned up temporary folder: {combined_folder}")
        except Exception as e:
            logger.warning(f"Failed to cleanup temporary folder: {e}")

    async def _process_single_folder(self):
        """Process a single folder through the complete pipeline"""

        # Stage 1: Enhanced Folder Structure Analysis
        logger.info("📁 Stage 1: Enhanced folder structure analysis with file screening")
        input_stream = streams.stream_content([self.folder_path])
        analyzed_stream = self.folder_analyzer(input_stream)

        # Initialize RAG after folder analysis
        analysis_result = None
        async for part in analyzed_stream:
            if part.mimetype == "application/json; type=FolderAnalysisResult":
                analysis_result = part.get_metadata("folder_analysis_result")

                # Initialize RAG with the analyzed folder
                if self.use_rag and RAG_AVAILABLE and analysis_result and self.rag is None:
                    try:
                        logger.info(f"🔍 Initializing RAG for folder: {analysis_result.folder_path}")
                        self.rag = RAG(provider="google", model="gemini-2.0-flash")
                        self.rag.prepare_retriever(analysis_result.folder_path)
                        logger.info(f"✅ RAG ready with {len(getattr(self.rag, 'transformed_docs', []))} documents")
                    except Exception as e:
                        logger.warning(f"Failed to initialize RAG: {e}. Proceeding without RAG.")
                        self.rag = None

                # Initialize task executor now that we have RAG
                if self.task_executor is None:
                    self.task_executor = ParallelTaskExecutor(
                        self.api_key, self.rag, self.provider, self.doc_model, self.base_url, self.max_parallel_agents
                    )

                # Yield this part and break to continue with pipeline
                yield part
                break
            else:
                yield part

        # Stage 2: Intelligent Task Planning
        logger.info("📋 Stage 2: Intelligent task planning with resource management")
        if analysis_result:
            # Create stream from analysis result
            analysis_stream = streams.stream_content([part])
            planning_stream = self.task_planner(analysis_stream)

            # Stage 3: Parallel Task Execution
            logger.info("⚡ Stage 3: Parallel task execution with sub-agents")
            execution_stream = self.task_executor(planning_stream)

            # Stage 4: Result Aggregation
            logger.info("📋 Stage 4: Result aggregation and documentation structure")
            aggregation_stream = self.result_aggregator(execution_stream)

            # Stage 5: MDX Validation and File Writing
            logger.info("🔧 Stage 5: MDX validation and final file generation")
            async for final_part in self.mdx_validator(aggregation_stream):
                yield final_part
        else:
            logger.error("❌ No analysis result available, cannot proceed with pipeline")
            error_part = content_api.ProcessorPart(
                "❌ Pipeline failed: No folder analysis result",
                substream_name="error"
            )
            yield error_part

    def _create_final_summary(self, repo_analysis: RepositoryAnalysisResult):
        """Create a final consolidated summary for multi-folder documentation"""
        try:
            docs_json_path = os.path.join(self.output_dir, 'docs.json')

            if os.path.exists(docs_json_path):
                with open(docs_json_path, 'r', encoding='utf-8') as f:
                    docs_json = json.load(f)

                # Add repository information to the docs.json
                docs_json['name'] = f"{repo_analysis.repo_url.split('/')[-1]} Documentation"
                docs_json['description'] = repo_analysis.repository_summary
                docs_json['framework'] = repo_analysis.framework_detected
                docs_json['folders_analyzed'] = len(repo_analysis.selected_folders)

                # Write updated docs.json
                with open(docs_json_path, 'w', encoding='utf-8') as f:
                    json.dump(docs_json, f, indent=2, ensure_ascii=False)

                logger.info(f"📋 Updated docs.json with repository summary")

                # Count sections correctly based on structure
                nav = docs_json.get('navigation', {})
                if isinstance(nav, dict) and 'groups' in nav:
                    section_count = len(nav['groups'])
                elif isinstance(nav, list):
                    section_count = len(nav)
                else:
                    section_count = 0

                logger.info(f"📊 Total sections: {section_count}")

        except Exception as e:
            logger.warning(f"Failed to create final summary: {e}")

# Convenience function for easy usage
async def generate_mintlify_docs_for_folder(
    folder_path: str,
    api_key: str,
    output_dir: str = "./mintlify-docs",
    provider: str = "google",
    screen_model: str = None,
    doc_model: str = None,
    max_parallel_agents: int = 20,
    use_rag: bool = True,
    base_url: str = None
) -> Dict[str, Any]:
    """
    Generate Mintlify documentation for a specific folder using V2 architecture.

    Args:
        folder_path: Path to the folder to document
        api_key: API key for the AI provider
        output_dir: Output directory for generated documentation
        provider: AI provider ("google", "openai", "openrouter", "custom")
        screen_model: Model for file screening (cheap model)
        doc_model: Model for documentation generation (smart model)
        max_parallel_agents: Maximum number of parallel sub-agents
        use_rag: Whether to use RAG for enhanced research
        base_url: Base URL for custom provider

    Returns:
        Dictionary with generation results and file paths
    """

    # Create the V2 agent
    agent = MintlifyResearchAgentV2(
        api_key=api_key,
        folder_path=folder_path,
        output_dir=output_dir,
        provider=provider,
        screen_model=screen_model,
        doc_model=doc_model,
        max_parallel_agents=max_parallel_agents,
        use_rag=use_rag,
        base_url=base_url
    )

    # Create input stream
    input_stream = streams.stream_content([folder_path])

    # Execute the pipeline and collect results
    final_result = None
    async for part in agent(input_stream):
        if part.mimetype == "application/json; type=FinalDocumentation":
            final_result = json.loads(part.text)
            logger.info("✅ Mintlify documentation generation completed successfully")
        elif part.substream_name == "status":
            logger.info(f"Status: {part.text}")
        elif part.substream_name == "error":
            logger.error(f"Error: {part.text}")

    return final_result or {}

# CLI Interface
if __name__ == "__main__":
    import argparse
    import sys

    def main():
        parser = argparse.ArgumentParser(
            description="Mintlify Research Agent V2 - Folder-Specific Parallel Documentation Generation",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  # Generate docs for API folder using Google Gemini
  python mintlify_research_agent_v2.py ./api YOUR_GOOGLE_API_KEY --output ./docs

  # Generate docs with custom models and limits
  python mintlify_research_agent_v2.py ./components YOUR_API_KEY --screen-model gemini-2.0-flash --doc-model gemini-2.5-pro --max-agents 15

  # Generate docs using OpenAI with custom settings
  python mintlify_research_agent_v2.py ./utils YOUR_OPENAI_API_KEY --provider openai --screen-model gpt-4o-mini --doc-model gpt-4o --output ./documentation

  # Generate docs using OpenRouter
  python mintlify_research_agent_v2.py ./routes YOUR_OPENROUTER_API_KEY --provider openrouter --model anthropic/claude-3.5-sonnet --output ./docs

  # Use environment variable for API key
  export GOOGLE_API_KEY="your-key"
  python mintlify_research_agent_v2.py ./src --provider google --max-agents 10 --output ./mintlify-docs
            """
        )

        parser.add_argument("folder_path", help="Path to the folder to document")
        parser.add_argument("api_key", nargs="?", help="API key for the AI provider (or use environment variable)")
        parser.add_argument("--output", "-o", default="./mintlify-docs", help="Output directory for generated documentation (default: ./mintlify-docs)")
        parser.add_argument("--provider", "-p", choices=["google", "openai", "openrouter", "custom"], default="google", help="AI provider (default: google)")
        parser.add_argument("--screen-model", help="Model for file screening (cheap model)")
        parser.add_argument("--doc-model", help="Model for documentation generation (smart model)")
        parser.add_argument("--max-agents", type=int, default=20, help="Maximum number of parallel sub-agents (default: 20)")
        parser.add_argument("--base-url", help="Base URL for custom provider")
        parser.add_argument("--no-rag", action="store_true", help="Disable RAG functionality")
        parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")

        args = parser.parse_args()

        # Set up logging
        if args.verbose:
            logging.getLogger().setLevel(logging.DEBUG)

        # Validate folder path (skip validation for GitHub URLs)
        def is_github_url(path: str) -> bool:
            return path.startswith(('https://github.com/', 'http://github.com/', 'github.com/'))

        if not is_github_url(args.folder_path) and not os.path.exists(args.folder_path):
            print(f"❌ Error: Folder path does not exist: {args.folder_path}")
            sys.exit(1)

        # Get API key from argument or environment
        api_key = args.api_key
        if not api_key:
            env_vars = {
                "google": "GOOGLE_API_KEY",
                "openai": "OPENAI_API_KEY",
                "openrouter": "OPENROUTER_API_KEY",
                "custom": "API_KEY"
            }
            env_var = env_vars.get(args.provider, "API_KEY")
            api_key = os.environ.get(env_var)

            if not api_key:
                print(f"❌ Error: API key not provided. Either pass it as an argument or set {env_var} environment variable.")
                sys.exit(1)

        # Validate custom provider requirements
        if args.provider == "custom" and not args.base_url:
            print("❌ Error: --base-url is required when using custom provider")
            sys.exit(1)

        print(f"🚀 Starting Mintlify Research Agent V2")
        print(f"📁 Folder: {args.folder_path}")
        print(f"🤖 Provider: {args.provider}")
        print(f"📝 Screen Model: {args.screen_model or 'default'}")
        print(f"🧠 Doc Model: {args.doc_model or 'default'}")
        print(f"⚡ Max Agents: {args.max_agents}")
        print(f"📂 Output: {args.output}")
        print(f"🔍 RAG: {'Enabled' if not args.no_rag else 'Disabled'}")
        print()

        async def run_generation():
            try:
                result = await generate_mintlify_docs_for_folder(
                    folder_path=args.folder_path,
                    api_key=api_key,
                    output_dir=args.output,
                    provider=args.provider,
                    screen_model=args.screen_model,
                    doc_model=args.doc_model,
                    max_parallel_agents=args.max_agents,
                    use_rag=not args.no_rag,
                    base_url=args.base_url
                )

                if result:
                    print(f"\n🎉 Successfully generated Mintlify documentation!")
                    print(f"📊 Generated {result.get('total_files_generated', 0)} MDX files")
                    print(f"📂 Output directory: {result.get('output_directory', args.output)}")

                    # Show generation summary if available
                    summary = result.get('generation_summary', {})
                    if summary:
                        print(f"⏱️  Total generation time: {summary.get('total_generation_time', 0):.1f}s")
                        print(f"🎯 Average confidence: {summary.get('avg_confidence', 0):.2f}")
                        print(f"🔢 Total tokens used: {summary.get('total_tokens_used', 0):,}")

                    print(f"\n💡 Next steps:")
                    print(f"   1. cd {args.output}")
                    print(f"   2. npm install -g mint")
                    print(f"   3. mint dev")
                    print(f"   4. Open http://localhost:3000")
                else:
                    print("❌ Documentation generation failed")
                    sys.exit(1)

            except Exception as e:
                print(f"❌ Error: {e}")
                if args.verbose:
                    import traceback
                    traceback.print_exc()
                sys.exit(1)

        # Run the async function
        asyncio.run(run_generation())

    main()
