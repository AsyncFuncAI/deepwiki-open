export interface ParsedRepositoryInput {
  owner: string;
  repo: string;
  type: string;
  fullPath?: string;
  localPath?: string;
  repoUrl?: string;
}

const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
const customGitRegex = /^(?:https?:\/\/)?([^\/]+)\/(.+?)\/([^\/]+)(?:\.git)?\/?$/;
const shorthandRegex = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

// Parse the repository field of the home page: a local folder, a repository
// URL (with or without scheme) or the GitHub "owner/repo" shorthand.
// repoUrl is the URL the backend should clone, so it always has a scheme.
export function parseRepositoryInput(rawInput: string): ParsedRepositoryInput | null {
  const input = rawInput.trim();

  let owner = '', repo = '', type = 'github', fullPath: string | undefined;
  let localPath: string | undefined;
  let repoUrl: string | undefined;

  if (windowsPathRegex.test(input)) {
    type = 'local';
    localPath = input;
    repo = input.split('\\').pop() || 'local-repo';
    owner = 'local';
  } else if (input.startsWith('/')) {
    type = 'local';
    localPath = input;
    repo = input.split('/').filter(Boolean).pop() || 'local-repo';
    owner = 'local';
  } else if (customGitRegex.test(input)) {
    repoUrl = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    let url: URL;
    try {
      url = new URL(repoUrl);
    } catch {
      return null;
    }

    const domain = url.hostname;
    if (domain.includes('github.com')) {
      type = 'github';
    } else if (domain.includes('gitlab.com') || domain.includes('gitlab.')) {
      type = 'gitlab';
    } else if (domain.includes('bitbucket.org') || domain.includes('bitbucket.')) {
      type = 'bitbucket';
    } else {
      type = 'web';
    }

    fullPath = url.pathname.replace(/^\/|\/$/g, '').replace(/\.git$/, '');
    const parts = fullPath.split('/');
    if (parts.length >= 2) {
      repo = parts[parts.length - 1] || '';
      owner = parts[parts.length - 2] || '';
    }
  } else {
    const match = input.match(shorthandRegex);
    if (!match) {
      return null;
    }
    owner = match[1];
    repo = match[2];
    fullPath = `${owner}/${repo}`;
    repoUrl = `https://github.com/${owner}/${repo}`;
  }

  owner = owner.trim();
  repo = repo.trim();
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo, type, fullPath, localPath, repoUrl };
}
