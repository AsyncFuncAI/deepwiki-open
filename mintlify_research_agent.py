#!/usr/bin/env python3
"""
Mintlify Research Agent - A multi-step agent that combines genai-processors and AdalFlow
to generate comprehensive Mintlify documentation from repository analysis.

This agent implements a 4-stage pipeline that generates MULTIPLE MDX files:
1. Repository Analysis - Analyze repository structure for Mintlify organization
2. Topic Generation - Generate documentation topics optimized for Mintlify structure
3. Content Research - Research each topic using RAG and format for Mintlify components
4. Documentation Synthesis - Generate MULTIPLE MDX files + docs.json configuration

Key Features:
- Generates multiple organized MDX files (not a single document)
- Creates proper Mintlify documentation structure with docs.json
- Uses Mintlify components (Steps, CodeGroup, Callouts, etc.)
- Follows Mintlify technical writing standards
- Parallel processing of research topics using genai-processors
- RAG-enhanced research using AdalFlow for accurate code analysis
- Streaming progress updates throughout the pipeline

Output Structure:
├── docs.json (Mintlify configuration)
├── index.mdx (Introduction page)
├── quickstart.mdx (Getting started guide)
├── api/
│   ├── overview.mdx
│   └── endpoints.mdx
├── guides/
│   ├── installation.mdx
│   └── configuration.mdx
└── reference/
    ├── architecture.mdx
    └── components.mdx

Installation:
    pip install genai-processors adalflow google-generativeai openai

Setup:
    1. For Google Gemini: Get API key from https://makersuite.google.com/app/apikey
       Set environment variable: export GOOGLE_API_KEY="your-key-here"
    2. For OpenAI: Get API key from https://platform.openai.com/api-keys
       Set environment variable: export OPENAI_API_KEY="your-key-here"
    3. For OpenRouter: Get API key from https://openrouter.ai/keys
       Set environment variable: export OPENROUTER_API_KEY="your-key-here"
    4. For RAG functionality, ensure AdalFlow dependencies are installed

Example Usage:
    # Generate Mintlify docs with RAG using Google Gemini
    python mintlify_research_agent.py /path/to/repo YOUR_GOOGLE_API_KEY --output ./mintlify-docs

    # Generate docs using OpenAI GPT-4o
    python mintlify_research_agent.py /path/to/repo YOUR_OPENAI_API_KEY --provider openai --model gpt-4o --output ./docs

    # Generate docs using OpenRouter with Claude
    python mintlify_research_agent.py /path/to/repo YOUR_OPENROUTER_API_KEY --provider openrouter --model anthropic/claude-3.5-sonnet --output ./docs

    # Custom number of topics with specific model
    python mintlify_research_agent.py /path/to/repo YOUR_API_KEY --provider google --model gemini-2.5-pro --topics 8 --output ./docs

Architecture:
    The agent implements a 4-stage pipeline that generates MULTIPLE MDX files:

    1. MintlifyFileTreeAnalyzer: Analyzes repository structure and identifies optimal Mintlify organization
    2. MintlifyTopicGenerator: Generates documentation topics optimized for Mintlify structure
    3. MintlifyTopicResearcher: Parallel processors that research each topic using RAG
    4. MintlifyContentSynthesizer: Generates MULTIPLE MDX files + docs.json (NOT a single file)

    The pipeline uses genai-processors' streaming and parallel processing features
    to efficiently handle multiple research topics concurrently while providing
    real-time progress updates.
"""

import asyncio
import os
import json
import logging
import time
from dataclasses import dataclass, field
from typing import AsyncIterable, List, Dict, Any, Optional
from pathlib import Path

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
    # AdalFlow imports
    import adalflow as adal
    from api.rag import RAG
    from api.data_pipeline import DatabaseManager
except ImportError as e:
    print("Warning: AdalFlow components not found. RAG functionality will be disabled.")
    print(f"Import error: {e}")
    RAG = None
    DatabaseManager = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce Google API logging noise
logging.getLogger("google_genai.models").setLevel(logging.WARNING)
logging.getLogger("google.generativeai").setLevel(logging.WARNING)

# Helper function to create model instances (reuse from wiki_research_agent.py)
def create_model_instance(api_key: str, model_name: str, provider: str = "google", **kwargs):
    """Create a model instance based on provider and model name.

    Args:
        api_key: API key for the provider
        model_name: Name of the model to use
        provider: Provider name ("google", "openai", "openrouter", or "custom")
        **kwargs: Additional configuration parameters
                 For custom provider: base_url (required)

    Returns:
        Model instance (GenaiModel or OpenAIModel)
    """
    if provider.lower() in ["openai", "openrouter", "custom"]:
        if not OPENAI_AVAILABLE:
            raise ValueError("OpenAI support not available. Please install the modified genai-processors with OpenAI support.")

        # Extract OpenAI-specific config
        temperature = kwargs.get("temperature", 1)
        system_instruction = kwargs.get("system_instruction", None)

        config = openai_model.GenerateContentConfig(
            temperature=temperature,
        )
        if system_instruction:
            config.system_instruction = system_instruction

        # Create OpenAI model with appropriate base_url
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

# Data structures for Mintlify documentation
try:
    from dataclasses_json import dataclass_json

    @dataclass_json
    @dataclass
    class MintlifyPage:
        """A single MDX page in Mintlify documentation"""
        title: str
        description: str
        filename: str  # e.g., "quickstart.mdx", "api/overview.mdx"
        content: str   # Full MDX content including frontmatter
        frontmatter: Dict[str, Any]
        components_used: List[str] = field(default_factory=list)
        section: str = "root"  # Which section this page belongs to

    @dataclass_json
    @dataclass
    class MintlifySection:
        """A section/group in Mintlify documentation"""
        section_name: str
        pages: List[MintlifyPage]
        icon: Optional[str] = None
        description: Optional[str] = None

    @dataclass_json
    @dataclass
    class MintlifyDocumentation:
        """Complete Mintlify documentation structure"""
        project_name: str
        description: str
        sections: List[MintlifySection]
        docs_json: Dict[str, Any]
        navigation_structure: Dict[str, Any]
        total_pages: int = 0

    @dataclass_json
    @dataclass
    class MintlifyTopic:
        """A research topic optimized for Mintlify documentation"""
        topic_name: str
        description: str
        target_filename: str  # e.g., "quickstart.mdx", "api/overview.mdx"
        section: str          # e.g., "getting-started", "api-reference"
        relevant_files: List[str]
        research_questions: List[str]
        mintlify_components: List[str]  # Suggested components to use
        priority: int = 1
        research_text: str = ""

except ImportError:
    # Fallback without dataclasses_json
    @dataclass
    class MintlifyPage:
        """A single MDX page in Mintlify documentation"""
        title: str
        description: str
        filename: str
        content: str
        frontmatter: Dict[str, Any]
        components_used: List[str] = field(default_factory=list)
        section: str = "root"

        def to_dict(self):
            return {
                'title': self.title,
                'description': self.description,
                'filename': self.filename,
                'content': self.content,
                'frontmatter': self.frontmatter,
                'components_used': self.components_used,
                'section': self.section
            }

    @dataclass
    class MintlifySection:
        """A section/group in Mintlify documentation"""
        section_name: str
        pages: List[MintlifyPage]
        icon: Optional[str] = None
        description: Optional[str] = None

        def to_dict(self):
            return {
                'section_name': self.section_name,
                'pages': [page.to_dict() for page in self.pages],
                'icon': self.icon,
                'description': self.description
            }

    @dataclass
    class MintlifyDocumentation:
        """Complete Mintlify documentation structure"""
        project_name: str
        description: str
        sections: List[MintlifySection]
        docs_json: Dict[str, Any]
        navigation_structure: Dict[str, Any]
        total_pages: int = 0

        def to_dict(self):
            return {
                'project_name': self.project_name,
                'description': self.description,
                'sections': [section.to_dict() for section in self.sections],
                'docs_json': self.docs_json,
                'navigation_structure': self.navigation_structure,
                'total_pages': self.total_pages
            }

class MintlifyFileTreeAnalyzer(processor.Processor):
    """Analyzes repository file structure to understand optimal Mintlify documentation organization"""

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
                model_name = "gemini-2.0-flash"

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
        """Analyze repository structure and yield MintlifyRepositoryInfo"""
        async for part in content:
            if content_api.is_text(part.mimetype):
                repo_input = part.text.strip()
                logger.info(f"Analyzing repository for Mintlify documentation: {repo_input}")

                # Handle GitHub URLs by cloning them first
                repo_path = await self._prepare_repository(repo_input)

                # Analyze file structure for Mintlify organization
                repo_info = self._analyze_repository_for_mintlify(repo_path)

                # Create ProcessorPart with MintlifyRepositoryInfo as JSON
                repo_info_json = json.dumps({
                    'path': repo_info['path'],
                    'file_tree': repo_info['file_tree'],
                    'total_files': repo_info['total_files'],
                    'file_types': repo_info['file_types'],
                    'key_directories': repo_info['key_directories'],
                    'architecture_hints': repo_info['architecture_hints'],
                    'suggested_sections': repo_info['suggested_sections'],
                    'mintlify_structure': repo_info['mintlify_structure']
                })

                repo_info_part = content_api.ProcessorPart(
                    repo_info_json,
                    mimetype="application/json; type=MintlifyRepositoryInfo",
                    metadata={"mintlify_repo_info": repo_info}
                )
                yield repo_info_part
            else:
                yield part

    async def _prepare_repository(self, repo_input: str) -> str:
        """Prepare repository - clone if it's a GitHub URL, otherwise return local path"""
        if repo_input.startswith(('https://github.com/', 'http://github.com/', 'git@github.com:')):
            # It's a GitHub URL, we need to clone it
            import tempfile
            import subprocess

            # Create temporary directory
            temp_dir = tempfile.mkdtemp(prefix="mintlify_agent_repo_")

            try:
                logger.info(f"Cloning GitHub repository to: {temp_dir}")

                # Clone the repository
                subprocess.run(
                    ["git", "clone", repo_input, temp_dir],
                    check=True,
                    capture_output=True,
                    text=True
                )

                logger.info("Repository cloned successfully")
                return temp_dir

            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to clone repository: {e.stderr}")
                raise ValueError(f"Failed to clone GitHub repository: {e.stderr}")
            except FileNotFoundError:
                raise ValueError("Git is not installed. Please install git or provide a local repository path.")
        else:
            # It's a local path
            if not os.path.exists(repo_input):
                raise ValueError(f"Local repository path does not exist: {repo_input}")
            return repo_input

    def _analyze_repository_for_mintlify(self, repo_path: str) -> Dict[str, Any]:
        """Analyze repository structure and suggest optimal Mintlify documentation organization"""
        file_tree = {}
        file_types = {}
        total_files = 0
        key_directories = []

        # Walk through repository
        for root, dirs, files in os.walk(repo_path):
            # Skip hidden and common build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'build', 'dist']]

            rel_root = os.path.relpath(root, repo_path)
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
                if file.startswith('.'):
                    continue

                total_files += 1
                ext = Path(file).suffix.lower()
                file_types[ext] = file_types.get(ext, 0) + 1

                # Add file to tree
                current_level[file] = None

        # Identify key directories based on common patterns
        key_directories = self._identify_key_directories(file_tree)

        # Generate architecture hints
        architecture_hints = self._generate_architecture_hints(file_tree, file_types)

        # Suggest Mintlify documentation sections
        suggested_sections = self._suggest_mintlify_sections(file_tree, file_types, architecture_hints)

        # Generate Mintlify structure recommendation
        mintlify_structure = self._generate_mintlify_structure(suggested_sections, architecture_hints)

        return {
            'path': repo_path,
            'file_tree': file_tree,
            'total_files': total_files,
            'file_types': file_types,
            'key_directories': key_directories,
            'architecture_hints': architecture_hints,
            'suggested_sections': suggested_sections,
            'mintlify_structure': mintlify_structure
        }

    def _identify_key_directories(self, file_tree: Dict) -> List[str]:
        """Identify important directories in the repository"""
        key_dirs = []
        common_important_dirs = [
            'src', 'lib', 'api', 'components', 'services', 'utils', 'core',
            'models', 'views', 'controllers', 'routes', 'middleware', 'config',
            'tests', 'docs', 'examples', 'scripts', 'tools', 'public', 'assets'
        ]

        def find_dirs(tree, path=""):
            for key, value in tree.items():
                if isinstance(value, dict):  # It's a directory
                    current_path = f"{path}/{key}" if path else key
                    if key.lower() in common_important_dirs:
                        key_dirs.append(current_path)
                    find_dirs(value, current_path)

        find_dirs(file_tree)
        return key_dirs

    def _generate_architecture_hints(self, file_tree: Dict, file_types: Dict) -> List[str]:
        """Generate hints about the repository architecture"""
        hints = []

        # Language detection
        if '.py' in file_types:
            hints.append("Python project")
        if '.js' in file_types or '.ts' in file_types:
            hints.append("JavaScript/TypeScript project")
        if '.java' in file_types:
            hints.append("Java project")
        if '.go' in file_types:
            hints.append("Go project")
        if '.rs' in file_types:
            hints.append("Rust project")
        if '.cpp' in file_types or '.c' in file_types:
            hints.append("C/C++ project")

        # Framework detection
        tree_str = str(file_tree)
        if 'package.json' in tree_str:
            hints.append("Node.js project with package.json")
        if 'requirements.txt' in tree_str or 'pyproject.toml' in tree_str:
            hints.append("Python project with dependencies")
        if 'Dockerfile' in tree_str:
            hints.append("Containerized application")
        if 'docker-compose.yml' in tree_str:
            hints.append("Multi-service Docker application")
        if 'Cargo.toml' in tree_str:
            hints.append("Rust project with Cargo")
        if 'go.mod' in tree_str:
            hints.append("Go module project")

        return hints

    def _suggest_mintlify_sections(self, file_tree: Dict, file_types: Dict, architecture_hints: List[str]) -> List[Dict[str, Any]]:
        """Suggest optimal Mintlify documentation sections based on repository analysis"""
        sections = []

        # Always include Getting Started section
        sections.append({
            'name': 'Getting Started',
            'key': 'getting-started',
            'icon': 'rocket',
            'description': 'Quick setup and installation guide',
            'pages': ['index', 'quickstart', 'installation'],
            'priority': 1
        })

        # API Reference section (if API-related files found)
        api_indicators = ['api', 'routes', 'endpoints', 'controllers', 'handlers']
        if any(indicator in str(file_tree).lower() for indicator in api_indicators):
            sections.append({
                'name': 'API Reference',
                'key': 'api-reference',
                'icon': 'terminal',
                'description': 'Complete API documentation and endpoints',
                'pages': ['api/overview', 'api/authentication', 'api/endpoints'],
                'priority': 2
            })

        # Configuration section (if config files found)
        config_indicators = ['config', 'settings', '.env', 'environment']
        if any(indicator in str(file_tree).lower() for indicator in config_indicators):
            sections.append({
                'name': 'Configuration',
                'key': 'configuration',
                'icon': 'gear',
                'description': 'Configuration and environment setup',
                'pages': ['configuration/overview', 'configuration/environment'],
                'priority': 3
            })

        # Guides section (for tutorials and how-tos)
        sections.append({
            'name': 'Guides',
            'key': 'guides',
            'icon': 'book',
            'description': 'Step-by-step guides and tutorials',
            'pages': ['guides/development', 'guides/deployment', 'guides/best-practices'],
            'priority': 4
        })

        # Architecture section (for complex projects)
        if len(architecture_hints) > 2 or 'src' in str(file_tree) or 'lib' in str(file_tree):
            sections.append({
                'name': 'Architecture',
                'key': 'architecture',
                'icon': 'building',
                'description': 'System architecture and design patterns',
                'pages': ['architecture/overview', 'architecture/components'],
                'priority': 5
            })

        # Reference section (for detailed documentation)
        sections.append({
            'name': 'Reference',
            'key': 'reference',
            'icon': 'asterisk',
            'description': 'Detailed reference documentation',
            'pages': ['reference/cli', 'reference/troubleshooting'],
            'priority': 6
        })

        return sections

    def _generate_mintlify_structure(self, suggested_sections: List[Dict[str, Any]], architecture_hints: List[str]) -> Dict[str, Any]:
        """Generate recommended Mintlify documentation structure"""

        # Determine project type for better structure
        project_type = "general"
        if any("API" in hint for hint in architecture_hints):
            project_type = "api"
        elif any("library" in hint.lower() for hint in architecture_hints):
            project_type = "library"
        elif any("framework" in hint.lower() for hint in architecture_hints):
            project_type = "framework"

        structure = {
            'project_type': project_type,
            'recommended_theme': 'mint',  # Default Mintlify theme
            'navigation_style': 'pages',  # Use flat pages navigation
            'sections': suggested_sections,
            'total_estimated_pages': sum(len(section['pages']) for section in suggested_sections),
            'suggested_components': self._suggest_components_by_type(project_type),
            'docs_json_template': self._generate_docs_json_template(suggested_sections, project_type)
        }

        return structure

    def _suggest_components_by_type(self, project_type: str) -> List[str]:
        """Suggest Mintlify components based on project type"""
        base_components = ['Note', 'Tip', 'Warning', 'CodeGroup', 'Steps']

        if project_type == "api":
            return base_components + ['ParamField', 'ResponseField', 'RequestExample', 'ResponseExample']
        elif project_type == "library":
            return base_components + ['Tabs', 'AccordionGroup', 'Cards']
        elif project_type == "framework":
            return base_components + ['Tabs', 'Steps', 'Cards', 'Frames']
        else:
            return base_components + ['Tabs', 'AccordionGroup']

    def _generate_docs_json_template(self, sections: List[Dict[str, Any]], project_type: str) -> Dict[str, Any]:
        """Generate a template docs.json configuration"""

        # Build navigation groups structure
        navigation_groups = []
        for section in sections:
            group = {
                'group': section['name'],
                'icon': section['icon'],
                'pages': section['pages']
            }
            navigation_groups.append(group)

        docs_json = {
            '$schema': 'https://mintlify.com/docs.json',
            'theme': 'mint',
            'name': 'Project Documentation',
            'description': 'Comprehensive documentation generated by Mintlify Research Agent',
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

        # Add API-specific configuration if needed
        if project_type == "api":
            docs_json['api'] = {
                'playground': {
                    'display': 'interactive'
                },
                'examples': {
                    'languages': ['javascript', 'python', 'curl']
                }
            }

        return docs_json

class MintlifyTopicGenerator(processor.Processor):
    """Generates research topics optimized for Mintlify documentation structure"""

    def __init__(self, api_key: str, num_topics: int = 8, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.num_topics = num_topics
        self.provider = provider

        # Set default model based on provider
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

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Generate Mintlify-optimized research topics from repository info"""
        async for part in content:
            if part.mimetype == "application/json; type=MintlifyRepositoryInfo":
                # Get repo info from metadata or parse JSON
                repo_info = part.get_metadata("mintlify_repo_info")
                if repo_info is None:
                    # Parse from JSON text
                    repo_info = json.loads(part.text)

                logger.info(f"Generating Mintlify topics for repository: {repo_info['path']}")

                # Generate topics using LLM with Mintlify-specific prompts
                topics = await self._generate_mintlify_topics(repo_info)

                # Yield each topic as a separate part
                for topic in topics:
                    topic_json = json.dumps({
                        'topic_name': topic.topic_name,
                        'description': topic.description,
                        'target_filename': topic.target_filename,
                        'section': topic.section,
                        'relevant_files': topic.relevant_files,
                        'research_questions': topic.research_questions,
                        'mintlify_components': topic.mintlify_components,
                        'priority': topic.priority,
                        'research_text': topic.research_text
                    })

                    topic_part = content_api.ProcessorPart(
                        topic_json,
                        mimetype="application/json; type=MintlifyTopic",
                        metadata={"mintlify_topic": topic}
                    )
                    yield topic_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"Generated {len(topics)} Mintlify-optimized research topics",
                    substream_name="status"
                )
                yield status_part

                # Also pass through the original RepositoryInfo for RAG initialization
                yield part
            else:
                yield part

    async def _generate_mintlify_topics(self, repo_info: Dict[str, Any]) -> List[MintlifyTopic]:
        """Use LLM to generate Mintlify-optimized research topics based on repository analysis"""

        # Try to read README.md for additional context
        readme_content = self._read_readme_content(repo_info['path'])

        # Create prompt for Mintlify topic generation
        readme_section = ""
        if readme_content:
            readme_section = f"""
README Content:
{readme_content}
"""

        prompt = f"""
Analyze this repository structure and generate {self.num_topics} distinct research topics specifically optimized for MINTLIFY DOCUMENTATION.

Repository Information:
- Path: {repo_info['path']}
- Total files: {repo_info['total_files']}
- File types: {repo_info['file_types']}
- Key directories: {repo_info['key_directories']}
- Architecture hints: {repo_info['architecture_hints']}
- Suggested Mintlify sections: {repo_info['suggested_sections']}
{readme_section}
File tree structure:
{json.dumps(repo_info['file_tree'], indent=2)[:2000]}...

Generate {self.num_topics} research topics that will create MULTIPLE SEPARATE MDX FILES for Mintlify documentation. Each topic should:

1. Target a SPECIFIC MDX file (e.g., "quickstart.mdx", "api/overview.mdx", "guides/installation.mdx")
2. Be optimized for Mintlify components (Steps, CodeGroup, Callouts, ParamField, etc.)
3. Follow Mintlify technical writing standards (second person, active voice, progressive disclosure)
4. Map to the suggested Mintlify sections from the analysis
5. Create comprehensive but focused documentation pages
6. Use insights from the README content (if provided) to understand the project's purpose, features, and usage patterns

IMPORTANT: Each topic should generate a SEPARATE MDX file, not contribute to a single document. Use the README content to better understand what documentation would be most valuable for users.

Mintlify Components to Consider:
- Steps: For setup and installation procedures
- CodeGroup: For multi-language code examples
- Note/Tip/Warning: For important information
- ParamField/ResponseField: For API documentation
- Tabs: For platform-specific content
- Accordions: For collapsible detailed information
- Cards: For feature overviews

Return a JSON array of topics with this structure:
[
  {{
    "topic_name": "Quick Start Guide",
    "description": "Complete setup and first steps for new users",
    "target_filename": "quickstart.mdx",
    "section": "getting-started",
    "relevant_files": ["README.md", "package.json", "src/main.py"],
    "research_questions": ["How do users install dependencies?", "What are the first steps?", "How to verify setup?"],
    "mintlify_components": ["Steps", "CodeGroup", "Note", "Tip"],
    "priority": 1
  }},
  {{
    "topic_name": "API Overview",
    "description": "Introduction to the API endpoints and authentication",
    "target_filename": "api/overview.mdx",
    "section": "api-reference",
    "relevant_files": ["api/routes.py", "api/auth.py"],
    "research_questions": ["What endpoints are available?", "How does authentication work?"],
    "mintlify_components": ["ParamField", "ResponseField", "CodeGroup", "Warning"],
    "priority": 2
  }}
]
"""

        # Generate topics using the model
        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Parse JSON response
        try:
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                topics_data = json.loads(json_text)

                # Convert to MintlifyTopic objects
                topics = []
                for topic_data in topics_data:
                    topic = MintlifyTopic(
                        topic_name=topic_data.get("topic_name", "Unknown Topic"),
                        description=topic_data.get("description", ""),
                        target_filename=topic_data.get("target_filename", "unknown.mdx"),
                        section=topic_data.get("section", "general"),
                        relevant_files=topic_data.get("relevant_files", []),
                        research_questions=topic_data.get("research_questions", []),
                        mintlify_components=topic_data.get("mintlify_components", []),
                        priority=topic_data.get("priority", 2)
                    )
                    topics.append(topic)

                logger.info(f"Generated {len(topics)} Mintlify topics successfully")
                return topics

        except Exception as e:
            logger.error(f"Error parsing Mintlify topics from LLM response: {e}")

        # Fallback: create default Mintlify topics
        return self._create_default_mintlify_topics(repo_info)

    def _read_readme_content(self, repo_path: str) -> str:
        """Read README.md content if it exists to enrich topic generation context"""
        import os

        # Common README file names to check
        readme_files = ['README.md', 'readme.md', 'Readme.md', 'README.txt', 'readme.txt']

        for readme_file in readme_files:
            readme_path = os.path.join(repo_path, readme_file)
            if os.path.exists(readme_path):
                try:
                    with open(readme_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Limit content to avoid overwhelming the prompt (first 3000 chars)
                        if len(content) > 3000:
                            content = content[:3000] + "...\n[README content truncated for brevity]"
                        logger.info(f"Found and loaded README content from {readme_file}")
                        return content
                except Exception as e:
                    logger.warning(f"Could not read {readme_file}: {e}")
                    continue

        logger.info("No README file found in repository")
        return ""

    def _create_default_mintlify_topics(self, repo_info: Dict[str, Any]) -> List[MintlifyTopic]:
        """Create default Mintlify research topics if LLM generation fails"""
        default_topics = [
            MintlifyTopic(
                topic_name="Introduction",
                description="Project overview and introduction",
                target_filename="index.mdx",
                section="getting-started",
                relevant_files=[],
                research_questions=["What is this project?", "What problem does it solve?", "Who is it for?"],
                mintlify_components=["Note", "Cards"],
                priority=1
            ),
            MintlifyTopic(
                topic_name="Quick Start Guide",
                description="Complete setup and installation guide",
                target_filename="quickstart.mdx",
                section="getting-started",
                relevant_files=[],
                research_questions=["How to install?", "How to get started?", "First steps?"],
                mintlify_components=["Steps", "CodeGroup", "Tip"],
                priority=1
            ),
            MintlifyTopic(
                topic_name="Configuration",
                description="Configuration and environment setup",
                target_filename="configuration.mdx",
                section="configuration",
                relevant_files=[],
                research_questions=["How to configure?", "What settings are available?"],
                mintlify_components=["Tabs", "Warning", "Note"],
                priority=2
            ),
            MintlifyTopic(
                topic_name="API Reference",
                description="API endpoints and usage",
                target_filename="api/overview.mdx",
                section="api-reference",
                relevant_files=[],
                research_questions=["What APIs are available?", "How to authenticate?"],
                mintlify_components=["ParamField", "ResponseField", "CodeGroup"],
                priority=2
            ),
            MintlifyTopic(
                topic_name="Development Guide",
                description="Development workflow and best practices",
                target_filename="guides/development.mdx",
                section="guides",
                relevant_files=[],
                research_questions=["How to contribute?", "Development workflow?"],
                mintlify_components=["Steps", "Note", "Tip"],
                priority=3
            ),
            MintlifyTopic(
                topic_name="Architecture Overview",
                description="System architecture and design patterns",
                target_filename="architecture/overview.mdx",
                section="architecture",
                relevant_files=[],
                research_questions=["How is the system structured?", "What patterns are used?"],
                mintlify_components=["Accordions", "Note"],
                priority=3
            )
        ]

        # Limit to requested number of topics
        limited_topics = default_topics[:self.num_topics]

        logger.info(f"Using {len(limited_topics)} default Mintlify topics")
        return limited_topics

class MintlifyTopicResearcher(processor.PartProcessor):
    """Researches individual Mintlify topics using AdalFlow RAG and formats for MDX"""

    def __init__(self, api_key: str, rag_instance: Optional[Any] = None, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.rag = rag_instance
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"
            elif provider.lower() == "custom":
                model_name = "gpt-4o"
            else:
                model_name = "gemini-2.5-flash"

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
        """Only process MintlifyTopic parts"""
        return part.mimetype == "application/json; type=MintlifyTopic"

    async def call(self, content: content_api.ProcessorPart) -> AsyncIterable[content_api.ProcessorPart]:
        """Research a specific Mintlify topic using RAG and format for MDX"""
        if self.match(content):
            # Get topic from metadata or parse JSON
            topic = content.get_metadata("mintlify_topic")
            if topic is None:
                # Parse from JSON text
                topic_data = json.loads(content.text)
                topic = MintlifyTopic(**topic_data)

            logger.info(f"Researching Mintlify topic: {topic.topic_name} -> {topic.target_filename}")

            # Yield status update
            status_part = content_api.ProcessorPart(
                f"Starting research on: {topic.topic_name} (target: {topic.target_filename})",
                substream_name="status"
            )
            yield status_part

            # Conduct research
            research_result = await self._research_mintlify_topic(topic)

            # Skip if no valid research result
            if research_result is None:
                logger.warning(f"Skipping topic '{topic.topic_name}' - no content found")
                status_part = content_api.ProcessorPart(
                    f"Skipped research on: {topic.topic_name} (no content found)",
                    substream_name="status"
                )
                yield status_part
                return

            # Yield research result as JSON
            result_json = json.dumps({
                'topic': {
                    'topic_name': research_result['topic'].topic_name,
                    'description': research_result['topic'].description,
                    'target_filename': research_result['topic'].target_filename,
                    'section': research_result['topic'].section,
                    'relevant_files': research_result['topic'].relevant_files,
                    'research_questions': research_result['topic'].research_questions,
                    'mintlify_components': research_result['topic'].mintlify_components,
                    'priority': research_result['topic'].priority,
                    'research_text': research_result['topic'].research_text
                },
                'mdx_content': research_result['mdx_content'],
                'sources': research_result['sources'],
                'confidence': research_result['confidence']
            })

            result_part = content_api.ProcessorPart(
                result_json,
                mimetype="application/json; type=MintlifyResearchResult",
                metadata={"mintlify_research_result": research_result}
            )
            yield result_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"Completed research on: {topic.topic_name} -> {topic.target_filename}",
                substream_name="status"
            )
            yield completion_part
        else:
            # Pass through non-matching parts
            yield content

    async def _research_mintlify_topic(self, topic: MintlifyTopic) -> Optional[Dict[str, Any]]:
        """Conduct research on a specific Mintlify topic using RAG and format as MDX"""
        try:
            if self.rag is None:
                # Generate basic content without RAG
                logger.warning(f"RAG not available for topic: {topic.topic_name}, generating basic content")
                mdx_content = await self._generate_basic_mintlify_mdx(topic)
                return {
                    'topic': topic,
                    'mdx_content': mdx_content,
                    'sources': [],
                    'confidence': 0.3  # Lower confidence without RAG
                }

            # Use RAG to research the topic
            research_queries = self._generate_research_queries(topic)
            all_content = []
            all_sources = []

            for query in research_queries:
                logger.info(f"Querying RAG for: {query}")

                try:
                    retrieved_docs = self.rag.call(query)

                    if retrieved_docs and len(retrieved_docs) > 0:
                        # Extract documents from retrieval result
                        if hasattr(retrieved_docs[0], 'documents'):
                            docs = retrieved_docs[0].documents
                            logger.info(f"Found {len(docs)} documents for query: {query}")
                            for doc in docs[:20]:  # Include up to 20 results per query
                                if hasattr(doc, 'text') and hasattr(doc, 'meta_data'):
                                    file_path = doc.meta_data.get('file_path', 'unknown')
                                    # Include full document content with file name specification
                                    full_content = f"=== FILE: {file_path} ===\n{doc.text}\n=== END FILE: {file_path} ===\n"
                                    all_content.append(full_content)
                                    if file_path not in all_sources:
                                        all_sources.append(file_path)
                        else:
                            logger.warning(f"Retrieved docs don't have 'documents' attribute: {retrieved_docs[0]}")
                    else:
                        logger.warning(f"No documents retrieved for query: {query}")
                except Exception as e:
                    logger.warning(f"RAG query failed for '{query}': {e}")
                    continue

            # Synthesize research content as MDX
            if all_content and len(all_content) >= 2:  # Require at least 2 content pieces for quality
                logger.info(f"Found {len(all_content)} content pieces from RAG for topic: {topic.topic_name}")
                mdx_content = await self._synthesize_mintlify_mdx(topic, all_content)
                # Improved confidence calculation
                confidence = min(0.95, (len(all_content) / 50.0) + (len(all_sources) / 20.0))
            else:
                logger.warning(f"Insufficient RAG content found for topic: {topic.topic_name} (found {len(all_content)} pieces), skipping")
                return None

            return {
                'topic': topic,
                'mdx_content': mdx_content,
                'sources': all_sources,
                'confidence': confidence
            }

        except Exception as e:
            logger.error(f"Error researching Mintlify topic {getattr(topic, 'topic_name', 'Unknown')}: {e}")
            return None

    def _generate_research_queries(self, topic: MintlifyTopic) -> List[str]:
        """Generate specific queries for RAG based on the Mintlify topic"""
        queries = []

        # Add the main topic description as a query
        queries.append(topic.description)

        # Add research questions as queries
        for question in topic.research_questions[:3]:
            queries.append(question)

        # Add topic-specific queries based on target filename
        filename_lower = topic.target_filename.lower()
        if "quickstart" in filename_lower or "getting-started" in filename_lower:
            queries.extend([
                "installation setup dependencies",
                "getting started first steps"
            ])
        elif "api" in filename_lower:
            queries.extend([
                "API endpoints routes handlers",
                "authentication authorization"
            ])
        elif "config" in filename_lower:
            queries.extend([
                "configuration settings environment",
                "setup configuration files"
            ])
        elif "guide" in filename_lower:
            queries.extend([
                "tutorial how-to guide",
                "step by step instructions"
            ])

        return queries[:3]  # Limit to 3 queries for efficiency

    def _load_mintlify_writing_rules(self) -> str:
        """Load Mintlify technical writing rules from external file"""
        try:
            rules_file_path = os.path.join(os.path.dirname(__file__), 'mintlify_technical_writing_rules.md')
            with open(rules_file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            logger.warning("Mintlify writing rules file not found, using fallback rules")
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
"""

    async def _synthesize_mintlify_mdx(self, topic: MintlifyTopic, content_pieces: List[str]) -> str:
        """Synthesize research content into properly formatted Mintlify MDX"""

        # Combine content pieces
        combined_content = "\n\n".join(content_pieces)
        content_length = len(combined_content)
        logger.info(f"Synthesizing {len(content_pieces)} content pieces ({content_length} characters) for Mintlify topic: {topic.topic_name}")

        # Load Mintlify writing rules
        writing_rules = self._load_mintlify_writing_rules()

        # Create Mintlify-specific prompt
        prompt = f"""
<MINTLIFY_WRITING_RULES>
{writing_rules}
<MINTLIFY_WRITING_RULE/>
Based on the following code and documentation content from repository files, create a comprehensive Mintlify MDX page for: {topic.topic_name}

Target filename: {topic.target_filename}
Section: {topic.section}
Description: {topic.description}

Research Questions to Address:
{chr(10).join(f"- {q}" for q in topic.research_questions)}

Suggested Mintlify Components: {', '.join(topic.mintlify_components)}

Available Content from Repository Files:
{combined_content}

Create a complete MDX page that:

1. STARTS with proper YAML frontmatter (NO code fences around it):
---
title: "Clear, specific title"
description: "Concise description explaining page purpose"
---

2. FOLLOWS ALL MINTLIFY TECHNICAL WRITING RULES from above
3. ONLY uses information found in the provided repository files
4. Includes specific file references and examples from actual code
5. Organizes content logically with proper markdown structure
6. Uses appropriate Mintlify components for the content type

CRITICAL FORMATTING RULES:
- DO NOT wrap your response in markdown code fences (```)
- DO NOT start with ```yaml or ```mdx
- START IMMEDIATELY with the frontmatter: ---
- The file should begin directly with --- (three dashes)

CORRECT EXAMPLE FORMAT:
---
title: "API Authentication"
description: "Learn how to authenticate with the DeepWiki API, including setting up API keys for AI models and enabling authorization mode for wiki generation."
---

DeepWiki's API utilizes different authentication mechanisms depending on the functionality you are accessing. This guide explains how to set up the necessary API keys for Large Language Models (LLMs) and how to enable an optional authorization mode for wiki generation.

## LLM Provider API Keys

Your content here...

IMPORTANT: Generate ONLY the MDX content for this specific page. Do not include navigation or references to other pages.

Generate the complete MDX page ONLY:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Clean up the response - remove markdown code fences if present
        cleaned_response = response_text.strip()

        # Remove leading/trailing code fences that LLMs sometimes add
        if cleaned_response.startswith('```'):
            lines = cleaned_response.split('\n')
            # Remove first line if it's just ``` or ```yaml or ```mdx
            if lines[0].strip() in ['```', '```yaml', '```mdx']:
                lines = lines[1:]
            # Remove last line if it's just ```
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned_response = '\n'.join(lines)

        return cleaned_response

    async def _generate_basic_mintlify_mdx(self, topic: MintlifyTopic) -> str:
        """Generate basic Mintlify MDX content without RAG"""

        # Load Mintlify writing rules
        writing_rules = self._load_mintlify_writing_rules()

        # Create basic prompt for content generation
        prompt = f"""
{writing_rules}

Create a comprehensive Mintlify MDX page for: {topic.topic_name}

Target filename: {topic.target_filename}
Section: {topic.section}
Description: {topic.description}

Research Questions to Address:
{chr(10).join(f"- {q}" for q in topic.research_questions)}

Suggested Mintlify Components: {', '.join(topic.mintlify_components)}

Since no repository content is available, create a well-structured template page that:

1. STARTS with proper YAML frontmatter (NO code fences around it):
---
title: "{topic.topic_name}"
description: "{topic.description}"
---

2. FOLLOWS ALL MINTLIFY TECHNICAL WRITING RULES from above
3. Creates a comprehensive template that can be filled in with actual project details
4. Includes placeholder sections for common documentation needs
5. Uses appropriate Mintlify components for the content type
6. Provides realistic placeholder examples and code snippets

CRITICAL FORMATTING RULES:
- DO NOT wrap your response in markdown code fences (```)
- DO NOT start with ```yaml or ```mdx
- START IMMEDIATELY with the frontmatter: ---
- The file should begin directly with --- (three dashes)

CORRECT EXAMPLE FORMAT:
---
title: "API Authentication"
description: "Learn how to authenticate with the DeepWiki API, including setting up API keys for AI models and enabling authorization mode for wiki generation."
---

DeepWiki's API utilizes different authentication mechanisms depending on the functionality you are accessing. This guide explains how to set up the necessary API keys for Large Language Models (LLMs) and how to enable an optional authorization mode for wiki generation.

## LLM Provider API Keys

Generate a complete MDX template page:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Clean up the response - remove markdown code fences if present
        cleaned_response = response_text.strip()

        # Remove leading/trailing code fences that LLMs sometimes add
        if cleaned_response.startswith('```'):
            lines = cleaned_response.split('\n')
            # Remove first line if it's just ``` or ```yaml or ```mdx
            if lines[0].strip() in ['```', '```yaml', '```mdx']:
                lines = lines[1:]
            # Remove last line if it's just ```
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned_response = '\n'.join(lines)

        return cleaned_response

class MintlifyMDXValidator(processor.Processor):
    """Post-processes and validates MDX content using @mdx-js/mdx compile function and fixes parsing errors"""

    def __init__(self, api_key: str, output_dir: str = "./mintlify-docs", provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.output_dir = output_dir
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"
            elif provider.lower() == "custom":
                model_name = "gpt-4o"
            else:
                model_name = "gemini-2.5-flash"

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
        """Collect all research results, write files, validate using @mdx-js/mdx compile, and fix parsing errors"""

        # Collect all research results first
        research_results = []
        repo_info = None
        documentation_part = None
        part_count = 0

        async for part in content:
            part_count += 1
            logger.debug(f"Validator received part {part_count}: {part.mimetype}")

            if part.mimetype == "application/json; type=MintlifyResearchResult":
                research_result = part.get_metadata("mintlify_research_result")
                if research_result is None:
                    research_result = json.loads(part.text)
                research_results.append(research_result)
                logger.debug(f"Added research result: {research_result.get('topic', {}).get('topic_name', 'Unknown')}")

            elif part.mimetype == "application/json; type=MintlifyRepositoryInfo":
                repo_info = part.get_metadata("mintlify_repo_info")
                if repo_info is None:
                    repo_info = json.loads(part.text)
                logger.debug("Added repository info")

            elif part.mimetype == "application/json; type=MintlifyDocumentation":
                # Store the documentation part to yield after validation
                documentation_part = part
                logger.info("📋 Received MintlifyDocumentation part - will pass through after validation")

            # Pass through status updates
            elif hasattr(part, 'substream_name') and part.substream_name == "status":
                yield part
            else:
                logger.debug(f"Passing through part: {part.mimetype}")

        logger.info(f"Validator collected {len(research_results)} research results from {part_count} parts")

        if not research_results:
            logger.warning("No research results to validate - validator will be skipped")
            return

        logger.info(f"🔧 Starting iterative MDX validation for {len(research_results)} files")

        # Write initial files to disk for testing
        logger.info(f"📝 Writing {len(research_results)} initial files to {self.output_dir}")
        await self._write_initial_files(research_results, repo_info)

        # Run iterative validation and fixing
        logger.info("🔍 Starting MDX validation loop using @mdx-js/mdx compile")
        fixed_results = await self._iterative_mint_validation(research_results)

        # Yield all fixed results
        for result in fixed_results:
            # Convert MintlifyTopic object to dict if needed for JSON serialization
            if hasattr(result['topic'], 'to_dict'):
                topic_dict = result['topic'].to_dict()
            elif hasattr(result['topic'], '__dict__'):
                topic_dict = {
                    'topic_name': getattr(result['topic'], 'topic_name', 'Unknown'),
                    'description': getattr(result['topic'], 'description', ''),
                    'target_filename': getattr(result['topic'], 'target_filename', 'unknown.mdx'),
                    'section': getattr(result['topic'], 'section', 'general'),
                    'relevant_files': getattr(result['topic'], 'relevant_files', []),
                    'research_questions': getattr(result['topic'], 'research_questions', []),
                    'mintlify_components': getattr(result['topic'], 'mintlify_components', []),
                    'priority': getattr(result['topic'], 'priority', 1),
                    'research_text': getattr(result['topic'], 'research_text', '')
                }
            else:
                topic_dict = result['topic']  # Already a dict

            # Create serializable research result
            serializable_result = {
                'topic': topic_dict,
                'mdx_content': result['mdx_content'],
                'sources': result.get('sources', []),
                'confidence': result.get('confidence', 0.5)
            }

            result_json = json.dumps(serializable_result)
            fixed_part = content_api.ProcessorPart(
                result_json,
                mimetype="application/json; type=MintlifyResearchResult",
                metadata={"mintlify_research_result": serializable_result}
            )
            yield fixed_part

        # Yield the final documentation part if we received one
        if documentation_part:
            logger.info("📋 Passing through MintlifyDocumentation part after successful validation")
            yield documentation_part
        else:
            logger.warning("⚠️ No MintlifyDocumentation part received from synthesizer")

        # Yield final status
        status_part = content_api.ProcessorPart(
            f"✅ All {len(fixed_results)} MDX files validated and fixed",
            substream_name="status"
        )
        yield status_part

    async def _fix_mdx_parsing_errors(self, mdx_content: str, topic_name: str) -> str:
        """Use LLM to identify and fix common MDX parsing errors"""

        prompt = f"""
You are an MDX syntax validator and fixer. Fix the following MDX content to resolve parsing errors while preserving all the original content and meaning.

COMMON MDX PARSING ERRORS TO FIX:

1. **Invalid HTML-like tags**: Replace `<server_address>` with backticks: `server_address`
2. **Unclosed tags**: Ensure all Mintlify components are properly closed
3. **Single-block CodeGroups**: Replace with regular code blocks
4. **Invalid self-closing syntax**: Fix `/>` in MDX components
5. **Malformed component syntax**: Fix component attributes and nesting
6. **Unclosed Accordion components**: Ensure proper AccordionGroup wrapping

SPECIFIC FIXES NEEDED:

- Replace HTML-like tags (e.g., `<server_address>`, `<port>`) with inline code: `server_address`, `port`
- Fix any unclosed `<CodeGroup>`, `<Accordion>`, `<Note>`, `<Tip>`, `<Warning>` tags
- Replace single-block CodeGroups with regular code blocks
- Ensure all components have proper opening and closing tags
- Fix any malformed JSX syntax

RULES:
- Preserve ALL original content and meaning
- Only fix syntax errors, don't change the content
- Maintain proper Mintlify component usage
- Keep all code examples intact
- Preserve frontmatter exactly as is

Original MDX content for topic "{topic_name}":

{mdx_content}

Return ONLY the fixed MDX content with no additional text or explanations:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        return response_text.strip()

    async def _write_initial_files(self, research_results: List[Dict], repo_info: Dict = None):
        """Write initial MDX files to disk for mint dev testing"""
        import os

        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)

        # Write each MDX file
        for result in research_results:
            topic = result['topic']
            mdx_content = result['mdx_content']

            if hasattr(topic, 'target_filename'):
                filename = topic.target_filename
            else:
                filename = topic.get('target_filename', 'unknown.mdx')

            file_path = os.path.join(self.output_dir, filename)

            # Create directory if needed
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Write MDX file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(mdx_content)

        # Write basic docs.json if it doesn't exist
        docs_json_path = os.path.join(self.output_dir, 'docs.json')
        if not os.path.exists(docs_json_path):
            # Extract page names from research results
            pages = []
            for result in research_results[:5]:  # Limit for testing
                topic = result['topic']
                if hasattr(topic, 'target_filename'):
                    filename = topic.target_filename
                elif isinstance(topic, dict):
                    filename = topic.get('target_filename', 'unknown.mdx')
                else:
                    filename = 'unknown.mdx'

                page_name = filename.replace('.mdx', '')
                pages.append(page_name)

            basic_docs_json = {
                "$schema": "https://mintlify.com/docs.json",
                "theme": "mint",
                "name": "Test Documentation",
                "description": "Generated documentation for validation",
                "navigation": {
                    "groups": [
                        {
                            "group": "Documentation",
                            "icon": "book",
                            "pages": pages
                        }
                    ]
                }
            }

            with open(docs_json_path, 'w', encoding='utf-8') as f:
                json.dump(basic_docs_json, f, indent=2)

    async def _write_updated_files(self, research_results: List[Dict]):
        """Write only the MDX files to disk (not docs.json)"""
        import os

        for result in research_results:
            topic = result['topic']
            mdx_content = result['mdx_content']

            if hasattr(topic, 'target_filename'):
                filename = topic.target_filename
            elif isinstance(topic, dict):
                filename = topic.get('target_filename', 'unknown.mdx')
            else:
                filename = 'unknown.mdx'

            file_path = os.path.join(self.output_dir, filename)

            # Create directory if needed
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Write updated MDX file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(mdx_content)

    async def _iterative_mint_validation(self, research_results: List[Dict]) -> List[Dict]:
        """Run MDX validation iteratively using @mintlify/mdx serialize and fix parsing errors until clean"""
        max_iterations = 3
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            logger.info(f"🔍 MDX validation iteration {iteration}/{max_iterations}")

            # Run MDX validation using @mdx-js/mdx compile
            parsing_errors = await self._validate_mdx_with_compile()

            if not parsing_errors:
                logger.info("✅ No MDX parsing errors found! Validation complete.")
                break

            logger.info(f"Found {len(parsing_errors)} MDX parsing errors to fix")

            # Fix errors for each affected file
            for error in parsing_errors:
                await self._fix_specific_parsing_error(error, research_results)

            # Write updated files to disk for next iteration
            logger.info(f"📝 Writing {len(research_results)} updated files to disk")
            await self._write_updated_files(research_results)

        if iteration >= max_iterations:
            logger.warning(f"⚠️ Reached maximum iterations ({max_iterations}). Some MDX errors may remain.")

        return research_results

    async def _validate_mdx_with_compile(self) -> List[Dict]:
        """Validate MDX files using @mdx-js/mdx compile function"""
        import subprocess
        import json
        import tempfile
        import os
        import shutil

        parsing_errors = []

        try:
            # Create a temporary Node.js script for validation
            validation_script = """
import { compile } from '@mdx-js/mdx';
import fs from 'fs';
import path from 'path';

async function validateMdxFiles(outputDir) {
    const errors = [];

    // Find all .mdx files in the output directory
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

            // Try to compile the MDX content - this will throw if there are errors
            await compile(content);

            // If we get here, the MDX is valid

        } catch (error) {
            // Extract relative path for consistency
            const relativePath = path.relative(outputDir, filePath);

            // Parse error details from the error object
            let line = 1;
            let column = 1;
            let message = error.message || 'MDX compilation failed';

            // Try to extract line/column info from error message
            const lineMatch = message.match(/line (\\d+)/i);
            const columnMatch = message.match(/column (\\d+)/i);

            if (lineMatch) {
                line = parseInt(lineMatch[1]);
            }
            if (columnMatch) {
                column = parseInt(columnMatch[1]);
            }

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

// Main execution
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

            # Write the validation script to a temporary file with .mjs extension for ES modules
            with tempfile.NamedTemporaryFile(mode='w', suffix='.mjs', delete=False) as script_file:
                script_file.write(validation_script)
                script_path = script_file.name

            try:
                # Run the validation script from the project root where @mdx-js/mdx is installed
                # This ensures we can access the installed package
                project_root = os.path.dirname(os.path.abspath(__file__))

                # Copy the script to the project root to ensure module resolution works
                project_script_path = os.path.join(project_root, 'temp_mdx_validator.mjs')
                shutil.copy2(script_path, project_script_path)

                try:
                    result = subprocess.run(
                        ['node', 'temp_mdx_validator.mjs', self.output_dir],
                        cwd=project_root,  # Run from project root to access node_modules
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                finally:
                    # Clean up the copied script
                    try:
                        os.unlink(project_script_path)
                    except:
                        pass

                if result.returncode == 0:
                    # Parse the JSON output
                    try:
                        parsing_errors = json.loads(result.stdout)
                        logger.info(f"MDX validation completed: {len(parsing_errors)} errors found")
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse validation output: {result.stdout}")
                        parsing_errors = []
                else:
                    logger.error(f"Validation script failed: {result.stderr}")
                    parsing_errors = []

            finally:
                # Clean up the temporary script file
                try:
                    os.unlink(script_path)
                except:
                    pass

        except subprocess.TimeoutExpired:
            logger.warning("MDX validation timed out")
            return []
        except Exception as e:
            logger.error(f"Error during MDX validation: {e}")
            return []

        return parsing_errors

    async def _fix_specific_parsing_error(self, error: Dict, research_results: List[Dict]):
        """Fix a specific parsing error using LLM with exact error context"""

        # Find the research result for this file
        target_file = error['file']
        result_to_fix = None

        for result in research_results:
            topic = result['topic']
            if hasattr(topic, 'target_filename'):
                filename = topic.target_filename
            elif isinstance(topic, dict):
                filename = topic.get('target_filename', '')
            else:
                filename = ''

            if filename == target_file:
                result_to_fix = result
                break

        if not result_to_fix:
            logger.warning(f"Could not find research result for file: {target_file}")
            return

        logger.info(f"🔧 Fixing error in {target_file} at line {error['line']}: {error['message']}")

        # Get the current content and fix the specific error
        current_content = result_to_fix['mdx_content']
        logger.debug(f"Original content starts with: {current_content[:100]}...")

        fixed_content = await self._fix_mdx_with_specific_error(current_content, error)
        logger.debug(f"Fixed content starts with: {fixed_content[:100]}...")

        # Update the research result
        result_to_fix['mdx_content'] = fixed_content
        logger.info(f"✅ Updated content for {target_file}")

    async def _fix_mdx_with_specific_error(self, mdx_content: str, error: Dict) -> str:
        """Fix MDX content based on specific mint dev error"""

        lines = mdx_content.split('\n')
        error_line_num = error['line'] - 1  # Convert to 0-based

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

CORRECT FORMAT - file should start like this:
---
title: "Page Title"
description: "Page description"
---

# Page Content

Your content here...

The response should start directly with the frontmatter (---) or content, never with ``` or ```yaml or ```mdx.

{mdx_content}
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Clean up the response - remove markdown code fences if present
        cleaned_response = response_text.strip()

        # Remove leading/trailing code fences that LLMs sometimes add
        if cleaned_response.startswith('```'):
            lines = cleaned_response.split('\n')
            # Remove first line if it's just ```
            if lines[0].strip() == '```' or lines[0].strip().startswith('```'):
                lines = lines[1:]
            # Remove last line if it's just ```
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned_response = '\n'.join(lines)

        return cleaned_response

class MintlifyContentSynthesizer(processor.Processor):
    """Synthesizes research results into MULTIPLE MDX files and docs.json configuration"""

    def __init__(self, api_key: str, output_dir: str = "./mintlify-docs", provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.output_dir = output_dir
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"
            elif provider.lower() == "custom":
                model_name = "gpt-4o"
            else:
                model_name = "gemini-2.5-flash"

        model_kwargs = {
            "api_key": api_key,
            "model_name": model_name,
            "provider": provider,
            "temperature": 0.7
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.genai_model = create_model_instance(**model_kwargs)

        # Storage for research results
        self.research_results = []
        self.repo_info = None

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Collect research results and synthesize into multiple MDX files"""

        # Collect all research results first
        try:
            async for part in content:
                # Debug logging
                logger.debug(f"Processing part: {type(part)}, hasattr mimetype: {hasattr(part, 'mimetype')}")

                # Check if part is actually a ProcessorPart object
                if hasattr(part, 'mimetype'):
                    logger.debug(f"Part mimetype: {part.mimetype}")

                    if part.mimetype == "application/json; type=MintlifyResearchResult":
                        # Get research result from metadata or parse JSON
                        research_result = part.get_metadata("mintlify_research_result")
                        if research_result is None:
                            research_result = json.loads(part.text)

                        self.research_results.append(research_result)
                        # Handle both object and dict formats for topic
                        try:
                            if hasattr(research_result, 'get') and 'topic' in research_result:
                                topic = research_result['topic']
                                if hasattr(topic, 'target_filename'):
                                    target_filename = topic.target_filename
                                else:
                                    target_filename = topic.get('target_filename', 'unknown')
                            else:
                                target_filename = getattr(research_result.get('topic', {}), 'target_filename', 'unknown')
                            logger.info(f"Collected research result for: {target_filename}")
                        except Exception as e:
                            logger.warning(f"Error accessing target_filename: {e}")
                            logger.info(f"Collected research result (filename unknown)")

                    elif part.mimetype == "application/json; type=MintlifyRepositoryInfo":
                        # Store repo info for docs.json generation
                        self.repo_info = part.get_metadata("mintlify_repo_info")
                        if self.repo_info is None:
                            self.repo_info = json.loads(part.text)

                    # Pass through status updates
                    elif hasattr(part, 'substream_name') and part.substream_name == "status":
                        yield part
                else:
                    # Skip non-ProcessorPart objects
                    logger.warning(f"Skipping non-ProcessorPart object: {type(part)}")
                    continue
        except Exception as e:
            logger.error(f"Error in content synthesizer: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise

        # After collecting all results, synthesize the documentation
        if self.research_results:
            logger.info(f"Synthesizing {len(self.research_results)} research results into Mintlify documentation")

            # Create the documentation structure
            documentation = await self._create_mintlify_documentation()

            # Write all files to disk
            await self._write_documentation_files(documentation)

            # Yield research results for validator to process
            for research_result in self.research_results:
                # Convert MintlifyTopic object to dict if needed for JSON serialization
                serializable_result = research_result.copy()
                topic = serializable_result['topic']

                if hasattr(topic, 'to_dict'):
                    topic_dict = topic.to_dict()
                elif hasattr(topic, '__dict__'):
                    topic_dict = {
                        'topic_name': getattr(topic, 'topic_name', 'Unknown'),
                        'description': getattr(topic, 'description', ''),
                        'target_filename': getattr(topic, 'target_filename', 'unknown.mdx'),
                        'section': getattr(topic, 'section', 'general'),
                        'relevant_files': getattr(topic, 'relevant_files', []),
                        'research_questions': getattr(topic, 'research_questions', []),
                        'mintlify_components': getattr(topic, 'mintlify_components', []),
                        'priority': getattr(topic, 'priority', 1),
                        'research_text': getattr(topic, 'research_text', '')
                    }
                else:
                    topic_dict = topic  # Already a dict

                serializable_result['topic'] = topic_dict

                result_json = json.dumps(serializable_result)
                research_part = content_api.ProcessorPart(
                    result_json,
                    mimetype="application/json; type=MintlifyResearchResult",
                    metadata={"mintlify_research_result": serializable_result}
                )
                yield research_part

            # Yield repository info if available
            if self.repo_info:
                repo_json = json.dumps(self.repo_info)
                repo_part = content_api.ProcessorPart(
                    repo_json,
                    mimetype="application/json; type=MintlifyRepositoryInfo",
                    metadata={"mintlify_repo_info": self.repo_info}
                )
                yield repo_part

            # Yield final result
            result_json = json.dumps({
                'project_name': documentation.project_name,
                'description': documentation.description,
                'total_pages': documentation.total_pages,
                'output_directory': self.output_dir,
                'sections': [section.to_dict() if hasattr(section, 'to_dict') else section for section in documentation.sections],
                'docs_json_path': os.path.join(self.output_dir, 'docs.json')
            })

            final_part = content_api.ProcessorPart(
                result_json,
                mimetype="application/json; type=MintlifyDocumentation",
                metadata={"mintlify_documentation": documentation}
            )
            yield final_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"✅ Generated {documentation.total_pages} MDX files in {self.output_dir}",
                substream_name="status"
            )
            yield completion_part

    async def _create_mintlify_documentation(self) -> MintlifyDocumentation:
        """Create the complete Mintlify documentation structure"""

        # Determine project name from repo info
        project_name = "Project Documentation"
        description = "Comprehensive documentation generated by Mintlify Research Agent"

        if self.repo_info:
            repo_path = self.repo_info.get('path', '')
            project_name = os.path.basename(repo_path) or "Project Documentation"

        # Group research results by section
        sections_dict = {}
        for result in self.research_results:
            topic = result['topic']

            # Handle both object and dict formats for topic
            if hasattr(topic, 'section'):
                section_name = topic.section
                topic_name = topic.topic_name
                description = topic.description
                target_filename = topic.target_filename
                mintlify_components = topic.mintlify_components
            else:
                section_name = topic.get('section', 'general')
                topic_name = topic.get('topic_name', 'Unknown Topic')
                description = topic.get('description', '')
                target_filename = topic.get('target_filename', 'unknown.mdx')
                mintlify_components = topic.get('mintlify_components', [])

            if section_name not in sections_dict:
                sections_dict[section_name] = {
                    'section_name': section_name.replace('-', ' ').title(),
                    'pages': [],
                    'icon': self._get_section_icon(section_name),
                    'description': self._get_section_description(section_name)
                }

            # Create MintlifyPage from research result
            page = MintlifyPage(
                title=topic_name,
                description=description,
                filename=target_filename,
                content=result['mdx_content'],
                frontmatter=self._extract_frontmatter(result['mdx_content']),
                components_used=mintlify_components,
                section=section_name
            )

            sections_dict[section_name]['pages'].append(page)

        # Convert to MintlifySection objects
        sections = []
        for section_data in sections_dict.values():
            section = MintlifySection(
                section_name=section_data['section_name'],
                pages=section_data['pages'],
                icon=section_data['icon'],
                description=section_data['description']
            )
            sections.append(section)

        # Generate docs.json configuration
        docs_json = self._generate_docs_json(sections, project_name, description)

        # Create navigation structure
        navigation_structure = self._create_navigation_structure(sections)

        total_pages = sum(len(section.pages) for section in sections)

        return MintlifyDocumentation(
            project_name=project_name,
            description=description,
            sections=sections,
            docs_json=docs_json,
            navigation_structure=navigation_structure,
            total_pages=total_pages
        )

    def _get_section_icon(self, section_name: str) -> str:
        """Get appropriate icon for section"""
        icon_map = {
            'getting-started': 'rocket',
            'api-reference': 'terminal',
            'configuration': 'gear',
            'guides': 'book',
            'architecture': 'building',
            'reference': 'asterisk',
            'general': 'file-text'
        }
        return icon_map.get(section_name, 'file-text')

    def _get_section_description(self, section_name: str) -> str:
        """Get appropriate description for section"""
        desc_map = {
            'getting-started': 'Quick setup and installation guide',
            'api-reference': 'Complete API documentation and endpoints',
            'configuration': 'Configuration and environment setup',
            'guides': 'Step-by-step guides and tutorials',
            'architecture': 'System architecture and design patterns',
            'reference': 'Detailed reference documentation',
            'general': 'General documentation'
        }
        return desc_map.get(section_name, 'Documentation')

    def _extract_frontmatter(self, mdx_content: str) -> Dict[str, Any]:
        """Extract YAML frontmatter from MDX content"""
        if mdx_content.startswith('---'):
            try:
                # Find the end of frontmatter
                end_index = mdx_content.find('---', 3)
                if end_index > 0:
                    frontmatter_text = mdx_content[3:end_index].strip()
                    import yaml
                    return yaml.safe_load(frontmatter_text) or {}
            except Exception as e:
                logger.warning(f"Failed to parse frontmatter: {e}")

        return {}

    def _generate_docs_json(self, sections: List[MintlifySection], project_name: str, description: str) -> Dict[str, Any]:
        """Generate docs.json configuration for Mintlify"""

        # Build navigation groups structure
        navigation_groups = []

        for section in sections:
            # Create page list for this section
            pages = []
            for page in section.pages:
                # Remove .mdx extension for navigation
                page_path = page.filename.replace('.mdx', '')
                pages.append(page_path)

            group = {
                'group': section.section_name,
                'icon': section.icon,
                'pages': pages
            }
            navigation_groups.append(group)

        docs_json = {
            '$schema': 'https://mintlify.com/docs.json',
            'theme': 'mint',
            'name': project_name,
            'description': description,
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
            },
            'footer': {
                'socials': {
                    'github': 'https://github.com/your-org/your-repo'
                }
            }
        }

        # Add API configuration if we have API sections
        has_api = any('api' in section.section_name.lower() for section in sections)
        if has_api:
            docs_json['api'] = {
                'playground': {
                    'display': 'interactive'
                },
                'examples': {
                    'languages': ['javascript', 'python', 'curl']
                }
            }

        return docs_json

    def _create_navigation_structure(self, sections: List[MintlifySection]) -> Dict[str, Any]:
        """Create navigation structure for reference"""
        navigation = {}

        for section in sections:
            section_pages = []
            for page in section.pages:
                section_pages.append({
                    'title': page.title,
                    'filename': page.filename,
                    'description': page.description
                })

            navigation[section.section_name] = {
                'icon': section.icon,
                'description': section.description,
                'pages': section_pages
            }

        return navigation

    async def _write_documentation_files(self, documentation: MintlifyDocumentation):
        """Write all MDX files and docs.json to disk"""

        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)

        # Write docs.json
        docs_json_path = os.path.join(self.output_dir, 'docs.json')
        with open(docs_json_path, 'w', encoding='utf-8') as f:
            json.dump(documentation.docs_json, f, indent=2, ensure_ascii=False)

        logger.info(f"✅ Written docs.json to {docs_json_path}")

        # Write each MDX file
        for section in documentation.sections:
            for page in section.pages:
                # Create directory structure if needed
                file_path = os.path.join(self.output_dir, page.filename)
                file_dir = os.path.dirname(file_path)

                if file_dir and file_dir != self.output_dir:
                    os.makedirs(file_dir, exist_ok=True)

                # Write MDX content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(page.content)

                logger.info(f"✅ Written {page.filename}")

        logger.info(f"🎉 Successfully generated {documentation.total_pages} MDX files in {self.output_dir}")

class MintlifyResearchAgent(processor.Processor):
    """Main agent that orchestrates the complete Mintlify documentation generation pipeline"""

    def __init__(self, api_key: str, repo_path: str, num_topics: int = 8, use_rag: bool = True,
                 output_dir: str = "./mintlify-docs", provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.repo_path = repo_path
        self.num_topics = num_topics
        self.use_rag = use_rag
        self.output_dir = output_dir
        self.provider = provider
        self.model_name = model_name
        self.base_url = base_url

        # RAG will be initialized later with the actual repository path
        self.rag = None

        # Initialize processors
        self.file_analyzer = MintlifyFileTreeAnalyzer(api_key, provider, model_name, base_url)
        self.topic_generator = MintlifyTopicGenerator(api_key, num_topics, provider, model_name, base_url)
        # Topic researcher will be initialized after RAG is set up
        self.topic_researcher = None
        self.mdx_validator = MintlifyMDXValidator(api_key, output_dir, provider, model_name, base_url)
        self.content_synthesizer = MintlifyContentSynthesizer(api_key, output_dir, provider, model_name, base_url)

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute the complete Mintlify documentation generation pipeline"""

        logger.info("🚀 Starting Mintlify Research Agent pipeline")

        # Stage 1: Analyze repository structure
        logger.info("📁 Stage 1: Analyzing repository structure for Mintlify organization")
        analyzed_stream = self.file_analyzer(content)

        # Initialize RAG after we have the actual repository path
        actual_repo_path = None
        async for part in analyzed_stream:
            if part.mimetype == "application/json; type=MintlifyRepositoryInfo":
                # Get the actual repository path from the analyzer
                repo_info = part.get_metadata("mintlify_repo_info")
                if repo_info is None:
                    repo_info = json.loads(part.text)
                actual_repo_path = repo_info.get('path')

                # Initialize RAG with the actual path
                if self.use_rag and RAG is not None and actual_repo_path and self.rag is None:
                    try:
                        logger.info(f"Initializing RAG for repository analysis at: {actual_repo_path}")
                        self.rag = RAG(provider="google", model="gemini-2.0-flash")
                        self.rag.prepare_retriever(actual_repo_path)
                        logger.info(f"RAG retriever ready with {len(getattr(self.rag, 'transformed_docs', []))} documents")
                    except Exception as e:
                        logger.warning(f"Failed to initialize RAG: {e}. Proceeding without RAG.")
                        logger.debug(f"RAG initialization error: {e}")
                        import traceback
                        logger.debug(f"RAG error traceback: {traceback.format_exc()}")
                        self.rag = None

                # Initialize topic researcher now that we have RAG
                if self.topic_researcher is None:
                    self.topic_researcher = MintlifyTopicResearcher(
                        self.api_key, self.rag, self.provider, self.model_name, self.base_url
                    )

                # Yield this part and break to continue with the pipeline
                yield part
                break
            else:
                yield part

        # Create a new stream from the analyzed content for the topic generator
        analyzed_parts = []
        if 'part' in locals():  # Add the repo info part if we processed one
            analyzed_parts.append(part)
        async for part in analyzed_stream:
            analyzed_parts.append(part)

        # Stage 2: Generate Mintlify-optimized topics
        logger.info("🎯 Stage 2: Generating Mintlify-optimized research topics")
        analyzed_content_stream = streams.stream_content(analyzed_parts)
        topics_stream = self.topic_generator(analyzed_content_stream)

        # Stage 3: Research topics in parallel and format for MDX
        logger.info("🔍 Stage 3: Researching topics and formatting for Mintlify MDX")

        # Collect all parts from topics_stream first
        topic_parts = []
        repo_info_part = None
        status_parts = []

        async for part in topics_stream:
            if part.mimetype == "application/json; type=MintlifyTopic":
                topic_parts.append(part)
            elif part.mimetype == "application/json; type=MintlifyRepositoryInfo":
                repo_info_part = part
            elif part.substream_name == "status":
                status_parts.append(part)
                # Yield status updates immediately
                yield part

        # Create research streams for each topic
        research_streams = []

        # Add repo info to research streams if available
        if repo_info_part:
            async def repo_info_stream():
                yield repo_info_part
            research_streams.append(repo_info_stream())

        # Create individual research streams for each topic
        for topic_part in topic_parts:
            # Create a closure to capture the topic_part correctly
            def create_research_stream(captured_part):
                async def research_stream():
                    # Process this topic part directly through the researcher
                    if self.topic_researcher.match(captured_part):
                        async for research_part in self.topic_researcher.call(captured_part):
                            yield research_part
                    else:
                        # Pass through non-matching parts
                        yield captured_part
                return research_stream()

            research_streams.append(create_research_stream(topic_part))

        # Merge all research results
        if research_streams:
            logger.info(f"Merging {len(research_streams)} research streams")
            merged_research = streams.merge(research_streams)
        else:
            # Fallback if no research streams
            logger.warning("No research streams to merge, using empty stream")
            merged_research = streams.stream_content([])

        # Stage 4: Synthesize into multiple MDX files + docs.json (without validation)
        logger.info("� Stage 4: Synthesizing multiple MDX files and docs.json configuration")
        synthesized_research = self.content_synthesizer(merged_research)

        # Stage 5: Validate and fix MDX content using actual files
        logger.info("� Stage 5: Validating and fixing MDX parsing errors")
        async for part in self.mdx_validator(synthesized_research):
            yield part

# Convenience function for easy usage
async def generate_mintlify_docs_for_repository(
    repo_path: str,
    api_key: str,
    num_topics: int = 8,
    use_rag: bool = True,
    output_dir: str = "./mintlify-docs",
    provider: str = "google",
    model_name: str = None,
    base_url: str = None
) -> Dict[str, Any]:
    """
    Generate Mintlify documentation for a repository

    Args:
        repo_path: Path to repository or GitHub URL
        api_key: API key for the AI provider
        num_topics: Number of documentation topics to generate (default: 8)
        use_rag: Whether to use RAG for enhanced research (default: True)
        output_dir: Output directory for generated documentation (default: "./mintlify-docs")
        provider: AI provider ("google", "openai", "openrouter", "custom")
        model_name: Specific model to use (optional)
        base_url: Base URL for custom provider (required for custom provider)

    Returns:
        Dictionary with generation results and file paths
    """

    # Create the research agent
    agent = MintlifyResearchAgent(api_key, repo_path, num_topics, use_rag, output_dir, provider, model_name, base_url)

    # Create input stream with repository path
    input_stream = streams.stream_content([repo_path])

    # Execute the pipeline and collect results
    documentation_result = None
    async for part in agent(input_stream):
        if part.mimetype == "application/json; type=MintlifyDocumentation":
            documentation_result = json.loads(part.text)
            logger.info("✅ Mintlify documentation generation completed successfully")
        elif part.substream_name == "status":
            logger.info(f"Status: {part.text}")
        elif part.substream_name == "error":
            logger.error(f"Error: {part.text}")

    return documentation_result or {}

# CLI Interface
if __name__ == "__main__":
    import argparse
    import sys

    def main():
        parser = argparse.ArgumentParser(
            description="Generate Mintlify documentation from repository analysis",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  # Generate Mintlify docs with RAG using Google Gemini
  python mintlify_research_agent.py /path/to/repo YOUR_GOOGLE_API_KEY --output ./mintlify-docs

  # Generate docs using OpenAI GPT-4o
  python mintlify_research_agent.py /path/to/repo YOUR_OPENAI_API_KEY --provider openai --model gpt-4o --output ./docs

  # Generate docs using OpenRouter with Claude
  python mintlify_research_agent.py /path/to/repo YOUR_OPENROUTER_API_KEY --provider openrouter --model anthropic/claude-3.5-sonnet --output ./docs

  # Custom number of topics with specific model
  python mintlify_research_agent.py /path/to/repo YOUR_API_KEY --provider google --model gemini-2.5-pro --topics 10 --output ./docs

  # Use environment variable for API key
  export OPENROUTER_API_KEY="your-key"
  python mintlify_research_agent.py . --provider openrouter --model anthropic/claude-3.5-sonnet --output ./documentation
            """
        )

        parser.add_argument("repo_path", help="Path to repository or GitHub URL")
        parser.add_argument("api_key", nargs="?", help="API key for the AI provider (or use environment variable)")
        parser.add_argument("--output", "-o", default="./mintlify-docs", help="Output directory for generated documentation (default: ./mintlify-docs)")
        parser.add_argument("--topics", "-t", type=int, default=8, help="Number of documentation topics to generate (default: 8)")
        parser.add_argument("--provider", "-p", choices=["google", "openai", "openrouter", "custom"], default="google", help="AI provider (default: google)")
        parser.add_argument("--model", "-m", help="Specific model to use (optional)")
        parser.add_argument("--base-url", help="Base URL for custom provider")
        parser.add_argument("--no-rag", action="store_true", help="Disable RAG functionality")
        parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")

        args = parser.parse_args()

        # Set up logging
        if args.verbose:
            logging.getLogger().setLevel(logging.DEBUG)

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
                print(f"Error: API key not provided. Either pass it as an argument or set {env_var} environment variable.")
                sys.exit(1)

        # Validate custom provider requirements
        if args.provider == "custom" and not args.base_url:
            print("Error: --base-url is required when using custom provider")
            sys.exit(1)

        print(f"🚀 Starting Mintlify Research Agent")
        print(f"📁 Repository: {args.repo_path}")
        print(f"🤖 Provider: {args.provider}")
        print(f"📝 Topics: {args.topics}")
        print(f"📂 Output: {args.output}")
        print(f"🔍 RAG: {'Enabled' if not args.no_rag else 'Disabled'}")
        print()

        async def run_generation():
            try:
                result = await generate_mintlify_docs_for_repository(
                    repo_path=args.repo_path,
                    api_key=api_key,
                    num_topics=args.topics,
                    use_rag=not args.no_rag,
                    output_dir=args.output,
                    provider=args.provider,
                    model_name=args.model,
                    base_url=args.base_url
                )

                if result:
                    print(f"\n🎉 Successfully generated Mintlify documentation!")
                    print(f"📊 Generated {result.get('total_pages', 0)} MDX files")
                    print(f"📂 Output directory: {result.get('output_directory', args.output)}")
                    print(f"⚙️  Configuration: {result.get('docs_json_path', 'docs.json')}")
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
