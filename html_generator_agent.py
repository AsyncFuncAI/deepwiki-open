#!/usr/bin/env python3
"""
HTML Generator Agent - A robust agent for generating beautiful, minimalistic blog HTML

This agent creates Vercel-style dark theme blog viewers with immediate content rendering.
Focuses on readability, performance, and modern web design principles.

Key Features:
- Minimalistic dark theme inspired by Vercel blogs
- Immediate content rendering (no click-to-expand)
- Responsive design with excellent typography
- Syntax highlighting for code blocks
- Image optimization and lazy loading
- SEO-friendly structure
- Performance optimized

Usage:
    from html_generator_agent import HTMLGeneratorAgent
    
    agent = HTMLGeneratorAgent()
    html_content = await agent.generate_blog_html(blog_results)
"""

import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

# Content enhancement functionality

@dataclass
class BlogPost:
    """Represents a blog post with all metadata"""
    title: str
    content: str
    description: str
    target_audience: str
    blog_style: str
    estimated_read_time: str
    word_count: int
    confidence: float
    sources: List[str]
    images: List[Dict[str, Any]]
    filename: str
    slug: str

class ContentEnhancementProcessor:
    """Processor to enhance blog content for better readability and aesthetics"""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def _convert_to_html(self, content: str, title: str, description: str) -> str:
        """Use AI to convert markdown content directly to beautiful HTML"""
        try:
            from google import genai

            client = genai.Client(api_key=self.api_key)

            html_conversion_prompt = f"""
            Convert this markdown blog post content into clean, semantic HTML.

            IMPORTANT: Return ONLY clean HTML content - no markdown code blocks, no ```html wrappers, no explanations.

            Requirements:
            1. Use semantic HTML5 tags: <article>, <section>, <header>, <h1>-<h6>, <p>, <ul>, <ol>, <li>
            2. Convert markdown headers (# ## ###) to proper HTML headers (<h1> <h2> <h3>)
            3. Convert markdown lists to HTML lists (<ul><li> or <ol><li>)
            4. Convert **bold** to <strong> and *italic* to <em>
            5. Convert code blocks to <pre><code class="language-X"> with proper language classes
            6. Convert blockquotes to <blockquote class="enhanced-quote">
            7. Convert image references to <img src="..." alt="..." class="post-image">
            8. Wrap paragraphs in <p> tags
            9. Add CSS classes for styling: .section-header, .highlight, .tip, .warning, .note

            Title: {title}
            Description: {description}

            Markdown Content:
            {content}

            Return the HTML starting with <article class="blog-post"> and ending with </article>.
            Do NOT wrap in markdown code blocks or add any explanatory text.
            """

            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=html_conversion_prompt
            )

            # Clean up the response to remove any markdown artifacts
            html_content = response.text.strip()

            # Remove markdown code block wrappers if they exist
            if html_content.startswith('```html'):
                html_content = html_content[7:]  # Remove ```html
            if html_content.startswith('```'):
                html_content = html_content[3:]   # Remove ```
            if html_content.endswith('```'):
                html_content = html_content[:-3]  # Remove trailing ```

            # Clean up any remaining artifacts
            html_content = html_content.strip()

            return html_content

        except Exception as e:
            print(f"Warning: HTML conversion failed: {e}")
            # Fallback to basic HTML conversion
            return self._basic_markdown_to_html(content, title, description)

    def _basic_markdown_to_html(self, content: str, title: str, description: str) -> str:
        """Basic fallback markdown to HTML conversion"""
        # Simple markdown to HTML conversion as fallback
        html_content = content

        # Convert headers
        html_content = html_content.replace('# ', '<h1>').replace('\n', '</h1>\n', 1)
        html_content = html_content.replace('## ', '<h2>').replace('\n', '</h2>\n')
        html_content = html_content.replace('### ', '<h3>').replace('\n', '</h3>\n')

        # Convert paragraphs
        paragraphs = html_content.split('\n\n')
        html_paragraphs = []
        for p in paragraphs:
            if p.strip() and not p.startswith('<'):
                html_paragraphs.append(f'<p>{p.strip()}</p>')
            else:
                html_paragraphs.append(p)

        return f"""
        <article class="blog-post">
            <header class="post-header">
                <h1 class="post-title">{title}</h1>
                <p class="post-description">{description}</p>
            </header>
            <div class="post-content">
                {''.join(html_paragraphs)}
            </div>
        </article>
        """

class HTMLGeneratorAgent:
    """Robust HTML generator for creating beautiful blog viewers"""

    def __init__(self, theme: str = "dark", style: str = "vercel", api_key: str = None):
        self.theme = theme
        self.style = style
        self.api_key = api_key
        self.content_enhancer = ContentEnhancementProcessor(api_key) if api_key else None
        
    async def generate_blog_html(self, blog_results: List[Any]) -> str:
        """Generate a complete HTML blog viewer"""

        # Convert blog results to BlogPost objects
        blog_posts = self._convert_to_blog_posts(blog_results)

        # Convert content to HTML if enhancer is available
        if self.content_enhancer:
            html_posts = []
            for post in blog_posts:
                try:
                    html_content = await self.content_enhancer._convert_to_html(
                        post.content,
                        post.title,
                        post.description
                    )
                    html_post = BlogPost(
                        title=post.title,
                        content=html_content,
                        description=post.description,
                        target_audience=post.target_audience,
                        blog_style=post.blog_style,
                        estimated_read_time=post.estimated_read_time,
                        word_count=post.word_count,
                        confidence=post.confidence,
                        sources=post.sources,
                        images=post.images,
                        filename=post.filename,
                        slug=post.slug
                    )
                    html_posts.append(html_post)
                except Exception as e:
                    print(f"Warning: Failed to convert post '{post.title}' to HTML: {e}")
                    html_posts.append(post)
            blog_posts = html_posts

        # Generate HTML structure
        html_content = self._generate_html_structure(blog_posts)

        return html_content
    
    def _convert_to_blog_posts(self, blog_results: List[Any]) -> List[BlogPost]:
        """Convert blog results to BlogPost objects"""
        posts = []
        
        for result in blog_results:
            # Extract topic information
            topic = getattr(result, 'topic', None)
            if not topic:
                continue
                
            # Create slug from title
            slug = self._create_slug(topic.topic_name)
            
            # Clean content (remove frontmatter)
            content = getattr(result, 'content', '')
            content = self._clean_content(content)
            
            post = BlogPost(
                title=topic.topic_name,
                content=content,
                description=topic.description,
                target_audience=topic.target_audience,
                blog_style=topic.blog_style,
                estimated_read_time=topic.estimated_read_time,
                word_count=getattr(result, 'word_count', 0),
                confidence=getattr(result, 'confidence', 0.0),
                sources=getattr(result, 'sources', []),
                images=getattr(result, 'images', []),
                filename=f"{slug}.md",
                slug=slug
            )
            posts.append(post)
        
        return posts
    
    def _clean_content(self, content: str) -> str:
        """Remove frontmatter and clean content"""
        lines = content.split('\n')
        if lines and lines[0].strip() == '---':
            # Find end of frontmatter
            end_idx = 1
            for i, line in enumerate(lines[1:], 1):
                if line.strip() == '---':
                    end_idx = i + 1
                    break
            content = '\n'.join(lines[end_idx:])
        return content.strip()
    
    def _create_slug(self, title: str) -> str:
        """Create URL-friendly slug"""
        import re
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')[:50]  # Limit length
    
    def _generate_html_structure(self, posts: List[BlogPost]) -> str:
        """Generate the complete HTML structure"""

        # Generate CSS
        css = self._generate_css()

        # Generate JavaScript
        js = self._generate_javascript()

        # Generate blog posts
        posts_html = self._generate_posts_html(posts)

        return f"""<!DOCTYPE html>
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

    <!-- Syntax highlighting for code blocks -->
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css">

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
</html>"""

    def _generate_css(self) -> str:
        """Generate Vercel-style dark theme CSS"""
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
            /* No additional margins needed */
        }

        .blog-post {
            margin-bottom: 80px;
            padding-bottom: 80px;
            border-bottom: 1px solid var(--border);
        }

        .blog-post:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .post-header {
            margin-bottom: 40px;
        }

        .post-title {
            font-size: 36px;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 16px;
            color: var(--text-primary);
        }

        .post-description {
            font-size: 18px;
            color: var(--text-secondary);
            margin-bottom: 24px;
            line-height: 1.5;
        }

        .post-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 14px;
            color: var(--text-tertiary);
            margin-bottom: 16px;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .post-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .tag {
            padding: 4px 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 16px;
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
            font-size: 16px;
            line-height: 1.7;
            color: var(--text-primary);
        }

        .post-content h1,
        .post-content h2,
        .post-content h3,
        .post-content h4,
        .post-content h5,
        .post-content h6 {
            margin: 40px 0 16px;
            font-weight: 600;
            line-height: 1.3;
            color: var(--text-primary);
        }

        .post-content h1 { font-size: 32px; }
        .post-content h2 { font-size: 28px; }
        .post-content h3 { font-size: 24px; }
        .post-content h4 { font-size: 20px; }

        .post-content p {
            margin-bottom: 20px;
        }

        .post-content ul,
        .post-content ol {
            margin: 20px 0;
            padding-left: 24px;
        }

        .post-content li {
            margin-bottom: 8px;
        }

        .post-content blockquote {
            margin: 24px 0;
            padding: 16px 24px;
            background: var(--bg-secondary);
            border-left: 4px solid var(--accent);
            border-radius: 0 8px 8px 0;
            font-style: italic;
            color: var(--text-secondary);
        }

        .post-content code {
            font-family: 'JetBrains Mono', 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            background: var(--code-bg);
            padding: 2px 6px;
            border-radius: 4px;
            color: var(--success);
        }

        .post-content pre {
            margin: 24px 0;
            padding: 20px;
            background: var(--code-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
        }

        .post-content pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        .post-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 24px 0;
            border: 1px solid var(--border);
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

        /* Enhanced blockquote styling */
        .enhanced-quote {
            margin: 32px 0;
            padding: 20px 24px;
            background: var(--bg-secondary);
            border-left: 4px solid var(--accent);
            border-radius: 0 8px 8px 0;
            font-style: italic;
            color: var(--text-secondary);
            position: relative;
        }

        .enhanced-quote::before {
            content: '"';
            font-size: 48px;
            color: var(--accent);
            position: absolute;
            top: -10px;
            left: 16px;
            opacity: 0.3;
        }

        /* Enhanced code block styling */
        .post-content pre {
            position: relative;
            margin: 32px 0;
            padding: 24px;
            background: var(--code-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.6;
        }

        .copy-button {
            position: absolute;
            top: 12px;
            right: 12px;
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .copy-button:hover {
            background: var(--accent);
            color: var(--bg-primary);
            border-color: var(--accent);
        }

        /* Enhanced image styling */
        .post-content img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            margin: 32px 0;
            border: 1px solid var(--border);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .post-content img:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
        }

        /* Enhanced table styling */
        .post-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 32px 0;
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow: hidden;
        }

        .post-content th,
        .post-content td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        .post-content th {
            background: var(--bg-tertiary);
            font-weight: 600;
            color: var(--text-primary);
        }

        .post-content td {
            color: var(--text-secondary);
        }

        /* Enhanced list styling */
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

        @media (max-width: 768px) {
            .container {
                padding: 0 16px;
            }

            .header {
                padding: 60px 0 40px;
                margin-bottom: 40px;
            }

            .header h1 {
                font-size: 36px;
            }

            .header p {
                font-size: 18px;
            }

            .post-title {
                font-size: 28px;
            }

            .post-description {
                font-size: 16px;
            }

            .stats {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }

            .post-meta {
                flex-direction: column;
                gap: 8px;
            }

            .blog-post {
                margin-bottom: 60px;
                padding-bottom: 60px;
            }
        }
        """

    def _generate_javascript(self) -> str:
        """Generate JavaScript for enhanced functionality"""
        return """
        // Enhanced functionality for the blog viewer
        document.addEventListener('DOMContentLoaded', function() {

            // Apply syntax highlighting to all code blocks
            Prism.highlightAll();

            // Enhanced image loading with error handling
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';

                // Add error handling
                img.addEventListener('error', function() {
                    this.style.display = 'none';
                    console.warn('Failed to load image:', this.src);
                });

                // Add load handling
                img.addEventListener('load', function() {
                    this.style.opacity = '1';
                });

                // If image is already loaded (cached)
                if (img.complete) {
                    img.style.opacity = '1';
                }
            });

            // Enhanced smooth scroll for anchor links
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

            // Add copy functionality to code blocks
            document.querySelectorAll('pre code').forEach(block => {
                const pre = block.parentNode;
                if (!pre.querySelector('.copy-button')) {
                    const button = document.createElement('button');
                    button.className = 'copy-button';
                    button.textContent = 'Copy';
                    button.addEventListener('click', () => {
                        navigator.clipboard.writeText(block.textContent).then(() => {
                            button.textContent = 'Copied!';
                            setTimeout(() => button.textContent = 'Copy', 2000);
                        }).catch(() => {
                            // Fallback for older browsers
                            const textArea = document.createElement('textarea');
                            textArea.value = block.textContent;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            button.textContent = 'Copied!';
                            setTimeout(() => button.textContent = 'Copy', 2000);
                        });
                    });
                    pre.appendChild(button);
                }
            });

            // Add hover effects for interactive elements
            document.querySelectorAll('.blog-post').forEach(post => {
                post.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                });

                post.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
        });
        """



    def _generate_posts_html(self, posts: List[BlogPost]) -> str:
        """Generate HTML for all blog posts"""
        posts_html = ""

        for post in posts:
            # If content is already HTML (from AI conversion), use it directly
            # Otherwise, wrap in basic HTML structure
            if post.content.strip().startswith('<'):
                # Content is already HTML
                content_html = post.content
            else:
                # Content is still markdown, wrap in basic structure
                content_html = f"""
                <article class="blog-post">
                    <header class="post-header">
                        <h1 class="post-title">{post.title}</h1>
                        <p class="post-description">{post.description}</p>
                    </header>
                    <div class="post-content">
                        {post.content.replace(chr(10), '<br>')}
                    </div>
                </article>
                """

            # Add metadata header if content doesn't already include it
            if not '<header class="post-header">' in content_html:
                posts_html += f"""
                <article class="blog-post" id="{post.slug}">
                    <header class="post-header">
                        <h1 class="post-title">{post.title}</h1>
                        <p class="post-description">{post.description}</p>

                        <div class="post-meta">
                            <div class="meta-item">
                                <span>📖</span>
                                <span>{post.estimated_read_time}</span>
                            </div>
                            <div class="meta-item">
                                <span>📝</span>
                                <span>{post.word_count:,} words</span>
                            </div>
                            <div class="meta-item">
                                <span>📊</span>
                                <span>{post.confidence:.0%} confidence</span>
                            </div>
                            <div class="meta-item">
                                <span>📁</span>
                                <span>{len(post.sources)} sources</span>
                            </div>
                        </div>

                        <div class="post-tags">
                            <span class="tag style">{post.blog_style.title()}</span>
                            <span class="tag">{post.target_audience.title()}</span>
                        </div>
                    </header>

                    <div class="post-content">
                        {content_html}
                    </div>
                </article>
                """
            else:
                # Content already has proper structure, just add it
                posts_html += content_html

        return posts_html


