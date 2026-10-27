/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import Ask from '@/components/Ask';
import CodeViewer, { CodeTarget } from '@/components/CodeViewer';
import Markdown from '@/components/Markdown';
import ModelSelectionModal from '@/components/ModelSelectionModal';
import ThemeToggle from '@/components/theme-toggle';
import WikiTreeView from '@/components/WikiTreeView';
import { useLanguage } from '@/contexts/LanguageContext';
import { RepoInfo } from '@/types/repoinfo';
import getRepoUrl from '@/utils/getRepoUrl';
import {
  submitWikiTask,
  subscribeWikiTask,
  type WikiTaskStatusDto,
  type WikiTaskStructureDto,
} from '@/utils/wikiTask';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaBitbucket, FaBookOpen, FaComments, FaDownload, FaExclamationTriangle, FaFileExport, FaFolder, FaGithub, FaGitlab, FaHome, FaSync, FaTimes } from 'react-icons/fa';
// Define the WikiSection and WikiStructure types directly in this file
// since the imported types don't have the sections and rootSections properties
interface WikiSection {
  id: string;
  title: string;
  pages: string[];
  subsections?: string[];
}

interface WikiPage {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  relatedPages: string[];
  parentId?: string;
  isSection?: boolean;
  children?: string[];
}

interface WikiStructure {
  id: string;
  title: string;
  description: string;
  pages: WikiPage[];
  sections: WikiSection[];
  rootSections: string[];
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

// Helper function to generate cache key for localStorage
const getCacheKey = (owner: string, repo: string, repoType: string, language: string, isComprehensive: boolean = true): string => {
  return `deepwiki_cache_${repoType}_${owner}_${repo}_${language}_${isComprehensive ? 'comprehensive' : 'concise'}`;
};

export default function RepoWikiPage() {
  // Get route parameters and search params
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract owner and repo from route params
  const owner = params.owner as string;
  const repo = params.repo as string;

  // Extract tokens from search params
  const token = searchParams.get('token') || '';
  const localPath = searchParams.get('local_path') ? decodeURIComponent(searchParams.get('local_path') || '') : undefined;
  const repoUrl = searchParams.get('repo_url') ? decodeURIComponent(searchParams.get('repo_url') || '') : undefined;
  const providerParam = searchParams.get('provider') || '';
  const modelParam = searchParams.get('model') || '';
  const isCustomModelParam = searchParams.get('is_custom_model') === 'true';
  const customModelParam = searchParams.get('custom_model') || '';
  const language = searchParams.get('language') || 'en';
  const repoHost = (() => {
    if (!repoUrl) return '';
    try {
      return new URL(repoUrl).hostname.toLowerCase();
    } catch (e) {
      console.warn(`Invalid repoUrl provided: ${repoUrl}`);
      return '';
    }
  })();
  const repoType = repoHost?.includes('bitbucket')
    ? 'bitbucket'
    : repoHost?.includes('gitlab')
      ? 'gitlab'
      : repoHost?.includes('github')
        ? 'github'
        : searchParams.get('type') || 'github';

  // Import language context for translations
  const { messages } = useLanguage();

  // Initialize repo info
  const repoInfo = useMemo<RepoInfo>(() => ({
    owner,
    repo,
    type: repoType,
    token: token || null,
    localPath: localPath || null,
    repoUrl: repoUrl || null
  }), [owner, repo, repoType, localPath, repoUrl, token]);

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
  const [currentToken, setCurrentToken] = useState(token); // Track current effective token
  const [effectiveRepoInfo, setEffectiveRepoInfo] = useState(repoInfo); // Track effective repo info with cached data
  const [embeddingError, setEmbeddingError] = useState(false);

  // Backend-driven task progress (SPEC.md). Populated from the SSE stream while
  // the backend generates the wiki; drives the progress bar + processing list.
  const [generationProgress, setGenerationProgress] = useState<WikiTaskStatusDto | null>(null);
  // Unsubscribe handle for the active SSE task stream, so we can close it on
  // unmount / refresh and avoid leaking connections.
  const taskUnsubRef = useRef<null | (() => void)>(null);

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
  const includedDirs = searchParams.get('included_dirs') || '';
  const includedFiles = searchParams.get('included_files') || '';
  const [modelIncludedDirs, setModelIncludedDirs] = useState(includedDirs);
  const [modelIncludedFiles, setModelIncludedFiles] = useState(includedFiles);


  // Wiki type state - default to comprehensive view
  const isComprehensiveParam = searchParams.get('comprehensive') !== 'false';
  const [isComprehensiveView, setIsComprehensiveView] = useState(isComprehensiveParam);
  // Create a flag to track if data was loaded from cache to prevent immediate re-save
  const cacheLoadedSuccessfully = useRef(false);

  // Create a flag to ensure the effect only runs once
  const effectRan = React.useRef(false);

  // State for Ask modal
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const askComponentRef = useRef<{ clearConversation: () => void } | null>(null);

  // Code viewer drawer (rendered at modal level so its header isn't clipped by
  // the Ask panel's scroll container). Opened by codemap citation clicks.
  const [codeViewerOpen, setCodeViewerOpen] = useState(false);
  const [codeViewerTarget, setCodeViewerTarget] = useState<CodeTarget | null>(null);
  const [codeViewerFiles, setCodeViewerFiles] = useState<string[]>([]);
  const openCodeViewer = useCallback((target: CodeTarget, files: string[]) => {
    setCodeViewerFiles(files);
    setCodeViewerTarget(target);
    setCodeViewerOpen(true);
  }, []);

  // Authentication state
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Memoize repo info to avoid triggering updates in callbacks

  // Add useEffect to handle scroll reset
  useEffect(() => {
    // Scroll to top when currentPageId changes
    const wikiContent = document.getElementById('wiki-content');
    if (wikiContent) {
      wikiContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPageId]);

  // close the modal when escape is pressed
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAskModalOpen(false);
      }
    };

    if (isAskModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    // Cleanup on unmount or when modal closes
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isAskModalOpen]);

  // Fetch authentication status on component mount
  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        setIsAuthLoading(true);
        const response = await fetch('/api/auth/status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAuthRequired(data.auth_required);
      } catch (err) {
        console.error("Failed to fetch auth status:", err);
        // Assuming auth is required if fetch fails to avoid blocking UI for safety
        setAuthRequired(true);
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchAuthStatus();
  }, []);

  // Load a completed wiki from the server-side cache and render it. Returns true
  // when a valid cache was found and applied, false otherwise (caller then
  // submits a generation task). This is the render path for both the initial
  // page load and the SSE `done` handler.
  const loadWikiFromServerCache = useCallback(async (): Promise<boolean> => {
    setLoadingMessage(messages.loading?.fetchingCache || 'Checking for cached wiki...');
    try {
      const params = new URLSearchParams({
        owner: effectiveRepoInfo.owner,
        repo: effectiveRepoInfo.repo,
        repo_type: effectiveRepoInfo.type,
        language: language,
        comprehensive: isComprehensiveView.toString(),
      });
      const response = await fetch(`/api/wiki_cache?${params.toString()}`);

      if (!response.ok) {
        console.error('Error fetching wiki cache from server:', response.status, await response.text());
        return false;
      }

      const cachedData = await response.json(); // Returns null if no cache
      if (!(cachedData && cachedData.wiki_structure && cachedData.generated_pages && Object.keys(cachedData.generated_pages).length > 0)) {
        console.log('No valid wiki data in server cache or cache is empty.');
        return false;
      }

      console.log('Using server-cached wiki data');
      if (cachedData.model) {
        setSelectedModelState(cachedData.model);
      }
      if (cachedData.provider) {
        setSelectedProviderState(cachedData.provider);
      }

      // Update repoInfo
      if (cachedData.repo) {
        setEffectiveRepoInfo(cachedData.repo);
      } else if (cachedData.repo_url && !effectiveRepoInfo.repoUrl) {
        const updatedRepoInfo = { ...effectiveRepoInfo, repoUrl: cachedData.repo_url };
        setEffectiveRepoInfo(updatedRepoInfo); // Update effective repo info state
        console.log('Using cached repo_url:', cachedData.repo_url);
      }

      // Ensure the cached structure has sections and rootSections
      const cachedStructure = {
        ...cachedData.wiki_structure,
        sections: cachedData.wiki_structure.sections || [],
        rootSections: cachedData.wiki_structure.rootSections || []
      };

      // If sections or rootSections are missing, create intelligent ones based on page titles
      if (!cachedStructure.sections.length || !cachedStructure.rootSections.length) {
        const pages = cachedStructure.pages;
        const sections: WikiSection[] = [];
        const rootSections: string[] = [];

        // Group pages by common prefixes or categories
        const pageClusters = new Map<string, WikiPage[]>();

        // Define common categories that might appear in page titles
        const categories = [
          { id: 'overview', title: 'Overview', keywords: ['overview', 'introduction', 'about'] },
          { id: 'architecture', title: 'Architecture', keywords: ['architecture', 'structure', 'design', 'system'] },
          { id: 'features', title: 'Core Features', keywords: ['feature', 'functionality', 'core'] },
          { id: 'components', title: 'Components', keywords: ['component', 'module', 'widget'] },
          { id: 'api', title: 'API', keywords: ['api', 'endpoint', 'service', 'server'] },
          { id: 'data', title: 'Data Flow', keywords: ['data', 'flow', 'pipeline', 'storage'] },
          { id: 'models', title: 'Models', keywords: ['model', 'ai', 'ml', 'integration'] },
          { id: 'ui', title: 'User Interface', keywords: ['ui', 'interface', 'frontend', 'page'] },
          { id: 'setup', title: 'Setup & Configuration', keywords: ['setup', 'config', 'installation', 'deploy'] }
        ];

        // Initialize clusters with empty arrays
        categories.forEach(category => {
          pageClusters.set(category.id, []);
        });

        // Add an "Other" category for pages that don't match any category
        pageClusters.set('other', []);

        // Assign pages to categories based on title keywords
        pages.forEach((page: WikiPage) => {
          const title = page.title.toLowerCase();
          let assigned = false;

          // Try to find a matching category
          for (const category of categories) {
            if (category.keywords.some(keyword => title.includes(keyword))) {
              pageClusters.get(category.id)?.push(page);
              assigned = true;
              break;
            }
          }

          // If no category matched, put in "Other"
          if (!assigned) {
            pageClusters.get('other')?.push(page);
          }
        });

        // Create sections for non-empty categories
        for (const [categoryId, categoryPages] of pageClusters.entries()) {
          if (categoryPages.length > 0) {
            const category = categories.find(c => c.id === categoryId) ||
                            { id: categoryId, title: categoryId === 'other' ? 'Other' : categoryId.charAt(0).toUpperCase() + categoryId.slice(1) };

            const sectionId = `section-${categoryId}`;
            sections.push({
              id: sectionId,
              title: category.title,
              pages: categoryPages.map((p: WikiPage) => p.id)
            });
            rootSections.push(sectionId);

            // Update page parentId
            categoryPages.forEach((page: WikiPage) => {
              page.parentId = sectionId;
            });
          }
        }

        // If we still have no sections (unlikely), fall back to importance-based grouping
        if (sections.length === 0) {
          const highImportancePages = pages.filter((p: WikiPage) => p.importance === 'high').map((p: WikiPage) => p.id);
          const mediumImportancePages = pages.filter((p: WikiPage) => p.importance === 'medium').map((p: WikiPage) => p.id);
          const lowImportancePages = pages.filter((p: WikiPage) => p.importance === 'low').map((p: WikiPage) => p.id);

          if (highImportancePages.length > 0) {
            sections.push({ id: 'section-high', title: 'Core Components', pages: highImportancePages });
            rootSections.push('section-high');
          }
          if (mediumImportancePages.length > 0) {
            sections.push({ id: 'section-medium', title: 'Key Features', pages: mediumImportancePages });
            rootSections.push('section-medium');
          }
          if (lowImportancePages.length > 0) {
            sections.push({ id: 'section-low', title: 'Additional Information', pages: lowImportancePages });
            rootSections.push('section-low');
          }
        }

        cachedStructure.sections = sections;
        cachedStructure.rootSections = rootSections;
      }

      setWikiStructure(cachedStructure);
      setGeneratedPages(cachedData.generated_pages);
      setCurrentPageId(cachedStructure.pages.length > 0 ? cachedStructure.pages[0].id : undefined);
      setGenerationProgress(null);
      setIsLoading(false);
      setEmbeddingError(false);
      setLoadingMessage(undefined);
      cacheLoadedSuccessfully.current = true;
      return true;
    } catch (error) {
      console.error('Error loading from server cache:', error);
      return false;
    }
  }, [effectiveRepoInfo, language, isComprehensiveView, messages.loading?.fetchingCache]);

  // Map a backend task structure to the local WikiStructure shape used by the
  // progress UI (importance coercion + default sections/rootSections).
  const toWikiStructure = useCallback((s: WikiTaskStructureDto): WikiStructure => ({
    id: s.id,
    title: s.title,
    description: s.description,
    pages: s.pages.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      filePaths: p.filePaths,
      importance: p.importance === 'high' ? 'high' : p.importance === 'low' ? 'low' : 'medium',
      relatedPages: p.relatedPages,
    })),
    sections: [],
    rootSections: [],
  }), []);

  // Submit a backend wiki-generation task and follow it to completion via SSE.
  // The browser no longer orchestrates indexing / structure / page generation;
  // it only submits, streams progress, and loads the finished wiki from cache.
  const startGeneration = useCallback(async () => {
    // Tear down any previous stream before starting a new one.
    taskUnsubRef.current?.();
    taskUnsubRef.current = null;

    setWikiStructure(undefined);
    setCurrentPageId(undefined);
    setGeneratedPages({});
    setPagesInProgress(new Set());
    setGenerationProgress(null);
    setError(null);
    setEmbeddingError(false);
    setIsLoading(true);
    cacheLoadedSuccessfully.current = false;
    setLoadingMessage(messages.loading?.initializing || 'Initializing wiki generation...');

    const messageForStatus = (status: string): string => {
      switch (status) {
        case 'pending':
        case 'indexing':
          return messages.loading?.preparingIndex || 'Preparing repository index...';
        case 'determining_structure':
          return messages.loading?.determiningStructure || 'Determining wiki structure...';
        case 'generating':
          return messages.loading?.generatingPages || messages.common?.loading || 'Generating wiki pages...';
        default:
          return messages.common?.loading || 'Loading...';
      }
    };

    try {
      const model = isCustomSelectedModelState ? customSelectedModelState : selectedModelState;
      const result = await submitWikiTask({
        repo_url: getRepoUrl(effectiveRepoInfo),
        type: effectiveRepoInfo.type,
        owner: effectiveRepoInfo.owner,
        repo: effectiveRepoInfo.repo,
        comprehensive: isComprehensiveView,
        token: currentToken || undefined,
        provider: selectedProviderState || undefined,
        model: model || undefined,
        language,
        excluded_dirs: modelExcludedDirs || undefined,
        excluded_files: modelExcludedFiles || undefined,
        included_dirs: modelIncludedDirs || undefined,
        included_files: modelIncludedFiles || undefined,
      });

      // The variant is already generated: load it straight from the cache.
      if (result.from_cache) {
        const ok = await loadWikiFromServerCache();
        if (!ok) {
          setError('Wiki reported as cached but could not be loaded from the server.');
          setIsLoading(false);
          setLoadingMessage(undefined);
        }
        return;
      }

      // Otherwise follow the (new or joined) task via its SSE progress stream.
      const applyStatus = (status: WikiTaskStatusDto) => {
        setGenerationProgress(status);
        setLoadingMessage(messageForStatus(status.status));
        if (status.wiki_structure) {
          const structure = toWikiStructure(status.wiki_structure);
          setWikiStructure(prev => prev ?? structure);
          setCurrentPageId(prev => prev ?? (structure.pages[0]?.id));
        }
      };

      taskUnsubRef.current = subscribeWikiTask(result.task_id, {
        onProgress: applyStatus,
        onDone: async (status) => {
          if (status) setGenerationProgress(status);
          const ok = await loadWikiFromServerCache();
          if (!ok) {
            setError('Wiki generation finished but its result could not be loaded.');
            setIsLoading(false);
            setLoadingMessage(undefined);
          }
        },
        onError: async (message) => {
          // The task may have completed and expired (TTL) before we could read a
          // terminal event; try the cache before surfacing an error.
          const ok = await loadWikiFromServerCache();
          if (ok) return;
          if (message.toLowerCase().includes('ollama') && message.toLowerCase().includes('not found')) {
            setEmbeddingError(true);
          }
          setError(message);
          setIsLoading(false);
          setLoadingMessage(undefined);
        },
      });
    } catch (err) {
      console.error('Error starting wiki generation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
      setLoadingMessage(undefined);
    }
  }, [
    effectiveRepoInfo,
    currentToken,
    selectedProviderState,
    selectedModelState,
    isCustomSelectedModelState,
    customSelectedModelState,
    language,
    isComprehensiveView,
    modelExcludedDirs,
    modelExcludedFiles,
    modelIncludedDirs,
    modelIncludedFiles,
    messages.loading,
    messages.common?.loading,
    loadWikiFromServerCache,
    toWikiStructure,
  ]);

  // Close the SSE task stream when the component unmounts.
  useEffect(() => {
    return () => {
      taskUnsubRef.current?.();
      taskUnsubRef.current = null;
    };
  }, []);

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
      const repoUrl = getRepoUrl(effectiveRepoInfo);

      // Make API call to export wiki
      const response = await fetch(`/export/wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          type: effectiveRepoInfo.type,
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
      let filename = `${effectiveRepoInfo.repo}_wiki.${format === 'markdown' ? 'md' : 'json'}`;

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
  }, [wikiStructure, generatedPages, effectiveRepoInfo, language]);

  // No longer needed as we use the modal directly

  const confirmRefresh = useCallback(async (newToken?: string) => {
    setShowModelOptions(false);
    setLoadingMessage(messages.loading?.clearingCache || 'Clearing server cache...');
    setIsLoading(true); // Show loading indicator immediately

    try {
      const params = new URLSearchParams({
        owner: effectiveRepoInfo.owner,
        repo: effectiveRepoInfo.repo,
        repo_type: effectiveRepoInfo.type,
        language: language,
        provider: selectedProviderState,
        model: selectedModelState,
        is_custom_model: isCustomSelectedModelState.toString(),
        custom_model: customSelectedModelState,
        comprehensive: isComprehensiveView.toString(),
        authorization_code: authCode,
      });

      // Add file filters configuration
      if (modelExcludedDirs) {
        params.append('excluded_dirs', modelExcludedDirs);
      }
      if (modelExcludedFiles) {
        params.append('excluded_files', modelExcludedFiles);
      }

      if(authRequired && !authCode) {
        setIsLoading(false);
        console.error("Authorization code is required");
        setError('Authorization code is required');
        return;
      }

      const response = await fetch(`/api/wiki_cache?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        }
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
        if(response.status == 401) {
          setIsLoading(false);
          setLoadingMessage(undefined);
          setError('Failed to validate the authorization code');
          console.error('Failed to validate the authorization code')
          return;
        }
      }
    } catch (err) {
      console.warn('Error calling DELETE /api/wiki_cache:', err);
      setIsLoading(false);
      setEmbeddingError(false); // Reset embedding error state
      // Optionally, inform the user about the cache clear error
      // setError(\`Error clearing cache: ${err instanceof Error ? err.message : String(err)}. Trying to refresh...\`);
      throw err;
    }

    // Update token if provided
    if (newToken) {
      // Update current token state
      setCurrentToken(newToken);
      // Update the URL parameters to include the new token
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('token', newToken);
      window.history.replaceState({}, '', currentUrl.toString());
    }

    // Proceed with the rest of the refresh logic
    console.log('Refreshing wiki. Server cache will be overwritten upon new generation if not cleared.');

    // Clear the localStorage cache (if any remnants or if it was used before this change)
    const localStorageCacheKey = getCacheKey(effectiveRepoInfo.owner, effectiveRepoInfo.repo, effectiveRepoInfo.type, language, isComprehensiveView);
    localStorage.removeItem(localStorageCacheKey);

    // Reset cache loaded flag
    cacheLoadedSuccessfully.current = false;
    effectRan.current = false; // Allow the main data loading useEffect to run again

    // The server cache was just cleared, so submit a fresh generation task
    // directly. startGeneration() resets all wiki/progress/error state itself.
    await startGeneration();
  }, [effectiveRepoInfo, language, messages.loading, selectedProviderState, selectedModelState, isCustomSelectedModelState, customSelectedModelState, modelExcludedDirs, modelExcludedFiles, isComprehensiveView, authCode, authRequired, startGeneration]);

  // Start wiki generation when component mounts
  useEffect(() => {
    if (effectRan.current === false) {
      effectRan.current = true; // Set to true immediately to prevent re-entry due to StrictMode

      const loadData = async () => {
        // Try the server-side wiki cache first; if there is nothing to render,
        // submit a backend generation task and follow it via SSE.
        const loaded = await loadWikiFromServerCache();
        if (loaded) {
          return;
        }
        await startGeneration();
      };

      loadData();

    } else {
      console.log('Skipping duplicate repository fetch/cache check');
    }

    // Clean up function for this effect is not strictly necessary for loadData,
    // but keeping the main unmount cleanup in the other useEffect
  }, [effectiveRepoInfo.owner, effectiveRepoInfo.repo, effectiveRepoInfo.type, language, isComprehensiveView, loadWikiFromServerCache, startGeneration]);

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
            // Make sure wikiStructure has sections and rootSections
            const structureToCache = {
              ...wikiStructure,
              sections: wikiStructure.sections || [],
              rootSections: wikiStructure.rootSections || []
            };
            const dataToCache = {
              repo: effectiveRepoInfo,
              language: language,
              comprehensive: isComprehensiveView,
              wiki_structure: structureToCache,
              generated_pages: generatedPages,
              provider: selectedProviderState,
              model: selectedModelState
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
  }, [isLoading, error, wikiStructure, generatedPages, effectiveRepoInfo.owner, effectiveRepoInfo.repo, effectiveRepoInfo.type, effectiveRepoInfo.repoUrl, repoUrl, language, isComprehensiveView]);

  const handlePageSelect = (pageId: string) => {
    if (currentPageId != pageId) {
      setCurrentPageId(pageId)
    }
  };

  const [isModelSelectionModalOpen, setIsModelSelectionModalOpen] = useState(false);

  // Progress figures for the loading UI. Prefer the backend task progress
  // (SPEC.md: pages_done / pages_total + currently-processing page ids); fall
  // back to the local in-progress set for backward compatibility.
  const progressTotal = generationProgress?.pages_total || wikiStructure?.pages.length || 0;
  const progressDone = generationProgress
    ? generationProgress.pages_done
    : (wikiStructure ? wikiStructure.pages.length - pagesInProgress.size : 0);
  // Pages still to come, in structure order (backend generates them in order).
  // With per-page concurrency 1 the backend only reports a single in-flight id,
  // so we surface the remaining backlog (done count onward) to keep the old
  // "currently processing" list showing several upcoming titles.
  const processingPageIds = generationProgress
    ? (wikiStructure
        ? wikiStructure.pages.slice(generationProgress.pages_done).map(p => p.id)
        : generationProgress.current_page_ids)
    : Array.from(pagesInProgress);

  return (
    <div className="h-screen paper-texture p-4 md:p-8 flex flex-col">
      <style>{wikiStyles}</style>

      <header className="max-w-[90%] xl:max-w-[1400px] mx-auto mb-8 h-fit w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[var(--accent-primary)] hover:text-[var(--highlight)] flex items-center gap-1.5 transition-colors border-b border-[var(--border-color)] hover:border-[var(--accent-primary)] pb-0.5">
              <FaHome /> {messages.repoPage?.home || 'Home'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[90%] xl:max-w-[1400px] mx-auto overflow-y-auto">
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
            {wikiStructure && progressTotal > 0 && (
              <div className="w-full max-w-md mt-3">
                <div className="bg-[var(--background)]/50 rounded-full h-2 mb-3 overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${Math.max(5, 100 * progressDone / progressTotal)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--muted)] text-center">
                  {language === 'ja'
                    ? `${progressTotal}ページ中${progressDone}ページ完了`
                    : messages.repoPage?.pagesCompleted
                        ? messages.repoPage.pagesCompleted
                            .replace('{completed}', progressDone.toString())
                            .replace('{total}', progressTotal.toString())
                        : `${progressDone} of ${progressTotal} pages completed`}
                </p>

                {/* Show list of in-progress pages */}
                {processingPageIds.length > 0 && (
                  <div className="mt-4 text-xs">
                    <p className="text-[var(--muted)] mb-2">
                      {messages.repoPage?.currentlyProcessing || 'Currently processing:'}
                    </p>
                    <ul className="text-[var(--foreground)] space-y-1">
                      {processingPageIds.slice(0, 3).map(pageId => {
                        const page = wikiStructure.pages.find(p => p.id === pageId);
                        return page ? <li key={pageId} className="truncate border-l-2 border-[var(--accent-primary)]/30 pl-2">{page.title}</li> : null;
                      })}
                      {processingPageIds.length > 3 && (
                        <li className="text-[var(--muted)]">
                          {language === 'ja'
                            ? `...他に${processingPageIds.length - 3}ページ`
                            : messages.repoPage?.andMorePages
                                ? messages.repoPage.andMorePages.replace('{count}', (processingPageIds.length - 3).toString())
                                : `...and ${processingPageIds.length - 3} more`}
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
              {embeddingError ? (
                messages.repoPage?.embeddingErrorDefault || 'This error is related to the document embedding system used for analyzing your repository. Please verify your embedding model configuration, API keys, and try again. If the issue persists, consider switching to a different embedding provider in the model settings.'
              ) : (
                messages.repoPage?.errorMessageDefault || 'Please check that your repository exists and is public. Valid formats are "owner/repo", "https://github.com/owner/repo", "https://gitlab.com/owner/repo", "https://bitbucket.org/owner/repo", or local folder paths like "C:\\path\\to\\folder" or "/path/to/folder".'
              )}
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
            <div className="h-full w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 bg-[var(--background)]/50 rounded-lg rounded-r-none p-5 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-3 font-serif">{wikiStructure.title}</h3>
              <p className="text-[var(--muted)] text-sm mb-5 leading-relaxed">{wikiStructure.description}</p>

              {/* Display repository info */}
              <div className="text-xs text-[var(--muted)] mb-5 flex items-center">
                {effectiveRepoInfo.type === 'local' ? (
                  <div className="flex items-center">
                    <FaFolder className="mr-2" />
                    <span className="break-all">{effectiveRepoInfo.localPath}</span>
                  </div>
                ) : (
                  <>
                    {effectiveRepoInfo.type === 'github' ? (
                      <FaGithub className="mr-2" />
                    ) : effectiveRepoInfo.type === 'gitlab' ? (
                      <FaGitlab className="mr-2" />
                    ) : (
                      <FaBitbucket className="mr-2" />
                    )}
                    <a
                      href={effectiveRepoInfo.repoUrl ?? ''}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--accent-primary)] transition-colors border-b border-[var(--border-color)] hover:border-[var(--accent-primary)]"
                    >
                      {effectiveRepoInfo.owner}/{effectiveRepoInfo.repo}
                    </a>
                  </>
                )}
              </div>

              {/* Wiki Type Indicator */}
              <div className="mb-3 flex items-center text-xs text-[var(--muted)]">
                <span className="mr-2">Wiki Type:</span>
                <span className={`px-2 py-0.5 rounded-full ${isComprehensiveView
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                  : 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)]'}`}>
                  {isComprehensiveView
                    ? (messages.form?.comprehensive || 'Comprehensive')
                    : (messages.form?.concise || 'Concise')}
                </span>
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
              <WikiTreeView
                wikiStructure={wikiStructure}
                currentPageId={currentPageId}
                onPageSelect={handlePageSelect}
                messages={messages.repoPage}
              />
            </div>

            {/* Wiki Content */}
            <div id="wiki-content" className="w-full flex-grow p-6 lg:p-8 overflow-y-auto">
              {currentPageId && generatedPages[currentPageId] ? (
                <div className="max-w-[900px] xl:max-w-[1000px] mx-auto">
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 break-words font-serif">
                    {generatedPages[currentPageId].title}
                  </h3>



                  <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
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

      <footer className="max-w-[90%] xl:max-w-[1400px] mx-auto mt-8 flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center gap-4 text-center text-[var(--muted)] text-sm h-fit w-full bg-[var(--card-bg)] rounded-lg p-3 shadow-sm border border-[var(--border-color)]">
          <p className="flex-1 font-serif">
            {messages.footer?.copyright || 'DeepWiki - Generate Wiki from GitHub/Gitlab/Bitbucket repositories'}
          </p>
          <ThemeToggle />
        </div>
      </footer>

      {/* Floating Chat Button */}
      {!isLoading && wikiStructure && (
        <button
          onClick={() => { setIsAskModalOpen(true); setCodeViewerOpen(false); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--accent-primary)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--accent-primary)]/90 transition-all z-50"
          aria-label={messages.ask?.title || 'Ask about this repository'}
        >
          <FaComments className="text-xl" />
        </button>
      )}

      {/* Ask Modal - Always render but conditionally show/hide */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isAskModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-[var(--card-bg)] rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col relative overflow-hidden">
          {/* Close the whole panel */}
          <div className="flex items-center justify-end p-3 absolute top-0 right-0 z-30">
            <button
              onClick={() => {
                // Just close the modal without clearing the conversation
                setIsAskModalOpen(false);
                setCodeViewerOpen(false);
              }}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors bg-[var(--card-bg)]/80 rounded-full p-2"
              aria-label="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Split layout: conversation on the left, code viewer on the right.
              When no codemap citation needs a viewer, the conversation uses the
              full width (same as fast / deep-research modes). ~6:4 when open. */}
          <div className="flex-1 flex min-h-0">
            <div className={`overflow-y-auto p-4 min-h-0 ${codeViewerOpen ? 'w-3/5' : 'w-full'}`}>
              <Ask
                repoInfo={effectiveRepoInfo}
                provider={selectedProviderState}
                model={selectedModelState}
                isCustomModel={isCustomSelectedModelState}
                customModel={customSelectedModelState}
                language={language}
                onRef={(ref) => (askComponentRef.current = ref)}
                onOpenCodeViewer={openCodeViewer}
                onCloseCodeViewer={() => setCodeViewerOpen(false)}
              />
            </div>
            {codeViewerOpen && (
              <div className="w-2/5 min-w-[320px] min-h-0">
                <CodeViewer
                  isOpen={codeViewerOpen}
                  repoUrl={getRepoUrl(effectiveRepoInfo)}
                  repoType={effectiveRepoInfo.type}
                  token={effectiveRepoInfo.token ?? undefined}
                  files={codeViewerFiles}
                  target={codeViewerTarget}
                  onSelectFile={(f) =>
                    setCodeViewerTarget({ file_path: f, start_line: null, end_line: null, snippet: '' })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

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
        isComprehensiveView={isComprehensiveView}
        setIsComprehensiveView={setIsComprehensiveView}
        showFileFilters={true}
        excludedDirs={modelExcludedDirs}
        setExcludedDirs={setModelExcludedDirs}
        excludedFiles={modelExcludedFiles}
        setExcludedFiles={setModelExcludedFiles}
        includedDirs={modelIncludedDirs}
        setIncludedDirs={setModelIncludedDirs}
        includedFiles={modelIncludedFiles}
        setIncludedFiles={setModelIncludedFiles}
        onApply={confirmRefresh}
        showWikiType={true}
        showTokenInput={effectiveRepoInfo.type !== 'local' && !currentToken} // Show token input if not local and no current token
        repositoryType={effectiveRepoInfo.type as 'github' | 'gitlab' | 'bitbucket'}
        authRequired={authRequired}
        authCode={authCode}
        setAuthCode={setAuthCode}
        isAuthLoading={isAuthLoading}
      />
    </div>
  );
}
