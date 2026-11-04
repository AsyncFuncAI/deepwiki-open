#!/usr/bin/env python3
"""
Wiki Research Agent - A multi-step agent that combines genai-processors and AdalFlow
to generate comprehensive wiki documentation from repository analysis.

This agent implements a 4-stage pipeline:
1. File Tree Analysis - Analyze repository structure
2. Topic Generation - Break down into researchable topics
3. Parallel Research - Research each topic using RAG
4. Content Synthesis - Combine results into wiki

Key Features:
- Parallel processing of research topics using genai-processors
- RAG-enhanced research using AdalFlow for accurate code analysis
- Streaming progress updates throughout the pipeline
- Modular architecture with chainable processors
- Support for both RAG-enabled and LLM-only research modes

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
    # Generate wiki with RAG using Google Gemini
    python wiki_research_agent.py /path/to/repo YOUR_GOOGLE_API_KEY --output wiki.md

    # Generate wiki using OpenAI GPT-4o
    python wiki_research_agent.py /path/to/repo YOUR_OPENAI_API_KEY --provider openai --model gpt-4o --output wiki.md

    # Generate wiki using OpenRouter with Claude
    python wiki_research_agent.py /path/to/repo YOUR_OPENROUTER_API_KEY --provider openrouter --model anthropic/claude-3.5-sonnet --output wiki.md

    # Generate onboarding-focused wiki for new developers
    python wiki_research_agent.py /path/to/repo YOUR_API_KEY --onboarding --output onboarding.md

    # Quick demo without RAG using OpenRouter
    python wiki_research_agent.py /path/to/repo YOUR_OPENROUTER_API_KEY --provider openrouter --model openai/gpt-4o --demo --no-rag

    # Custom number of topics with specific model
    python wiki_research_agent.py /path/to/repo YOUR_API_KEY --provider google --model gemini-2.5-pro --topics 8

    # Use environment variable for API key
    export OPENROUTER_API_KEY="your-key"
    python wiki_research_agent.py . --provider openrouter --model anthropic/claude-3.5-sonnet --output documentation.md

Architecture:
    The agent implements a 4-stage pipeline that combines genai-processors for
    orchestration with AdalFlow for RAG capabilities:

    1. FileTreeAnalyzer: Analyzes repository structure and identifies key patterns
    2. TopicGenerator: Uses LLM to break down the repo into researchable topics
    3. TopicResearcher: Parallel processors that research each topic using RAG
    4. ContentSynthesizer: Combines all research into a comprehensive wiki

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
logging.getLogger("api.openai_client").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

# Reduce RAG/data pipeline logging noise
logging.getLogger("api.data_pipeline").setLevel(logging.WARNING)
logging.getLogger("api.rag").setLevel(logging.WARNING)
logging.getLogger("adalflow").setLevel(logging.WARNING)

try:
    # Import DiagramGenerator
    from diagram_generator_agent import DiagramGenerator, create_diagram_generator
except ImportError as e:
    print("Warning: DiagramGenerator not found. Visual enhancement functionality will be disabled.")
    print(f"Import error: {e}")
    DiagramGenerator = None
    create_diagram_generator = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce Google API logging noise
logging.getLogger("google_genai.models").setLevel(logging.WARNING)
logging.getLogger("google.generativeai").setLevel(logging.WARNING)

# Helper function to create model instances
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

# Data structures for the research pipeline
try:
    from dataclasses_json import dataclass_json

    @dataclass_json
    @dataclass
    class RepositoryInfo:
        """Information about a repository structure"""
        path: str
        file_tree: Dict[str, Any]
        total_files: int
        file_types: Dict[str, int]
        key_directories: List[str]
        architecture_hints: List[str]

    @dataclass_json
    @dataclass
    class ResearchTopic:
        """A research topic with context about relevant files"""
        topic_name: str
        description: str
        relevant_files: List[str]
        research_questions: List[str]
        priority: int = 1  # 1=high, 2=medium, 3=low
        research_text: str = ""  # Will be filled by researcher

    @dataclass_json
    @dataclass
    class ResearchResult:
        """Result from researching a specific topic"""
        topic: ResearchTopic
        content: str
        sources: List[str]
        confidence: float = 0.0

except ImportError:
    # Fallback without dataclasses_json
    @dataclass
    class RepositoryInfo:
        """Information about a repository structure"""
        path: str
        file_tree: Dict[str, Any]
        total_files: int
        file_types: Dict[str, int]
        key_directories: List[str]
        architecture_hints: List[str]

        def to_dict(self):
            return {
                'path': self.path,
                'file_tree': self.file_tree,
                'total_files': self.total_files,
                'file_types': self.file_types,
                'key_directories': self.key_directories,
                'architecture_hints': self.architecture_hints
            }

    @dataclass
    class ResearchTopic:
        """A research topic with context about relevant files"""
        topic_name: str
        description: str
        relevant_files: List[str]
        research_questions: List[str]
        priority: int = 1  # 1=high, 2=medium, 3=low
        research_text: str = ""  # Will be filled by researcher

        def to_dict(self):
            return {
                'topic_name': self.topic_name,
                'description': self.description,
                'relevant_files': self.relevant_files,
                'research_questions': self.research_questions,
                'priority': self.priority,
                'research_text': self.research_text
            }

    @dataclass
    class ResearchResult:
        """Result from researching a specific topic"""
        topic: ResearchTopic
        content: str
        sources: List[str]
        confidence: float = 0.0

        def to_dict(self):
            return {
                'topic': self.topic.to_dict(),
                'content': self.content,
                'sources': self.sources,
                'confidence': self.confidence
            }

class FileTreeAnalyzer(processor.Processor):
    """Analyzes repository file structure to understand architecture"""

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.base_url = base_url

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"  # OpenRouter format
            elif provider.lower() == "custom":
                model_name = "gpt-4o"  # Default for custom, user should specify
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
        """Analyze repository structure and yield RepositoryInfo"""
        async for part in content:
            if content_api.is_text(part.mimetype):
                repo_input = part.text.strip()
                logger.info(f"Analyzing repository at: {repo_input}")

                # Handle GitHub URLs by cloning them first
                repo_path = await self._prepare_repository(repo_input)

                # Analyze file structure
                repo_info = self._analyze_repository(repo_path)

                # Create ProcessorPart with RepositoryInfo as JSON
                repo_info_json = json.dumps({
                    'path': repo_info.path,
                    'file_tree': repo_info.file_tree,
                    'total_files': repo_info.total_files,
                    'file_types': repo_info.file_types,
                    'key_directories': repo_info.key_directories,
                    'architecture_hints': repo_info.architecture_hints
                })

                repo_info_part = content_api.ProcessorPart(
                    repo_info_json,
                    mimetype="application/json; type=RepositoryInfo",
                    metadata={"repo_info": repo_info}
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
            temp_dir = tempfile.mkdtemp(prefix="wiki_agent_repo_")

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
    
    def _analyze_repository(self, repo_path: str) -> RepositoryInfo:
        """Analyze repository structure and extract key information"""
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
        
        return RepositoryInfo(
            path=repo_path,
            file_tree=file_tree,
            total_files=total_files,
            file_types=file_types,
            key_directories=key_directories,
            architecture_hints=architecture_hints
        )
    
    def _identify_key_directories(self, file_tree: Dict) -> List[str]:
        """Identify important directories in the repository"""
        key_dirs = []
        common_important_dirs = [
            'src', 'lib', 'api', 'components', 'services', 'utils', 'core',
            'models', 'views', 'controllers', 'routes', 'middleware', 'config',
            'tests', 'docs', 'examples', 'scripts', 'tools'
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
        
        # Framework detection
        if 'package.json' in str(file_tree):
            hints.append("Node.js project with package.json")
        if 'requirements.txt' in str(file_tree) or 'pyproject.toml' in str(file_tree):
            hints.append("Python project with dependencies")
        if 'Dockerfile' in str(file_tree):
            hints.append("Containerized application")
        if 'docker-compose.yml' in str(file_tree):
            hints.append("Multi-service Docker application")
        
        return hints

class TopicGenerator(processor.Processor):
    """Generates research topics from repository analysis"""

    def __init__(self, api_key: str, num_topics: int = 6, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.num_topics = num_topics
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"  # OpenRouter format
            elif provider.lower() == "custom":
                model_name = "gpt-4o"  # Default for custom, user should specify
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
        """Generate research topics from repository info"""
        async for part in content:
            if part.mimetype == "application/json; type=RepositoryInfo":
                # Get repo info from metadata or parse JSON
                repo_info = part.get_metadata("repo_info")
                if repo_info is None:
                    # Parse from JSON text
                    repo_data = json.loads(part.text)
                    repo_info = RepositoryInfo(**repo_data)

                logger.info(f"Generating topics for repository: {repo_info.path}")

                # Generate topics using LLM
                topics = await self._generate_topics(repo_info)

                # Yield each topic as a separate part
                for topic in topics:
                    topic_json = json.dumps({
                        'topic_name': topic.topic_name,
                        'description': topic.description,
                        'relevant_files': topic.relevant_files,
                        'research_questions': topic.research_questions,
                        'priority': topic.priority,
                        'research_text': topic.research_text
                    })

                    topic_part = content_api.ProcessorPart(
                        topic_json,
                        mimetype="application/json; type=ResearchTopic",
                        metadata={"topic": topic}
                    )
                    yield topic_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"Generated {len(topics)} research topics",
                    substream_name="status"
                )
                yield status_part

                # Also pass through the original RepositoryInfo for RAG initialization
                yield part
            else:
                yield part

    async def _generate_topics(self, repo_info: RepositoryInfo) -> List[ResearchTopic]:
        """Use LLM to generate research topics based on repository analysis"""

        # Create prompt for topic generation
        prompt = f"""
Analyze this repository structure and generate {self.num_topics} distinct research topics for creating comprehensive wiki documentation.

Repository Information:
- Path: {repo_info.path}
- Total files: {repo_info.total_files}
- File types: {repo_info.file_types}
- Key directories: {repo_info.key_directories}
- Architecture hints: {repo_info.architecture_hints}

File tree structure:
{json.dumps(repo_info.file_tree, indent=2)[:2000]}...

Generate {self.num_topics} research topics that would be essential for understanding this codebase. Each topic should:
1. Focus on a specific aspect (architecture, core features, APIs, configuration, etc.)
2. Be researchable using the available files
3. Contribute to comprehensive documentation

Return a JSON array of topics with this structure:
[
  {{
    "topic_name": "System Architecture",
    "description": "Overall system design and component relationships",
    "relevant_files": ["src/main.py", "config/settings.py"],
    "research_questions": ["How are components organized?", "What are the main modules?", "What are the core features?", "Breakdown the backend architecture"],
    "priority": 1
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

                # Convert to ResearchTopic objects
                topics = []
                for topic_data in topics_data:
                    topic = ResearchTopic(
                        topic_name=topic_data.get("topic_name", "Unknown Topic"),
                        description=topic_data.get("description", ""),
                        relevant_files=topic_data.get("relevant_files", []),
                        research_questions=topic_data.get("research_questions", []),
                        priority=topic_data.get("priority", 2)
                    )
                    topics.append(topic)

                logger.info(f"Generated {len(topics)} topics successfully")
                return topics

        except Exception as e:
            logger.error(f"Error parsing topics from LLM response: {e}")

        # Fallback: create default topics
        return self._create_default_topics(repo_info)

    def _create_default_topics(self, repo_info: RepositoryInfo) -> List[ResearchTopic]:
        """Create default research topics if LLM generation fails"""
        default_topics = [
            ResearchTopic(
                topic_name="System Architecture",
                description="Overall system design and component organization",
                relevant_files=[],
                research_questions=["How is the system structured?", "What are the main components?"],
                priority=1
            ),
            ResearchTopic(
                topic_name="Core Features",
                description="Main functionality and features of the system",
                relevant_files=[],
                research_questions=["What are the primary features?", "How do they work?"],
                priority=1
            ),
            ResearchTopic(
                topic_name="API Documentation",
                description="Available APIs and their usage",
                relevant_files=[],
                research_questions=["What APIs are available?", "How are they used?"],
                priority=2
            )
        ]

        logger.info(f"Using {len(default_topics)} default topics")
        return default_topics

class OnboardingTopicGenerator(processor.Processor):
    """Generates onboarding-focused research topics from repository analysis"""

    def __init__(self, api_key: str, num_topics: int = 6, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.num_topics = num_topics
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"  # OpenRouter format
            elif provider.lower() == "custom":
                model_name = "gpt-4o"  # Default for custom, user should specify
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
        """Generate onboarding-focused research topics from repository info"""
        async for part in content:
            if part.mimetype == "application/json; type=RepositoryInfo":
                # Get repo info from metadata or parse JSON
                repo_info = part.get_metadata("repo_info")
                if repo_info is None:
                    # Parse from JSON text
                    repo_data = json.loads(part.text)
                    repo_info = RepositoryInfo(**repo_data)

                logger.info(f"Generating onboarding topics for repository: {repo_info.path}")

                # Generate onboarding-focused topics using LLM
                topics = await self._generate_onboarding_topics(repo_info)

                # Yield each topic as a separate part
                for topic in topics:
                    topic_json = json.dumps({
                        'topic_name': topic.topic_name,
                        'description': topic.description,
                        'relevant_files': topic.relevant_files,
                        'research_questions': topic.research_questions,
                        'priority': topic.priority,
                        'research_text': topic.research_text
                    })

                    topic_part = content_api.ProcessorPart(
                        topic_json,
                        mimetype="application/json; type=ResearchTopic",
                        metadata={"topic": topic}
                    )
                    yield topic_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"Generated {len(topics)} onboarding-focused research topics",
                    substream_name="status"
                )
                yield status_part

                # Also pass through the original RepositoryInfo for RAG initialization
                yield part
            else:
                yield part

    async def _generate_onboarding_topics(self, repo_info: RepositoryInfo) -> List[ResearchTopic]:
        """Use LLM to generate onboarding-focused research topics based on repository analysis"""

        # Create prompt for onboarding topic generation
        prompt = f"""
Analyze this repository structure and generate {self.num_topics} distinct research topics specifically focused on ONBOARDING new developers to this codebase.

Repository Information:
- Path: {repo_info.path}
- Total files: {repo_info.total_files}
- File types: {repo_info.file_types}
- Key directories: {repo_info.key_directories}
- Architecture hints: {repo_info.architecture_hints}

File tree structure:
{json.dumps(repo_info.file_tree, indent=2)[:2000]}...

Generate {self.num_topics} onboarding-focused research topics that would help new developers understand and get started with this codebase. Each topic should:
1. Focus on helping newcomers understand the project (setup, getting started, key concepts)
2. Address common questions new developers would have
3. Provide practical guidance for contributing to the project
4. Cover essential knowledge for working with this codebase

Prioritize topics that answer these onboarding questions:
- How do I set up and run this project locally?
- What are the main components and how do they work together?
- Where do I start if I want to make changes?
- What are the coding conventions and best practices?
- How is the project structured and organized?
- What are the key dependencies and tools used?

Return a JSON array of topics with this structure:
[
  {{
    "topic_name": "Getting Started Guide",
    "description": "Complete setup instructions and first steps for new developers",
    "relevant_files": ["README.md", "package.json", "requirements.txt", "Dockerfile"],
    "research_questions": ["How do I install dependencies?", "How do I run the project locally?", "What are the prerequisites?", "How do I verify the setup works?"],
    "priority": 1
  }},
  {{
    "topic_name": "Project Structure Overview",
    "description": "Understanding the codebase organization and key directories",
    "relevant_files": ["src/", "lib/", "components/"],
    "research_questions": ["How is the code organized?", "What does each directory contain?", "Where are the main entry points?", "How are files and modules structured?"],
    "priority": 1
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

                # Convert to ResearchTopic objects
                topics = []
                for topic_data in topics_data:
                    topic = ResearchTopic(
                        topic_name=topic_data.get("topic_name", "Unknown Topic"),
                        description=topic_data.get("description", ""),
                        relevant_files=topic_data.get("relevant_files", []),
                        research_questions=topic_data.get("research_questions", []),
                        priority=topic_data.get("priority", 2)
                    )
                    topics.append(topic)

                logger.info(f"Generated {len(topics)} onboarding topics successfully")
                return topics

        except Exception as e:
            logger.error(f"Error parsing onboarding topics from LLM response: {e}")

        # Fallback: create default onboarding topics
        return self._create_default_onboarding_topics(repo_info)

    def _create_default_onboarding_topics(self, repo_info: RepositoryInfo) -> List[ResearchTopic]:
        """Create default onboarding research topics if LLM generation fails"""
        default_topics = [
            ResearchTopic(
                topic_name="Getting Started Guide",
                description="Complete setup instructions and first steps for new developers",
                relevant_files=[],
                research_questions=[
                    "How do I install dependencies?",
                    "How do I run the project locally?",
                    "What are the prerequisites?",
                    "How do I verify the setup works?"
                ],
                priority=1
            ),
            ResearchTopic(
                topic_name="Project Structure Overview",
                description="Understanding the codebase organization and key directories",
                relevant_files=[],
                research_questions=[
                    "How is the code organized?",
                    "What does each directory contain?",
                    "Where are the main entry points?",
                    "How are files and modules structured?"
                ],
                priority=1
            ),
            ResearchTopic(
                topic_name="Development Workflow",
                description="How to contribute to the project and development best practices",
                relevant_files=[],
                research_questions=[
                    "What is the development workflow?",
                    "How do I make changes and test them?",
                    "What are the coding conventions?",
                    "How do I submit contributions?"
                ],
                priority=1
            ),
            ResearchTopic(
                topic_name="Key Dependencies and Tools",
                description="Understanding the main libraries, frameworks, and tools used",
                relevant_files=[],
                research_questions=[
                    "What are the main dependencies?",
                    "What tools are required for development?",
                    "How are dependencies managed?",
                    "What build tools are used?"
                ],
                priority=2
            ),
            ResearchTopic(
                topic_name="Core Concepts and Architecture",
                description="Essential concepts and architectural patterns new developers should understand",
                relevant_files=[],
                research_questions=[
                    "What are the core concepts?",
                    "How does the architecture work?",
                    "What patterns are used?",
                    "How do components interact?"
                ],
                priority=2
            ),
            ResearchTopic(
                topic_name="Common Tasks and Examples",
                description="Typical development tasks and code examples for new contributors",
                relevant_files=[],
                research_questions=[
                    "What are common development tasks?",
                    "Where can I find code examples?",
                    "How do I implement new features?",
                    "What are the typical workflows?"
                ],
                priority=2
            )
        ]

        # Limit to requested number of topics
        limited_topics = default_topics[:self.num_topics]

        logger.info(f"Using {len(limited_topics)} default onboarding topics")
        return limited_topics

# Example usage function
async def analyze_repository_example(repo_path: str, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
    """Example of how to use the file tree analyzer and topic generator"""

    # Create the pipeline
    file_analyzer = FileTreeAnalyzer(api_key, provider, model_name, base_url)
    topic_generator = TopicGenerator(api_key, num_topics=5, provider=provider, model_name=model_name, base_url=base_url)
    
    # Chain the processors
    analysis_pipeline = file_analyzer + topic_generator
    
    # Create input stream
    input_stream = streams.stream_content([repo_path])
    
    # Process and collect results
    topics = []
    async for part in analysis_pipeline(input_stream):
        if part.mimetype == "application/json; type=ResearchTopic":
            topic = part.get_dataclass(ResearchTopic)
            topics.append(topic)
            print(f"Generated topic: {topic.topic_name}")
        elif part.substream_name == "status":
            print(f"Status: {part.text}")
    
    return topics

class TopicResearcher(processor.PartProcessor):
    """Researches individual topics using AdalFlow RAG"""

    def __init__(self, api_key: str, rag_instance: Optional[Any] = None, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.rag = rag_instance
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"  # OpenRouter format
            elif provider.lower() == "custom":
                model_name = "gpt-4o"  # Default for custom, user should specify
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
        """Only process ResearchTopic parts"""
        return part.mimetype == "application/json; type=ResearchTopic"

    async def call(self, content: content_api.ProcessorPart) -> AsyncIterable[content_api.ProcessorPart]:
        """Research a specific topic using RAG"""
        if self.match(content):
            # Get topic from metadata or parse JSON
            topic = content.get_metadata("topic")
            if topic is None:
                # Parse from JSON text
                topic_data = json.loads(content.text)
                topic = ResearchTopic(**topic_data)

            logger.info(f"Researching topic: {topic.topic_name}")

            # Yield status update
            status_part = content_api.ProcessorPart(
                f"Starting research on: {topic.topic_name}",
                substream_name="status"
            )
            yield status_part

            # Conduct research
            research_result = await self._research_topic(topic)

            # Skip if no valid research result (e.g., no RAG content found)
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
                    'topic_name': research_result.topic.topic_name,
                    'description': research_result.topic.description,
                    'relevant_files': research_result.topic.relevant_files,
                    'research_questions': research_result.topic.research_questions,
                    'priority': research_result.topic.priority,
                    'research_text': research_result.topic.research_text
                },
                'content': research_result.content,
                'sources': research_result.sources,
                'confidence': research_result.confidence
            })

            result_part = content_api.ProcessorPart(
                result_json,
                mimetype="application/json; type=ResearchResult",
                metadata={"research_result": research_result}
            )
            yield result_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"Completed research on: {topic.topic_name}",
                substream_name="status"
            )
            yield completion_part
        else:
            # Pass through non-matching parts
            yield content

    async def _research_topic(self, topic: ResearchTopic) -> Optional[ResearchResult]:
        """Conduct research on a specific topic using RAG"""
        try:
            if self.rag is None:
                # Skip topics when RAG is not available - we want repository-specific content only
                logger.warning(f"RAG not available for topic: {topic.topic_name}, skipping")
                return None

            # Use RAG to research the topic
            research_queries = self._generate_research_queries(topic)
            all_content = []
            all_sources = []

            for query in research_queries:
                logger.info(f"Querying RAG for: {query}")

                # Get RAG response
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
                    import traceback
                    logger.debug(f"RAG error traceback: {traceback.format_exc()}")
                    continue

            # Synthesize research content
            if all_content and len(all_content) >= 2:  # Require at least 2 content pieces for quality
                logger.info(f"Found {len(all_content)} content pieces from RAG for topic: {topic.topic_name}")
                synthesized_content = await self._synthesize_research(topic, all_content)
                # Improved confidence calculation based on more content and sources
                confidence = min(0.95, (len(all_content) / 50.0) + (len(all_sources) / 20.0))
                content_str = str(synthesized_content)  # _synthesize_research returns a string
            else:
                logger.warning(f"Insufficient RAG content found for topic: {topic.topic_name} (found {len(all_content)} pieces), skipping")
                # Return None to indicate this topic should be skipped
                return None

            return ResearchResult(
                topic=topic,
                content=content_str,
                sources=all_sources,
                confidence=confidence
            )

        except Exception as e:
            logger.error(f"Error researching topic {getattr(topic, 'topic_name', 'Unknown')}: {e}")
            # Return error result
            return ResearchResult(
                topic=topic,
                content=f"Error occurred while researching {getattr(topic, 'topic_name', 'Unknown')}: {str(e)}",
                sources=[],
                confidence=0.0
            )

    def _generate_research_queries(self, topic: ResearchTopic) -> List[str]:
        """Generate specific queries for RAG based on the topic"""
        queries = []

        # Add the main topic description as a query
        queries.append(topic.description)

        # Add research questions as queries (increased from 3 to 5 since we get more content per query)
        for question in topic.research_questions[:5]:
            queries.append(question)

        # Add topic-specific queries (reduced since we get more comprehensive results)
        topic_lower = topic.topic_name.lower()
        if "architecture" in topic_lower:
            queries.extend([
                "system architecture components modules",
                "design patterns implementation"
            ])
        elif "api" in topic_lower:
            queries.extend([
                "API endpoints routes handlers",
                "authentication authorization middleware"
            ])
        elif "feature" in topic_lower:
            queries.extend([
                "main functionality core features",
                "user interface components"
            ])
        elif "config" in topic_lower:
            queries.extend([
                "configuration settings environment",
                "deployment setup files"
            ])

        return queries[:2]  # Further reduced to 2 for faster diagram generation

    async def _synthesize_research(self, topic: ResearchTopic, content_pieces: List[str]) -> str:
        """Synthesize research content using LLM"""

        # Combine content pieces with better organization
        combined_content = "\n\n".join(content_pieces)

        # Calculate content length for better handling
        content_length = len(combined_content)
        logger.info(f"Synthesizing {len(content_pieces)} content pieces ({content_length} characters) for topic: {topic.topic_name}")

        prompt = f"""
Based on the following code and documentation content from multiple files, write a comprehensive research summary for the topic: {topic.topic_name}

Topic Description: {topic.description}

Research Questions to Address:
{chr(10).join(f"- {q}" for q in topic.research_questions)}

Available Content from Repository Files:
{combined_content}

Please provide a well-structured summary that:
1. ONLY uses information found in the provided repository files - do not add generic information
2. Addresses the research questions based on actual code and documentation found
3. Provides specific examples from the actual code with exact file references
4. Uses markdown formatting for readability
5. Organizes information logically with clear sections
6. References specific files and line numbers when discussing implementations
7. If certain aspects cannot be determined from the provided content, simply omit them rather than making assumptions

IMPORTANT: Base your response entirely on the provided repository content. Do not include generic statements or inferred information not present in the files.

Generate a detailed research summary based solely on the repository content:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        return response_text



class ContentSynthesizer(processor.Processor):
    """Synthesizes research results into a comprehensive wiki document"""

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider

        # Set default model based on provider
        if model_name is None:
            if provider.lower() == "openai":
                model_name = "gpt-4o"
            elif provider.lower() == "openrouter":
                model_name = "openai/gpt-4o"  # OpenRouter format
            elif provider.lower() == "custom":
                model_name = "gpt-4o"  # Default for custom, user should specify
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

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Synthesize all research results into final wiki"""
        research_results = []

        # Collect all research results (both regular and enhanced)
        async for part in content:
            if part.mimetype == "application/json; type=ResearchResult":
                try:
                    # Get result from metadata or parse JSON
                    result = part.get_metadata("research_result")
                    if result is None:
                        # Parse from JSON text
                        result_data = json.loads(part.text)
                        topic_data = result_data['topic']
                        topic = ResearchTopic(**topic_data)
                        result = ResearchResult(
                            topic=topic,
                            content=result_data['content'],
                            sources=result_data['sources'],
                            confidence=result_data['confidence']
                        )

                    # Validate result object
                    if not hasattr(result, 'topic') or not hasattr(result, 'content'):
                        logger.warning(f"Invalid research result object: {type(result)}")
                        continue

                    research_results.append(result)
                    topic_name = getattr(getattr(result, 'topic', None), 'topic_name', 'Unknown')
                    logger.info(f"Collected research result for: {topic_name}")
                    logger.debug(f"Has topic: {hasattr(result, 'topic')}")

                except Exception as e:
                    logger.error(f"Error processing research result: {e}")
                    continue
            elif part.mimetype == "application/json; type=EnhancedResearchResult":
                try:
                    # Handle enhanced research results with diagrams
                    result_data = json.loads(part.text)
                    topic_data = result_data['topic']
                    topic = ResearchTopic(**topic_data)

                    # Use enhanced content if available, otherwise fall back to original
                    content_to_use = result_data.get('enhanced_content', result_data.get('original_content', ''))

                    result = ResearchResult(
                        topic=topic,
                        content=content_to_use,
                        sources=result_data['sources'],
                        confidence=result_data['confidence']
                    )

                    research_results.append(result)
                    topic_name = getattr(getattr(result, 'topic', None), 'topic_name', 'Unknown')
                    logger.info(f"Collected enhanced research result for: {topic_name}")

                except Exception as e:
                    logger.error(f"Error processing enhanced research result: {e}")
                    continue

            elif part.substream_name == "status":
                yield part  # Pass through status updates

        if research_results:
            logger.info(f"Synthesizing {len(research_results)} research results into wiki")

            # Generate final wiki document
            wiki_content = await self._synthesize_wiki(research_results)

            # Yield the final wiki document
            wiki_part = content_api.ProcessorPart(
                wiki_content,
                mimetype="text/markdown",
                metadata={"title": "Generated Wiki Documentation"}
            )
            yield wiki_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"Wiki synthesis complete. Generated documentation with {len(research_results)} sections.",
                substream_name="status"
            )
            yield completion_part

    async def _synthesize_wiki(self, research_results: List[ResearchResult]) -> str:
        """Synthesize research results into a comprehensive wiki document"""

        # Sort results by topic priority
        try:
            sorted_results = sorted(research_results, key=lambda r: getattr(r, 'topic', None) and getattr(r.topic, 'priority', 2))
        except (AttributeError, TypeError):
            # Fallback if sorting fails
            sorted_results = research_results

        # Prepare content for synthesis
        sections_content = []
        for result in sorted_results:
            try:
                # Handle different result types safely
                if hasattr(result, 'topic') and hasattr(result, 'content'):
                    topic_name = getattr(result.topic, 'topic_name', 'Unknown Topic')
                    content = getattr(result, 'content', 'No content available')
                    sources = getattr(result, 'sources', [])
                    confidence = getattr(result, 'confidence', 0.0)

                    section = f"""
## {topic_name}

{content}

**Sources:** {', '.join(sources) if sources else 'General knowledge'}
**Confidence:** {confidence:.1%}
"""
                else:
                    # Handle unexpected result format
                    section = f"""
## Research Result

{str(result)}
"""
                sections_content.append(section)
            except Exception as e:
                logger.warning(f"Error processing research result: {e}")
                sections_content.append(f"""
## Error Processing Result

Unable to process research result: {str(e)}
""")
                continue

        combined_sections = "\n".join(sections_content)

        prompt = f"""
Create a comprehensive wiki documentation by synthesizing the following research sections.
The output should be a well-structured, professional wiki document in markdown format.

Research Sections:
{combined_sections}

1. Start with a clear, descriptive **Title** and an **Overview** that explains the topic using first principles thinking — break down complex ideas into their fundamental components.
2. Include a detailed **Table of Contents** that reflects the document’s logical flow.
3. Organize all sections clearly, using proper markdown headings (`#`, `##`, `###`), bullet points, and code blocks (if needed) to ensure readability.
4. Add appropriate **cross-references and internal links** between relevant sections to guide readers through related concepts.
5. Maintain **technical accuracy**, ensuring explanations are correct and verifiable.
6. Use consistent terminology and define key terms where necessary.
7. End with a **Conclusion or Summary** section that reinforces the core ideas and highlights actionable insights.
8. Follow best practices for writing high-quality technical documentation.

Output only the complete **markdown-formatted wiki document** — do not include instructions or commentary.  

**Key focus:** Apply first principles thinking throughout: deconstruct complex ideas, reason from fundamentals, and rebuild explanations in a simple, clear, and structured way.


Generate the complete wiki document:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        return response_text

class WikiResearchAgent(processor.Processor):
    """Main orchestrator for the wiki research pipeline"""

    def __init__(self, api_key: str, repo_input: str, num_topics: int = 5, use_rag: bool = True, use_diagrams: bool = True, max_diagrams: int = 6, max_tables: int = 4, parallel_diagrams: bool = True, onboarding_mode: bool = False, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.repo_input = repo_input
        self.num_topics = num_topics
        self.use_rag = use_rag
        self.use_diagrams = use_diagrams
        self.max_diagrams = max_diagrams
        self.max_tables = max_tables
        self.parallel_diagrams = parallel_diagrams
        self.onboarding_mode = onboarding_mode
        self.provider = provider
        self.model_name = model_name
        self.base_url = base_url
        self.temp_repo_path = None  # Track if we created a temp directory

        # Initialize components with provider support
        self.file_analyzer = FileTreeAnalyzer(api_key, provider, model_name, base_url)
        # Choose topic generator based on mode
        if onboarding_mode:
            self.topic_generator = OnboardingTopicGenerator(api_key, num_topics, provider, model_name, base_url)
            logger.info(f"Using OnboardingTopicGenerator for onboarding-focused wiki generation with {provider} provider")
        else:
            self.topic_generator = TopicGenerator(api_key, num_topics, provider, model_name, base_url)
            logger.info(f"Using standard TopicGenerator for comprehensive wiki generation with {provider} provider")
        self.content_synthesizer = ContentSynthesizer(api_key, provider, model_name, base_url)

        # Initialize diagram generator if available (validation removed - frontend handles repair)
        if self.use_diagrams and create_diagram_generator is not None:
            self.diagram_generator = create_diagram_generator(
                api_key,
                model_name=model_name,
                max_diagrams=max_diagrams,
                max_tables=max_tables,
                provider=provider,
                base_url=base_url
            )
            if self.diagram_generator is None:
                logger.warning("DiagramGenerator could not be initialized, proceeding without visual enhancements")
        else:
            self.diagram_generator = None
            if self.use_diagrams:
                logger.warning("DiagramGenerator not available, proceeding without visual enhancements")

        # RAG will be initialized later with the actual repo path
        self.rag = None

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute the complete wiki research pipeline"""

        # Stage 1: Analyze repository and generate topics
        analysis_pipeline = self.file_analyzer + self.topic_generator
        topic_stream = analysis_pipeline(content)

        # Stage 2: Collect topics and initialize RAG with actual repo path
        topics = []
        repo_path_for_rag = None

        # We need to manually iterate through the pipeline to capture both topics and repo info
        async for part in topic_stream:
            if part.mimetype == "application/json; type=ResearchTopic":
                topics.append(part)
                # Get topic name for logging
                topic_obj = part.get_metadata('topic')
                if topic_obj:
                    topic_name = getattr(topic_obj, 'topic_name', 'Unknown')
                else:
                    try:
                        topic_data = json.loads(part.text)
                        topic_name = topic_data.get('topic_name', 'Unknown')
                    except:
                        topic_name = 'Unknown'
                logger.debug(f"Collected topic: {topic_name}")
            elif part.mimetype == "application/json; type=RepositoryInfo":
                # Extract the actual repo path from the repository info
                repo_info = part.get_metadata("repo_info")
                if repo_info:
                    repo_path_for_rag = repo_info.path
                    logger.info(f"Got actual repo path for RAG: {repo_path_for_rag}")
                else:
                    # Try parsing from JSON
                    try:
                        repo_data = json.loads(part.text)
                        repo_path_for_rag = repo_data.get('path')
                        logger.info(f"Parsed repo path from JSON: {repo_path_for_rag}")
                    except Exception as e:
                        logger.error(f"Failed to parse repo info: {e}")
            elif part.substream_name == "status":
                yield part  # Pass through status updates

        # Initialize RAG now that we have the actual repository path
        if self.use_rag and repo_path_for_rag and RAG is not None:
            try:
                logger.info(f"Initializing RAG with repository path: {repo_path_for_rag}")
                self.rag = RAG(provider="google", model="gemini-2.0-flash")
                self.rag.prepare_retriever(repo_path_for_rag)
                logger.info(f"RAG retriever ready with {len(getattr(self.rag, 'transformed_docs', []))} documents")
            except Exception as e:
                logger.warning(f"Failed to initialize RAG: {e}. Proceeding without RAG.")
                logger.debug(f"RAG initialization error: {e}")
                import traceback
                logger.debug(f"RAG error traceback: {traceback.format_exc()}")
                self.use_rag = False
                self.rag = None
        else:
            logger.warning(f"RAG not initialized: use_rag={self.use_rag}, repo_path={repo_path_for_rag}, RAG_available={RAG is not None}")

        if not topics:
            error_part = content_api.ProcessorPart(
                "No research topics generated. Cannot proceed with research.",
                substream_name="error"
            )
            yield error_part
            return

        logger.info(f"Starting parallel research on {len(topics)} topics")

        # Stage 3: Parallel research using genai-processors parallel execution
        researchers = [TopicResearcher(self.api_key, self.rag, self.provider, self.model_name, self.base_url) for _ in range(len(topics))]

        # Convert topics to individual streams
        topic_streams = [streams.stream_content([topic]) for topic in topics]

        # Process topics in parallel
        research_streams = [
            researcher.to_processor()(topic_stream)
            for researcher, topic_stream in zip(researchers, topic_streams)
        ]

        # Merge all research results
        merged_research = streams.merge(research_streams)

        # Stage 4: Enhance with diagrams and tables (if enabled)
        if self.diagram_generator is not None:
            if self.parallel_diagrams:
                logger.info("Enhancing research results with visual diagrams and tables (parallel mode)")
                enhanced_research = self._enhance_research_parallel(merged_research)
            else:
                logger.info("Enhancing research results with visual diagrams and tables (sequential mode)")
                enhanced_research = self.diagram_generator.to_processor()(merged_research)
        else:
            logger.info("Proceeding without visual enhancements")
            enhanced_research = merged_research

        # Stage 5: Synthesize final wiki
        async for part in self.content_synthesizer(enhanced_research):
            yield part

    async def _enhance_research_parallel(self, merged_research):
        """Enhance research results with diagrams in parallel instead of sequentially"""
        import asyncio

        # Collect all research results first
        research_results = []
        async for part in merged_research:
            research_results.append(part)

        logger.info(f"Collected {len(research_results)} research results for parallel diagram enhancement")

        # Process all diagram enhancements in parallel
        enhancement_tasks = []
        for result in research_results:
            if self.diagram_generator.match(result):
                # Create async task for each diagram enhancement
                task = asyncio.create_task(self.diagram_generator.call(result))
                enhancement_tasks.append((task, result))
            else:
                # Non-matching results go through as-is
                enhancement_tasks.append((None, result))

        # Wait for all diagram enhancements to complete in parallel
        logger.info(f"Starting parallel enhancement of {len([t for t, _ in enhancement_tasks if t is not None])} research results")

        enhanced_results = []
        for task, original_result in enhancement_tasks:
            if task is not None:
                try:
                    enhanced_result = await task
                    enhanced_results.append(enhanced_result)
                except Exception as e:
                    logger.error(f"Error enhancing research result: {e}")
                    enhanced_results.append(original_result)  # Fallback to original
            else:
                enhanced_results.append(original_result)

        logger.info(f"Completed parallel enhancement of {len(enhanced_results)} research results")

        # Yield all enhanced results
        for result in enhanced_results:
            yield result

# Convenience function for easy usage
async def generate_wiki_for_repository(repo_path: str, api_key: str, num_topics: int = 5, use_rag: bool = True, use_diagrams: bool = True, max_diagrams: int = 6, max_tables: int = 4, parallel_diagrams: bool = True, onboarding_mode: bool = False, provider: str = "google", model_name: str = None, base_url: str = None) -> str:
    """
    Generate wiki documentation for a repository

    Args:
        repo_path: Path to the repository
        api_key: API key for the chosen provider
        num_topics: Number of research topics to generate
        use_rag: Whether to use RAG for enhanced research
        use_diagrams: Whether to generate visual diagrams and tables
        max_diagrams: Maximum number of diagrams to generate per topic
        max_tables: Maximum number of tables to generate per topic
        parallel_diagrams: Process all diagram generation in parallel (default: True)
        onboarding_mode: Whether to generate onboarding-focused wiki (default: False)
        provider: AI provider to use ("google", "openai", "openrouter", or "custom")
        model_name: Specific model name to use (optional, defaults based on provider)
        base_url: Base URL for custom provider (required when provider="custom")

    Returns:
        Generated wiki content as markdown string

    Note: Validation removed - frontend handles diagram repair with AI
    """

    # Create the research agent
    agent = WikiResearchAgent(api_key, repo_path, num_topics, use_rag, use_diagrams, max_diagrams, max_tables, parallel_diagrams, onboarding_mode, provider, model_name, base_url)

    # Create input stream with repository path
    input_stream = streams.stream_content([repo_path])

    # Execute the pipeline and collect results
    wiki_content = ""
    async for part in agent(input_stream):
        if part.mimetype == "text/markdown":
            wiki_content = part.text
            logger.info("Wiki generation completed successfully")
        elif part.substream_name == "status":
            logger.info(f"Status: {part.text}")
        elif part.substream_name == "error":
            logger.error(f"Error: {part.text}")

    return wiki_content

def validate_requirements():
    """Validate that all required dependencies are available"""
    missing_deps = []

    # Check for genai-processors
    try:
        import genai_processors  # type: ignore # noqa: F401
    except ImportError:
        missing_deps.append("genai-processors")

    # Check for Google API key
    if not os.getenv('GOOGLE_API_KEY'):
        logger.warning("GOOGLE_API_KEY environment variable not set. You'll need to provide it as an argument.")

    # Check for AdalFlow (optional)
    if RAG is None:
        logger.warning("AdalFlow not available. RAG functionality will be disabled.")

    if missing_deps:
        print(f"Missing required dependencies: {', '.join(missing_deps)}")
        print("Please install them with: pip install genai-processors")
        return False

    return True

def print_progress_bar(current: int, total: int, prefix: str = "Progress", length: int = 50):
    """Print a progress bar"""
    percent = (current / total) * 100
    filled_length = int(length * current // total)
    bar = '█' * filled_length + '-' * (length - filled_length)
    print(f'\r{prefix}: |{bar}| {percent:.1f}% ({current}/{total})', end='', flush=True)
    if current == total:
        print()  # New line when complete

async def run_with_progress_tracking(agent_func, *args, **kwargs):
    """Run the agent with progress tracking"""
    start_time = time.time()

    try:
        result = await agent_func(*args, **kwargs)
        end_time = time.time()
        duration = end_time - start_time

        print(f"\n✅ Wiki generation completed successfully in {duration:.1f} seconds")
        return result

    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time

        print(f"\n❌ Wiki generation failed after {duration:.1f} seconds")
        print(f"Error: {e}")
        raise

def create_sample_config():
    """Create a sample configuration file for the agent"""
    config = {
        "agent_settings": {
            "default_topics": 5,
            "use_rag": True,
            "max_content_length": 3000,
            "confidence_threshold": 0.3
        },
        "genai_settings": {
            "model_name": "gemini-2.5-flash",
            "temperature": 0.7,
            "max_tokens": 2048
        },
        "rag_settings": {
            "provider": "google",
            "retrieval_limit": 3,
            "chunk_size": 1000
        }
    }

    with open("wiki_agent_config.json", "w") as f:
        json.dump(config, f, indent=2)

    print("Sample configuration saved to wiki_agent_config.json")

if __name__ == "__main__":
    import sys
    import argparse

    # Validate requirements first
    if not validate_requirements():
        sys.exit(1)

    # Set up argument parser
    parser = argparse.ArgumentParser(
        description="Wiki Research Agent - Generate comprehensive wiki documentation from repository analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate wiki with RAG for current directory (Google Gemini)
  python wiki_research_agent.py . YOUR_GOOGLE_API_KEY --output wiki.md

  # Generate wiki using OpenAI GPT-4o
  python wiki_research_agent.py . YOUR_OPENAI_API_KEY --provider openai --model gpt-4o --output wiki.md

  # Generate wiki using OpenRouter with Claude
  python wiki_research_agent.py . YOUR_OPENROUTER_API_KEY --provider openrouter --model anthropic/claude-3.5-sonnet --output wiki.md

  # Generate wiki using custom provider (e.g., local LLM server)
  python wiki_research_agent.py . YOUR_API_KEY --provider custom --model llama-3.1-70b --base-url http://localhost:8000/v1 --output wiki.md

  # Generate onboarding-focused wiki for new developers
  python wiki_research_agent.py . YOUR_API_KEY --onboarding --output onboarding.md

  # Quick demo without RAG using OpenRouter
  python wiki_research_agent.py /path/to/repo YOUR_OPENROUTER_API_KEY --provider openrouter --model openai/gpt-4o --demo --no-rag

  # Generate 8 topics with custom output using specific Gemini model
  python wiki_research_agent.py /path/to/repo YOUR_GOOGLE_API_KEY --provider google --model gemini-2.5-pro --topics 8 -o documentation.md

  # Create sample configuration
  python wiki_research_agent.py --create-config
        """
    )

    parser.add_argument("repo_path", nargs='?', help="Path to the repository to analyze")
    parser.add_argument("api_key", nargs='?', help="API key for the chosen provider (or set GOOGLE_API_KEY/OPENAI_API_KEY/OPENROUTER_API_KEY env var)")
    parser.add_argument("--topics", type=int, default=5, help="Number of research topics to generate (default: 5)")
    parser.add_argument("--no-rag", action="store_true", help="Disable RAG and use only LLM research")
    parser.add_argument("--no-diagrams", action="store_true", help="Disable visual diagram and table generation")
    parser.add_argument("--fast-diagrams", action="store_true", help="Generate fewer diagrams for faster processing")
    parser.add_argument("--max-diagrams", type=int, default=6, help="Maximum number of diagrams per topic (default: 6)")
    parser.add_argument("--max-tables", type=int, default=4, help="Maximum number of tables per topic (default: 4)")
    parser.add_argument("--sequential-diagrams", action="store_true", help="Process diagrams sequentially instead of in parallel")
    parser.add_argument("--onboarding", action="store_true", help="Generate onboarding-focused wiki for new developers")
    parser.add_argument("--output", "-o", help="Output file for the generated wiki (default: stdout)")
    parser.add_argument("--demo", action="store_true", help="Run topic generation demo only")
    parser.add_argument("--create-config", action="store_true", help="Create a sample configuration file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode with detailed logging")
    parser.add_argument("--quiet", "-q", action="store_true", help="Reduce log output (WARNING level only)")
    parser.add_argument("--provider", choices=["google", "openai", "openrouter", "custom"], default="google", help="AI provider to use (default: google)")
    parser.add_argument("--model", help="Specific model name to use (e.g., gpt-4o, openai/gpt-4o, gemini-2.5-pro)")
    parser.add_argument("--base-url", help="Base URL for custom provider (required when --provider=custom)")

    args = parser.parse_args()

    # Handle special commands
    if args.create_config:
        create_sample_config()
        sys.exit(0)

    # Validate required arguments
    if not args.repo_path:
        parser.error("repo_path is required unless using --create-config")

    # Validate custom provider requirements
    if args.provider == "custom" and not args.base_url:
        parser.error("--base-url is required when using --provider=custom")

    # Get API key from argument, environment, or .env file based on provider
    api_key = args.api_key

    if not api_key:
        if args.provider == "openai":
            api_key = os.getenv('OPENAI_API_KEY')
        elif args.provider == "openrouter":
            api_key = os.getenv('OPENROUTER_API_KEY')
        elif args.provider == "custom":
            # For custom provider, user must provide API key as argument
            pass
        else:
            api_key = os.getenv('GOOGLE_API_KEY')

    # Try to load from .env file if not found
    if not api_key:
        try:
            from pathlib import Path
            env_file = Path('.env')
            if env_file.exists():
                with open(env_file) as f:
                    for line in f:
                        if args.provider == "openai" and line.startswith('OPENAI_API_KEY='):
                            api_key = line.split('=', 1)[1].strip().strip('"\'')
                            break
                        elif args.provider == "openrouter" and line.startswith('OPENROUTER_API_KEY='):
                            api_key = line.split('=', 1)[1].strip().strip('"\'')
                            break
                        elif args.provider == "google" and line.startswith('GOOGLE_API_KEY='):
                            api_key = line.split('=', 1)[1].strip().strip('"\'')
                            break
        except Exception:
            pass

    if not api_key:
        if args.provider == "openai":
            env_var = "OPENAI_API_KEY"
        elif args.provider == "openrouter":
            env_var = "OPENROUTER_API_KEY"
        elif args.provider == "custom":
            parser.error(f"API key is required for custom provider. Provide it as an argument.")
        else:
            env_var = "GOOGLE_API_KEY"

        if args.provider != "custom":
            parser.error(f"API key is required for {args.provider} provider. Provide it as an argument, set {env_var} environment variable, or add it to .env file")

    # Set logging level
    if args.quiet:
        logging.getLogger().setLevel(logging.WARNING)
        # Also reduce Google API logging in quiet mode
        logging.getLogger("google_genai.models").setLevel(logging.ERROR)
        logging.getLogger("google.generativeai").setLevel(logging.ERROR)
    elif args.verbose or args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        if args.debug:
            # Enable even more detailed logging
            logging.getLogger("__main__").setLevel(logging.DEBUG)

    # Validate repository path (skip validation for GitHub URLs)
    if not (args.repo_path.startswith(('https://github.com/', 'http://github.com/', 'git@github.com:'))
            or os.path.exists(args.repo_path)):
        print(f"Error: Repository path '{args.repo_path}' does not exist.")
        sys.exit(1)

    # Check if RAG is available when requested
    if not args.no_rag and RAG is None:
        print("Warning: RAG functionality not available. Proceeding with LLM-only research.")
        args.no_rag = True

    print("🚀 Wiki Research Agent")
    print("=" * 50)
    print(f"Repository: {args.repo_path}")
    print(f"Topics: {args.topics}")
    print(f"Mode: {'Onboarding-focused' if args.onboarding else 'Comprehensive'}")
    print(f"RAG enabled: {not args.no_rag}")
    print(f"Output: {args.output or 'stdout'}")
    print("=" * 50)

    if args.demo:
        # Run the topic generation demo
        print(f"\n📋 Running topic generation demo with {args.provider} provider...")
        try:
            topics = asyncio.run(analyze_repository_example(args.repo_path, api_key, args.provider, args.model, args.base_url))

            print(f"\n✅ Generated {len(topics)} research topics:")
            for i, topic in enumerate(topics, 1):
                print(f"\n{i}. {topic.topic_name}")
                print(f"   📝 Description: {topic.description}")
                print(f"   ❓ Questions: {', '.join(topic.research_questions)}")
                print(f"   🎯 Priority: {topic.priority}")
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            if args.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)
    else:
        # Run the complete wiki generation pipeline
        print("\n🔬 Starting wiki generation pipeline...")

        try:
            # Handle fast-diagrams flag for backward compatibility
            max_diagrams = 2 if args.fast_diagrams else args.max_diagrams
            max_tables = 1 if args.fast_diagrams else args.max_tables
            parallel_diagrams = not args.sequential_diagrams  # Default to parallel unless explicitly disabled

            # Generate the wiki with progress tracking (validation removed - frontend handles repair)
            wiki_content = asyncio.run(run_with_progress_tracking(
                generate_wiki_for_repository,
                repo_path=args.repo_path,
                api_key=api_key,
                num_topics=args.topics,
                use_rag=not args.no_rag,
                use_diagrams=not args.no_diagrams,
                max_diagrams=max_diagrams,
                max_tables=max_tables,
                parallel_diagrams=parallel_diagrams,
                onboarding_mode=args.onboarding,
                provider=args.provider,
                model_name=args.model,
                base_url=args.base_url
            ))

            if wiki_content:
                if args.output:
                    # Save to file
                    with open(args.output, 'w', encoding='utf-8') as f:
                        f.write(wiki_content)
                    print(f"📄 Wiki documentation saved to: {args.output}")
                    print(f"📊 Content length: {len(wiki_content)} characters")
                else:
                    # Print to stdout
                    print("\n" + "="*80)
                    print("📚 GENERATED WIKI DOCUMENTATION")
                    print("="*80)
                    print(wiki_content)
                    print("="*80)
            else:
                print("❌ Error: No wiki content was generated.")
                sys.exit(1)

        except KeyboardInterrupt:
            print("\n⏹️  Operation cancelled by user.")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error generating wiki: {e}")
            if args.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)
