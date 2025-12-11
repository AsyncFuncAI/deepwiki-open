'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TokenInputProps {
  selectedPlatform: 'github' | 'gitlab' | 'bitbucket';
  setSelectedPlatform: (value: 'github' | 'gitlab' | 'bitbucket') => void;
  accessToken: string;
  setAccessToken: (value: string) => void;
  showTokenSection?: boolean;
  onToggleTokenSection?: () => void;
  allowPlatformChange?: boolean;
}

export default function TokenInput({
  selectedPlatform,
  setSelectedPlatform,
  accessToken,
  setAccessToken,
  showTokenSection = true,
  onToggleTokenSection,
  allowPlatformChange = true
}: TokenInputProps) {
  const { messages: t } = useLanguage();

  const platformName = selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);

  return (
    <div className="mb-4">
      {onToggleTokenSection && (
        <button
          type="button"
          onClick={onToggleTokenSection}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--highlight)] flex items-center transition-colors border-b border-[var(--border-color)] hover:border-[var(--accent-primary)] pb-0.5 mb-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {showTokenSection ? t.form?.hideTokens || 'Hide Access Tokens' : t.form?.addTokens || 'Add Access Tokens for Private Repositories'}
        </button>
      )}

      {showTokenSection && (
        <div className="mt-2 w-full max-w-2xl mx-auto bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-[8.4px] shadow-xs hover:shadow-sm transition-shadow px-3 sm:px-4 py-2">
          {allowPlatformChange && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-[var(--foreground)] mb-2">
                {t.form?.selectPlatform || 'Select Platform'}
              </label>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('github')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[8.4px] border transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selectedPlatform === 'github'
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                    : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
                    }`}
                >
                  <span className="text-sm">GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('gitlab')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[8.4px] border transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selectedPlatform === 'gitlab'
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                    : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
                    }`}
                >
                  <span className="text-sm">GitLab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('bitbucket')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[8.4px] border transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selectedPlatform === 'bitbucket'
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                    : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
                    }`}
                >
                  <span className="text-sm">Bitbucket</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="access-token" className="block text-xs font-medium text-[var(--foreground)] mb-2">
              {(t.form?.personalAccessToken || 'Personal Access Token').replace('{platform}', platformName)}
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                id="access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={(t.form?.tokenPlaceholder || 'Enter your access token').replace('{platform}', platformName)}
                className="flex-1 h-11 sm:h-12 px-4 rounded-[8.4px] bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 outline-none border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 transition-colors"
              />
            </div>
            <div className="flex items-center mt-2 text-xs text-[var(--muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.form?.tokenSecurityNote || 'Your token is stored locally and never sent to our servers.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 