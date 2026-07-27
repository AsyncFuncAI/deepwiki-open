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

const PHASE_LABELS: { key: CodemapPhase; label: string }[] = [
  { key: 'analyzing', label: 'Analyzing code' },
  { key: 'initial_codemap', label: 'Generating initial codemap' },
  { key: 'diagrams', label: 'Generating diagrams and guides' },
];

const PhaseIndicator: React.FC<{ status: PhaseStatus; label: string }> = ({ status, label }) => (
  <div className="flex items-center gap-2 text-xs">
    {status === 'done' ? (
      <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px]">✓</span>
    ) : status === 'active' ? (
      <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-purple-500 animate-spin" />
    ) : (
      <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-color)]" />
    )}
    <span className={status === 'pending' ? 'text-[var(--foreground)]/40' : 'text-[var(--foreground)]/80'}>
      {label}
    </span>
  </div>
);

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
  // Progress view while generating (and no data yet).
  if (!data) {
    return (
      <div className="rounded-lg border border-[var(--border-color)]/40 bg-[var(--background)]/30 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary)] mb-2">
          <span>📖</span><span>Codemap</span>
        </div>
        {PHASE_LABELS.map(({ key, label }) => (
          <PhaseIndicator key={key} status={phaseStatus[key]} label={label} />
        ))}
        {error && <div className="text-xs text-red-500 pt-1">{error}</div>}
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
