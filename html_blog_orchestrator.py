#!/usr/bin/env python3
"""
HTML Blog Orchestrator - A sophisticated processor for synthesizing beautiful HTML blogs

This orchestrator uses genai-processors to create aesthetically pleasing, fully-rendered
HTML blog collections from markdown content. It leverages AI to enhance content structure,
generate beautiful HTML, and create a cohesive reading experience.

Key Features:
- AI-powered content enhancement and HTML generation
- Vercel-style dark theme with modern typography
- Immediate content rendering (no client-side markdown)
- Image optimization and proper semantic HTML
- Responsive design with accessibility features
- Syntax highlighting and interactive elements

Usage:
    from html_blog_orchestrator import HTMLBlogOrchestrator
    
    orchestrator = HTMLBlogOrchestrator(api_key=api_key)
    async for html_part in orchestrator(blog_content_stream):
        # Process the enhanced HTML blog
"""

import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass
import time
import re

try:
    from genai_processors import content_api
    from genai_processors.content_api import ProcessorPart
except ImportError:
    print("Warning: genai-processors not found. Install with: pip install genai-processors")
    content_api = None
    ProcessorPart = None

@dataclass
class BlogMetadata:
    """Metadata for a blog post"""
    title: str
    description: str
    target_audience: str
    blog_style: str
    estimated_read_time: str
    word_count: int
    confidence: float
    sources: List[str]
    images: List[Dict[str, Any]]
    filename: str

class ContentEnhancementProcessor:
    """Processor to enhance blog content for better readability and structure"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        
    async def __call__(self, content_stream):
        """Enhance blog content using AI"""
        blog_posts = []
        
        # Collect all blog posts first
        async for part in content_stream:
            if part.mimetype == "text/markdown" and not part.metadata.get("is_index", False):
                blog_posts.append(part)
            else:
                yield part  # Pass through non-blog content
        
        # Enhance each blog post
        for part in blog_posts:
            try:
                enhanced_content = await self._enhance_content(part.text, part.metadata)
                
                enhanced_part = ProcessorPart(
                    enhanced_content,
                    mimetype="text/markdown",
                    metadata={**part.metadata, "enhanced": True}
                )
                yield enhanced_part
                
            except Exception as e:
                print(f"Warning: Failed to enhance content: {e}")
                yield part  # Return original if enhancement fails

    async def _enhance_content(self, content: str, metadata: Dict[str, Any]) -> str:
        """Use AI to enhance content structure and readability"""
        try:
            from google import genai
            
            client = genai.Client(api_key=self.api_key)
            
            title = metadata.get("title", "Blog Post")
            blog_style = metadata.get("blog_style", "overview")
            target_audience = metadata.get("target_audience", "developers")
            
            enhancement_prompt = f"""
            Enhance this {blog_style} blog post for {target_audience}. Improve structure, readability, and visual appeal:

            REQUIREMENTS:
            1. **Structure**: Add clear section headers, logical flow, proper hierarchy
            2. **Readability**: Break long paragraphs, add bullet points, improve transitions
            3. **Visual Elements**: Add callouts, tips, warnings where appropriate
            4. **Code Quality**: Ensure code blocks have proper language tags and context
            5. **Engagement**: Add compelling introductions and conclusions
            6. **Typography**: Use **bold** and *italic* for emphasis strategically

            KEEP:
            - All existing content and meaning
            - All image references exactly as they are
            - All code examples and technical details
            - The original tone and style

            ENHANCE:
            - Structure and organization
            - Visual hierarchy with headers
            - Readability and flow
            - Technical clarity

            Title: {title}
            Style: {blog_style}
            Audience: {target_audience}

            Original Content:
            {content}

            Return ONLY the enhanced markdown content, no explanations.
            """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=enhancement_prompt
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Warning: Content enhancement failed: {e}")
            return content

class HTMLSynthesisProcessor:
    """Processor to synthesize beautiful HTML from enhanced markdown"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        
    async def __call__(self, content_stream):
        """Convert enhanced markdown to beautiful HTML"""
        blog_posts = []
        
        # Collect enhanced blog posts
        async for part in content_stream:
            if part.mimetype == "text/markdown" and part.metadata.get("enhanced", False):
                blog_posts.append(part)
            else:
                yield part  # Pass through other content
        
        # Convert to HTML and create final blog
        html_posts = []
        for part in blog_posts:
            try:
                html_content = await self._convert_to_html(part.text, part.metadata)
                html_posts.append({
                    "html": html_content,
                    "metadata": part.metadata
                })
            except Exception as e:
                print(f"Warning: Failed to convert to HTML: {e}")
                # Fallback to basic conversion
                html_content = self._basic_html_conversion(part.text, part.metadata)
                html_posts.append({
                    "html": html_content,
                    "metadata": part.metadata
                })
        
        # Generate complete blog HTML
        complete_blog_html = await self._synthesize_complete_blog(html_posts)
        
        blog_part = ProcessorPart(
            complete_blog_html,
            mimetype="text/html",
            metadata={
                "title": "AI Research Blog Collection",
                "filename": "blog.html",
                "is_index": True,
                "post_count": len(html_posts)
            }
        )
        yield blog_part

    async def _convert_to_html(self, content: str, metadata: Dict[str, Any]) -> str:
        """Convert markdown to semantic HTML using AI"""
        try:
            from google import genai
            
            client = genai.Client(api_key=self.api_key)
            
            title = metadata.get("title", "Blog Post")
            description = metadata.get("description", "")
            
            html_prompt = f"""
            Convert this enhanced markdown blog post to beautiful, semantic HTML.

            REQUIREMENTS:
            1. **Clean HTML**: Return ONLY HTML content, no markdown wrappers, no explanations
            2. **Semantic Structure**: Use proper HTML5 tags (article, section, header, h1-h6, p, ul, ol, li)
            3. **Code Blocks**: Convert to <pre><code class="language-X"> with proper language classes
            4. **Images**: Convert to <img src="..." alt="..." class="post-image">
            5. **Typography**: Convert **bold** to <strong>, *italic* to <em>
            6. **Lists**: Convert markdown lists to proper HTML lists
            7. **Blockquotes**: Convert to <blockquote class="enhanced-quote">
            8. **CSS Classes**: Add classes for styling (.section-header, .highlight, .tip, .warning)

            Title: {title}
            Description: {description}

            Markdown Content:
            {content}

            Return clean HTML starting with <article class="blog-post"> and ending with </article>.
            Do NOT include markdown code blocks or explanatory text.
            """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=html_prompt
            )
            
            html_content = response.text.strip()
            
            # Clean up any markdown artifacts
            html_content = self._clean_html_response(html_content)
            
            return html_content
            
        except Exception as e:
            print(f"Warning: HTML conversion failed: {e}")
            return self._basic_html_conversion(content, metadata)

    def _clean_html_response(self, html_content: str) -> str:
        """Clean up AI-generated HTML response"""
        # Remove markdown code block wrappers
        if html_content.startswith('```html'):
            html_content = html_content[7:]
        if html_content.startswith('```'):
            html_content = html_content[3:]
        if html_content.endswith('```'):
            html_content = html_content[:-3]
        
        # Remove any remaining markdown artifacts
        html_content = html_content.strip()
        
        # Ensure it starts with an article tag
        if not html_content.startswith('<article'):
            html_content = f'<article class="blog-post">\n{html_content}\n</article>'
        
        return html_content

    def _basic_html_conversion(self, content: str, metadata: Dict[str, Any]) -> str:
        """Basic fallback HTML conversion"""
        title = metadata.get("title", "Blog Post")
        description = metadata.get("description", "")
        
        # Simple markdown to HTML conversion
        html_content = content
        
        # Convert headers
        html_content = re.sub(r'^# (.+)$', r'<h1 class="section-header">\1</h1>', html_content, flags=re.MULTILINE)
        html_content = re.sub(r'^## (.+)$', r'<h2 class="section-header">\1</h2>', html_content, flags=re.MULTILINE)
        html_content = re.sub(r'^### (.+)$', r'<h3 class="section-header">\1</h3>', html_content, flags=re.MULTILINE)
        
        # Convert bold and italic
        html_content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html_content)
        html_content = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html_content)
        
        # Convert paragraphs
        paragraphs = html_content.split('\n\n')
        html_paragraphs = []
        for p in paragraphs:
            p = p.strip()
            if p and not p.startswith('<'):
                html_paragraphs.append(f'<p>{p}</p>')
            elif p:
                html_paragraphs.append(p)
        
        return f'''
        <article class="blog-post">
            <header class="post-header">
                <h1 class="post-title">{title}</h1>
                <p class="post-description">{description}</p>
            </header>
            <div class="post-content">
                {''.join(html_paragraphs)}
            </div>
        </article>
        '''

    async def _synthesize_complete_blog(self, html_posts: List[Dict[str, Any]]) -> str:
        """Synthesize complete blog HTML with all posts"""
        
        # Calculate statistics
        total_words = sum(post["metadata"].get("word_count", 0) for post in html_posts)
        total_images = sum(len(post["metadata"].get("images", [])) for post in html_posts)
        avg_confidence = sum(post["metadata"].get("confidence", 0) for post in html_posts) / len(html_posts) if html_posts else 0
        
        # Generate CSS and JavaScript
        css = self._generate_vercel_css()
        js = self._generate_enhanced_js()
        
        # Generate posts HTML
        posts_html = "\n".join(post["html"] for post in html_posts)
        
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Research Blog Collection</title>
    <meta name="description" content="AI-generated blog posts from repository analysis">
    <meta name="author" content="AI Research Agent">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Syntax highlighting -->
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    
    <style>{css}</style>
</head>
<body>
    <div class="container">
        <main class="main-content">
            {posts_html}
        </main>
    </div>
    
    <script>{js}</script>
</body>
</html>'''

    def _generate_vercel_css(self) -> str:
        """Generate Vercel-inspired dark theme CSS"""
        return """
        :root {
            --bg-primary: #000000;
            --bg-secondary: #111111;
            --bg-tertiary: #1a1a1a;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --text-tertiary: #71717a;
            --accent: #0070f3;
            --accent-hover: #0060df;
            --border: #333333;
            --border-light: #262626;
            --code-bg: #1e1e1e;
            --success: #00d9ff;
            --warning: #f5a623;
            --error: #ff0080;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 24px;
        }

        .main-content {
            /* Clean, minimal layout */
        }

        .blog-post {
            margin-bottom: 120px;
            padding-bottom: 80px;
            border-bottom: 1px solid var(--border);
            transition: transform 0.2s ease;
        }

        .blog-post:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .blog-post:hover {
            transform: translateY(-2px);
        }

        .post-header {
            margin-bottom: 48px;
        }

        .post-title {
            font-size: 42px;
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 16px;
            color: var(--text-primary);
            background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .post-description {
            font-size: 20px;
            color: var(--text-secondary);
            line-height: 1.5;
            margin-bottom: 32px;
            max-width: 800px;
        }

        .post-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            font-size: 14px;
            color: var(--text-tertiary);
            margin-bottom: 24px;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .post-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .tag {
            padding: 6px 16px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 20px;
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }

        .tag.style {
            background: var(--accent);
            color: var(--bg-primary);
            border-color: var(--accent);
        }

        .post-content {
            font-size: 18px;
            line-height: 1.7;
            color: var(--text-primary);
        }

        .post-content h1,
        .post-content h2,
        .post-content h3,
        .post-content h4,
        .post-content h5,
        .post-content h6,
        .section-header {
            margin: 48px 0 24px;
            font-weight: 600;
            line-height: 1.2;
            color: var(--text-primary);
        }

        .post-content h1, .section-header h1 { font-size: 36px; }
        .post-content h2, .section-header h2 { font-size: 32px; }
        .post-content h3, .section-header h3 { font-size: 28px; }
        .post-content h4, .section-header h4 { font-size: 24px; }

        .post-content p {
            margin-bottom: 24px;
        }

        .post-content ul,
        .post-content ol {
            margin: 24px 0;
            padding-left: 32px;
        }

        .post-content li {
            margin-bottom: 12px;
            line-height: 1.6;
        }

        .post-content li::marker {
            color: var(--accent);
        }

        .enhanced-quote,
        .post-content blockquote {
            margin: 32px 0;
            padding: 24px 32px;
            background: var(--bg-secondary);
            border-left: 4px solid var(--accent);
            border-radius: 0 12px 12px 0;
            font-style: italic;
            color: var(--text-secondary);
            position: relative;
        }

        .enhanced-quote::before,
        .post-content blockquote::before {
            content: '"';
            font-size: 64px;
            color: var(--accent);
            position: absolute;
            top: -8px;
            left: 20px;
            opacity: 0.3;
            font-family: serif;
        }

        .post-content code {
            font-family: 'JetBrains Mono', 'Monaco', 'Menlo', monospace;
            font-size: 15px;
            background: var(--code-bg);
            padding: 4px 8px;
            border-radius: 6px;
            color: var(--success);
            border: 1px solid var(--border-light);
        }

        .post-content pre {
            margin: 32px 0;
            padding: 24px;
            background: var(--code-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
        }

        .post-content pre code {
            background: none;
            padding: 0;
            color: inherit;
            border: none;
        }

        .copy-button {
            position: absolute;
            top: 16px;
            right: 16px;
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
        }

        .copy-button:hover {
            background: var(--accent);
            color: var(--bg-primary);
            border-color: var(--accent);
        }

        .post-image,
        .post-content img {
            max-width: 100%;
            height: auto;
            border-radius: 16px;
            margin: 40px 0;
            border: 1px solid var(--border);
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .post-image:hover,
        .post-content img:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 64px rgba(0, 0, 0, 0.5);
        }

        .post-content a {
            color: var(--accent);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }

        .post-content a:hover {
            border-bottom-color: var(--accent);
        }

        .tip, .warning, .note, .highlight {
            margin: 32px 0;
            padding: 20px 24px;
            border-radius: 12px;
            border-left: 4px solid;
        }

        .tip {
            background: rgba(0, 217, 255, 0.1);
            border-left-color: var(--success);
            color: var(--text-primary);
        }

        .warning {
            background: rgba(245, 166, 35, 0.1);
            border-left-color: var(--warning);
            color: var(--text-primary);
        }

        .note {
            background: rgba(0, 112, 243, 0.1);
            border-left-color: var(--accent);
            color: var(--text-primary);
        }

        .highlight {
            background: var(--bg-secondary);
            border-left-color: var(--accent);
            color: var(--text-primary);
        }

        @media (max-width: 768px) {
            .container {
                padding: 24px 16px;
            }

            .post-title {
                font-size: 32px;
            }

            .post-description {
                font-size: 18px;
            }

            .post-content {
                font-size: 16px;
            }

            .post-meta {
                flex-direction: column;
                gap: 12px;
            }

            .blog-post {
                margin-bottom: 80px;
                padding-bottom: 60px;
            }
        }
        """

    def _generate_enhanced_js(self) -> str:
        """Generate enhanced JavaScript for interactivity"""
        return """
        document.addEventListener('DOMContentLoaded', function() {

            // Apply syntax highlighting
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }

            // Enhanced image loading
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.4s ease';

                img.addEventListener('error', function() {
                    this.style.display = 'none';
                    console.warn('Failed to load image:', this.src);
                });

                img.addEventListener('load', function() {
                    this.style.opacity = '1';
                });

                if (img.complete) {
                    img.style.opacity = '1';
                }
            });

            // Add copy functionality to code blocks
            document.querySelectorAll('pre code').forEach(block => {
                const pre = block.parentNode;
                if (!pre.querySelector('.copy-button')) {
                    const button = document.createElement('button');
                    button.className = 'copy-button';
                    button.textContent = 'Copy';

                    button.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(block.textContent);
                            button.textContent = 'Copied!';
                            setTimeout(() => button.textContent = 'Copy', 2000);
                        } catch (err) {
                            // Fallback for older browsers
                            const textArea = document.createElement('textarea');
                            textArea.value = block.textContent;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            button.textContent = 'Copied!';
                            setTimeout(() => button.textContent = 'Copy', 2000);
                        }
                    });

                    pre.appendChild(button);
                }
            });

            // Smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Add reading progress indicator
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 2px;
                background: var(--accent);
                z-index: 1000;
                transition: width 0.1s ease;
            `;
            document.body.appendChild(progressBar);

            window.addEventListener('scroll', () => {
                const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                progressBar.style.width = scrolled + '%';
            });
        });
        """


class HTMLBlogOrchestrator:
    """Main orchestrator for creating beautiful HTML blogs"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.content_enhancer = ContentEnhancementProcessor(api_key)
        self.html_synthesizer = HTMLSynthesisProcessor(api_key)

    async def __call__(self, content_stream):
        """Orchestrate the complete blog generation pipeline"""

        # Step 1: Enhance content
        enhanced_stream = self.content_enhancer(content_stream)

        # Step 2: Synthesize HTML
        html_stream = self.html_synthesizer(enhanced_stream)

        # Yield the final HTML blog
        async for part in html_stream:
            yield part
