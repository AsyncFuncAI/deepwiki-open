'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from './Mermaid';
import type { CodemapCitation, CodemapData, CodemapPhase } from '@/utils/websocketClient';

export type PhaseStatus = 'pending' | 'active' | 'done';

interface CodeMapProps {
  data: CodemapData | null;
  // Status for each of the three generation phases.
  phaseStatus: Record<CodemapPhase, PhaseStatus>;
  error?: string | null;
  onCitationClick: (citation: CodemapCitation) => void;
}

const PHASE_ORDER: CodemapPhase[] = ['analyzing', 'initial_codemap', 'diagrams'];

// Header text + indented sub-steps shown for the currently active phase,
// mirroring the Deep Research progress display.
const PHASE_DETAIL: Record<CodemapPhase, { header: string; items: { color: string; text: string }[] }> = {
  analyzing: {
    header: 'Analyzing code',
    items: [
      { color: 'bg-blue-500', text: 'Retrieving relevant source files...' },
      { color: 'bg-green-500', text: 'Identifying key structures and entry points...' },
    ],
  },
  initial_codemap: {
    header: 'Generating initial codemap',
    items: [
      { color: 'bg-blue-500', text: 'Organizing sections and steps...' },
      { color: 'bg-green-500', text: 'Grounding citations to source lines...' },
    ],
  },
  diagrams: {
    header: 'Generating diagrams and guides',
    items: [
      { color: 'bg-amber-500', text: 'Writing section guides...' },
      { color: 'bg-purple-500', text: 'Drawing diagrams...' },
    ],
  },
};

// The phase currently in flight (or the furthest-progressed one between events).
const activePhase = (status: Record<CodemapPhase, PhaseStatus>): CodemapPhase =>
  PHASE_ORDER.find((p) => status[p] === 'active') ??
  [...PHASE_ORDER].reverse().find((p) => status[p] !== 'pending') ??
  'analyzing';

const CitationChip: React.FC<{ citation: CodemapCitation; onClick: () => void }> = ({ citation, onClick }) => {
  const range = citation.start_line
    ? `:${citation.start_line}${citation.end_line && citation.end_line !== citation.start_line ? `-${citation.end_line}` : ''}`
    : '';
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
      title={`${citation.file_path}${range}`}
    >
      {citation.file_path.split('/').pop()}{range}
    </button>
  );
};

const CodeMap: React.FC<CodeMapProps> = ({ data, phaseStatus, error, onCitationClick }) => {
  // Progress view while generating (and no data yet) — styled like Deep Research.
  if (!data) {
    const phase = activePhase(phaseStatus);
    const detail = PHASE_DETAIL[phase];
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="animate-pulse flex space-x-1">
            <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
            <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
            <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            📖 Codemap — {detail.header} in progress...
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 pl-5">
          <div className="flex flex-col space-y-1">
            {detail.items.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-2 h-2 ${item.color} rounded-full mr-2`}></div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        {error && <div className="mt-2 text-xs text-red-500 pl-5">{error}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-color)]/40 bg-[var(--background)]/30 p-4 space-y-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary)]">
        <span>📖</span><span>Codemap</span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{data.title}</h2>
        {data.summary && (
          <p className="text-sm text-[var(--foreground)]/70 mt-1 whitespace-pre-wrap">{data.summary}</p>
        )}
      </div>

      {data.sections.map((section) => (
        <div key={section.id} className="space-y-2 border-t border-[var(--border-color)]/20 pt-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            <span className="text-[var(--accent-primary)] mr-1.5">{section.id}</span>
            {section.title}
          </h3>
          {section.guide && (
            <p className="text-xs text-[var(--foreground)]/70 whitespace-pre-wrap">{section.guide}</p>
          )}
          {section.diagram && (
            <div className="my-2">
              <Mermaid chart={section.diagram} />
            </div>
          )}

          <div className="space-y-2">
            {section.steps.map((step) => (
              <div key={step.id} className="rounded-md border border-[var(--border-color)]/30 p-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-[var(--accent-primary)]">{step.id}</span>
                    <span className="text-[var(--foreground)]/90">{step.label}</span>
                  </div>
                  {step.citation && (
                    <CitationChip citation={step.citation} onClick={() => onCitationClick(step.citation!)} />
                  )}
                </div>
                {step.code && (
                  <SyntaxHighlighter
                    language="text"
                    style={tomorrow}
                    customStyle={{ margin: 0, fontSize: '0.72rem', borderRadius: '0.25rem' }}
                  >
                    {step.code}
                  </SyntaxHighlighter>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CodeMap;
