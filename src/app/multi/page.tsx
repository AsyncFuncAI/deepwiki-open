'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaGithub, FaGitlab, FaBitbucket, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
import MultiRepoInput from '@/components/MultiRepoInput';
import MultiRepoChat from '@/components/MultiRepoChat';
import { useLanguage } from '@/contexts/LanguageContext';

interface Repository {
  repo_url: string;
  access_token?: string;
  description?: string;
}

export default function MultiRepoPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([
    { repo_url: '', access_token: '', description: '' }
  ]);
  const [showTokenInputs, setShowTokenInputs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localOllama, setLocalOllama] = useState(false);
  const [useOpenRouter, setUseOpenRouter] = useState(false);
  const [openRouterModel, setOpenRouterModel] = useState('openai/gpt-4o');
  const [mode, setMode] = useState<'wiki' | 'chat'>('wiki');

  // Get language context for translations
  const { messages, language } = useLanguage();

  // Check for mode parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'wiki' || modeParam === 'chat') {
        setMode(modeParam);
      }
    }
  }, []);

  // Parse repository URL/input and validate
  const parseRepositoryInput = (input: string): boolean => {
    input = input.trim();

    // Handle Windows absolute paths (e.g., C:\path\to\folder)
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
    if (windowsPathRegex.test(input)) {
      return true;
    }
    // Handle Unix/Linux absolute paths (e.g., /path/to/folder)
    else if (input.startsWith('/')) {
      return true;
    }
    // Handle GitHub URL format
    else if (input.startsWith('https://github.com/')) {
      const parts = input.replace('https://github.com/', '').split('/');
      return parts.length >= 2 && parts[0] && parts[1];
    }
    // Handle GitLab URL format
    else if (input.startsWith('https://gitlab.com/')) {
      const parts = input.replace('https://gitlab.com/', '').split('/');
      return parts.length >= 2 && parts[0] && parts[1];
    }
    // Handle Bitbucket URL format
    else if (input.startsWith('https://bitbucket.org/')) {
      const parts = input.replace('https://bitbucket.org/', '').split('/');
      return parts.length >= 2 && parts[0] && parts[1];
    }
    // Handle owner/repo format (assume GitHub)
    else if (input.includes('/')) {
      const parts = input.split('/');
      return parts.length === 2 && parts[0] && parts[1];
    }

    return false;
  };

  const addRepository = () => {
    setRepositories([...repositories, { repo_url: '', access_token: '', description: '' }]);
  };

  const removeRepository = (index: number) => {
    if (repositories.length > 1) {
      const newRepositories = [...repositories];
      newRepositories.splice(index, 1);
      setRepositories(newRepositories);
    }
  };

  const updateRepository = (index: number, field: keyof Repository, value: string) => {
    const newRepositories = [...repositories];
    newRepositories[index] = { ...newRepositories[index], [field]: value };
    setRepositories(newRepositories);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate repositories
    const validRepositories = repositories.filter(repo => repo.repo_url.trim() !== '');

    if (validRepositories.length === 0) {
      setError(messages?.multiRepo?.errorNoRepos || 'Please add at least one repository.');
      return;
    }

    // Validate repository URLs
    for (const repo of validRepositories) {
      if (!parseRepositoryInput(repo.repo_url)) {
        setError(messages?.multiRepo?.errorInvalidRepo || 'Invalid repository format. Use "owner/repo", GitHub/GitLab/BitBucket URL, or a local folder path.');
        return;
      }
    }

    setIsSubmitting(true);

    if (mode === 'wiki') {
      // Create URL parameter with repository URLs
      const repoParams = validRepositories.map(repo => encodeURIComponent(repo.repo_url)).join(',');

      // Redirect to the wiki page
      router.push(`/multi/wiki?repos=${repoParams}`);
    } else {
      // Chat mode - initialize the multi-repository system
      setIsAnalyzing(true);

      try {
        // Initialize the multi-repository system
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8001'}/multi_repo/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repositories: validRepositories,
            local_ollama: localOllama,
            language: language
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Initialization result:', result);

        // Set repositories for chat
        setRepositories(validRepositories);

      } catch (error) {
        console.error('Error initializing multi-repository system:', error);
        alert(messages?.multiRepo?.errorInitializing || 'Error initializing multi-repository system. Please try again.');
      } finally {
        setIsSubmitting(false);
        setIsAnalyzing(false);
      }
    }
  };

  // Legacy handler for MultiRepoInput component
  const handleSubmit = async (repos: Repository[]) => {
    setIsSubmitting(true);
    setIsAnalyzing(true);

    try {
      // Initialize the multi-repository system
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8001'}/multi_repo/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: repos,
          local_ollama: localOllama,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Initialization result:', result);

      // Set repositories for chat
      setRepositories(repos);

    } catch (error) {
      console.error('Error initializing multi-repository system:', error);
      alert(messages?.multiRepo?.errorInitializing || 'Error initializing multi-repository system. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <header className="py-4 px-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
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
        </div>
      </header>

      <main className="flex-grow py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
              {messages?.multiRepo?.pageTitle || 'Multi-Repository Analysis'}
            </h1>
            <p className="text-[var(--muted)] max-w-2xl mx-auto">
              {messages?.multiRepo?.pageDescription || 'Analyze multiple repositories together to understand how they interact as a system. Discover connections, data flows, and dependencies between repositories.'}
            </p>
          </div>

          <div className="mb-8">
            <div className="bg-[var(--card-bg)] rounded-lg p-6 shadow-custom card-japanese">
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => setMode('wiki')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                        mode === 'wiki'
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                          : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border-color)] hover:bg-[var(--background)]/80'
                      }`}
                    >
                      Generate Wiki
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('chat')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                        mode === 'chat'
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                          : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border-color)] hover:bg-[var(--background)]/80'
                      }`}
                    >
                      Interactive Chat
                    </button>
                  </div>
                </div>

                <p className="text-sm text-center text-[var(--muted)] mb-4">
                  {mode === 'wiki'
                    ? 'Generate a comprehensive wiki with diagrams showing relationships between repositories'
                    : 'Chat with an AI assistant about multiple repositories and their interactions'
                  }
                </p>
              </div>

              {mode === 'chat' && (
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="localOllama"
                        checked={localOllama}
                        onChange={(e) => setLocalOllama(e.target.checked)}
                        className="rounded text-[var(--accent-primary)]"
                      />
                      <label htmlFor="localOllama" className="text-sm text-[var(--foreground)]">
                        {messages?.form?.useLocalOllama || 'Use Local Ollama'}
                      </label>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="useOpenRouter"
                        checked={useOpenRouter}
                        onChange={(e) => setUseOpenRouter(e.target.checked)}
                        className="rounded text-[var(--accent-primary)]"
                      />
                      <label htmlFor="useOpenRouter" className="text-sm text-[var(--foreground)]">
                        {messages?.form?.useOpenRouter || 'Use OpenRouter'}
                      </label>
                    </div>

                    {useOpenRouter && (
                      <div className="mt-2">
                        <select
                          value={openRouterModel}
                          onChange={(e) => setOpenRouterModel(e.target.value)}
                          className="w-full p-2 text-sm bg-[var(--background)] border border-[var(--border-color)] rounded-md"
                        >
                          <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                          <option value="anthropic/claude-3-opus">Anthropic Claude 3 Opus</option>
                          <option value="anthropic/claude-3-sonnet">Anthropic Claude 3 Sonnet</option>
                          <option value="google/gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                {repositories.map((repo, index) => (
                  <div key={index} className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--background)]/50">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-[var(--foreground)]">
                          {messages?.multiRepo?.repository || 'Repository'} {index + 1}
                        </h3>
                        {repositories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRepository(index)}
                            className="text-[var(--muted)] hover:text-[var(--highlight)] transition-colors"
                            aria-label="Remove repository"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={repo.repo_url}
                          onChange={(e) => updateRepository(index, 'repo_url', e.target.value)}
                          placeholder={messages?.multiRepo?.repoPlaceholder || "owner/repo, GitHub/GitLab/BitBucket URL, or local folder path"}
                          className="input-japanese block w-full pl-10 pr-3 py-2.5 border border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
                          required
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]">
                          <FaGithub />
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={repo.description || ''}
                          onChange={(e) => updateRepository(index, 'description', e.target.value)}
                          placeholder={messages?.multiRepo?.descriptionPlaceholder || "Description of this repository's role (optional)"}
                          className="input-japanese block w-full pl-10 pr-3 py-2.5 border border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]">
                          <FaInfoCircle />
                        </div>
                      </div>

                      {showTokenInputs && (
                        <div className="relative">
                          <input
                            type="password"
                            value={repo.access_token || ''}
                            onChange={(e) => updateRepository(index, 'access_token', e.target.value)}
                            placeholder={messages?.multiRepo?.tokenPlaceholder || "Access token for private repository (optional)"}
                            className="input-japanese block w-full pl-10 pr-3 py-2.5 border border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]">
                            <FaGithub />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={addRepository}
                    className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <FaPlus size={14} />
                    {messages?.multiRepo?.addRepo || 'Add Repository'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTokenInputs(!showTokenInputs)}
                    className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showTokenInputs ?
                      (messages?.multiRepo?.hideTokens || 'Hide Access Tokens') :
                      (messages?.multiRepo?.showTokens || 'Show Access Tokens')}
                  </button>
                </div>

                {error && (
                  <div className="text-[var(--highlight)] text-sm mt-1">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-japanese mt-4 py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ?
                    (mode === 'wiki' ? 'Generating Wiki...' : 'Preparing Chat...') :
                    (mode === 'wiki' ? 'Generate Wiki' : 'Start Chat')}
                </button>
              </form>
            </div>
          </div>

          {mode === 'chat' && repositories.length > 0 && repositories[0].repo_url !== '' && (
            <div className="bg-[var(--card-bg)] rounded-lg p-6 shadow-custom card-japanese">
              <h2 className="text-xl font-bold font-serif text-[var(--foreground)] mb-4">
                {messages?.multiRepo?.chatTitle || 'Multi-Repository Chat'}
              </h2>
              <MultiRepoChat
                repositories={repositories}
                localOllama={localOllama}
                useOpenRouter={useOpenRouter}
                openRouterModel={openRouterModel}
                language={language}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 px-6 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <p className="text-sm text-[var(--muted)] font-serif">
            {messages?.footer?.copyright || 'DeepWiki - Generate Wiki from GitHub/Gitlab/Bitbucket repositories'}
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/AsyncFuncAI/deepwiki-open"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <FaGithub size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
