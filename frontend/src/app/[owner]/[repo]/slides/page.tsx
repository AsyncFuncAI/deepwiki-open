'use client';

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSync, FaDownload, FaArrowRight, FaArrowUp, FaTimes } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { RepoInfo } from '@/types/repoinfo';
import getRepoUrl from '@/utils/getRepoUrl';

// Helper function to add tokens and other parameters to request body
const addTokensToRequestBody = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody: Record<string, any>,
  token: string,
  repoType: string,
  provider: string = '',
  model: string = '',
  isCustomModel: boolean = false,
  customModel: string = '',
  language: string = 'en',
) => {
  if (token !== '') {
    requestBody.token = token;
  }

  // Add provider-based model selection parameters
  requestBody.provider = provider;
  requestBody.model = model;
  if (isCustomModel && customModel) {
    requestBody.custom_model = customModel;
  }

  requestBody.language = language;
};

interface Slide {
  id: string;
  title: string;
  content: string;
  html: string;
}

export default function SlidesPage() {
  // Get route parameters and search params
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract owner and repo from route params
  const owner = params.owner as string;
  const repo = params.repo as string;

  // Extract tokens from search params
  const token = searchParams.get('token') || '';
  const repoType = searchParams.get('type') || 'github';
  const localPath = searchParams.get('local_path') ? decodeURIComponent(searchParams.get('local_path') || '') : undefined;
  const repoUrl = searchParams.get('repo_url') ? decodeURIComponent(searchParams.get('repo_url') || '') : undefined;
  const providerParam = searchParams.get('provider') || '';
  const modelParam = searchParams.get('model') || '';
  const isCustomModelParam = searchParams.get('is_custom_model') === 'true';
  const customModelParam = searchParams.get('custom_model') || '';
  const language = searchParams.get('language') || 'en';

  // Import language context for translations
  const { messages } = useLanguage();

  // Initialize repo info with useMemo to prevent unnecessary re-renders
  const repoInfo = useMemo<RepoInfo>(() => ({
    owner,
    repo,
    type: repoType,
    token: token || null,
    localPath: localPath || null,
    repoUrl: repoUrl || null
  }), [owner, repo, repoType, token, localPath, repoUrl]);

  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(
    messages.loading?.initializing || 'Initializing slides generation...'
  );
  const [error, setError] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Define a type for the wiki content
  interface WikiPage {
    id: string;
    title: string;
    content: string;
    importance: string;
    filePaths: string[];
    relatedPages: string[];
  }

  interface WikiSection {
    id: string;
    title: string;
    pages: string[];
    subsections: string[];
  }

  interface WikiStructure {
    description: string;
    pages: WikiPage[];
    sections: WikiSection[];
    rootSections: string[];
  }

  interface WikiCacheData {
    wiki_structure: WikiStructure;
    generated_pages: Record<string, WikiPage>;
  }

  const [cachedWikiContent, setCachedWikiContent] = useState<WikiCacheData | null>(null);

  // Function to fetch cached wiki content
  const fetchCachedWikiContent = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        repo_type: repoInfo.type,
        language: language,
      });
      const response = await fetch(`/api/wiki_cache?${params.toString()}`);

      if (response.ok) {
        const cachedData = await response.json();
        if (cachedData && cachedData.wiki_structure && cachedData.generated_pages &&
            Object.keys(cachedData.generated_pages).length > 0) {
          console.log('Successfully fetched cached wiki data for slides generation');
          setCachedWikiContent(cachedData);
          return cachedData;
        } else {
          console.log('No valid wiki data in server cache or cache is empty.');
          return null;
        }
      } else {
        console.error('Error fetching wiki cache from server:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error loading from server cache:', error);
      return null;
    }
  }, [repoInfo.owner, repoInfo.repo, repoInfo.type, language]);

  // Generate slides content
  const generateSlidesContent = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    // Clear previous content
    setSlides([]);
    setCurrentSlideIndex(0);
    setLoadingMessage(messages.loading?.generatingSlides || 'Generating slides...');

    try {
      // Get repository URL
      const repoUrl = getRepoUrl(repoInfo);

      // Fetch cached wiki content if not already available
      let wikiData = cachedWikiContent;
      if (!wikiData) {
        wikiData = await fetchCachedWikiContent();
      }

      // We'll just pass the entire wiki data to the LLM without complex processing
      let wikiContent = '';

      if (wikiData && wikiData.wiki_structure && wikiData.generated_pages) {
        // Add the wiki structure description
        wikiContent += `## Project Overview\n${wikiData.wiki_structure.description || ''}\n\n`;

        // Add all wiki pages content
        const pages = wikiData.wiki_structure.pages || [];
        const generatedPages = wikiData.generated_pages || {};

        // Limit the total content to avoid token limits
        let totalContentLength = 0;
        const maxContentLength = 30000; // Approximate limit to avoid token issues

        // First add high importance pages
        const highImportancePages = pages.filter(page => page.importance === 'high');
        for (const page of highImportancePages) {
          if (generatedPages[page.id] && generatedPages[page.id].content) {
            const content = `## ${page.title}\n${generatedPages[page.id].content}\n\n`;
            wikiContent += content;
            totalContentLength += content.length;

            if (totalContentLength > maxContentLength) break;
          }
        }

        // Then add other pages if we still have space
        if (totalContentLength < maxContentLength) {
          for (const page of pages) {
            // Skip high importance pages we've already added
            if (page.importance === 'high') continue;

            if (generatedPages[page.id] && generatedPages[page.id].content) {
              const content = `## ${page.title}\n${generatedPages[page.id].content}\n\n`;

              // Check if adding this content would exceed our limit
              if (totalContentLength + content.length > maxContentLength) {
                // If it would exceed, just add a summary
                const summaryMatch = generatedPages[page.id].content.match(/# .*?\n\n(.*?)(\n\n|$)/);
                const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
                const summaryContent = `## ${page.title}\n${summary}\n\n`;

                wikiContent += summaryContent;
                totalContentLength += summaryContent.length;
              } else {
                // Otherwise add the full content
                wikiContent += content;
                totalContentLength += content.length;
              }

              if (totalContentLength > maxContentLength) break;
            }
          }
        }
      }

      // First, get a plan for the slides
      const planRequestBody: Record<string, unknown> = {
        repo_url: repoUrl,
        type: repoInfo.type,
        messages: [{
          role: 'user',
          content: `Create an engaging outline for a high-quality marketing slide presentation about the ${owner}/${repo} repository.

Based on this wiki content:
${wikiContent}

I need a numbered list of 7-8 creative slide titles with brief descriptions for a professional marketing presentation. Think of this as a pitch deck that would impress potential users or investors.

Focus on:
- Compelling value propositions
- Unique selling points
- Impressive features and capabilities
- Real-world applications and benefits
- Visually interesting concepts that can be represented creatively

For example, instead of generic titles like "Introduction" or "Features", use more engaging titles like:
1. "Revolutionizing Development with ${repo}"
2. "Unlock Powerful Capabilities with Our Innovative Architecture"
3. "How ${repo} Transforms Your Workflow"

Give me the numbered list with brief descriptions for each slide. Be creative but professional.`
        }]
      };

      // Add tokens if available
      addTokensToRequestBody(planRequestBody, token, repoInfo.type, providerParam, modelParam, isCustomModelParam, customModelParam, language);

      // Use WebSocket for communication
      let planContent = '';

      try {
        // Create WebSocket URL from the server base URL
        const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:8001';
        const wsBaseUrl = serverBaseUrl.replace(/^http/, 'ws')? serverBaseUrl.replace(/^https/, 'wss'): serverBaseUrl.replace(/^http/, 'ws');
        const wsUrl = `${wsBaseUrl}/ws/chat`;

        // Create a new WebSocket connection
        const ws = new WebSocket(wsUrl);

        // Create a single promise that handles the entire WebSocket lifecycle
        await new Promise<void>((resolve, reject) => {
          let isResolved = false;

          // If the connection doesn't open or complete within 10 seconds, fall back to HTTP
          const timeout = setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              // Try to close the WebSocket if it's still open
              if (ws.readyState === WebSocket.OPEN) {
                ws.close();
              }
              reject(new Error('WebSocket connection timeout'));
            }
          }, 10000);

          // Set up event handlers
          ws.onopen = () => {
            console.log('WebSocket connection established for slide plan');
            // Send the request as JSON
            ws.send(JSON.stringify(planRequestBody));
            // Don't resolve here, wait for the complete response
          };

          ws.onmessage = (event) => {
            const chunk = event.data;
            planContent += chunk;
          };

          ws.onclose = () => {
            clearTimeout(timeout);
            console.log('WebSocket connection closed for slide plan');
            if (!isResolved) {
              isResolved = true;
              resolve();
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (!isResolved) {
              isResolved = true;
              reject(new Error('WebSocket connection failed'));
            }
          };
        });
      } catch (wsError) {
        console.error('WebSocket error, falling back to HTTP:', wsError);

        // Fall back to HTTP if WebSocket fails
        const planResponse = await fetch(`/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(planRequestBody)
        });

        if (!planResponse.ok) {
          throw new Error(`Error generating slide plan: ${planResponse.status}`);
        }

        // Process the plan response
        planContent = '';
        const planReader = planResponse.body?.getReader();
        const planDecoder = new TextDecoder();

        if (!planReader) {
          throw new Error('Failed to get plan response reader');
        }

        try {
          while (true) {
            const { done, value } = await planReader.read();
            if (done) break;
            const chunk = planDecoder.decode(value, { stream: true });
            planContent += chunk;
          }
          // Ensure final decoding
          const finalChunk = planDecoder.decode();
          planContent += finalChunk;
        } catch (readError) {
          console.error('Error reading plan stream:', readError);
          throw new Error('Error processing plan response stream');
        }
      }

      // Log the plan content for debugging
      console.log("Received slide plan:", planContent);

      // Try multiple regex patterns to extract slide plan
      let slideMatches: RegExpExecArray[] = [];

      // Pattern 1: Standard numbered list with periods (1. Title: Description)
      const pattern1 = /\d+\.\s+(.*?)(?=\n\d+\.|\n*$)/g;
      let match;
      while ((match = pattern1.exec(planContent)) !== null) {
        slideMatches.push(match);
      }

      // Pattern 2: Numbered list with parentheses (1) Title: Description
      if (slideMatches.length === 0) {
        const pattern2 = /\d+\)\s+(.*?)(?=\n\d+\)|\n*$)/g;
        while ((match = pattern2.exec(planContent)) !== null) {
          slideMatches.push(match);
        }
      }

      // Pattern 3: Look for lines with "Slide" followed by number
      if (slideMatches.length === 0) {
        const pattern3 = /Slide\s+\d+\s*:?\s*(.*?)(?=\nSlide|\n*$)/gi;
        while ((match = pattern3.exec(planContent)) !== null) {
          slideMatches.push(match);
        }
      }

      // Pattern 4: Look for any lines with a title that might be a slide
      if (slideMatches.length === 0) {
        const pattern4 = /^([^:\n]+)(?::\s*(.*?))?$/gm;
        while ((match = pattern4.exec(planContent)) !== null) {
          // Filter out very short lines or lines that look like instructions
          if (match[1].length > 3 && !match[1].toLowerCase().includes("please") && !match[1].toLowerCase().includes("here")) {
            slideMatches.push(match);
          }
        }
      }

      // If we still don't have matches, create some default slides
      if (slideMatches.length === 0) {
        console.warn("Could not extract slide plan from response, using default slides");

        // Create default slides
        const defaultSlides = [
          `Title Slide: Introduction to ${repo}`,
          `Overview: Key features and purpose of ${repo}`,
          `Architecture: System components and structure`,
          `Features: Main capabilities and functionalities`,
          `Implementation: How it works and technical details`,
          `Use Cases: How to use ${repo} effectively`,
          `Conclusion: Summary and next steps`
        ];

        // Convert to match format
        slideMatches = defaultSlides.map((slide, index) => {
          const mockMatch = ["", slide] as unknown as RegExpExecArray;
          mockMatch.index = index;
          mockMatch.input = slide;
          return mockMatch;
        });
      }

      console.log(`Found ${slideMatches.length} slides in the plan`);


      // Now generate each slide one by one
      const generatedSlides: Slide[] = [];
      let slideCounter = 1;

      for (const slideMatch of slideMatches) {
        const slideTitle = slideMatch[1].split(':')[0].trim();
        const slideDescription = slideMatch[1].includes(':') ? slideMatch[1].split(':')[1].trim() : '';

        setLoadingMessage(`Generating slide ${slideCounter} of ${slideMatches.length}: ${slideTitle}`);

        // Create a request for this specific slide
        const slideRequestBody: Record<string, unknown> = {
          repo_url: repoUrl,
          type: repoInfo.type,
          messages: [{
            role: 'user',
            content: `Create a single HTML slide about the ${owner}/${repo} repository with the title "${slideTitle}".

This is slide ${slideCounter} of ${slideMatches.length} in the presentation.
${slideDescription ? `The slide should cover: ${slideDescription}` : ''}

Use the following wiki content as reference:
${wikiContent}

I need ONLY the HTML for this slide. The slide should maintain a consistent dark theme with gradients and professional styling, but BE CREATIVE with the content and layout.

IMPORTANT LAYOUT REQUIREMENTS:
1. The slide MUST be designed for a 16:9 HORIZONTAL layout (landscape orientation)
2. All content MUST fit within the visible area without requiring scrolling
3. Text must be properly sized and positioned for readability in a presentation context
4. Content should be well-structured with clear visual hierarchy
5. Use grid or flexbox layouts to ensure proper horizontal organization of content
6. Limit text content to what can be comfortably read from a distance

MARKETING QUALITY:
Create a genuinely high-quality marketing slide that would impress potential users or investors. Use compelling language, impactful visuals, and professional marketing techniques. Think of this as a slide for a professional pitch deck or product showcase.

You can use:
- Two or three-column layouts for better horizontal space utilization
- Engaging marketing copy with concise bullet points (no more than 4-5 per slide)
- Visual metaphors and analogies positioned to the side of text content
- Charts, diagrams, or code snippets when relevant (positioned appropriately)
- Icons from Font Awesome (already included)
- Creative use of gradients, shadows, and visual elements

The slide should maintain the dark theme aesthetic but can be uniquely designed. Use creative HTML/CSS to make the slide visually impressive while ensuring all content fits properly in the horizontal layout.

Here's a basic structure to build upon (but feel free to be creative):

<div class="slide">
    <div class="code-pattern"></div>
    <div class="accent-glow"></div>

    <div class="content">
        <!-- Use horizontal layout structures -->
        <div class="slide-header">
            <h1 class="main-title">${slideTitle}</h1>
        </div>

        <div class="slide-body">
            <!-- Consider using flex or grid layout here -->
            <div class="left-column">
                <!-- Main points or text content -->
            </div>
            <div class="right-column">
                <!-- Visual elements, diagrams, or supporting content -->
            </div>
        </div>
    </div>
</div>
<style>
    /* Base styling with horizontal layout focus */
    .slide {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        color: #e6edf3;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .content {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 40px 60px;
        z-index: 2;
    }
    .slide-header {
        margin-bottom: 30px;
    }
    .slide-body {
        display: flex;
        flex: 1;
        gap: 40px;
    }
    .left-column, .right-column {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
</style>

Please return ONLY the HTML with no markdown formatting or code blocks. Just the raw HTML for the slide.`
          }]
        };

        // Add tokens if available
        addTokensToRequestBody(slideRequestBody, token, repoInfo.type, providerParam, modelParam, isCustomModelParam, customModelParam, language);

        // Use WebSocket for communication
        let slideContent = '';

        try {
          // Create WebSocket URL from the server base URL
          const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:8001';
          const wsBaseUrl = serverBaseUrl.replace(/^http/, 'ws')? serverBaseUrl.replace(/^https/, 'wss'): serverBaseUrl.replace(/^http/, 'ws');
          const wsUrl = `${wsBaseUrl}/ws/chat`;

          // Create a new WebSocket connection
          const ws = new WebSocket(wsUrl);

          // Create a single promise that handles the entire WebSocket lifecycle
          await new Promise<void>((resolve, reject) => {
            let isResolved = false;

            // If the connection doesn't open or complete within 10 seconds, fall back to HTTP
            const timeout = setTimeout(() => {
              if (!isResolved) {
                isResolved = true;
                // Try to close the WebSocket if it's still open
                if (ws.readyState === WebSocket.OPEN) {
                  ws.close();
                }
                reject(new Error('WebSocket connection timeout'));
              }
            }, 10000);

            // Set up event handlers
            ws.onopen = () => {
              console.log(`WebSocket connection established for slide ${slideCounter}`);
              // Send the request as JSON
              ws.send(JSON.stringify(slideRequestBody));
              // Don't resolve here, wait for the complete response
            };

            ws.onmessage = (event) => {
              const chunk = event.data;
              slideContent += chunk;
            };

            ws.onclose = () => {
              clearTimeout(timeout);
              console.log(`WebSocket connection closed for slide ${slideCounter}`);
              if (!isResolved) {
                isResolved = true;
                resolve();
              }
            };

            ws.onerror = (error) => {
              console.error('WebSocket error:', error);
              if (!isResolved) {
                isResolved = true;
                reject(new Error('WebSocket connection failed'));
              }
            };
          });
        } catch (wsError) {
          console.error('WebSocket error, falling back to HTTP:', wsError);

          // Fall back to HTTP if WebSocket fails
          const slideResponse = await fetch(`/api/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(slideRequestBody)
          });

          if (!slideResponse.ok) {
            throw new Error(`Error generating slide ${slideCounter}: ${slideResponse.status}`);
          }

          // Process the slide response
          slideContent = '';
          const slideReader = slideResponse.body?.getReader();
          const slideDecoder = new TextDecoder();

          if (!slideReader) {
            throw new Error(`Failed to get reader for slide ${slideCounter}`);
          }

          try {
            while (true) {
              const { done, value } = await slideReader.read();
              if (done) break;
              const chunk = slideDecoder.decode(value, { stream: true });
              slideContent += chunk;
            }
            // Ensure final decoding
            const finalChunk = slideDecoder.decode();
            slideContent += finalChunk;
          } catch (readError) {
            console.error(`Error reading slide ${slideCounter} stream:`, readError);
            throw new Error(`Error processing slide ${slideCounter} response stream`);
          }
        }

        // Extract HTML content - look for content between HTML tags or code blocks
        let slideHtml = '';

        console.log(`Processing slide ${slideCounter} response`);

        // Try to extract from code blocks if present
        const codeBlockMatch = slideContent.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          slideHtml = codeBlockMatch[1];
          console.log("Extracted HTML from code block");
        }
        // Try to extract content between <div class="slide"> and closing </div>
        else if (slideContent.includes('<div class="slide"')) {
          const divMatch = slideContent.match(/<div class="slide"[\s\S]*?<\/div>\s*<\/div>/);
          if (divMatch) {
            slideHtml = divMatch[0];
            console.log("Extracted HTML from div tags");
          }
        }
        // Try to extract any HTML-like content
        else if (slideContent.includes('<') && slideContent.includes('>')) {
          const htmlTagMatch = slideContent.match(/<[\s\S]*?>/);
          if (htmlTagMatch) {
            // Find the first HTML tag
            const firstTag = htmlTagMatch[0].match(/<([a-z][a-z0-9]*)/i);
            if (firstTag && firstTag[1]) {
              const tagName = firstTag[1];
              // Try to extract everything from this opening tag to its closing tag
              const fullTagRegex = new RegExp(`<${tagName}[\\s\\S]*?<\\/${tagName}>`, 'i');
              const fullTagMatch = slideContent.match(fullTagRegex);
              if (fullTagMatch) {
                slideHtml = fullTagMatch[0];
                console.log(`Extracted HTML using tag matching for ${tagName}`);
              }
            }
          }
        }

        // If we still don't have HTML, use the raw content
        if (!slideHtml) {
          console.log("Using raw content as HTML");
          slideHtml = slideContent;
        }

        // Add default styling if not present
        if (!slideHtml.includes('<style>') && !slideHtml.includes('<link rel="stylesheet"')) {
          slideHtml = `
<div class="slide">
    <div class="code-pattern"></div>
    <div class="accent-glow"></div>

    <div class="content">
        <div class="slide-header">
            <h1 class="main-title">${slideTitle}</h1>
        </div>

        <div class="slide-body">
            <div class="left-column">
                <div class="slide-content">
                    ${slideHtml}
                </div>
            </div>
            <div class="right-column">
                <!-- The AI will likely provide content for both columns, but if not, this ensures proper layout -->
                <div class="visual-content">
                    <i class="fas fa-code fa-5x" style="opacity: 0.3; color: #58a6ff; margin: 2rem auto; display: block; text-align: center;"></i>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
    /* Base slide styling - optimized for horizontal layout */
    .slide {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #e6edf3;
        background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        display: flex;
        flex-direction: column;
    }

    /* Optional decorative elements that can be used or overridden */
    .code-pattern {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2330363d' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        opacity: 0.2;
        z-index: 0;
    }

    .accent-glow {
        position: absolute;
        width: 600px;
        height: 600px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(88, 166, 255, 0.1) 0%, rgba(88, 166, 255, 0) 70%);
        top: -200px;
        right: -100px;
        z-index: 1;
    }

    /* Content container - optimized for horizontal layout */
    .content {
        z-index: 2;
        position: relative;
        height: 100%;
        padding: 40px 60px;
        display: flex;
        flex-direction: column;
    }

    /* Slide structure for better horizontal organization */
    .slide-header {
        margin-bottom: 30px;
    }

    .slide-body {
        display: flex;
        flex: 1;
        gap: 40px;
        align-items: flex-start;
    }

    .left-column, .right-column {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    /* Default title styling - can be overridden */
    .main-title {
        font-size: 3.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #58a6ff 0%, #8957e5 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1.1;
        margin-bottom: 10px;
    }

    /* Default content styling - optimized for readability */
    .slide-content {
        font-size: 1.5rem;
        color: #e6edf3;
        line-height: 1.5;
        display: flex;
        flex-direction: column;
    }

    /* Ensure bullet points are properly spaced and aligned */
    .slide-content ul, .slide-content ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
    }

    .slide-content li {
        margin-bottom: 0.5em;
    }

    /* Ensure code snippets don't overflow */
    .slide-content pre, .slide-content code {
        max-width: 100%;
        overflow-x: auto;
        white-space: pre-wrap;
        font-size: 1.2rem;
    }

    /* Additional utility classes for creative layouts */
    .flex-row { display: flex; flex-direction: row; }
    .flex-col { display: flex; flex-direction: column; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .relative { position: relative; }
    .absolute { position: absolute; }

    /* Accent colors for creative use */
    .text-accent-blue { color: #58a6ff; }
    .text-accent-purple { color: #8957e5; }
    .text-accent-green { color: #3fb950; }
    .text-accent-orange { color: #f0883e; }
    .bg-accent-blue { background-color: rgba(88, 166, 255, 0.2); }
    .bg-accent-purple { background-color: rgba(137, 87, 229, 0.2); }
</style>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.0.0/dist/mermaid.min.js"></script>
<script>
  // Initialize Mermaid for diagrams if present
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        theme: 'dark',
        securityLevel: 'loose',
        startOnLoad: true
      });
    }

    // Initialize any Chart.js charts if present
    if (typeof Chart !== 'undefined') {
      // Charts will be initialized by their own script tags
    }
  });
</script>
          `;
        }

        // Create the slide object
        const slide: Slide = {
          id: `slide-${slideCounter}`,
          title: slideTitle,
          content: slideDescription || slideTitle,
          html: slideHtml
        };

        // Add to our slides array
        generatedSlides.push(slide);

        // Update the state with the slides we have so far
        setSlides([...generatedSlides]);

        slideCounter++;
      }

      // Set the final slides
      setSlides(generatedSlides);

    } catch (err) {
      console.error('Error generating slides content:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  }, [owner, repo, repoInfo, token, providerParam, modelParam, isCustomModelParam, customModelParam, language, isLoading, messages.loading, cachedWikiContent, fetchCachedWikiContent]);

  // Export slides content
  const exportSlides = useCallback(async () => {
    if (!slides || slides.length === 0) {
      setExportError('No slides to export');
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);

      // Create a full HTML document with all slides
      const htmlContent = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${repo} Slides</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.0.0/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #0d1117;
      color: #e6edf3;
    }
    .slide-container {
      max-width: 1280px;
      height: 720px; /* 16:9 aspect ratio */
      margin: 2rem auto;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      border-radius: 8px;
    }

    /* Ensure proper horizontal layout in exported slides */
    .slide-body {
      display: flex;
      flex: 1;
      gap: 40px;
      align-items: flex-start;
    }

    .left-column, .right-column {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Ensure content is properly sized */
    .slide-content {
      font-size: 1.5rem;
      line-height: 1.5;
    }

    /* Ensure bullet points are properly spaced */
    .slide-content ul, .slide-content ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    .slide-content li {
      margin-bottom: 0.5em;
    }

    /* Ensure code snippets don't overflow */
    .slide-content pre, .slide-content code {
      max-width: 100%;
      overflow-x: auto;
      white-space: pre-wrap;
      font-size: 1.2rem;
    }
    @media print {
      .slide-container {
        page-break-after: always;
        margin: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-shadow: none;
        border-radius: 0;
      }
    }
    /* Navigation controls for presentation mode */
    .nav-controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      z-index: 1000;
      background: rgba(13, 17, 23, 0.8);
      padding: 10px 20px;
      border-radius: 30px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    .nav-btn {
      background: rgba(56, 139, 253, 0.1);
      border: 1px solid rgba(56, 139, 253, 0.4);
      color: #58a6ff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s ease;
    }
    .nav-btn:hover {
      background: rgba(56, 139, 253, 0.2);
    }
    .slide-indicator {
      display: flex;
      align-items: center;
      color: #8b949e;
      font-size: 14px;
    }
    @media print {
      .nav-controls {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${slides.map(slide => `<div class="slide-container">${slide.html}</div>`).join('\n')}

  <!-- Navigation controls (only visible in browser) -->
  <div class="nav-controls">
    <div class="nav-btn prev-slide" onclick="prevSlide()">
      <i class="fas fa-chevron-left"></i>
    </div>
    <div class="slide-indicator">
      <span id="current-slide">1</span>/<span id="total-slides">${slides.length}</span>
    </div>
    <div class="nav-btn next-slide" onclick="nextSlide()">
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>

  <script>
    // Simple presentation navigation
    let currentSlide = 1;
    const totalSlides = ${slides.length};
    const slideContainers = document.querySelectorAll('.slide-container');

    // Initialize - show only first slide
    function initSlides() {
      slideContainers.forEach((slide, index) => {
        if (index === 0) {
          slide.style.display = 'block';
        } else {
          slide.style.display = 'none';
        }
      });
      updateIndicator();
    }

    function showSlide(slideNumber) {
      slideContainers.forEach((slide, index) => {
        slide.style.display = index + 1 === slideNumber ? 'block' : 'none';
      });
      updateIndicator();
    }

    function nextSlide() {
      if (currentSlide < totalSlides) {
        currentSlide++;
        showSlide(currentSlide);
      }
    }

    function prevSlide() {
      if (currentSlide > 1) {
        currentSlide--;
        showSlide(currentSlide);
      }
    }

    function updateIndicator() {
      document.getElementById('current-slide').textContent = currentSlide;
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    });

    // Initialize on load
    window.onload = function() {
      initSlides();

      // Initialize Mermaid diagrams if present
      if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
          theme: 'dark',
          securityLevel: 'loose',
          startOnLoad: true
        });
      }
    };
  </script>
</body>
</html>
      `;

      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repo}_slides.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error exporting slides:', err);
      setExportError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  }, [slides, repo, language]);

  // Navigation functions
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [currentSlideIndex]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextSlide, goToPrevSlide, toggleFullscreen, isFullscreen]);

  // Track if we've already generated content
  const contentGeneratedRef = useRef(false);

  // Generate slides content on page load, but only once
  useEffect(() => {
    if (!contentGeneratedRef.current) {
      contentGeneratedRef.current = true;

      // First fetch the cached wiki content, then generate the slides
      (async () => {
        await fetchCachedWikiContent();
        generateSlidesContent();
      })();
    }
  }, [generateSlidesContent, fetchCachedWikiContent]);

  return (
    <div className={`min-h-screen flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0d1117]' : 'bg-[var(--background)]'}`}>
      {/* Header - Hide in fullscreen mode */}
      {!isFullscreen && (
        <header className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--border-color)] shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/${owner}/${repo}${window.location.search}`}
                className="flex items-center text-[var(--foreground)] hover:text-[var(--accent-primary)] transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                <span>{messages.slides?.backToWiki || 'Back to Wiki'}</span>
              </Link>
              <h1 className="text-xl font-bold text-[var(--accent-primary)]">
                {messages.slides?.title || 'Slides'}: {repo}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={generateSlidesContent}
                disabled={isLoading}
                className={`p-2 rounded-md ${isLoading ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'} transition-colors`}
                title={messages.slides?.regenerate || 'Regenerate Slides'}
              >
                <FaSync className={`${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportSlides}
                disabled={!slides.length || isExporting}
                className={`p-2 rounded-md ${!slides.length || isExporting ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'} transition-colors`}
                title={messages.slides?.export || 'Export Slides'}
              >
                <FaDownload />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
                title={messages.slides?.fullscreen || 'Toggle Fullscreen'}
              >
                <FaArrowUp />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`flex-1 flex flex-col ${isFullscreen ? 'p-0' : 'container mx-auto px-4 py-6'}`}>
        {isLoading && !slides.length ? (
          <div className="flex flex-col items-center justify-center p-8 flex-grow">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--foreground)]">{loadingMessage}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">{messages.common?.error || 'Error'}</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : slides.length > 0 ? (
          <div className="flex flex-col flex-grow">
            {/* Slide content */}
            <div className={`flex-grow flex flex-col items-center justify-center ${isFullscreen ? 'p-0 bg-[#0d1117]' : 'bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm p-6 mb-4'}`}>
              {exportError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 w-full">
                  <p className="text-red-700 dark:text-red-300 text-sm">{exportError}</p>
                </div>
              )}

              {/* Current slide */}
              <div
                className={`${isFullscreen ? 'w-full h-full' : 'w-full max-w-[1280px] aspect-[16/9]'} flex items-center justify-center overflow-hidden`}
              >
                {/* Include Font Awesome for icons */}
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex]?.html || '' }} />
              </div>
            </div>

            {/* Navigation controls */}
            <div className={`flex items-center justify-between ${isFullscreen ? 'fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0d1117]/80 px-6 py-3 rounded-full z-10 shadow-lg' : 'mt-4'}`}>
              <button
                onClick={goToPrevSlide}
                disabled={currentSlideIndex === 0}
                className={`p-2 rounded-md ${currentSlideIndex === 0 ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'} transition-colors`}
              >
                <FaArrowLeft />
              </button>

              <div className={`text-[var(--foreground)] ${isFullscreen ? 'mx-4' : ''}`}>
                Slide {currentSlideIndex + 1} of {slides.length}
              </div>

              <button
                onClick={goToNextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                className={`p-2 rounded-md ${currentSlideIndex === slides.length - 1 ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'} transition-colors`}
              >
                <FaArrowRight />
              </button>

              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="p-2 ml-4 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
                  title={messages.slides?.fullscreen || 'Exit Fullscreen'}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 flex-grow">
            <p className="text-[var(--foreground)]">{messages.slides?.noSlides || 'No slides generated yet. Click the refresh button to generate slides.'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
