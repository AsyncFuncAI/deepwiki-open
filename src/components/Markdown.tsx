import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from './Mermaid';

interface MarkdownProps {
  content: string;
  onPageNavigate?: (pageId: string) => void;
  pageIds?: Set<string>;
}

const Markdown: React.FC<MarkdownProps> = ({ content, onPageNavigate, pageIds }) => {
  const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    p({ children, ...props }: { children?: React.ReactNode }) {
      return <p className="mb-4 text-base leading-7 text-[var(--foreground)]" {...props}>{children}</p>;
    },
    h1({ children, ...props }: { children?: React.ReactNode }) {
      return <h1 className="text-2xl font-bold mt-8 mb-4 text-[var(--foreground)]" {...props}>{children}</h1>;
    },
    h2({ children, ...props }: { children?: React.ReactNode }) {
      return <h2 className="text-xl font-semibold mt-8 mb-3 text-[var(--foreground)]" {...props}>{children}</h2>;
    },
    h3({ children, ...props }: { children?: React.ReactNode }) {
      return <h3 className="text-lg font-semibold mt-6 mb-2 text-[var(--foreground)]" {...props}>{children}</h3>;
    },
    h4({ children, ...props }: { children?: React.ReactNode }) {
      return <h4 className="text-base font-semibold mt-4 mb-2 text-[var(--foreground)]" {...props}>{children}</h4>;
    },
    ul({ children, ...props }: { children?: React.ReactNode }) {
      return <ul className="list-disc pl-6 mb-4 text-base space-y-1.5" {...props}>{children}</ul>;
    },
    ol({ children, ...props }: { children?: React.ReactNode }) {
      return <ol className="list-decimal pl-6 mb-4 text-base space-y-1.5" {...props}>{children}</ol>;
    },
    li({ children, ...props }: { children?: React.ReactNode }) {
      return <li className="text-base leading-7 text-[var(--foreground)]" {...props}>{children}</li>;
    },
    a({ children, href, ...props }: { children?: React.ReactNode; href?: string }) {
      if (href && href.startsWith('#') && onPageNavigate && pageIds) {
        const targetId = href.slice(1);
        if (pageIds.has(targetId)) {
          return (
            <button
              onClick={() => onPageNavigate(targetId)}
              className="text-[var(--foreground)] underline decoration-[var(--border-color)] underline-offset-2 hover:decoration-[var(--foreground)] font-medium cursor-pointer transition-colors"
            >
              {children}
            </button>
          );
        }
      }
      return (
        <a
          href={href}
          className="text-[var(--foreground)] underline decoration-[var(--border-color)] underline-offset-2 hover:decoration-[var(--foreground)] font-medium transition-colors"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    blockquote({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <blockquote
          className="border-l-2 border-[var(--border-color)] pl-4 py-0.5 text-[var(--muted)] my-4"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    table({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <div className="overflow-x-auto my-6 border border-[var(--border-color)] rounded-lg">
          <table className="min-w-full text-sm" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({ children, ...props }: { children?: React.ReactNode }) {
      return <thead className="bg-[var(--accent-secondary)]" {...props}>{children}</thead>;
    },
    tbody({ children, ...props }: { children?: React.ReactNode }) {
      return <tbody className="divide-y divide-[var(--border-color)]" {...props}>{children}</tbody>;
    },
    th({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <th
          className="px-4 py-2.5 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }: { children?: React.ReactNode }) {
      return <td className="px-4 py-2.5 text-sm text-[var(--foreground)]" {...props}>{children}</td>;
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
      const codeContent = children ? String(children).replace(/\n$/, '') : '';

      if (!inline && match && match[1] === 'mermaid') {
        return (
          <div className="my-6 border border-[var(--border-color)] rounded-lg overflow-hidden">
            <Mermaid
              chart={codeContent}
              className="w-full max-w-full"
              zoomingEnabled={false}
            />
          </div>
        );
      }

      if (!inline && match) {
        return (
          <div className="my-6 rounded-lg overflow-hidden border border-[var(--border-color)]">
            <div className="bg-zinc-800 text-zinc-400 px-4 py-2 text-xs flex justify-between items-center border-b border-zinc-700">
              <span className="font-mono">{match[1]}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeContent);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Copy code"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
              customStyle={{ margin: 0, borderRadius: 0, padding: '1rem' }}
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

      return (
        <code
          className={`${className || ''} font-mono text-sm bg-[var(--accent-secondary)] text-[var(--foreground)] px-1.5 py-0.5 rounded-md`}
          {...otherProps}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="max-w-none py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
