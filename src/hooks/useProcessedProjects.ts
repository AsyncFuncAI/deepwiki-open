import { useState, useEffect } from 'react';
import { listWikiTasks } from '@/utils/wikiTask';

interface ProcessedProject {
  id: string;
  owner: string;
  repo: string;
  name: string;
  repo_type: string;
  submittedAt: number;
  language: string;
  status?: string;
}

export function useProcessedProjects() {
  const [projects, setProjects] = useState<ProcessedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Merged list: completed wikis first, then queued/in-progress tasks last.
        const data = await listWikiTasks();
        setProjects(
          data.map(task => ({
            id: task.id,
            owner: task.owner,
            repo: task.repo,
            name: task.name,
            repo_type: task.repo_type,
            language: task.language,
            submittedAt: task.submitted_at,
            status: task.status,
          })),
        );
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

  return { projects, isLoading, error };
}
