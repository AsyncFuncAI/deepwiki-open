/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FaExclamationTriangle, FaBookOpen, FaGithub, FaGitlab, FaBitbucket, FaDownload, FaFileExport, FaHome, FaFolder, FaSync, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import Markdown from '@/components/Markdown';
import Ask from '@/components/Ask';
import ModelSelectionModal from '@/components/ModelSelectionModal';
import { useLanguage } from '@/contexts/LanguageContext';

// Wiki Interfaces
interface WikiPage {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  relatedPages: string[];
}

interface WikiStructure {
  id: string;
  title: string;
  description: string;
  pages: WikiPage[];
}

// Add CSS styles for wiki with Japanese aesthetic
const wikiStyles = `
  .prose code {
    @apply bg-[var(--background)]/70 px-1.5 py-0.5 rounded font-mono text-xs border border-[var(--border-color)];
  }

  .prose pre {
    @apply bg-[var(--background)]/80 text-[var(--foreground)] rounded-md p-4 overflow-x-auto border border-[var(--border-color)] shadow-sm;
  }

  .prose h1, .prose h2, .prose h3, .prose h4 {
    @apply font-serif text-[var(--foreground)];
  }

  .prose p {
    @apply text-[var(--foreground)] leading-relaxed;
  }

  .prose a {
    @apply text-[var(--accent-primary)] hover:text-[var(--highlight)] transition-colors no-underline border-b border-[var(--border-color)] hover:border-[var(--accent-primary)];
  }

  .prose blockquote {
    @apply border-l-4 border-[var(--accent-primary)]/30 bg-[var(--background)]/30 pl-4 py-1 italic;
  }

  .prose ul, .prose ol {
    @apply text-[var(--foreground)];
  }

  .prose table {
    @apply border-collapse border border-[var(--border-color)];
  }

  .prose th {
    @apply bg-[var(--background)]/70 text-[var(--foreground)] p-2 border border-[var(--border-color)];
  }

  .prose td {
    @apply p-2 border border-[var(--border-color)];
  }
`;

// Helper functions for token handling and API requests
const getRepoUrl = (owner: string, repo: string, repoType: string, localPath?: string): string => {
  if (repoType === 'local' && localPath) {
    return localPath;
  }
  return repoType === 'github'
    ? `https://github.com/${owner}/${repo}`
    : repoType === 'gitlab'
    ? `https://gitlab.com/${owner}/${repo}`
    : `https://bitbucket.org/${owner}/${repo}`;
};

// Helper function to generate cache key for localStorage
const getCacheKey = (owner: string, repo: string, repoType: string, language: string): string => {
  return `deepwiki_cache_${repoType}_${owner}_${repo}_${language}`;
};

// Helper function to add tokens and other parameters to request body
const addTokensToRequestBody = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody: Record<string, any>,
  githubToken: string,
  gitlabToken: string,
  bitbucketToken: string,
  repoType: string,
  provider: string = '',
  model: string = '',
  isCustomModel: boolean = false,
  customModel: string = '',
  language: string = 'en',
  excludedDirs?: string,
  excludedFiles?: string,
): void => {
  if (githubToken && repoType === 'github') {
    requestBody.github_token = githubToken;
  }
  if (gitlabToken && repoType === 'gitlab') {
    requestBody.gitlab_token = gitlabToken;
  }
  if (bitbucketToken && repoType === 'bitbucket') {
    requestBody.bitbucket_token = bitbucketToken;
  }
  
  // Add provider-based model selection parameters
  requestBody.provider = provider;
  requestBody.model = model;
  if (isCustomModel && customModel) {
    requestBody.custom_model = customModel;
  }
  
  requestBody.language = language;
  
  // Add file filter parameters if provided
  if (excludedDirs) {
    requestBody.excluded_dirs = excludedDirs;
  }
  if (excludedFiles) {
    requestBody.excluded_files = excludedFiles;
  }
};

const createGithubHeaders = (githubToken: string): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  return headers;
};

const createGitlabHeaders = (gitlabToken: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (gitlabToken) {
    headers['PRIVATE-TOKEN'] = gitlabToken;
  }

  return headers;
};

const createBitbucketHeaders = (bitbucketToken: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (bitbucketToken) {
    headers['Authorization'] = `Bearer ${bitbucketToken}`;
  }

  return headers;
};


export default function RepoWikiPage() {
  // Get route parameters and search params
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract owner and repo from route params
  const owner = params.owner as string;
  const repo = params.repo as string;

  // Extract tokens from search params
  const githubToken = searchParams.get('github_token') || '';
  const gitlabToken = searchParams.get('gitlab_token') || '';
  const bitbucketToken = searchParams.get('bitbucket_token') || '';
  const repoType = searchParams.get('type') || 'github';
  const localPath = searchParams.get('local_path') ? decodeURIComponent(searchParams.get('local_path') || '') : undefined;
  const providerParam = searchParams.get('provider') || '';
  const modelParam = searchParams.get('model') || '';
  const isCustomModelParam = searchParams.get('is_custom_model') === 'true';
  const customModelParam = searchParams.get('custom_model') || '';
  const language = searchParams.get('language') || 'en';

  // Import language context for translations
  const { messages } = useLanguage();

  // Initialize repo info
  const repoInfo = useMemo(() => ({
    owner,
    repo,
    type: repoType,
    localPath
  }), [owner, repo, repoType, localPath]);

  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(
    messages.loading?.initializing || 'Initializing wiki generation...'
  );
  const [error, setError] = useState<string | null>(null);
  const [wikiStructure, setWikiStructure] = useState<WikiStructure | undefined>();
  const [currentPageId, setCurrentPageId] = useState<string | undefined>();
  const [generatedPages, setGeneratedPages] = useState<Record<string, WikiPage>>({});
  const [pagesInProgress, setPagesInProgress] = useState(new Set<string>());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [originalMarkdown, setOriginalMarkdown] = useState<Record<string, string>>({});
  const [requestInProgress, setRequestInProgress] = useState(false);
  
  // Model selection state variables
  const [selectedProviderState, setSelectedProviderState] = useState(providerParam);
  const [selectedModelState, setSelectedModelState] = useState(modelParam);
  const [isCustomSelectedModelState, setIsCustomSelectedModelState] = useState(isCustomModelParam);
  const [customSelectedModelState, setCustomSelectedModelState] = useState(customModelParam);
  const [showModelOptions, setShowModelOptions] = useState(false); // Controls whether to show model options
  const excludedDirs = searchParams.get('excluded_dirs') || '';
  const excludedFiles = searchParams.get('excluded_files') || '';
  const [modelExcludedDirs, setModelExcludedDirs] = useState(excludedDirs);
  const [modelExcludedFiles, setModelExcludedFiles] = useState(excludedFiles);
  // Using useRef for activeContentRequests to maintain a single instance across renders
  // This map tracks which pages are currently being processed to prevent duplicate requests
  // Note: In a multi-threaded environment, additional synchronization would be needed,
  // but in React's single-threaded model, this is safe as long as we set the flag before any async operations
  const activeContentRequests = useRef(new Map<string, boolean>()).current;
  const [structureRequestInProgress, setStructureRequestInProgress] = useState(false);
  // Create a flag to track if data was loaded from cache to prevent immediate re-save
  const cacheLoadedSuccessfully = useRef(false);

  // Create a flag to ensure the effect only runs once
  const effectRan = React.useRef(false);

  // State for Ask section visibility
  const [isAskSectionVisible, setIsAskSectionVisible] = useState(true);

  // Memoize repo info to avoid triggering updates in callbacks

  // Add useEffect to handle scroll reset
  useEffect(() => {
    // Scroll to top when currentPageId changes
    const wikiContent = document.getElementById('wiki-content');
    if (wikiContent) {
      wikiContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPageId]);

  // Generate content for a wiki page
  const generatePageContent = useCallback(async (page: WikiPage, owner: string, repo: string) => {
    return new Promise<void>(async (resolve) => {
      try {
        // Skip if content already exists
        if (generatedPages[page.id]?.content) {
          resolve();
          return;
        }

        // Skip if this page is already being processed
        // Use a synchronized pattern to avoid race conditions
        if (activeContentRequests.get(page.id)) {
          console.log(`Page ${page.id} (${page.title}) is already being processed, skipping duplicate call`);
          resolve();
          return;
        }

        // Mark this page as being processed immediately to prevent race conditions
        // This ensures that if multiple calls happen nearly simultaneously, only one proceeds
        activeContentRequests.set(page.id, true);

        // Validate repo info
        if (!owner || !repo) {
          throw new Error('Invalid repository information. Owner and repo name are required.');
        }

        // Mark page as in progress
        setPagesInProgress(prev => new Set(prev).add(page.id));
        // Don't set loading message for individual pages during queue processing

        const filePaths = page.filePaths;

        // Store the initially generated content BEFORE rendering/potential modification
        setGeneratedPages(prev => ({
          ...prev,
          [page.id]: { ...page, content: 'Loading...' } // Placeholder
        }));
        setOriginalMarkdown(prev => ({ ...prev, [page.id]: '' })); // Clear previous original

        // Make API call to generate page content
        console.log(`Starting content generation for page: ${page.title}`);

        // Get repository URL
        const repoUrl = getRepoUrl(owner, repo, repoInfo.type, repoInfo.localPath);

        // Create the prompt content - simplified to avoid message dialogs
        const promptContent =
`Generate comprehensive wiki page content for "${page.title}" in the repository ${owner}/${repo}.

This page should focus on the following files:
${filePaths.map(path => `- ${path}`).join('\n')}

IMPORTANT: Generate the content in ${language === 'en' ? 'English' :
            language === 'ja' ? 'Japanese (日本語)' :
            language === 'zh' ? 'Mandarin Chinese (中文)' :
            language === 'es' ? 'Spanish (Español)' : 
            language === 'kr' ? 'Korean (한국어)' : 
            language === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English'} language.

Include:
- Clear introduction explaining what "${page.title}" is
- Explanation of purpose and functionality
- Code snippets when helpful (less than 20 lines)
- At least one Mermaid diagram [Flow or Sequence] (use "graph TD" for vertical orientation)
- Proper markdown formatting with code blocks and headings
- Source links to relevant files: Eample: <p>Sources: <a href="https://github.com/AsyncFuncAI/deepwiki-open/blob/main/api/rag.py" target="_blank" rel="noopener noreferrer" class="mb-1 mr-1 inline-flex items-stretch font-mono text-xs !no-underline">SOURCE_DISPLAY</a></p>5. Explicitly explain how this component/feature integrates with the overall architecture


Use proper markdown formatting for code blocks and include a vertical Mermaid diagram.

### Mermaid Diagrams:
1. MANDATORY: Include AT LEAST ONE relevant Mermaid diagram, most people prefer sequence diagrams if applicable.
2. CRITICAL: All diagrams MUST follow strict vertical orientation:
   - Use "graph TD" (top-down) directive for flow diagrams
   - NEVER use "graph LR" (left-right)
   - Maximum node width should be 3-4 words
   - Example:
     \`\`\`mermaid
     graph TD
       A[Start Process] --> B[Middle Step]
       B --> C[End Result]
     \`\`\`

3. Flow Diagram Requirements:
   - Use descriptive node IDs (e.g., UserAuth, DataProcess)
   - ALL connections MUST use double dashes with arrows (-->)
   - NEVER use single dash connections
   - Add clear labels to connections when necessary: A -->|triggers| B
   - Use appropriate node shapes based on type:
     - Rectangle [Text] for components/modules
     - Stadium ([Text]) for inputs/starting points
     - Circle((Text)) for junction points
     - Rhombus{Text} for decision points

4. Sequence Diagram Requirements:
   - Start with "sequenceDiagram" directive on its own line
   - Define ALL participants at the beginning
   - Use descriptive but concise participant names
   - Use the correct arrow types:
     - ->> for request/asynchronous messages
     - -->> for response messages
     - -x for failed messages
   - Include activation boxes using +/- notation
   - Add notes for clarification using "Note over" or "Note right of"
`;

        // Prepare request body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestBody: Record<string, any> = {
          repo_url: repoUrl,
          messages: [{
            role: 'user',
            content: promptContent
          }]
        };

        // Add tokens if available
        addTokensToRequestBody(requestBody, githubToken, gitlabToken, bitbucketToken, repoInfo.type, selectedProviderState, selectedModelState, isCustomSelectedModelState, customSelectedModelState, language, modelExcludedDirs, modelExcludedFiles);

        const response = await fetch(`/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          console.error(`API error (${response.status}): ${errorText}`);
          throw new Error(`Error generating page content: ${response.status} - ${response.statusText}`);
        }

        // Process the response
        let content = '';
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value, { stream: true });
          }
          // Ensure final decoding
          content += decoder.decode();
        } catch (readError) {
          console.error('Error reading stream:', readError);
          throw new Error('Error processing response stream');
        }

        // Clean up markdown delimiters
        content = content.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '');

        console.log(`Received content for ${page.title}, length: ${content.length} characters`);

        // Store the FINAL generated content
        const updatedPage = { ...page, content };
        setGeneratedPages(prev => ({ ...prev, [page.id]: updatedPage }));
        // Store this as the original for potential mermaid retries
        setOriginalMarkdown(prev => ({ ...prev, [page.id]: content }));

        resolve();
      } catch (err) {
        console.error(`Error generating content for page ${page.id}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        // Update page state to show error
        setGeneratedPages(prev => ({
          ...prev,
          [page.id]: { ...page, content: `Error generating content: ${errorMessage}` }
        }));
        setError(`Failed to generate content for ${page.title}.`);
        resolve(); // Resolve even on error to unblock queue
      } finally {
        // Clear the processing flag for this page
        // This must happen in the finally block to ensure the flag is cleared
        // even if an error occurs during processing
        activeContentRequests.delete(page.id);

        // Mark page as done
        setPagesInProgress(prev => {
          const next = new Set(prev);
          next.delete(page.id);
          return next;
        });
        setLoadingMessage(undefined); // Clear specific loading message
      }
    });
  }, [generatedPages, githubToken, gitlabToken, bitbucketToken, repoInfo.type, repoInfo.localPath, selectedProviderState, selectedModelState, isCustomSelectedModelState, customSelectedModelState, modelExcludedDirs, modelExcludedFiles, language, activeContentRequests]);

  // Determine the wiki structure from repository data
  const determineWikiStructure = useCallback(async (fileTree: string, readme: string, owner: string, repo: string) => {
    if (!owner || !repo) {
      setError('Invalid repository information. Owner and repo name are required.');
      setIsLoading(false);
      return;
    }

    // Skip if structure request is already in progress
    if (structureRequestInProgress) {
      console.log('Wiki structure determination already in progress, skipping duplicate call');
      return;
    }

    try {
      setStructureRequestInProgress(true);
      setLoadingMessage(messages.loading?.determiningStructure || 'Determining wiki structure...');

      // Get repository URL
      const repoUrl = getRepoUrl(owner, repo, repoInfo.type, repoInfo.localPath);

      // Prepare request body
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: Record<string, any> = {
        repo_url: repoUrl,
        messages: [{
          role: 'user',
          content: `Analyze this GitHub repository ${owner}/${repo} and create a wiki structure for it.

1. The complete file tree of the project:
<file_tree>
${fileTree}
</file_tree>

2. The README file of the project:
<readme>
${readme}
</readme>

I want to create a wiki for this repository. Determine the most logical structure for a wiki based on the repository's content.

IMPORTANT: The wiki content will be generated in ${language === 'en' ? 'English' :
            language === 'ja' ? 'Japanese (日本語)' :
            language === 'zh' ? 'Mandarin Chinese (中文)' :
            language === 'es' ? 'Spanish (Español)' : 
            language === 'kr' ? 'Korean (한국어)' : 
            language === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English'} language.

When designing the wiki structure, include pages that would benefit from visual diagrams, such as:
- Architecture overviews
- Data flow descriptions
- Component relationships
- Process workflows
- State machines
- Class hierarchies

Return your analysis in the following XML format:

<wiki_structure>
  <title>[Overall title for the wiki]</title>
  <description>[Brief description of the repository]</description>
  <pages>
    <page id="page-1">
      <title>[Page title]</title>
      <description>[Brief description of what this page will cover]</description>
      <importance>high|medium|low</importance>
      <relevant_files>
        <file_path>[Path to a relevant file]</file_path>
        <!-- More file paths as needed -->
      </relevant_files>
      <related_pages>
        <related>page-2</related>
        <!-- More related page IDs as needed -->
      </related_pages>
    </page>
    <!-- More pages as needed -->
  </pages>
</wiki_structure>

IMPORTANT FORMATTING INSTRUCTIONS:
- Return ONLY the valid XML structure specified above
- DO NOT wrap the XML in markdown code blocks (no \`\`\` or \`\`\`xml)
- DO NOT include any explanation text before or after the XML
- Ensure the XML is properly formatted and valid
- Start directly with <wiki_structure> and end with </wiki_structure>

IMPORTANT:
1. Create 4-6 pages that would make a comprehensive wiki for this repository
2. Each page should focus on a specific aspect of the codebase (e.g., architecture, key features, setup)
3. The relevant_files should be actual files from the repository that would be used to generate that page
4. Return ONLY valid XML with the structure specified above, with no markdown code block delimiters`
        }] 
      };

      // Add tokens if available
      addTokensToRequestBody(requestBody, githubToken, gitlabToken, bitbucketToken, repoInfo.type, selectedProviderState, selectedModelState, isCustomSelectedModelState, customSelectedModelState, language, modelExcludedDirs, modelExcludedFiles);

      const response = await fetch(`/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Error determining wiki structure: ${response.status}`);
      }

      // Process the response
      let responseText = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseText += decoder.decode(value, { stream: true });
      }

      // Clean up markdown delimiters
      responseText = responseText.replace(/^```(?:xml)?\s*/i, '').replace(/```\s*$/i, '');

      // Extract wiki structure from response
      const xmlMatch = responseText.match(/<wiki_structure>[\s\S]*?<\/wiki_structure>/m);
      if (!xmlMatch) {
        throw new Error('No valid XML found in response');
      }

      let xmlText = xmlMatch[0];
      xmlText = xmlText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Try parsing with DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        // Log the first few elements to see what was parsed
        const elements = xmlDoc.querySelectorAll('*');
        if (elements.length > 0) {
          console.log('First 5 element names:',
            Array.from(elements).slice(0, 5).map(el => el.nodeName).join(', '));
        }

        // We'll continue anyway since the XML might still be usable
      }

      // Extract wiki structure
      let title = '';
      let description = '';
      let pages: WikiPage[] = [];

      // Try using DOM parsing first
      const titleEl = xmlDoc.querySelector('title');
      const descriptionEl = xmlDoc.querySelector('description');
      const pagesEls = xmlDoc.querySelectorAll('page');

      title = titleEl ? titleEl.textContent || '' : '';
      description = descriptionEl ? descriptionEl.textContent || '' : '';

      // Parse pages using DOM
      pages = [];

      if (parseError && (!pagesEls || pagesEls.length === 0)) {
        console.warn('DOM parsing failed, trying regex fallback');
      }

      pagesEls.forEach(pageEl => {
        const id = pageEl.getAttribute('id') || `page-${pages.length + 1}`;
        const titleEl = pageEl.querySelector('title');
        const importanceEl = pageEl.querySelector('importance');
        const filePathEls = pageEl.querySelectorAll('file_path');
        const relatedEls = pageEl.querySelectorAll('related');

        const title = titleEl ? titleEl.textContent || '' : '';
        const importance = importanceEl ?
          (importanceEl.textContent === 'high' ? 'high' :
            importanceEl.textContent === 'medium' ? 'medium' : 'low') : 'medium';

        const filePaths: string[] = [];
        filePathEls.forEach(el => {
          if (el.textContent) filePaths.push(el.textContent);
        });

        const relatedPages: string[] = [];
        relatedEls.forEach(el => {
          if (el.textContent) relatedPages.push(el.textContent);
        });

        pages.push({
          id,
          title,
          content: '', // Will be generated later
          filePaths,
          importance,
          relatedPages
        });
      });

      // Create wiki structure
      const wikiStructure: WikiStructure = {
        id: 'wiki',
        title,
        description,
        pages
      };

      setWikiStructure(wikiStructure);
      setCurrentPageId(pages.length > 0 ? pages[0].id : undefined);

      // Start generating content for all pages with controlled concurrency
      if (pages.length > 0) {
        // Mark all pages as in progress
        const initialInProgress = new Set(pages.map(p => p.id));
        setPagesInProgress(initialInProgress);

        console.log(`Starting generation for ${pages.length} pages with controlled concurrency`);

        // Maximum concurrent requests
        const MAX_CONCURRENT = 1;

        // Create a queue of pages
        const queue = [...pages];
        let activeRequests = 0;

        // Function to process next items in queue
        const processQueue = () => {
          // Process as many items as we can up to our concurrency limit
          while (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
            const page = queue.shift();
            if (page) {
              activeRequests++;
              console.log(`Starting page ${page.title} (${activeRequests} active, ${queue.length} remaining)`);

              // Start generating content for this page
              generatePageContent(page, owner, repo)
                .finally(() => {
                  // When done (success or error), decrement active count and process more
                  activeRequests--;
                  console.log(`Finished page ${page.title} (${activeRequests} active, ${queue.length} remaining)`);

                  // Check if all work is done (queue empty and no active requests)
                  if (queue.length === 0 && activeRequests === 0) {
                    console.log("All page generation tasks completed.");
                    setIsLoading(false);
                    setLoadingMessage(undefined);
                  } else {
                    // Only process more if there are items remaining and we're under capacity
                    if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
                      processQueue();
                    }
                  }
                });
            }
          }

          // Additional check: If the queue started empty or becomes empty and no requests were started/active
          if (queue.length === 0 && activeRequests === 0 && pages.length > 0 && pagesInProgress.size === 0) {
            // This handles the case where the queue might finish before the finally blocks fully update activeRequests
            // or if the initial queue was processed very quickly
            console.log("Queue empty and no active requests after loop, ensuring loading is false.");
            setIsLoading(false);
            setLoadingMessage(undefined);
          } else if (pages.length === 0) {
            // Handle case where there were no pages to begin with
            setIsLoading(false);
            setLoadingMessage(undefined);
          }
        };

        // Start processing the queue
        processQueue();
      } else {
        // Set loading to false if there were no pages found
        setIsLoading(false);
        setLoadingMessage(undefined);
      }

    } catch (error) {
      console.error('Error determining wiki structure:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoadingMessage(undefined);
    } finally {
      setStructureRequestInProgress(false);
    }
  }, [generatePageContent, githubToken, gitlabToken, bitbucketToken, repoInfo.type, repoInfo.localPath, pagesInProgress.size, structureRequestInProgress, selectedProviderState, selectedModelState, isCustomSelectedModelState, customSelectedModelState, modelExcludedDirs, modelExcludedFiles, language, messages.loading]);

  // Fetch repository structure using GitHub or GitLab API
  const fetchRepositoryStructure = useCallback(async () => {
    // If a request is already in progress, don't start another one
    if (requestInProgress) {
      console.log('Repository fetch already in progress, skipping duplicate call');
      return;
    }

    // Reset previous state
    setWikiStructure(undefined);
    setCurrentPageId(undefined);
    setGeneratedPages({});
    setPagesInProgress(new Set());
    setError(null);

    try {
      // Set the request in progress flag
      setRequestInProgress(true);

      // Update loading state
      setIsLoading(true);
      setLoadingMessage(messages.loading?.fetchingStructure || 'Fetching repository structure...');

      let fileTreeData = '';
      let readmeContent = '';

      if (repoInfo.type === 'local' && repoInfo.localPath) {
        try {
          const response = await fetch(`/local_repo/structure?path=${encodeURIComponent(repoInfo.localPath)}`);

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Local repository API error (${response.status}): ${errorData}`);
          }

          const data = await response.json();
          fileTreeData = data.file_tree;
          readmeContent = data.readme;
        } catch (err) {
          throw err;
        }
      } else if (repoInfo.type === 'github') {
        // GitHub API approach
        // Try to get the tree data for common branch names
        let treeData = null;
        let apiErrorDetails = '';

        for (const branch of ['main', 'master']) {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
          const headers = createGithubHeaders(githubToken);

          console.log(`Fetching repository structure from branch: ${branch}`);
          try {
            const response = await fetch(apiUrl, {
              headers
            });

            if (response.ok) {
              treeData = await response.json();
              console.log('Successfully fetched repository structure');
              break;
            } else {
              const errorData = await response.text();
              apiErrorDetails = `Status: ${response.status}, Response: ${errorData}`;
              console.error(`Error fetching repository structure: ${apiErrorDetails}`);
            }
          } catch (err) {
            console.error(`Network error fetching branch ${branch}:`, err);
          }
        }

        if (!treeData || !treeData.tree) {
          if (apiErrorDetails) {
            throw new Error(`Could not fetch repository structure. API Error: ${apiErrorDetails}`);
          } else {
            throw new Error('Could not fetch repository structure. Repository might not exist, be empty or private.');
          }
        }

        // Convert tree data to a string representation
        fileTreeData = treeData.tree
          .filter((item: { type: string; path: string }) => item.type === 'blob')
          .map((item: { type: string; path: string }) => item.path)
          .join('\n');

        // Try to fetch README.md content
        try {
          const headers = createGithubHeaders(githubToken);

          const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers
          });

          if (readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            readmeContent = atob(readmeData.content);
          } else {
            console.warn(`Could not fetch README.md, status: ${readmeResponse.status}`);
          }
        } catch (err) {
          console.warn('Could not fetch README.md, continuing with empty README', err);
        }
      }
      else if (repoInfo.type === 'gitlab') {
        // GitLab API approach
        const projectPath = `${owner}/${repo}`;
        const encodedProjectPath = encodeURIComponent(projectPath);

        // Try to get the file tree for common branch names
        let filesData = null;
        let apiErrorDetails = '';
        let defaultBranch = '';
        const headers = createGitlabHeaders(gitlabToken);

        // First get project info to determine default branch
        const projectInfoUrl = `https://gitlab.com/api/v4/projects/${encodedProjectPath}`;
        console.log(`Fetching GitLab project info: ${projectInfoUrl}`);
        try {
          const response = await fetch(projectInfoUrl, { headers });

          if (response.ok) {
            const projectData = await response.json();
            defaultBranch = projectData.default_branch;

            const apiUrl = `https://gitlab.com/api/v4/projects/${encodedProjectPath}/repository/tree?recursive=true&ref=${defaultBranch}&per_page=100`;
            try {
              const response = await fetch(apiUrl, {
                headers
              });

              if (response.ok) {
                filesData = await response.json();
              } else {
                const errorData = await response.text();
                apiErrorDetails = `Status: ${response.status}, Response: ${errorData}`;
                console.error(`Error fetching GitLab repository structure: ${apiErrorDetails}`);
              }
            } catch (err) {
              console.error(`Network error fetching GitLab branch ${defaultBranch}:`, err);
            }
          } else {
            const errorData = await response.text();
            apiErrorDetails = `Status: ${response.status}, Response: ${errorData}`;
            console.error(`Error fetching GitLab project info: ${apiErrorDetails}`);
          }
        } catch (err) {
          console.error("Network error fetching GitLab project info:", err);
        }

        if (!filesData || !Array.isArray(filesData) || filesData.length === 0) {
          if (apiErrorDetails) {
            throw new Error(`Could not fetch repository structure. GitLab API Error: ${apiErrorDetails}`);
          } else {
            throw new Error('Could not fetch repository structure. Repository might not exist, be empty or private.');
          }
        }

        // Convert files data to a string representation
        fileTreeData = filesData
          .filter((item: { type: string; path: string }) => item.type === 'blob')
          .map((item: { type: string; path: string }) => item.path)
          .join('\n');

        // Try to fetch README.md content
        try {
          for (const branch of ['main', 'master']) {
            const readmeUrl = `https://gitlab.com/api/v4/projects/${encodedProjectPath}/repository/files/README.md/raw?ref=${branch}`;
            const headers = createGitlabHeaders(gitlabToken);

            try {
              const readmeResponse = await fetch(readmeUrl, {
                headers
              });

              if (readmeResponse.ok) {
                readmeContent = await readmeResponse.text();
                console.log('Successfully fetched GitLab README.md');
                break;
              } else {
                console.warn(`Could not fetch GitLab README.md for branch ${branch}, status: ${readmeResponse.status}`);
              }
            } catch (err) {
              console.warn(`Error fetching GitLab README.md for branch ${branch}:`, err);
            }
          }
        } catch (err) {
          console.warn('Could not fetch GitLab README.md, continuing with empty README', err);
        }
      }
      else if (repoInfo.type === 'bitbucket') {
        // Bitbucket API approach
        const repoPath = `${owner}/${repo}`;
        const encodedRepoPath = encodeURIComponent(repoPath);

        // Try to get the file tree for common branch names
        let filesData = null;
        let apiErrorDetails = '';
        let defaultBranch = '';
        const headers = createBitbucketHeaders(bitbucketToken);

        // First get project info to determine default branch
        const projectInfoUrl = `https://api.bitbucket.org/2.0/repositories/${encodedRepoPath}`;
        try {
          const response = await fetch(projectInfoUrl, { headers });

          const responseText = await response.text();

          if (response.ok) {
            const projectData = JSON.parse(responseText);
            defaultBranch = projectData.mainbranch.name;

            const apiUrl = `https://api.bitbucket.org/2.0/repositories/${encodedRepoPath}/src/${defaultBranch}/?recursive=true&per_page=100`;
            try {
              const response = await fetch(apiUrl, {
                headers
              });

              const structureResponseText = await response.text();

              if (response.ok) {
                filesData = JSON.parse(structureResponseText);
              } else {
                const errorData = structureResponseText;
                apiErrorDetails = `Status: ${response.status}, Response: ${errorData}`;
              }
            } catch (err) {
              console.error(`Network error fetching Bitbucket branch ${defaultBranch}:`, err);
            }
          } else {
            const errorData = responseText;
            apiErrorDetails = `Status: ${response.status}, Response: ${errorData}`;
          }
        } catch (err) {
          console.error("Network error fetching Bitbucket project info:", err);
        }

        if (!filesData || !Array.isArray(filesData.values) || filesData.values.length === 0) {
          if (apiErrorDetails) {
            throw new Error(`Could not fetch repository structure. Bitbucket API Error: ${apiErrorDetails}`);
          } else {
            throw new Error('Could not fetch repository structure. Repository might not exist, be empty or private.');
          }
        }

        // Convert files data to a string representation
        fileTreeData = filesData.values
          .filter((item: { type: string; path: string }) => item.type === 'commit_file')
          .map((item: { type: string; path: string }) => item.path)
          .join('\n');

        // Try to fetch README.md content
        try {
          const headers = createBitbucketHeaders(bitbucketToken);

          const readmeResponse = await fetch(`https://api.bitbucket.org/2.0/repositories/${encodedRepoPath}/src/${defaultBranch}/README.md`, {
            headers
          });

          if (readmeResponse.ok) {
            readmeContent = await readmeResponse.text();
          } else {
            console.warn(`Could not fetch Bitbucket README.md, status: ${readmeResponse.status}`);
          }
        } catch (err) {
          console.warn('Could not fetch Bitbucket README.md, continuing with empty README', err);
        }
      }

      // Now determine the wiki structure
      await determineWikiStructure(fileTreeData, readmeContent, owner, repo);

    } catch (error) {
      console.error('Error fetching repository structure:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoadingMessage(undefined);
    } finally {
      // Reset the request in progress flag
      setRequestInProgress(false);
    }
  }, [owner, repo, determineWikiStructure, githubToken, gitlabToken, bitbucketToken, repoInfo.type, repoInfo.localPath, requestInProgress, messages.loading]);

  // Function to export wiki content
  const exportWiki = useCallback(async (format: 'markdown' | 'json') => {
    if (!wikiStructure || Object.keys(generatedPages).length === 0) {
      setExportError('No wiki content to export');
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);
      setLoadingMessage(`${language === 'ja' ? 'Wikiを' : 'Exporting wiki as '} ${format} ${language === 'ja' ? 'としてエクスポート中...' : '...'}`);

      // Prepare the pages for export
      const pagesToExport = wikiStructure.pages.map(page => {
        // Use the generated content if available, otherwise use an empty string
        const content = generatedPages[page.id]?.content || 'Content not generated';
        return {
          ...page,
          content
        };
      });

      // Get repository URL
      const repoUrl = getRepoUrl(repoInfo.owner, repoInfo.repo, repoInfo.type, repoInfo.localPath);

      // Make API call to export wiki
      const response = await fetch(`/export/wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          pages: pagesToExport,
          format
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        throw new Error(`Error exporting wiki: ${response.status} - ${errorText}`);
      }

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${repoInfo.repo}_wiki.${format === 'markdown' ? 'md' : 'json'}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }

      // Convert the response to a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error exporting wiki:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during export';
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
      setLoadingMessage(undefined);
    }
  }, [wikiStructure, generatedPages, repoInfo, language]);

  // 显示模型选项
  const handleRefreshWiki = useCallback(() => {
    setShowModelOptions(true);
  }, []);

  const confirmRefresh = useCallback(async () => {
    setShowModelOptions(false);
    setLoadingMessage(messages.loading?.clearingCache || 'Clearing server cache...');
    setIsLoading(true); // Show loading indicator immediately

    try {
      const params = new URLSearchParams({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        repo_type: repoInfo.type,
        language: language,
        provider: selectedProviderState,
        model: selectedModelState,
        is_custom_model: isCustomSelectedModelState.toString(),
        custom_model: customSelectedModelState,
      });
      
      // Add file filters configuration
      if (modelExcludedDirs) {
        params.append('excluded_dirs', modelExcludedDirs);
      }
      if (modelExcludedFiles) {
        params.append('excluded_files', modelExcludedFiles);
      }
      const response = await fetch(`/api/wiki_cache?${params.toString()}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Server-side wiki cache cleared successfully.');
        // Optionally, show a success message for cache clearing if desired
        // setLoadingMessage('Cache cleared. Refreshing wiki...');
      } else {
        const errorText = await response.text();
        console.warn(`Failed to clear server-side wiki cache (status: ${response.status}): ${errorText}. Proceeding with refresh anyway.`);
        // Optionally, inform the user about the cache clear failure but that refresh will still attempt
        // setError(\`Cache clear failed: ${errorText}. Trying to refresh...\`);
      }
    } catch (err) {
      console.warn('Error calling DELETE /api/wiki_cache:', err);
      // Optionally, inform the user about the cache clear error
      // setError(\`Error clearing cache: ${err instanceof Error ? err.message : String(err)}. Trying to refresh...\`);
    }

    // Proceed with the rest of the refresh logic
    console.log('Refreshing wiki. Server cache will be overwritten upon new generation if not cleared.');

    // Clear the localStorage cache (if any remnants or if it was used before this change)
    const localStorageCacheKey = getCacheKey(repoInfo.owner, repoInfo.repo, repoInfo.type, language);
    localStorage.removeItem(localStorageCacheKey);

    // Reset cache loaded flag
    cacheLoadedSuccessfully.current = false;
    effectRan.current = false; // Allow the main data loading useEffect to run again

    // Reset all state
    setWikiStructure(undefined);
    setCurrentPageId(undefined);
    setGeneratedPages({});
    setPagesInProgress(new Set());
    setError(null);
    setIsLoading(true); // Set loading state for refresh
    setLoadingMessage(messages.loading?.initializing || 'Initializing wiki generation...');

    // Clear any in-progress requests for page content
    activeContentRequests.clear();
    // Reset flags related to request processing if they are component-wide
    setStructureRequestInProgress(false); // Assuming this flag should be reset
    setRequestInProgress(false); // Assuming this flag should be reset

    // Explicitly trigger the data loading process again by re-invoking what the main useEffect does.
    // This will first attempt to load from (now hopefully non-existent or soon-to-be-overwritten) server cache, 
    // then proceed to fetchRepositoryStructure if needed.
    // To ensure fetchRepositoryStructure is called if cache is somehow still there or to force a full refresh:
    // One option is to directly call fetchRepositoryStructure() if force refresh means bypassing cache check.
    // For now, we rely on the standard loadData flow initiated by resetting effectRan and dependencies.
    // This will re-trigger the main data loading useEffect.
    // No direct call to fetchRepositoryStructure here, let the useEffect handle it based on effectRan.current = false.
  }, [repoInfo.owner, repoInfo.repo, repoInfo.type, language, messages.loading, activeContentRequests, selectedProviderState, selectedModelState, isCustomSelectedModelState, customSelectedModelState, modelExcludedDirs, modelExcludedFiles]);

  // Start wiki generation when component mounts
  useEffect(() => {
    if (effectRan.current === false) {
      effectRan.current = true; // Set to true immediately to prevent re-entry due to StrictMode

      const loadData = async () => {
        // Try loading from server-side cache first
        setLoadingMessage(messages.loading?.fetchingCache || 'Checking for cached wiki...');
        try {
          const params = new URLSearchParams({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            repo_type: repoInfo.type,
            language: language,
          });
          const response = await fetch(`/api/wiki_cache?${params.toString()}`);

          if (response.ok) {
            const cachedData = await response.json(); // Returns null if no cache
            if (cachedData && cachedData.wiki_structure && cachedData.generated_pages && Object.keys(cachedData.generated_pages).length > 0) {
              console.log('Using server-cached wiki data');
              setWikiStructure(cachedData.wiki_structure);
              setGeneratedPages(cachedData.generated_pages);
              setCurrentPageId(cachedData.wiki_structure.pages.length > 0 ? cachedData.wiki_structure.pages[0].id : undefined);
              setIsLoading(false);
              setLoadingMessage(undefined);
              cacheLoadedSuccessfully.current = true;
              return; // Exit if cache is successfully loaded
            } else {
              console.log('No valid wiki data in server cache or cache is empty.');
            }
          } else {
            // Log error but proceed to fetch structure, as cache is optional
            console.error('Error fetching wiki cache from server:', response.status, await response.text());
          }
        } catch (error) {
          console.error('Error loading from server cache:', error);
          // Proceed to fetch structure if cache loading fails
        }

        // If we reached here, either there was no cache, it was invalid, or an error occurred
        // Proceed to fetch repository structure
        fetchRepositoryStructure();
      };

      loadData();

    } else {
      console.log('Skipping duplicate repository fetch/cache check');
    }

    // Clean up function for this effect is not strictly necessary for loadData, 
    // but keeping the main unmount cleanup in the other useEffect
  }, [repoInfo.owner, repoInfo.repo, repoInfo.type, language, fetchRepositoryStructure, messages.loading?.fetchingCache]);

  // Save wiki to server-side cache when generation is complete
  useEffect(() => {
    const saveCache = async () => {
      if (!isLoading && 
          !error && 
          wikiStructure && 
          Object.keys(generatedPages).length > 0 &&
          Object.keys(generatedPages).length >= wikiStructure.pages.length &&
          !cacheLoadedSuccessfully.current) {
        
        const allPagesHaveContent = wikiStructure.pages.every(page => 
          generatedPages[page.id] && generatedPages[page.id].content && generatedPages[page.id].content !== 'Loading...');
        
        if (allPagesHaveContent) {
          console.log('Attempting to save wiki data to server cache via Next.js proxy');
          
          try {
            const dataToCache = {
              owner: repoInfo.owner,
              repo: repoInfo.repo,
              repo_type: repoInfo.type,
              language: language,
              wiki_structure: wikiStructure,
              generated_pages: generatedPages
            };
            const response = await fetch(`/api/wiki_cache`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(dataToCache),
            });

            if (response.ok) {
              console.log('Wiki data successfully saved to server cache');
            } else {
              console.error('Error saving wiki data to server cache:', response.status, await response.text());
            }
          } catch (error) {
            console.error('Error saving to server cache:', error);
          }
        }
      }
    };

    saveCache();
  }, [isLoading, error, wikiStructure, generatedPages, repoInfo.owner, repoInfo.repo, repoInfo.type, language]);

  const handlePageSelect = (pageId: string) => {
    if (currentPageId != pageId) {
      setCurrentPageId(pageId)
    }
  };

  const [isModelSelectionModalOpen, setIsModelSelectionModalOpen] = useState(false);

  return (
    <div className="h-screen paper-texture p-4 md:p-8 flex flex-col">
      <style>{wikiStyles}</style>

      <header className="max-w-6xl mx-auto mb-8 h-fit w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[var(--accent-primary)] hover:text-[var(--highlight)] flex items-center gap-1.5 transition-colors border-b border-[var(--border-color)] hover:border-[var(--accent-primary)] pb-0.5">
              <FaHome /> {messages.repoPage?.home || 'Home'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[var(--card-bg)] rounded-lg shadow-custom card-japanese">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-[var(--accent-primary)]/10 rounded-full blur-md animate-pulse"></div>
              <div className="relative flex items-center justify-center">
                <div className="w-3 h-3 bg-[var(--accent-primary)]/70 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-75 mx-2"></div>
                <div className="w-3 h-3 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
            <p className="text-[var(--foreground)] text-center mb-3 font-serif">
              {loadingMessage || messages.common?.loading || 'Loading...'}
              {isExporting && (messages.loading?.preparingDownload || ' Please wait while we prepare your download...')}
            </p>

            {/* Progress bar for page generation */}
            {wikiStructure && (
              <div className="w-full max-w-md mt-3">
                <div className="bg-[var(--background)]/50 rounded-full h-2 mb-3 overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${Math.max(5, 100 * (wikiStructure.pages.length - pagesInProgress.size) / wikiStructure.pages.length)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--muted)] text-center">
                  {language === 'ja'
                    ? `${wikiStructure.pages.length}ページ中${wikiStructure.pages.length - pagesInProgress.size}ページ完了`
                    : messages.repoPage?.pagesCompleted
                        ? messages.repoPage.pagesCompleted
                            .replace('{completed}', (wikiStructure.pages.length - pagesInProgress.size).toString())
                            .replace('{total}', wikiStructure.pages.length.toString())
                        : `${wikiStructure.pages.length - pagesInProgress.size} of ${wikiStructure.pages.length} pages completed`}
                </p>

                {/* Show list of in-progress pages */}
                {pagesInProgress.size > 0 && (
                  <div className="mt-4 text-xs">
                    <p className="text-[var(--muted)] mb-2">
                      {messages.repoPage?.currentlyProcessing || 'Currently processing:'}
                    </p>
                    <ul className="text-[var(--foreground)] space-y-1">
                      {Array.from(pagesInProgress).slice(0, 3).map(pageId => {
                        const page = wikiStructure.pages.find(p => p.id === pageId);
                        return page ? <li key={pageId} className="truncate border-l-2 border-[var(--accent-primary)]/30 pl-2">{page.title}</li> : null;
                      })}
                      {pagesInProgress.size > 3 && (
                        <li className="text-[var(--muted)]">
                          {language === 'ja'
                            ? `...他に${pagesInProgress.size - 3}ページ`
                            : messages.repoPage?.andMorePages
                                ? messages.repoPage.andMorePages.replace('{count}', (pagesInProgress.size - 3).toString())
                                : `...and ${pagesInProgress.size - 3} more`}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : error ? (
          <div className="bg-[var(--highlight)]/5 border border-[var(--highlight)]/30 rounded-lg p-5 mb-4 shadow-sm">
            <div className="flex items-center text-[var(--highlight)] mb-3">
              <FaExclamationTriangle className="mr-2" />
              <span className="font-bold font-serif">{messages.repoPage?.errorTitle || messages.common?.error || 'Error'}</span>
            </div>
            <p className="text-[var(--foreground)] text-sm mb-3">{error}</p>
            <p className="text-[var(--muted)] text-xs">
              {messages.repoPage?.errorMessageDefault || 'Please check that your repository exists and is public. Valid formats are "owner/repo", "https://github.com/owner/repo", "https://gitlab.com/owner/repo", "https://bitbucket.org/owner/repo", or local folder paths like "C:\\path\\to\\folder" or "/path/to/folder".'}
            </p>
            <div className="mt-5">
              <Link
                href="/"
                className="btn-japanese px-5 py-2 inline-flex items-center gap-1.5"
              >
                <FaHome className="text-sm" />
                {messages.repoPage?.backToHome || 'Back to Home'}
              </Link>
            </div>
          </div>
        ) : wikiStructure ? (
          <div className="h-full overflow-y-auto flex flex-col lg:flex-row gap-4 w-full overflow-hidden bg-[var(--card-bg)] rounded-lg shadow-custom card-japanese">
            {/* Wiki Navigation */}
            <div className="h-full w-full lg:w-80 flex-shrink-0 bg-[var(--background)]/50 rounded-lg rounded-r-none p-5 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-3 font-serif">{wikiStructure.title}</h3>
              <p className="text-[var(--muted)] text-sm mb-5 leading-relaxed">{wikiStructure.description}</p>

              {/* Display repository info */}
              <div className="text-xs text-[var(--muted)] mb-5 flex items-center">
                {repoInfo.type === 'local' ? (
                  <div className="flex items-center">
                    <FaFolder className="mr-2" />
                    <span className="break-all">{repoInfo.localPath}</span>
                  </div>
                ) : (
                  <>
                    {repoInfo.type === 'github' ? (
                      <FaGithub className="mr-2" />
                    ) : repoInfo.type === 'gitlab' ? (
                      <FaGitlab className="mr-2" />
                    ) : (
                      <FaBitbucket className="mr-2" />
                    )}
                    <a
                      href={repoInfo.type === 'github'
                        ? `https://github.com/${repoInfo.owner}/${repoInfo.repo}`
                        : repoInfo.type === 'gitlab'
                        ? `https://gitlab.com/${repoInfo.owner}/${repoInfo.repo}`
                        : `https://bitbucket.org/${repoInfo.owner}/${repoInfo.repo}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--accent-primary)] transition-colors border-b border-[var(--border-color)] hover:border-[var(--accent-primary)]"
                    >
                      {repoInfo.owner}/{repoInfo.repo}
                    </a>
                  </>
                )}
              </div>

              {/* Refresh Wiki button */}
              <div className="mb-5">
                <button
                  onClick={() => setIsModelSelectionModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center w-full text-xs px-3 py-2 bg-[var(--background)] text-[var(--foreground)] rounded-md hover:bg-[var(--background)]/80 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--border-color)] transition-colors hover:cursor-pointer"
                >
                  <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {messages.repoPage?.refreshWiki || 'Refresh Wiki'}
                </button>
              </div>

              {/* Export buttons */}
              {Object.keys(generatedPages).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 font-serif">
                    {messages.repoPage?.exportWiki || 'Export Wiki'}
                  </h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => exportWiki('markdown')}
                      disabled={isExporting}
                      className="btn-japanese flex items-center text-xs px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaDownload className="mr-2" />
                      {messages.repoPage?.exportAsMarkdown || 'Export as Markdown'}
                    </button>
                    <button
                      onClick={() => exportWiki('json')}
                      disabled={isExporting}
                      className="flex items-center text-xs px-3 py-2 bg-[var(--background)] text-[var(--foreground)] rounded-md hover:bg-[var(--background)]/80 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--border-color)] transition-colors"
                    >
                      <FaFileExport className="mr-2" />
                      {messages.repoPage?.exportAsJson || 'Export as JSON'}
                    </button>
                  </div>
                  {exportError && (
                    <div className="mt-2 text-xs text-[var(--highlight)]">
                      {exportError}
                    </div>
                  )}
                </div>
              )}

              <h4 className="text-md font-semibold text-[var(--foreground)] mb-3 font-serif">
                {messages.repoPage?.pages || 'Pages'}
              </h4>
              <ul className="space-y-2">
                {wikiStructure.pages.map(page => (
                  <li key={page.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${currentPageId === page.id
                          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                          : 'text-[var(--foreground)] hover:bg-[var(--background)] border border-transparent'
                        }`}
                      onClick={() => handlePageSelect(page.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                          page.importance === 'high'
                            ? 'bg-[#9b7cb9]'
                            : page.importance === 'medium'
                              ? 'bg-[#d7c4bb]'
                              : 'bg-[#e8927c]'
                        }`}></div>
                        <span className="truncate">{page.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Wiki Content */}
            <div id="wiki-content" className="w-full flex-grow p-6 overflow-y-auto">
              {currentPageId && generatedPages[currentPageId] ? (
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 break-words font-serif">
                    {generatedPages[currentPageId].title}
                  </h3>

                  {generatedPages[currentPageId].filePaths.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-[var(--muted)] mb-2">
                        {messages.repoPage?.relatedFiles || 'Related Files:'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedPages[currentPageId].filePaths.map(path => (
                          <span key={path} className="bg-[var(--background)]/70 text-xs text-[var(--foreground)] px-3 py-1.5 rounded-md truncate max-w-full border border-[var(--border-color)]">
                            {path}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <Markdown
                      content={generatedPages[currentPageId].content}
                    />
                  </div>

                  {generatedPages[currentPageId].relatedPages.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-[var(--border-color)]">
                      <h4 className="text-sm font-semibold text-[var(--muted)] mb-3">
                        {messages.repoPage?.relatedPages || 'Related Pages:'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedPages[currentPageId].relatedPages.map(relatedId => {
                          const relatedPage = wikiStructure.pages.find(p => p.id === relatedId);
                          return relatedPage ? (
                            <button
                              key={relatedId}
                              className="bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-xs text-[var(--accent-primary)] px-3 py-1.5 rounded-md transition-colors truncate max-w-full border border-[var(--accent-primary)]/20"
                              onClick={() => handlePageSelect(relatedId)}
                            >
                              {relatedPage.title}
                            </button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-[var(--muted)] h-full">
                  <div className="relative mb-4">
                    <div className="absolute -inset-2 bg-[var(--accent-primary)]/5 rounded-full blur-md"></div>
                    <FaBookOpen className="text-4xl relative z-10" />
                  </div>
                  <p className="font-serif">
                    {messages.repoPage?.selectPagePrompt || 'Select a page from the navigation to view its content'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 w-full">
        {/* Only show Ask component when wiki is successfully generated */}
        {wikiStructure && Object.keys(generatedPages).length > 0 && !isLoading && (
          <div className="w-full bg-[var(--card-bg)] rounded-lg p-5 mb-4 shadow-custom card-japanese">
            <button
              onClick={() => setIsAskSectionVisible(!isAskSectionVisible)}
              className="w-full flex items-center justify-between text-left mb-3 text-sm font-serif text-[var(--foreground)] hover:text-[var(--accent-primary)] transition-colors"
              aria-expanded={isAskSectionVisible}
            >
              {!isAskSectionVisible && (
                <span>
                  {messages.repoPage?.askAboutRepo || 'Ask questions about this repository'}
                </span>
              )}
              {isAskSectionVisible && <span></span>}
              {isAskSectionVisible ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isAskSectionVisible && (
              <Ask
                repoUrl={repoInfo.owner && repoInfo.repo
                  ? getRepoUrl(repoInfo.owner, repoInfo.repo, repoInfo.type, repoInfo.localPath)
                  : "https://github.com/AsyncFuncAI/deepwiki-open"
                }
                githubToken={githubToken}
                gitlabToken={gitlabToken}
                bitbucketToken={bitbucketToken}
                provider={selectedProviderState}
                model={selectedModelState}
                isCustomModel={isCustomSelectedModelState}
                customModel={customSelectedModelState}
                language={language}
              />
            )}
          </div>
        )}
        <div className="flex justify-between items-center gap-4 text-center text-[var(--muted)] text-sm h-fit w-full bg-[var(--card-bg)] rounded-lg p-3 shadow-sm border border-[var(--border-color)]">
          <p className="flex-1 font-serif">
            {messages.footer?.copyright || 'DeepWiki - Generate Wiki from GitHub/Gitlab/Bitbucket repositories'}
          </p>
          <ThemeToggle />
        </div>
      </footer>

      <ModelSelectionModal
        isOpen={isModelSelectionModalOpen}
        onClose={() => setIsModelSelectionModalOpen(false)}
        provider={selectedProviderState}
        setProvider={setSelectedProviderState}
        model={selectedModelState}
        setModel={setSelectedModelState}
        isCustomModel={isCustomSelectedModelState}
        setIsCustomModel={setIsCustomSelectedModelState}
        customModel={customSelectedModelState}
        setCustomModel={setCustomSelectedModelState}
        showFileFilters={true}
        excludedDirs={modelExcludedDirs}
        setExcludedDirs={setModelExcludedDirs}
        excludedFiles={modelExcludedFiles}
        setExcludedFiles={setModelExcludedFiles}
        onApply={confirmRefresh}
      />
    </div>
  );
}
