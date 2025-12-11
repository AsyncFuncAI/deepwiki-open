'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FaTimes, FaTh, FaList } from 'react-icons/fa';

// Interface should match the structure from the API
interface ProcessedProject {
  id: string;
  owner: string;
  repo: string;
  name: string;
  repo_type: string;
  submittedAt: number;
  language: string;
}

interface ProcessedProjectsProps {
  showHeader?: boolean;
  maxItems?: number;
  className?: string;
  messages?: Record<string, Record<string, string>>; // Translation messages with proper typing
}

export default function ProcessedProjects({ 
  showHeader = true, 
  maxItems, 
  className = "",
  messages 
}: ProcessedProjectsProps) {
  const [projects, setProjects] = useState<ProcessedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Default messages fallback
  const defaultMessages = {
    title: 'Processed Wiki Projects',
    searchPlaceholder: 'Search projects by name, owner, or repository...',
    noProjects: 'No projects found in the server cache. The cache might be empty or the server encountered an issue.',
    noSearchResults: 'No projects match your search criteria.',
    processedOn: 'Processed on:',
    loadingProjects: 'Loading projects...',
    errorLoading: 'Error loading projects:',
    backToHome: 'Back to Home'
  };

  const t = (key: string) => {
    if (messages?.projects?.[key]) {
      return messages.projects[key];
    }
    return defaultMessages[key as keyof typeof defaultMessages] || key;
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/wiki/projects');
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setProjects(data as ProcessedProject[]);
      } catch (e: unknown) {
        console.error("Failed to load projects from API:", e);
        const message = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(message);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return maxItems ? projects.slice(0, maxItems) : projects;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.owner.toLowerCase().includes(query) ||
      project.repo.toLowerCase().includes(query) ||
      project.repo_type.toLowerCase().includes(query)
    );

    return maxItems ? filtered.slice(0, maxItems) : filtered;
  }, [projects, searchQuery, maxItems]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleDelete = async (project: ProcessedProject) => {
    if (!confirm(`Are you sure you want to delete project ${project.name}?`)) {
      return;
    }
    try {
      const response = await fetch('/api/wiki/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: project.owner,
          repo: project.repo,
          repo_type: project.repo_type,
          language: project.language,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorBody.error || response.statusText);
      }
      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch (e: unknown) {
      console.error('Failed to delete project:', e);
      alert(`Failed to delete project: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <div className={`${className}`}>
      {showHeader && (
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[var(--accent-primary)]">{t('title')}</h1>
            <Link href="/" className="text-[var(--accent-primary)] hover:underline">
              {t('backToHome')}
            </Link>
          </div>
        </header>
      )}

      {/* Search Bar and View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="block w-full pl-4 pr-12 py-3 border border-[#e0e0e0] dark:border-neutral-700 rounded-lg bg-white dark:bg-[#1f1f1f] text-[#242424] dark:text-neutral-200 placeholder:text-[#8f8f8f] dark:placeholder:text-neutral-400 focus:outline-none focus:border-[#6096ff] focus:ring-2 focus:ring-[#6096ff]/20 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-[var(--background)] border border-[var(--border-color)] rounded-[8.4px] p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-[8.4px] transition-colors ${
              viewMode === 'card'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
            title="Card View"
          >
            <FaTh className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-[8.4px] transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
            title="List View"
          >
            <FaList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-[var(--muted)]">{t('loadingProjects')}</p>}
      {error && <p className="text-[var(--highlight)]">{t('errorLoading')} {error}</p>}

      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 p-2 sm:p-3' : 'space-y-2'}>
            {filteredProjects.map((project) => (
            viewMode === 'card' ? (
              <div key={project.id} className="relative group bg-white dark:bg-[#1f1f1f] border border-[#e0e0e0] dark:border-neutral-700 rounded-lg min-h-[112px] shadow-sm hover:shadow-md transition-all p-4 hover:-translate-y-[2px] hover:bg-[#f8f8f8] dark:hover:bg-neutral-700/80">
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  className="absolute top-2 right-2 text-[var(--muted)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  title="Delete project"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <Link
                  href={`/${project.owner}/${project.repo}?type=${project.repo_type}&language=${project.language}`}
                  className="block focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3 min-h-[96px]">
                    <div className="flex-1">
                      <h3 className="text-[#242424] dark:text-neutral-100 font-semibold line-clamp-2 mb-2">
                        {project.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={project.repo_type === 'github'
                          ? 'inline-flex items-center gap-1 rounded-md border border-[#e0e0e0] dark:border-neutral-700 bg-[#6096ff]/10 text-[#6096ff] px-2.5 py-1 text-xs font-medium'
                          : 'inline-flex items-center rounded-md border border-[#e0e0e0] dark:border-neutral-700 bg-[#f0f0f0] dark:bg-neutral-800 text-[#242424] dark:text-neutral-300 px-2.5 py-1 text-xs font-medium'
                        }>
                          {project.repo_type}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-[#e0e0e0] dark:border-neutral-700 bg-[#f0f0f0] dark:bg-neutral-800 text-[#242424] dark:text-neutral-300 px-2.5 py-1 text-xs font-medium">
                          {project.language}
                        </span>
                      </div>
                      <p className="text-xs text-[#8f8f8f] dark:text-neutral-400">
                        {t('processedOn')} {new Date(project.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="ml-auto size-8 rounded-[8.4px] border border-neutral-200 bg-neutral-200 text-neutral-600 transition-colors flex items-center justify-center group-hover:bg-neutral-300 group-hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 dark:group-hover:bg-neutral-600 dark:group-hover:text-neutral-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path></svg>
                    </span>
                  </div>
                </Link>
              </div>
            ) : (
              <div key={project.id} className="relative min-h-[112px] p-4 border border-[#e0e0e0] dark:border-neutral-700 rounded-lg bg-white dark:bg-[#1f1f1f] transition-colors hover:bg-[#f8f8f8] dark:hover:bg-neutral-700/80 shadow-sm hover:shadow-md">
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  className="absolute top-2 right-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  title="Delete project"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <Link
                  href={`/${project.owner}/${project.repo}?type=${project.repo_type}&language=${project.language}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[#6096ff] hover:underline truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[#8f8f8f] dark:text-neutral-400 mt-1">
                      {t('processedOn')} {new Date(project.submittedAt).toLocaleDateString()} • {project.repo_type} • {project.language}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className="px-2.5 py-[2px] text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-[8.4px] border border-[var(--accent-primary)]/20">
                      {project.repo_type}
                    </span>
                  </div>
                </Link>
              </div>
            )
          ))}
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && searchQuery && (
        <p className="text-[var(--muted)]">{t('noSearchResults')}</p>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <p className="text-[var(--muted)]">{t('noProjects')}</p>
      )}
    </div>
  );
}
