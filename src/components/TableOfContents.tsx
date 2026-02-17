'use client';

import React, { useEffect, useState } from 'react';
import { Heading } from '@/utils/extractHeadings';

interface TableOfContentsProps {
  headings: Heading[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    const elements = headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="text-sm">
      <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
        On this page
      </h4>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                setActiveId(heading.id);
              }}
              className={`block py-0.5 text-sm leading-relaxed transition-colors no-underline border-none hover:border-none ${
                activeId === heading.id
                  ? 'text-[var(--foreground)] font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
