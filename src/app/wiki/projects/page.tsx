'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function WikiProjectsPage() {
  const [projects, setProjects] = useState<ProcessedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (data.error) { // Handle errors returned in the JSON body from our API
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

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[var(--accent-primary)]">Processed Wiki Projects</h1>
          <Link href="/" className="text-[var(--accent-primary)] hover:underline">
            Back to Home
          </Link>
        </div>
      </header>

      {isLoading && <p className="text-[var(--muted)]">Loading projects...</p>}
      {error && <p className="text-[var(--highlight)]">Error loading projects: {error}</p>}

      {!isLoading && !error && projects.length > 0 && (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id} className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] shadow-sm">
              <Link 
                href={`/${project.owner}/${project.repo}?type=${project.repo_type}&language=${project.language}`}
                className="text-xl font-semibold text-[var(--link-color)] hover:underline"
              >
                {project.name} <span className="text-xs text-[var(--muted)]">({project.repo_type}, {project.language})</span>
              </Link>
              <p className="text-xs text-[var(--muted)] mt-1">
                Processed on: {new Date(project.submittedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <p className="text-[var(--muted)]">No projects found in the server cache. The cache might be empty or the server encountered an issue.</p>
      )}
    </div>
  );
} 