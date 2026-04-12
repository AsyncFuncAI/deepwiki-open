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
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Processed Projects</h1>
            <Link href="/" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
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
            className="w-full px-4 py-3 border-0 border-b-2 border-[var(--border-color)] bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 transition-all"
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
        <div className="flex items-center bg-[var(--background)] border border-[var(--border-color)] rounded-xl p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'card'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
            title="Card View"
          >
            <FaTh className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
            title="List View"
          >
            <FaList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-[var(--muted)]">{t('loadingProjects')}</p>}
      {error && <p className="text-red-500">{t('errorLoading')} {error}</p>}

      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {filteredProjects.map((project) => (
            viewMode === 'card' ? (
              <div key={project.id} className="group relative p-5 border border-[var(--border-color)] rounded-2xl bg-[var(--card-bg)] hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200">
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  className="absolute top-3 right-3 text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete project"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <Link
                  href={`/${project.owner}/${project.repo}?type=${project.repo_type}&language=${project.language}`}
                  className="block"
                >
                  <h3 className="text-base font-semibold text-blue-500 hover:text-blue-600 mb-3 line-clamp-2 pr-6">
                    {project.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full">
                      {project.repo_type}
                    </span>
                    <span className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                      {project.language}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {t('processedOn')} {new Date(project.submittedAt).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            ) : (
              <div key={project.id} className="group relative p-4 border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  className="absolute top-3 right-3 text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete project"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <Link
                  href={`/${project.owner}/${project.repo}?type=${project.repo_type}&language=${project.language}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-blue-500 hover:text-blue-600 truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {t('processedOn')} {new Date(project.submittedAt).toLocaleDateString()} • {project.repo_type} • {project.language}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full">
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
