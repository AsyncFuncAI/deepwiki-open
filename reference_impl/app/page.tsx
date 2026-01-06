'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaWikipediaW, FaGithub, FaCoffee, FaTwitter } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
import Mermaid from '../components/Mermaid';
import ConfigurationModal from '@/components/ConfigurationModal';
import ProcessedProjects from '@/components/ProcessedProjects';
import { extractUrlPath, extractUrlDomain } from '@/utils/urlDecoder';
import { useProcessedProjects } from '@/hooks/useProcessedProjects';

import { useLanguage } from '@/contexts/LanguageContext';

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

export default function Home() {
  const router = useRouter();
  const { language, setLanguage, messages, supportedLanguages } = useLanguage();
  const { projects, isLoading: projectsLoading } = useProcessedProjects();

  // Create a simple translation function
  const t = (key: string, params: Record<string, string | number> = {}): string => {
    // Split the key by dots to access nested properties
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages;

    // Navigate through the nested properties
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return the key if the translation is not found
        return key;
      }
    }

    // If the value is a string, replace parameters
    if (typeof value === 'string') {
      return Object.entries(params).reduce((acc: string, [paramKey, paramValue]) => {
        return acc.replace(`{${paramKey}}`, String(paramValue));
      }, value);
    }

    // Return the key if the value is not a string
    return key;
  };

  const [repositoryInput, setRepositoryInput] = useState('https://github.com/AsyncFuncAI/deepwiki-open');

  const REPO_CONFIG_CACHE_KEY = 'deepwikiRepoConfigCache';

  const loadConfigFromCache = (repoUrl: string) => {
    if (!repoUrl) return;
    try {
      const cachedConfigs = localStorage.getItem(REPO_CONFIG_CACHE_KEY);
      if (cachedConfigs) {
        const configs = JSON.parse(cachedConfigs);
        const config = configs[repoUrl.trim()];
        if (config) {
          setSelectedLanguage(config.selectedLanguage || language);
          setIsComprehensiveView(config.isComprehensiveView === undefined ? true : config.isComprehensiveView);
          setProvider(config.provider || '');
          setModel(config.model || '');
          setIsCustomModel(config.isCustomModel || false);
          setCustomModel(config.customModel || '');
          setSelectedPlatform(config.selectedPlatform || 'github');
          setExcludedDirs(config.excludedDirs || '');
          setExcludedFiles(config.excludedFiles || '');
          setIncludedDirs(config.includedDirs || '');
          setIncludedFiles(config.includedFiles || '');
        }
      }
    } catch (error) {
      console.error('Error loading config from localStorage:', error);
    }
  };

  const handleRepositoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRepoUrl = e.target.value;
    setRepositoryInput(newRepoUrl);
    if (newRepoUrl.trim() === "") {
      // Optionally reset fields if input is cleared
    } else {
        loadConfigFromCache(newRepoUrl);
    }
  };

  useEffect(() => {
    if (repositoryInput) {
      loadConfigFromCache(repositoryInput);
    }
  }, []);

  // Provider-based model selection state
  const [provider, setProvider] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [customModel, setCustomModel] = useState<string>('');

  // Wiki type state - default to comprehensive view
  const [isComprehensiveView, setIsComprehensiveView] = useState<boolean>(true);

  const [excludedDirs, setExcludedDirs] = useState('');
  const [excludedFiles, setExcludedFiles] = useState('');
  const [includedDirs, setIncludedDirs] = useState('');
  const [includedFiles, setIncludedFiles] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'github' | 'gitlab' | 'bitbucket'>('github');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);

  // Authentication state
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Sync the language context with the selectedLanguage state
  useEffect(() => {
    setLanguage(selectedLanguage);
  }, [selectedLanguage, setLanguage]);

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

  // Parse repository URL/input and extract owner and repo
  const parseRepositoryInput = (input: string): {
    owner: string,
    repo: string,
    type: string,
    fullPath?: string,
    localPath?: string
  } | null => {
    input = input.trim();

    let owner = '', repo = '', type = 'github', fullPath;
    let localPath: string | undefined;

    // Handle Windows absolute paths (e.g., C:\path\to\folder)
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
    const customGitRegex = /^(?:https?:\/\/)?([^\/]+)\/(.+?)\/([^\/]+)(?:\.git)?\/?$/;

    if (windowsPathRegex.test(input)) {
      type = 'local';
      localPath = input;
      repo = input.split('\\').pop() || 'local-repo';
      owner = 'local';
    }
    // Handle Unix/Linux absolute paths (e.g., /path/to/folder)
    else if (input.startsWith('/')) {
      type = 'local';
      localPath = input;
      repo = input.split('/').filter(Boolean).pop() || 'local-repo';
      owner = 'local';
    }
    else if (customGitRegex.test(input)) {
      // Detect repository type based on domain
      const domain = extractUrlDomain(input);
      if (domain?.includes('github.com')) {
        type = 'github';
      } else if (domain?.includes('gitlab.com') || domain?.includes('gitlab.')) {
        type = 'gitlab';
      } else if (domain?.includes('bitbucket.org') || domain?.includes('bitbucket.')) {
        type = 'bitbucket';
      } else {
        type = 'web'; // fallback for other git hosting services
      }

      fullPath = extractUrlPath(input)?.replace(/\.git$/, '');
      const parts = fullPath?.split('/') ?? [];
      if (parts.length >= 2) {
        repo = parts[parts.length - 1] || '';
        owner = parts[parts.length - 2] || '';
      }
    }
    // Unsupported URL formats
    else {
      console.error('Unsupported URL format:', input);
      return null;
    }

    if (!owner || !repo) {
      return null;
    }

    // Clean values
    owner = owner.trim();
    repo = repo.trim();

    // Remove .git suffix if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    return { owner, repo, type, fullPath, localPath };
  };

  // State for configuration modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse repository input to validate
    const parsedRepo = parseRepositoryInput(repositoryInput);

    if (!parsedRepo) {
      setError('Invalid repository format. Use "owner/repo", GitHub/GitLab/BitBucket URL, or a local folder path like "/path/to/folder" or "C:\\path\\to\\folder".');
      return;
    }

    // If valid, open the configuration modal
    setError(null);
    setIsConfigModalOpen(true);
  };

  const validateAuthCode = async () => {
    try {
      if(authRequired) {
        if(!authCode) {
          return false;
        }
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({'code': authCode})
        });
        if (!response.ok) {
          return false;
        }
        const data = await response.json();
        return data.success || false;
      }
    } catch {
      return false;
    }
    return true;
  };

  const handleGenerateWiki = async () => {

    // Check authorization code
    const validation = await validateAuthCode();
    if(!validation) {
      setError(`Failed to validate the authorization code`);
      console.error(`Failed to validate the authorization code`);
      setIsConfigModalOpen(false);
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate click');
      return;
    }

    try {
      const currentRepoUrl = repositoryInput.trim();
      if (currentRepoUrl) {
        const existingConfigs = JSON.parse(localStorage.getItem(REPO_CONFIG_CACHE_KEY) || '{}');
        const configToSave = {
          selectedLanguage,
          isComprehensiveView,
          provider,
          model,
          isCustomModel,
          customModel,
          selectedPlatform,
          excludedDirs,
          excludedFiles,
          includedDirs,
          includedFiles,
        };
        existingConfigs[currentRepoUrl] = configToSave;
        localStorage.setItem(REPO_CONFIG_CACHE_KEY, JSON.stringify(existingConfigs));
      }
    } catch (error) {
      console.error('Error saving config to localStorage:', error);
    }

    setIsSubmitting(true);

    // Parse repository input
    const parsedRepo = parseRepositoryInput(repositoryInput);

    if (!parsedRepo) {
      setError('Invalid repository format. Use "owner/repo", GitHub/GitLab/BitBucket URL, or a local folder path like "/path/to/folder" or "C:\\path\\to\\folder".');
      setIsSubmitting(false);
      return;
    }

    const { owner, repo, type, localPath } = parsedRepo;

    // Store tokens in query params if they exist
    const params = new URLSearchParams();
    if (accessToken) {
      params.append('token', accessToken);
    }
    // Always include the type parameter
    params.append('type', (type == 'local' ? type : selectedPlatform) || 'github');
    // Add local path if it exists
    if (localPath) {
      params.append('local_path', encodeURIComponent(localPath));
    } else {
      params.append('repo_url', encodeURIComponent(repositoryInput));
    }
    // Add model parameters
    params.append('provider', provider);
    params.append('model', model);
    if (isCustomModel && customModel) {
      params.append('custom_model', customModel);
    }
    // Add file filters configuration
    if (excludedDirs) {
      params.append('excluded_dirs', excludedDirs);
    }
    if (excludedFiles) {
      params.append('excluded_files', excludedFiles);
    }
    if (includedDirs) {
      params.append('included_dirs', includedDirs);
    }
    if (includedFiles) {
      params.append('included_files', includedFiles);
    }

    // Add language parameter
    params.append('language', selectedLanguage);

    // Add comprehensive parameter
    params.append('comprehensive', isComprehensiveView.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';

    // Navigate to the dynamic route
    router.push(`/${owner}/${repo}${queryString}`);

    // The isSubmitting state will be reset when the component unmounts during navigation
  };

  return (
    <div className="h-screen paper-texture p-4 md:p-8 flex flex-col">
      <header className="max-w-6xl mx-auto mb-6 h-fit w-full">
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[var(--card-bg)] rounded-lg shadow-custom border border-[var(--border-color)] p-4">
          <div className="flex items-center">
            <div className="bg-[var(--accent-primary)] p-2 rounded-lg mr-3">
              <FaWikipediaW className="text-2xl text-white" />
            </div>
            <div className="mr-6">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--accent-primary)]">{t('common.appName')}</h1>
              <div className="flex flex-wrap items-baseline gap-x-2 md:gap-x-3 mt-0.5">
                <p className="text-xs text-[var(--muted)] whitespace-nowrap">{t('common.tagline')}</p>
                <div className="hidden md:inline-block">
                  <Link href="/wiki/projects"
                    className="text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--highlight)] hover:underline whitespace-nowrap">
                    {t('nav.wikiProjects')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 w-full max-w-3xl">
            {/* Repository URL input and submit button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={repositoryInput}
                  onChange={handleRepositoryInputChange}
                  placeholder={t('form.repoPlaceholder') || "owner/repo, GitHub/GitLab/BitBucket URL, or local folder path"}
                  className="input-japanese block w-full pl-10 pr-3 py-2.5 border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                {error && (
                  <div className="text-[var(--highlight)] text-xs mt-1">
                    {error}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn-japanese px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.processing') : t('common.generateWiki')}
              </button>
            </div>
          </form>

          {/* Configuration Modal */}
          <ConfigurationModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            repositoryInput={repositoryInput}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            supportedLanguages={supportedLanguages}
            isComprehensiveView={isComprehensiveView}
            setIsComprehensiveView={setIsComprehensiveView}
            provider={provider}
            setProvider={setProvider}
            model={model}
            setModel={setModel}
            isCustomModel={isCustomModel}
            setIsCustomModel={setIsCustomModel}
            customModel={customModel}
            setCustomModel={setCustomModel}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            accessToken={accessToken}
            setAccessToken={setAccessToken}
            excludedDirs={excludedDirs}
            setExcludedDirs={setExcludedDirs}
            excludedFiles={excludedFiles}
            setExcludedFiles={setExcludedFiles}
            includedDirs={includedDirs}
            setIncludedDirs={setIncludedDirs}
            includedFiles={includedFiles}
            setIncludedFiles={setIncludedFiles}
            onSubmit={handleGenerateWiki}
            isSubmitting={isSubmitting}
            authRequired={authRequired}
            authCode={authCode}
            setAuthCode={setAuthCode}
            isAuthLoading={isAuthLoading}
          />

        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full overflow-y-auto">
        <div
          className="min-h-full flex flex-col items-center p-8 pt-10 bg-[var(--card-bg)] rounded-lg shadow-custom card-japanese">

          {/* Conditionally show processed projects or welcome content */}
          {!projectsLoading && projects.length > 0 ? (
            <div className="w-full">
              {/* Header section for existing projects */}
              <div className="flex flex-col items-center w-full max-w-2xl mb-8 mx-auto">
                <div className="flex flex-col sm:flex-row items-center mb-6 gap-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-[var(--accent-primary)]/20 rounded-full blur-md"></div>
                    <FaWikipediaW className="text-5xl text-[var(--accent-primary)] relative z-10" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] font-serif mb-1">{t('projects.existingProjects')}</h2>
                    <p className="text-[var(--accent-primary)] text-sm max-w-md">{t('projects.browseExisting')}</p>
                  </div>
                </div>
              </div>

              {/* Show processed projects */}
              <ProcessedProjects
                showHeader={false}
                maxItems={6}
                messages={messages}
                className="w-full"
              />
            </div>
          ) : (
            <>
              {/* Header section */}
              <div className="flex flex-col items-center w-full max-w-2xl mb-8">
                <div className="flex flex-col sm:flex-row items-center mb-6 gap-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-[var(--accent-primary)]/20 rounded-full blur-md"></div>
                    <FaWikipediaW className="text-5xl text-[var(--accent-primary)] relative z-10" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] font-serif mb-1">{t('home.welcome')}</h2>
                    <p className="text-[var(--accent-primary)] text-sm max-w-md">{t('home.welcomeTagline')}</p>
                  </div>
                </div>

                <p className="text-[var(--foreground)] text-center mb-8 text-lg leading-relaxed">
                  {t('home.description')}
                </p>
              </div>

          {/* Quick Start section - redesigned for better spacing */}
          <div
            className="w-full max-w-2xl mb-10 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--accent-primary)] mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('home.quickStart')}
            </h3>
            <p className="text-sm text-[var(--foreground)] mb-3">{t('home.enterRepoUrl')}</p>
            <div className="grid grid-cols-1 gap-3 text-xs text-[var(--muted)]">
              <div
                className="bg-[var(--background)]/70 p-3 rounded border border-[var(--border-color)] font-mono overflow-x-hidden whitespace-nowrap"
              >https://github.com/AsyncFuncAI/deepwiki-open
              </div>
              <div
                className="bg-[var(--background)]/70 p-3 rounded border border-[var(--border-color)] font-mono overflow-x-hidden whitespace-nowrap"
              >https://gitlab.com/gitlab-org/gitlab
              </div>
              <div
                className="bg-[var(--background)]/70 p-3 rounded border border-[var(--border-color)] font-mono overflow-x-hidden whitespace-nowrap"
              >AsyncFuncAI/deepwiki-open
              </div>
              <div
                className="bg-[var(--background)]/70 p-3 rounded border border-[var(--border-color)] font-mono overflow-x-hidden whitespace-nowrap"
              >https://bitbucket.org/atlassian/atlaskit
              </div>
            </div>
          </div>

          {/* Visualization section - improved for better visibility */}
          <div
            className="w-full max-w-2xl mb-8 bg-[var(--background)]/70 rounded-lg p-6 border border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5 sm:mt-0" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-base font-semibold text-[var(--foreground)] font-serif">{t('home.advancedVisualization')}</h3>
            </div>
            <p className="text-sm text-[var(--foreground)] mb-5 leading-relaxed">
              {t('home.diagramDescription')}
            </p>

            {/* Diagrams with improved layout */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-custom">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3 font-serif">{t('home.flowDiagram')}</h4>
                <Mermaid chart={DEMO_FLOW_CHART} />
              </div>

              <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-custom">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3 font-serif">{t('home.sequenceDiagram')}</h4>
                <Mermaid chart={DEMO_SEQUENCE_CHART} />
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 w-full">
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)] shadow-custom">
          <p className="text-[var(--muted)] text-sm font-serif">{t('footer.copyright')}</p>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-5">
              <a href="https://github.com/AsyncFuncAI/deepwiki-open" target="_blank" rel="noopener noreferrer"
                className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                <FaGithub className="text-xl" />
              </a>
              <a href="https://buymeacoffee.com/sheing" target="_blank" rel="noopener noreferrer"
                className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                <FaCoffee className="text-xl" />
              </a>
              <a href="https://x.com/sashimikun_void" target="_blank" rel="noopener noreferrer"
                className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                <FaTwitter className="text-xl" />
              </a>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}