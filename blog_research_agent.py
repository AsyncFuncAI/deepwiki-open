#!/usr/bin/env python3
"""
Blog Research Agent - A multi-step agent that combines genai-processors and AdalFlow
to generate multiple topic blog posts from repository analysis.

This agent implements a 4-stage pipeline:
1. File Tree Analysis - Analyze repository structure
2. Blog Topic Generation - Break down into engaging blog topics
3. Parallel Research - Research each topic using RAG
4. Content Synthesis - Combine results into multiple blog posts

Key Features:
- Parallel processing of research topics using genai-processors
- RAG-enhanced research using AdalFlow for accurate code analysis
- Streaming progress updates throughout the pipeline
- Modular architecture with chainable processors
- Support for both RAG-enabled and LLM-only research modes
- Generates multiple standalone blog posts instead of single wiki

Installation:
    pip install genai-processors adalflow google-generativeai

Setup:
    1. Get a Google API key from https://makersuite.google.com/app/apikey
    2. Set environment variable: export GOOGLE_API_KEY="your-key-here"
    3. For RAG functionality, ensure AdalFlow dependencies are installed

Example Usage:
    # Generate blog posts with RAG
    python blog_research_agent.py /path/to/repo YOUR_API_KEY --output blog_posts/

    # Generate technical deep-dive blog posts
    python blog_research_agent.py /path/to/repo YOUR_API_KEY --technical --output tech_blogs/

    # Quick demo without RAG
    python blog_research_agent.py /path/to/repo YOUR_API_KEY --demo --no-rag

    # Custom number of blog topics
    python blog_research_agent.py /path/to/repo YOUR_API_KEY --topics 8

    # Use environment variable for API key
    export GOOGLE_API_KEY="your-key"
    python blog_research_agent.py . --output blog_posts/

Architecture:
    The agent implements a 4-stage pipeline that combines genai-processors for
    orchestration with AdalFlow for RAG capabilities:

    1. FileTreeAnalyzer: Analyzes repository structure and identifies key patterns
    2. BlogTopicGenerator: Uses LLM to break down the repo into engaging blog topics
    3. BlogTopicResearcher: Parallel processors that research each topic using RAG
    4. BlogContentSynthesizer: Combines all research into multiple standalone blog posts

    The pipeline uses genai-processors' streaming and parallel processing features
    to efficiently handle multiple research topics concurrently while providing
    real-time progress updates.
"""

import asyncio
import os
import json
import logging
import time
from dataclasses import dataclass
from typing import AsyncIterable, List, Dict, Any, Optional
from pathlib import Path

# Check for required dependencies
try:
    # genai-processors imports
    from genai_processors import content_api, processor, streams
    from genai_processors.core import genai_model
except ImportError as e:
    print("Error: genai-processors not found. Please install with: pip install genai-processors")
    print(f"Import error: {e}")
    exit(1)

try:
    # AdalFlow imports
    from api.rag import RAG
    from api.data_pipeline import DatabaseManager
except ImportError as e:
    print("Warning: AdalFlow components not found. RAG functionality will be disabled.")
    print(f"Import error: {e}")
    RAG = None
    DatabaseManager = None

try:
    # Google GenAI for image generation
    from google import genai
    from google.genai import types
except ImportError as e:
    print("Warning: Google GenAI not found. Image generation functionality will be disabled.")
    print(f"Import error: {e}")
    genai = None
    types = None

try:
    # HTML Blog Orchestrator for sophisticated blog HTML generation
    from html_blog_orchestrator import HTMLBlogOrchestrator
except ImportError as e:
    print("Warning: HTML Blog Orchestrator not found. Using fallback HTML generation.")
    print(f"Import error: {e}")
    HTMLBlogOrchestrator = None

try:
    # HTML Generator Agent for robust blog HTML generation (fallback)
    from html_generator_agent import HTMLGeneratorAgent
except ImportError as e:
    print("Warning: HTML Generator Agent not found. Using basic HTML generation.")
    print(f"Import error: {e}")
    HTMLGeneratorAgent = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce Google API logging noise
logging.getLogger("google_genai.models").setLevel(logging.WARNING)
logging.getLogger("google.generativeai").setLevel(logging.WARNING)

# Data structures for the blog research pipeline
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
    class BlogTopic:
        """A blog topic with context about relevant files"""
        topic_name: str
        description: str
        target_audience: str  # e.g., "developers", "beginners", "technical leads"
        blog_style: str  # e.g., "tutorial", "deep-dive", "overview", "case-study"
        relevant_files: List[str]
        research_questions: List[str]
        priority: int = 1  # 1=high, 2=medium, 3=low
        estimated_read_time: str = "5-10 min"  # Estimated reading time
        research_text: str = ""  # Will be filled by researcher

    @dataclass_json
    @dataclass
    class BlogResult:
        """Result from researching a specific blog topic"""
        topic: BlogTopic
        content: str
        sources: List[str]
        confidence: float = 0.0
        word_count: int = 0

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
    class BlogTopic:
        """A blog topic with context about relevant files"""
        topic_name: str
        description: str
        target_audience: str
        blog_style: str
        relevant_files: List[str]
        research_questions: List[str]
        priority: int = 1
        estimated_read_time: str = "5-10 min"
        research_text: str = ""

        def to_dict(self):
            return {
                'topic_name': self.topic_name,
                'description': self.description,
                'target_audience': self.target_audience,
                'blog_style': self.blog_style,
                'relevant_files': self.relevant_files,
                'research_questions': self.research_questions,
                'priority': self.priority,
                'estimated_read_time': self.estimated_read_time,
                'research_text': self.research_text
            }

    @dataclass
    class BlogResult:
        """Result from researching a specific blog topic"""
        topic: BlogTopic
        content: str
        sources: List[str]
        confidence: float = 0.0
        word_count: int = 0

        def to_dict(self):
            return {
                'topic': self.topic.to_dict(),
                'content': self.content,
                'sources': self.sources,
                'confidence': self.confidence,
                'word_count': self.word_count
            }

# Import the FileTreeAnalyzer from wiki_research_agent
from wiki_research_agent import FileTreeAnalyzer

class BlogTopicGenerator(processor.Processor):
    """Generates blog topics from repository analysis"""

    def __init__(self, api_key: str, num_topics: int = 6, technical_mode: bool = False):
        self.api_key = api_key
        self.num_topics = num_topics
        self.technical_mode = technical_mode
        self.genai_model = genai_model.GenaiModel(
            api_key=api_key,
            model_name="gemini-2.5-pro"
        )

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Generate blog topics from repository info"""
        async for part in content:
            if part.mimetype == "application/json; type=RepositoryInfo":
                # Get repo info from metadata or parse JSON
                repo_info = part.get_metadata("repo_info")
                if repo_info is None:
                    # Parse from JSON text
                    repo_data = json.loads(part.text)
                    repo_info = RepositoryInfo(**repo_data)

                logger.info(f"Generating blog topics for repository: {repo_info.path}")

                # Generate topics using LLM
                topics = await self._generate_blog_topics(repo_info)

                # Yield each topic as a separate part
                for topic in topics:
                    topic_json = json.dumps({
                        'topic_name': topic.topic_name,
                        'description': topic.description,
                        'target_audience': topic.target_audience,
                        'blog_style': topic.blog_style,
                        'relevant_files': topic.relevant_files,
                        'research_questions': topic.research_questions,
                        'priority': topic.priority,
                        'estimated_read_time': topic.estimated_read_time,
                        'research_text': topic.research_text
                    })

                    topic_part = content_api.ProcessorPart(
                        topic_json,
                        mimetype="application/json; type=BlogTopic",
                        metadata={"topic": topic}
                    )
                    yield topic_part

                # Yield status update
                status_part = content_api.ProcessorPart(
                    f"Generated {len(topics)} blog topics",
                    substream_name="status"
                )
                yield status_part

                # Also pass through the original RepositoryInfo for RAG initialization
                yield part
            else:
                yield part

    async def _generate_blog_topics(self, repo_info: RepositoryInfo) -> List[BlogTopic]:
        """Use LLM to generate blog topics based on repository analysis"""

        # Create prompt for blog topic generation
        mode_description = "technical deep-dive" if self.technical_mode else "accessible and engaging"

        prompt = f"""
Analyze this repository structure and generate {self.num_topics} distinct blog post topics that would be {mode_description} for readers interested in this codebase.

Repository Information:
- Path: {repo_info.path}
- Total files: {repo_info.total_files}
- File types: {repo_info.file_types}
- Key directories: {repo_info.key_directories}
- Architecture hints: {repo_info.architecture_hints}

File tree structure:
{json.dumps(repo_info.file_tree, indent=2)[:2000]}...

Generate {self.num_topics} blog post topics that would be engaging and informative. Each topic should:
1. Focus on a specific aspect that would make an interesting blog post
2. Be suitable for the target audience (developers, tech enthusiasts, etc.)
3. Have a clear narrative or educational value
4. Be researchable using the available files
5. Provide practical insights or learning opportunities

Blog post styles to consider:
- "tutorial": Step-by-step guides and how-tos
- "deep-dive": Technical analysis and architecture exploration
- "overview": High-level introductions and summaries
- "case-study": Real-world examples and lessons learned
- "comparison": Comparing approaches, tools, or patterns

Target audiences to consider:
- "developers": Software developers and engineers
- "beginners": New programmers or those new to the technology
- "technical-leads": Senior developers and architects
- "general-tech": Tech-savvy general audience

Return a JSON array of blog topics with this structure:
[
  {{
    "topic_name": "Building Scalable APIs: A Deep Dive into [Project Name]'s Architecture",
    "description": "Explore how this project implements scalable API design patterns and best practices",
    "target_audience": "developers",
    "blog_style": "deep-dive",
    "relevant_files": ["src/api/", "config/settings.py"],
    "research_questions": ["How is the API structured?", "What patterns are used for scalability?", "How is authentication handled?"],
    "priority": 1,
    "estimated_read_time": "8-12 min"
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

                # Convert to BlogTopic objects
                topics = []
                for topic_data in topics_data:
                    topic = BlogTopic(
                        topic_name=topic_data.get("topic_name", "Unknown Topic"),
                        description=topic_data.get("description", ""),
                        target_audience=topic_data.get("target_audience", "developers"),
                        blog_style=topic_data.get("blog_style", "overview"),
                        relevant_files=topic_data.get("relevant_files", []),
                        research_questions=topic_data.get("research_questions", []),
                        priority=topic_data.get("priority", 2),
                        estimated_read_time=topic_data.get("estimated_read_time", "5-10 min")
                    )
                    topics.append(topic)

                logger.info(f"Generated {len(topics)} blog topics successfully")
                return topics

        except Exception as e:
            logger.error(f"Error parsing blog topics from LLM response: {e}")

        # Fallback: create default topics
        return self._create_default_blog_topics(repo_info)

    def _create_default_blog_topics(self, repo_info: RepositoryInfo) -> List[BlogTopic]:
        """Create default blog topics if LLM generation fails"""
        default_topics = [
            BlogTopic(
                topic_name="Understanding the Architecture",
                description="A deep dive into the system design and component organization",
                target_audience="developers",
                blog_style="deep-dive",
                relevant_files=[],
                research_questions=["How is the system structured?", "What are the main components?"],
                priority=1,
                estimated_read_time="8-12 min"
            ),
            BlogTopic(
                topic_name="Getting Started Guide",
                description="A beginner-friendly introduction to working with this codebase",
                target_audience="beginners",
                blog_style="tutorial",
                relevant_files=[],
                research_questions=["How do you set up the project?", "What are the first steps?"],
                priority=1,
                estimated_read_time="5-8 min"
            ),
            BlogTopic(
                topic_name="Key Features Showcase",
                description="Highlighting the most interesting and useful features",
                target_audience="general-tech",
                blog_style="overview",
                relevant_files=[],
                research_questions=["What are the standout features?", "How do they work?"],
                priority=2,
                estimated_read_time="6-10 min"
            )
        ]

        logger.info(f"Using {len(default_topics)} default blog topics")
        return default_topics

class BlogTopicResearcher(processor.PartProcessor):
    """Researches individual blog topics using AdalFlow RAG"""

    def __init__(self, api_key: str, rag_instance: Optional[Any] = None):
        self.api_key = api_key
        self.rag = rag_instance
        self.genai_model = genai_model.GenaiModel(
            api_key=api_key,
            model_name="gemini-2.5-flash"
        )

    def match(self, part: content_api.ProcessorPart) -> bool:
        """Only process BlogTopic parts"""
        return part.mimetype == "application/json; type=BlogTopic"

    async def call(self, content: content_api.ProcessorPart) -> AsyncIterable[content_api.ProcessorPart]:
        """Research a specific blog topic using RAG"""
        if self.match(content):
            # Get topic from metadata or parse JSON
            topic = content.get_metadata("topic")
            if topic is None:
                # Parse from JSON text
                topic_data = json.loads(content.text)
                topic = BlogTopic(**topic_data)

            logger.info(f"Researching blog topic: {topic.topic_name}")

            # Yield status update
            status_part = content_api.ProcessorPart(
                f"Starting research on blog topic: {topic.topic_name}",
                substream_name="status"
            )
            yield status_part

            # Conduct research
            blog_result = await self._research_blog_topic(topic)

            # Skip if no valid research result (e.g., no RAG content found)
            if blog_result is None:
                logger.warning(f"Skipping blog topic '{topic.topic_name}' - no content found")
                status_part = content_api.ProcessorPart(
                    f"Skipped research on blog topic: {topic.topic_name} (no content found)",
                    substream_name="status"
                )
                yield status_part
                return

            # Yield research result as JSON
            result_json = json.dumps({
                'topic': {
                    'topic_name': blog_result.topic.topic_name,
                    'description': blog_result.topic.description,
                    'target_audience': blog_result.topic.target_audience,
                    'blog_style': blog_result.topic.blog_style,
                    'relevant_files': blog_result.topic.relevant_files,
                    'research_questions': blog_result.topic.research_questions,
                    'priority': blog_result.topic.priority,
                    'estimated_read_time': blog_result.topic.estimated_read_time,
                    'research_text': blog_result.topic.research_text
                },
                'content': blog_result.content,
                'sources': blog_result.sources,
                'confidence': blog_result.confidence,
                'word_count': blog_result.word_count
            })

            result_part = content_api.ProcessorPart(
                result_json,
                mimetype="application/json; type=BlogResult",
                metadata={"blog_result": blog_result}
            )
            yield result_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"Completed research on blog topic: {topic.topic_name}",
                substream_name="status"
            )
            yield completion_part
        else:
            # Pass through non-matching parts
            yield content

    async def _research_blog_topic(self, topic: BlogTopic) -> Optional[BlogResult]:
        """Conduct research on a specific blog topic using RAG"""
        try:
            if self.rag is None:
                # Skip topics when RAG is not available - we want repository-specific content only
                logger.warning(f"RAG not available for blog topic: {topic.topic_name}, skipping")
                return None

            # Use RAG to research the topic
            research_queries = self._generate_research_queries(topic)
            all_content = []
            all_sources = []

            for query in research_queries:
                logger.info(f"Querying RAG for blog research: {query}")

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

            # Synthesize blog content
            if all_content and len(all_content) >= 2:  # Require at least 2 content pieces for quality
                logger.info(f"Found {len(all_content)} content pieces from RAG for blog topic: {topic.topic_name}")
                synthesized_content = await self._synthesize_blog_content(topic, all_content)
                # Calculate word count
                word_count = len(synthesized_content.split())
                # Improved confidence calculation based on more content and sources
                confidence = min(0.95, (len(all_content) / 50.0) + (len(all_sources) / 20.0))
                content_str = str(synthesized_content)  # _synthesize_blog_content returns a string
            else:
                logger.warning(f"Insufficient RAG content found for blog topic: {topic.topic_name} (found {len(all_content)} pieces), skipping")
                # Return None to indicate this topic should be skipped
                return None

            return BlogResult(
                topic=topic,
                content=content_str,
                sources=all_sources,
                confidence=confidence,
                word_count=word_count
            )

        except Exception as e:
            logger.error(f"Error researching blog topic {getattr(topic, 'topic_name', 'Unknown')}: {e}")
            # Return error result
            return BlogResult(
                topic=topic,
                content=f"Error occurred while researching blog topic {getattr(topic, 'topic_name', 'Unknown')}: {str(e)}",
                sources=[],
                confidence=0.0,
                word_count=0
            )

    def _generate_research_queries(self, topic: BlogTopic) -> List[str]:
        """Generate specific queries for RAG based on the blog topic"""
        queries = []

        # Add the main topic description as a query
        queries.append(topic.description)

        # Add research questions as queries
        for question in topic.research_questions[:5]:
            queries.append(question)

        # Add topic-specific queries based on blog style
        style = topic.blog_style.lower()

        if style == "tutorial":
            queries.extend([
                "setup installation configuration",
                "step by step guide examples"
            ])
        elif style == "deep-dive":
            queries.extend([
                "architecture implementation details",
                "design patterns technical analysis"
            ])
        elif style == "overview":
            queries.extend([
                "main features functionality",
                "high level structure components"
            ])
        elif style == "case-study":
            queries.extend([
                "real world usage examples",
                "lessons learned best practices"
            ])

        # Add audience-specific queries
        if topic.target_audience == "beginners":
            queries.append("getting started basics fundamentals")
        elif topic.target_audience == "technical-leads":
            queries.append("architecture decisions scalability patterns")

        return queries[:3]  # Limit to 3 queries for efficiency

    async def _synthesize_blog_content(self, topic: BlogTopic, content_pieces: List[str]) -> str:
        """Synthesize blog content using LLM with blog-specific formatting"""

        # Combine content pieces
        combined_content = "\n\n".join(content_pieces)

        # Calculate content length for better handling
        content_length = len(combined_content)
        logger.info(f"Synthesizing {len(content_pieces)} content pieces ({content_length} characters) for blog topic: {topic.topic_name}")

        # Create blog-specific prompt based on style and audience
        style_instructions = self._get_style_instructions(topic.blog_style)
        audience_instructions = self._get_audience_instructions(topic.target_audience)

        prompt = f"""
Write an engaging blog post based on the following code and documentation content from the repository.

Blog Topic: {topic.topic_name}
Description: {topic.description}
Target Audience: {topic.target_audience}
Blog Style: {topic.blog_style}
Estimated Read Time: {topic.estimated_read_time}

{style_instructions}

{audience_instructions}

Research Questions to Address:
{chr(10).join(f"- {q}" for q in topic.research_questions)}

Available Content from Repository Files:
{combined_content}

Please write a complete blog post that:
1. ONLY uses information found in the provided repository files - do not add generic information
2. Follows the specified blog style and targets the intended audience
3. Addresses the research questions based on actual code and documentation found
4. Provides specific examples from the actual code with exact file references
5. Uses engaging markdown formatting suitable for a blog post
6. Includes appropriate headings, code blocks, and formatting
7. Has a compelling introduction and conclusion
8. References specific files and implementations when discussing features
9. If certain aspects cannot be determined from the provided content, simply omit them rather than making assumptions

IMPORTANT: Base your blog post entirely on the provided repository content. Write in an engaging, blog-appropriate tone while maintaining technical accuracy.

Generate the complete blog post:
"""

        input_stream = streams.stream_content([prompt])
        response_text = ""

        async for response_part in self.genai_model(input_stream):
            response_text += response_part.text

        return response_text

    def _get_style_instructions(self, blog_style: str) -> str:
        """Get style-specific instructions for blog content generation"""
        style_map = {
            "tutorial": """
Style Instructions for Tutorial:
- Write step-by-step instructions that readers can follow
- Include clear headings for each major step
- Provide code examples and explanations
- Use second person ("you") to guide the reader
- Include prerequisites and setup instructions
- End with next steps or further reading suggestions
""",
            "deep-dive": """
Style Instructions for Deep Dive:
- Provide detailed technical analysis and explanations
- Explore the "why" behind design decisions
- Include architecture diagrams or code structure explanations
- Use technical terminology appropriately
- Analyze trade-offs and implementation choices
- Compare different approaches where relevant
""",
            "overview": """
Style Instructions for Overview:
- Provide a high-level introduction to the topic
- Focus on the big picture and main concepts
- Use clear, accessible language
- Include key highlights and takeaways
- Structure content with clear sections
- Balance breadth with enough detail to be useful
""",
            "case-study": """
Style Instructions for Case Study:
- Tell a story about real-world implementation
- Include challenges faced and solutions found
- Highlight lessons learned and best practices
- Use specific examples and outcomes
- Structure as a narrative with clear progression
- Include actionable insights for readers
"""
        }
        return style_map.get(blog_style, style_map["overview"])

    def _get_audience_instructions(self, target_audience: str) -> str:
        """Get audience-specific instructions for blog content generation"""
        audience_map = {
            "developers": """
Audience Instructions for Developers:
- Use appropriate technical terminology
- Include code examples and implementation details
- Focus on practical applications and use cases
- Assume familiarity with programming concepts
- Highlight developer-relevant features and benefits
""",
            "beginners": """
Audience Instructions for Beginners:
- Explain technical concepts in simple terms
- Define jargon and acronyms when first used
- Provide context for why things matter
- Use analogies to explain complex concepts
- Include links or references for further learning
""",
            "technical-leads": """
Audience Instructions for Technical Leads:
- Focus on architectural decisions and trade-offs
- Discuss scalability, maintainability, and performance
- Include strategic considerations and business impact
- Highlight team and project management aspects
- Address integration and ecosystem considerations
""",
            "general-tech": """
Audience Instructions for General Tech Audience:
- Balance technical detail with accessibility
- Explain the broader significance and impact
- Use clear examples and analogies
- Focus on innovation and interesting aspects
- Avoid overly technical implementation details
"""
        }
        return audience_map.get(target_audience, audience_map["developers"])

class BlogImageGenerator(processor.PartProcessor):
    """Generates images for blog posts using Gemini 2.0 Flash Preview Image Generation"""

    def __init__(self, api_key: str, max_images: int = 3):
        self.api_key = api_key
        self.max_images = max_images
        self.client = None

        # Initialize Google GenAI client if available
        if genai is not None and types is not None:
            try:
                self.client = genai.Client(api_key=api_key)
                logger.info("Google GenAI client initialized for image generation")
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}")
                self.client = None
        else:
            logger.warning("Google GenAI not available, image generation disabled")

    def match(self, part: content_api.ProcessorPart) -> bool:
        """Only process BlogResult parts"""
        return part.mimetype == "application/json; type=BlogResult"

    async def call(self, content: content_api.ProcessorPart) -> AsyncIterable[content_api.ProcessorPart]:
        """Generate images for a blog post"""
        if self.match(content) and self.client is not None:
            # Get blog result from metadata or parse JSON
            blog_result = content.get_metadata("blog_result")
            if blog_result is None:
                # Parse from JSON text
                result_data = json.loads(content.text)
                topic_data = result_data['topic']
                topic = BlogTopic(**topic_data)
                blog_result = BlogResult(
                    topic=topic,
                    content=result_data['content'],
                    sources=result_data['sources'],
                    confidence=result_data['confidence'],
                    word_count=result_data['word_count']
                )

            logger.info(f"Generating images for blog post: {blog_result.topic.topic_name}")

            # Yield status update
            status_part = content_api.ProcessorPart(
                f"Starting image generation for: {blog_result.topic.topic_name}",
                substream_name="status"
            )
            yield status_part

            # Generate images for the blog post
            enhanced_result = await self._generate_blog_images(blog_result)

            # Yield enhanced result with images
            if enhanced_result:
                # Create a simplified JSON representation (without ProcessorPart objects)
                enhanced_json = json.dumps({
                    'topic': {
                        'topic_name': enhanced_result.topic.topic_name,
                        'description': enhanced_result.topic.description,
                        'target_audience': enhanced_result.topic.target_audience,
                        'blog_style': enhanced_result.topic.blog_style,
                        'relevant_files': enhanced_result.topic.relevant_files,
                        'research_questions': enhanced_result.topic.research_questions,
                        'priority': enhanced_result.topic.priority,
                        'estimated_read_time': enhanced_result.topic.estimated_read_time,
                        'research_text': enhanced_result.topic.research_text
                    },
                    'content': enhanced_result.content,
                    'sources': enhanced_result.sources,
                    'confidence': enhanced_result.confidence,
                    'word_count': enhanced_result.word_count,
                    'image_count': len(getattr(enhanced_result, 'images', []))
                })

                enhanced_part = content_api.ProcessorPart(
                    enhanced_json,
                    mimetype="application/json; type=EnhancedBlogResult",
                    metadata={"enhanced_blog_result": enhanced_result}
                )
                yield enhanced_part

                # Yield individual image parts
                images = getattr(enhanced_result, 'images', [])
                for img in images:
                    image_part = content_api.ProcessorPart(
                        img['processor_part'].bytes,
                        mimetype=img['processor_part'].mimetype,
                        metadata={
                            "image_filename": img['filename'],
                            "image_alt_text": img['alt_text'],
                            "image_prompt": img['prompt'],
                            "blog_topic": enhanced_result.topic.topic_name
                        }
                    )
                    yield image_part
            else:
                # Fallback to original result if image generation fails
                yield content

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"Completed image generation for: {blog_result.topic.topic_name}",
                substream_name="status"
            )
            yield completion_part
        else:
            # Pass through non-matching parts or when client is not available
            yield content

    async def _generate_blog_images(self, blog_result: BlogResult) -> Optional[BlogResult]:
        """Generate images for a blog post using Gemini 2.0 Flash Preview Image Generation"""
        try:
            if self.client is None:
                logger.warning("Google GenAI client not available for image generation")
                return blog_result

            topic = blog_result.topic
            content = blog_result.content

            # Generate image prompts based on blog content and style
            image_prompts = self._create_image_prompts(topic, content)

            generated_images = []

            for i, prompt in enumerate(image_prompts[:self.max_images]):
                try:
                    logger.info(f"Generating image {i+1}/{len(image_prompts[:self.max_images])}: {prompt[:100]}...")

                    # Generate image using Gemini 2.0 Flash Preview Image Generation
                    response = self.client.models.generate_content(
                        model="gemini-2.0-flash-preview-image-generation",
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_modalities=["TEXT", "IMAGE"]
                        )
                    )

                    # Extract image data from response and create ProcessorPart
                    if response and hasattr(response, 'candidates') and response.candidates:
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            for part in candidate.content.parts:
                                if hasattr(part, 'inline_data') and part.inline_data:
                                    # Create ProcessorPart from image bytes (data is already bytes)
                                    image_bytes = part.inline_data.data
                                    image_part = content_api.ProcessorPart(
                                        image_bytes,
                                        mimetype=part.inline_data.mime_type
                                    )

                                    # Save image data with ProcessorPart
                                    image_data = {
                                        'prompt': prompt,
                                        'processor_part': image_part,
                                        'filename': self._generate_unique_filename(prompt, topic, i+1, part.inline_data.mime_type),
                                        'alt_text': self._generate_alt_text(prompt, topic)
                                    }
                                    generated_images.append(image_data)
                                    logger.info(f"Successfully generated image {i+1}")
                                    break

                except Exception as e:
                    logger.error(f"Error generating image {i+1}: {e}")
                    continue

            # Create enhanced blog result with images
            enhanced_result = BlogResult(
                topic=topic,
                content=self._integrate_images_into_content(content, generated_images),
                sources=blog_result.sources,
                confidence=blog_result.confidence,
                word_count=blog_result.word_count
            )

            # Add images as a custom attribute
            setattr(enhanced_result, 'images', generated_images)

            logger.info(f"Generated {len(generated_images)} images for blog post: {topic.topic_name}")
            return enhanced_result

        except Exception as e:
            logger.error(f"Error in blog image generation: {e}")
            return blog_result

    def _create_image_prompts(self, topic: BlogTopic, content: str) -> List[str]:
        """Create image generation prompts based on blog topic and content"""
        prompts = []

        # Main hero image based on topic
        hero_prompt = self._create_hero_image_prompt(topic)
        prompts.append(hero_prompt)

        # Style-specific images
        if topic.blog_style == "tutorial":
            prompts.extend([
                f"Create a clean, step-by-step infographic showing the workflow for {topic.topic_name}. Use modern flat design with clear icons and arrows.",
                f"Design a before-and-after comparison image showing the problem and solution related to {topic.description}. Use professional tech styling."
            ])
        elif topic.blog_style == "deep-dive":
            prompts.extend([
                f"Create a technical architecture diagram showing the system components discussed in {topic.topic_name}. Use modern tech diagram styling with clean lines and professional colors.",
                f"Design an infographic showing the technical concepts and relationships in {topic.description}. Use a dark theme with accent colors."
            ])
        elif topic.blog_style == "overview":
            prompts.extend([
                f"Create a high-level overview infographic for {topic.topic_name} showing key features and benefits. Use bright, engaging colors.",
                f"Design a comparison chart or feature matrix related to {topic.description}. Use clean, modern design."
            ])
        elif topic.blog_style == "case-study":
            prompts.extend([
                f"Create a timeline or process flow infographic showing the journey described in {topic.topic_name}. Use storytelling visual elements.",
                f"Design a results dashboard or metrics visualization related to {topic.description}. Use data visualization best practices."
            ])

        # Audience-specific adjustments
        if topic.target_audience == "beginners":
            prompts = [p.replace("technical", "beginner-friendly").replace("complex", "simple") for p in prompts]
        elif topic.target_audience == "technical-leads":
            prompts = [p.replace("simple", "detailed").replace("basic", "advanced") for p in prompts]

        return prompts

    def _create_hero_image_prompt(self, topic: BlogTopic) -> str:
        """Create a hero image prompt for the blog post"""
        base_prompt = f"Create a professional hero image for a blog post titled '{topic.topic_name}'. "

        # Add style-specific elements
        if "API" in topic.topic_name or "backend" in topic.topic_name.lower():
            base_prompt += "Show modern API/backend development concepts with servers, data flow, and code elements. "
        elif "frontend" in topic.topic_name.lower() or "UI" in topic.topic_name:
            base_prompt += "Show modern frontend development with user interfaces, responsive design, and user experience elements. "
        elif "architecture" in topic.topic_name.lower():
            base_prompt += "Show system architecture with connected components, cloud services, and data flow. "
        elif "tutorial" in topic.topic_name.lower() or "guide" in topic.topic_name.lower():
            base_prompt += "Show learning and development concepts with books, code, and progress indicators. "
        else:
            base_prompt += "Show modern software development concepts with code, technology, and innovation elements. "

        base_prompt += "Use a modern, professional design with a tech color palette (blues, purples, greens). Include subtle gradients and clean typography. Make it suitable for a technical blog header."

        return base_prompt

    def _generate_alt_text(self, prompt: str, topic: BlogTopic) -> str:
        """Generate alt text for accessibility"""
        # Extract key concepts from prompt for alt text
        alt_text = f"Infographic for {topic.topic_name}"

        if "diagram" in prompt.lower():
            alt_text += " showing system architecture and component relationships"
        elif "infographic" in prompt.lower():
            alt_text += " illustrating key concepts and workflow"
        elif "comparison" in prompt.lower():
            alt_text += " comparing different approaches and solutions"
        elif "timeline" in prompt.lower():
            alt_text += " showing process timeline and milestones"

        return alt_text

    def _generate_unique_filename(self, prompt: str, topic: BlogTopic, image_index: int, mime_type: str) -> str:
        """Generate a unique, descriptive filename for the image"""
        import hashlib

        # Get file extension
        extension = self._get_file_extension(mime_type)

        # Create base name from topic and prompt content
        topic_slug = self._create_slug(topic.topic_name)

        # Extract key concepts from the prompt for filename
        filename_parts = []

        # Add topic-based prefix
        if topic.blog_style == "tutorial":
            filename_parts.append("tutorial")
        elif topic.blog_style == "deep-dive":
            filename_parts.append("architecture")
        elif topic.blog_style == "overview":
            filename_parts.append("overview")
        elif topic.blog_style == "case-study":
            filename_parts.append("case-study")

        # Extract meaningful keywords from prompt
        prompt_lower = prompt.lower()

        # Image type detection
        if "hero" in prompt_lower or "header" in prompt_lower:
            filename_parts.append("hero")
        elif "diagram" in prompt_lower:
            filename_parts.append("diagram")
        elif "infographic" in prompt_lower:
            filename_parts.append("infographic")
        elif "architecture" in prompt_lower:
            filename_parts.append("architecture")
        elif "workflow" in prompt_lower or "flow" in prompt_lower:
            filename_parts.append("workflow")
        elif "comparison" in prompt_lower or "vs" in prompt_lower:
            filename_parts.append("comparison")
        elif "timeline" in prompt_lower:
            filename_parts.append("timeline")
        elif "dashboard" in prompt_lower or "metrics" in prompt_lower:
            filename_parts.append("dashboard")
        elif "step" in prompt_lower:
            filename_parts.append("steps")
        else:
            filename_parts.append("visual")

        # Add technology/domain keywords
        tech_keywords = {
            "api": "api",
            "backend": "backend",
            "frontend": "frontend",
            "database": "database",
            "docker": "docker",
            "kubernetes": "k8s",
            "microservice": "microservices",
            "cloud": "cloud",
            "ai": "ai",
            "machine learning": "ml",
            "neural network": "neural-net",
            "data": "data",
            "security": "security",
            "authentication": "auth",
            "deployment": "deployment",
            "monitoring": "monitoring",
            "testing": "testing",
            "ci/cd": "cicd",
            "devops": "devops",
            "react": "react",
            "node": "nodejs",
            "python": "python",
            "javascript": "js",
            "typescript": "ts"
        }

        for keyword, slug in tech_keywords.items():
            if keyword in prompt_lower or keyword in topic.topic_name.lower():
                filename_parts.append(slug)
                break  # Only add one tech keyword to keep filename reasonable

        # Create a short hash from the prompt for uniqueness
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:6]

        # Combine parts
        if len(filename_parts) > 3:
            filename_parts = filename_parts[:3]  # Limit to 3 parts for readability

        filename_base = "-".join(filename_parts)

        # Add topic slug if not too long
        if len(topic_slug) <= 20:
            filename = f"{topic_slug}-{filename_base}-{image_index}-{prompt_hash}.{extension}"
        else:
            filename = f"{filename_base}-{image_index}-{prompt_hash}.{extension}"

        # Ensure filename isn't too long (max 100 chars)
        if len(filename) > 100:
            filename = f"{filename_base[:30]}-{prompt_hash}.{extension}"

        return filename

    def _create_slug(self, text: str) -> str:
        """Create a URL-friendly slug from text"""
        import re

        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = re.sub(r'[^\w\s-]', '', text.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')

        # Limit length
        if len(slug) > 30:
            # Try to break at word boundaries
            words = slug.split('-')
            slug = '-'.join(words[:4])  # Take first 4 words
            if len(slug) > 30:
                slug = slug[:30].rstrip('-')

        return slug

    def _get_file_extension(self, mime_type: str) -> str:
        """Get file extension from MIME type"""
        mime_to_ext = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif'
        }
        return mime_to_ext.get(mime_type, 'png')

    def _integrate_images_into_content(self, content: str, images: List[Dict]) -> str:
        """Integrate generated images into blog content"""
        if not images:
            return content

        # Add hero image at the beginning
        if images:
            hero_image = images[0]
            hero_markdown = f"\n![{hero_image['alt_text']}]({hero_image['filename']})\n\n"
            content = hero_markdown + content

        # Add other images throughout the content
        if len(images) > 1:
            # Split content into sections and insert images
            sections = content.split('\n## ')
            if len(sections) > 1:
                for i, image in enumerate(images[1:], 1):
                    if i < len(sections):
                        image_markdown = f"\n![{image['alt_text']}]({image['filename']})\n\n"
                        sections[i] = image_markdown + sections[i]

                content = '\n## '.join(sections)

        return content

class BlogContentSynthesizer(processor.Processor):
    """Synthesizes blog research results into multiple standalone blog posts"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.genai_model = genai_model.GenaiModel(
            api_key=api_key,
            model_name="gemini-2.5-flash"
        )

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Synthesize all blog research results into individual blog posts"""
        blog_results = []
        image_parts = {}  # Map blog topic to list of image parts

        # Collect all blog research results (both regular and enhanced with images)
        async for part in content:
            if part.mimetype == "application/json; type=BlogResult":
                try:
                    # Get result from metadata or parse JSON
                    result = part.get_metadata("blog_result")
                    if result is None:
                        # Parse from JSON text
                        result_data = json.loads(part.text)
                        topic_data = result_data['topic']
                        topic = BlogTopic(**topic_data)
                        result = BlogResult(
                            topic=topic,
                            content=result_data['content'],
                            sources=result_data['sources'],
                            confidence=result_data['confidence'],
                            word_count=result_data['word_count']
                        )

                    # Validate result object
                    if not hasattr(result, 'topic') or not hasattr(result, 'content'):
                        logger.warning(f"Invalid blog result object: {type(result)}")
                        continue

                    blog_results.append(result)
                    topic_name = getattr(getattr(result, 'topic', None), 'topic_name', 'Unknown')
                    logger.info(f"Collected blog result for: {topic_name}")

                except Exception as e:
                    logger.error(f"Error processing blog result: {e}")
                    continue
            elif part.mimetype == "application/json; type=EnhancedBlogResult":
                try:
                    # Handle enhanced blog results with images
                    result = part.get_metadata("enhanced_blog_result")
                    if result is None:
                        # Parse from JSON text
                        result_data = json.loads(part.text)
                        topic_data = result_data['topic']
                        topic = BlogTopic(**topic_data)
                        result = BlogResult(
                            topic=topic,
                            content=result_data['content'],
                            sources=result_data['sources'],
                            confidence=result_data['confidence'],
                            word_count=result_data['word_count']
                        )
                        # Add images if present (reconstruct ProcessorPart objects)
                        if 'images' in result_data:
                            images = []
                            for img_data in result_data['images']:
                                # Note: ProcessorPart objects can't be serialized to JSON,
                                # so we'll need to handle this differently in practice
                                images.append(img_data)
                            setattr(result, 'images', images)

                    blog_results.append(result)
                    topic_name = getattr(getattr(result, 'topic', None), 'topic_name', 'Unknown')
                    image_count = len(getattr(result, 'images', []))
                    logger.info(f"Collected enhanced blog result for: {topic_name} (with {image_count} images)")

                except Exception as e:
                    logger.error(f"Error processing enhanced blog result: {e}")
                    continue
            elif part.mimetype and part.mimetype.startswith('image/'):
                # Collect image parts
                blog_topic = part.get_metadata('blog_topic')
                if blog_topic:
                    if blog_topic not in image_parts:
                        image_parts[blog_topic] = []
                    image_parts[blog_topic].append(part)
                    logger.debug(f"Collected image for blog topic: {blog_topic}")
            elif part.substream_name == "status":
                yield part  # Pass through status updates

        if blog_results:
            logger.info(f"Synthesizing {len(blog_results)} blog results into individual posts")

            # Generate individual blog posts
            for i, result in enumerate(blog_results, 1):
                try:
                    # Get associated images for this blog topic
                    topic_name = getattr(getattr(result, 'topic', None), 'topic_name', f'blog_post_{i}')
                    topic_images = image_parts.get(topic_name, [])

                    # Convert image parts to the format expected by save function
                    images_for_metadata = []
                    for img_part in topic_images:
                        images_for_metadata.append({
                            'processor_part': img_part,
                            'filename': img_part.get_metadata('image_filename', f'image_{len(images_for_metadata)+1}.png'),
                            'alt_text': img_part.get_metadata('image_alt_text', 'Generated image'),
                            'prompt': img_part.get_metadata('image_prompt', 'AI generated image')
                        })

                    # Generate individual blog post
                    blog_post = await self._create_individual_blog_post(result)

                    # Create filename from topic name
                    filename = self._create_filename(topic_name)

                    # Yield the individual blog post
                    blog_part = content_api.ProcessorPart(
                        blog_post,
                        mimetype="text/markdown",
                        metadata={
                            "title": topic_name,
                            "filename": filename,
                            "target_audience": getattr(getattr(result, 'topic', None), 'target_audience', 'developers'),
                            "blog_style": getattr(getattr(result, 'topic', None), 'blog_style', 'overview'),
                            "estimated_read_time": getattr(getattr(result, 'topic', None), 'estimated_read_time', '5-10 min'),
                            "word_count": getattr(result, 'word_count', 0),
                            "confidence": getattr(result, 'confidence', 0.0),
                            "sources": getattr(result, 'sources', []),
                            "images": images_for_metadata
                        }
                    )
                    yield blog_part

                except Exception as e:
                    logger.error(f"Error creating blog post for topic: {e}")
                    continue

            # Use HTML Blog Orchestrator for sophisticated blog generation
            if HTMLBlogOrchestrator is not None:
                try:
                    # Create a content stream from blog results
                    async def blog_content_stream():
                        for result in blog_results:
                            yield content_api.ProcessorPart(
                                result.content,
                                mimetype="text/markdown",
                                metadata={
                                    "title": result.topic.topic_name,
                                    "description": result.topic.description,
                                    "target_audience": result.topic.target_audience,
                                    "blog_style": result.topic.blog_style,
                                    "estimated_read_time": result.topic.estimated_read_time,
                                    "word_count": result.word_count,
                                    "confidence": result.confidence,
                                    "sources": result.sources,
                                    "images": result.images,
                                    "filename": self._create_filename(result.topic.topic_name),
                                    "is_index": False
                                }
                            )

                    # Process through the orchestrator
                    orchestrator = HTMLBlogOrchestrator(self.api_key)
                    async for html_part in orchestrator(blog_content_stream()):
                        yield html_part

                except Exception as e:
                    logger.warning(f"Failed to use HTMLBlogOrchestrator: {e}. Falling back to basic HTML generation.")
                    # Fallback to basic HTML generation
                    html_content = await self._create_blog_html(blog_results)
                    html_part = content_api.ProcessorPart(
                        html_content,
                        mimetype="text/html",
                        metadata={
                            "title": "Blog Posts Viewer",
                            "filename": "blog.html",
                            "is_index": True
                        }
                    )
                    yield html_part
            else:
                # Fallback to basic HTML generation
                html_content = await self._create_blog_html(blog_results)
                html_part = content_api.ProcessorPart(
                    html_content,
                    mimetype="text/html",
                    metadata={
                        "title": "Blog Posts Viewer",
                        "filename": "blog.html",
                        "is_index": True
                    }
                )
                yield html_part

            # Yield completion status
            completion_part = content_api.ProcessorPart(
                f"Blog synthesis complete. Generated {len(blog_results)} individual blog posts.",
                substream_name="status"
            )
            yield completion_part

    async def _create_individual_blog_post(self, result: BlogResult) -> str:
        """Create a standalone blog post from a blog result"""

        topic = result.topic
        content = result.content
        sources = result.sources
        confidence = result.confidence
        word_count = result.word_count

        # Add metadata header and footer to the blog post
        metadata_header = f"""---
title: "{topic.topic_name}"
description: "{topic.description}"
author: "Blog Research Agent"
date: "{time.strftime('%Y-%m-%d')}"
tags: ["technical", "development", "{topic.blog_style}", "{topic.target_audience}"]
readTime: "{topic.estimated_read_time}"
wordCount: {word_count}
confidence: {confidence:.1%}
---

"""

        metadata_footer = f"""

---

## About This Post

- **Target Audience**: {topic.target_audience.title()}
- **Style**: {topic.blog_style.title()}
- **Estimated Read Time**: {topic.estimated_read_time}
- **Word Count**: {word_count:,} words
- **Research Confidence**: {confidence:.1%}

### Sources
This post was generated based on analysis of the following files:
{chr(10).join(f"- `{source}`" for source in sources[:10])}
{f"- ... and {len(sources) - 10} more files" if len(sources) > 10 else ""}

---

*This blog post was automatically generated using AI analysis of the repository. The content is based entirely on the actual codebase and documentation.*
"""

        return metadata_header + content + metadata_footer

    def _create_filename(self, topic_name: str) -> str:
        """Create a safe filename from topic name"""
        import re
        # Remove special characters and replace spaces with hyphens
        filename = re.sub(r'[^\w\s-]', '', topic_name)
        filename = re.sub(r'[-\s]+', '-', filename)
        filename = filename.strip('-').lower()

        # Limit length for better file management
        if len(filename) > 60:
            # Try to break at word boundaries
            words = filename.split('-')
            filename = '-'.join(words[:8])  # Take first 8 words
            if len(filename) > 60:
                filename = filename[:60].rstrip('-')

        return f"{filename}.md"

    async def _create_blog_index(self, blog_results: List[BlogResult]) -> str:
        """Create an index/README file for all blog posts"""

        # Sort by priority and then by topic name
        sorted_results = sorted(blog_results, key=lambda r: (getattr(r.topic, 'priority', 2), getattr(r.topic, 'topic_name', '')))

        index_content = f"""# Blog Posts Collection

This collection contains {len(blog_results)} blog posts generated from repository analysis.

## Posts Overview

"""

        for i, result in enumerate(sorted_results, 1):
            topic = result.topic
            filename = self._create_filename(topic.topic_name)

            index_content += f"""### {i}. [{topic.topic_name}]({filename})

**Description**: {topic.description}

- **Target Audience**: {topic.target_audience.title()}
- **Style**: {topic.blog_style.title()}
- **Read Time**: {topic.estimated_read_time}
- **Word Count**: {result.word_count:,} words

"""

        # Add summary statistics
        total_words = sum(getattr(r, 'word_count', 0) for r in blog_results)
        avg_confidence = sum(getattr(r, 'confidence', 0) for r in blog_results) / len(blog_results) if blog_results else 0

        index_content += f"""
## Collection Statistics

- **Total Posts**: {len(blog_results)}
- **Total Word Count**: {total_words:,} words
- **Average Confidence**: {avg_confidence:.1%}
- **Generated**: {time.strftime('%Y-%m-%d %H:%M:%S')}

## Blog Styles

"""

        # Group by style
        style_groups = {}
        for result in blog_results:
            style = getattr(result.topic, 'blog_style', 'unknown')
            if style not in style_groups:
                style_groups[style] = []
            style_groups[style].append(result)

        for style, posts in style_groups.items():
            index_content += f"- **{style.title()}**: {len(posts)} posts\n"

        index_content += f"""

## Target Audiences

"""

        # Group by audience
        audience_groups = {}
        for result in blog_results:
            audience = getattr(result.topic, 'target_audience', 'unknown')
            if audience not in audience_groups:
                audience_groups[audience] = []
            audience_groups[audience].append(result)

        for audience, posts in audience_groups.items():
            index_content += f"- **{audience.title()}**: {len(posts)} posts\n"

        index_content += f"""

---

*This collection was automatically generated using AI analysis of the repository. All content is based on actual codebase analysis.*
"""

        return index_content

    async def _create_blog_html(self, blog_results: List[BlogResult]) -> str:
        """Create an HTML file that renders all blog posts nicely"""

        # Use the robust HTML generator if available
        if HTMLGeneratorAgent is not None:
            try:
                html_generator = HTMLGeneratorAgent(theme="dark", style="vercel", api_key=self.api_key)
                return await html_generator.generate_blog_html(blog_results)
            except Exception as e:
                logger.warning(f"Failed to use HTMLGeneratorAgent: {e}. Falling back to basic HTML generation.")

        # Fallback to basic HTML generation
        return await self._create_basic_blog_html(blog_results)

    async def _create_basic_blog_html(self, blog_results: List[BlogResult]) -> str:
        """Create a basic HTML file (fallback method)"""

        # Sort by priority and then by topic name
        sorted_results = sorted(blog_results, key=lambda r: (getattr(r.topic, 'priority', 2), getattr(r.topic, 'topic_name', '')))

        # Calculate statistics
        total_words = sum(getattr(r, 'word_count', 0) for r in blog_results)
        avg_confidence = sum(getattr(r, 'confidence', 0) for r in blog_results) / len(blog_results) if blog_results else 0
        total_images = sum(len(getattr(r, 'images', [])) for r in blog_results)

        # Group by style and audience for stats
        style_groups = {}
        audience_groups = {}
        for result in blog_results:
            style = getattr(result.topic, 'blog_style', 'unknown')
            audience = getattr(result.topic, 'target_audience', 'unknown')
            style_groups[style] = style_groups.get(style, 0) + 1
            audience_groups[audience] = audience_groups.get(audience, 0) + 1

        html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Generated Blog Collection</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js"></script>
    <style>
        :root {{
            --primary-color: #2563eb;
            --secondary-color: #64748b;
            --accent-color: #0ea5e9;
            --background-color: #f8fafc;
            --card-background: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background-color: var(--background-color);
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }}

        .header {{
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            color: white;
            border-radius: 1rem;
            box-shadow: var(--shadow-lg);
        }}

        .header h1 {{
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }}

        .header p {{
            font-size: 1.1rem;
            opacity: 0.9;
        }}

        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
        }}

        .stat-card {{
            background: var(--card-background);
            padding: 1.5rem;
            border-radius: 0.75rem;
            box-shadow: var(--shadow);
            text-align: center;
            border: 1px solid var(--border-color);
        }}

        .stat-number {{
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-color);
            display: block;
        }}

        .stat-label {{
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 0.25rem;
        }}

        .blog-grid {{
            display: grid;
            gap: 2rem;
        }}

        .blog-card {{
            background: var(--card-background);
            border-radius: 1rem;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            overflow: hidden;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }}

        .blog-card:hover {{
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }}

        .blog-header {{
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
        }}

        .blog-title {{
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: color 0.2s ease;
        }}

        .blog-title:hover {{
            color: var(--primary-color);
        }}

        .blog-description {{
            color: var(--text-secondary);
            margin-bottom: 1rem;
        }}

        .blog-meta {{
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }}

        .meta-item {{
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }}

        .blog-tags {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }}

        .tag {{
            background: var(--primary-color);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }}

        .tag.style {{
            background: var(--accent-color);
        }}

        .tag.audience {{
            background: var(--secondary-color);
        }}

        .blog-content {{
            padding: 1.5rem;
            display: none;
            border-top: 1px solid var(--border-color);
            background: #fafbfc;
        }}

        .blog-content.expanded {{
            display: block;
        }}

        .blog-content h1, .blog-content h2, .blog-content h3 {{
            color: var(--text-primary);
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }}

        .blog-content h1 {{
            font-size: 1.75rem;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 0.5rem;
        }}

        .blog-content h2 {{
            font-size: 1.5rem;
        }}

        .blog-content h3 {{
            font-size: 1.25rem;
        }}

        .blog-content p {{
            margin-bottom: 1rem;
        }}

        .blog-content ul, .blog-content ol {{
            margin-left: 1.5rem;
            margin-bottom: 1rem;
        }}

        .blog-content li {{
            margin-bottom: 0.25rem;
        }}

        .blog-content code {{
            background: #f1f5f9;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
        }}

        .blog-content pre {{
            background: #1e293b;
            color: #f8fafc;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
        }}

        .blog-content pre code {{
            background: none;
            padding: 0;
            color: inherit;
        }}

        .blog-content img {{
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1rem 0;
            box-shadow: var(--shadow);
        }}

        .blog-content blockquote {{
            border-left: 4px solid var(--primary-color);
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: var(--text-secondary);
        }}

        .expand-btn {{
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s ease;
            margin-top: 1rem;
        }}

        .expand-btn:hover {{
            background: #1d4ed8;
        }}

        .footer {{
            text-align: center;
            margin-top: 3rem;
            padding: 2rem;
            color: var(--text-secondary);
            border-top: 1px solid var(--border-color);
        }}

        @media (max-width: 768px) {{
            .container {{
                padding: 1rem;
            }}

            .header h1 {{
                font-size: 2rem;
            }}

            .stats {{
                grid-template-columns: repeat(2, 1fr);
            }}

            .blog-meta {{
                flex-direction: column;
                gap: 0.5rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI-Generated Blog Collection</h1>
            <p>Comprehensive blog posts generated from repository analysis using advanced AI research agents</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <span class="stat-number">{len(blog_results)}</span>
                <div class="stat-label">Blog Posts</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">{total_words:,}</span>
                <div class="stat-label">Total Words</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">{total_images}</span>
                <div class="stat-label">Images Generated</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">{avg_confidence:.0%}</span>
                <div class="stat-label">Avg Confidence</div>
            </div>
        </div>

        <div class="blog-grid">'''

        # Add each blog post
        for i, result in enumerate(sorted_results):
            topic = result.topic
            content = result.content
            sources = result.sources
            confidence = result.confidence
            word_count = result.word_count

            # Clean the content for HTML (remove frontmatter)
            content_lines = content.split('\n')
            if content_lines[0].strip() == '---':
                # Find the end of frontmatter
                end_idx = 1
                for j, line in enumerate(content_lines[1:], 1):
                    if line.strip() == '---':
                        end_idx = j + 1
                        break
                content = '\n'.join(content_lines[end_idx:])

            html_content += f'''
            <div class="blog-card">
                <div class="blog-header">
                    <h2 class="blog-title" onclick="toggleBlog({i})">{topic.topic_name}</h2>
                    <p class="blog-description">{topic.description}</p>

                    <div class="blog-meta">
                        <div class="meta-item">
                            <span>📖</span>
                            <span>{topic.estimated_read_time}</span>
                        </div>
                        <div class="meta-item">
                            <span>📝</span>
                            <span>{word_count:,} words</span>
                        </div>
                        <div class="meta-item">
                            <span>📊</span>
                            <span>{confidence:.0%} confidence</span>
                        </div>
                        <div class="meta-item">
                            <span>📁</span>
                            <span>{len(sources)} sources</span>
                        </div>
                    </div>

                    <div class="blog-tags">
                        <span class="tag style">{topic.blog_style.title()}</span>
                        <span class="tag audience">{topic.target_audience.title()}</span>
                    </div>

                    <button class="expand-btn" onclick="toggleBlog({i})">Read Full Post</button>
                </div>

                <div class="blog-content" id="blog-{i}">
                    <div id="blog-content-{i}"></div>
                </div>
            </div>'''

        html_content += f'''
        </div>

        <div class="footer">
            <p><strong>Generated:</strong> {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Styles:</strong> {', '.join(f'{style.title()} ({count})' for style, count in style_groups.items())}</p>
            <p><strong>Audiences:</strong> {', '.join(f'{audience.title()} ({count})' for audience, count in audience_groups.items())}</p>
            <p><em>This collection was automatically generated using AI analysis of the repository. All content is based on actual codebase analysis.</em></p>
        </div>
    </div>

    <script>
        // Store blog content
        const blogContents = ['''

        # Add blog content as JavaScript data
        for i, result in enumerate(sorted_results):
            content = result.content
            # Clean the content for HTML (remove frontmatter)
            content_lines = content.split('\n')
            if content_lines[0].strip() == '---':
                # Find the end of frontmatter
                end_idx = 1
                for j, line in enumerate(content_lines[1:], 1):
                    if line.strip() == '---':
                        end_idx = j + 1
                        break
                content = '\n'.join(content_lines[end_idx:])

            # Escape content for JavaScript
            escaped_content = content.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
            html_content += f'`{escaped_content}`'
            if i < len(sorted_results) - 1:
                html_content += ','

        html_content += '''];

        function toggleBlog(index) {
            const blogContent = document.getElementById(`blog-${{index}}`);
            const contentDiv = document.getElementById(`blog-content-${{index}}`);

            if (blogContent.classList.contains('expanded')) {
                blogContent.classList.remove('expanded');
            } else {
                // Close all other blogs
                document.querySelectorAll('.blog-content').forEach(content => {
                    content.classList.remove('expanded');
                });

                // Render markdown if not already rendered
                if (!contentDiv.innerHTML.trim()) {
                    const htmlContent = marked.parse(blogContents[index]);
                    contentDiv.innerHTML = DOMPurify.sanitize(htmlContent);
                }

                blogContent.classList.add('expanded');

                // Scroll to the blog post
                blogContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Initialize marked options
        marked.setOptions({
            highlight: function(code, lang) {
                return code; // Simple highlighting, could be enhanced with highlight.js
            },
            breaks: true,
            gfm: true
        });
    </script>
</body>
</html>'''

        return html_content

class BlogResearchAgent(processor.Processor):
    """Main orchestrator for the blog research pipeline"""

    def __init__(self, api_key: str, repo_input: str, num_topics: int = 5, use_rag: bool = True, technical_mode: bool = False, use_images: bool = True, max_images: int = 3):
        self.api_key = api_key
        self.repo_input = repo_input
        self.num_topics = num_topics
        self.use_rag = use_rag
        self.technical_mode = technical_mode
        self.use_images = use_images
        self.max_images = max_images

        # Initialize components
        self.file_analyzer = FileTreeAnalyzer(api_key)
        self.topic_generator = BlogTopicGenerator(api_key, num_topics, technical_mode)
        self.content_synthesizer = BlogContentSynthesizer(api_key)

        # Initialize image generator if available and enabled
        if self.use_images:
            self.image_generator = BlogImageGenerator(api_key, max_images)
            if self.image_generator.client is None:
                logger.warning("Image generation not available, proceeding without images")
                self.use_images = False
        else:
            self.image_generator = None

        # RAG will be initialized later with the actual repo path
        self.rag = None

    async def call(self, content: AsyncIterable[content_api.ProcessorPart]) -> AsyncIterable[content_api.ProcessorPart]:
        """Execute the complete blog research pipeline"""

        # Stage 1: Analyze repository and generate topics
        analysis_pipeline = self.file_analyzer + self.topic_generator
        topic_stream = analysis_pipeline(content)

        # Stage 2: Collect topics and initialize RAG with actual repo path
        topics = []
        repo_path_for_rag = None

        # We need to manually iterate through the pipeline to capture both topics and repo info
        async for part in topic_stream:
            if part.mimetype == "application/json; type=BlogTopic":
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
                logger.debug(f"Collected blog topic: {topic_name}")
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
                "No blog topics generated. Cannot proceed with research.",
                substream_name="error"
            )
            yield error_part
            return

        logger.info(f"Starting parallel research on {len(topics)} blog topics")

        # Stage 3: Parallel research using genai-processors parallel execution
        researchers = [BlogTopicResearcher(self.api_key, self.rag) for _ in range(len(topics))]

        # Convert topics to individual streams
        topic_streams = [streams.stream_content([topic]) for topic in topics]

        # Process topics in parallel
        research_streams = [
            researcher.to_processor()(topic_stream)
            for researcher, topic_stream in zip(researchers, topic_streams)
        ]

        # Merge all research results
        merged_research = streams.merge(research_streams)

        # Stage 4: Generate images for blog posts (if enabled)
        if self.use_images and self.image_generator is not None:
            logger.info("Enhancing blog posts with generated images")
            # Process each blog result through image generation
            enhanced_research = self.image_generator.to_processor()(merged_research)
        else:
            logger.info("Proceeding without image generation")
            enhanced_research = merged_research

        # Stage 5: Synthesize individual blog posts
        async for part in self.content_synthesizer(enhanced_research):
            yield part

# Convenience function for easy usage
async def generate_blog_posts_for_repository(repo_path: str, api_key: str, num_topics: int = 5, use_rag: bool = True, technical_mode: bool = False, use_images: bool = True, max_images: int = 3) -> List[Dict[str, Any]]:
    """
    Generate blog posts for a repository

    Args:
        repo_path: Path to the repository
        api_key: Google API key for Gemini
        num_topics: Number of blog topics to generate
        use_rag: Whether to use RAG for enhanced research
        technical_mode: Whether to generate technical deep-dive posts
        use_images: Whether to generate images for blog posts
        max_images: Maximum number of images per blog post

    Returns:
        List of blog posts with metadata
    """

    # Create the research agent
    agent = BlogResearchAgent(api_key, repo_path, num_topics, use_rag, technical_mode, use_images, max_images)

    # Create input stream with repository path
    input_stream = streams.stream_content([repo_path])

    # Execute the pipeline and collect results
    blog_posts = []
    async for part in agent(input_stream):
        if part.mimetype == "text/markdown":
            metadata = part.metadata or {}
            blog_post = {
                "content": part.text,
                "title": metadata.get("title", "Untitled"),
                "filename": metadata.get("filename", "untitled.md"),
                "target_audience": metadata.get("target_audience", "developers"),
                "blog_style": metadata.get("blog_style", "overview"),
                "estimated_read_time": metadata.get("estimated_read_time", "5-10 min"),
                "word_count": metadata.get("word_count", 0),
                "confidence": metadata.get("confidence", 0.0),
                "sources": metadata.get("sources", []),
                "images": metadata.get("images", []),
                "is_index": metadata.get("is_index", False)
            }
            blog_posts.append(blog_post)
            logger.info(f"Generated blog post: {blog_post['title']}")
        elif part.mimetype == "text/html":
            metadata = part.metadata or {}
            blog_post = {
                "content": part.text,
                "title": metadata.get("title", "Blog Viewer"),
                "filename": metadata.get("filename", "blog.html"),
                "target_audience": "all",
                "blog_style": "viewer",
                "estimated_read_time": "varies",
                "word_count": 0,
                "confidence": 1.0,
                "sources": [],
                "images": [],
                "is_index": metadata.get("is_index", True)
            }
            blog_posts.append(blog_post)
            logger.info(f"Generated HTML viewer: {blog_post['title']}")
        elif part.substream_name == "status":
            logger.info(f"Status: {part.text}")
        elif part.substream_name == "error":
            logger.error(f"Error: {part.text}")

    return blog_posts

def validate_requirements():
    """Validate that all required dependencies are available"""
    missing_deps = []

    # Check for genai-processors
    try:
        import genai_processors  # noqa: F401
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

async def run_with_progress_tracking(agent_func, *args, **kwargs):
    """Run the agent with progress tracking"""
    start_time = time.time()

    try:
        result = await agent_func(*args, **kwargs)
        end_time = time.time()
        duration = end_time - start_time

        print(f"\n✅ Blog generation completed successfully in {duration:.1f} seconds")
        return result

    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time

        print(f"\n❌ Blog generation failed after {duration:.1f} seconds")
        print(f"Error: {e}")
        raise

def save_blog_posts_to_directory(blog_posts: List[Dict[str, Any]], output_dir: str):
    """Save blog posts to individual files in a directory"""
    import os

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Create images subdirectory
    images_dir = os.path.join(output_dir, 'images')
    os.makedirs(images_dir, exist_ok=True)

    saved_files = []
    for post in blog_posts:
        filename = post['filename']
        filepath = os.path.join(output_dir, filename)

        # Save images if present
        images = post.get('images', [])
        if images:
            for image in images:
                try:
                    # Get image data from ProcessorPart
                    image_filename = image['filename']
                    image_filepath = os.path.join(images_dir, image_filename)

                    # Get bytes from ProcessorPart
                    processor_part = image['processor_part']
                    image_bytes = processor_part.bytes

                    with open(image_filepath, 'wb') as img_file:
                        img_file.write(image_bytes)

                    # Update image references in content to point to images directory
                    post['content'] = post['content'].replace(
                        f"]({image_filename})",
                        f"](images/{image_filename})"
                    )

                    print(f"🖼️  Saved image: {image_filepath}")

                except Exception as e:
                    logger.error(f"Error saving image {image.get('filename', 'unknown')}: {e}")

        # Save blog post content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(post['content'])

        saved_files.append(filepath)
        image_count = len(images)
        print(f"📄 Saved: {filepath} ({post['word_count']:,} words{f', {image_count} images' if image_count > 0 else ''})")

    return saved_files

if __name__ == "__main__":
    import sys
    import argparse

    # Validate requirements first
    if not validate_requirements():
        sys.exit(1)

    # Set up argument parser
    parser = argparse.ArgumentParser(
        description="Blog Research Agent - Generate multiple topic blog posts from repository analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate blog posts with RAG and images for current directory
  python blog_research_agent.py . YOUR_API_KEY --output blog_posts/

  # Generate technical deep-dive blog posts with images
  python blog_research_agent.py . YOUR_API_KEY --technical --output tech_blogs/

  # Generate blog posts without images
  python blog_research_agent.py . YOUR_API_KEY --no-images --output blog_posts/

  # Generate blog posts with custom number of images
  python blog_research_agent.py . YOUR_API_KEY --max-images 5 --output blog_posts/

  # Quick demo without RAG
  python blog_research_agent.py /path/to/repo YOUR_API_KEY --demo --no-rag

  # Generate 8 blog topics with custom output
  python blog_research_agent.py /path/to/repo YOUR_API_KEY --topics 8 -o blog_posts/

  # Use environment variable for API key
  export GOOGLE_API_KEY="your-key"
  python blog_research_agent.py . --output blog_posts/
        """
    )

    parser.add_argument("repo_path", nargs='?', help="Path to the repository to analyze")
    parser.add_argument("api_key", nargs='?', help="Google API key for Gemini (or set GOOGLE_API_KEY env var)")
    parser.add_argument("--topics", type=int, default=5, help="Number of blog topics to generate (default: 5)")
    parser.add_argument("--no-rag", action="store_true", help="Disable RAG and use only LLM research")
    parser.add_argument("--technical", action="store_true", help="Generate technical deep-dive blog posts")
    parser.add_argument("--no-images", action="store_true", help="Disable image generation for blog posts")
    parser.add_argument("--max-images", type=int, default=3, help="Maximum number of images per blog post (default: 3)")
    parser.add_argument("--output", "-o", help="Output directory for the generated blog posts (default: stdout)")
    parser.add_argument("--demo", action="store_true", help="Run topic generation demo only")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode with detailed logging")
    parser.add_argument("--quiet", "-q", action="store_true", help="Reduce log output (WARNING level only)")

    args = parser.parse_args()

    # Get API key from argument, environment, or .env file
    api_key = args.api_key or os.getenv('GOOGLE_API_KEY')

    # Try to load from .env file if not found
    if not api_key:
        try:
            env_file = Path('.env')
            if env_file.exists():
                with open(env_file) as f:
                    for line in f:
                        if line.startswith('GOOGLE_API_KEY='):
                            api_key = line.split('=', 1)[1].strip().strip('"\'')
                            break
        except Exception:
            pass

    if not api_key:
        parser.error("API key is required. Provide it as an argument, set GOOGLE_API_KEY environment variable, or add it to .env file")

    # Validate required arguments
    if not args.repo_path:
        parser.error("repo_path is required")

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

    print("📝 Blog Research Agent")
    print("=" * 50)
    print(f"Repository: {args.repo_path}")
    print(f"Topics: {args.topics}")
    print(f"Mode: {'Technical Deep-dive' if args.technical else 'General Audience'}")
    print(f"RAG enabled: {not args.no_rag}")
    print(f"Images enabled: {not args.no_images}")
    if not args.no_images:
        print(f"Max images per post: {args.max_images}")
    print(f"Output: {args.output or 'stdout'}")
    print("=" * 50)

    if args.demo:
        # Run the topic generation demo
        print("\n📋 Running blog topic generation demo...")
        try:
            # Create a simple demo using just the topic generator
            file_analyzer = FileTreeAnalyzer(api_key)
            topic_generator = BlogTopicGenerator(api_key, args.topics, args.technical)

            # Chain the processors
            demo_pipeline = file_analyzer + topic_generator

            # Create input stream
            input_stream = streams.stream_content([args.repo_path])

            # Process and collect results
            topics = []
            async def run_demo():
                async for part in demo_pipeline(input_stream):
                    if part.mimetype == "application/json; type=BlogTopic":
                        topic_data = json.loads(part.text)
                        topic = BlogTopic(**topic_data)
                        topics.append(topic)
                        print(f"Generated blog topic: {topic.topic_name}")
                    elif part.substream_name == "status":
                        print(f"Status: {part.text}")
                return topics

            topics = asyncio.run(run_demo())

            print(f"\n✅ Generated {len(topics)} blog topics:")
            for i, topic in enumerate(topics, 1):
                print(f"\n{i}. {topic.topic_name}")
                print(f"   📝 Description: {topic.description}")
                print(f"   👥 Audience: {topic.target_audience}")
                print(f"   📖 Style: {topic.blog_style}")
                print(f"   ⏱️  Read Time: {topic.estimated_read_time}")
                print(f"   ❓ Questions: {', '.join(topic.research_questions)}")
                print(f"   🎯 Priority: {topic.priority}")
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            if args.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)
    else:
        # Run the complete blog generation pipeline
        print("\n🔬 Starting blog generation pipeline...")

        try:
            # Generate the blog posts with progress tracking
            blog_posts = asyncio.run(run_with_progress_tracking(
                generate_blog_posts_for_repository,
                repo_path=args.repo_path,
                api_key=api_key,
                num_topics=args.topics,
                use_rag=not args.no_rag,
                technical_mode=args.technical,
                use_images=not args.no_images,
                max_images=args.max_images
            ))

            if blog_posts:
                if args.output:
                    # Save to directory
                    saved_files = save_blog_posts_to_directory(blog_posts, args.output)
                    print(f"\n📚 Generated {len(blog_posts)} blog posts in: {args.output}")

                    # Print summary
                    total_words = sum(post['word_count'] for post in blog_posts)
                    total_images = sum(len(post.get('images', [])) for post in blog_posts)
                    avg_confidence = sum(post['confidence'] for post in blog_posts) / len(blog_posts) if blog_posts else 0

                    print(f"📊 Total word count: {total_words:,} words")
                    if total_images > 0:
                        print(f"🖼️  Total images generated: {total_images}")
                    print(f"📈 Average confidence: {avg_confidence:.1%}")

                    # Show index file
                    index_file = next((f for f in saved_files if f.endswith('README.md')), None)
                    if index_file:
                        print(f"📋 Index file: {index_file}")
                else:
                    # Print to stdout
                    print("\n" + "="*80)
                    print("📚 GENERATED BLOG POSTS")
                    print("="*80)
                    for i, post in enumerate(blog_posts, 1):
                        print(f"\n--- Blog Post {i}: {post['title']} ---")
                        print(post['content'])
                        print("-" * 80)
            else:
                print("❌ Error: No blog posts were generated.")
                sys.exit(1)

        except KeyboardInterrupt:
            print("\n⏹️  Operation cancelled by user.")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error generating blog posts: {e}")
            if args.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)
