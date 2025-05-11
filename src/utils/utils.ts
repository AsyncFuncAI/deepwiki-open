import { Messages } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Create a simple translation function
export const t = (key: string, messages: Messages, params: Record<string, string | number> = {}): string => {
  // Split the key by dots to access nested properties
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = messages;

  // Navigate through the nested properties
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Return the key if the translation is not found
      return key;
    }
  }

  // If the value is a string, replace parameters
  if (typeof value === 'string') {
    return Object.entries(params).reduce((acc: string, [paramKey, paramValue]) => {
      return acc.replace(`{${paramKey}}`, String(paramValue));
    }, value);
  }

  // Return the key if the value is not a string
  return key;
};

// Helper functions for token handling and API requests
export const getRepoUrl = (owner: string, repo: string, repoType: string, localPath?: string): string => {
  if (repoType === 'local' && localPath) {
    return localPath;
  }
  return repoType === 'github'
    ? `https://github.com/${owner}/${repo}`
    : repoType === 'gitlab'
    ? `https://gitlab.com/${owner}/${repo}`
    : `https://bitbucket.org/${owner}/${repo}`;
};
