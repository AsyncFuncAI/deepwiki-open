import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from './Mermaid';

// Extract text content from React children for slug generation
function getTextContent(children: React.ReactNode): string {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);

  if (Array.isArray(children)) {
    return children.map(getTextContent).join('');
  }

  // ReactElement
  if (
    typeof children === 'object' &&
    children !== null &&
    'props' in children
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (children as any).props;
    return getTextContent(props?.children);
  }

  return '';
}

// Generate slug ID matching rehype-slug / TOC behavior
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface MarkdownProps {
  content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  // Track seen heading IDs for deduplication (must match TOC logic)
  const usedIdsRef = useRef(new Map<string, number>());

  const makeId = (text: string) => {
    const base = slugify(text);
    const count = usedIdsRef.current.get(base) ?? 0;
    const id = count === 0 ? base : `${base}-${count}`;
    usedIdsRef.current.set(base, count + 1);
    return id;
  };

  // Define markdown components
  const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    p({ children, ...props }: { children?: React.ReactNode }) {
      return <p className="mb-3 text-sm leading-relaxed dark:text-white" {...props}>{children}</p>;
    },
    h1({ children, ...props }: { children?: React.ReactNode }) {
      const id = makeId(getTextContent(children));
      return <h1 id={id} className="text-xl font-bold mt-6 mb-3 dark:text-white scroll-mt-20" {...props}>{children}</h1>;
    },
    h2({ children, ...props }: { children?: React.ReactNode }) {
      const text = getTextContent(children);
      const id = makeId(text);
      // Special styling for ReAct headings
      if (typeof children === 'string' && (
        text.includes('Thought') || text.includes('Action') ||
        text.includes('Observation') || text.includes('Answer')
      )) {
        return (
          <h2
            id={id}
            className={`text-base font-bold mt-5 mb-3 p-2 rounded scroll-mt-20 ${
              text.includes('Thought') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
              text.includes('Action') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
              text.includes('Observation') ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' :
              'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
            }`}
            {...props}
          >
            {children}
          </h2>
        );
      }
      return <h2 id={id} className="text-lg font-bold mt-5 mb-3 dark:text-white scroll-mt-6" {...props}>{children}</h2>;
    },
    h3({ children, ...props }: { children?: React.ReactNode }) {
      const id = makeId(getTextContent(children));
      return <h3 id={id} className="text-base font-semibold mt-4 mb-2 dark:text-white scroll-mt-20" {...props}>{children}</h3>;
    },
    h4({ children, ...props }: { children?: React.ReactNode }) {
      const id = makeId(getTextContent(children));
      return <h4 id={id} className="text-sm font-semibold mt-3 mb-2 dark:text-white scroll-mt-20" {...props}>{children}</h4>;
    },
    ul({ children, ...props }: { children?: React.ReactNode }) {
      return <ul className="list-disc pl-6 mb-4 text-sm dark:text-white space-y-2" {...props}>{children}</ul>;
    },
    ol({ children, ...props }: { children?: React.ReactNode }) {
      return <ol className="list-decimal pl-6 mb-4 text-sm dark:text-white space-y-2" {...props}>{children}</ol>;
    },
    li({ children, ...props }: { children?: React.ReactNode }) {
      return <li className="mb-2 text-sm leading-relaxed dark:text-white" {...props}>{children}</li>;
    },
    a({ children, href, ...props }: { children?: React.ReactNode; href?: string }) {
      // Get the link text content
      const linkText = getTextContent(children);

      // Check if this is a source citation link (format: "filename:line" or "filename:start-end")
      const sourceMatch = linkText.match(/^(.+?):(\d+)(?:-(\d+))?$/);

      // Build GitHub URL if it's a source link
      let targetHref = href || '#';
      if (sourceMatch && typeof window !== 'undefined') {
        const filePath = sourceMatch[1];
        const startLine = sourceMatch[2];
        const endLine = sourceMatch[3];
        // Use a placeholder that will be replaced with actual repo info
        // The actual URL will be built in the page component
        targetHref = `#source:${filePath}:${startLine}${endLine ? '-' + endLine : ''}`;
      }

      const handleClick = (e: React.MouseEvent) => {
        if (sourceMatch && typeof window !== 'undefined') {
          e.preventDefault();
          // Dispatch custom event with source info
          window.dispatchEvent(new CustomEvent('openSourceLink', {
            detail: {
              filePath: sourceMatch[1],
              startLine: parseInt(sourceMatch[2], 10),
              endLine: sourceMatch[3] ? parseInt(sourceMatch[3], 10) : undefined,
            }
          }));
        }
      };

      return (
        <a
          href={targetHref}
          className={`text-purple-600 dark:text-purple-400 hover:underline font-medium ${sourceMatch ? 'cursor-pointer' : ''}`}
          target={href && !sourceMatch ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={handleClick}
          {...props}
        >
          {children}
        </a>
      );
    },
    blockquote({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <blockquote
          className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 py-1 text-slate-600 dark:text-slate-300 italic my-4 text-sm bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    table({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <div className="overflow-x-auto my-6 rounded-md">
          <table className="min-w-full text-sm border-collapse" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({ children, ...props }: { children?: React.ReactNode }) {
      return <thead className="bg-blue-50/70 dark:bg-blue-900/20" {...props}>{children}</thead>;
    },
    tbody({ children, ...props }: { children?: React.ReactNode }) {
      return <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</tbody>;
    },
    tr({ children, ...props }: { children?: React.ReactNode }) {
      return <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10" {...props}>{children}</tr>;
    },
    th({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <th
          className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }: { children?: React.ReactNode }) {
      return <td className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300" {...props}>{children}</td>;
    },
    code(props: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any; // Using any here as it's required for ReactMarkdown components
    }) {
      const { inline, className, children, ...otherProps } = props;
      const match = /language-(\w+)/.exec(className || '');
      let codeContent = children ? String(children).replace(/\n$/, '') : '';

      // Handle Mermaid diagrams
      if (!inline && match && match[1] === 'mermaid') {
        // Fix reserved keywords: 'end' is a keyword in Mermaid flowcharts
        // Match: classDef end, class end, class NODE end, class:end, class NODE:end
        codeContent = codeContent
          .replace(/\bclassDef\s+end\b/g, 'classDef end_node')
          .replace(/\bclass\s+end\b/g, 'class end_node')
          .replace(/\bclass\s+\w+\s+end\b/g, (m) => m.replace(' end', ' end_node'))
          .replace(/\bclass:end\b/g, 'class:end_node')
          .replace(/\bclass\s+:\s*end\b/g, 'class: end_node')
          .replace(/\bclass\s+\w+\s*:\s*end\b/g, (m) => m.replace(':end', ':end_node'));
        return (
          <div className="my-8 bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden shadow-sm">
            <Mermaid
              chart={codeContent}
              className="w-full max-w-full"
              zoomingEnabled={true}
            />
          </div>
        );
      }

      // Handle code blocks
      if (!inline && match) {
        return (
          <div className="my-6 rounded-xl overflow-hidden text-sm shadow-sm">
            <div className="bg-slate-900 text-slate-300 px-5 py-2 text-sm flex justify-between items-center">
              <span>{match[1]}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeContent);
                }}
                className="text-gray-400 hover:text-white"
                title="Copy code"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            <SyntaxHighlighter
              language={match[1]}
              style={tomorrow}
              className="!text-sm"
              customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem', padding: '1rem' }}
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
              {...otherProps}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Handle inline code
      return (
        <code
          className={`${className} font-mono bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-300 text-sm`}
          {...otherProps}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="prose prose-base dark:prose-invert max-w-none px-2 py-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;