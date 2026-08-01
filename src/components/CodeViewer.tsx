'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { getApiBaseUrl } from '@/utils/websocketClient';

export interface CodeTarget {
  file_path: string;
  start_line: number | null;
  end_line: number | null;
  snippet: string;
}

interface CodeViewerProps {
  isOpen: boolean;
  repoUrl: string;
  repoType: string;
  token?: string;
  // Files available as tabs (the set of files cited by the codemap).
  files: string[];
  // Currently active file + the line range to highlight/scroll to.
  target: CodeTarget | null;
  onSelectFile: (filePath: string) => void;
}

const EXT_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', py: 'python',
  rb: 'ruby', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin', c: 'c',
  h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp', php: 'php',
  swift: 'swift', scala: 'scala', sh: 'bash', bash: 'bash', json: 'json',
  yaml: 'yaml', yml: 'yaml', toml: 'toml', md: 'markdown', sql: 'sql',
  html: 'markup', xml: 'markup', css: 'css',
};

const langOf = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANG[ext] ?? 'text';
};

const CodeViewer: React.FC<CodeViewerProps> = ({
  isOpen, repoUrl, repoType, token, files, target, onSelectFile,
}) => {
  const [contentByFile, setContentByFile] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeFile = target?.file_path ?? files[0] ?? null;

  // Fetch the active file's content (cached per file).
  useEffect(() => {
    if (!isOpen || !activeFile || contentByFile[activeFile] !== undefined) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      repo_url: repoUrl,
      file_path: activeFile,
      type: repoType || 'github',
    });
    if (token) params.set('token', token);
    fetch(`${getApiBaseUrl()}/codemap/file?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
        return res.json();
      })
      .then((data: { content: string }) => {
        if (!cancelled) setContentByFile((prev) => ({ ...prev, [activeFile]: data.content }));
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, activeFile, repoUrl, repoType, token, contentByFile]);

  // Scroll the highlighted range into view once content is available.
  useEffect(() => {
    if (!scrollRef.current || !target?.start_line) return;
    const el = scrollRef.current.querySelector<HTMLElement>('[data-highlight-anchor="true"]');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [target, contentByFile, activeFile]);

  if (!isOpen) return null;

  const content = activeFile ? contentByFile[activeFile] : undefined;
  const start = target?.start_line ?? 0;
  const end = target?.end_line ?? start;

  return (
    <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border-color)]/40">
      {/* Header + file tabs */}
      <div className="flex items-center px-3 py-2 border-b border-[var(--border-color)]/40">
        <div className="flex gap-1 overflow-x-auto">
          {files.map((f) => (
            <button
              key={f}
              onClick={() => onSelectFile(f)}
              className={`text-xs px-2 py-1 rounded-t whitespace-nowrap transition-colors ${
                f === activeFile
                  ? 'bg-[var(--accent-primary)]/15 text-[var(--foreground)]'
                  : 'text-[var(--foreground)]/60 hover:bg-[var(--background)]/50'
              }`}
              title={f}
            >
              {f.split('/').pop()}
            </button>
          ))}
        </div>
      </div>

      {/* File path breadcrumb */}
      {activeFile && (
        <div className="px-3 py-1 text-xs text-[var(--foreground)]/60 border-b border-[var(--border-color)]/20 font-mono truncate">
          {activeFile}{target?.start_line ? `:${start}${end !== start ? `-${end}` : ''}` : ''}
        </div>
      )}

      {/* Code body */}
      <div ref={scrollRef} className="flex-1 overflow-auto text-xs">
        {loading && <div className="p-4 text-[var(--foreground)]/60">Loading…</div>}
        {error && <div className="p-4 text-red-500">Failed to load file: {error}</div>}
        {!loading && !error && content !== undefined && activeFile && (
          <SyntaxHighlighter
            language={langOf(activeFile)}
            style={tomorrow}
            showLineNumbers
            wrapLines
            lineProps={(lineNumber: number) => {
              const highlighted = lineNumber >= start && lineNumber <= end && start > 0;
              return {
                style: highlighted
                  ? { display: 'block', backgroundColor: 'rgba(250, 204, 21, 0.18)' }
                  : { display: 'block' },
                ...(lineNumber === start ? { 'data-highlight-anchor': 'true' } : {}),
              } as React.HTMLProps<HTMLElement>;
            }}
            customStyle={{ margin: 0, background: 'transparent', fontSize: '0.75rem' }}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

export default CodeViewer;
