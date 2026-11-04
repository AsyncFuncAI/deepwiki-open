import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from './Mermaid';

interface MarkdownProps {
  content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  // Define markdown components
  const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    p({ children, ...props }: { children?: React.ReactNode }) {
      return <p className="mb-1 text-xs dark:text-white" {...props}>{children}</p>;
    },
    h1({ children, ...props }: { children?: React.ReactNode }) {
      return <h1 className="text-base font-bold mt-3 mb-1 dark:text-white" {...props}>{children}</h1>;
    },
    h2({ children, ...props }: { children?: React.ReactNode }) {
      // Special styling for ReAct headings
      if (children && typeof children === 'string') {
        const text = children.toString();
        if (text.includes('Thought') || text.includes('Action') || text.includes('Observation') || text.includes('Answer')) {
          return (
            <h2
              className={`text-sm font-bold mt-3 mb-2 p-1 rounded ${
                text.includes('Thought') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                text.includes('Action') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                text.includes('Observation') ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                text.includes('Answer') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                'dark:text-white'
              }`}
              {...props}
            >
              {children}
            </h2>
          );
        }
      }
      return <h2 className="text-sm font-bold mt-2 mb-1 dark:text-white" {...props}>{children}</h2>;
    },
    h3({ children, ...props }: { children?: React.ReactNode }) {
      return <h3 className="text-sm font-semibold mt-2 mb-1 dark:text-white" {...props}>{children}</h3>;
    },
    h4({ children, ...props }: { children?: React.ReactNode }) {
      return <h4 className="text-xs font-semibold mt-2 mb-1 dark:text-white" {...props}>{children}</h4>;
    },
    ul({ children, ...props }: { children?: React.ReactNode }) {
      return <ul className="list-disc list-inside mb-1 text-xs dark:text-white" {...props}>{children}</ul>;
    },
    ol({ children, ...props }: { children?: React.ReactNode }) {
      return <ol className="list-decimal list-inside mb-1 text-xs dark:text-white" {...props}>{children}</ol>;
    },
    li({ children, ...props }: { children?: React.ReactNode }) {
      return <li className="mb-1 text-xs dark:text-white" {...props}>{children}</li>;
    },
    a({ children, href, ...props }: { children?: React.ReactNode; href?: string }) {
      return (
        <a
          href={href}
          className="text-purple-600 dark:text-purple-400 hover:underline"
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
          className="border-l-2 border-gray-300 dark:border-gray-700 pl-2 text-gray-700 dark:text-gray-300 italic my-2"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    table({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full text-xs border-collapse" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({ children, ...props }: { children?: React.ReactNode }) {
      return <thead className="bg-gray-100 dark:bg-gray-800" {...props}>{children}</thead>;
    },
    tbody({ children, ...props }: { children?: React.ReactNode }) {
      return <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</tbody>;
    },
    tr({ children, ...props }: { children?: React.ReactNode }) {
      return <tr className="hover:bg-gray-50 dark:hover:bg-gray-900" {...props}>{children}</tr>;
    },
    th({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <th
          className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }: { children?: React.ReactNode }) {
      return <td className="px-2 py-1 border-t border-gray-200 dark:border-gray-700" {...props}>{children}</td>;
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

      // Handle Mermaid diagrams
      if (!inline && match && match[1] === 'mermaid') {
        return (
          <div className="my-6 bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden">
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
          <div className="my-2 rounded-md overflow-hidden text-xs">
            <div className="bg-gray-800 text-gray-200 px-4 py-1 text-xs flex justify-between items-center">
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
              className="!text-xs"
              customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem' }}
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
          className={`${className} font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-pink-500 dark:text-pink-400 text-xs`}
          {...otherProps}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
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
