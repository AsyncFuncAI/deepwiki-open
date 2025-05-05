/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FaExclamationTriangle, FaBookOpen, FaWikipediaW, FaGithub, FaGitlab, FaBitbucket, FaDownload, FaFileExport, FaHome } from 'react-icons/fa';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import Markdown from '@/components/Markdown';
import Ask from '@/components/Ask';

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

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8001';

// Add CSS styles for wiki
const wikiStyles = `
  .prose code {
    @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-xs;
  }

  .prose pre {
    @apply bg-gray-900 text-gray-100 rounded-md p-4 overflow-x-auto;
  }
`;

// Helper functions for token handling and API requests
const getRepoUrl = (owner: string, repo: string, repoType: string): string => {
  return repoType === 'github'
    ? `https://github.com/${owner}/${repo}`
    : repoType === 'gitlab'
    ? `https://gitlab.com/${owner}/${repo}`
    : `https://bitbucket.org/${owner}/${repo}`;
};

 
const addTokensToRequestBody = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody: Record<string, any>,
  githubToken: string,
  gitlabToken: string,
  bitbucketToken: string,
  repoType: string,
  localOllama: boolean = false,
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
  requestBody.local_ollama = localOllama;
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
  const localOllama = searchParams.get('local_ollama') === 'true';

  // Initialize repo info
  const repoInfo = useMemo(() => ({
    owner,
    repo,
    type: repoType
  }), [owner, repo, repoType]);

  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>('Initializing wiki generation...');
  const [error, setError] = useState<string | null>(null);
  const [wikiStructure, setWikiStructure] = useState<WikiStructure | undefined>();
  const [currentPageId, setCurrentPageId] = useState<string | undefined>();
  const [generatedPages, setGeneratedPages] = useState<Record<string, WikiPage>>({});
  const [pagesInProgress, setPagesInProgress] = useState(new Set<string>());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [originalMarkdown, setOriginalMarkdown] = useState<Record<string, string>>({});
  const [requestInProgress, setRequestInProgress] = useState(false);
  // Using useRef for activeContentRequests to maintain a single instance across renders
  // This map tracks which pages are currently being processed to prevent duplicate requests
  // Note: In a multi-threaded environment, additional synchronization would be needed,
  // but in React's single-threaded model, this is safe as long as we set the flag before any async operations
  const activeContentRequests = useRef(new Map<string, boolean>()).current;
  const [structureRequestInProgress, setStructureRequestInProgress] = useState(false);

  // Create a flag to ensure the effect only runs once
  const effectRan = React.useRef(false);

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
        const repoUrl = getRepoUrl(owner, repo, repoInfo.type);

        // Create the prompt content - simplified to avoid message dialogs
        const promptContent =
`Generate comprehensive wiki page content for "${page.title}" in the repository ${owner}/${repo}.

This page should focus on the following files:
${filePaths.map(path => `- ${path}`).join('\n')}

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
        addTokensToRequestBody(requestBody, githubToken, gitlabToken, bitbucketToken, repoInfo.type, localOllama);

        const response = await fetch(`${SERVER_BASE_URL}/chat/completions/stream`, {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedPages, githubToken, gitlabToken, bitbucketToken, repoInfo.type]);

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
      setLoadingMessage('Determining wiki structure...');

      // Get repository URL
      const repoUrl = getRepoUrl(owner, repo, repoInfo.type);

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
      addTokensToRequestBody(requestBody, githubToken, gitlabToken, bitbucketToken, repoInfo.type, localOllama);

      const response = await fetch(`${SERVER_BASE_URL}/chat/completions/stream`, {
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

      const xmlText = xmlMatch[0];
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Failed to parse XML response');
      }

      // Extract wiki structure
      const titleEl = xmlDoc.querySelector('title');
      const descriptionEl = xmlDoc.querySelector('description');
      const pagesEls = xmlDoc.querySelectorAll('page');

      const title = titleEl ? titleEl.textContent || '' : '';
      const description = descriptionEl ? descriptionEl.textContent || '' : '';

      // Parse pages
      const pages: WikiPage[] = [];
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
        const MAX_CONCURRENT = 3;

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
  }, [generatePageContent, githubToken, gitlabToken, bitbucketToken, repoInfo.type, pagesInProgress.size, structureRequestInProgress]);

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
      setLoadingMessage('Fetching repository structure...');

      let fileTreeData = '';
      let readmeContent = '';

      if (repoInfo.type === 'github') {
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

        const headers = createGitlabHeaders(gitlabToken);

        // First get project info to determine default branch
        const projectInfoUrl = `https://gitlab.com/api/v4/projects/${encodedProjectPath}`;
        console.log(`Fetching GitLab project info: ${projectInfoUrl}`);
        try {
          const response = await fetch(projectInfoUrl, { headers });

          if (response.ok) {
            const projectData = await response.json();
            const defaultBranch = projectData.default_branch;

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
  }, [owner, repo, determineWikiStructure, githubToken, gitlabToken, bitbucketToken, repoInfo.type, requestInProgress]);

  // Function to export wiki content
  const exportWiki = useCallback(async (format: 'markdown' | 'json') => {
    if (!wikiStructure || Object.keys(generatedPages).length === 0) {
      setExportError('No wiki content to export');
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);
      setLoadingMessage(`Exporting wiki as ${format}...`);

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
      const repoUrl = getRepoUrl(repoInfo.owner, repoInfo.repo, repoInfo.type);

      // Make API call to export wiki
      const response = await fetch(`${SERVER_BASE_URL}/export/wiki`, {
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
  }, [wikiStructure, generatedPages, repoInfo]);

  // Start wiki generation when component mounts
  useEffect(() => {
    console.log('Initial repository fetch triggered');

    if (effectRan.current === false) {
      console.log('Fetching repository structure - first execution');
      fetchRepositoryStructure();
      effectRan.current = true;
    } else {
      console.log('Skipping duplicate repository fetch');
    }

    // Clean up function
    return () => {
      console.log('Repository page unmounting');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Empty dependency array to ensure it only runs once on mount

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col">
      <style>{wikiStyles}</style>

      <header className="max-w-6xl mx-auto mb-8 h-fit w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-purple-600 hover:text-purple-800 flex items-center gap-1">
              <FaHome /> Home
            </Link>
            <div className="flex items-center">
              <FaWikipediaW className="mr-2 text-3xl text-purple-500" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">DeepWiki</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-800 dark:text-gray-200 text-center mb-2">
              {loadingMessage || 'Loading...'}
              {isExporting && ' Please wait while we prepare your download...'}
            </p>

            {/* Progress bar for page generation */}
            {wikiStructure && (
              <div className="w-full max-w-md mt-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${Math.max(5, 100 * (wikiStructure.pages.length - pagesInProgress.size) / wikiStructure.pages.length)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {wikiStructure.pages.length - pagesInProgress.size} of {wikiStructure.pages.length} pages completed
                </p>

                {/* Show list of in-progress pages */}
                {pagesInProgress.size > 0 && (
                  <div className="mt-4 text-xs">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Currently processing:</p>
                    <ul className="text-gray-600 dark:text-gray-300">
                      {Array.from(pagesInProgress).slice(0, 3).map(pageId => {
                        const page = wikiStructure.pages.find(p => p.id === pageId);
                        return page ? <li key={pageId} className="truncate">{page.title}</li> : null;
                      })}
                      {pagesInProgress.size > 3 && (
                        <li>...and {pagesInProgress.size - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center text-red-800 dark:text-red-400 mb-2">
              <FaExclamationTriangle className="mr-2" />
              <span className="font-bold">Error</span>
            </div>
            <p className="text-red-800 dark:text-red-300 text-sm mb-2">{error}</p>
            <p className="text-red-700 dark:text-red-300 text-xs">
              Please check that your repository exists and is public. Valid formats are &ldquo;owner/repo&rdquo;, &ldquo;https://github.com/owner/repo&rdquo;, &ldquo;https://gitlab.com/owner/repo&rdquo;, or &ldquo;https://bitbucket.org/owner/repo&rdquo;.
            </p>
            <div className="mt-4">
              <Link
                href="/"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : wikiStructure ? (
          <div className="h-full overflow-y-auto flex flex-col lg:flex-row gap-4 w-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Wiki Navigation */}
            <div className="h-full w-full lg:w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-lg rounded-r-none p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700/20 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{wikiStructure.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{wikiStructure.description}</p>

              {/* Display repository info */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                {repoInfo.type === 'github' ? (
                  <FaGithub className="mr-1" />
                ) : repoInfo.type === 'gitlab' ? (
                  <FaGitlab className="mr-1" />
                ) : (
                  <FaBitbucket className="mr-1" />
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
                  className="hover:text-purple-500 transition-colors"
                >
                  {repoInfo.owner}/{repoInfo.repo}
                </a>
              </div>

              {/* Export buttons */}
              {Object.keys(generatedPages).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Export Wiki</h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => exportWiki('markdown')}
                      disabled={isExporting}
                      className="flex items-center text-xs px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaDownload className="mr-2" />
                      Export as Markdown
                    </button>
                    <button
                      onClick={() => exportWiki('json')}
                      disabled={isExporting}
                      className="flex items-center text-xs px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaFileExport className="mr-2" />
                      Export as JSON
                    </button>
                  </div>
                  {exportError && (
                    <div className="mt-2 text-xs text-red-500">
                      {exportError}
                    </div>
                  )}
                </div>
              )}

              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-300 mb-2">Pages</h4>
              <ul className="space-y-2">
                {wikiStructure.pages.map(page => (
                  <li key={page.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${currentPageId === page.id
                          ? 'bg-purple-700/50 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-purple-700/30'
                        }`}
                      onClick={() => {
                        if (currentPageId != page.id) {
                          setCurrentPageId(page.id)
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${page.importance === 'high' ? 'bg-green-500' :
                            page.importance === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></div>
                        <span className="truncate">{page.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Wiki Content */}
            <div id="wiki-content" className="w-full flex-grow p-4 overflow-y-auto">
              {currentPageId && generatedPages[currentPageId] ? (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 break-words">
                    {generatedPages[currentPageId].title}
                  </h3>

                  {generatedPages[currentPageId].filePaths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Related Files:</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedPages[currentPageId].filePaths.map(path => (
                          <span key={path} className="bg-gray-200 dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-300 px-2 py-1 rounded-md truncate max-w-full">
                            {path}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown
                      content={generatedPages[currentPageId].content}
                    />
                  </div>

                  {generatedPages[currentPageId].relatedPages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Related Pages:</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedPages[currentPageId].relatedPages.map(relatedId => {
                          const relatedPage = wikiStructure.pages.find(p => p.id === relatedId);
                          return relatedPage ? (
                            <button
                              key={relatedId}
                              className="bg-purple-100 dark:bg-purple-700/30 hover:bg-purple-200 dark:hover:bg-purple-700/50 text-xs text-purple-800 dark:text-purple-200 px-3 py-1 rounded-md transition-colors truncate max-w-full"
                              onClick={() => setCurrentPageId(relatedId)}
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
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 h-full">
                  <FaBookOpen className="text-4xl mb-4" />
                  <p>Select a page from the navigation to view its content</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 w-full">
        {/* Only show Ask component when wiki is successfully generated */}
        {wikiStructure && Object.keys(generatedPages).length > 0 && !isLoading && (
          <div className="w-full bg-white dark:bg-gray-800/80 rounded-lg p-4 mb-4 text-black dark:text-white">
            <div className="text-center mb-2 text-sm">
              Ask questions about this repository
            </div>
            <Ask
              repoUrl={repoInfo.owner && repoInfo.repo
                ? getRepoUrl(repoInfo.owner, repoInfo.repo, repoInfo.type)
                : "https://github.com/AsyncFuncAI/deepwiki-open"
              }
              githubToken={githubToken}
              gitlabToken={gitlabToken}
              bitbucketToken={bitbucketToken}
              localOllama={localOllama}
            />
          </div>
        )}
        <div className="flex justify-between items-center gap-4 text-center text-gray-500 dark:text-gray-400 text-sm h-fit w-full">
          <p className="flex-1">DeepWiki - Generate Wiki from GitHub/Gitlab/Bitbucket repositories</p>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}