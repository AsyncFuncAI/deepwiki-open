import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from './Mermaid';
import { useLanguage } from '@/contexts/LanguageContext';

interface MarkdownProps {
  content: string;
  repoUrl?: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content, repoUrl }) => {
  const { messages } = useLanguage();

  // Create a simple translation function
  const t = (key: string, params: Record<string, string | number> = {}): string => {
    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value === 'string') {
      return Object.entries(params).reduce((acc: string, [paramKey, paramValue]) => {
        return acc.replace(`{${paramKey}}`, String(paramValue));
      }, value);
    }

    return key;
  };

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
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const [error, setError] = useState(false);
      const [loading, setLoading] = useState(true);
      const [errorMessage, setErrorMessage] = useState<string>('');

      // 处理图片 URL
      const srcStr = typeof src === 'string' ? src : '';
      let processedSrc = srcStr;
      if (processedSrc && !processedSrc.startsWith('http') && repoUrl) {
        // 检查是否是本地项目
        if (repoUrl.startsWith('file://') || repoUrl.startsWith('/') || /^[A-Za-z]:/.test(repoUrl)) {
          // 本地项目，直接使用相对路径
          processedSrc = processedSrc.replace(/^\.\//, '');
        } else {
          // 远程仓库，使用 raw 地址
          if (processedSrc.startsWith('./') || processedSrc.startsWith('../')) {
            processedSrc = `${repoUrl}/raw/main/${processedSrc.replace(/^\.\//, '')}`;
          } else {
            processedSrc = `${repoUrl}/raw/main/${processedSrc}`;
          }
        }
      } else if (processedSrc && processedSrc.includes('github.com')) {
        // 将 github.com 的地址转换为 raw.githubusercontent.com
        processedSrc = processedSrc
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/');
      }

      if (error) {
        return (
          <span className="block w-full bg-[var(--background)]/50 p-4 rounded-lg text-center border border-[var(--border-color)] my-2">
            <span className="block text-[var(--muted)] text-sm mb-2">{t('common.imageLoadError')}</span>
            <span className="block text-xs text-[var(--muted)] mb-2 break-all">
              {errorMessage || t('common.imageLoadErrorDefault')}
            </span>
            <span className="block text-xs text-[var(--muted)] break-all">
              {t('common.imageUrl')}: {typeof src === 'string' ? src : ''}
            </span>
          </span>
        );
      }

      return (
        <span className="block w-full relative group my-2">
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/50 rounded-lg">
              <span className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></span>
            </span>
          )}
          <img 
            src={processedSrc} 
            alt={alt} 
            className="w-full rounded-lg shadow-sm transition-opacity duration-200"
            style={{ opacity: loading ? 0 : 1 }}
            onLoad={() => setLoading(false)}
            onError={(e) => {
              setError(true);
              setLoading(false);
              // 获取具体的错误信息
              const target = e.target as HTMLImageElement;
              if (target.naturalWidth === 0) {
                setErrorMessage(t('common.imageCorrupted'));
              } else if (processedSrc.startsWith('http')) {
                setErrorMessage(t('common.imageAccessError'));
              } else {
                setErrorMessage(t('common.imagePathError'));
              }
            }}
            {...props}
          />
        </span>
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
