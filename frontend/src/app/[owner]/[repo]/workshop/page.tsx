'use client';

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSync, FaDownload } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
import Markdown from '@/components/Markdown';
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

export default function WorkshopPage() {
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
    messages.loading?.initializing || 'Initializing workshop generation...'
  );
  const [error, setError] = useState<string | null>(null);
  const [workshopContent, setWorkshopContent] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
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
          console.log('Successfully fetched cached wiki data for workshop generation');
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

  // Generate workshop content
  const generateWorkshopContent = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    // Clear previous content
    setWorkshopContent('');
    setLoadingMessage(messages.loading?.generatingWorkshop || 'Generating workshop content...');

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

      // Prepare request body with enhanced context from wiki
      const requestBody: Record<string, unknown> = {
        repo_url: repoUrl,
        type: repoInfo.type,
        messages: [{
          role: 'user',
          content: `Create a comprehensive workshop for learning how to use and contribute to the ${owner}/${repo} repository.

I'll provide you with information from the project's wiki to help you create a more accurate and relevant workshop.

${wikiContent}

This workshop should be designed as a hands-on tutorial that guides users through understanding, using, and potentially contributing to this project. The workshop should be highly readable and optimized for quick onboarding of new users.

The workshop should include:

1. A series of progressive exercises that build on each other (at least 3-4 exercises)
2. Clear instructions for each exercise with step-by-step guidance
3. Code examples and snippets where appropriate
4. "Challenge" sections that encourage deeper exploration
5. Solutions for each exercise and challenge (in collapsible sections using <details> tags)
6. Explanations that connect the exercises to the actual codebase

Format the workshop in Markdown with the following structure:

# ${repo} Workshop

## Introduction
- Brief overview of the project
- What users will learn in this workshop
- Prerequisites and setup instructions

## Exercise 1: [First Core Concept]
- Explanation of the concept
- Step-by-step instructions with clear formatting
- Expected outcome
- Challenge (optional harder task)
- Solution (in a collapsible section using <details> tags)

## Exercise 2: [Second Core Concept]
...

## Exercise 3: [Third Core Concept]
...

## Final Project
- A culminating exercise that brings together multiple concepts
- Clear success criteria
- Solution

## Next Steps
- Suggestions for further learning
- How to contribute to the project
- Additional resources

IMPORTANT FORMATTING GUIDELINES:
1. Use clear headings and subheadings with proper hierarchy
2. Use bullet points and numbered lists for clarity
3. Highlight important information in **bold** or with blockquotes
4. Use code blocks with proper syntax highlighting
5. Include Mermaid diagrams where they would help illustrate concepts or workflows
6. Put solutions in collapsible <details> sections
7. Use tables for comparing options or summarizing information
8. Break long sections into smaller, digestible chunks
9. Use consistent formatting throughout

IMPORTANT CONTENT GUIDELINES:
1. Make sure each exercise focuses on a REAL aspect of the ${repo} repository
2. Use REAL code examples from the repository, not generic examples
3. Create exercises that are practical and relevant to the actual codebase
4. Include at least 3-4 exercises covering different aspects of the repository
5. The final project should be challenging but achievable
6. Ensure the workshop is specific to this repository, not generic
7. Focus on the most important/core features of the repository
8. Include diagrams to visualize complex concepts
9. Make sure the workshop is engaging and interactive

Make the workshop content in ${language === 'en' ? 'English' :
  language === 'ja' ? 'Japanese (日本語)' :
  language === 'zh' ? 'Mandarin Chinese (中文)' :
  language === 'zh-tw' ? 'Traditional Chinese (繁體中文)' :
  language === 'es' ? 'Spanish (Español)' :
  language === 'kr' ? 'Korean (한국어)' :
  language === 'vi' ? 'Vietnamese (Tiếng Việt)' : 
  language === "pt-br" ? "Brazilian Portuguese (Português Brasileiro)" :
  language === "fr" ? "Français (French)" :
  language === "ru" ? "Русский (Russian)" :
  'English'} language.`
        }]
      };

      // Add tokens if available
      addTokensToRequestBody(requestBody, token, repoInfo.type, providerParam, modelParam, isCustomModelParam, customModelParam, language);

      // Use WebSocket for communication
      let content = '';

      try {
        // Create WebSocket URL from the server base URL
        const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:8001';
        const wsBaseUrl = serverBaseUrl.replace(/^http/, 'ws')? serverBaseUrl.replace(/^https/, 'wss'): serverBaseUrl.replace(/^http/, 'ws');
        const wsUrl = `${wsBaseUrl}/ws/chat`;

        // Create a new WebSocket connection
        const ws = new WebSocket(wsUrl);

        // Create a promise that resolves when the WebSocket connection is complete
        await new Promise<void>((resolve, reject) => {
          // Set up event handlers
          ws.onopen = () => {
            console.log('WebSocket connection established for workshop generation');
            // Send the request as JSON
            ws.send(JSON.stringify(requestBody));
            resolve();
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            reject(new Error('WebSocket connection failed'));
          };

          // If the connection doesn't open within 5 seconds, fall back to HTTP
          const timeout = setTimeout(() => {
            reject(new Error('WebSocket connection timeout'));
          }, 5000);

          // Clear the timeout if the connection opens successfully
          ws.onopen = () => {
            clearTimeout(timeout);
            console.log('WebSocket connection established for workshop generation');
            // Send the request as JSON
            ws.send(JSON.stringify(requestBody));
            resolve();
          };
        });

        // Create a promise that resolves when the WebSocket response is complete
        await new Promise<void>((resolve, reject) => {
          // Use a local variable to accumulate content
          let accumulatedContent = '';

          // Handle incoming messages
          ws.onmessage = (event) => {
            const chunk = event.data;
            content += chunk;
            accumulatedContent += chunk;

            // Update the state with the accumulated content
            setWorkshopContent(accumulatedContent);
          };

          // Handle WebSocket close
          ws.onclose = () => {
            console.log('WebSocket connection closed for workshop generation');
            resolve();
          };

          // Handle WebSocket errors
          ws.onerror = (error) => {
            console.error('WebSocket error during message reception:', error);
            reject(new Error('WebSocket error during message reception'));
          };
        });
      } catch (wsError) {
        console.error('WebSocket error, falling back to HTTP:', wsError);

        // Fall back to HTTP if WebSocket fails
        const response = await fetch(`/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Error generating workshop content: ${response.status} - ${errorText}`);
        }

        // Process the response
        content = '';
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        try {
          // Use a local variable to accumulate content
          let accumulatedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            accumulatedContent += chunk;

            // Update the state with the accumulated content
            setWorkshopContent(accumulatedContent);
          }
          // Ensure final decoding
          const finalChunk = decoder.decode();
          content += finalChunk;
          accumulatedContent += finalChunk;
          setWorkshopContent(accumulatedContent);
        } catch (readError) {
          console.error('Error reading stream:', readError);
          throw new Error('Error processing response stream');
        }
      }

      // Clean up markdown delimiters
      content = content.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '');

      // Add a table of contents if it doesn't already have one
      if (!content.includes('## Table of Contents') && !content.includes('## Contents')) {
        const headings = content.match(/^## (.*)$/gm) || [];
        if (headings.length > 0) {
          let toc = '## Table of Contents\n\n';
          headings.forEach(heading => {
            const headingText = heading.replace('## ', '');
            // Create a link-friendly version of the heading
            const headingLink = headingText
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            toc += `- [${headingText}](#${headingLink})\n`;
          });
          toc += '\n';

          // Find the position after the introduction heading
          const introPos = content.indexOf('# ') + 1;
          const nextHeadingPos = content.indexOf('## ', introPos);

          if (nextHeadingPos > introPos) {
            // Insert the TOC after the introduction
            content = content.slice(0, nextHeadingPos) + toc + content.slice(nextHeadingPos);
          }
        }
      }

      // Add progress indicators to exercises
      const exerciseHeadings = content.match(/^## Exercise \d+:/gm) || [];
      if (exerciseHeadings.length > 0) {
        const totalExercises = exerciseHeadings.length;

        // Replace each exercise heading with a heading that includes a progress indicator
        for (let i = 0; i < totalExercises; i++) {
          const exerciseHeading = exerciseHeadings[i];

          // Estimate time to complete based on exercise number (earlier exercises are usually simpler)
          let estimatedTime = 10; // default 10 minutes
          if (i === 0) estimatedTime = 5; // first exercise is usually simpler
          else if (i === totalExercises - 1) estimatedTime = 15; // last exercise is usually more complex
          else if (i > Math.floor(totalExercises / 2)) estimatedTime = 12; // later exercises are more complex

          const progressIndicator = `<div style="text-align: right; font-size: 0.85em; color: #666;">
Exercise ${i + 1} of ${totalExercises} | Estimated time: ${estimatedTime} minutes
</div>\n\n`;

          // Find the position of the exercise heading
          const headingPos = content.indexOf(exerciseHeading);
          if (headingPos !== -1) {
            // Find the end of the line
            const lineEndPos = content.indexOf('\n', headingPos);
            if (lineEndPos !== -1) {
              // Insert the progress indicator after the heading
              content = content.slice(0, lineEndPos + 1) + progressIndicator + content.slice(lineEndPos + 1);
            }
          }
        }
      }

      // Add a note about the final project
      const finalProjectHeading = content.match(/^## Final Project/m);
      if (finalProjectHeading) {
        const headingPos = content.indexOf(finalProjectHeading[0]);
        if (headingPos !== -1) {
          const lineEndPos = content.indexOf('\n', headingPos);
          if (lineEndPos !== -1) {
            const finalProjectNote = `<div style="text-align: right; font-size: 0.85em; color: #666;">
Estimated time: 20-30 minutes | Combines concepts from all exercises
</div>\n\n`;
            content = content.slice(0, lineEndPos + 1) + finalProjectNote + content.slice(lineEndPos + 1);
          }
        }
      }

      setWorkshopContent(content);

    } catch (err) {
      console.error('Error generating workshop content:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  }, [owner, repo, repoInfo, token, providerParam, modelParam, isCustomModelParam, customModelParam, language, isLoading, messages.loading, cachedWikiContent, fetchCachedWikiContent]);

  // Export workshop content
  const exportWorkshop = useCallback(async () => {
    if (!workshopContent) {
      setExportError('No workshop content to export');
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);

      // Create a blob with the workshop content
      const blob = new Blob([workshopContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repo}_workshop.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error exporting workshop:', err);
      setExportError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  }, [workshopContent, repo]);

  // Track if we've already generated content
  const contentGeneratedRef = useRef(false);

  // Generate workshop content on page load, but only once
  useEffect(() => {
    if (!contentGeneratedRef.current) {
      contentGeneratedRef.current = true;

      // First fetch the cached wiki content, then generate the workshop
      (async () => {
        await fetchCachedWikiContent();
        generateWorkshopContent();
      })();
    }
  }, [generateWorkshopContent, fetchCachedWikiContent]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--border-color)] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/${owner}/${repo}${window.location.search}`}
              className="flex items-center text-[var(--foreground)] hover:text-[var(--accent-primary)] transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span>{messages.workshop?.backToWiki || 'Back to Wiki'}</span>
            </Link>
            <h1 className="text-xl font-bold text-[var(--accent-primary)]">
              {messages.workshop?.title || 'Workshop'}: {repo}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={generateWorkshopContent}
              disabled={isLoading}
              className={`p-2 rounded-md ${isLoading ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'} transition-colors`}
              title={messages.workshop?.regenerate || 'Regenerate Workshop'}
            >
              <FaSync className={`${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportWorkshop}
              disabled={!workshopContent || isExporting}
              className={`p-2 rounded-md ${!workshopContent || isExporting ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'} transition-colors`}
              title={messages.workshop?.export || 'Export Workshop'}
            >
              <FaDownload />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {isLoading && !workshopContent ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--foreground)]">{loadingMessage}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">{messages.common?.error || 'Error'}</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm p-6">
            {exportError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{exportError}</p>
              </div>
            )}
            <Markdown content={workshopContent} />
          </div>
        )}
      </main>
    </div>
  );
}
