'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaFolder, FaArrowUp, FaHome } from 'react-icons/fa';

interface FolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

const FolderPicker: React.FC<FolderPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialPath,
}) => {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [directories, setDirectories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState('');

  const fetchDirectory = useCallback(async (path?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = path
        ? `/local_repo/browse?path=${encodeURIComponent(path)}`
        : '/local_repo/browse';

      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to browse directory');
      }

      const data = await response.json();
      setCurrentPath(data.current);
      setParentPath(data.parent);
      setDirectories(data.directories);
      setManualPath(data.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to browse directory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDirectory(initialPath);
    }
  }, [isOpen, initialPath, fetchDirectory]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleManualPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPath.trim()) {
      fetchDirectory(manualPath.trim());
    }
  };

  const handleSelect = () => {
    onSelect(currentPath);
    onClose();
  };

  const pathParts = currentPath.split(/[\\/]/).filter(Boolean);

  const handleBreadcrumbClick = (index: number) => {
    const newPath = '/' + pathParts.slice(0, index + 1).join('/');
    fetchDirectory(newPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--background)] rounded-lg shadow-lg w-full max-w-2xl overflow-hidden flex flex-col border border-[var(--border-color)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-medium text-[var(--foreground)]">Select Folder</h3>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation + Path Input */}
        <div className="px-5 pt-4 pb-2 space-y-3">
          <form onSubmit={handleManualPathSubmit} className="flex gap-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => fetchDirectory()}
                disabled={isLoading}
                className="px-2.5 py-2 rounded-md border border-[var(--border-color)] hover:bg-[var(--accent-secondary)] text-[var(--muted)] transition-colors disabled:opacity-50"
                title="Home directory"
              >
                <FaHome className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => parentPath && fetchDirectory(parentPath)}
                disabled={isLoading || !parentPath}
                className="px-2.5 py-2 rounded-md border border-[var(--border-color)] hover:bg-[var(--accent-secondary)] text-[var(--muted)] transition-colors disabled:opacity-50"
                title="Go up"
              >
                <FaArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border-color)] bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              placeholder="Enter path..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3.5 py-2 text-sm font-medium rounded-md bg-[var(--accent-primary)] text-[var(--background)] hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              Go
            </button>
          </form>

          {/* Breadcrumb */}
          <div className="flex items-center gap-0.5 text-xs text-[var(--muted)] overflow-x-auto pb-1">
            <button
              onClick={() => fetchDirectory('/')}
              className="hover:text-[var(--foreground)] transition-colors flex-shrink-0"
            >
              /
            </button>
            {pathParts.map((part, index) => (
              <React.Fragment key={index}>
                <span className="text-[var(--border-color)] flex-shrink-0">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="hover:text-[var(--foreground)] transition-colors truncate max-w-[150px]"
                  title={part}
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-2 p-2.5 bg-[var(--highlight)]/5 border border-[var(--highlight)]/20 rounded-md text-xs text-[var(--highlight)]">
            {error}
          </div>
        )}

        {/* Directory List */}
        <div className="mx-5 mb-4 border border-[var(--border-color)] rounded-md overflow-hidden">
          <div className="max-h-[350px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-[var(--muted)] text-sm">Loading...</div>
            ) : directories.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)] text-sm">No subdirectories</div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {directories.map((dir) => (
                  <button
                    key={dir}
                    onClick={() => fetchDirectory(`${currentPath}${currentPath.endsWith('/') ? '' : '/'}${dir}`)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--accent-secondary)] transition-colors text-left"
                  >
                    <FaFolder className="h-4 w-4 text-[var(--muted)] flex-shrink-0" />
                    <span className="text-[var(--foreground)] text-sm truncate">{dir}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={isLoading || !currentPath}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--accent-primary)] text-[var(--background)] hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderPicker;
