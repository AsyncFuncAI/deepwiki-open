'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaWikipediaW, FaGithub, FaGitlab } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
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

export default function Home() {
  const router = useRouter();
  const [repositoryInput, setRepositoryInput] = useState('https://github.com/AsyncFuncAI/deepwiki-open');
  const [showTokenInputs, setShowTokenInputs] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [gitlabToken, setGitlabToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate click');
      return;
    }
    
    setIsSubmitting(true);
    
    // Parse repository input
    const parsedRepo = parseRepositoryInput(repositoryInput);
    
    if (!parsedRepo) {
      setError('Invalid repository format. Use "owner/repo", "https://github.com/owner/repo", or "https://gitlab.com/owner/repo" format.');
      setIsSubmitting(false);
      return;
    }
    
    const { owner, repo, type } = parsedRepo;
    
    // Store tokens in query params if they exist
    const params = new URLSearchParams();
    if (githubToken && type === 'github') {
      params.append('github_token', githubToken);
    }
    if (gitlabToken && type === 'gitlab') {
      params.append('gitlab_token', gitlabToken);
    }
    if (type !== 'github') {
      params.append('type', type);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Navigate to the dynamic route
    router.push(`/${owner}/${repo}${queryString}`);
    
    // The isSubmitting state will be reset when the component unmounts during navigation
  };

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col">
      <header className="max-w-6xl mx-auto mb-8 h-fit w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <FaWikipediaW className="mr-2 text-3xl text-purple-500" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">DeepWiki</h1>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
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
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Generate Wiki'}
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

      <main className="flex-1 max-w-6xl mx-auto overflow-y-auto">
        <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
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
      </main>

      <footer className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center gap-4 text-center text-gray-500 dark:text-gray-400 text-sm h-fit w-full">
          <p className="flex-1">DeepWiki - Generate Wiki from GitHub/Gitlab repositories</p>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}