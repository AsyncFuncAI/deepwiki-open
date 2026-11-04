'use client';

import React, { useState, useEffect } from 'react';
import { FaGithub, FaGitlab, FaBitbucket, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface Repository {
  repo_url: string;
  access_token?: string;
  description?: string;
}

interface MultiRepoInputProps {
  onSubmit: (repositories: Repository[]) => void;
  isSubmitting: boolean;
}

const MultiRepoInput: React.FC<MultiRepoInputProps> = ({ onSubmit, isSubmitting }) => {
  const [repositories, setRepositories] = useState<Repository[]>([
    { repo_url: '', access_token: '', description: '' }
  ]);
  const [showTokenInputs, setShowTokenInputs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get language context for translations
  const { messages } = useLanguage();
  
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
  
  const handleFormSubmit = (e: React.FormEvent) => {
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
    
    // Clear error and submit
    setError(null);
    onSubmit(validRepositories);
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2 font-serif">
          {messages?.multiRepo?.title || 'Multi-Repository Analysis'}
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          {messages?.multiRepo?.description || 'Add multiple repositories to analyze how they interact with each other.'}
        </p>
      </div>
      
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        {repositories.map((repo, index) => (
          <div key={index} className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)]">
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
                  className="input-japanese block w-full pl-10 pr-3 py-2.5 border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
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
                  className="input-japanese block w-full pl-10 pr-3 py-2.5 border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
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
                    className="input-japanese block w-full pl-10 pr-3 py-2.5 border-[var(--border-color)] rounded-lg bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
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
            (messages?.multiRepo?.analyzing || 'Analyzing...') : 
            (messages?.multiRepo?.analyze || 'Analyze Repositories')}
        </button>
      </form>
    </div>
  );
};

export default MultiRepoInput;
