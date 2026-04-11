import React, { useEffect, useState, useRef, useCallback } from 'react';

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

// Generate slug ID matching rehype-slug behavior
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse headings from markdown content
function parseToc(content: string): TocEntry[] {
  const lines = content.split('\n');
  const toc: TocEntry[] = [];

  const seenIds = new Map<string, number>();

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);

    if (h2) {
      const text = h2[1].trim();
      const baseId = slugify(text);
      const count = seenIds.get(baseId) ?? 0;
      const id = count === 0 ? baseId : `${baseId}-${count}`;
      seenIds.set(baseId, count + 1);
      toc.push({ id, text, level: 2 });
    } else if (h3) {
      const text = h3[1].trim();
      const baseId = slugify(text);
      const count = seenIds.get(baseId) ?? 0;
      const id = count === 0 ? baseId : `${baseId}-${count}`;
      seenIds.set(baseId, count + 1);
      toc.push({ id, text, level: 3 });
    }
  }

  return toc;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const extracted = parseToc(content);
    setHeadings(extracted);
  }, [content]);

  // Scroll spy using IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      entries => {
        // Find the topmost visible heading
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by DOM position and pick the first one
          const sorted = visibleEntries.sort((a, b) => {
            const rectA = a.boundingClientRect;
            const rectB = b.boundingClientRect;
            return rectA.top - rectB.top;
          });
          setActiveId(sorted[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    headingElements.forEach(el => observer.observe(el));
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  }, []);

  if (headings.length < 2) {
    return null;
  }

  return (
    <div className="toc-sidebar">
      <div className="toc-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        <span>目次</span>
      </div>
      <nav>
        <ul className="toc-list">
          {headings.map(heading => (
            <li
              key={heading.id}
              className={`toc-item toc-level-${heading.level} ${activeId === heading.id ? 'toc-active' : ''}`}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className="toc-link"
                title={heading.text}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        .toc-sidebar {
          position: sticky;
          top: 24px;
          width: 220px;
          flex-shrink: 0;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          padding: 12px 0;
        }

        .toc-sidebar::-webkit-scrollbar {
          width: 3px;
        }

        .toc-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .toc-sidebar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 2px;
        }

        .toc-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-serif-jp), serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
          padding: 0 8px;
        }

        .toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .toc-item {
          position: relative;
        }

        .toc-level-2 .toc-link {
          padding-left: 8px;
          font-size: 12px;
        }

        .toc-level-3 .toc-link {
          padding-left: 20px;
          font-size: 11px;
        }

        .toc-link {
          display: block;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 4px 8px;
          color: var(--muted);
          cursor: pointer;
          font-family: var(--font-serif-jp), serif;
          line-height: 1.4;
          border-radius: 4px;
          transition: all 0.2s ease;
          border-left: 2px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .toc-link:hover {
          color: var(--foreground);
          background: var(--accent-primary)/5;
        }

        .toc-active .toc-link {
          color: var(--accent-primary);
          border-left-color: var(--accent-primary);
          font-weight: 500;
          background: var(--accent-primary)/8;
        }

        .toc-active .toc-link:hover {
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default TableOfContents;
