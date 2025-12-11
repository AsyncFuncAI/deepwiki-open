import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Mermaid from './Mermaid';

interface MarkdownProps {
  content: string;
  repoUrl?: string;
  defaultBranch?: string;
  commitHash?: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content, repoUrl, defaultBranch = 'main', commitHash }) => {
  // Helper function to generate file URL with line numbers
  const generateFileUrl = (filePath: string, lineStart?: number, lineEnd?: number): string => {
    if (!repoUrl) return '';

    try {
      const url = new URL(repoUrl);
      const hostname = url.hostname;
      let fileUrl = '';

      // Use commit hash if available, otherwise use default branch
      const ref = commitHash || defaultBranch;

      if (hostname === 'github.com' || hostname.includes('github')) {
        // GitHub URL format: https://github.com/owner/repo/blob/commit-hash/path#L1-L50
        fileUrl = `${repoUrl}/blob/${ref}/${filePath}`;
        if (lineStart) {
          fileUrl += `#L${lineStart}`;
          if (lineEnd && lineEnd !== lineStart) {
            fileUrl += `-L${lineEnd}`;
          }
        }
        return fileUrl;
      } else if (hostname === 'gitlab.com' || hostname.includes('gitlab')) {
        // GitLab URL format: https://gitlab.com/owner/repo/-/blob/commit-hash/path#L1-50
        fileUrl = `${repoUrl}/-/blob/${ref}/${filePath}`;
        if (lineStart) {
          fileUrl += `#L${lineStart}`;
          if (lineEnd && lineEnd !== lineStart) {
            fileUrl += `-${lineEnd}`;
          }
        }
        return fileUrl;
      } else if (hostname === 'bitbucket.org' || hostname.includes('bitbucket')) {
        // Bitbucket URL format: https://bitbucket.org/owner/repo/src/commit-hash/path#lines-1:50
        fileUrl = `${repoUrl}/src/${ref}/${filePath}`;
        if (lineStart) {
          fileUrl += `#lines-${lineStart}`;
          if (lineEnd && lineEnd !== lineStart) {
            fileUrl += `:${lineEnd}`;
          }
        }
        return fileUrl;
      }
    } catch (error) {
      console.warn('Error generating file URL:', error);
    }

    return '';
  };
  // Define markdown components
  const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    p({ children, ...props }: { children?: React.ReactNode }) {
      // Check if this paragraph starts with "Sources:"
      const processChildren = (children: React.ReactNode): React.ReactNode => {
        if (typeof children === 'string') {
          // Make "Sources:" bold
          if (children.startsWith('Sources:')) {
            return (
              <>
                <strong>Sources:</strong>
                {children.substring(8)}
              </>
            );
          }
          return children;
        }

        if (Array.isArray(children)) {
          return children.map((child, index) => {
            // First element might be "Sources:" text
            if (index === 0 && typeof child === 'string' && child.startsWith('Sources:')) {
              return (
                <React.Fragment key={index}>
                  <strong>Sources:</strong>
                  {child.substring(8)}
                </React.Fragment>
              );
            }
            // Remove commas between source links
            if (typeof child === 'string' && child.trim() === ',') {
              return <React.Fragment key={index}> </React.Fragment>;
            }
            return <React.Fragment key={index}>{child}</React.Fragment>;
          });
        }

        return children;
      };

      return <p className="mb-3 text-sm leading-relaxed dark:text-white" {...props}>{processChildren(children)}</p>;
    },
    h1({ children, ...props }: { children?: React.ReactNode }) {
      return <h1 className="text-xl font-bold mt-6 mb-3 dark:text-white" {...props}>{children}</h1>;
    },
    h2({ children, ...props }: { children?: React.ReactNode }) {
      // Special styling for ReAct headings
      if (children && typeof children === 'string') {
        const text = children.toString();
        if (text.includes('Thought') || text.includes('Action') || text.includes('Observation') || text.includes('Answer')) {
          return (
            <h2
              className={`text-base font-bold mt-5 mb-3 p-2 rounded ${
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
      return <h2 className="text-lg font-bold mt-5 mb-3 dark:text-white" {...props}>{children}</h2>;
    },
    h3({ children, ...props }: { children?: React.ReactNode }) {
      return <h3 className="text-base font-semibold mt-4 mb-2 dark:text-white" {...props}>{children}</h3>;
    },
    h4({ children, ...props }: { children?: React.ReactNode }) {
      return <h4 className="text-sm font-semibold mt-3 mb-2 dark:text-white" {...props}>{children}</h4>;
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
      // Check if this is a source citation link (format: filename.ext:line-range or filename.ext)
      const childText = typeof children === 'string' ? children : '';
      // Match patterns like: "file.ext:1-50", "file.ext:10", "path/to/file.ext:1-50", "file.ext", "file.ext:1.1"
      // Extended to support more file types and paths with directories
      const isSourceCitation = childText.match(/^(.+?\.(?:ts|tsx|js|jsx|mjs|cjs|py|pyw|java|cpp|cc|cxx|c|h|hpp|hxx|cs|go|rs|rb|php|swift|kt|kts|md|markdown|json|yaml|yml|xml|html|htm|css|scss|sass|less|sql|sh|bash|zsh|fish|ps1|bat|cmd|r|R|m|mm|scala|clj|cljs|edn|ex|exs|erl|hrl|hs|lhs|lua|pl|pm|t|vim|vimrc|dockerfile|makefile|cmake|gradle|properties|conf|config|ini|toml|lock|txt|log|env|gitignore|dockerignore|editorconfig|eslintrc|prettierrc|babelrc|tsconfig|package|cargo|gemfile|podfile|requirements|pipfile|setup|manifest|pom|build))(?::(.+))?$/i);

      if (isSourceCitation) {
        const [, filePathText, lineRange] = isSourceCitation;

        // Parse line range if present
        let lineStart: number | undefined;
        let lineEnd: number | undefined;
        if (lineRange) {
          const numbers = lineRange.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            lineStart = parseInt(numbers[0], 10);
            lineEnd = numbers.length > 1 ? parseInt(numbers[1], 10) : lineStart;
          }
        }

        // Try to derive the full relative path from the provided href when possible
        let relativePathFromHref: string | undefined;
        if (href && href.trim() !== '') {
          try {
            const url = new URL(href);
            const pathname = url.pathname;

            const extractPath = (p: string): string | undefined => {
              // GitHub: /blob/<ref>/<path>
              const ghIdx = p.indexOf('/blob/');
              if (ghIdx !== -1) {
                const rest = p.substring(ghIdx + '/blob/'.length);
                const parts = rest.split('/');
                if (parts.length >= 2) {
                  return parts.slice(1).join('/');
                }
              }
              // GitLab: /-/blob/<ref>/<path>
              const glIdx = p.indexOf('/-/blob/');
              if (glIdx !== -1) {
                const rest = p.substring(glIdx + '/-/blob/'.length);
                const parts = rest.split('/');
                if (parts.length >= 2) {
                  return parts.slice(1).join('/');
                }
              }
              // Bitbucket: /src/<ref>/<path>
              const bbIdx = p.indexOf('/src/');
              if (bbIdx !== -1) {
                const rest = p.substring(bbIdx + '/src/'.length);
                const parts = rest.split('/');
                if (parts.length >= 2) {
                  return parts.slice(1).join('/');
                }
              }
              return undefined;
            };

            relativePathFromHref = extractPath(pathname);
          } catch {
            // If URL parsing fails, ignore and fallback to text
          }
        }

        // Use the best available path for display and URL generation
        // Prefer the one that contains slashes or is longer, as it's likely the full path
        let resolvedPath = filePathText;
        if (relativePathFromHref) {
          const path1HasSlashes = resolvedPath.includes('/');
          const path2HasSlashes = relativePathFromHref.includes('/');
          
          if ((path2HasSlashes && !path1HasSlashes) ||
              (relativePathFromHref.length > resolvedPath.length && path2HasSlashes === path1HasSlashes)) {
            resolvedPath = relativePathFromHref;
          }
        }

        // Final check: if the path still looks like just a filename (no slashes) but we have a repoUrl,
        // we might be able to assume it's at the root or we can't do much better without a file index.
        // However, if the href path (if available) had slashes, we've already tried to use it.

        // Build the final href: prefer generating a canonical blob/src URL with repoUrl + commit/branch
        let finalHref = '';
        if (repoUrl) {
          finalHref = generateFileUrl(resolvedPath, lineStart, lineEnd);
        } else if (href && href.trim() !== '') {
          finalHref = href;
          // If a commit hash is available, normalize common branch refs to the commit
          if (commitHash) {
            try {
              const url = new URL(finalHref);
              const newPathname = url.pathname
                .replace('/blob/main/', `/blob/${commitHash}/`)
                .replace('/blob/master/', `/blob/${commitHash}/`)
                .replace('/-/blob/main/', `/-/blob/${commitHash}/`)
                .replace('/-/blob/master/', `/-/blob/${commitHash}/`)
                .replace('/src/main/', `/src/${commitHash}/`)
                .replace('/src/master/', `/src/${commitHash}/`);
              finalHref = `${url.protocol}//${url.host}${newPathname}${url.hash}`;
            } catch {
              // Keep original href on parse errors
            }
          }
        }

        const hasValidHref = finalHref && finalHref.trim() !== '';

        const isGitHub = hasValidHref && finalHref.includes('github.com');
        const isGitLab = hasValidHref && finalHref.includes('gitlab.com');
        const isBitbucket = hasValidHref && finalHref.includes('bitbucket.org');
        const showIcon = isGitHub || isGitLab || isBitbucket;

        // If no valid href, make it a span instead of a link
        const Component = hasValidHref ? 'a' : 'span';
        const linkProps = hasValidHref ? {
          href: finalHref,
          target: "_blank",
          rel: "noopener noreferrer"
        } : {};

        return (
          <Component
            {...linkProps}
            className="mb-1 mr-1 inline-flex items-stretch font-mono text-xs !no-underline transition-opacity hover:opacity-75"
            {...props}
          >
            <span className="flex items-center break-all rounded-l px-2 py-1.5 bg-[#e5e5e5] text-[#333333] dark:bg-[#252525] dark:text-[#e4e4e4]">
              {showIcon && (
                <svg className="mr-1.5 hidden h-3.5 w-3.5 flex-shrink-0 opacity-40 md:block" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
              )}
              {resolvedPath}
            </span>
            {lineRange && (
              <span className="flex flex-shrink-0 items-center rounded-r border-l px-2 py-1.5 border-[#dddddd] bg-[#d8d8d8] text-[#666666] dark:border-[#333333] dark:bg-[#2a2a2a] dark:text-[#888888]">
                {lineRange}
              </span>
            )}
          </Component>
        );
      }

      // Regular link
      return (
        <a
          href={href}
          className="text-[#6096ff] dark:text-blue-400 hover:underline font-medium"
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
          className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-1 text-gray-700 dark:text-gray-300 italic my-4 text-sm"
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
          className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }: { children?: React.ReactNode }) {
      return <td className="px-4 py-3 border-t border-gray-200 dark:border-gray-700" {...props}>{children}</td>;
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
          <div className="my-6 rounded-md overflow-hidden text-sm shadow-sm">
            <div className="bg-gray-800 text-gray-200 px-5 py-2 text-sm flex justify-between items-center">
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
      // Check if this is a file reference (e.g., "DEPENDENCIES.md" or "src/file.ts")
      const childText = typeof children === 'string' ? children : '';
      const isFileReference = childText.match(/^(.+?\.(?:ts|tsx|js|jsx|mjs|cjs|py|pyw|java|cpp|cc|cxx|c|h|hpp|hxx|cs|go|rs|rb|php|swift|kt|kts|md|markdown|json|yaml|yml|xml|html|htm|css|scss|sass|less|sql|sh|bash|zsh|fish|ps1|bat|cmd|r|R|m|mm|scala|clj|cljs|edn|ex|exs|erl|hrl|hs|lhs|lua|pl|pm|t|vim|vimrc|dockerfile|makefile|cmake|gradle|properties|conf|config|ini|toml|lock|txt|log|env|gitignore|dockerignore|editorconfig|eslintrc|prettierrc|babelrc|tsconfig|package|cargo|gemfile|podfile|requirements|pipfile|setup|manifest|pom|build))$/i);

      if (isFileReference) {
        const [, filePath] = isFileReference;
        const fileUrl = generateFileUrl(filePath);
        const hasValidUrl = fileUrl && fileUrl.trim() !== '';

        const isGitHub = hasValidUrl && fileUrl.includes('github.com');
        const showIcon = isGitHub;

        const Component = hasValidUrl ? 'a' : 'span';
        const linkProps = hasValidUrl ? {
          href: fileUrl,
          target: "_blank",
          rel: "noopener noreferrer"
        } : {};

        return (
          <Component
            {...linkProps}
            className="mb-1 mr-1 inline-flex items-stretch font-mono text-xs !no-underline transition-opacity hover:opacity-75"
          >
            <span className="flex items-center break-all rounded px-2 py-1 bg-[#e5e5e5] text-[#333333] dark:bg-[#252525] dark:text-[#e4e4e4]">
              {showIcon && (
                <svg className="mr-1.5 hidden h-3.5 w-3.5 flex-shrink-0 opacity-40 md:block" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
              )}
              {filePath}
            </span>
          </Component>
        );
      }

      return (
        <code
          className={`${className} font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-pink-500 dark:text-pink-400 text-sm`}
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