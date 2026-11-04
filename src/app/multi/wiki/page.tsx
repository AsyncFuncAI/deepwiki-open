'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaGithub, FaGitlab, FaBitbucket, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
import Markdown from '@/components/Markdown';
import { useLanguage } from '@/contexts/LanguageContext';

// Wiki Interfaces
interface Repository {
  repo_url: string;
  access_token?: string;
  description?: string;
}

interface WikiPage {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  relatedPages: string[];
  repositories?: string[]; // Which repositories this page relates to
}

interface WikiStructure {
  id: string;
  title: string;
  description: string;
  repositories: Repository[];
  pages: WikiPage[];
}

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8001';

// Wiki styles
const wikiStyles = `
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  font-family: var(--font-serif);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.prose h1 { font-size: 1.5rem; }
.prose h2 { font-size: 1.25rem; }
.prose h3 { font-size: 1.125rem; }
.prose h4 { font-size: 1rem; }
.prose p, .prose ul, .prose ol {
  margin-bottom: 1em;
  line-height: 1.6;
}
.prose code {
  font-size: 0.875em;
  background-color: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
.prose pre {
  background-color: var(--code-bg);
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}
.prose a {
  color: var(--accent-primary);
  text-decoration: none;
}
.prose a:hover {
  text-decoration: underline;
}
.prose blockquote {
  border-left: 3px solid var(--border-color);
  padding-left: 1em;
  font-style: italic;
  color: var(--muted);
}
.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
}
.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}
.prose th, .prose td {
  border: 1px solid var(--border-color);
  padding: 0.5em;
  text-align: left;
}
.prose th {
  background-color: var(--background);
}
`;

export default function MultiRepoWikiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, language } = useLanguage();
  
  // Get repositories from URL parameters
  const repoParams = searchParams.get('repos');
  
  // State variables
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [wikiStructure, setWikiStructure] = useState<WikiStructure | null>(null);
  const [generatedPages, setGeneratedPages] = useState<Record<string, WikiPage>>({});
  const [currentPageId, setCurrentPageId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(messages?.loading?.determiningStructure);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json'>('markdown');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [originalMarkdown, setOriginalMarkdown] = useState<Record<string, string>>({});
  
  // Refs
  const effectRan = useRef(false);
  const cacheLoadedSuccessfully = useRef(false);
  const pagesInProgress = useRef(new Set<string>());
  const structureRequestInProgress = useRef(false);
  const contentQueue = useRef<WikiPage[]>([]);
  const maxConcurrentRequests = 3; // Process 3 pages at a time
  
  // Parse repositories from URL parameters
  useEffect(() => {
    if (repoParams) {
      try {
        const repos = repoParams.split(',').map(repo => ({
          repo_url: decodeURIComponent(repo.trim())
        }));
        setRepositories(repos);
      } catch (error) {
        console.error('Error parsing repository parameters:', error);
        setError('Invalid repository parameters');
        setIsLoading(false);
      }
    } else {
      setError('No repositories specified');
      setIsLoading(false);
    }
  }, [repoParams]);
  
  // Generate cache key for multi-repository wiki
  const getCacheKey = useCallback((repos: Repository[], lang: string) => {
    const repoUrls = repos.map(repo => repo.repo_url).sort().join(',');
    return `multi-wiki-${repoUrls}-${lang}`;
  }, []);
  
  // Process the content generation queue
  const processQueue = useCallback(() => {
    if (contentQueue.current.length === 0) {
      // All pages processed
      setIsLoading(false);
      setLoadingMessage(undefined);
      return;
    }
    
    // Process up to maxConcurrentRequests pages at a time
    while (contentQueue.current.length > 0 && pagesInProgress.current.size < maxConcurrentRequests) {
      const page = contentQueue.current.shift();
      if (page) {
        generatePageContent(page);
      }
    }
  }, []);
  
  // Generate content for a wiki page
  const generatePageContent = useCallback(async (page: WikiPage) => {
    try {
      // Skip if content already exists
      if (generatedPages[page.id]?.content) {
        return;
      }
      
      // Skip if this page is already being processed
      if (pagesInProgress.current.has(page.id)) {
        console.log(`Page ${page.id} (${page.title}) is already being processed, skipping duplicate call`);
        return;
      }
      
      // Mark page as in progress
      pagesInProgress.current.add(page.id);
      setLoadingMessage(`Generating content for "${page.title}"...`);
      
      // Clear previous original markdown
      setOriginalMarkdown(prev => ({ ...prev, [page.id]: '' }));
      
      console.log(`Starting content generation for page: ${page.title}`);
      
      // Create the prompt content
      const promptContent = `Generate comprehensive wiki page content for "${page.title}" across multiple repositories.
      
Focus on explaining how these repositories interact with each other, especially for components, data flows, and dependencies.

Include sequence diagrams or class diagrams when applicable to show the relationships between repositories.

Repositories:
${repositories.map(repo => `- ${repo.repo_url}${repo.description ? ` (${repo.description})` : ''}`).join('\n')}

Related files:
${page.filePaths.join('\n')}

Make sure to use proper markdown formatting including headings, code blocks, and diagrams.
For diagrams, use mermaid syntax with \`\`\`mermaid blocks.`;
      
      // Make API call to generate content
      const response = await fetch(`${SERVER_BASE_URL}/multi_repo/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: repositories,
          query: promptContent,
          local_ollama: false,
          language: language
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update the generated pages
      setGeneratedPages(prev => ({
        ...prev,
        [page.id]: {
          ...page,
          content: result.answer
        }
      }));
      
      // Store original markdown
      setOriginalMarkdown(prev => ({
        ...prev,
        [page.id]: result.answer
      }));
      
    } catch (error) {
      console.error(`Error generating content for page ${page.id}:`, error);
      
      // Update the generated pages with error message
      setGeneratedPages(prev => ({
        ...prev,
        [page.id]: {
          ...page,
          content: `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
      
    } finally {
      // Mark page as no longer in progress
      pagesInProgress.current.delete(page.id);
      
      // Process next page in queue
      processQueue();
    }
  }, [repositories, language, processQueue]);
  
  // Determine wiki structure for multiple repositories
  const determineWikiStructure = useCallback(async () => {
    if (structureRequestInProgress.current || repositories.length === 0) {
      return;
    }
    
    structureRequestInProgress.current = true;
    setIsLoading(true);
    setLoadingMessage(messages?.loading?.determiningStructure);
    setError(null);
    
    try {
      // Create default wiki structure with standard pages for multi-repository analysis
      const pages: WikiPage[] = [
        {
          id: 'overview',
          title: 'System Overview',
          content: '',
          filePaths: [],
          importance: 'high',
          relatedPages: ['architecture', 'dataflow', 'interfaces']
        },
        {
          id: 'architecture',
          title: 'System Architecture',
          content: '',
          filePaths: [],
          importance: 'high',
          relatedPages: ['overview', 'dataflow', 'interfaces']
        },
        {
          id: 'dataflow',
          title: 'Data Flow Analysis',
          content: '',
          filePaths: [],
          importance: 'medium',
          relatedPages: ['overview', 'architecture', 'interfaces']
        },
        {
          id: 'interfaces',
          title: 'Repository Interfaces',
          content: '',
          filePaths: [],
          importance: 'medium',
          relatedPages: ['overview', 'architecture', 'dataflow']
        }
      ];
      
      // Create wiki structure
      const wikiStructure: WikiStructure = {
        id: 'multi-wiki',
        title: 'Multi-Repository Wiki',
        description: `Analysis of ${repositories.length} repositories and their interactions`,
        repositories: repositories,
        pages: pages
      };
      
      setWikiStructure(wikiStructure);
      setCurrentPageId(pages.length > 0 ? pages[0].id : undefined);
      
      // Queue pages for content generation
      contentQueue.current = [...pages];
      
      // Start processing the queue
      processQueue();
      
    } catch (error) {
      console.error('Error determining wiki structure:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoadingMessage(undefined);
    } finally {
      structureRequestInProgress.current = false;
    }
  }, [messages?.loading?.determiningStructure, repositories, processQueue]);
  
  // Function to export wiki content
  const exportWiki = useCallback(async (format: 'markdown' | 'json') => {
    if (!wikiStructure || Object.keys(generatedPages).length === 0) {
      setExportError('No wiki content to export');
      return;
    }
    
    try {
      setExportError(null);
      
      // Prepare pages for export
      const exportPages = wikiStructure.pages.map(page => ({
        ...page,
        content: generatedPages[page.id]?.content || ''
      }));
      
      // Make API call to export wiki
      const response = await fetch(`${SERVER_BASE_URL}/multi_repo/export_wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: repositories,
          pages: exportPages,
          format: format
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `multi-repo-wiki.${format === 'markdown' ? 'md' : 'json'}`;
      
      // Append the link to the body
      document.body.appendChild(a);
      
      // Click the link
      a.click();
      
      // Remove the link
      document.body.removeChild(a);
      
      // Revoke the URL
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting wiki:', error);
      setExportError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }, [wikiStructure, generatedPages, repositories]);
  
  // Start wiki generation when component mounts
  useEffect(() => {
    if (effectRan.current === false && repositories.length > 0) {
      // Try loading from cache first
      const cacheKey = getCacheKey(repositories, language);
      try {
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          
          // Verify the cache has the required structure and pages
          if (parsedData.wikiStructure && 
              parsedData.generatedPages && 
              Object.keys(parsedData.generatedPages).length > 0) {
            
            console.log('Using cached wiki data');
            setWikiStructure(parsedData.wikiStructure);
            setGeneratedPages(parsedData.generatedPages);
            setCurrentPageId(parsedData.wikiStructure.pages.length > 0 ? parsedData.wikiStructure.pages[0].id : undefined);
            setIsLoading(false);
            setLoadingMessage(undefined);
            cacheLoadedSuccessfully.current = true;
            effectRan.current = true;
            return;
          } else {
            // Invalid cache, clear it
            console.log('Invalid cache data, clearing');
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
        // Continue with normal wiki generation
      }
      
      // Start wiki generation
      determineWikiStructure();
      effectRan.current = true;
    }
  }, [repositories, determineWikiStructure, getCacheKey, language]);
  
  // Save wiki data to cache when all pages have content
  useEffect(() => {
    if (wikiStructure && Object.keys(generatedPages).length > 0 && !isLoading) {
      // Check if all pages have content
      const allPagesHaveContent = wikiStructure.pages.every(page => 
        generatedPages[page.id] && generatedPages[page.id].content
      );
      
      if (allPagesHaveContent) {
        console.log('Saving wiki data to cache');
        const cacheKey = getCacheKey(repositories, language);
        
        try {
          const dataToCache = {
            wikiStructure,
            generatedPages
          };
          
          localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        } catch (error) {
          // Handle potential localStorage errors (quota exceeded, etc.)
          console.error('Error saving to cache:', error);
        }
      }
    }
  }, [isLoading, wikiStructure, generatedPages, repositories, getCacheKey, language]);
  
  return (
    <div className="h-screen paper-texture p-4 md:p-8 flex flex-col">
      <style>{wikiStyles}</style>
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center w-full mb-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold font-serif text-[var(--foreground)]">
            DeepWiki
          </Link>
          <span className="text-xs px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full border border-[var(--accent-primary)]/20">
            Multi-Repo
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1.5"
          >
            <FaHome className="text-xs" />
            {messages?.multiRepo?.home || 'Home'}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--muted)] text-sm">{loadingMessage}</p>
          </div>
        ) : error ? (
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="bg-[var(--highlight)]/10 border border-[var(--highlight)]/30 rounded-lg p-6 max-w-md text-center">
              <FaExclamationTriangle className="text-[var(--highlight)] text-3xl mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{messages?.errors?.errorOccurred || 'An error occurred'}</h3>
              <p className="text-[var(--muted)] text-sm mb-4">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="btn-japanese py-2 px-4 rounded-md text-sm"
              >
                {messages?.errors?.backToHome || 'Back to Home'}
              </button>
            </div>
          </div>
        ) : wikiStructure ? (
          <div className="flex-grow flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 bg-[var(--card-bg)] rounded-lg p-4 shadow-custom card-japanese">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 font-serif">
                  {wikiStructure.title}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  {wikiStructure.description}
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-semibold text-[var(--foreground)] mb-2 font-serif">
                  {messages?.multiRepo?.repositories || 'Repositories'}
                </h4>
                <ul className="space-y-1.5">
                  {wikiStructure.repositories.map((repo, index) => (
                    <li key={index} className="text-xs text-[var(--muted)]">
                      <div className="flex items-start">
                        <span className="mr-1.5 mt-0.5">
                          {repo.repo_url.includes('github') ? (
                            <FaGithub className="text-xs" />
                          ) : repo.repo_url.includes('gitlab') ? (
                            <FaGitlab className="text-xs" />
                          ) : repo.repo_url.includes('bitbucket') ? (
                            <FaBitbucket className="text-xs" />
                          ) : (
                            <span className="w-3 h-3 inline-block"></span>
                          )}
                        </span>
                        <span className="truncate">{repo.repo_url.split('/').slice(-2).join('/')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-[var(--foreground)] mb-3 font-serif">
                  {messages?.repoPage?.pages || 'Pages'}
                </h4>
                <ul className="space-y-2">
                  {wikiStructure.pages.map(page => (
                    <li key={page.id}>
                      <button
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${currentPageId === page.id
                            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                            : 'text-[var(--foreground)] hover:bg-[var(--background)] border border-transparent'
                          }`}
                        onClick={() => {
                          if (currentPageId != page.id) {
                            setCurrentPageId(page.id)
                          }
                        }}
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
              
              <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors py-2"
                >
                  <FaDownload className="text-xs" />
                  {messages?.repoPage?.exportWiki || 'Export Wiki'}
                </button>
                
                {showExportOptions && (
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => exportWiki('markdown')}
                      className="w-full text-xs bg-[var(--background)] hover:bg-[var(--background)]/80 text-[var(--foreground)] py-2 px-3 rounded-md transition-colors"
                    >
                      {messages?.repoPage?.exportAsMarkdown || 'Export as Markdown'}
                    </button>
                    <button
                      onClick={() => exportWiki('json')}
                      className="w-full text-xs bg-[var(--background)] hover:bg-[var(--background)]/80 text-[var(--foreground)] py-2 px-3 rounded-md transition-colors"
                    >
                      {messages?.repoPage?.exportAsJson || 'Export as JSON'}
                    </button>
                    
                    {exportError && (
                      <div className="text-[var(--highlight)] text-xs mt-2">
                        {exportError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Wiki Content */}
            <div id="wiki-content" className="w-full flex-grow p-6 overflow-y-auto bg-[var(--card-bg)] rounded-lg shadow-custom card-japanese">
              {currentPageId && generatedPages[currentPageId] ? (
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 break-words font-serif">
                    {generatedPages[currentPageId].title}
                  </h3>
                  
                  {generatedPages[currentPageId].filePaths.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-[var(--muted)] mb-2">
                        {messages?.repoPage?.relatedFiles || 'Related Files:'}
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
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-[var(--muted)] text-sm">
                  {messages?.repoPage?.selectPage || 'Select a page from the sidebar to view its content.'}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
      
      <footer className="max-w-6xl mx-auto mt-8 text-center text-xs text-[var(--muted)]">
        <p>DeepWiki - Multi-Repository Analysis</p>
      </footer>
    </div>
  );
}
