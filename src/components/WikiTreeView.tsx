'use client';

import React, { useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';

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
}

const WikiTreeView: React.FC<WikiTreeViewProps> = ({
  wikiStructure,
  currentPageId,
  onPageSelect,
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

  const renderSection = (sectionId: string, level = 0) => {
    const section = wikiStructure.sections.find(s => s.id === sectionId);
    if (!section) return null;

    const isExpanded = expandedSections.has(sectionId);

    return (
      <div key={sectionId} className="mb-0.5">
        <button
          className="flex items-center w-full text-left px-2 py-1.5 text-sm text-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
          onClick={(e) => toggleSection(sectionId, e)}
        >
          {isExpanded ? (
            <FaChevronDown className="mr-1.5 text-[8px] text-[var(--muted)] flex-shrink-0" />
          ) : (
            <FaChevronRight className="mr-1.5 text-[8px] text-[var(--muted)] flex-shrink-0" />
          )}
          <span className="truncate font-medium">{section.title}</span>
        </button>

        {isExpanded && (
          <div className={level > 0 ? 'ml-4' : 'ml-3'}>
            {section.pages.map(pageId => {
              const page = wikiStructure.pages.find(p => p.id === pageId);
              if (!page) return null;

              return (
                <button
                  key={pageId}
                  className={`w-full text-left px-3 py-1 text-sm transition-colors block ${
                    currentPageId === pageId
                      ? 'text-[var(--foreground)] font-medium'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                  onClick={() => onPageSelect(pageId)}
                >
                  <span className="truncate block">{page.title}</span>
                </button>
              );
            })}

            {section.subsections?.map(subsectionId =>
              renderSection(subsectionId, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!wikiStructure.sections || wikiStructure.sections.length === 0 || !wikiStructure.rootSections || wikiStructure.rootSections.length === 0) {
    return (
      <ul className="space-y-0.5">
        {wikiStructure.pages.map(page => (
          <li key={page.id}>
            <button
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                currentPageId === page.id
                  ? 'text-[var(--foreground)] font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => onPageSelect(page.id)}
            >
              <span className="truncate block">{page.title}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-0.5">
      {wikiStructure.rootSections.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default WikiTreeView;
