'use client';

import React, { useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';

// Import interfaces from the page component
interface WikiPage {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  relatedPages: string[];
  parentId?: string;
  isSection?: boolean;
  children?: string[];
}

interface WikiSection {
  id: string;
  title: string;
  pages: string[];
  subsections?: string[];
}

interface WikiStructure {
  id: string;
  title: string;
  description: string;
  pages: WikiPage[];
  sections: WikiSection[];
  rootSections: string[];
}

interface WikiTreeViewProps {
  wikiStructure: WikiStructure;
  currentPageId: string | undefined;
  onPageSelect: (pageId: string) => void;
  messages?: {
    pages?: string;
    [key: string]: string | undefined;
  };
  pagesInProgress?: Set<string>;
}

const WikiTreeView: React.FC<WikiTreeViewProps> = ({
  wikiStructure,
  currentPageId,
  onPageSelect,
  pagesInProgress,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(wikiStructure.rootSections)
  );

  const toggleSection = (sectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isPageGenerating = (pageId: string) => {
    return pagesInProgress ? pagesInProgress.has(pageId) : false;
  };

  const renderPageButton = (pageId: string) => {
    const page = wikiStructure.pages.find(p => p.id === pageId);
    if (!page) return null;

    const generating = isPageGenerating(pageId);
    const isCurrent = currentPageId === pageId;

    return (
      <button
        key={pageId}
        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
          isCurrent
            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
            : generating
            ? 'text-[var(--muted)] opacity-60 cursor-not-allowed border border-transparent'
            : 'text-[var(--foreground)] hover:bg-[var(--background)] border border-transparent'
        }`}
        onClick={() => !generating && onPageSelect(pageId)}
        disabled={generating}
        title={generating ? 'Generating...' : page.title}
      >
        <div className="flex items-center">
          {generating ? (
            <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-amber-400 animate-pulse"></div>
          ) : (
            <div
              className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                page.importance === 'high'
                  ? 'bg-blue-500'
                  : page.importance === 'medium'
                  ? 'bg-blue-400'
                  : 'bg-blue-300'
              }`}
            ></div>
          )}
          <span className="truncate">{generating ? `${page.title}...` : page.title}</span>
          {generating && (
            <span className="ml-auto text-xs text-amber-500 flex-shrink-0">···</span>
          )}
        </div>
      </button>
    );
  };

  const renderSection = (sectionId: string, level = 0) => {
    const section = wikiStructure.sections.find(s => s.id === sectionId);
    if (!section) return null;

    const isExpanded = expandedSections.has(sectionId);

    return (
      <div key={sectionId} className="mb-2">
        <button
          className={`flex items-center w-full text-left px-2 py-1.5 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]/70 transition-colors ${
            level === 0 ? 'bg-[var(--background)]/50' : ''
          }`}
          onClick={(e) => toggleSection(sectionId, e)}
        >
          {isExpanded ? (
            <FaChevronDown className="mr-2 text-xs" />
          ) : (
            <FaChevronRight className="mr-2 text-xs" />
          )}
          <span className="truncate">{section.title}</span>
        </button>

        {isExpanded && (
          <div className={`ml-4 mt-1 space-y-1 ${level > 0 ? 'pl-2 border-l border-[var(--border-color)]/30' : ''}`}>
            {/* Render pages in this section */}
            {section.pages.map(pageId => renderPageButton(pageId))}

            {/* Render subsections recursively */}
            {section.subsections?.map(subsectionId =>
              renderSection(subsectionId, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // If there are no sections defined yet, or if sections/rootSections are empty arrays, fall back to the flat list view
  if (!wikiStructure.sections || wikiStructure.sections.length === 0 || !wikiStructure.rootSections || wikiStructure.rootSections.length === 0) {
    console.log("WikiTreeView: Falling back to flat list view due to missing or empty sections/rootSections");
    return (
      <ul className="space-y-2">
        {wikiStructure.pages.map(page => (
          <li key={page.id}>
            {renderPageButton(page.id)}
          </li>
        ))}
      </ul>
    );
  }

  // Log information about the sections for debugging
  console.log("WikiTreeView: Rendering tree view with sections:", wikiStructure.sections);
  console.log("WikiTreeView: Root sections:", wikiStructure.rootSections);

  return (
    <div className="space-y-1">
      {wikiStructure.rootSections.map(sectionId => {
        const section = wikiStructure.sections.find(s => s.id === sectionId);
        if (!section) {
          console.warn(`WikiTreeView: Could not find section with id ${sectionId}`);
          return null;
        }
        return renderSection(sectionId);
      })}
    </div>
  );
};

export default WikiTreeView;