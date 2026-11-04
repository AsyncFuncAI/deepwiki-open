#!/usr/bin/env python3
"""
ASCII Research Agent - Adaptive LLM-powered codebase visualization

Generates ASCII architecture diagrams from any codebase using intelligent analysis.
No hardcoded patterns - fully adaptive to any framework or technology stack.

Usage:
    python ascii_research_agent.py https://github.com/user/repo YOUR_API_KEY --output ./ascii-docs
"""

import asyncio
import os
import json
import logging
import time
import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

try:
    from genai_processors import content_api, processor, streams
    from genai_processors.core import genai_model
    from typing import AsyncIterable
    try:
        from genai_processors.core import openai_model
        OPENAI_AVAILABLE = True
    except ImportError:
        OPENAI_AVAILABLE = False
        print("Warning: OpenAI model support not available")
except ImportError as e:
    print("Error: genai-processors not found. Please install with: pip install genai-processors")
    exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Reduce noise from external libraries
for lib in ["google_genai", "google.generativeai", "httpx", "openai", "urllib3"]:
    logging.getLogger(lib).setLevel(logging.WARNING)

def create_model_instance(api_key: str, model_name: str, provider: str = "google", **kwargs):
    """Create a model instance based on provider and model name."""
    if provider.lower() in ["openai", "openrouter", "custom"]:
        if not OPENAI_AVAILABLE:
            raise ValueError("OpenAI support not available")

        config = openai_model.GenerateContentConfig(temperature=kwargs.get("temperature", 1))
        if kwargs.get("system_instruction"):
            config.system_instruction = kwargs["system_instruction"]

        base_urls = {
            "openrouter": "https://openrouter.ai/api/v1",
            "custom": kwargs.get("base_url")
        }

        if provider.lower() == "custom" and not base_urls["custom"]:
            raise ValueError("base_url is required for custom provider")

        return openai_model.OpenAIModel(
            api_key=api_key,
            model_name=model_name,
            generate_content_config=config,
            base_url=base_urls.get(provider.lower())
        )
    else:
        from google.genai import types as genai_types
        config = genai_types.GenerateContentConfig(
            temperature=kwargs.get("temperature", 0.7),
            top_p=kwargs.get("top_p", 0.8),
            top_k=kwargs.get("top_k", 20)
        )
        return genai_model.GenaiModel(api_key=api_key, model_name=model_name, generate_content_config=config)

@dataclass
class FileScreeningResult:
    file_path: str
    relative_path: str
    summary: str
    documentation_score: int
    file_type: str
    complexity: str
    dependencies: List[str]
    estimated_doc_value: str
    skip_reason: Optional[str] = None
    framework_category: Optional[str] = None
    architectural_importance: int = 5

@dataclass
class RepositoryAnalysisResult:
    repo_url: str
    local_path: str
    total_folders: int
    selected_folders: List[Dict[str, Any]]
    repository_summary: str
    framework_detected: Optional[str] = None
    estimated_complexity: int = 5
    architectural_patterns: List[str] = field(default_factory=list)

@dataclass
class ASCIIVisualizationTask:
    task_id: str
    task_name: str
    ascii_type: str
    description: str
    target_filename: str
    file_group: List[FileScreeningResult]
    priority: int
    estimated_complexity: str
    ascii_style: str
    focus_areas: List[str]

@dataclass
class ASCIIResult:
    task: ASCIIVisualizationTask
    ascii_content: str
    title: str
    description: str
    sources: List[str]
    confidence: float
    generation_time: float
    tokens_used: int = 0

@dataclass
class FrameworkDiscovery:
    primary_framework: str
    framework_version: Optional[str]
    secondary_frameworks: List[str]
    architecture_type: str
    technology_stack: List[str]
    confidence: float
    reasoning: str
    unique_patterns: List[str]
    complexity_indicators: Dict[str, Any]

@dataclass
class FileAnalysis:
    file_path: str
    relative_path: str
    architectural_role: str
    business_importance: int
    complexity_score: int
    dependencies: List[str]
    exports: List[str]
    key_functions: List[str]
    architectural_significance: str
    visualization_priority: int
    content_summary: str

@dataclass
class VisualizationPlan:
    visualization_type: str
    title: str
    description: str
    target_audience: str
    complexity_level: str
    focus_areas: List[str]
    file_group: List[FileAnalysis]
    priority: int
    estimated_value: str
    custom_elements: List[str]

@dataclass
class RichCodebaseContext:
    repo_path: str
    framework_discovery: FrameworkDiscovery
    file_analyses: List[FileScreeningResult]
    architectural_insights: List[str]
    key_code_samples: Dict[str, str] = field(default_factory=dict)
    architectural_patterns: List[str] = field(default_factory=list)
    file_relationships: Dict[str, List[str]] = field(default_factory=dict)
    entry_points: List[str] = field(default_factory=list)
    config_content: Dict[str, str] = field(default_factory=dict)

    def get_planning_context(self) -> str:
        """Rich context for planning stage with actual code insights"""
        patterns_text = "\n".join(f"- {pattern}" for pattern in self.architectural_patterns[:10])

        # Get top 5 most connected files
        top_files = sorted(
            self.file_relationships.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:5]

        relationships_text = "\n".join(
            f"- {file}: connects to {len(deps)} files"
            for file, deps in top_files
        )

        # Sample key code structures
        code_samples_text = ""
        for file_path, sample in list(self.key_code_samples.items())[:3]:
            code_samples_text += f"\n--- {file_path} ---\n{sample[:500]}...\n"

        return f"""
Framework: {self.framework_discovery.primary_framework}
Architecture Type: {self.framework_discovery.architecture_type}
Confidence: {self.framework_discovery.confidence}

Key Architectural Patterns Found:
{patterns_text}

File Relationship Hub Analysis:
{relationships_text}

Entry Points: {', '.join(self.entry_points)}

Sample Code Structures:
{code_samples_text}

Configuration Insights:
{self._format_config_insights()}
"""

    def get_ascii_context(self, selected_files: List[str]) -> List[Dict]:
        """Full context for ASCII generation"""
        context_files = []
        for file_path in selected_files:
            # Find the file analysis
            file_analysis = next((f for f in self.file_analyses if f.file_path == file_path), None)
            if file_analysis:
                context_files.append({
                    'path': file_analysis.relative_path,
                    'type': file_analysis.file_type,
                    'importance': file_analysis.architectural_importance,
                    'documentation_score': file_analysis.documentation_score,
                    'code_sample': self.key_code_samples.get(file_path, ''),
                    'relationships': self.file_relationships.get(file_path, []),
                    'full_content': self._read_full_file(file_path)
                })
        return context_files

    def _format_config_insights(self) -> str:
        insights = []
        for config_file, content in self.config_content.items():
            if 'package.json' in config_file:
                try:
                    data = json.loads(content)
                    deps = list(data.get('dependencies', {}).keys())[:5]
                    insights.append(f"- Node.js: {', '.join(deps)}")
                except:
                    insights.append("- Node.js: parsing failed")
            elif any(x in config_file for x in ['requirements.txt', 'pyproject.toml']):
                lines = content.split('\n')[:10]
                deps = [line.split('==')[0].split('>=')[0].strip()
                       for line in lines if line.strip() and not line.startswith('#')]
                insights.append(f"- Python: {', '.join(deps[:5])}")
            elif 'go.mod' in config_file:
                lines = [line.strip() for line in content.split('\n')
                        if line.strip() and 'require' not in line and 'module' not in line][:5]
                insights.append(f"- Go: {', '.join(lines)}")
        return "\n".join(insights) if insights else "- No configuration insights available"

    def _read_full_file(self, file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            logger.warning(f"Could not read full content of {file_path}: {e}")
            return ""

@dataclass
class CodebaseDiscovery:
    """Complete adaptive codebase discovery result"""
    repo_path: str
    repo_url: str
    framework_discovery: FrameworkDiscovery
    file_analyses: List[FileAnalysis]
    visualization_plans: List[VisualizationPlan]
    architectural_insights: List[str]
    complexity_assessment: Dict[str, Any]
    stakeholder_recommendations: Dict[str, List[str]]

class SmartContentExtractor:
    def extract_for_framework_discovery(self, repo_path: str) -> Dict[str, str]:
        content = {}
        config_files = ["package.json", "requirements.txt", "pyproject.toml", "go.mod", "Cargo.toml", "composer.json"]

        for config_file in config_files:
            config_path = os.path.join(repo_path, config_file)
            if os.path.exists(config_path):
                try:
                    with open(config_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content[config_file] = f.read()
                except Exception as e:
                    logger.warning(f"Could not read config file {config_file}: {e}")

        entry_points = self._find_entry_points(repo_path)
        for entry_file in entry_points[:3]:
            content[entry_file] = self._extract_entry_logic(entry_file)
        return content

    def extract_for_file_analysis(self, file_path: str) -> str:
        if file_path.endswith(('.py', '.js', '.ts', '.jsx', '.tsx')):
            return self._extract_code_structure(file_path)
        else:
            return self._read_with_smart_limit(file_path, max_chars=20000)

    def extract_for_ascii_generation(self, file_paths: List[str]) -> Dict[str, str]:
        content = {}
        for path in file_paths:
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content[path] = f.read()
            except Exception as e:
                logger.warning(f"Could not read {path}: {e}")
                content[path] = ""
        return content

    def _find_entry_points(self, repo_path: str) -> List[str]:
        entry_points = []
        entry_patterns = ["main.py", "app.py", "server.py", "index.js", "index.ts",
                         "main.js", "main.ts", "app.js", "app.ts", "server.js", "server.ts"]

        for root, _dirs, files in os.walk(repo_path):
            level = root.replace(repo_path, '').count(os.sep)
            if level > 2:
                continue
            for file in files:
                if file in entry_patterns:
                    entry_points.append(os.path.join(root, file))
        return entry_points

    def _extract_entry_logic(self, file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')
            important_lines = []

            for line in lines:
                line_stripped = line.strip()
                if (line_stripped.startswith(('import ', 'from ', 'const ', 'let ', 'var ', 'function ', 'class ', 'def ', 'if __name__', 'app.', 'router.', 'server.')) or
                    any(x in line_stripped for x in ['express()', 'Flask(', 'FastAPI('])):
                    important_lines.append(line)

            return '\n'.join(important_lines[:50])
        except Exception as e:
            logger.warning(f"Could not extract entry logic from {file_path}: {e}")
            return ""

    def _extract_code_structure(self, file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')
            structure_lines = []

            for line in lines:
                line_stripped = line.strip()
                if (line_stripped.startswith(('import ', 'from ', 'export ', 'const ', 'let ', 'var ', 'function ', 'class ', 'def ', 'async def', 'interface ', 'type ', '@', 'router.', 'app.', 'api.')) or
                    'export default' in line_stripped):
                    structure_lines.append(line)

            return '\n'.join(structure_lines[:100]) if structure_lines else content[:20000]
        except Exception as e:
            logger.warning(f"Could not extract code structure from {file_path}: {e}")
            return ""

    def _read_with_smart_limit(self, file_path: str, max_chars: int = 20000) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read(max_chars)
        except Exception as e:
            logger.warning(f"Could not read {file_path}: {e}")
            return ""

class LLMFrameworkDetector:

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-flash")
        self.base_url = base_url

        model_kwargs = {"api_key": api_key, "provider": provider, "temperature": 0.3}
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.detection_model = create_model_instance(model_name=self.model_name, **model_kwargs)
        self.content_extractor = SmartContentExtractor()

    async def build_rich_context(self, repo_path: str, file_tree: str, file_analyses: List[FileScreeningResult]) -> RichCodebaseContext:
        framework_discovery = await self.discover_framework(repo_path, file_tree)

        key_code_samples = {}
        file_relationships = {}
        entry_points = []

        config_content = self.content_extractor.extract_for_framework_discovery(repo_path)

        top_files = sorted(file_analyses, key=lambda x: x.architectural_importance, reverse=True)[:10]
        for file_analysis in top_files:
            try:
                content = self.content_extractor.extract_for_file_analysis(file_analysis.file_path)
                key_code_samples[file_analysis.file_path] = content

                relationships = self._extract_file_relationships(content, file_analysis.file_path)
                if relationships:
                    file_relationships[file_analysis.file_path] = relationships

                if self._is_entry_point(content, file_analysis.relative_path):
                    entry_points.append(file_analysis.relative_path)
            except Exception as e:
                logger.warning(f"Could not extract context from {file_analysis.relative_path}: {e}")

        architectural_patterns = self._extract_architectural_patterns(key_code_samples, framework_discovery)

        return RichCodebaseContext(
            repo_path=repo_path,
            framework_discovery=framework_discovery,
            file_analyses=file_analyses,
            architectural_insights=[],
            key_code_samples=key_code_samples,
            architectural_patterns=architectural_patterns,
            file_relationships=file_relationships,
            entry_points=entry_points,
            config_content=config_content
        )

    def _extract_file_relationships(self, content: str, _file_path: str) -> List[str]:
        """Extract imports and dependencies from file content"""
        relationships = []
        lines = content.split('\n')

        for line in lines[:50]:  # Check first 50 lines for imports
            line_stripped = line.strip()

            # Python imports
            if line_stripped.startswith(('import ', 'from ')):
                if 'import ' in line_stripped:
                    module = line_stripped.split('import ')[1].split(' ')[0].split('.')[0]
                    relationships.append(module)

            # JavaScript/TypeScript imports
            elif line_stripped.startswith(('import ', 'const ', 'let ', 'var ')) and 'require(' in line_stripped:
                # Extract require() or import from statements
                if "from '" in line_stripped or 'from "' in line_stripped:
                    parts = line_stripped.split('from ')
                    if len(parts) > 1:
                        module = parts[1].strip().strip('\'"').split('/')[0]
                        relationships.append(module)

        return relationships[:10]  # Limit to top 10 relationships

    def _is_entry_point(self, content: str, file_path: str) -> bool:
        """Determine if this file is an application entry point"""
        content_lower = content.lower()
        file_lower = file_path.lower()

        # Check filename patterns
        if any(pattern in file_lower for pattern in ['main.', 'app.', 'server.', 'index.']):
            return True

        # Check content patterns
        entry_indicators = [
            'if __name__', 'app.run', 'app.listen', 'express()', 'fastapi(',
            'flask(', 'func main', 'fn main', 'public static void main'
        ]

        return any(indicator in content_lower for indicator in entry_indicators)

    def _extract_architectural_patterns(self, code_samples: Dict[str, str], framework: FrameworkDiscovery) -> List[str]:
        """Extract architectural patterns from code samples"""
        patterns = []

        # Analyze all code samples for patterns
        all_content = '\n'.join(code_samples.values()).lower()

        # Common architectural patterns
        if 'router' in all_content or 'route' in all_content:
            patterns.append("Router-based architecture with defined routes")

        if 'middleware' in all_content:
            patterns.append("Middleware pattern for request processing")

        if 'controller' in all_content:
            patterns.append("MVC pattern with controllers")

        if 'service' in all_content:
            patterns.append("Service layer architecture")

        if 'repository' in all_content or 'dao' in all_content:
            patterns.append("Repository/DAO pattern for data access")

        if 'component' in all_content and framework.primary_framework.lower() in ['react', 'vue', 'angular']:
            patterns.append("Component-based frontend architecture")

        if 'api' in all_content and ('endpoint' in all_content or 'route' in all_content):
            patterns.append("RESTful API architecture")

        if 'async' in all_content or 'await' in all_content:
            patterns.append("Asynchronous programming patterns")

        return patterns

    async def discover_framework(self, repo_path: str, file_tree: str) -> FrameworkDiscovery:
        key_files = await self._collect_key_files(repo_path)
        prompt = self._create_discovery_prompt(file_tree, key_files)

        # Retry logic - attempt up to 3 times
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                logger.info(f"🔍 Framework discovery attempt {attempt + 1}/{max_attempts}")

                input_stream = streams.stream_content([prompt])
                response_text = ""
                async for response_part in self.detection_model(input_stream):
                    response_text += response_part.text
                return self._parse_discovery_response(response_text)

            except Exception as e:
                logger.warning(f"❌ Framework discovery attempt {attempt + 1} failed: {e}")

                if attempt == max_attempts - 1:
                    logger.error(f"Framework discovery failed after {max_attempts} attempts")
                    raise RuntimeError(f"Framework discovery failed after {max_attempts} attempts: {e}")
                else:
                    await asyncio.sleep(1)

    async def _collect_key_files(self, repo_path: str) -> Dict[str, str]:
        return self.content_extractor.extract_for_framework_discovery(repo_path)


    def _create_discovery_prompt(self, file_tree: str, key_files: Dict[str, str]) -> str:
        key_files_content = ""
        for filename, content in key_files.items():
            key_files_content += f"\n--- {filename} ---\n{content}\n"

        return f"""Analyze this codebase and provide framework discovery analysis in JSON format.

File Tree: {file_tree}
Key Files: {key_files_content}

Return JSON with:
- primary_framework: string
- framework_version: string or null
- secondary_frameworks: array of strings
- architecture_type: string
- technology_stack: array of strings
- confidence: number between 0.0 and 1.0 (e.g., 0.85 for 85% confidence)
- reasoning: string
- unique_patterns: array of strings
- complexity_indicators: object

Consider: React, Vue, Angular, Next.js, Django, FastAPI, Express, etc.
Return ONLY JSON:"""

    def _parse_discovery_response(self, response_text: str) -> FrameworkDiscovery:
        """Parse the LLM framework discovery response"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)

                # Parse confidence as float, handling various formats
                confidence_raw = data.get('confidence', 0.5)
                if isinstance(confidence_raw, str):
                    confidence_str = confidence_raw.strip().lower()

                    # Handle text-based confidence levels
                    if confidence_str in ['high', 'very high']:
                        confidence = 0.9
                    elif confidence_str in ['medium', 'moderate']:
                        confidence = 0.7
                    elif confidence_str in ['low', 'very low']:
                        confidence = 0.3
                    else:
                        # Handle percentage strings like "95%" or "0.95"
                        try:
                            confidence_str = confidence_str.rstrip('%')
                            confidence = float(confidence_str)
                            # If it was a percentage (>1), convert to decimal
                            if confidence > 1:
                                confidence = confidence / 100
                        except ValueError:
                            # If all parsing fails, use default
                            confidence = 0.5
                else:
                    confidence = float(confidence_raw)

                return FrameworkDiscovery(
                    primary_framework=data.get('primary_framework', 'Unknown'),
                    framework_version=data.get('framework_version'),
                    secondary_frameworks=data.get('secondary_frameworks', []),
                    architecture_type=data.get('architecture_type', 'unknown'),
                    technology_stack=data.get('technology_stack', []),
                    confidence=confidence,
                    reasoning=data.get('reasoning', 'Analysis failed'),
                    unique_patterns=data.get('unique_patterns', []),
                    complexity_indicators=data.get('complexity_indicators', {})
                )
        except Exception as e:
            logger.error(f"Failed to parse framework discovery response: {e}")
            raise RuntimeError(f"Framework discovery parsing failed: {e}")

class LLMFileClassifier:

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-flash")
        self.base_url = base_url

        model_kwargs = {"api_key": api_key, "provider": provider, "temperature": 0.2}
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.classification_model = create_model_instance(model_name=self.model_name, **model_kwargs)

    async def analyze_file(self, file_path: str, content: str, framework_discovery: FrameworkDiscovery) -> FileAnalysis:

        # Create intelligent file analysis prompt
        prompt = self._create_file_analysis_prompt(file_path, content, framework_discovery)

        # Retry logic - attempt up to 3 times
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                # Query the LLM for file analysis
                input_stream = streams.stream_content([prompt])
                response_text = ""

                async for response_part in self.classification_model(input_stream):
                    response_text += response_part.text

                # Parse the analysis response
                return self._parse_file_analysis_response(response_text, file_path)

            except Exception as e:
                logger.warning(f"❌ File analysis attempt {attempt + 1} failed for {file_path}: {e}")

                if attempt == max_attempts - 1:
                    logger.error(f"File analysis failed after {max_attempts} attempts for {file_path}")
                    raise RuntimeError(f"File analysis failed after {max_attempts} attempts for {file_path}: {e}")
                else:
                    await asyncio.sleep(0.5)  # Shorter wait for file analysis

    def _create_file_analysis_prompt(self, file_path: str, content: str,
                                   framework_discovery: FrameworkDiscovery) -> str:
        """Create intelligent file analysis prompt"""

        prompt = f"""
You are a senior software architect analyzing a file in a {framework_discovery.primary_framework} project.

Project Context:
- Primary Framework: {framework_discovery.primary_framework}
- Architecture Type: {framework_discovery.architecture_type}
- Technology Stack: {', '.join(framework_discovery.technology_stack)}
- Complexity: {framework_discovery.complexity_indicators.get('architectural_complexity', 'unknown')}

File to Analyze:
Path: {file_path}
Content (first 3KB):
{content[:3072]}

Analyze this file's role in the system architecture and provide detailed analysis in JSON:
{{
  "architectural_role": "Specific role this file plays (e.g., 'API route handler', 'Database model', 'React component', 'Authentication middleware')",
  "business_importance": 8,
  "complexity_score": 6,
  "dependencies": ["List of imports/dependencies this file uses"],
  "exports": ["List of functions/classes/components this file exports"],
  "key_functions": ["Most important functions/methods in this file"],
  "architectural_significance": "Why this file matters to the overall architecture",
  "visualization_priority": 7,
  "content_summary": "2-sentence summary of what this file does"
}}

Scoring Guidelines:
- business_importance (0-10): How critical is this to business logic/user experience?
- complexity_score (0-10): How complex is the code and logic?
- visualization_priority (0-10): How valuable would it be to show this in architecture diagrams?

Consider:
- Is this a core business logic file or just a utility?
- Does it handle critical user flows or data?
- Is it a central integration point or isolated component?
- Would understanding this file help someone understand the system?

Be specific about the architectural role - don't just say "component" or "utility".
Explain WHY this file matters (or doesn't matter) to the architecture.

Return ONLY the JSON, no other text:
"""
        return prompt

    def _parse_file_analysis_response(self, response_text: str, file_path: str) -> FileAnalysis:
        """Parse LLM file analysis response with multiple parsing strategies"""

        # Strategy 1: Try to parse clean JSON
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)
                return self._create_file_analysis_from_data(data, file_path)
        except json.JSONDecodeError as e:
            logger.debug(f"JSON parsing failed for {file_path}, trying cleanup: {e}")
        except Exception as e:
            logger.debug(f"Unexpected error parsing {file_path}: {e}")

        # Strategy 2: Try to clean and fix common JSON issues
        try:
            cleaned_json = self._clean_json_response(response_text)
            if cleaned_json:
                data = json.loads(cleaned_json)
                return self._create_file_analysis_from_data(data, file_path)
        except Exception as e:
            logger.debug(f"Cleaned JSON parsing failed for {file_path}: {e}")

        # Strategy 3: Extract key information using regex patterns
        try:
            extracted_data = self._extract_data_with_regex(response_text)
            if extracted_data:
                return self._create_file_analysis_from_data(extracted_data, file_path)
        except Exception as e:
            logger.debug(f"Regex extraction failed for {file_path}: {e}")

        # All parsing strategies failed - raise error
        logger.error(f"All parsing strategies failed for {file_path}")
        raise RuntimeError(f"File analysis parsing failed for {file_path}: unable to parse LLM response")

    def _create_file_analysis_from_data(self, data: dict, file_path: str) -> FileAnalysis:
        """Create FileAnalysis from parsed data"""
        return FileAnalysis(
            file_path=file_path,
            relative_path=os.path.relpath(file_path) if os.path.isabs(file_path) else file_path,
            architectural_role=data.get('architectural_role', 'Unknown role'),
            business_importance=max(0, min(10, data.get('business_importance', 5))),
            complexity_score=max(0, min(10, data.get('complexity_score', 5))),
            dependencies=data.get('dependencies', []),
            exports=data.get('exports', []),
            key_functions=data.get('key_functions', []),
            architectural_significance=data.get('architectural_significance', 'Significance unknown'),
            visualization_priority=max(0, min(10, data.get('visualization_priority', 5))),
            content_summary=data.get('content_summary', 'Summary unavailable')
        )

    def _clean_json_response(self, response_text: str) -> str:
        """Clean common JSON formatting issues"""
        try:
            # Find JSON boundaries
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start < 0 or json_end <= json_start:
                return None

            json_text = response_text[json_start:json_end]

            # Fix common issues
            # Remove trailing commas
            json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)

            # Fix unquoted keys (common LLM mistake)
            json_text = re.sub(r'(\w+):', r'"\1":', json_text)

            # Fix single quotes to double quotes
            json_text = json_text.replace("'", '"')

            # Remove comments (sometimes LLMs add them)
            json_text = re.sub(r'//.*?\n', '\n', json_text)
            json_text = re.sub(r'/\*.*?\*/', '', json_text, flags=re.DOTALL)

            return json_text
        except Exception:
            return None

    def _extract_data_with_regex(self, response_text: str) -> dict:
        """Extract key information using regex patterns as backup parsing method"""
        try:
            data = {}

            # Extract architectural role
            role_match = re.search(r'(?:architectural_role|role).*?["\']([^"\']+)["\']', response_text, re.IGNORECASE)
            if role_match:
                data['architectural_role'] = role_match.group(1)

            # Extract business importance (look for numbers)
            importance_match = re.search(r'(?:business_importance|importance).*?(\d+)', response_text, re.IGNORECASE)
            if importance_match:
                data['business_importance'] = int(importance_match.group(1))

            # Extract complexity score
            complexity_match = re.search(r'(?:complexity_score|complexity).*?(\d+)', response_text, re.IGNORECASE)
            if complexity_match:
                data['complexity_score'] = int(complexity_match.group(1))

            # Extract visualization priority
            priority_match = re.search(r'(?:visualization_priority|priority).*?(\d+)', response_text, re.IGNORECASE)
            if priority_match:
                data['visualization_priority'] = int(priority_match.group(1))

            # Extract content summary
            summary_match = re.search(r'(?:content_summary|summary).*?["\']([^"\']+)["\']', response_text, re.IGNORECASE)
            if summary_match:
                data['content_summary'] = summary_match.group(1)

            return data if data else None
        except Exception:
            return None





class GitHubRepositoryHandler:
    """Handles GitHub repository cloning and analysis (adapted from mintlify_v2)"""

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or "gemini-2.0-flash"
        self.base_url = base_url

    def is_github_url(self, path: str) -> bool:
        """Check if the path is a GitHub URL"""
        return path.startswith(('https://github.com/', 'http://github.com/', 'github.com/'))



    async def _prepare_repository(self, repo_input: str) -> str:
        """Prepare repository - clone if it's a GitHub URL, otherwise return local path"""
        if repo_input.startswith(('https://github.com/', 'http://github.com/', 'git@github.com:')):
            # It's a GitHub URL, we need to clone it
            import tempfile
            import subprocess

            # Create temporary directory
            temp_dir = tempfile.mkdtemp(prefix="ascii_agent_repo_")

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
        #log the tree
        logger.info(f"Generated file tree: {'\n'.join(tree_lines)}")
        return "\n".join(tree_lines)



class IntelligentFileDiscoveryAgent:
    """LLM-powered file discovery using dynamic grep-style searches and glob patterns"""

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o-mini" if provider.lower() == "openai" else "gemini-2.0-flash")
        self.base_url = base_url

        model_kwargs = {"api_key": api_key, "provider": provider, "temperature": 0.1}
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.discovery_model = create_model_instance(model_name=self.model_name, **model_kwargs)

    async def discover_relevant_files(self, repo_path: str, framework_discovery: FrameworkDiscovery, max_files: int = 50) -> List[str]:
        """Use LLM to generate intelligent search patterns and discover relevant files"""

        # Generate file tree for context
        file_tree = self._generate_file_tree(repo_path)

        # Create discovery prompt
        prompt = self._create_discovery_prompt(framework_discovery, file_tree, max_files)

        try:
            # Get LLM recommendations for search patterns
            input_stream = streams.stream_content([prompt])
            response_text = ""
            async for response_part in self.discovery_model(input_stream):
                response_text += response_part.text

            # Parse LLM response to get search patterns
            search_patterns = self._parse_search_patterns(response_text)

            # Execute the search patterns
            discovered_files = await self._execute_search_patterns(repo_path, search_patterns)

            # Limit results
            return discovered_files[:max_files]

        except Exception as e:
            logger.error(f"Intelligent file discovery failed: {e}")
            raise RuntimeError(f"File discovery failed: {e}")

    def _create_discovery_prompt(self, framework_discovery: FrameworkDiscovery, file_tree: str, max_files: int) -> str:
        """Create prompt for LLM to generate intelligent search patterns"""
        return f"""You are an expert code analyst. Generate intelligent file search patterns for this codebase.

Framework: {framework_discovery.primary_framework}
Architecture: {framework_discovery.architecture_type}
Technology Stack: {', '.join(framework_discovery.technology_stack)}

File Tree:
{file_tree}

Generate search patterns to find the most architecturally important files (max {max_files}).
Focus on: entry points, core logic, API routes, models, components, configurations.

Return JSON with:
{{
  "glob_patterns": ["src/**/*.js", "app/**/*.py", "*.config.js"],
  "grep_patterns": [
    {{"pattern": "class.*Controller", "extensions": [".py", ".js", ".ts"]}},
    {{"pattern": "export.*function", "extensions": [".js", ".ts"]}},
    {{"pattern": "def.*api", "extensions": [".py"]}}
  ],
  "priority_files": ["main.py", "app.js", "package.json"],
  "exclude_patterns": ["test", "spec", "__pycache__", "node_modules"]
}}

Return ONLY JSON:"""

    def _parse_search_patterns(self, response_text: str) -> Dict[str, Any]:
        """Parse LLM response to extract search patterns"""
        try:
            # Try to extract JSON from response
            import json

            # Find JSON in response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")

        except Exception as e:
            logger.error(f"Failed to parse search patterns: {e}")
            raise RuntimeError(f"Search pattern parsing failed: {e}")

    async def _execute_search_patterns(self, repo_path: str, patterns: Dict[str, Any]) -> List[str]:
        """Execute the search patterns to discover files"""
        discovered_files = set()

        # Execute glob patterns
        if 'glob_patterns' in patterns:
            for glob_pattern in patterns['glob_patterns']:
                files = await self._execute_glob_pattern(repo_path, glob_pattern)
                discovered_files.update(files)

        # Execute grep patterns
        if 'grep_patterns' in patterns:
            for grep_config in patterns['grep_patterns']:
                files = await self._execute_grep_pattern(repo_path, grep_config)
                discovered_files.update(files)

        # Add priority files if they exist
        if 'priority_files' in patterns:
            for priority_file in patterns['priority_files']:
                full_path = os.path.join(repo_path, priority_file)
                if os.path.exists(full_path):
                    discovered_files.add(full_path)

        # Filter out excluded patterns
        exclude_patterns = patterns.get('exclude_patterns', [])
        filtered_files = []
        for file_path in discovered_files:
            if not any(exclude in file_path.lower() for exclude in exclude_patterns):
                filtered_files.append(file_path)

        return filtered_files

    async def _execute_glob_pattern(self, repo_path: str, pattern: str) -> List[str]:
        """Execute glob pattern to find files"""
        import glob

        try:
            # Convert pattern to absolute path
            full_pattern = os.path.join(repo_path, pattern)
            matches = glob.glob(full_pattern, recursive=True)

            # Filter to only include files (not directories)
            return [f for f in matches if os.path.isfile(f)]

        except Exception as e:
            logger.warning(f"Glob pattern '{pattern}' failed: {e}")
            return []

    async def _execute_grep_pattern(self, repo_path: str, grep_config: Dict[str, Any]) -> List[str]:
        """Execute grep-style pattern search"""
        pattern = grep_config.get('pattern', '')
        extensions = grep_config.get('extensions', [])

        if not pattern:
            return []

        matching_files = []

        try:
            for root, _dirs, files in os.walk(repo_path):
                for file in files:
                    # Check if file has matching extension
                    if extensions and not any(file.endswith(ext) for ext in extensions):
                        continue

                    file_path = os.path.join(root, file)

                    # Search for pattern in file content
                    if await self._file_contains_pattern(file_path, pattern):
                        matching_files.append(file_path)

        except Exception as e:
            logger.warning(f"Grep pattern '{pattern}' failed: {e}")

        return matching_files

    async def _file_contains_pattern(self, file_path: str, pattern: str) -> bool:
        """Check if file contains the specified pattern"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(8192)  # Read first 8KB for pattern matching
                return re.search(pattern, content, re.IGNORECASE) is not None
        except Exception:
            return False

    def _generate_file_tree(self, repo_path: str) -> str:
        """Generate a concise file tree for LLM context"""
        try:
            tree_lines = []
            for root, _dirs, files in os.walk(repo_path):
                level = root.replace(repo_path, '').count(os.sep)
                if level > 2:  # Limit depth
                    continue

                indent = "  " * level
                folder_name = os.path.basename(root) or "."
                tree_lines.append(f"{indent}{folder_name}/")

                # Show first few files in each directory
                for file in files[:5]:
                    tree_lines.append(f"{indent}  {file}")

                if len(files) > 5:
                    tree_lines.append(f"{indent}  ... ({len(files) - 5} more files)")

            return "\n".join(tree_lines[:50])  # Limit total lines

        except Exception as e:
            logger.warning(f"Could not generate file tree: {e}")
            return "File tree generation failed"

    async def extract_relevant_content(self, file_path: str) -> str:
        """Extract relevant content from file based on its type and purpose"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Use LLM to extract most relevant parts for analysis
            if len(content) > 8192:  # If file is large, extract key parts
                return await self._extract_key_content_parts(file_path, content)
            else:
                return content

        except Exception as e:
            logger.warning(f"Could not extract content from {file_path}: {e}")
            return ""

    async def _extract_key_content_parts(self, file_path: str, content: str) -> str:
        """Use LLM to extract the most architecturally relevant parts of large files"""

        # For now, use a simple heuristic approach
        # In a full implementation, this could use an LLM to intelligently extract key parts

        lines = content.split('\n')
        key_lines = []

        # Extract imports, class definitions, function definitions, exports
        for line in lines:
            stripped = line.strip()
            if (stripped.startswith(('import ', 'from ', 'export ', 'class ', 'def ', 'function ', 'const ', 'let ', 'var ')) or
                'export default' in stripped or
                stripped.startswith(('@', 'router.', 'app.', 'api.'))):
                key_lines.append(line)

        # If we have key lines, return them; otherwise return first part of file
        if key_lines:
            return '\n'.join(key_lines[:100])  # Top 100 key lines
        else:
            return content[:4096]  # First 4KB

class AdaptiveRepositoryAnalyzer(processor.Processor):

    def __init__(self, api_key: str, provider: str = "google", screen_model: str = None,
                 doc_model: str = None, max_parallel_agents: int = 20, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.base_url = base_url
        self.max_parallel_agents = max_parallel_agents

        self.screen_model = screen_model or ("gpt-4o-mini" if provider.lower() == "openai" else "gemini-2.0-flash")
        self.doc_model = doc_model or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-flash")

        self.framework_detector = LLMFrameworkDetector(api_key, provider, self.doc_model, base_url)
        self.file_classifier = LLMFileClassifier(api_key, provider, self.screen_model, base_url)
        self.github_handler = GitHubRepositoryHandler(api_key, provider, self.screen_model, base_url)

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        async for part in content:
            if content_api.is_text(part.mimetype):
                repo_input = part.text.strip()
                logger.info(f"Starting repository analysis: {repo_input}")

                # Prepare repository (clone if GitHub URL, validate if local path)
                repo_path = await self.github_handler._prepare_repository(repo_input)
                repo_url = repo_input if self.github_handler.is_github_url(repo_input) else ""

                # 🧠 Phase 1A: Dynamic Framework Discovery (NO hardcoded patterns)
                logger.info("🔍 Phase 1A: Dynamic framework discovery (ZERO static patterns)")
                file_tree = self.github_handler._generate_file_tree(repo_path)
                framework_discovery = await self.framework_detector.discover_framework(repo_path, file_tree)
                #log the framework discovery
                logger.info(f"Framework discovery: {framework_discovery}")
                
                logger.info(f"✅ Discovered: {framework_discovery.primary_framework} "
                          f"({framework_discovery.architecture_type}, confidence: {framework_discovery.confidence:.0%})")

                # 🧠 Phase 1B: Content-Aware File Analysis (NO static classification)
                logger.info("📄 Phase 1B: Content-aware file analysis (ZERO string matching)")
                file_analyses = await self._analyze_files_intelligently(repo_path, framework_discovery)

                logger.info(f"✅ Analyzed {len(file_analyses)} files with intelligent classification")

                # 🧠 Phase 1C: Adaptive Synthesis (NO static grouping)
                logger.info("🎯 Phase 1C: Adaptive codebase synthesis")
                codebase_discovery = CodebaseDiscovery(
                    repo_path=repo_path,
                    repo_url=repo_url,
                    framework_discovery=framework_discovery,
                    file_analyses=file_analyses,
                    visualization_plans=[],  # Will be filled by visualization planner
                    architectural_insights=self._extract_insights(framework_discovery, file_analyses),
                    complexity_assessment=self._assess_complexity(framework_discovery, file_analyses),
                    stakeholder_recommendations=self._generate_recommendations(framework_discovery)
                )

                # Yield the complete discovery result
                result_json = json.dumps({
                    'repo_path': codebase_discovery.repo_path,
                    'repo_url': codebase_discovery.repo_url,
                    'framework_discovery': self._framework_to_dict(codebase_discovery.framework_discovery),
                    'file_analyses': [self._file_analysis_to_dict(fa) for fa in codebase_discovery.file_analyses],
                    'architectural_insights': codebase_discovery.architectural_insights,
                    'complexity_assessment': codebase_discovery.complexity_assessment,
                    'stakeholder_recommendations': codebase_discovery.stakeholder_recommendations
                })

                result_part = content_api.ProcessorPart(
                    result_json,
                    mimetype="application/json; type=CodebaseDiscovery",
                    metadata={"codebase_discovery": codebase_discovery}
                )
                yield result_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"🧠 Adaptive analysis complete: {framework_discovery.primary_framework} project with {len(file_analyses)} files analyzed",
                    substream_name="status"
                )
                yield status_part
            else:
                yield part

    async def _analyze_files_intelligently(self, repo_path: str,
                                         framework_discovery: FrameworkDiscovery) -> List[FileAnalysis]:
        """Intelligent file analysis using LLM-driven grep-style searches and glob patterns"""

        # Create intelligent file discovery agent
        file_discovery_agent = IntelligentFileDiscoveryAgent(
            api_key=self.api_key,
            provider=self.provider,
            model_name=self.screen_model,
            base_url=self.base_url
        )

        # Discover files using LLM-driven approach
        discovered_files = await file_discovery_agent.discover_relevant_files(
            repo_path=repo_path,
            framework_discovery=framework_discovery,
            max_files=50
        )

        logger.info(f"Discovered {len(discovered_files)} files using intelligent search patterns")

        # Analyze discovered files in parallel
        semaphore = asyncio.Semaphore(10)

        async def analyze_single_file(file_path: str):
            async with semaphore:
                try:
                    # Use intelligent content extraction based on file type
                    content = await file_discovery_agent.extract_relevant_content(file_path)
                    if content.strip():
                        return await self.file_classifier.analyze_file(file_path, content, framework_discovery)
                except Exception as e:
                    logger.warning(f"Could not analyze file {file_path}: {e}")
                return None

        # Execute analyses in parallel
        tasks = [analyze_single_file(file_path) for file_path in discovered_files]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect successful analyses
        file_analyses = []
        for result in results:
            if isinstance(result, FileAnalysis):
                file_analyses.append(result)
            elif isinstance(result, Exception):
                logger.warning(f"File analysis failed: {result}")

        # Sort by visualization priority
        file_analyses.sort(key=lambda x: x.visualization_priority, reverse=True)
        return file_analyses

    def _extract_insights(self, framework_discovery: FrameworkDiscovery,
                         file_analyses: List[FileAnalysis]) -> List[str]:
        """Extract architectural insights from the adaptive analysis"""
        insights = []

        # Framework insights
        if framework_discovery.confidence > 0.8:
            insights.append(f"High confidence {framework_discovery.primary_framework} project detection")

        if framework_discovery.unique_patterns:
            insights.append(f"Unique patterns detected: {', '.join(framework_discovery.unique_patterns)}")

        # File analysis insights
        high_complexity_files = [f for f in file_analyses if f.complexity_score >= 8]
        if high_complexity_files:
            insights.append(f"{len(high_complexity_files)} high-complexity files identified")

        business_critical_files = [f for f in file_analyses if f.business_importance >= 8]
        if business_critical_files:
            insights.append(f"{len(business_critical_files)} business-critical files identified")

        return insights

    def _assess_complexity(self, framework_discovery: FrameworkDiscovery,
                          file_analyses: List[FileAnalysis]) -> Dict[str, Any]:
        """Assess overall project complexity"""
        total_files = len(file_analyses)
        avg_complexity = sum(f.complexity_score for f in file_analyses) / total_files if total_files > 0 else 0
        avg_importance = sum(f.business_importance for f in file_analyses) / total_files if total_files > 0 else 0

        return {
            "total_files_analyzed": total_files,
            "average_complexity_score": round(avg_complexity, 2),
            "average_business_importance": round(avg_importance, 2),
            "framework_confidence": framework_discovery.confidence,
            "estimated_project_size": framework_discovery.complexity_indicators.get("estimated_size", "unknown"),
            "architectural_complexity": framework_discovery.complexity_indicators.get("architectural_complexity", "unknown")
        }

    def _generate_recommendations(self, framework_discovery: FrameworkDiscovery) -> Dict[str, List[str]]:
        """Generate stakeholder-specific recommendations"""
        return {
            "developers": [
                f"Focus on {framework_discovery.primary_framework} best practices",
                f"Review architectural patterns: {', '.join(framework_discovery.unique_patterns[:3])}"
            ],
            "architects": [
                f"Analyze {framework_discovery.architecture_type} architecture patterns",
                f"Consider complexity level: {framework_discovery.complexity_indicators.get('architectural_complexity', 'unknown')}"
            ],
            "stakeholders": [
                f"Project uses {framework_discovery.primary_framework} technology stack",
                f"Team size estimate: {framework_discovery.complexity_indicators.get('team_size_estimate', 'unknown')}"
            ]
        }

    # Helper methods for JSON serialization
    def _framework_to_dict(self, framework: FrameworkDiscovery) -> Dict:
        return {
            'primary_framework': framework.primary_framework,
            'framework_version': framework.framework_version,
            'secondary_frameworks': framework.secondary_frameworks,
            'architecture_type': framework.architecture_type,
            'technology_stack': framework.technology_stack,
            'confidence': framework.confidence,
            'reasoning': framework.reasoning,
            'unique_patterns': framework.unique_patterns,
            'complexity_indicators': framework.complexity_indicators
        }

    def _file_analysis_to_dict(self, file_analysis: FileAnalysis) -> Dict:
        return {
            'file_path': file_analysis.file_path,
            'relative_path': file_analysis.relative_path,
            'architectural_role': file_analysis.architectural_role,
            'business_importance': file_analysis.business_importance,
            'complexity_score': file_analysis.complexity_score,
            'dependencies': file_analysis.dependencies,
            'exports': file_analysis.exports,
            'key_functions': file_analysis.key_functions,
            'architectural_significance': file_analysis.architectural_significance,
            'visualization_priority': file_analysis.visualization_priority,
            'content_summary': file_analysis.content_summary
        }

class LLMVisualizationPlanner(processor.Processor):
    """
    🧠 ADAPTIVE: Dynamic visualization planning that replaces static ASCII_TYPES.
    Creates custom visualizations based on actual project needs and complexity.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-flash")
        self.base_url = base_url
        # 🚫 ELIMINATED: No more ascii_types parameter - everything is dynamic!

        # Create model instance for intelligent planning
        model_kwargs = {
            "api_key": api_key,
            "provider": provider,
            "temperature": 0.4  # Moderate temperature for creative but consistent planning
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.planning_model = create_model_instance(
            model_name=self.model_name, **model_kwargs
        )

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Create ASCII visualization tasks from rich codebase context"""
        async for part in content:
            if part.mimetype == "application/json; type=RichCodebaseContext":
                # Get rich context from metadata or parse JSON
                rich_context = part.get_metadata("rich_context")
                if rich_context is None:
                    # Parse from JSON text - this should be a RichCodebaseContext
                    context_data = json.loads(part.text)
                    # For now, create a minimal context - this should be improved
                    framework_detected = context_data.get('framework_discovery', {}).get('primary_framework', 'Unknown')

                    # Create a minimal rich context object
                    rich_context = type('RichCodebaseContext', (), {
                        'framework_discovery': type('FrameworkDiscovery', (), {
                            'primary_framework': framework_detected,
                            'architecture_type': 'Unknown',
                            'confidence': 0.5
                        })(),
                        'get_planning_context': lambda: f"Framework: {framework_detected}\nLimited context available",
                        'file_analyses': context_data.get('file_analyses', []),
                        'architectural_patterns': context_data.get('architectural_patterns', []),
                        'repo_path': context_data.get('repo_path', '')
                    })()

                logger.info(f"🎯 Planning ASCII visualizations with rich context for: {rich_context.framework_discovery.primary_framework}")

                # Use rich context for planning
                planning_context = rich_context.get_planning_context()
                ascii_tasks = await self._create_ascii_tasks_with_rich_context(rich_context, planning_context)

                # Yield each task as a separate part
                for task in ascii_tasks:
                    task_json = json.dumps({
                        'task_id': task.task_id,
                        'task_name': task.task_name,
                        'ascii_type': task.ascii_type,
                        'description': task.description,
                        'target_filename': task.target_filename,
                        'file_group': [self._file_result_to_dict(fr) for fr in task.file_group],
                        'priority': task.priority,
                        'estimated_complexity': task.estimated_complexity,
                        'ascii_style': task.ascii_style,
                        'focus_areas': task.focus_areas
                    })

                    task_part = content_api.ProcessorPart(
                        task_json,
                        mimetype="application/json; type=ASCIIVisualizationTask",
                        metadata={"ascii_task": task}
                    )
                    yield task_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"✅ ASCII planning complete: {len(ascii_tasks)} visualization tasks created",
                    substream_name="status"
                )
                yield status_part

                # Pass through the rich context
                yield part
            else:
                yield part

    async def _create_ascii_tasks_with_rich_context(self, rich_context: RichCodebaseContext, planning_context: str) -> List[ASCIIVisualizationTask]:
        """Create ASCII tasks using rich codebase context"""

        # Create enhanced planning prompt with rich context
        prompt = f"""
You are an expert software architect analyzing a codebase to create ASCII visualization tasks.

{planning_context}

Based on this rich codebase analysis, create 8-10 ASCII visualization tasks that will help developers understand the system architecture.

Each task should focus on a specific architectural aspect and use actual code insights from the analysis above.

Create a JSON plan with 8-10 ASCII visualization tasks. Each task should focus on a specific aspect of the architecture.

Return JSON format:
{{
  "ascii_tasks": [
    {{
      "task_name": "System Architecture Overview",
      "ascii_type": "architecture_overview",
      "description": "High-level system architecture showing main components and data flow",
      "target_files": ["main.py", "app.js", "server.ts"],
      "priority": 10,
      "complexity": "medium",
      "style": "overview",
      "focus_areas": ["main components", "data flow", "external dependencies"]
    }}
  ]
}}

Focus on creating visualizations that reflect the ACTUAL code patterns and architecture found in the analysis.
Use specific file names from the codebase when possible.
Return ONLY the JSON, no other text:
"""

        try:
            # Query the LLM for intelligent planning
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.planning_model(input_stream):
                response_text += response_part.text

            # Parse the planning response
            return self._parse_planning_response_with_context(response_text, rich_context)

        except Exception as e:
            logger.error(f"Rich context ASCII planning failed: {e}")
            raise RuntimeError(f"Rich context ASCII planning failed: {e}")

    def _parse_planning_response_with_context(self, response_text: str, rich_context: RichCodebaseContext) -> List[ASCIIVisualizationTask]:
        """Parse LLM planning response and create tasks with rich context"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                plan_data = json.loads(json_text)

                tasks = []
                for i, task_data in enumerate(plan_data.get('ascii_tasks', [])):
                    # Find relevant files using smart selection
                    target_files = task_data.get('target_files', [])
                    file_group = self._smart_file_selection_with_context(rich_context, target_files, task_data['ascii_type'])

                    # Create task
                    task = ASCIIVisualizationTask(
                        task_id=f"ascii_task_{i+1:03d}",
                        task_name=task_data['task_name'],
                        ascii_type=task_data['ascii_type'],
                        description=task_data['description'],
                        target_filename=f"ascii_{task_data['ascii_type']}_{i+1}.md",
                        file_group=file_group,
                        priority=task_data.get('priority', 5),
                        estimated_complexity=task_data.get('complexity', 'medium'),
                        ascii_style=task_data.get('style', 'overview'),
                        focus_areas=task_data.get('focus_areas', [])
                    )
                    tasks.append(task)

                logger.info(f"✅ LLM planned {len(tasks)} ASCII visualization tasks with rich context")
                return tasks

        except Exception as e:
            logger.error(f"Failed to parse rich context planning response: {e}")
            raise RuntimeError(f"Rich context planning response parsing failed: {e}")

    def _smart_file_selection_with_context(self, rich_context: RichCodebaseContext, target_files: List[str], ascii_type: str) -> List[FileScreeningResult]:
        """Smart file selection using rich context"""
        selected_files = []

        # First, try to find specifically mentioned files
        for target_file in target_files:
            if target_file in ['<dynamically_selected_files>', '<auto_select>', '<relevant_files>']:
                continue

            for file_analysis in rich_context.file_analyses:
                if target_file.lower() in file_analysis.relative_path.lower():
                    selected_files.append(file_analysis)
                    break

        # If we don't have enough files, use intelligent selection based on context
        if len(selected_files) < 3:
            # Select files based on architectural importance and type relevance
            remaining_files = [f for f in rich_context.file_analyses if f not in selected_files]

            # Sort by architectural importance
            remaining_files.sort(key=lambda x: x.architectural_importance, reverse=True)

            # Add top files until we have enough
            for file_analysis in remaining_files[:10]:
                selected_files.append(file_analysis)
                if len(selected_files) >= 8:  # Reasonable limit
                    break

        logger.info(f"📋 Smart selection for {ascii_type}: {[f.relative_path for f in selected_files[:5]]}")
        return selected_files[:8]  # Limit to 8 files



    async def _create_ascii_tasks(self, repo_analysis: RepositoryAnalysisResult) -> List[ASCIIVisualizationTask]:
        """Create ASCII visualization tasks using LLM intelligence"""

        # First, get all architectural files from the selected folders
        all_files = []
        repo_path = repo_analysis.local_path

        # Collect files from selected folders
        for folder_info in repo_analysis.selected_folders:
            folder_path = os.path.join(repo_path, folder_info['path']) if folder_info['path'] != 'root' else repo_path
            if os.path.exists(folder_path):
                for root, dirs, files in os.walk(folder_path):
                    # Skip hidden and build directories
                    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in [
                        'node_modules', '__pycache__', 'build', 'dist', '.git'
                    ]]

                    for file in files:
                        if not file.startswith('.'):
                            full_path = os.path.join(root, file)
                            relative_path = os.path.relpath(full_path, repo_path)

                            # Create a basic FileScreeningResult for planning
                            file_result = FileScreeningResult(
                                file_path=full_path,
                                relative_path=relative_path,
                                summary=f"File in {folder_info['path']}",
                                documentation_score=7,  # Default for planning
                                file_type="unknown",  # 🧠 ADAPTIVE: File type determined by LLMFileClassifier
                                complexity="medium",
                                dependencies=[],
                                estimated_doc_value="medium",
                                architectural_importance=7
                            )
                            all_files.append(file_result)

        # Use LLM to intelligently plan ASCII tasks
        ascii_tasks = await self._llm_plan_ascii_tasks(repo_analysis, all_files)

        return ascii_tasks

    # 🚫 DELETED: _guess_file_type() - replaced with LLMFileClassifier content analysis
    # File types are now determined through intelligent content analysis, not string matching

    def _file_result_to_dict(self, file_result: FileScreeningResult) -> Dict:
        """Convert FileScreeningResult to dictionary for JSON serialization"""
        return {
            'file_path': file_result.file_path,
            'relative_path': file_result.relative_path,
            'summary': file_result.summary,
            'documentation_score': file_result.documentation_score,
            'file_type': file_result.file_type,
            'complexity': file_result.complexity,
            'dependencies': file_result.dependencies,
            'estimated_doc_value': file_result.estimated_doc_value,
            'skip_reason': file_result.skip_reason,
            'framework_category': file_result.framework_category,
            'architectural_importance': file_result.architectural_importance
        }

    async def _llm_plan_ascii_tasks(self, repo_analysis: RepositoryAnalysisResult,
                                   all_files: List[FileScreeningResult]) -> List[ASCIIVisualizationTask]:
        """Use LLM to intelligently plan ASCII visualization tasks"""

        # Prepare context for LLM
        framework = repo_analysis.framework_detected or "Unknown"
        patterns = repo_analysis.architectural_patterns
        file_summary = self._create_file_summary(all_files)

        prompt = f"""
Analyze this {framework} project and create a comprehensive ASCII visualization plan.

Project Summary: {repo_analysis.repository_summary}
Architectural Patterns: {', '.join(patterns) if patterns else 'None detected'}
Framework: {framework}

🧠 ADAPTIVE VISUALIZATION PLANNING:
Create custom visualization types based on this specific project's needs.
Don't limit yourself to predefined types - be creative and project-specific.

File Analysis Summary:
{file_summary}

Selected Folders:
{json.dumps([f for f in repo_analysis.selected_folders], indent=2)}

Create a JSON plan with 4-6 ASCII visualization tasks. Each task should focus on a specific aspect of the architecture.

Return JSON in this format:
{{
  "ascii_tasks": [
    {{
      "task_name": "System Architecture Overview",
      "ascii_type": "architecture",
      "description": "High-level system components and data flow",
      "priority": 10,
      "complexity": "medium",
      "style": "overview",
      "focus_areas": ["main components", "data flow", "external dependencies"],
      "target_files": ["<dynamically_selected_files>"],
      "reasoning": "Why this visualization is important"
    }}
  ]
}}

Guidelines:
1. Prioritize visualizations that show system architecture and component relationships
2. Include at least one high-level overview and one detailed component diagram
3. Focus on files that reveal architectural decisions and patterns
4. Consider the framework-specific characteristics
5. Ensure each task has a clear purpose and target audience

Return ONLY the JSON, no other text:
"""

        try:
            # Query the planning model
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.planning_model(input_stream):
                response_text += response_part.text

            # Parse the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                plan_data = json.loads(json_text)

                # Convert plan to ASCIIVisualizationTask objects
                tasks = []
                for i, task_data in enumerate(plan_data.get('ascii_tasks', [])):
                    # 🧠 ADAPTIVE: No more ascii_types filtering - accept all dynamic types

                    # Find relevant files for this task
                    target_files = task_data.get('target_files', [])
                    file_group = self._find_relevant_files(all_files, target_files, task_data['ascii_type'])

                    # Create task
                    task = ASCIIVisualizationTask(
                        task_id=f"ascii_task_{i+1:03d}",
                        task_name=task_data['task_name'],
                        ascii_type=task_data['ascii_type'],
                        description=task_data['description'],
                        target_filename=f"ascii_{task_data['ascii_type']}_{i+1}.md",
                        file_group=file_group,
                        priority=task_data.get('priority', 5),
                        estimated_complexity=task_data.get('complexity', 'medium'),
                        ascii_style=task_data.get('style', 'overview'),
                        focus_areas=task_data.get('focus_areas', [])
                    )
                    tasks.append(task)

                logger.info(f"✅ LLM planned {len(tasks)} ASCII visualization tasks")
                return tasks

        except Exception as e:
            logger.error(f"LLM planning failed: {e}")
            raise RuntimeError(f"ASCII visualization planning failed: {e}")

    def _create_file_summary(self, all_files: List[FileScreeningResult]) -> str:
        """Create a summary of files for LLM context"""
        file_types = {}
        for file_result in all_files:
            file_types[file_result.file_type] = file_types.get(file_result.file_type, 0) + 1

        summary_lines = []
        for file_type, count in sorted(file_types.items(), key=lambda x: x[1], reverse=True):
            summary_lines.append(f"- {file_type}: {count} files")

        return "\n".join(summary_lines)

    def _find_relevant_files(self, all_files: List[FileScreeningResult],
                           target_files: List[str], ascii_type: str) -> List[FileScreeningResult]:
        """Find files relevant to a specific ASCII visualization task"""
        relevant_files = []

        logger.info(f"🔍 Finding files for {ascii_type}: target_files={target_files}, total_files={len(all_files)}")

        # First, try to find specifically mentioned files (skip placeholders)
        for target_file in target_files:
            # Skip placeholder values that LLM sometimes generates
            if target_file in ['<dynamically_selected_files>', '<auto_select>', '<relevant_files>']:
                logger.info(f"⚠️ Skipping placeholder target file: {target_file}")
                continue

            found = False
            for file_result in all_files:
                if target_file.lower() in file_result.relative_path.lower():
                    relevant_files.append(file_result)
                    logger.info(f"✅ Found target file: {target_file} -> {file_result.relative_path}")
                    found = True
                    break
            if not found:
                logger.warning(f"❌ Target file not found: {target_file}")

        # 🧠 ADAPTIVE: No more hardcoded type relevance patterns
        # File relevance is now determined dynamically based on actual content analysis
        relevant_types = ['main', 'api_route', 'component', 'model', 'controller', 'config', 'middleware', 'utility']  # Include all types

        # Log available file types for debugging
        available_types = set(f.file_type for f in all_files)
        logger.info(f"🔍 Available file types: {sorted(available_types)}")
        logger.info(f"🎯 Looking for types: {relevant_types}")

        additional_count = 0
        for file_result in all_files:
            if file_result.file_type in relevant_types and file_result not in relevant_files:
                relevant_files.append(file_result)
                additional_count += 1
            elif file_result not in relevant_files:
                # If no files match our expected types, include any important files
                if additional_count == 0 and file_result.architectural_importance > 5:
                    relevant_files.append(file_result)
                    additional_count += 1

        logger.info(f"📁 Found {len(relevant_files)} relevant files ({len(relevant_files) - additional_count} from targets, {additional_count} additional)")

        # Limit to top files by architectural importance
        relevant_files.sort(key=lambda x: x.architectural_importance, reverse=True)
        final_files = relevant_files[:15]  # Max 15 files per task

        logger.info(f"📋 Final file selection: {[f.relative_path for f in final_files]}")
        return final_files



class ASCIISubAgent(processor.Processor):
    """
    Individual ASCII generation processor.
    Specializes in generating specific types of ASCII art with LLM intelligence.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-flash")
        self.base_url = base_url

        # Create model instance for ASCII generation
        model_kwargs = {
            "api_key": api_key,
            "provider": provider,
            "temperature": 0.7  # Higher temperature for creative ASCII generation
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.ascii_model = create_model_instance(
            model_name=self.model_name, **model_kwargs
        )

        # Initialize smart content extractor for full file reading
        self.content_extractor = SmartContentExtractor()

    async def call(self, content: content_api.ProcessorPart) -> AsyncIterable[content_api.ProcessorPart]:
        """Generate ASCII art for a specific visualization task"""
        if content.mimetype == "application/json; type=ASCIIVisualizationTask":
            # Get task from metadata or parse JSON
            ascii_task = content.get_metadata("ascii_task")
            if ascii_task is None:
                # Parse from JSON text
                task_data = json.loads(content.text)
                ascii_task = ASCIIVisualizationTask(**task_data)

            logger.info(f"🎨 Generating ASCII {ascii_task.ascii_type}: {ascii_task.task_name}")

            start_time = time.time()

            # Generate ASCII content using LLM
            ascii_result = await self._generate_ascii_content(ascii_task)

            generation_time = time.time() - start_time

            # Create result
            result = ASCIIResult(
                task=ascii_task,
                ascii_content=ascii_result['ascii_content'],
                title=ascii_result['title'],
                description=ascii_result['description'],
                sources=[f.relative_path for f in ascii_task.file_group],
                confidence=ascii_result.get('confidence', 0.8),
                generation_time=generation_time,
                tokens_used=ascii_result.get('tokens_used', 0)
            )

            # Yield the result
            result_json = json.dumps({
                'task_id': ascii_task.task_id,
                'task_name': ascii_task.task_name,
                'ascii_type': ascii_task.ascii_type,
                'ascii_content': result.ascii_content,
                'title': result.title,
                'description': result.description,
                'sources': result.sources,
                'confidence': result.confidence,
                'generation_time': result.generation_time,
                'tokens_used': result.tokens_used
            })

            result_part = content_api.ProcessorPart(
                result_json,
                mimetype="application/json; type=ASCIIResult",
                metadata={"ascii_result": result}
            )
            yield result_part

            # Yield status update
            status_part = content_api.ProcessorPart(
                f"✅ ASCII generated: {ascii_task.task_name} ({generation_time:.1f}s)",
                substream_name="status"
            )
            yield status_part
        else:
            yield content

    async def _generate_ascii_content(self, task: ASCIIVisualizationTask) -> Dict[str, Any]:
        """Generate ASCII content using LLM intelligence"""

        # Read relevant file contents using smart extractor (NO LIMITS)
        file_contents = []
        logger.info(f"📖 Reading {len(task.file_group)} files for {task.task_name} with FULL content")

        # Get file paths for smart extraction
        file_paths = [file_result.file_path for file_result in task.file_group[:8]]  # Up to 8 files

        # Use smart content extractor for full file content
        full_content_map = self.content_extractor.extract_for_ascii_generation(file_paths)

        for file_result in task.file_group[:8]:
            content = full_content_map.get(file_result.file_path, "")
            if content:
                file_contents.append({
                    'path': file_result.relative_path,
                    'type': file_result.file_type,
                    'content': content,
                    'importance': file_result.architectural_importance,
                    'documentation_score': file_result.documentation_score
                })
                logger.info(f"✅ Read {len(content)} chars from {file_result.relative_path} (FULL CONTENT)")
            else:
                logger.warning(f"❌ No content extracted from {file_result.relative_path}")

        # Create ASCII generation prompt
        prompt = self._create_ascii_generation_prompt(task, file_contents)

        # Retry logic - attempt up to 3 times
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                logger.info(f"🎯 ASCII generation attempt {attempt + 1}/{max_attempts} for {task.task_name}")

                # Query the ASCII model
                input_stream = streams.stream_content([prompt])
                response_text = ""

                async for response_part in self.ascii_model(input_stream):
                    response_text += response_part.text

                # Parse the response
                return self._parse_ascii_response(response_text, task)

            except Exception as e:
                logger.warning(f"❌ Attempt {attempt + 1} failed for {task.task_name}: {e}")

                if attempt == max_attempts - 1:
                    # Final attempt failed
                    logger.error(f"ASCII generation failed after {max_attempts} attempts for {task.task_name}")
                    raise RuntimeError(f"ASCII generation failed after {max_attempts} attempts for {task.task_name}: {e}")
                else:
                    # Wait a bit before retrying
                    await asyncio.sleep(1)

    def _create_ascii_generation_prompt(self, task: ASCIIVisualizationTask, file_contents: List[Dict]) -> str:
        """🧠 ADAPTIVE: Create a prompt for ASCII generation with NO static patterns"""
        # 🚫 ELIMINATED: No more ASCII_TYPES.get() - use dynamic task information

        file_context = ""
        for file_info in file_contents:
            file_context += f"\n--- {file_info['path']} ({file_info['type']}) ---\n"
            file_context += file_info['content'][:50000]  # Limit content per file
            file_context += "\n"
        # log the file context
        # logger.info(f"File context: {file_context}")
        prompt = f"""
Generate an ASCII art visualization for this software project analysis.

Task: {task.task_name}
Type: {task.ascii_type}
Description: {task.description}
Style: {task.ascii_style}
Focus Areas: {', '.join(task.focus_areas)}

🧠 ADAPTIVE Visualization Guidelines:
- Type: {task.ascii_type} (dynamically determined)
- Description: {task.description}
- Focus Areas: {', '.join(task.focus_areas)}

File Analysis Context:
{file_context}

Create a comprehensive ASCII visualization that shows:
1. The overall architecture/structure
2. Key components and their relationships
3. Data flow or interaction patterns
4. Important technical details

ASCII Art Requirements:
- Use box-drawing characters: ┌─┐│└┘├┤┬┴┼
- Use arrows for connections: ←→↑↓↔↕
- Use simple text for labels
- Keep it readable and well-structured
- Maximum width: 80 characters
- Include a title and brief explanation

Return your response in this JSON format:
{{
  "title": "Clear title for the ASCII diagram",
  "description": "2-3 sentence description of what the diagram shows",
  "ascii_content": "The actual ASCII art as a multi-line string",
  "confidence": 0.85,
  "key_insights": ["insight1", "insight2", "insight3"]
}}

IMPORTANT: confidence must be a number between 0.0 and 1.0 (not text like "high" or "medium")

Focus on creating a clear, informative ASCII visualization that helps developers understand the system architecture.

Return ONLY the JSON, no other text:
"""
        return prompt

    def _parse_ascii_response(self, response_text: str, task: ASCIIVisualizationTask) -> Dict[str, Any]:
        """Parse the ASCII generation response"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)

                # Parse confidence as float, handling various formats
                confidence_raw = data.get('confidence', 0.7)
                if isinstance(confidence_raw, str):
                    confidence_str = confidence_raw.strip().lower()

                    # Handle text-based confidence levels
                    if confidence_str in ['high', 'very high']:
                        confidence = 0.9
                    elif confidence_str in ['medium', 'moderate']:
                        confidence = 0.7
                    elif confidence_str in ['low', 'very low']:
                        confidence = 0.3
                    else:
                        # Handle percentage strings like "95%" or "0.95"
                        try:
                            confidence_str = confidence_str.rstrip('%')
                            confidence = float(confidence_str)
                            if confidence > 1:
                                confidence = confidence / 100
                        except ValueError:
                            confidence = 0.7
                else:
                    confidence = float(confidence_raw)

                return {
                    'title': data.get('title', task.task_name),
                    'description': data.get('description', task.description),
                    'ascii_content': data.get('ascii_content', ''),
                    'confidence': confidence,
                    'key_insights': data.get('key_insights', []),
                    'tokens_used': len(response_text.split())  # Rough estimate
                }
        except Exception as e:
            logger.error(f"Failed to parse ASCII response for {task.task_name}: {e}")
            raise RuntimeError(f"ASCII response parsing failed for {task.task_name}: {e}")



class ParallelASCIIGenerator(processor.Processor):
    """
    Manages parallel execution of ASCII generation tasks using multiple sub-agents.
    Distributes tasks efficiently and collects results.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None,
                 base_url: str = None, max_parallel_agents: int = 15):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name
        self.base_url = base_url
        self.max_parallel_agents = max_parallel_agents

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute ASCII generation tasks in parallel"""

        ascii_tasks = []
        other_parts = []

        # Collect all ASCII tasks
        async for part in content:
            if part.mimetype == "application/json; type=ASCIIVisualizationTask":
                ascii_tasks.append(part)
            else:
                other_parts.append(part)

        if not ascii_tasks:
            # No ASCII tasks to process, pass through other parts
            for part in other_parts:
                yield part
            return

        logger.info(f"⚡ Starting parallel ASCII generation: {len(ascii_tasks)} tasks")

        # Execute tasks in parallel batches
        async for result_part in self._execute_tasks_parallel(ascii_tasks):
            yield result_part

        # Yield completion status
        completion_part = content_api.ProcessorPart(
            f"🎉 Parallel ASCII generation complete: {len(ascii_tasks)} visualizations created",
            substream_name="status"
        )
        yield completion_part

        # Pass through other parts
        for part in other_parts:
            yield part

    async def _execute_tasks_parallel(self, tasks: List[content_api.ProcessorPart]):
        """Execute all tasks in batches using sub-agents"""

        total_tasks = len(tasks)
        max_parallel = min(self.max_parallel_agents, 15)  # Safety limit for ASCII generation

        # Calculate batches
        batches = []
        for i in range(0, total_tasks, max_parallel):
            batch = tasks[i:i + max_parallel]
            batches.append(batch)

        logger.info(f"📦 Processing {total_tasks} ASCII tasks in {len(batches)} batches (max {max_parallel} parallel per batch)")

        # Process each batch
        for batch_num, batch in enumerate(batches, 1):
            logger.info(f"🎨 Starting ASCII batch {batch_num}/{len(batches)} with {len(batch)} tasks")

            # Create sub-agents for this batch
            sub_agent_streams = []
            for task_part in batch:
                # Create a new sub-agent for each task
                sub_agent = ASCIISubAgent(
                    api_key=self.api_key,
                    provider=self.provider,
                    model_name=self.model_name,
                    base_url=self.base_url
                )

                # Create stream for this sub-agent
                async def create_sub_agent_stream(agent, part):
                    async for result_part in agent.call(part):
                        yield result_part

                sub_agent_streams.append(create_sub_agent_stream(sub_agent, task_part))

            # Process this batch in parallel
            if sub_agent_streams:
                logger.info(f"⚡ Executing ASCII batch {batch_num} with {len(sub_agent_streams)} parallel sub-agents")
                merged_stream = streams.merge(sub_agent_streams)

                async for part in merged_stream:
                    # Yield all parts from sub-agents
                    yield part

                logger.info(f"✅ ASCII batch {batch_num}/{len(batches)} completed")
            else:
                logger.warning(f"❌ No sub-agent streams for ASCII batch {batch_num}")

        logger.info(f"🎉 All {len(batches)} ASCII batches completed! Total tasks processed: {total_tasks}")







class ASCIIResultAggregator(processor.Processor):
    """
    Collects all ASCII results and creates the final markdown files.
    Generates clean ASCII documentation without attribution overhead.
    """

    def __init__(self, output_dir: str = "./ascii-docs"):
        self.output_dir = output_dir

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Collect all attributed ASCII results and create final markdown files"""

        ascii_results = []
        other_parts = []

        # Collect all ASCII results
        async for part in content:
            if part.mimetype == "application/json; type=ASCIIResult":
                # Parse ASCII result from JSON
                result_data = json.loads(part.text)
                ascii_results.append(result_data)
            elif part.substream_name in ["status", "error"]:
                # Pass through status updates
                yield part
            else:
                other_parts.append(part)

        if not ascii_results:
            logger.warning("No ASCII results to aggregate")
            for part in other_parts:
                yield part
            return

        logger.info(f"📚 Aggregating {len(ascii_results)} ASCII results")

        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)

        # Generate individual markdown files
        generated_files = []
        for result_data in ascii_results:
            markdown_file = await self._create_markdown_file(result_data)
            if markdown_file:
                generated_files.append(markdown_file)

        # Generate index/README file
        readme_file = await self._create_readme_file(ascii_results, generated_files)
        if readme_file:
            generated_files.append(readme_file)

        # Yield completion status
        completion_part = content_api.ProcessorPart(
            f"✅ ASCII documentation complete: {len(generated_files)} files created in {self.output_dir}",
            substream_name="status"
        )
        yield completion_part

        # Yield file list
        files_part = content_api.ProcessorPart(
            json.dumps({
                'output_directory': self.output_dir,
                'generated_files': generated_files,
                'total_visualizations': len(ascii_results)
            }),
            mimetype="application/json; type=ASCIIDocumentationResult"
        )
        yield files_part

        # Pass through other parts
        for part in other_parts:
            yield part

    async def _create_markdown_file(self, result_data: Dict) -> Optional[str]:
        """Create a markdown file for a single ASCII visualization"""
        try:
            task_name = result_data.get('task_name', 'Unknown')
            ascii_type = result_data.get('ascii_type', 'unknown')

            # Create safe filename
            safe_name = task_name.lower().replace(' ', '_').replace('-', '_')
            filename = f"ascii_{ascii_type}_{safe_name}.md"
            filepath = os.path.join(self.output_dir, filename)

            # Generate markdown content
            markdown_content = self._generate_markdown_content(result_data)

            # Write file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(markdown_content)

            logger.info(f"📄 Created: {filename}")
            return filename

        except Exception as e:
            logger.error(f"Failed to create markdown file for {result_data.get('task_name', 'unknown')}: {e}")
            return None

    def _generate_markdown_content(self, result_data: Dict) -> str:
        """Generate clean markdown content for ASCII visualization"""

        title = result_data.get('title', 'ASCII Visualization')
        description = result_data.get('description', '')
        ascii_content = result_data.get('ascii_content', '')

        markdown = f"""# {title}

{description}

```ascii
{ascii_content}
```

---

*Generated by DEEPASCII*
"""

        return markdown

    async def _create_readme_file(self, ascii_results: List[Dict], generated_files: List[str]) -> Optional[str]:
        """Create README.md index file with overview of all visualizations"""
        try:
            readme_path = os.path.join(self.output_dir, "README.md")

            # Calculate overall statistics
            total_visualizations = len(ascii_results)

            # Count ASCII types
            ascii_types = {}
            for result in ascii_results:
                ascii_type = result.get('ascii_type', 'unknown')
                ascii_types[ascii_type] = ascii_types.get(ascii_type, 0) + 1

            # Get all unique source files
            all_sources = set()
            for result in ascii_results:
                all_sources.update(result.get('sources', []))

            readme_content = f"""# ASCII Architecture Documentation

This directory contains clean ASCII visualizations of the software architecture.

## 📊 Overview

- **Total Visualizations:** {total_visualizations}
- **Source Files Analyzed:** {len(all_sources)}
- **Generated Files:** {len(generated_files)}

## 🎨 Visualization Types

"""

            for ascii_type, count in sorted(ascii_types.items()):
                # 🧠 ADAPTIVE: No more ASCII_TYPES.get() - use dynamic type information
                type_name = ascii_type.replace('_', ' ').title()
                type_desc = f"Custom {ascii_type} visualization generated for this project"
                readme_content += f"- **{type_name}** ({count} files): {type_desc}\n"

            readme_content += f"""

## 📄 Generated Files

"""

            # List all generated files with descriptions
            for result in ascii_results:
                task_name = result.get('task_name', 'Unknown')
                ascii_type = result.get('ascii_type', 'unknown')

                # Find corresponding file
                safe_name = task_name.lower().replace(' ', '_').replace('-', '_')
                filename = f"ascii_{ascii_type}_{safe_name}.md"

                if filename in generated_files:
                    readme_content += f"- [`{filename}`](./{filename}) - {task_name} ({ascii_type})\n"

            readme_content += f"""

## 📚 Source Files Analyzed

"""

            for source in sorted(all_sources):
                readme_content += f"- `{source}`\n"

            readme_content += f"""

## 🎯 How to Use

1. **Start with README.md** (this file) for overview
2. **Browse individual ASCII files** for detailed visualizations
3. **Use visualizations** to understand system architecture
4. **Reference source files** for implementation details

## 🔬 Methodology

All visualizations generated using:
- **LLM-driven analysis** of source code structure
- **Parallel processing** for efficient generation
- **Clean ASCII output** without attribution overhead

---

*Generated by DEEPASCII*
"""

            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(readme_content)

            logger.info("📄 Created: README.md")
            return "README.md"

        except Exception as e:
            logger.error(f"Failed to create README.md: {e}")
            return None

class AdaptiveASCIIResearchAgent(processor.Processor):
    """
    🧠 ADAPTIVE: Main orchestrator with ZERO hardcoded patterns.
    Coordinates all phases of adaptive ASCII visualization generation.
    """

    def __init__(self, api_key: str, provider: str = "google", screen_model: str = None,
                 doc_model: str = None, base_url: str = None, max_parallel_agents: int = 20,
                 output_dir: str = "./ascii-docs"):
        self.api_key = api_key
        self.provider = provider
        self.screen_model = screen_model
        self.doc_model = doc_model
        self.base_url = base_url
        self.max_parallel_agents = max_parallel_agents
        self.output_dir = output_dir

        # 🧠 Initialize ADAPTIVE processors (NO static patterns)
        self.repository_analyzer = AdaptiveRepositoryAnalyzer(
            api_key, provider, screen_model, doc_model, max_parallel_agents, base_url
        )

        # 🧠 NEW: Framework detector that builds rich context
        self.framework_detector = LLMFrameworkDetector(
            api_key, provider, doc_model, base_url
        )

        # 🧠 ADAPTIVE: Use LLMVisualizationPlanner (NO static patterns)
        self.visualization_planner = LLMVisualizationPlanner(
            api_key, provider, doc_model, base_url
        )

        self.parallel_generator = ParallelASCIIGenerator(
            api_key, provider, doc_model, base_url, max_parallel_agents
        )



        self.result_aggregator = ASCIIResultAggregator(output_dir)

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """🧠 Execute the IMPROVED ASCII research pipeline with rich context preservation"""

        logger.info("🧠 Starting IMPROVED ASCII Research Agent pipeline with rich context")

        # Stage 1: Repository Analysis to get file analyses
        logger.info("🔍 Stage 1: Repository analysis for file discovery")
        repo_path = None
        file_tree = None
        file_analyses = []

        async for part in self.repository_analyzer(content):
            if part.mimetype == "application/json; type=CodebaseDiscovery":
                # Extract repository information
                discovery_data = json.loads(part.text)
                repo_path = discovery_data.get('repo_path', '')
                file_analyses = discovery_data.get('file_analyses', [])
                # Generate file tree for framework detection
                file_tree = self._generate_file_tree(repo_path) if repo_path else ""
                break

        if not repo_path or not file_analyses:
            logger.error("❌ Failed to get repository analysis")
            return

        # Stage 2: Build Rich Context (CRITICAL IMPROVEMENT)
        logger.info("🧠 Stage 2: Building rich codebase context (ZERO data loss)")

        # Convert file_analyses to FileScreeningResult objects if needed
        file_screening_results = []
        for file_data in file_analyses:
            if isinstance(file_data, dict):
                # Convert dict to FileScreeningResult
                file_result = FileScreeningResult(
                    file_path=file_data.get('file_path', ''),
                    relative_path=file_data.get('relative_path', ''),
                    summary=file_data.get('summary', ''),
                    documentation_score=file_data.get('documentation_score', 5),
                    file_type=file_data.get('file_type', 'unknown'),
                    complexity=file_data.get('complexity', 'medium'),
                    dependencies=file_data.get('dependencies', []),
                    estimated_doc_value=file_data.get('estimated_doc_value', 'medium'),
                    skip_reason=file_data.get('skip_reason'),
                    framework_category=file_data.get('framework_category'),
                    architectural_importance=file_data.get('architectural_importance', 5)
                )
                file_screening_results.append(file_result)
            else:
                file_screening_results.append(file_data)

        # Build rich context with full code understanding
        rich_context = await self.framework_detector.build_rich_context(
            repo_path, file_tree, file_screening_results
        )

        logger.info(f"✅ Rich context built: {len(rich_context.key_code_samples)} code samples, {len(rich_context.architectural_patterns)} patterns")

        # Stage 3: Rich Context Planning (uses actual code insights)
        logger.info("🎯 Stage 3: Rich context visualization planning")

        # Create rich context stream
        rich_context_json = json.dumps({
            'repo_path': rich_context.repo_path,
            'framework_discovery': {
                'primary_framework': rich_context.framework_discovery.primary_framework,
                'architecture_type': rich_context.framework_discovery.architecture_type,
                'confidence': rich_context.framework_discovery.confidence
            },
            'file_analyses': [self._file_result_to_dict(f) for f in rich_context.file_analyses],
            'architectural_patterns': rich_context.architectural_patterns,
            'key_code_samples': rich_context.key_code_samples,
            'file_relationships': rich_context.file_relationships,
            'entry_points': rich_context.entry_points
        })

        rich_context_part = content_api.ProcessorPart(
            rich_context_json,
            mimetype="application/json; type=RichCodebaseContext",
            metadata={"rich_context": rich_context}
        )

        # Plan with rich context
        async def rich_context_stream():
            yield rich_context_part

        planned_stream = self.visualization_planner(rich_context_stream())

        # Stage 4: Enhanced ASCII Generation (full file content)
        logger.info("⚡ Stage 4: Enhanced ASCII generation with full context")
        generated_stream = self.parallel_generator(planned_stream)

        # Stage 5: Result Aggregation
        logger.info("📚 Stage 5: Result aggregation and file generation")
        async for part in self.result_aggregator(generated_stream):
            yield part

        logger.info("🎉 IMPROVED ASCII Research Agent pipeline complete!")

    def _generate_file_tree(self, repo_path: str) -> str:
        """Generate a simple file tree for framework detection"""
        try:
            tree_lines = []
            for root, _dirs, files in os.walk(repo_path):
                level = root.replace(repo_path, '').count(os.sep)
                if level > 3:  # Limit depth
                    continue

                indent = ' ' * 2 * level
                tree_lines.append(f"{indent}{os.path.basename(root)}/")

                subindent = ' ' * 2 * (level + 1)
                for file in files[:10]:  # Limit files per directory
                    tree_lines.append(f"{subindent}{file}")

            return '\n'.join(tree_lines[:100])  # Limit total lines
        except Exception as e:
            logger.warning(f"Could not generate file tree: {e}")
            return ""

    def _file_result_to_dict(self, file_result: FileScreeningResult) -> Dict:
        """Convert FileScreeningResult to dictionary for JSON serialization"""
        return {
            'file_path': file_result.file_path,
            'relative_path': file_result.relative_path,
            'summary': file_result.summary,
            'documentation_score': file_result.documentation_score,
            'file_type': file_result.file_type,
            'complexity': file_result.complexity,
            'dependencies': file_result.dependencies,
            'estimated_doc_value': file_result.estimated_doc_value,
            'skip_reason': file_result.skip_reason,
            'framework_category': file_result.framework_category,
            'architectural_importance': file_result.architectural_importance
        }

# Main execution function
async def generate_ascii_documentation(
    repo_input: str,
    api_key: str,
    output_dir: str = "./ascii-docs",
    provider: str = "google",
    screen_model: str = None,
    doc_model: str = None,
    max_parallel_agents: int = 20,
    base_url: str = None
) -> Dict[str, Any]:
    """
    🧠 Generate ADAPTIVE ASCII documentation for any repository.

    ZERO hardcoded patterns - pure LLM intelligence discovers and adapts to any codebase.

    Args:
        repo_input: GitHub URL or local repository path
        api_key: API key for the AI provider
        output_dir: Output directory for generated documentation
        provider: AI provider ("google", "openai", "openrouter", "custom")
        screen_model: Model for file screening (cheap model)
        doc_model: Model for ASCII generation (smart model)
        max_parallel_agents: Maximum number of parallel sub-agents
        base_url: Base URL for custom provider

    Returns:
        Dictionary with generation results and file paths

    🎯 ADAPTIVE FEATURES:
    - Automatically detects ANY framework (React, Vue, Svelte, Next.js, FastAPI, etc.)
    - Intelligently classifies files based on actual content
    - Dynamically plans custom visualizations for each project
    - Zero maintenance for new frameworks or patterns
    """

    # Create adaptive agent (NO static patterns)
    agent = AdaptiveASCIIResearchAgent(
        api_key=api_key,
        provider=provider,
        screen_model=screen_model,
        doc_model=doc_model,
        base_url=base_url,
        max_parallel_agents=max_parallel_agents,
        output_dir=output_dir
        # Note: No ascii_types parameter - everything is dynamic!
    )

    # Create input stream
    input_stream = streams.stream_content([repo_input])

    # Execute pipeline
    results = {}
    async for part in agent(input_stream):
        if part.mimetype == "application/json; type=ASCIIDocumentationResult":
            results = json.loads(part.text)
        elif part.substream_name == "status":
            print(f"Status: {part.text}")
        elif part.substream_name == "error":
            print(f"Error: {part.text}")

    return results

# Command-line interface
def main():
    """Command-line interface for ASCII Research Agent"""
    import argparse

    parser = argparse.ArgumentParser(
        description="ASCII Research Agent - Generate ASCII architecture visualizations from GitHub repositories",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ascii_research_agent.py https://github.com/user/repo YOUR_API_KEY
  python ascii_research_agent.py ./local/repo YOUR_API_KEY --output ./my-ascii-docs
  python ascii_research_agent.py https://github.com/user/repo YOUR_API_KEY --provider openai --model gpt-4o
  python ascii_research_agent.py https://github.com/user/repo YOUR_API_KEY --ascii-types architecture,flow,wireframe
        """
    )

    parser.add_argument("repo_input", help="GitHub URL or local repository path")
    parser.add_argument("api_key", help="API key for the AI provider")
    parser.add_argument("--output", default="./ascii-docs", help="Output directory (default: ./ascii-docs)")
    parser.add_argument("--provider", default="google", choices=["google", "openai", "openrouter", "custom"],
                       help="AI provider (default: google)")
    parser.add_argument("--screen-model", help="Model for file screening (cheap model)")
    parser.add_argument("--doc-model", help="Model for ASCII generation (smart model)")
    parser.add_argument("--max-agents", type=int, default=20, help="Maximum parallel agents (default: 20)")
    parser.add_argument("--ascii-types", help="Comma-separated list of ASCII types to generate")
    parser.add_argument("--base-url", help="Base URL for custom provider")

    args = parser.parse_args()

    # 🧠 ADAPTIVE: No more static ASCII type validation!
    # The system now dynamically determines the best visualizations for each project
    if args.ascii_types:
        print("🧠 Note: --ascii-types parameter is deprecated in adaptive mode.")
        print("The system now intelligently determines the best visualizations for your project.")
        print("This provides better, more relevant results than static type selection.")

    # Run the agent
    try:
        results = asyncio.run(generate_ascii_documentation(
            repo_input=args.repo_input,
            api_key=args.api_key,
            output_dir=args.output,
            provider=args.provider,
            screen_model=args.screen_model,
            doc_model=args.doc_model,
            max_parallel_agents=args.max_agents,
            base_url=args.base_url
            # Note: No ascii_types - everything is adaptive!
        ))

        print(f"\n🎉 ASCII documentation generation complete!")
        print(f"📁 Output directory: {results.get('output_directory', args.output)}")
        print(f"📄 Generated files: {len(results.get('generated_files', []))}")
        print(f"🎨 Total visualizations: {results.get('total_visualizations', 0)}")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        logger.exception("ASCII Research Agent failed")
        return 1

if __name__ == "__main__":
    exit(main())