'use client';

import { useEffect } from 'react';

interface SourceLinkHandlerProps {
  owner: string | string[] | undefined;
  repo: string | string[] | undefined;
  defaultBranch: string;
}

const SourceLinkHandler: React.FC<SourceLinkHandlerProps> = ({ owner, repo, defaultBranch }) => {
  useEffect(() => {
    const handleSourceLink = (event: CustomEvent) => {
      const { filePath, startLine, endLine } = event.detail;

      // Resolve owner and repo
      const ownerStr = Array.isArray(owner) ? owner[0] : owner;
      const repoStr = Array.isArray(repo) ? repo[0] : repo;

      if (!ownerStr || !repoStr) return;

      // Build GitHub URL with line numbers
      let url = `https://github.com/${ownerStr}/${repoStr}/blob/${defaultBranch}/${filePath}`;

      // Add line number anchor
      if (startLine) {
        if (endLine && endLine !== startLine) {
          // Range:#L1-L2
          url += `#L${startLine}-L${endLine}`;
        } else {
          // Single line: #L5
          url += `#L${startLine}`;
        }
      }

      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    window.addEventListener('openSourceLink', handleSourceLink as EventListener);

    return () => {
      window.removeEventListener('openSourceLink', handleSourceLink as EventListener);
    };
  }, [owner, repo, defaultBranch]);

  return null;
};

export default SourceLinkHandler;
