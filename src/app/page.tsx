'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { FaExclamationTriangle, FaBookOpen, FaWikipediaW, FaGithub, FaGitlab, FaDownload, FaFileExport } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from '../components/Mermaid';

// Define the demo mermaid charts outside the component
const DEMO_FLOW_CHART = `graph TD
  A[Code Repository] --> B[DeepWiki]
  B --> C[Architecture Diagrams]
  B --> D[Component Relationships]
  B --> E[Data Flow]
  B --> F[Process Workflows]

  style A fill:#f9d3a9,stroke:#d86c1f
  style B fill:#d4a9f9,stroke:#6c1fd8
  style C fill:#a9f9d3,stroke:#1fd86c
  style D fill:#a9d3f9,stroke:#1f6cd8
  style E fill:#f9a9d3,stroke:#d81f6c
  style F fill:#d3f9a9,stroke:#6cd81f`;

const DEMO_SEQUENCE_CHART = `sequenceDiagram
  participant User
  participant DeepWiki
  participant GitHub

  User->>DeepWiki: Enter repository URL
  DeepWiki->>GitHub: Request repository data
  GitHub-->>DeepWiki: Return repository data
  DeepWiki->>DeepWiki: Process and analyze code
  DeepWiki-->>User: Display wiki with diagrams

  %% Add a note to make text more visible
  Note over User,GitHub: DeepWiki supports sequence diagrams for visualizing interactions`;

// Both chart types are used directly in the UI

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

// Add CSS styles for wiki
const wikiStyles = `
  .prose code {
    @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-xs;
  }

  .prose pre {
    @apply bg-gray-900 text-gray-100 rounded-md p-4 overflow-x-auto;
  }
`;

// Utility function to clean up markdown code blocks
const cleanMarkdownCodeBlocks = (text: string): string => {
  // Use regex to replace any whitespace followed by triple backticks with just triple backticks
  let cleaned = text.replace(/\n\s+```/g, '\n```');

  // Handle the case where a code block starts with spaces at the beginning of the text
  cleaned = cleaned.replace(/^\s+```/, '```');

  // Clean up any spaces before language specifiers in code blocks
  cleaned = cleaned.replace(/```\s+(\w+)/g, '```$1');

  // Clean up spaces after closing triple backticks
  cleaned = cleaned.replace(/```\s+\n/g, '```\n');

  // Handle the case where there are spaces after the final triple backticks at the end of the text
  cleaned = cleaned.replace(/```\s+$/, '```');

  return cleaned;
};

export default function Home() {
  // Separate states for better management
  const [repositoryInput, setRepositoryInput] = useState('https://github.com/AsyncFuncAI/deepwiki-open');
  // Store repo info for UI display and other non-callback purposes
  const [repoInfo, setRepoInfo] = useState({ owner: '', repo: '', type: 'github' });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  // State for access tokens
  const [githubToken, setGithubToken] = useState('');
  const [gitlabToken, setGitlabToken] = useState('');
  const [showTokenInputs, setShowTokenInputs] = useState(false);
  const [wikiStructure, setWikiStructure] = useState<WikiStructure | undefined>();
  const [currentPageId, setCurrentPageId] = useState<string | undefined>();
  const [generatedPages, setGeneratedPages] = useState<Record<string, WikiPage>>({});
  const [pagesInProgress, setPagesInProgress] = useState(new Set<string>());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // State to store original markdown for potential retries
  const [originalMarkdown, setOriginalMarkdown] = useState<Record<string, string>>({});

  // Memoize repo info to avoid triggering updates in callbacks
  const currentRepoInfo = useMemo(() => repoInfo, [repoInfo]);

  // Function to handle Mermaid rendering errors and attempt auto-fix
  const handleMermaidError = useCallback(async (errorMessage: string, originalChart: string) => {
    if (!currentPageId || !originalMarkdown[currentPageId]) {
      console.error('Cannot retry Mermaid: Missing current page ID or original markdown.');
      return;
    }

    // Need owner and repo for the API call
    const { owner, repo } = currentRepoInfo;
    if (!owner || !repo) {
      console.error('Cannot retry Mermaid: Missing repository info.');
      return;
    }

    console.log(`Handling Mermaid error for page ${currentPageId}. Error: ${errorMessage}`);

    const retryPrompt = `The following Mermaid diagram code failed to render with the error: "${errorMessage}"

Original Mermaid Code:
\`\`\`mermaid
${originalChart}
\`\`\`

Please regenerate the diagram from scratch and return ONLY the corrected Mermaid code block itself, starting with \`\`\`mermaid and ending with \`\`\`. Do not include any other text, explanation, or markdown formatting outside the code block. Fix the error: "${errorMessage}".

IMPORTANT: Since it failed, make sure the corrected diagram is simplified and prioritize validity over complexity.
If this is a flow diagram, avoid horizontal layouts if possible and prefer "graph TD" orientation.
If this is a sequence diagram, ensure proper syntax with "sequenceDiagram" directive and correct arrow notation (e.g., A->>B: Message).`;

    try {
      setLoadingMessage('Attempting to auto-correct diagram error...');
      const response = await fetch('http://localhost:8001/chat/completions/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: `https://github.com/${owner}/${repo}`,
          messages: [{ role: 'user', content: retryPrompt }]
        }),
      });

      if (!response.ok) {
        throw new Error(`API error during retry: ${response.status}`);
      }

      let correctedMermaidBlock = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Failed to get reader for retry response');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        correctedMermaidBlock += decoder.decode(value, { stream: true });
      }
      correctedMermaidBlock += decoder.decode(); // Final decode

      // Basic cleaning: Trim whitespace and ensure it looks like a mermaid block
      correctedMermaidBlock = correctedMermaidBlock.trim();
      // Apply our code block cleaning function
      correctedMermaidBlock = cleanMarkdownCodeBlocks(correctedMermaidBlock);
      if (correctedMermaidBlock.startsWith('```mermaid') && correctedMermaidBlock.endsWith('```')) {
        console.log('Received corrected Mermaid block from API.');

        // Find the original broken chart in the full markdown and replace it
        // This simple replacement assumes the broken chart string is unique enough
        const originalContent = originalMarkdown[currentPageId];
        const originalChartBlock = `\`\`\`mermaid\n${originalChart}\n\`\`\``; // Reconstruct original block

        if (originalContent.includes(originalChartBlock)) {
          const updatedContent = originalContent.replace(originalChartBlock, correctedMermaidBlock);

          // Update the generated page content
          setGeneratedPages(prev => ({
            ...prev,
            [currentPageId]: {
              ...prev[currentPageId],
              content: updatedContent,
            }
          }));
          // Update original markdown store as well in case of further errors?
          // Or maybe just clear the original on success? For now, let's update it.
          setOriginalMarkdown(prev => ({ ...prev, [currentPageId]: updatedContent }));
          console.log(`Page ${currentPageId} updated with corrected Mermaid diagram.`);
        } else {
          console.warn('Could not find the original Mermaid block in the content for replacement.');
          // Optionally, set an error state here or revert to fallback in Mermaid component
        }
      } else {
        console.error('Received malformed corrected Mermaid block from API:', correctedMermaidBlock);
        // Let the Mermaid component proceed with its own fallback
      }

    } catch (error) {
      console.error('Error during Mermaid retry API call:', error);
      // Let the Mermaid component proceed with its own fallback mechanisms
    } finally {
      setLoadingMessage(undefined); // Clear loading message
    }
  }, [currentPageId, originalMarkdown, currentRepoInfo]);

  // Parse repository URL/input and extract owner and repo
  const parseRepositoryInput = (input: string): { owner: string, repo: string, type: string, fullPath?: string } | null => {
    input = input.trim();

    let owner = '', repo = '', type = 'github', fullPath;

    // Handle GitHub URL format
    if (input.startsWith('https://github.com/')) {
      type = 'github';
      const parts = input.replace('https://github.com/', '').split('/');
      owner = parts[0] || '';
      repo = parts[1] || '';
    }
    // Handle GitLab URL format
    else if (input.startsWith('https://gitlab.com/')) {
      type = 'gitlab';
      const parts = input.replace('https://gitlab.com/', '').split('/');

      // GitLab can have nested groups, so the repo is the last part
      // and the owner/group is everything before that
      if (parts.length >= 2) {
        repo = parts[parts.length - 1] || '';
        owner = parts[0] || '';

        // For GitLab, we also need to keep track of the full path for API calls
        fullPath = parts.join('/');
      }
    }
    // Handle owner/repo format (assume GitHub by default)
    else {
      const parts = input.split('/');
      owner = parts[0] || '';
      repo = parts[1] || '';
    }

    // Clean values
    owner = owner.trim();
    repo = repo.trim();

    // Remove .git suffix if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    if (!owner || !repo) {
      return null;
    }

    return { owner, repo, type, fullPath };
  };

  // Generate content for multiple wiki pages in parallel using batch API
  const generateBatchContent = useCallback(async (pages: WikiPage[], owner: string, repo: string) => {
    try {
      // Skip if no pages to process
      if (pages.length === 0) {
        return;
      }

      // Validate repo info
      if (!owner || !repo) {
        throw new Error('Invalid repository information. Owner and repo name are required.');
      }

      // Mark all pages as in progress
      pages.forEach(page => {
        setPagesInProgress(prev => new Set(prev).add(page.id));

        // Set placeholder content
        setGeneratedPages(prev => ({
          ...prev,
          [page.id]: { ...page, content: 'Loading...' }
        }));
        setOriginalMarkdown(prev => ({ ...prev, [page.id]: '' }));
      });

      setLoadingMessage(`Generating content for ${pages.length} pages in parallel...`);
      console.log(`Starting batch generation for ${pages.length} pages`);

      // Determine which token to use based on the repository type
      const repoUrl = repoInfo.type === 'github'
        ? `https://github.com/${owner}/${repo}`
        : `https://gitlab.com/${owner}/${repo}`;

      // Create prompts for each page
      const queries = pages.map(page => {
        return `Generate comprehensive wiki page content for "${page.title}" in the repository ${owner}/${repo}.

This page should focus on the following files:
${page.filePaths.map(path => `- ${path}`).join('\n')}

The wiki page should:
1. Provide a detailed explanation of the purpose and functionality
2. Include code examples with explanations where appropriate
3. Explain how this component/feature fits into the overall architecture
4. Include any setup or usage instructions if applicable
5. Be formatted in Markdown for easy reading
6. IMPORTANT: Use Mermaid diagrams where appropriate to visualize:
   - Component relationships
   - Data flow
   - Architecture
   - Processes or workflows
   - Class hierarchies
   - State transitions
   - Sequence of operations

MERMAID DIAGRAM INSTRUCTIONS:
- Include at least one mermaid diagram if relevant to this topic
- DeepWiki supports both flow diagrams AND sequence diagrams
- Choose the appropriate diagram type based on what you're visualizing:
  - Use flow diagrams (graph TD) for component relationships, architecture, and hierarchies
  - Use sequence diagrams (sequenceDiagram) for interactions between components, API flows, and time-based processes

- For flow diagrams:
  - IMPORTANT!!: Please orient and draw the diagram as vertically as possible. You must avoid long horizontal lists of nodes and sections!
  - Use "graph TD" (top-down) for most diagrams to ensure vertical orientation
  - Use double dashes for arrows: A --> B (not A-B)
  - Use proper node IDs (alphanumeric with no spaces)
  - Add labels in square brackets: A[Label]

- For sequence diagrams:
  - Start with "sequenceDiagram" directive
  - Define participants: participant A, participant B
  - Show interactions with arrows: A->>B: Message
  - Use solid arrows (->) or dotted arrows (-->)
  - Add notes with: Note over A: Note text`;
      });

      // Prepare request body for batch processing
      const requestBody: {
        repo_url: string;
        queries: string[];
        github_token?: string;
        gitlab_token?: string;
      } = {
        repo_url: repoUrl,
        queries: queries
      };

      // Add tokens if available
      if (githubToken && repoInfo.type === 'github') {
        requestBody.github_token = githubToken;
      }
      if (gitlabToken && repoInfo.type === 'gitlab') {
        requestBody.gitlab_token = gitlabToken;
      }

      // Make batch API call
      console.log(`Sending batch request with ${queries.length} queries`);
      const response = await fetch('http://localhost:8001/batch/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error(`Batch API error (${response.status}): ${errorText}`);
        throw new Error(`Error in batch processing: ${response.status} - ${response.statusText}`);
      }

      // Process the response
      const batchResults = await response.json();
      console.log(`Received batch results for ${batchResults.results.length} pages`);

      // Update each page with its content
      pages.forEach((page, index) => {
        if (index < batchResults.results.length) {
          const content = batchResults.results[index].answer;

          // Clean up markdown delimiters
          let cleanContent = content.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '');

          // Clean up code blocks to prevent spacing issues
          cleanContent = cleanMarkdownCodeBlocks(cleanContent);

          // Store the generated content
          setGeneratedPages(prev => ({
            ...prev,
            [page.id]: { ...page, content: cleanContent }
          }));

          // Store original for potential mermaid retries
          setOriginalMarkdown(prev => ({ ...prev, [page.id]: cleanContent }));

          console.log(`Updated content for page ${page.title}`);
        } else {
          // Handle case where we didn't get a result for this page
          setGeneratedPages(prev => ({
            ...prev,
            [page.id]: { ...page, content: 'Error: No content received from batch processing' }
          }));
        }

        // Mark page as done
        setPagesInProgress(prev => {
          const next = new Set(prev);
          next.delete(page.id);
          return next;
        });
      });

    } catch (err) {
      console.error(`Error in batch content generation:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Update all pages with error
      pages.forEach(page => {
        setGeneratedPages(prev => ({
          ...prev,
          [page.id]: { ...page, content: `Error generating content: ${errorMessage}` }
        }));

        // Mark page as done
        setPagesInProgress(prev => {
          const next = new Set(prev);
          next.delete(page.id);
          return next;
        });
      });

      setError(`Failed to generate content in batch mode: ${errorMessage}`);
    } finally {
      setLoadingMessage(undefined);
    }
  }, [githubToken, gitlabToken, repoInfo.type]);

  // Determine the wiki structure from repository data
  const determineWikiStructure = useCallback(async (fileTree: string, readme: string, owner: string, repo: string) => {
    if (!owner || !repo) {
      setError('Invalid repository information. Owner and repo name are required.');
      setIsLoading(false);
      return;
    }

    try {
      setLoadingMessage('Determining wiki structure...');

      // Determine which token to use based on the repository type
      const repoUrl = repoInfo.type === 'github'
        ? `https://github.com/${owner}/${repo}`
        : `https://gitlab.com/${owner}/${repo}`;

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
        if (githubToken && repoInfo.type === 'github') {
          requestBody.github_token = githubToken;
        }
        if (gitlabToken && repoInfo.type === 'gitlab') {
          requestBody.gitlab_token = gitlabToken;
        }

        const response = await fetch('http://localhost:8001/chat/completions/stream', {
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

      // Clean up code blocks to prevent spacing issues
      responseText = cleanMarkdownCodeBlocks(responseText);

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

      // Start generating content for all pages in parallel using batch API
      if (pages.length > 0) {
        // Mark all pages as in progress
        const initialInProgress = new Set(pages.map(p => p.id));
        setPagesInProgress(initialInProgress);

        console.log(`Starting parallel generation for ${pages.length} pages using batch API`);
        setLoadingMessage(`Generating ${pages.length} wiki pages in parallel...`);

        // Process pages in batches using the batch API
        const MAX_BATCH_SIZE = 6; // Maximum batch size for API

        // Create batches of pages to process
        const batches: WikiPage[][] = [];
        for (let i = 0; i < pages.length; i += MAX_BATCH_SIZE) {
          batches.push(pages.slice(i, i + MAX_BATCH_SIZE));
        }

        // Process batches sequentially
        (async () => {
          try {
            for (const batch of batches) {
              await generateBatchContent(batch, owner, repo);
            }
            console.log("All page generation tasks completed.");
            setIsLoading(false);
            setLoadingMessage(undefined);
          } catch (error) {
            console.error("Error during batch page generation:", error);
            setError("An error occurred during wiki generation. Please try again.");
            setIsLoading(false);
            setLoadingMessage(undefined);
          }
        })();
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
    }
  }, [generateBatchContent, githubToken, gitlabToken, repoInfo.type]);

  // Fetch repository structure using GitHub or GitLab API
  const fetchRepositoryStructure = useCallback(async () => {
    // Reset previous state
    setWikiStructure(undefined);
    setCurrentPageId(undefined);
    setGeneratedPages({});
    setPagesInProgress(new Set());
    setError(null);

    // Parse repository input
    const parsedRepo = parseRepositoryInput(repositoryInput);

    if (!parsedRepo) {
      setError('Invalid repository format. Use "owner/repo", "https://github.com/owner/repo", or "https://gitlab.com/owner/repo" format.');
      return;
    }

    const { owner, repo, type, fullPath } = parsedRepo;
    setRepoInfo({ owner, repo, type });

    try {
      // Update loading state
      setIsLoading(true);
      setLoadingMessage('Fetching repository structure...');

      let fileTreeData = '';
      let readmeContent = '';

      if (type === 'github') {
        // GitHub API approach
        // Try to get the tree data for common branch names
        let treeData = null;
        let apiErrorDetails = '';

        for (const branch of ['main', 'master']) {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
          const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json'
          };

          // Add GitHub token if available
          if (githubToken) {
            headers['Authorization'] = `Bearer ${githubToken}`;
          }

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
          const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json'
          };

          // Add GitHub token if available
          if (githubToken) {
            headers['Authorization'] = `Bearer ${githubToken}`;
          }

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
      else if (type === 'gitlab') {
        // GitLab API approach
        const projectPath = fullPath || `${owner}/${repo}`;
        const encodedProjectPath = encodeURIComponent(projectPath);

        // Try to get the file tree for common branch names
        let filesData = null;
        let apiErrorDetails = '';

        for (const branch of ['main', 'master']) {
          const apiUrl = `https://gitlab.com/api/v4/projects/${encodedProjectPath}/repository/tree?recursive=true&ref=${branch}&per_page=100`;
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          // Add GitLab token if available
          if (gitlabToken) {
            headers['PRIVATE-TOKEN'] = gitlabToken;
          }

          console.log(`Fetching GitLab repository structure from branch: ${branch}`);
          try {
            const response = await fetch(apiUrl, {
              headers
            });

            if (response.ok) {
              filesData = await response.json();
              console.log('Successfully fetched GitLab repository structure');
              break;
            } else {
              const errorData = await response.text();
              apiErrorDetails = `Status: ${response.status}, Response: ${errorData}`;
              console.error(`Error fetching GitLab repository structure: ${apiErrorDetails}`);
            }
          } catch (err) {
            console.error(`Network error fetching GitLab branch ${branch}:`, err);
          }
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
            const headers: HeadersInit = {};

            // Add GitLab token if available
            if (gitlabToken) {
              headers['PRIVATE-TOKEN'] = gitlabToken;
            }

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

      // Now determine the wiki structure
      await determineWikiStructure(fileTreeData, readmeContent, owner, repo);

    } catch (error) {
      console.error('Error fetching repository structure:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoadingMessage(undefined);
    }
  }, [repositoryInput, determineWikiStructure, githubToken, gitlabToken]);

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

      // Determine which token to use based on the repository type
      const repoUrl = repoInfo.type === 'github'
        ? `https://github.com/${repoInfo.owner}/${repoInfo.repo}`
        : `https://gitlab.com/${repoInfo.owner}/${repoInfo.repo}`;

      // Make API call to export wiki
      const response = await fetch('http://localhost:8001/export/wiki', {
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

      console.log(`Wiki exported successfully as ${format}`);
    } catch (err) {
      console.error('Error exporting wiki:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during export';
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
      setLoadingMessage(undefined);
    }
  }, [wikiStructure, generatedPages, repoInfo]);

  // Define MarkdownComponents INSIDE the Home component function
  const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = useMemo(() => ({
    p({ children, ...props }: { children?: React.ReactNode }) {
      return <p className="mb-1 text-xs" {...props}>{children}</p>;
    },
    h1({ children, ...props }: { children?: React.ReactNode }) {
      return <h1 className="text-base font-bold mt-3 mb-1" {...props}>{children}</h1>;
    },
    h2({ children, ...props }: { children?: React.ReactNode }) {
      return <h2 className="text-sm font-bold mt-2 mb-1" {...props}>{children}</h2>;
    },
    h3({ children, ...props }: { children?: React.ReactNode }) {
      return <h3 className="text-xs font-bold mt-2 mb-1" {...props}>{children}</h3>;
    },
    ul({ children, ...props }: { children?: React.ReactNode }) {
      return <ul className="list-disc pl-4 mb-2 text-xs" {...props}>{children}</ul>;
    },
    ol({ children, ...props }: { children?: React.ReactNode }) {
      return <ol className="list-decimal pl-4 mb-2 text-xs" {...props}>{children}</ol>;
    },
    li({ children, ...props }: { children?: React.ReactNode }) {
      return <li className="mb-1 text-xs" {...props}>{children}</li>;
    },
    code(props: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any; // Using any here as it's required for ReactMarkdown components
    }) {
      const { inline, className, children, ...otherProps } = props;
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = children ? String(children).replace(/\n$/, '') : '';

      // Handle Mermaid diagrams
      if (!inline && match && match[1] === 'mermaid') {
        return (
          <div className="my-6 bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden">
            <Mermaid
              chart={codeContent}
              className="w-full max-w-full"
              onMermaidError={handleMermaidError}
            />
          </div>
        );
      }

      // Handle math blocks
      if (!inline && match && match[1] === 'math') {
        return (
          <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800 overflow-x-auto rounded-md">
            {children}
          </div>
        );
      }

      // Handle regular code blocks with syntax highlighting
      if (!inline && match) {
        return (
          <div className="my-4 rounded-md overflow-hidden">
            <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-700 px-4 py-1 text-xs text-gray-700 dark:text-gray-300">
              <span>{match[1]}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="hover:bg-gray-300 dark:hover:bg-gray-600 p-1 rounded"
                aria-label="Copy code"
                title="Copy code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
              </button>
            </div>
            <SyntaxHighlighter
              language={match[1]}
              style={tomorrow}
              className="!text-xs"
              customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem' }}
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
              {...otherProps}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Handle inline code
      return (
        <code
          className={`${className} font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-pink-500 dark:text-pink-400 text-xs`}
          {...otherProps}
        >
          {children}
        </code>
      );
    },
  }), [handleMermaidError]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <style>{wikiStyles}</style>

      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <FaWikipediaW className="mr-2 text-3xl text-purple-500" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">DeepWiki</h1>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchRepositoryStructure(); }} className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {repositoryInput.includes('gitlab.com') ? <FaGitlab className="text-gray-400" /> : <FaGithub className="text-gray-400" />}
                </div>
                <input
                  type="text"
                  value={repositoryInput}
                  onChange={(e) => setRepositoryInput(e.target.value)}
                  placeholder="owner/repo or GitHub/GitLab URL"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {error && (
                  <div className="text-red-500 text-xs mt-1">
                    {error}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Generate Wiki'}
              </button>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setShowTokenInputs(!showTokenInputs)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center"
              >
                {showTokenInputs ? '- Hide access tokens' : '+ Add access tokens for private repositories'}
              </button>
            </div>

            {showTokenInputs && (
              <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <label htmlFor="github-token" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitHub Token (for private repos)
                  </label>
                  <input
                    id="github-token"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="GitHub personal access token"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Token is stored in memory only and never persisted.
                  </p>
                </div>
                <div className="flex-1">
                  <label htmlFor="gitlab-token" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitLab Token (for private repos)
                  </label>
                  <input
                    id="gitlab-token"
                    type="password"
                    value={gitlabToken}
                    onChange={(e) => setGitlabToken(e.target.value)}
                    placeholder="GitLab personal access token"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Token is stored in memory only and never persisted.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
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
              Please check that your repository exists and is public. Valid formats are &ldquo;owner/repo&rdquo;, &ldquo;https://github.com/owner/repo&rdquo;, or &ldquo;https://gitlab.com/owner/repo&rdquo;.
            </p>
          </div>
        ) : wikiStructure ? (
          <div className="flex flex-col lg:flex-row gap-4 w-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Wiki Navigation */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700/20 max-h-[600px] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{wikiStructure.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{wikiStructure.description}</p>

              {/* Display repository info */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                {repoInfo.type === 'github' ? (
                  <FaGithub className="mr-1" />
                ) : (
                  <FaGitlab className="mr-1" />
                )}
                <a
                  href={repoInfo.type === 'github'
                    ? `https://github.com/${repoInfo.owner}/${repoInfo.repo}`
                    : `https://gitlab.com/${repoInfo.owner}/${repoInfo.repo}`
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
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        currentPageId === page.id
                          ? 'bg-purple-700/50 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-purple-700/30'
                      }`}
                      onClick={() => setCurrentPageId(page.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                          page.importance === 'high' ? 'bg-green-500' :
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
            <div className="w-full flex-grow p-4 max-h-[600px] overflow-y-auto">
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
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={MarkdownComponents}
                    >
                      {generatedPages[currentPageId].content}
                    </ReactMarkdown>
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
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <FaWikipediaW className="text-5xl text-purple-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Welcome to DeepWiki (Open Source)</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Enter a GitHub or GitLab repository to generate a comprehensive wiki based on its structure.
            </p>
            <div className="text-gray-500 dark:text-gray-500 text-sm text-center mb-6">
              <p className="mb-2">You can enter a repository in these formats:</p>
              <ul className="list-disc list-inside mb-2">
                <li>https://github.com/AsyncFuncAI/deepwiki-open</li>
                <li>https://github.com/openai/codex</li>
                <li>https://gitlab.com/gitlab-org/gitlab</li>
              </ul>
            </div>

            <div className="w-full max-w-md mt-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Now with Mermaid Diagram Support!</h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                DeepWiki supports both flow diagrams and sequence diagrams to help visualize:
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Flow Diagram Example:</h4>
                <Mermaid chart={DEMO_FLOW_CHART} />
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sequence Diagram Example:</h4>
                <Mermaid chart={DEMO_SEQUENCE_CHART} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>DeepWiki - Generate Wiki from GitHub/Gitlab repositories</p>
      </footer>
    </div>
  );
}
