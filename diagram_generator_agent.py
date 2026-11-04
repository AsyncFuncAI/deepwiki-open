#!/usr/bin/env python3
"""
Diagram Generator Agent for Wiki Research Pipeline

This agent specializes in analyzing research content and generating appropriate
visual diagrams (Mermaid flowcharts, sequence diagrams, class diagrams, etc.),
markdown tables, and structured visualizations for each section in the final report.

Author: DeepWiki-Open
License: MIT
"""

import json
import logging
import subprocess
import tempfile
import os
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Union
import asyncio

try:
    # genai-processors imports
    from genai_processors import processor, content_api, streams  # type: ignore
    from genai_processors.core import genai_model  # type: ignore
    # Try to import OpenAI model support
    try:
        from genai_processors.core import openai_model  # type: ignore
        OPENAI_AVAILABLE = True
    except ImportError:
        OPENAI_AVAILABLE = False
        print("Warning: OpenAI model support not available in genai-processors")
except ImportError as e:
    print("Warning: genai-processors not found. Diagram generation functionality will be disabled.")
    print(f"Import error: {e}")
    processor = None
    content_api = None
    streams = None
    genai_model = None
    OPENAI_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

@dataclass
class DiagramSuggestion:
    """A suggested diagram for a research section"""
    diagram_type: str  # flowchart, sequenceDiagram, classDiagram, erDiagram, graph
    title: str
    description: str
    mermaid_code: str
    section_context: str
    confidence: float = 0.0

@dataclass
class TableSuggestion:
    """A suggested markdown table for a research section"""
    title: str
    description: str
    headers: List[str]
    rows: List[List[str]]
    section_context: str



@dataclass
class EnhancedResearchResult:
    """Research result enhanced with visual elements"""
    original_content: str
    enhanced_content: str
    diagrams: List[DiagramSuggestion]
    tables: List[TableSuggestion]
    topic_name: str
    sources: List[str]
    confidence: float = 0.0

class DiagramGenerator:
    """Generates visual diagrams and structured data for research content"""

    def __init__(self, api_key: str, model_name: str = None, max_diagrams: int = 6, max_tables: int = 4, provider: str = "google", base_url: str = None):
        if processor is None or content_api is None or genai_model is None:
            raise ImportError("genai-processors is required for DiagramGenerator functionality")

        self.api_key = api_key
        self.provider = provider
        self.base_url = base_url
        self.max_diagrams = max_diagrams
        self.max_tables = max_tables

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

        self.model_name = model_name

        # Create model instance with base_url for custom provider
        model_kwargs = {
            "api_key": api_key,
            "model_name": model_name,
            "provider": provider,
            "temperature": 0.7
        }
        if provider.lower() == "custom":
            model_kwargs["base_url"] = base_url

        self.genai_model = create_model_instance(**model_kwargs)

        # Set validation model (use a more capable model for validation)
        if provider.lower() == "openai":
            self.validation_model_name = "gpt-4o"
        elif provider.lower() == "openrouter":
            self.validation_model_name = "openai/gpt-4o"
        elif provider.lower() == "custom":
            self.validation_model_name = model_name  # Use same model for custom provider
        else:
            self.validation_model_name = "gemini-2.5-pro"  # More capable for validation

        # Validation settings
        self.use_local_validation = False  # Disabled by default as mentioned in comments

    def to_processor(self):
        """Convert to processor interface for pipeline compatibility"""
        if processor is None:
            raise ImportError("genai-processors is required for processor functionality")

        # Create a wrapper that implements the processor interface
        class DiagramProcessorWrapper(processor.Processor):
            def __init__(self, diagram_generator):
                self.diagram_generator = diagram_generator

            async def call(self, content):
                # Process the async stream of parts
                try:
                    async for part in content:
                        try:
                            if self.diagram_generator.match(part):
                                # Process this part with the diagram generator
                                result = await self.diagram_generator.call(part)
                                yield result

                                # Optional: Yield status update (commented out to reduce log noise)
                                # status_part = content_api.ProcessorPart(
                                #     f"Enhanced research result with visual elements",
                                #     substream_name="status"
                                # )
                                # yield status_part
                            else:
                                # Pass through non-matching parts
                                yield part
                        except Exception as e:
                            logger.error(f"Error processing individual part: {e}")
                            # Pass through original part on error
                            yield part
                except Exception as e:
                    logger.error(f"Error in diagram processor wrapper: {e}")
                    # If we can't process the stream, just pass it through
                    async for part in content:
                        yield part

        return DiagramProcessorWrapper(self)

    def match(self, part) -> bool:
        """Only process ResearchResult parts"""
        try:
            return hasattr(part, 'mimetype') and part.mimetype == "application/json; type=ResearchResult"
        except Exception as e:
            logger.warning(f"Error in match method: {e}")
            return False

    async def call(self, part):
        """Enhance a single research result with visual diagrams and tables"""
        # Parse research result
        try:
            result_data = json.loads(part.text)
            topic_name = result_data['topic']['topic_name']
            research_content = result_data['content']
            sources = result_data['sources']
            confidence = result_data['confidence']

            logger.info(f"Generating diagrams for topic: {topic_name}")

            # Generate visual enhancements
            enhanced_result = await self._enhance_with_visuals(
                topic_name, research_content, sources, confidence
            )

            # Yield enhanced result
            enhanced_json = json.dumps({
                'topic': result_data['topic'],
                'original_content': research_content,
                'enhanced_content': enhanced_result.enhanced_content,
                'diagrams': [
                    {
                        'diagram_type': d.diagram_type,
                        'title': d.title,
                        'description': d.description,
                        'mermaid_code': d.mermaid_code,
                        'section_context': d.section_context,
                        'confidence': d.confidence
                    } for d in enhanced_result.diagrams
                ],
                'tables': [
                    {
                        'title': t.title,
                        'description': t.description,
                        'headers': t.headers,
                        'rows': t.rows,
                        'section_context': t.section_context
                    } for t in enhanced_result.tables
                ],
                'sources': sources,
                'confidence': confidence
            })

            enhanced_part = content_api.ProcessorPart(
                enhanced_json,
                mimetype="application/json; type=EnhancedResearchResult",
                metadata={"enhanced_result": enhanced_result}
            )
            return enhanced_part

        except Exception as e:
            logger.error(f"Error enhancing research result: {e}")
            # Return original part on error
            return part

    async def _enhance_with_visuals(self, topic_name: str, content: str, sources: List[str], confidence: float) -> EnhancedResearchResult:
        """Enhance research content with visual diagrams and tables"""
        try:
            # Analyze content and generate visual suggestions
            visual_analysis = await self._analyze_for_visuals(topic_name, content, sources)
            
            # Generate diagrams
            diagrams = await self._generate_diagrams(visual_analysis)
            
            # Generate tables
            tables = await self._generate_tables(visual_analysis)
            
            # Create enhanced content with embedded visuals
            enhanced_content = await self._create_enhanced_content(content, diagrams, tables)
            
            return EnhancedResearchResult(
                original_content=content,
                enhanced_content=enhanced_content,
                diagrams=diagrams,
                tables=tables,
                topic_name=topic_name,
                sources=sources,
                confidence=confidence
            )

        except Exception as e:
            logger.error(f"Error in visual enhancement: {e}")
            # Return original content if enhancement fails
            return EnhancedResearchResult(
                original_content=content,
                enhanced_content=content,
                diagrams=[],
                tables=[],
                topic_name=topic_name,
                sources=sources,
                confidence=confidence
            )

    async def _analyze_for_visuals(self, topic_name: str, content: str, sources: List[str]) -> Dict[str, Any]:
        """Analyze content to identify opportunities for visual diagrams and tables"""
        
        prompt = f"""
Analyze the following research content for "{topic_name}" and identify opportunities for visual diagrams and structured tables.

Research Content:
{content}

Source Files: {', '.join(sources)}

Please identify and suggest:

1. **Mermaid Diagrams** - Analyze the content for these diagram opportunities:
   - **Flowcharts** (graph TD): For processes, workflows, decision trees, data flow
   - **Sequence Diagrams**: For interactions, API calls, communication flows
   - **Class Diagrams**: For object relationships, inheritance, composition
   - **ER Diagrams**: For data models, database schemas, entity relationships
   - **State Diagrams**: For state machines, lifecycle management
   - **Gitgraph**: For version control workflows, branching strategies

2. **Markdown Tables** - Look for structured information that would benefit from tabular format:
   - Configuration options and their descriptions
   - API endpoints with parameters and responses
   - Component features and capabilities
   - File structures and their purposes
   - Error codes and their meanings
   - Performance metrics or comparisons

For each suggestion, provide:
- Type of visual (diagram type or "table")
- Title and description
- Specific content from the research that supports this visual
- Confidence level (0.0-1.0)

Return your analysis as a JSON object with this structure:
{{
    "diagram_suggestions": [
        {{
            "type": "flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram|gitgraph",
            "title": "Diagram title",
            "description": "What this diagram shows",
            "content_basis": "Specific content that supports this diagram",
            "confidence": 0.8
        }}
    ],
    "table_suggestions": [
        {{
            "title": "Table title", 
            "description": "What this table organizes",
            "content_basis": "Specific content that supports this table",
            "suggested_headers": ["Header1", "Header2", "Header3"],
            "confidence": 0.9
        }}
    ]
}}

Focus on diagrams and tables that would genuinely enhance understanding of the technical content.
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                return json.loads(json_text)
            else:
                logger.warning("No valid JSON found in visual analysis response")
                return {"diagram_suggestions": [], "table_suggestions": []}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing visual analysis JSON: {e}")
            return {"diagram_suggestions": [], "table_suggestions": []}

    async def _generate_diagrams(self, visual_analysis: Dict[str, Any]) -> List[DiagramSuggestion]:
        """Generate Mermaid diagram code for suggested diagrams (no validation - frontend handles repair)"""
        diagrams = []

        # Use configurable limit for diagrams (default 6 for better parallelization)
        suggestions = visual_analysis.get("diagram_suggestions", [])[:self.max_diagrams]
        logger.info(f"Processing {len(suggestions)} diagram suggestions (max: {self.max_diagrams})")

        if not suggestions:
            return diagrams

        # Generate all diagrams in parallel (no validation needed)
        diagram_tasks = []
        for suggestion in suggestions:
            try:
                diagram_code = await self._create_mermaid_diagram_without_validation(suggestion)
                if diagram_code:
                    diagram_tasks.append({
                        'suggestion': suggestion,
                        'diagram_code': diagram_code
                    })
            except Exception as e:
                logger.error(f"Error generating diagram for {suggestion.get('title', 'unknown')}: {e}")
                continue

        if not diagram_tasks:
            return diagrams

        # No validation - frontend handles diagram repair with AI
        logger.info(f"Generated {len(diagram_tasks)} diagrams (validation handled by frontend)")
        validated_diagrams = [{'suggestion': task['suggestion'], 'validated_code': task['diagram_code']} for task in diagram_tasks]

        # Convert to DiagramSuggestion objects
        for validated_diagram in validated_diagrams:
            suggestion = validated_diagram['suggestion']
            diagrams.append(DiagramSuggestion(
                diagram_type=suggestion["type"],
                title=suggestion["title"],
                description=suggestion["description"],
                mermaid_code=validated_diagram['validated_code'],
                section_context=suggestion.get("content_basis", ""),
                confidence=suggestion.get("confidence", 0.5)
            ))

        return diagrams

    async def _generate_tables(self, visual_analysis: Dict[str, Any]) -> List[TableSuggestion]:
        """Generate markdown tables for suggested structured data"""
        tables = []

        # Use configurable limit for tables (default 4 for better coverage)
        suggestions = visual_analysis.get("table_suggestions", [])[:self.max_tables]

        for suggestion in suggestions:
            try:
                table_data = await self._create_markdown_table(suggestion)
                if table_data:
                    tables.append(table_data)
            except Exception as e:
                logger.error(f"Error generating table for {suggestion.get('title', 'unknown')}: {e}")
                continue
        
        return tables

    async def _create_mermaid_diagram_without_validation(self, suggestion: Dict[str, Any]) -> Optional[str]:
        """Create Mermaid diagram code without validation (for parallel processing)"""
        title = suggestion.get("title", "Untitled Diagram")
        description = suggestion.get("description", "")
        diagram_type = suggestion.get("type", "flowchart")
        content_basis = suggestion.get("content_basis", "")

        prompt = f"""
Create a detailed Mermaid diagram for the following specification:

**Title:** {title}
**Type:** {diagram_type}
**Description:** {description}

**Content Context:**
{content_basis}

**CRITICAL SYNTAX REQUIREMENTS:**
1. **Node IDs**: ONLY alphanumeric and underscores (A1, Step_Process, UserAuth)
2. **No spaces in IDs**: Use CamelCase or underscores (UserLogin NOT "User Login")
3. **No quotes in class names**: Use CamelCase (UserClass NOT "User Class")
4. **No title/accDes inside diagrams**: Only use basic diagram syntax
5. **Simple node syntax**: Use [text], (text), {{text}} - NO complex parentheses
6. **Keep labels short**: 2-3 words maximum per node

**Specific Guidelines by Type:**
- **flowchart/graph TD**:
  * Use --> for connections
  * Nodes: A[Start], B[Process], C{{Decision}}
  * NO parentheses in labels: Use A[User Login] NOT A[User (Login)]
  * NO title or accDes directives
  * Keep labels simple: A[File Watcher] NOT A[File System Watcher (Monitor)]
- **sequenceDiagram**:
  * participant A as User
  * A->>B: Message
- **classDiagram**:
  * class UserService
  * UserService : +login()
  * NO quoted class names
- **erDiagram**:
  * USER ||--o{{ ORDER : places

**CRITICAL: OUTPUT CLEAN MERMAID CODE ONLY**
- ❌ NEVER include \\n or \\t (use actual line breaks)
- ❌ NEVER include escaped characters in output
- ❌ NEVER mix code with explanatory text

**AVOID THESE COMMON ERRORS:**
- ❌ Cross_Correlation{{Label}}\\n\\n subgraph (escaped newlines)
- ❌ class "User Service" (quotes not allowed)
- ❌ A[User (Login)] (parentheses inside brackets)
- ❌ Flow_Nodes[FlowStepResponse (Nodes)] (parentheses in labels)
- ❌ A & B --> C (& operator not supported)
- ❌ title inside graph (wrong placement)
- ❌ Node-With-Dashes (use underscores)

**CORRECT EXAMPLES:**
- ✅ Cross_Correlation{{Label}}

    subgraph Motia Workbench
        UI[Interface]
    end
- ✅ class UserService
- ✅ A[User Login]
- ✅ Flow_Nodes[FlowStepResponse Nodes]
- ✅ A --> B; A --> C (separate connections)
- ✅ B{{Decision Point}}
- ✅ Step_Process[Process Step]

**Specific Guidelines:**
- NO parentheses in labels: Use A[User Login] NOT A[User (Login)]
- Keep labels simple: A[File Watcher] NOT A[File System Watcher (Monitor)]
- Use underscores for multi-word IDs: User_Service NOT User-Service
- Separate multiple connections: A --> B; A --> C NOT A & B --> C
- PROPER LINE BREAKS: Use actual newlines, never \\n or \\t in output
- CLEAN SUBGRAPHS: Always put blank line before subgraph

**CRITICAL OUTPUT FORMAT:**
Return ONLY clean Mermaid diagram code with proper line breaks.
NO escaped characters (\\n, \\t), NO explanations, NO markdown formatting.
Start directly with the diagram directive (e.g., "graph TD", "sequenceDiagram", etc.).

Example of CORRECT output format:
graph TD
    A[Start]
    B[Process]

    subgraph System
        C[Component]
    end

    A --> B
    B --> C

**Diagram Code:**
"""

        try:
            input_stream = streams.stream_content([prompt])
            response_text = ""

            async for response_part in self.genai_model(input_stream):
                response_text += response_part.text

            # Clean up the response
            diagram_code = response_text.strip()
            # Remove any markdown code blocks if present
            diagram_code = diagram_code.replace('```mermaid', '').replace('```', '').strip()

            # Fix escaped characters that sometimes appear in AI output
            diagram_code = diagram_code.replace('\\n', '\n')
            diagram_code = diagram_code.replace('\\t', '\t')

            # Clean up extra whitespace around newlines
            diagram_code = '\n'.join(line.rstrip() for line in diagram_code.split('\n'))

            return diagram_code if diagram_code else None

        except Exception as e:
            logger.error(f"Error creating Mermaid diagram for '{title}': {e}")
            return None

    async def _create_mermaid_diagram(self, suggestion: Dict[str, Any]) -> Optional[str]:
        """Create Mermaid diagram code based on suggestion"""

        diagram_type = suggestion["type"]
        title = suggestion["title"]
        description = suggestion["description"]
        content_basis = suggestion.get("content_basis", "")

        prompt = f"""
Create a Mermaid diagram of type "{diagram_type}" for: {title}

Description: {description}
Content Basis: {content_basis}

CRITICAL FORMATTING REQUIREMENTS:
1. **Vertical Orientation**: Always use "graph TD" (top-down) for flowcharts, NEVER "graph LR"
2. **Node Width**: Keep node text to 3-4 words maximum for readability
3. **Proper Syntax**: Follow exact Mermaid syntax for the diagram type

Diagram Type Guidelines:
- **flowchart/graph TD**: Use for processes, workflows, data flow
- **sequenceDiagram**: Start with participant definitions, use proper arrow types (->> for requests, -->> for responses)
- **classDiagram**: Show relationships with proper notation (inheritance, composition, aggregation)
- **erDiagram**: Use proper entity relationship notation
- **stateDiagram-v2**: For state machines and transitions
- **gitgraph**: For version control workflows

Generate ONLY the Mermaid code without markdown code blocks or explanations.
Start directly with the diagram directive (e.g., "graph TD", "sequenceDiagram", etc.).

Example format for flowchart:
graph TD
    A[Start] --> B[Process]
    B --> C{{Decision}}
    C -->|Yes| D[Action A]
    C -->|No| E[Action B]
    D --> F[End]
    E --> F

Generate the diagram:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        # Clean up the response
        diagram_code = response_text.strip()
        # Remove any markdown code blocks if present
        diagram_code = diagram_code.replace('```mermaid', '').replace('```', '').strip()

        # Validate and potentially correct the diagram using a smarter model
        if diagram_code:
            validated_code = await self._validate_and_render_mermaid(diagram_code, title, description)
            return validated_code if validated_code else diagram_code

        return diagram_code if diagram_code else None

    async def _validate_diagrams_parallel_efficient(self, diagram_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Efficiently validate multiple diagrams in parallel using asyncio.gather() with higher concurrency"""
        if not diagram_tasks:
            return []

        logger.info(f"Starting efficient parallel validation of {len(diagram_tasks)} diagrams")

        # For larger numbers of diagrams, use semaphore to control concurrency
        max_concurrent = min(len(diagram_tasks), 8)  # Allow up to 8 concurrent validations
        semaphore = asyncio.Semaphore(max_concurrent)

        async def validate_single_diagram(task: Dict[str, Any]) -> Dict[str, Any]:
            """Validate a single diagram task with concurrency control"""
            async with semaphore:  # Control concurrency
                suggestion = task['suggestion']
                diagram_code = task['diagram_code']
                title = suggestion.get("title", "Untitled")
                description = suggestion.get("description", "")

                try:
                    validated_code = await self._validate_and_render_mermaid(diagram_code, title, description)
                    return {
                        'suggestion': suggestion,
                        'validated_code': validated_code or diagram_code
                    }
                except Exception as e:
                    logger.error(f"Error validating diagram '{title}': {e}")
                    # Use original code if validation fails
                    return {
                        'suggestion': suggestion,
                        'validated_code': diagram_code
                    }

        try:
            # Use asyncio.gather for true parallel execution
            validated_results = await asyncio.gather(
                *[validate_single_diagram(task) for task in diagram_tasks],
                return_exceptions=True
            )

            # Filter out any exceptions and convert to proper format
            final_results = []
            for i, result in enumerate(validated_results):
                if isinstance(result, Exception):
                    logger.error(f"Exception in parallel validation task {i}: {result}")
                    # Use original code for failed validation
                    task = diagram_tasks[i]
                    final_results.append({
                        'suggestion': task['suggestion'],
                        'validated_code': task['diagram_code']
                    })
                else:
                    final_results.append(result)

            logger.info(f"Completed efficient parallel validation of {len(final_results)} diagrams")
            return final_results

        except Exception as e:
            logger.error(f"Error in efficient parallel validation: {e}")
            # Fallback to sequential validation
            logger.info("Falling back to sequential validation")
            return await self._validate_diagrams_sequential(diagram_tasks)



    async def _validate_diagrams_sequential(self, diagram_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fallback sequential validation method"""
        validated_results = []

        for task in diagram_tasks:
            suggestion = task['suggestion']
            diagram_code = task['diagram_code']
            title = suggestion.get("title", "Untitled")
            description = suggestion.get("description", "")

            try:
                validated_code = await self._validate_and_render_mermaid(diagram_code, title, description)
                validated_results.append({
                    'suggestion': suggestion,
                    'validated_code': validated_code or diagram_code
                })
            except Exception as e:
                logger.error(f"Error validating diagram '{title}': {e}")
                # Use original code if validation fails
                validated_results.append({
                    'suggestion': suggestion,
                    'validated_code': diagram_code
                })

        return validated_results

    # Validation methods kept but not used - frontend handles diagram repair with AI

    def _validate_mermaid_locally(self, diagram_code: str) -> tuple[bool, Optional[str]]:
        """Validation method kept for compatibility but not used"""
        try:
            # Create a temporary file with the mermaid code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False) as f:
                f.write(diagram_code)
                temp_file = f.name

            try:
                # Try multiple mermaid CLI approaches
                commands_to_try = [
                    ['npx', '@mermaid-js/mermaid-cli', '--parseOnly', temp_file],
                    ['mermaid', '--parseOnly', temp_file],
                    ['npx', 'mermaid', '--parseOnly', temp_file]
                ]

                for cmd in commands_to_try:
                    try:
                        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                        if result.returncode == 0:
                            return True, None
                        elif result.stderr and 'error' in result.stderr.lower():
                            return False, result.stderr.strip()
                    except (subprocess.TimeoutExpired, FileNotFoundError):
                        continue

                # If all CLI attempts fail, use basic validation
                logger.debug("Mermaid CLI not available, using basic validation")
                is_valid, error_msg = self._basic_mermaid_validation(diagram_code)
                if is_valid:
                    logger.debug("Diagram passed basic validation")
                    return True, None
                else:
                    logger.debug(f"Diagram failed basic validation: {error_msg}")
                    return False, error_msg

            except Exception as e:
                # Fallback: Basic syntax validation
                logger.debug(f"CLI validation error: {e}")
                return self._basic_mermaid_validation(diagram_code)

        except Exception as e:
            logger.debug(f"Local validation failed: {e}")
            return self._basic_mermaid_validation(diagram_code)
        finally:
            # Clean up temp file
            try:
                if 'temp_file' in locals():
                    os.unlink(temp_file)
            except:
                pass

    def _basic_mermaid_validation(self, diagram_code: str) -> tuple[bool, Optional[str]]:
        """
        Permissive basic Mermaid syntax validation - only catch obvious errors
        """
        if not diagram_code or len(diagram_code.strip()) < 5:
            return False, "Diagram code is empty or too short"

        lines = diagram_code.strip().split('\n')
        first_line = lines[0].strip()

        # Check for valid diagram types
        valid_starts = [
            'graph TD', 'graph LR', 'graph TB', 'graph BT',
            'sequenceDiagram', 'classDiagram', 'erDiagram',
            'stateDiagram-v2', 'gitgraph', 'flowchart TD', 'flowchart LR'
        ]

        if not any(first_line.startswith(start) for start in valid_starts):
            return False, f"Invalid diagram type: {first_line}"

        # Only check for critical syntax errors that we know cause failures
        diagram_type = first_line.split()[0]

        try:
            # Only run critical validations that catch known error patterns
            if diagram_type in ['graph', 'flowchart']:
                return self._validate_flowchart_critical(lines[1:])
            elif diagram_type == 'classDiagram':
                return self._validate_class_critical(lines[1:])
            else:
                # For other types, be very permissive
                return self._validate_generic_syntax(lines[1:])
        except Exception as e:
            logger.debug(f"Basic validation error: {e}")
            return True, None  # If validation fails, assume it's valid to avoid false negatives

    def _validate_flowchart_critical(self, lines: list) -> tuple[bool, Optional[str]]:
        """Only validate critical flowchart errors that definitely cause failures"""
        for line_num, line in enumerate(lines, 2):
            line = line.strip()
            if not line or line.startswith('%%'):
                continue

            # Only check for errors we know cause parse failures
            if line.startswith('title ') or line.startswith('accDes:'):
                return False, f"Line {line_num}: title/accDes not allowed inside graph"

            # Check for parentheses inside brackets (known error)
            if '[' in line and ']' in line:
                bracket_start = line.find('[')
                bracket_end = line.find(']', bracket_start)
                if bracket_start != -1 and bracket_end != -1:
                    bracket_content = line[bracket_start+1:bracket_end]
                    if '(' in bracket_content and ')' in bracket_content:
                        return False, f"Line {line_num}: Parentheses not allowed inside brackets: [{bracket_content}]"

        # Be permissive for everything else
        return True, None

    def _validate_class_critical(self, lines: list) -> tuple[bool, Optional[str]]:
        """Only validate critical class diagram errors"""
        for line_num, line in enumerate(lines, 2):
            line = line.strip()
            if not line or line.startswith('%%'):
                continue

            # Check for quoted class names (known error)
            if line.startswith('class ') and '"' in line:
                return False, f"Line {line_num}: Quoted class names not allowed, use CamelCase"

        # Be permissive for everything else
        return True, None

    def _validate_flowchart_syntax(self, lines: list) -> tuple[bool, Optional[str]]:
        """Validate flowchart/graph syntax"""
        for line_num, line in enumerate(lines, 2):  # Start from line 2
            line = line.strip()
            if not line or line.startswith('%%'):
                continue

            # Check for common syntax errors
            if line.startswith('title ') or line.startswith('accDes:'):
                return False, f"Line {line_num}: title/accDes not allowed inside graph"

            # Check for parentheses inside brackets (common error)
            if '[' in line and ']' in line:
                # Extract content inside brackets
                bracket_start = line.find('[')
                bracket_end = line.find(']', bracket_start)
                if bracket_start != -1 and bracket_end != -1:
                    bracket_content = line[bracket_start+1:bracket_end]
                    if '(' in bracket_content and ')' in bracket_content:
                        return False, f"Line {line_num}: Parentheses not allowed inside brackets: [{bracket_content}]"

            # Check for unsupported operators like &
            if ' & ' in line:
                return False, f"Line {line_num}: '&' operator not supported, use separate connections"

            # Check for invalid node IDs with spaces
            if '-->' in line or '->' in line:
                parts = line.split('-->')
                if len(parts) == 1:
                    parts = line.split('->')
                for part in parts:
                    node_id = part.strip().split('[')[0].split('(')[0].split('{')[0]
                    if ' ' in node_id and not (node_id.startswith('"') and node_id.endswith('"')):
                        return False, f"Line {line_num}: Node ID '{node_id}' contains spaces"

            # Check for quoted node IDs (not recommended)
            if '"' in line and ('class ' not in line):
                # Allow quotes in labels but warn about node IDs
                pass

        return True, None

    def _validate_sequence_syntax(self, lines: list) -> tuple[bool, Optional[str]]:
        """Validate sequence diagram syntax"""
        has_participants = False
        has_messages = False

        for line in lines:
            line = line.strip()
            if not line or line.startswith('%%'):
                continue

            if line.startswith('participant '):
                has_participants = True
            elif '->>' in line or '-->' in line or '->' in line:
                has_messages = True
            elif 'activate ' in line or 'deactivate ' in line:
                continue
            elif 'Note ' in line:
                continue

        if has_messages:  # Participants are optional in modern Mermaid
            return True, None
        else:
            return False, "No valid sequence messages found"

    def _validate_class_syntax(self, lines: list) -> tuple[bool, Optional[str]]:
        """Validate class diagram syntax"""
        for line_num, line in enumerate(lines, 2):
            line = line.strip()
            if not line or line.startswith('%%'):
                continue

            # Check for quoted class names (common error)
            if line.startswith('class ') and '"' in line:
                return False, f"Line {line_num}: Quoted class names not allowed, use CamelCase"

            # Check for class definitions or relationships
            if 'class ' in line or '|' in line or '-->' in line or '--' in line:
                continue
            elif '{' in line or '}' in line:
                continue
            elif '+' in line or '-' in line or '#' in line:
                # Method/field visibility
                continue

        return True, None

    def _validate_er_syntax(self, lines: list) -> tuple[bool, Optional[str]]:
        """Validate ER diagram syntax"""
        for line in lines:
            line = line.strip()
            if not line or line.startswith('%%'):
                continue

            # Check for ER relationships
            if '||' in line or '}|' in line or '|{' in line:
                continue
            elif '{' in line or '}' in line:
                continue

        return True, None

    def _validate_generic_syntax(self, lines: list) -> tuple[bool, Optional[str]]:
        """Generic validation for other diagram types"""
        non_empty_lines = [line.strip() for line in lines if line.strip() and not line.strip().startswith('%%')]

        if len(non_empty_lines) == 0:
            return False, "Diagram has no content"

        return True, None

    def _clean_validation_error(self, error_msg: str) -> str:
        """Clean up validation error messages to remove npm warnings and noise"""
        if not error_msg:
            return "Unknown validation error"

        lines = error_msg.split('\n')
        clean_lines = []

        for line in lines:
            # Skip npm warnings and experimental warnings
            if any(skip in line.lower() for skip in [
                'experimentalwarning', 'commonjs module', 'es module',
                'npm error could not determine executable',
                'complete log of this run can be found',
                'use `node --trace-warnings'
            ]):
                continue

            # Keep actual error messages
            if line.strip() and ('error' in line.lower() or 'invalid' in line.lower()):
                clean_lines.append(line.strip())

        if clean_lines:
            return '; '.join(clean_lines)
        else:
            return "CLI validation failed (see logs for details)"

    async def _validate_and_render_mermaid(self, diagram_code: str, title: str, description: str) -> Optional[str]:
        """Validate and potentially correct Mermaid diagram using local validation first, then AI if needed"""

        # Step 1: Try local validation first to save API calls
        if self.use_local_validation:
            is_valid, error_msg = self._validate_mermaid_locally(diagram_code)
            if is_valid:
                logger.info(f"Mermaid diagram '{title}' passed local validation")
                return diagram_code
            else:
                # Clean up the error message to remove npm warnings
                clean_error = self._clean_validation_error(error_msg) if error_msg else "Unknown validation error"
                logger.info(f"Mermaid diagram '{title}' failed local validation: {clean_error}")
                logger.info(f"Using {self.validation_model_name} to fix diagram")
        else:
            logger.info(f"Validating Mermaid diagram '{title}' using {self.validation_model_name} (local validation disabled)")

        # Step 2: Use AI model to fix the diagram
        validation_kwargs = {
            "api_key": self.api_key,
            "model_name": self.validation_model_name,
            "provider": self.provider,
            "temperature": 0.7
        }
        if self.provider.lower() == "custom":
            validation_kwargs["base_url"] = self.base_url

        validation_model = create_model_instance(**validation_kwargs)

        # Include local validation error in prompt if available
        local_error_info = ""
        if self.use_local_validation:
            is_valid, error_msg = self._validate_mermaid_locally(diagram_code)
            if not is_valid and error_msg:
                local_error_info = f"\n**Local Validation Error:** {error_msg}\n"

        validation_prompt = f"""
You are a Mermaid diagram validation and correction expert. Your task is to fix the following Mermaid diagram code that failed local validation.

**Diagram Title:** {title}
**Description:** {description}
{local_error_info}
**Mermaid Code to Fix:**
```
{diagram_code}
```

**Critical Validation Requirements:**
1. **Syntax Correctness**: Ensure the diagram follows exact Mermaid syntax specifications
2. **Renderability**: Verify the diagram will render without errors in Mermaid.js
3. **Node ID Validation**: Check that all node IDs use only alphanumeric characters and underscores
4. **Arrow Syntax**: Verify correct arrow types for the specific diagram type
5. **Special Characters**: Ensure proper escaping of special characters in labels

**Common Issues to Fix:**
- Invalid characters in node IDs (spaces, hyphens, special chars) → Replace with underscores
- Incorrect arrow syntax for diagram type → Use proper arrows (-->, ->>>, etc.)
- Missing participant declarations in sequence diagrams → Add all participants
- Malformed class relationships → Use correct notation (--|>, <|--, etc.)
- Unescaped quotes or special characters in labels → Properly escape or remove
- Invalid state diagram syntax → Use proper state notation

**Specific Diagram Type Rules:**
- **flowchart/graph TD**: Use --> for connections, avoid spaces in node IDs
- **sequenceDiagram**: Declare all participants first, use ->> for messages
- **classDiagram**: Use proper relationship notation, avoid spaces in class names
- **erDiagram**: Use proper entity and relationship syntax
- **stateDiagram-v2**: Use proper state notation and transitions

**Instructions:**
1. If the diagram is syntactically correct and will render properly, return it exactly as provided
2. If there are any syntax errors or potential rendering issues, provide a corrected version
3. Maintain the original intent and logical structure while fixing technical issues
4. Keep node labels concise and readable (3-4 words maximum)
5. Ensure all node IDs are valid (alphanumeric and underscores only)

**Response Format:**
Return ONLY the corrected Mermaid code without any markdown code blocks, explanations, or additional text.
Start directly with the diagram directive (e.g., "graph TD", "sequenceDiagram", etc.).

**Validated/Corrected Diagram:**
"""

        try:
            input_stream = streams.stream_content([validation_prompt])
            response_text = ""

            async for response_part in validation_model(input_stream):
                response_text += response_part.text

            # Clean up the response
            validated_code = response_text.strip()
            # Remove any markdown code blocks if present
            validated_code = validated_code.replace('```mermaid', '').replace('```', '').strip()

            # Basic sanity check - ensure we still have a diagram
            if validated_code and len(validated_code) > 10:
                # Check if validation made any changes
                if validated_code.strip() != diagram_code.strip():
                    logger.info(f"Mermaid diagram '{title}' was corrected during validation")
                    logger.debug(f"Original: {diagram_code[:100]}...")
                    logger.debug(f"Validated: {validated_code[:100]}...")
                else:
                    logger.info(f"Mermaid diagram '{title}' passed validation without changes")
                return validated_code
            else:
                logger.warning(f"Validation returned empty or too short result for '{title}', using original")
                return diagram_code

        except Exception as e:
            logger.error(f"Error during Mermaid validation for '{title}': {e}")
            # Return original code if validation fails
            return diagram_code

    async def _create_markdown_table(self, suggestion: Dict[str, Any]) -> Optional[TableSuggestion]:
        """Create markdown table based on suggestion"""

        title = suggestion["title"]
        description = suggestion["description"]
        content_basis = suggestion.get("content_basis", "")
        suggested_headers = suggestion.get("suggested_headers", [])

        prompt = f"""
Create a markdown table for: {title}

Description: {description}
Content Basis: {content_basis}
Suggested Headers: {', '.join(suggested_headers)}

Based on the content provided, create a structured table with appropriate headers and rows.
Extract specific information from the content basis to populate the table.

Return the result as JSON in this format:
{{
    "headers": ["Header1", "Header2", "Header3"],
    "rows": [
        ["Row1Col1", "Row1Col2", "Row1Col3"],
        ["Row2Col1", "Row2Col2", "Row2Col3"]
    ]
}}

Generate the table data:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                table_data = json.loads(json_text)

                return TableSuggestion(
                    title=title,
                    description=description,
                    headers=table_data.get("headers", []),
                    rows=table_data.get("rows", []),
                    section_context=content_basis
                )
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing table JSON: {e}")

        return None

    async def _create_enhanced_content(self, original_content: str, diagrams: List[DiagramSuggestion], tables: List[TableSuggestion]) -> str:
        """Create enhanced content by integrating diagrams and tables into the original content"""

        prompt = f"""
Enhance the following research content by strategically integrating the provided diagrams and tables.

Original Content:
{original_content}

Available Diagrams:
{json.dumps([{
    'type': d.diagram_type,
    'title': d.title,
    'description': d.description,
    'mermaid_code': d.mermaid_code
} for d in diagrams], indent=2)}

Available Tables:
{json.dumps([{
    'title': t.title,
    'description': t.description,
    'headers': t.headers,
    'rows': t.rows
} for t in tables], indent=2)}

Instructions:
1. Keep all the original content and structure
2. Insert diagrams and tables at appropriate locations where they enhance understanding
3. Add brief introductory text before each diagram/table explaining what it shows
4. Use proper markdown formatting for diagrams and tables
5. Ensure diagrams use proper Mermaid code blocks with ```mermaid
6. Ensure tables use proper markdown table syntax

Format diagrams like this:
### Diagram Title
Brief description of what this diagram shows.

```mermaid
[mermaid code here]
```

Format tables like this:
### Table Title
Brief description of what this table organizes.

| Header1 | Header2 | Header3 |
|---------|---------|---------|
| Row1Col1 | Row1Col2 | Row1Col3 |

Generate the enhanced content:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        return response_text if response_text.strip() else original_content



def create_diagram_generator(api_key: str, model_name: str = None, max_diagrams: int = 6, max_tables: int = 4, provider: str = "google", base_url: str = None) -> Optional[DiagramGenerator]:
    """
    Factory function to safely create a DiagramGenerator instance

    Args:
        api_key: API key for the chosen provider
        model_name: Model to use for diagram generation (optional, defaults based on provider)
        max_diagrams: Maximum number of diagrams to generate per topic (default: 6)
        max_tables: Maximum number of tables to generate per topic (default: 4)
        provider: AI provider to use ("google", "openai", "openrouter", or "custom")
        base_url: Base URL for custom provider (required when provider="custom")

    Returns:
        DiagramGenerator instance if dependencies are available, None otherwise

    Note: Validation removed - frontend handles diagram repair with AI
    """
    try:
        return DiagramGenerator(api_key, model_name, max_diagrams, max_tables, provider, base_url)
    except ImportError as e:
        logger.warning(f"Cannot create DiagramGenerator: {e}")
        return None
