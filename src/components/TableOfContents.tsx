import React, { useEffect, useState, useRef, useCallback } from 'react';

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  const [headings, setHeadings] = useState<TocEntry[]>(() => parseToc(content));
  const [activeId, setActiveId] = useState<string>('');
  const isScrollingRef = useRef(false);
  const activeIdRef = useRef('');

  // Update headings and reset active when content changes
  useEffect(() => {
    const extracted = parseToc(content);
    setHeadings(extracted);
    setActiveId('');
    activeIdRef.current = '';
  }, [content]);

  // Scroll spy - stable deps, no activeId in dependency
  useEffect(() => {
    const updateActive = () => {
      if (isScrollingRef.current) return;

      const scrollEl = document.getElementById('wiki-content');
      if (!scrollEl) return;

      const scrollTop = scrollEl.scrollTop;
      let currentId = '';

      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        if (el.offsetTop - scrollTop <= 120) {
          currentId = heading.id;
        }
      }

      if (currentId && currentId !== activeIdRef.current) {
        activeIdRef.current = currentId;
        setActiveId(currentId);
      }
    };

    const timeoutId = setTimeout(() => {
      const scrollEl = document.getElementById('wiki-content');
      if (scrollEl) {
        scrollEl.addEventListener('scroll', updateActive, { passive: true });
        updateActive();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const scrollEl = document.getElementById('wiki-content');
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', updateActive);
      }
    };
    // headings is the only deps that matters here
    // activeId is read via activeIdRef, setActiveId updates trigger re-render
    // but the listener itself doesn't need to be rebuilt for activeId changes
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    const scrollEl = document.getElementById('wiki-content');
    if (el && scrollEl) {
      isScrollingRef.current = true;
      activeIdRef.current = id;
      setActiveId(id);
      const targetTop = el.offsetTop - 80;
      scrollEl.scrollTo({ top: targetTop, behavior: 'smooth' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 600);
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
          margin-left: auto;
          margin-right: 0;
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
          font-family: var(--font-sans), sans-serif;
          font-size: 12px;
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
          font-size: 13px;
        }

        .toc-level-3 .toc-link {
          padding-left: 20px;
          font-size: 13px;
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
          font-family: var(--font-sans), sans-serif;
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
          background: rgba(155, 124, 185, 0.05);
        }

        .toc-active .toc-link {
          color: var(--accent-primary);
          border-left-color: var(--accent-primary);
          font-weight: 500;
          background: rgba(155, 124, 185, 0.08);
        }

        .toc-active .toc-link:hover {
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default TableOfContents;
