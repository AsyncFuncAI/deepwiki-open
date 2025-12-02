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
  const [selectedPlatform, setSelectedPlatform] = useState<'github' | 'gitlab' | 'bitbucket' | 'azure'>('github');
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
      } else if (domain?.includes('dev.azure.com') || domain?.includes('visualstudio.com')) {
        type = 'azure';
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
    <div className="h-screen cyberpunk-grid p-4 md:p-8 flex flex-col scanlines">
      <header className="max-w-7xl mx-auto mb-8 h-fit w-full">
        <div className="card-cyberpunk p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg opacity-20 blur-md neon-glow-cyan"></div>
                <div className="relative bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] p-3 rounded-lg transform hover:scale-105 transition-transform">
                  <FaWikipediaW className="text-3xl text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-cyberpunk text-2xl md:text-4xl glitch" data-text={t('common.appName')}>
                  <span className="neon-glow-cyan">{t('common.appName')}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="font-terminal text-xs text-[var(--muted)] tracking-wider">
                    {t('common.tagline').toUpperCase()}
                  </span>
                  <div className="hidden lg:inline-block">
                    <Link href="/wiki/projects"
                      className="font-terminal text-xs text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors tracking-wider border border-[var(--accent-primary)]/30 px-3 py-1 hover:neon-glow-cyan">
                      [{t('nav.wikiProjects').toUpperCase()}]
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Repository Input Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 w-full lg:max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={repositoryInput}
                    onChange={handleRepositoryInputChange}
                    placeholder={t('form.repoPlaceholder') || "OWNER/REPO | GITHUB/GITLAB/BITBUCKET URL | LOCAL PATH"}
                    className="input-cyberpunk w-full pl-12 pr-4 py-3 font-terminal text-sm placeholder-[var(--muted)]"
                  />
                  {error && (
                    <div className="absolute -bottom-6 left-0 font-terminal text-xs text-[var(--error)] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-cyberpunk font-terminal text-sm relative group"
                  disabled={isSubmitting}
                >
                  <span className="relative z-10">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="loading-cyberpunk"></div>
                        {t('common.processing').toUpperCase()}
                      </span>
                    ) : (
                      <>{t('common.generateWiki').toUpperCase()}</>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>

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
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center p-8 pt-10 card-cyberpunk">

          {/* Conditionally show processed projects or welcome content */}
          {!projectsLoading && projects.length > 0 ? (
            <div className="w-full">
              {/* Header section for existing projects */}
              <div className="flex flex-col items-center w-full max-w-3xl mb-10 mx-auto text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 holographic rounded-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] p-4 rounded-lg neon-glow-cyan">
                    <FaWikipediaW className="text-6xl text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="font-cyberpunk text-3xl md:text-4xl mb-3 glitch" data-text={t('projects.existingProjects')}>
                    <span className="neon-glow-cyan">{t('projects.existingProjects')}</span>
                  </h2>
                  <p className="font-terminal text-sm text-[var(--accent-primary)] max-w-2xl mx-auto tracking-wider">
                    {t('projects.browseExisting').toUpperCase()}
                  </p>
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
              {/* Welcome Section */}
              <div className="flex flex-col items-center w-full max-w-4xl mb-12 text-center">
                <div className="relative mb-8">
                  <div className="absolute -inset-6 holographic rounded-full opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] p-6 rounded-full neon-glow-cyan animate-pulse">
                    <FaWikipediaW className="text-7xl text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="font-cyberpunk text-4xl md:text-5xl lg:text-6xl mb-4 glitch" data-text={t('home.welcome')}>
                    <span className="neon-glow-cyan">{t('home.welcome')}</span>
                  </h2>
                  <p className="font-terminal text-lg text-[var(--accent-secondary)] max-w-3xl mx-auto mb-8 leading-relaxed tracking-wider">
                    {t('home.description')}
                  </p>
                </div>
              </div>

              {/* Quick Start Terminal */}
              <div className="w-full max-w-4xl mb-12 card-cyberpunk holographic border border-[var(--accent-primary)]/30">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--error)] neon-glow-magenta"></div>
                      <div className="w-3 h-3 rounded-full bg-[var(--warning)]" style={{boxShadow: '0 0 10px rgba(255, 217, 61, 0.5)'}}></div>
                      <div className="w-3 h-3 rounded-full bg-[var(--success)] neon-glow-green"></div>
                    </div>
                    <h3 className="font-cyberpunk text-sm text-[var(--accent-primary)] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      TERMINAL_QUICK_START.EXE
                    </h3>
                  </div>
                  <div className="font-terminal text-xs space-y-2">
                    <p className="text-[var(--accent-tertiary)]">
                      <span className="text-[var(--muted)]">$</span> enter repository url to begin documentation scan...
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-[var(--muted)]">
                      <div className="bg-[var(--surface)]/50 p-3 rounded border-l-2 border-[var(--accent-primary)] font-mono tracking-wider hover:border-[var(--accent-secondary)] transition-colors">
                        <span className="text-[var(--accent-primary)]">></span> https://github.com/AsyncFuncAI/deepwiki-open
                      </div>
                      <div className="bg-[var(--surface)]/50 p-3 rounded border-l-2 border-[var(--accent-secondary)] font-mono tracking-wider hover:border-[var(--accent-tertiary)] transition-colors">
                        <span className="text-[var(--accent-secondary)]">></span> https://gitlab.com/gitlab-org/gitlab
                      </div>
                      <div className="bg-[var(--surface)]/50 p-3 rounded border-l-2 border-[var(--accent-tertiary)] font-mono tracking-wider hover:border-[var(--accent-primary)] transition-colors">
                        <span className="text-[var(--accent-tertiary)]">></span> AsyncFuncAI/deepwiki-open
                      </div>
                      <div className="bg-[var(--surface)]/50 p-3 rounded border-l-2 border-[var(--highlight)] font-mono tracking-wider hover:neon-glow-cyan transition-colors">
                        <span className="text-[var(--highlight)]">></span> https://bitbucket.org/atlassian/atlaskit
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualization Matrix */}
              <div className="w-full max-w-5xl mb-12">
                <div className="card-cyberpunk overflow-hidden">
                  <div className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="font-cyberpunk text-lg text-white">VISUALIZATION_MATRIX</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="font-terminal text-sm text-[var(--foreground)] mb-6 leading-relaxed">
                      <span className="text-[var(--accent-primary)]">// </span>
                      {t('home.diagramDescription')}
                    </p>

                    {/* Diagram Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-cyberpunk scanlines border border-[var(--accent-primary)]/30">
                        <div className="p-4">
                          <h4 className="font-cyberpunk text-sm text-[var(--accent-primary)] mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full neon-glow-cyan"></div>
                            FLOW_DIAGRAM.EXE
                          </h4>
                          <div className="bg-[var(--surface)]/50 rounded p-3">
                            <Mermaid chart={DEMO_FLOW_CHART} />
                          </div>
                        </div>
                      </div>

                      <div className="card-cyberpunk scanlines border border-[var(--accent-secondary)]/30">
                        <div className="p-4">
                          <h4 className="font-cyberpunk text-sm text-[var(--accent-secondary)] mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-[var(--accent-secondary)] rounded-full neon-glow-magenta"></div>
                            SEQUENCE_PROTOCOL.EXE
                          </h4>
                          <div className="bg-[var(--surface)]/50 rounded p-3">
                            <Mermaid chart={DEMO_SEQUENCE_CHART} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-8 mb-4">
        <div className="card-cyberpunk holographic border border-[var(--accent-primary)]/20">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 p-6">
            <div className="flex flex-col items-center lg:items-start gap-2">
              <p className="font-terminal text-xs text-[var(--muted)] tracking-wider">
                © {new Date().getFullYear()} DEEPWIKI_SYSTEM // NEURAL_DOCUMENTATION_INTERFACE
              </p>
              <p className="font-terminal text-xs text-[var(--accent-tertiary)] tracking-wider">
                STATUS: OPERATIONAL // PROTOCOL: CYBERPUNK_V2.0
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-4">
                <a href="https://github.com/AsyncFuncAI/deepwiki-open" target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--accent-primary)] hover:neon-glow-cyan transition-all duration-300 group">
                  <FaGithub className="text-xl transform group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://buymeacoffee.com/sheing" target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--accent-secondary)] hover:neon-glow-magenta transition-all duration-300 group">
                  <FaCoffee className="text-xl transform group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://x.com/sashimikun_void" target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--accent-tertiary)] hover:neon-glow-green transition-all duration-300 group">
                  <FaTwitter className="text-xl transform group-hover:scale-110 transition-transform" />
                </a>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}