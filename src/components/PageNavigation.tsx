'use client';

import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PageNavItem {
  id: string;
  title: string;
}

interface PageNavigationProps {
  prevPage?: PageNavItem;
  nextPage?: PageNavItem;
  onNavigate: (pageId: string) => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({ prevPage, nextPage, onNavigate }) => {
  if (!prevPage && !nextPage) return null;

  return (
    <div className="flex justify-between items-stretch gap-4 mt-8 pt-6 border-t border-[var(--border-color)]">
      {prevPage ? (
        <button
          onClick={() => onNavigate(prevPage.id)}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--background)]/70 transition-colors text-left flex-1 min-w-0"
        >
          <FaChevronLeft className="text-[var(--muted)] flex-shrink-0 text-xs" />
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)]">Previous</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{prevPage.title}</div>
          </div>
        </button>
      ) : <div className="flex-1" />}

      {nextPage ? (
        <button
          onClick={() => onNavigate(nextPage.id)}
          className="flex items-center justify-end gap-2 px-4 py-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--background)]/70 transition-colors text-right flex-1 min-w-0"
        >
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)]">Next</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{nextPage.title}</div>
          </div>
          <FaChevronRight className="text-[var(--muted)] flex-shrink-0 text-xs" />
        </button>
      ) : <div className="flex-1" />}
    </div>
  );
};

export default PageNavigation;
