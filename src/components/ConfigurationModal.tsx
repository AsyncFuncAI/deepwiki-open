'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import UserSelector from './UserSelector';
import TokenInput from './TokenInput';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Repository input
  repositoryInput: string;

  // Language selection
  selectedLanguage: string;
  setSelectedLanguage: (value: string) => void;
  supportedLanguages: Record<string, string>;

  // Wiki type options
  isComprehensiveView: boolean;
  setIsComprehensiveView: (value: boolean) => void;

  // Model selection
  provider: string;
  setProvider: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  isCustomModel: boolean;
  setIsCustomModel: (value: boolean) => void;
  customModel: string;
  setCustomModel: (value: string) => void;

  // Platform selection
  selectedPlatform: 'github' | 'gitlab' | 'bitbucket' | 'azure';
  setSelectedPlatform: (value: 'github' | 'gitlab' | 'bitbucket' | 'azure') => void;

  // Access token
  accessToken: string;
  setAccessToken: (value: string) => void;

  // File filter options
  excludedDirs: string;
  setExcludedDirs: (value: string) => void;
  excludedFiles: string;
  setExcludedFiles: (value: string) => void;
  includedDirs: string;
  setIncludedDirs: (value: string) => void;
  includedFiles: string;
  setIncludedFiles: (value: string) => void;

  // Form submission
  onSubmit: () => void;
  isSubmitting: boolean;

  // Authentication
  authRequired?: boolean;
  authCode?: string;
  setAuthCode?: (code: string) => void;
  isAuthLoading?: boolean;
}

export default function ConfigurationModal({
  isOpen,
  onClose,
  repositoryInput,
  selectedLanguage,
  setSelectedLanguage,
  supportedLanguages,
  isComprehensiveView,
  setIsComprehensiveView,
  provider,
  setProvider,
  model,
  setModel,
  isCustomModel,
  setIsCustomModel,
  customModel,
  setCustomModel,
  selectedPlatform,
  setSelectedPlatform,
  accessToken,
  setAccessToken,
  excludedDirs,
  setExcludedDirs,
  excludedFiles,
  setExcludedFiles,
  includedDirs,
  setIncludedDirs,
  includedFiles,
  setIncludedFiles,
  onSubmit,
  isSubmitting,
  authRequired,
  authCode,
  setAuthCode,
  isAuthLoading
}: ConfigurationModalProps) {
  const { messages: t } = useLanguage();

  // Show token section state
  const [showTokenSection, setShowTokenSection] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Cyberpunk Modal Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-[var(--background)]/95 to-black/90 backdrop-blur-md scanlines"></div>

        <div className="relative transform overflow-hidden card-cyberpunk text-left shadow-2xl transition-all sm:my-8 sm:max-w-4xl sm:w-full border-2 border-[var(--accent-primary)]/30">
          {/* Animated Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          </div>

          {/* Modal Header */}
          <div className="relative flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--surface)]/90 to-[var(--card-bg)]/90">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-[var(--accent-primary)]/30 rounded-full blur-md neon-glow-cyan"></div>
                <div className="relative w-8 h-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-cyberpunk text-lg text-[var(--accent-primary)] neon-glow-cyan">
                {t.form?.configureWiki || 'CONFIGURE_WIKI.EXE'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative group p-2 rounded-lg border border-[var(--border-color)] hover:border-[var(--error)] hover:bg-[var(--error)]/10 transition-all duration-300"
            >
              <svg className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--error)] neon-glow-magenta transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="absolute inset-0 bg-[var(--error)]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>

          {/* Modal body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-[var(--surface)]/30 to-[var(--card-bg)]/30">
            {/* Repository Display */}
            <div className="mb-6 card-cyberpunk border border-[var(--accent-primary)]/30">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--accent-primary)] neon-glow-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="font-cyberpunk text-xs text-[var(--accent-primary)] uppercase tracking-wider mb-1 block">
                    REPOSITORY_TARGET
                  </label>
                  <div className="input-cyberpunk font-mono text-xs text-[var(--foreground)] break-all">
                    {repositoryInput}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[var(--success)] neon-glow-green animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Language Configuration */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <label className="font-cyberpunk text-sm text-[var(--accent-secondary)] uppercase tracking-wider">
                  LANGUAGE_PROTOCOL
                </label>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="input-cyberpunk w-full font-mono text-sm appearance-none cursor-pointer hover:border-[var(--accent-secondary)] transition-colors"
              >
                {Object.entries(supportedLanguages).map(([key, value]) => (
                  <option key={key} value={key} className="bg-[var(--surface)] text-[var(--foreground)]">
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Wiki Type Selector - more compact version */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                {t.form?.wikiType || 'Wiki Type'}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsComprehensiveView(true)}
                  className={`flex-1 flex items-center justify-between p-2 rounded-md border transition-colors ${
                    isComprehensiveView
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                      : 'bg-[var(--background)]/50 border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="font-medium text-sm">{t.form?.comprehensive || 'Comprehensive'}</div>
                      <div className="text-xs opacity-80">
                        {t.form?.comprehensiveDescription || 'Detailed wiki with structured sections'}
                      </div>
                    </div>
                  </div>
                  {isComprehensiveView && (
                    <div className="ml-2 h-4 w-4 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-[var(--accent-primary)]"></div>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsComprehensiveView(false)}
                  className={`flex-1 flex items-center justify-between p-2 rounded-md border transition-colors ${
                    !isComprehensiveView
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                      : 'bg-[var(--background)]/50 border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="font-medium text-sm">{t.form?.concise || 'Concise'}</div>
                      <div className="text-xs opacity-80">
                        {t.form?.conciseDescription || 'Simplified wiki with fewer pages'}
                      </div>
                    </div>
                  </div>
                  {!isComprehensiveView && (
                    <div className="ml-2 h-4 w-4 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-[var(--accent-primary)]"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="mb-4">
              <UserSelector
                provider={provider}
                setProvider={setProvider}
                model={model}
                setModel={setModel}
                isCustomModel={isCustomModel}
                setIsCustomModel={setIsCustomModel}
                customModel={customModel}
                setCustomModel={setCustomModel}
                showFileFilters={true}
                excludedDirs={excludedDirs}
                setExcludedDirs={setExcludedDirs}
                excludedFiles={excludedFiles}
                setExcludedFiles={setExcludedFiles}
                includedDirs={includedDirs}
                setIncludedDirs={setIncludedDirs}
                includedFiles={includedFiles}
                setIncludedFiles={setIncludedFiles}
              />
            </div>

            {/* Access token section using TokenInput component */}
            <TokenInput
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              accessToken={accessToken}
              setAccessToken={setAccessToken}
              showTokenSection={showTokenSection}
              onToggleTokenSection={() => setShowTokenSection(!showTokenSection)}
              allowPlatformChange={true}
            />

            {/* Authorization Code Input */}
            {isAuthLoading && (
              <div className="mb-4 p-3 bg-[var(--background)]/50 rounded-md border border-[var(--border-color)] text-sm text-[var(--muted)]">
                Loading authentication status...
              </div>
            )}
            {!isAuthLoading && authRequired && (
              <div className="mb-4 p-4 bg-[var(--background)]/50 rounded-md border border-[var(--border-color)]">
                <label htmlFor="authCode" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  {t.form?.authorizationCode || 'Authorization Code'}
                </label>
                <input
                  type="password"
                  id="authCode"
                  value={authCode || ''}
                  onChange={(e) => setAuthCode?.(e.target.value)}
                  className="input-japanese block w-full px-3 py-2 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="Enter your authorization code"
                />
                 <div className="flex items-center mt-2 text-xs text-[var(--muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[var(--muted)]"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                   {t.form?.authorizationRequired || 'Authentication is required to generate the wiki.'}
                </div>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border-color)]/50 text-[var(--muted)] bg-transparent hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
            >
              {t.common?.cancel || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md border border-transparent bg-[var(--accent-primary)]/90 text-white hover:bg-[var(--accent-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (t.common?.processing || 'Processing...') : (t.common?.generateWiki || 'Generate Wiki')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
