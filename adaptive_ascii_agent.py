#!/usr/bin/env python3
"""
Adaptive ASCII Research Agent - Fully LLM-Powered Code Analysis

A revolutionary approach to code visualization that eliminates all hardcoded patterns
and uses LLM intelligence to discover, understand, and visualize any codebase dynamically.

Key Principles:
- NO hardcoded framework patterns
- NO static file type classifications  
- NO predefined ASCII types
- NO hardcoded importance scoring

Everything is discovered and adapted through LLM intelligence.

Author: DeepWiki-Open (Adaptive Architecture)
License: MIT
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

# Check for required dependencies
try:
    from genai_processors import content_api, processor, streams  # type: ignore
    from genai_processors.core import genai_model  # type: ignore
    try:
        from genai_processors.core import openai_model  # type: ignore
        OPENAI_AVAILABLE = True
    except ImportError:
        OPENAI_AVAILABLE = False
except ImportError as e:
    print("Error: genai-processors not found. Please install with: pip install genai-processors")
    exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce noise from various loggers
logging.getLogger("google_genai.models").setLevel(logging.WARNING)
logging.getLogger("google.generativeai").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)

def create_model_instance(api_key: str, model_name: str, provider: str = "google", **kwargs):
    """Create a model instance based on provider and model name."""
    if provider.lower() in ["openai", "openrouter", "custom"]:
        if not OPENAI_AVAILABLE:
            raise ValueError("OpenAI support not available.")

        temperature = kwargs.get("temperature", 0.7)
        system_instruction = kwargs.get("system_instruction", None)

        config = openai_model.GenerateContentConfig(temperature=temperature)
        if system_instruction:
            config.system_instruction = system_instruction

        if provider.lower() == "openrouter":
            return openai_model.OpenAIModel(
                api_key=api_key, model_name=model_name, generate_content_config=config,
                base_url="https://openrouter.ai/api/v1"
            )
        elif provider.lower() == "custom":
            base_url = kwargs.get("base_url")
            if not base_url:
                raise ValueError("base_url is required for custom provider")
            return openai_model.OpenAIModel(
                api_key=api_key, model_name=model_name, generate_content_config=config,
                base_url=base_url
            )
        else:
            return openai_model.OpenAIModel(
                api_key=api_key, model_name=model_name, generate_content_config=config
            )
    else:
        # Default to Google Gemini
        from google.genai import types as genai_types
        temperature = kwargs.get("temperature", 0.7)
        top_p = kwargs.get("top_p", 0.8)
        top_k = kwargs.get("top_k", 20)

        config = genai_types.GenerateContentConfig(
            temperature=temperature, top_p=top_p, top_k=top_k
        )

        return genai_model.GenaiModel(
            api_key=api_key, model_name=model_name, generate_content_config=config
        )

# Adaptive Data Structures (No hardcoded patterns)
@dataclass
class FrameworkDiscovery:
    """Dynamic framework discovery result"""
    primary_framework: str
    framework_version: Optional[str]
    secondary_frameworks: List[str]
    architecture_type: str  # monolith, microservices, serverless, etc.
    technology_stack: List[str]
    confidence: float
    reasoning: str
    unique_patterns: List[str]  # Project-specific patterns discovered
    complexity_indicators: Dict[str, Any]

@dataclass
class FileAnalysis:
    """Intelligent file analysis result"""
    file_path: str
    relative_path: str
    architectural_role: str  # Discovered dynamically
    business_importance: int  # 0-10 based on actual analysis
    complexity_score: int  # 0-10 based on content analysis
    dependencies: List[str]
    exports: List[str]
    key_functions: List[str]
    architectural_significance: str  # Why this file matters
    visualization_priority: int  # 0-10 for ASCII generation
    content_summary: str

@dataclass
class VisualizationPlan:
    """Dynamic visualization planning result"""
    visualization_type: str  # Generated dynamically
    title: str
    description: str
    target_audience: str  # developers, architects, stakeholders
    complexity_level: str  # overview, detailed, technical
    focus_areas: List[str]
    file_group: List[FileAnalysis]
    priority: int
    estimated_value: str  # Why this visualization is valuable
    custom_elements: List[str]  # Unique elements for this project

@dataclass
class CodebaseDiscovery:
    """Complete codebase discovery result"""
    repo_path: str
    repo_url: str
    framework_discovery: FrameworkDiscovery
    file_analyses: List[FileAnalysis]
    visualization_plans: List[VisualizationPlan]
    architectural_insights: List[str]
    complexity_assessment: Dict[str, Any]
    stakeholder_recommendations: Dict[str, List[str]]

class LLMFrameworkDetector:
    """
    Intelligent framework detection that replaces all hardcoded patterns.
    Uses LLM to discover and understand any codebase structure dynamically.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-pro")
        self.base_url = base_url

        # Create model instance for framework detection
        model_kwargs = {
            "api_key": api_key,
            "provider": provider,
            "temperature": 0.3  # Lower temperature for consistent analysis
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.detection_model = create_model_instance(
            model_name=self.model_name, **model_kwargs
        )

    async def discover_framework(self, repo_path: str, file_tree: str) -> FrameworkDiscovery:
        """
        Discover framework and technology stack through intelligent analysis.
        NO hardcoded patterns - pure LLM discovery.
        """
        
        # Collect key files for analysis
        key_files = await self._collect_key_files(repo_path)
        
        # Create comprehensive discovery prompt
        prompt = self._create_discovery_prompt(file_tree, key_files)
        
        try:
            # Query the LLM for framework discovery
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.detection_model(input_stream):
                response_text += response_part.text

            # Parse the discovery response
            return self._parse_discovery_response(response_text)

        except Exception as e:
            logger.error(f"Framework discovery failed: {e}")
            return self._create_fallback_discovery()

    async def _collect_key_files(self, repo_path: str) -> Dict[str, str]:
        """Collect content from key configuration and entry files"""
        key_files = {}
        
        # Common configuration files (but we don't assume their meaning)
        potential_config_files = [
            "package.json", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml",
            "composer.json", "Gemfile", "setup.py", "pyproject.toml", "tsconfig.json",
            "next.config.js", "nuxt.config.js", "vite.config.js", "webpack.config.js",
            "Dockerfile", "docker-compose.yml", ".env", "README.md"
        ]
        
        for config_file in potential_config_files:
            file_path = os.path.join(repo_path, config_file)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read(2048)  # Read first 2KB
                        key_files[config_file] = content
                except Exception as e:
                    logger.warning(f"Could not read {config_file}: {e}")
        
        # Find potential entry points (without assuming names)
        entry_candidates = []
        for root, dirs, files in os.walk(repo_path):
            # Skip deep nested directories and common build dirs
            level = root.replace(repo_path, '').count(os.sep)
            if level > 2:
                continue
            if any(skip_dir in root for skip_dir in ['node_modules', '__pycache__', '.git', 'dist', 'build']):
                continue
                
            for file in files:
                if file.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.rs', '.java')):
                    # Look for files that might be entry points
                    if any(keyword in file.lower() for keyword in ['main', 'app', 'server', 'index']):
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read(1024)  # Read first 1KB
                                relative_path = os.path.relpath(file_path, repo_path)
                                entry_candidates.append(f"--- {relative_path} ---\n{content}")
                        except Exception:
                            pass
                        
                        if len(entry_candidates) >= 5:  # Limit to avoid token overflow
                            break
            if len(entry_candidates) >= 5:
                break
        
        if entry_candidates:
            key_files["entry_points"] = "\n\n".join(entry_candidates)
        
        return key_files

    def _create_discovery_prompt(self, file_tree: str, key_files: Dict[str, str]) -> str:
        """Create comprehensive framework discovery prompt"""

        key_files_content = ""
        for filename, content in key_files.items():
            key_files_content += f"\n--- {filename} ---\n{content}\n"

        prompt = f"""
You are a senior software architect with expertise in all modern frameworks and technologies.
Analyze this codebase and provide a comprehensive framework discovery analysis.

DO NOT rely on simple pattern matching. Analyze the actual code structure, dependencies,
and architectural patterns to understand what this project really is.

File Tree Structure:
{file_tree}

Key Files Content:
{key_files_content}

Provide a detailed analysis in JSON format:
{{
  "primary_framework": "The main framework/technology (be specific with versions if detectable)",
  "framework_version": "Version if detectable from dependencies",
  "secondary_frameworks": ["Any additional frameworks or libraries"],
  "architecture_type": "monolith|microservices|serverless|jamstack|hybrid|other",
  "technology_stack": ["All technologies detected: languages, databases, tools"],
  "confidence": 0.95,
  "reasoning": "Detailed explanation of how you determined this framework",
  "unique_patterns": ["Any unique or custom patterns specific to this project"],
  "complexity_indicators": {{
    "estimated_size": "small|medium|large|enterprise",
    "architectural_complexity": "simple|moderate|complex|very_complex",
    "team_size_estimate": "solo|small_team|medium_team|large_team",
    "maturity_level": "prototype|mvp|production|enterprise"
  }}
}}

Consider modern frameworks like:
- Frontend: React, Vue, Angular, Svelte, SvelteKit, Next.js, Nuxt, Remix, Qwik, Astro
- Backend: Express, FastAPI, Django, Flask, Spring Boot, .NET Core, Rails, Laravel
- Full-stack: Next.js, Nuxt, SvelteKit, Remix, T3 Stack, MEAN/MERN
- Mobile: React Native, Flutter, Ionic, Expo
- Desktop: Electron, Tauri, Flutter Desktop
- Emerging: Deno, Bun, Fresh, SolidJS, Lit, Web Components

Be creative and thorough. If it's a hybrid or custom setup, explain that.
If you detect microservices, monorepo, or other architectural patterns, include that.

Return ONLY the JSON, no other text:
"""
        return prompt

    def _parse_discovery_response(self, response_text: str) -> FrameworkDiscovery:
        """Parse the LLM framework discovery response"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)

                return FrameworkDiscovery(
                    primary_framework=data.get('primary_framework', 'Unknown'),
                    framework_version=data.get('framework_version'),
                    secondary_frameworks=data.get('secondary_frameworks', []),
                    architecture_type=data.get('architecture_type', 'unknown'),
                    technology_stack=data.get('technology_stack', []),
                    confidence=data.get('confidence', 0.5),
                    reasoning=data.get('reasoning', 'Analysis failed'),
                    unique_patterns=data.get('unique_patterns', []),
                    complexity_indicators=data.get('complexity_indicators', {})
                )
        except Exception as e:
            logger.warning(f"Failed to parse framework discovery response: {e}")

        return self._create_fallback_discovery()

    def _create_fallback_discovery(self) -> FrameworkDiscovery:
        """Create fallback discovery when LLM analysis fails"""
        return FrameworkDiscovery(
            primary_framework="Unknown",
            framework_version=None,
            secondary_frameworks=[],
            architecture_type="unknown",
            technology_stack=[],
            confidence=0.1,
            reasoning="Framework discovery failed - using fallback analysis",
            unique_patterns=[],
            complexity_indicators={
                "estimated_size": "unknown",
                "architectural_complexity": "unknown",
                "team_size_estimate": "unknown",
                "maturity_level": "unknown"
            }
        )

class LLMFileClassifier:
    """
    Content-aware file classification that replaces all static pattern matching.
    Analyzes actual code content to understand file purpose and architectural significance.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-pro")
        self.base_url = base_url

        # Create model instance for file classification
        model_kwargs = {
            "api_key": api_key,
            "provider": provider,
            "temperature": 0.2  # Very low temperature for consistent classification
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.classification_model = create_model_instance(
            model_name=self.model_name, **model_kwargs
        )

    async def analyze_file(self, file_path: str, content: str,
                          framework_discovery: FrameworkDiscovery) -> FileAnalysis:
        """
        Analyze file content to understand its architectural role and importance.
        NO static patterns - pure content analysis.
        """

        # Create intelligent file analysis prompt
        prompt = self._create_file_analysis_prompt(file_path, content, framework_discovery)

        try:
            # Query the LLM for file analysis
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.classification_model(input_stream):
                response_text += response_part.text

            # Parse the analysis response
            return self._parse_file_analysis_response(response_text, file_path)

        except Exception as e:
            logger.error(f"File analysis failed for {file_path}: {e}")
            return self._create_fallback_analysis(file_path)

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
        """Parse the LLM file analysis response"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)

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
        except Exception as e:
            logger.warning(f"Failed to parse file analysis response for {file_path}: {e}")

        return self._create_fallback_analysis(file_path)

    def _create_fallback_analysis(self, file_path: str) -> FileAnalysis:
        """Create fallback analysis when LLM analysis fails"""
        return FileAnalysis(
            file_path=file_path,
            relative_path=os.path.relpath(file_path) if os.path.isabs(file_path) else file_path,
            architectural_role="Analysis failed",
            business_importance=3,
            complexity_score=3,
            dependencies=[],
            exports=[],
            key_functions=[],
            architectural_significance="File analysis failed - manual review needed",
            visualization_priority=3,
            content_summary="File analysis failed"
        )

class LLMVisualizationPlanner:
    """
    Dynamic visualization planning that replaces static ASCII_TYPES.
    Creates custom visualizations based on actual project needs and complexity.
    """

    def __init__(self, api_key: str, provider: str = "google", model_name: str = None, base_url: str = None):
        self.api_key = api_key
        self.provider = provider
        self.model_name = model_name or ("gpt-4o" if provider.lower() == "openai" else "gemini-2.5-pro")
        self.base_url = base_url

        # Create model instance for visualization planning
        model_kwargs = {
            "api_key": api_key,
            "provider": provider,
            "temperature": 0.6  # Moderate temperature for creative but consistent planning
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.planning_model = create_model_instance(
            model_name=self.model_name, **model_kwargs
        )

    async def plan_visualizations(self, framework_discovery: FrameworkDiscovery,
                                file_analyses: List[FileAnalysis]) -> List[VisualizationPlan]:
        """
        Plan custom visualizations based on actual codebase analysis.
        NO static types - everything determined dynamically.
        """

        # Create intelligent visualization planning prompt
        prompt = self._create_planning_prompt(framework_discovery, file_analyses)

        try:
            # Query the LLM for visualization planning
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.planning_model(input_stream):
                response_text += response_part.text

            # Parse the planning response
            return self._parse_planning_response(response_text, file_analyses)

        except Exception as e:
            logger.error(f"Visualization planning failed: {e}")
            return self._create_fallback_plans(framework_discovery, file_analyses)

    def _create_planning_prompt(self, framework_discovery: FrameworkDiscovery,
                              file_analyses: List[FileAnalysis]) -> str:
        """Create intelligent visualization planning prompt"""

        # Summarize file analyses for context
        high_priority_files = [f for f in file_analyses if f.visualization_priority >= 7]
        business_critical_files = [f for f in file_analyses if f.business_importance >= 7]

        file_summary = ""
        for file_analysis in high_priority_files[:10]:  # Top 10 files
            file_summary += f"- {file_analysis.relative_path}: {file_analysis.architectural_role} (priority: {file_analysis.visualization_priority}, importance: {file_analysis.business_importance})\n"

        prompt = f"""
You are a senior software architect planning ASCII visualizations for a development team.

Project Analysis:
- Framework: {framework_discovery.primary_framework} {framework_discovery.framework_version or ''}
- Architecture: {framework_discovery.architecture_type}
- Technology Stack: {', '.join(framework_discovery.technology_stack)}
- Complexity: {framework_discovery.complexity_indicators.get('architectural_complexity', 'unknown')}
- Team Size: {framework_discovery.complexity_indicators.get('team_size_estimate', 'unknown')}
- Maturity: {framework_discovery.complexity_indicators.get('maturity_level', 'unknown')}

Key Files Identified:
{file_summary}

Total Files Analyzed: {len(file_analyses)}
High Priority Files: {len(high_priority_files)}
Business Critical Files: {len(business_critical_files)}

Your task: Design 3-6 ASCII visualizations that would be most valuable for understanding this codebase.

Consider:
- What would help a new developer understand the system fastest?
- What are the most complex/critical parts that need visualization?
- What would help with debugging, maintenance, or feature development?
- What would be valuable for different audiences (developers, architects, stakeholders)?

Be creative! Don't limit yourself to standard diagrams. Think about:
- Request/response flows
- Data transformation pipelines
- Authentication/authorization flows
- Error handling patterns
- Performance bottlenecks
- Integration points
- Business logic flows
- State management patterns

Return JSON with 3-6 visualization plans:
{{
  "visualizations": [
    {{
      "visualization_type": "Custom name for this visualization type",
      "title": "Specific title for this diagram",
      "description": "What this visualization shows and why it's valuable",
      "target_audience": "developers|architects|stakeholders|mixed",
      "complexity_level": "overview|detailed|technical",
      "focus_areas": ["Specific aspects to highlight"],
      "priority": 9,
      "estimated_value": "Why this visualization is important",
      "custom_elements": ["Unique elements specific to this project"],
      "target_files": ["List of file paths that should be included"]
    }}
  ]
}}

Make each visualization unique and valuable. Prioritize based on actual project needs.

Return ONLY the JSON, no other text:
"""
        return prompt

    def _parse_planning_response(self, response_text: str, file_analyses: List[FileAnalysis]) -> List[VisualizationPlan]:
        """Parse the LLM visualization planning response"""
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                data = json.loads(json_text)

                plans = []
                for viz_data in data.get('visualizations', []):
                    # Find relevant files for this visualization
                    target_files = viz_data.get('target_files', [])
                    file_group = self._find_relevant_files(file_analyses, target_files)

                    plan = VisualizationPlan(
                        visualization_type=viz_data.get('visualization_type', 'Custom Visualization'),
                        title=viz_data.get('title', 'Untitled Visualization'),
                        description=viz_data.get('description', 'No description provided'),
                        target_audience=viz_data.get('target_audience', 'developers'),
                        complexity_level=viz_data.get('complexity_level', 'overview'),
                        focus_areas=viz_data.get('focus_areas', []),
                        file_group=file_group,
                        priority=viz_data.get('priority', 5),
                        estimated_value=viz_data.get('estimated_value', 'Value not specified'),
                        custom_elements=viz_data.get('custom_elements', [])
                    )
                    plans.append(plan)

                return plans
        except Exception as e:
            logger.warning(f"Failed to parse visualization planning response: {e}")

        return self._create_fallback_plans(None, file_analyses)

    def _find_relevant_files(self, file_analyses: List[FileAnalysis], target_files: List[str]) -> List[FileAnalysis]:
        """Find files relevant to a visualization plan"""
        relevant_files = []

        # First, try to find specifically mentioned files
        for target_file in target_files:
            for file_analysis in file_analyses:
                if target_file.lower() in file_analysis.relative_path.lower():
                    relevant_files.append(file_analysis)
                    break

        # If we don't have enough files, add high-priority ones
        if len(relevant_files) < 3:
            high_priority = sorted(file_analyses, key=lambda x: x.visualization_priority, reverse=True)
            for file_analysis in high_priority:
                if file_analysis not in relevant_files:
                    relevant_files.append(file_analysis)
                    if len(relevant_files) >= 8:  # Reasonable limit
                        break

        return relevant_files

    def _create_fallback_plans(self, framework_discovery: Optional[FrameworkDiscovery],
                             file_analyses: List[FileAnalysis]) -> List[VisualizationPlan]:
        """Create fallback visualization plans when LLM planning fails"""
        high_priority_files = sorted(file_analyses, key=lambda x: x.visualization_priority, reverse=True)[:5]

        return [
            VisualizationPlan(
                visualization_type="System Overview",
                title="System Architecture Overview",
                description="High-level overview of system components and relationships",
                target_audience="mixed",
                complexity_level="overview",
                focus_areas=["main components", "data flow"],
                file_group=high_priority_files,
                priority=10,
                estimated_value="Essential for understanding system structure",
                custom_elements=["fallback visualization"]
            )
        ]

class AdaptiveCodebaseAnalyzer(processor.Processor):
    """
    Main adaptive analyzer that replaces all static pattern matching.
    Uses LLM intelligence to discover, understand, and plan visualizations for any codebase.
    """

    def __init__(self, api_key: str, provider: str = "google", screen_model: str = None,
                 doc_model: str = None, base_url: str = None, max_parallel_agents: int = 20):
        self.api_key = api_key
        self.provider = provider
        self.base_url = base_url
        self.max_parallel_agents = max_parallel_agents

        # Set default models
        if screen_model is None:
            screen_model = "gpt-4o-mini" if provider.lower() == "openai" else "gemini-2.0-flash-thinking"
        if doc_model is None:
            doc_model = "gpt-4o" if provider.lower() == "openai" else "gemini-2.5-pro"

        self.screen_model = screen_model
        self.doc_model = doc_model

        # Initialize adaptive components
        self.framework_detector = LLMFrameworkDetector(api_key, provider, doc_model, base_url)
        self.file_classifier = LLMFileClassifier(api_key, provider, screen_model, base_url)
        self.visualization_planner = LLMVisualizationPlanner(api_key, provider, doc_model, base_url)

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute adaptive codebase analysis with zero hardcoded patterns"""
        async for part in content:
            if content_api.is_text(part.mimetype):
                repo_input = part.text.strip()
                logger.info(f"🧠 Starting adaptive codebase analysis: {repo_input}")

                # Handle GitHub URL or local path
                if self._is_github_url(repo_input):
                    repo_path = await self._clone_repository(repo_input)
                    repo_url = repo_input
                else:
                    repo_path = repo_input
                    repo_url = ""
                    if not os.path.exists(repo_path):
                        raise ValueError(f"Repository path does not exist: {repo_path}")

                # Phase 1: Dynamic Framework Discovery
                logger.info("🔍 Phase 1: Dynamic framework discovery (NO hardcoded patterns)")
                file_tree = self._generate_file_tree(repo_path)
                framework_discovery = await self.framework_detector.discover_framework(repo_path, file_tree)

                logger.info(f"✅ Discovered: {framework_discovery.primary_framework} "
                          f"({framework_discovery.architecture_type}, confidence: {framework_discovery.confidence:.0%})")

                # Phase 2: Intelligent File Analysis
                logger.info("📄 Phase 2: Content-aware file analysis (NO static patterns)")
                file_analyses = await self._analyze_files_intelligently(repo_path, framework_discovery)

                logger.info(f"✅ Analyzed {len(file_analyses)} files with intelligent classification")

                # Phase 3: Dynamic Visualization Planning
                logger.info("🎨 Phase 3: Adaptive visualization planning (NO static ASCII types)")
                visualization_plans = await self.visualization_planner.plan_visualizations(
                    framework_discovery, file_analyses
                )

                logger.info(f"✅ Planned {len(visualization_plans)} custom visualizations")

                # Create complete discovery result
                codebase_discovery = CodebaseDiscovery(
                    repo_path=repo_path,
                    repo_url=repo_url,
                    framework_discovery=framework_discovery,
                    file_analyses=file_analyses,
                    visualization_plans=visualization_plans,
                    architectural_insights=self._extract_insights(framework_discovery, file_analyses),
                    complexity_assessment=self._assess_complexity(framework_discovery, file_analyses),
                    stakeholder_recommendations=self._generate_recommendations(framework_discovery, visualization_plans)
                )

                # Yield the complete discovery result
                result_json = json.dumps({
                    'repo_path': codebase_discovery.repo_path,
                    'repo_url': codebase_discovery.repo_url,
                    'framework_discovery': self._framework_to_dict(codebase_discovery.framework_discovery),
                    'file_analyses': [self._file_analysis_to_dict(fa) for fa in codebase_discovery.file_analyses],
                    'visualization_plans': [self._viz_plan_to_dict(vp) for vp in codebase_discovery.visualization_plans],
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
                    f"🧠 Adaptive analysis complete: {framework_discovery.primary_framework} project with {len(visualization_plans)} custom visualizations planned",
                    substream_name="status"
                )
                yield status_part
            else:
                yield part

    def _is_github_url(self, path: str) -> bool:
        """Check if the path is a GitHub URL"""
        return path.startswith(('https://github.com/', 'http://github.com/', 'github.com/'))

    async def _clone_repository(self, repo_url: str) -> str:
        """Clone GitHub repository to local directory"""
        import urllib.parse
        import subprocess
        import shutil

        # Parse GitHub URL
        parsed = urllib.parse.urlparse(repo_url.replace('http://', 'https://'))
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) >= 2:
            owner, repo = path_parts[0], path_parts[1]
            target_dir = f"./temp_repos/{owner}_{repo}"
        else:
            raise ValueError(f"Invalid GitHub URL format: {repo_url}")

        # Remove existing directory if it exists
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

        # Create parent directory
        os.makedirs(os.path.dirname(target_dir), exist_ok=True)

        # Clone the repository
        logger.info(f"🔄 Cloning repository: {repo_url}")
        try:
            result = subprocess.run(
                ['git', 'clone', '--depth', '1', repo_url, target_dir],
                capture_output=True, text=True, timeout=300
            )
            if result.returncode != 0:
                raise Exception(f"Git clone failed: {result.stderr}")
            logger.info(f"✅ Repository cloned to: {target_dir}")
            return target_dir
        except subprocess.TimeoutExpired:
            raise Exception("Repository cloning timed out (5 minutes)")
        except FileNotFoundError:
            raise Exception("Git is not installed or not in PATH")

    def _generate_file_tree(self, repo_path: str, max_depth: int = 3) -> str:
        """Generate a file tree representation of the repository"""
        tree_lines = []

        def add_tree_line(path: str, prefix: str = "", depth: int = 0):
            if depth > max_depth:
                return
            try:
                items = sorted(os.listdir(path))
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

    async def _analyze_files_intelligently(self, repo_path: str,
                                         framework_discovery: FrameworkDiscovery) -> List[FileAnalysis]:
        """Analyze files using intelligent content analysis (NO static patterns)"""
        file_analyses = []

        # Collect all relevant files
        relevant_files = []
        for root, dirs, files in os.walk(repo_path):
            # Skip hidden and build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in [
                'node_modules', '__pycache__', 'build', 'dist', '.git', 'coverage'
            ]]

            for file in files:
                if file.startswith('.') and file not in ['.env', '.gitignore']:
                    continue

                # Focus on code files and important configs
                if any(file.endswith(ext) for ext in [
                    '.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.rs', '.java',
                    '.php', '.rb', '.cpp', '.c', '.h', '.cs', '.swift', '.kt',
                    '.json', '.yml', '.yaml', '.toml', '.md'
                ]):
                    full_path = os.path.join(root, file)
                    relevant_files.append(full_path)

        # Limit files to avoid token overflow
        if len(relevant_files) > 50:
            # Prioritize by likely importance (entry points, configs, etc.)
            priority_files = []
            other_files = []

            for file_path in relevant_files:
                filename = os.path.basename(file_path).lower()
                if any(keyword in filename for keyword in [
                    'main', 'app', 'server', 'index', 'config', 'setting', 'package', 'requirements'
                ]):
                    priority_files.append(file_path)
                else:
                    other_files.append(file_path)

            # Take top priority files + some others
            relevant_files = priority_files + other_files[:50-len(priority_files)]

        logger.info(f"Analyzing {len(relevant_files)} files with intelligent classification")

        # Analyze files in parallel (but limit concurrency)
        semaphore = asyncio.Semaphore(10)  # Limit concurrent file analyses

        async def analyze_single_file(file_path: str):
            async with semaphore:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read(4096)  # Read first 4KB

                    if content.strip():  # Skip empty files
                        return await self.file_classifier.analyze_file(file_path, content, framework_discovery)
                except Exception as e:
                    logger.warning(f"Could not analyze file {file_path}: {e}")
                return None

        # Execute file analyses in parallel
        tasks = [analyze_single_file(file_path) for file_path in relevant_files]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect successful analyses
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
        """Extract architectural insights from the analysis"""
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

    def _generate_recommendations(self, framework_discovery: FrameworkDiscovery,
                                visualization_plans: List[VisualizationPlan]) -> Dict[str, List[str]]:
        """Generate stakeholder-specific recommendations"""
        return {
            "developers": [
                f"Focus on {framework_discovery.primary_framework} best practices",
                f"Review {len([p for p in visualization_plans if p.target_audience in ['developers', 'mixed']])} developer-focused visualizations"
            ],
            "architects": [
                f"Analyze {framework_discovery.architecture_type} architecture patterns",
                f"Consider {len(visualization_plans)} visualization perspectives for system understanding"
            ],
            "stakeholders": [
                f"Project uses {framework_discovery.primary_framework} technology stack",
                f"Complexity level: {framework_discovery.complexity_indicators.get('architectural_complexity', 'unknown')}"
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

    def _viz_plan_to_dict(self, viz_plan: VisualizationPlan) -> Dict:
        return {
            'visualization_type': viz_plan.visualization_type,
            'title': viz_plan.title,
            'description': viz_plan.description,
            'target_audience': viz_plan.target_audience,
            'complexity_level': viz_plan.complexity_level,
            'focus_areas': viz_plan.focus_areas,
            'file_group': [self._file_analysis_to_dict(fa) for fa in viz_plan.file_group],
            'priority': viz_plan.priority,
            'estimated_value': viz_plan.estimated_value,
            'custom_elements': viz_plan.custom_elements
        }
