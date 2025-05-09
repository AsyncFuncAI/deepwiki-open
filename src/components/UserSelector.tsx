'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';


interface ModelSelectorProps {
  localOllama: boolean;
  setLocalOllama: (value: boolean) => void;
  useOpenRouter: boolean;
  setUseOpenRouter: (value: boolean) => void;
  useOpenai: boolean;
  setUseOpenai: (value: boolean) => void;
  openRouterModel: string;
  setOpenRouterModel: (value: string) => void;
  openaiModel: string;
  setOpenaiModel: (value: string) => void;
  isCustomOpenaiModel?: boolean;
  setIsCustomOpenaiModel?: (value: boolean) => void;
  customOpenaiModel?: string;
  setCustomOpenaiModel?: (value: string) => void;
  
  // File filter configuration
  showFileFilters?: boolean;
  excludedDirs?: string;
  setExcludedDirs?: (value: string) => void;
  excludedFiles?: string;
  setExcludedFiles?: (value: string) => void;
}

export default function UserSelector({
  localOllama,
  setLocalOllama,
  useOpenRouter,
  setUseOpenRouter,
  useOpenai,
  setUseOpenai,
  openRouterModel,
  setOpenRouterModel,
  openaiModel,
  setOpenaiModel,
  isCustomOpenaiModel,
  setIsCustomOpenaiModel,
  customOpenaiModel,
  setCustomOpenaiModel,
  
  // File filter configuration
  showFileFilters = false,
  excludedDirs = '',
  setExcludedDirs,
  excludedFiles = '',
  setExcludedFiles,

}: ModelSelectorProps) {
  // State to manage the visibility of the filters modal and filter section
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(false);
  const { messages: t } = useLanguage();
  
  // Default excluded directories from config.py
  const defaultExcludedDirs = 
`./.venv/
./venv/
./env/
./virtualenv/
./node_modules/
./bower_components/
./jspm_packages/
./.git/
./.svn/
./.hg/
./.bzr/
./__pycache__/
./.pytest_cache/
./.mypy_cache/
./.ruff_cache/
./.coverage/
./dist/
./build/
./out/
./target/
./bin/
./obj/
./docs/
./_docs/
./site-docs/
./_site/
./.idea/
./.vscode/
./.vs/
./.eclipse/
./.settings/
./logs/
./log/
./tmp/
./temp/
./.eng`;

  // Default excluded files from config.py
  const defaultExcludedFiles = 
`package-lock.json
yarn.lock
pnpm-lock.yaml
npm-shrinkwrap.json
poetry.lock
Pipfile.lock
requirements.txt.lock
Cargo.lock
composer.lock
.lock
.DS_Store
Thumbs.db
desktop.ini
*.lnk
.env
.env.*
*.env
*.cfg
*.ini
.flaskenv
.gitignore
.gitattributes
.gitmodules
.github
.gitlab-ci.yml
.prettierrc
.eslintrc
.eslintignore
.stylelintrc
.editorconfig
.jshintrc
.pylintrc
.flake8
mypy.ini
pyproject.toml
tsconfig.json
webpack.config.js
babel.config.js
rollup.config.js
jest.config.js
karma.conf.js
vite.config.js
next.config.js
*.min.js
*.min.css
*.bundle.js
*.bundle.css
*.map
*.gz
*.zip
*.tar
*.tgz
*.rar
*.pyc
*.pyo
*.pyd
*.so
*.dll
*.class
*.exe
*.o
*.a
*.jpg
*.jpeg
*.png
*.gif
*.ico
*.svg
*.webp
*.mp3
*.mp4
*.wav
*.avi
*.mov
*.webm
*.csv
*.tsv
*.xls
*.xlsx
*.db
*.sqlite
*.sqlite3
*.pdf
*.docx
*.pptx`;

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            id="local-ollama"
            type="checkbox"
            checked={localOllama}
            onChange={(e) => {
              setLocalOllama(e.target.checked);
              if (e.target.checked) {
                setUseOpenRouter(false);
                setUseOpenai(false);
              }
            }}
            className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
          />
          <label htmlFor="local-ollama" className="ml-2 text-sm text-[var(--foreground)]">
            {t.form?.localOllama || 'Use Local Ollama'} <span className="text-xs text-[var(--muted)]">({t.form?.experimental || 'Experimental'})</span>
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="use-openrouter"
            type="checkbox"
            checked={useOpenRouter}
            onChange={(e) => {
              setUseOpenRouter(e.target.checked);
              if (e.target.checked) {
                setLocalOllama(false);
                setUseOpenai(false);
              }
            }}
            className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
          />
          <label htmlFor="use-openrouter" className="ml-2 text-sm text-[var(--foreground)]">
            {t.form?.useOpenRouter || 'Use OpenRouter'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="use-openai"
            type="checkbox"
            checked={useOpenai}
            onChange={(e) => {
              setUseOpenai(e.target.checked);
              if (e.target.checked) {
                setLocalOllama(false);
                setUseOpenRouter(false);
              }
            }}
            className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
          />
          <label htmlFor="use-openai" className="ml-2 text-sm text-[var(--foreground)]">
            {t.form?.useOpenai || 'Use OpenAI'}
          </label>
        </div>
      </div>

      {/* OpenRouter model selection - only shown when OpenRouter is selected */}
      {useOpenRouter && (
        <div className="w-full">
          <label htmlFor="openrouter-model" className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
            {t.form?.openRouterModel || 'OpenRouter Model'}
          </label>
          <select
            id="openrouter-model"
            value={openRouterModel}
            onChange={(e) => setOpenRouterModel(e.target.value)}
            className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="openai/gpt-4o">OpenAI GPT-4.0</option>
            <option value="openai/gpt-4.1">OpenAI GPT-4.1</option>
            <option value="openai/o1">OpenAI o1</option>
            <option value="openai/o1-mini">OpenAI o1-mini</option>
            <option value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
            <option value="anthropic/claude-3.7-sonnet">Anthropic Claude 3.7 Sonnet</option>
            <option value="google/gemini-2.0-flash-001">Google Gemini 2.0 Flash</option>
            <option value="meta-llama/llama-3-70b-instruct">Meta Llama 3 70B Instruct</option>
            <option value="mistralai/mixtral-8x22b-instruct">Mistral Mixtral 8x22B Instruct</option>
          </select>
        </div>
      )}

      {/* Openai model selection - only shown when Openai is selected */}
      {useOpenai && (
        <div className="w-full">
          <label htmlFor="openai-model" className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
            {t.form?.openaiModel || 'OpenAI Model'}
          </label>
          
          <div className="space-y-2">
            {/* Standard model selection */}
            {!isCustomOpenaiModel && (
              <select
                id="openai-model"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="gpt-4.1">OpenAI GPT-4.1</option>
                <option value="o1">OpenAI o1</option>
                <option value="o3">OpenAI o3</option>
                <option value="o4-mini">OpenAI o4-mini</option>
                <option value="deepseek-reasoner">Deepseek R1</option>
                <option value="deepseek-chat">Deepseek v3</option>
                <option value="qwen3-235b-a22b">Qwen3 235b</option>
                <option value="qwen-max">Qwen Max</option>
                <option value="qwq-plus">qwq plus</option>
              </select>
            )}
            
            {/* Custom model input */}
            {isCustomOpenaiModel && (
              <input
                type="text"
                id="custom-openai-model"
                value={customOpenaiModel}
                onChange={(e) => {
                  setCustomOpenaiModel?.(e.target.value);
                  setOpenaiModel(e.target.value);
                }}
                placeholder={t.form?.customModelPlaceholder || 'Enter custom model name'}
                className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            )}
            
            {/* Toggle between predefined and custom */}
            <div className="flex items-center">
              <input
                id="use-custom-model"
                type="checkbox"
                checked={isCustomOpenaiModel}
                onChange={(e) => {
                  setIsCustomOpenaiModel?.(e.target.checked);
                  if (e.target.checked) {
                    setCustomOpenaiModel?.(openaiModel);
                  }
                }}
                className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
              <label htmlFor="use-custom-model" className="ml-2 text-xs text-[var(--muted)]">
                {t.form?.useCustomModel || 'Use custom model'}
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* File filtering configuration - only shown when enabled */}
      {showFileFilters && (
        <div className="w-full mt-4">
          <div className="border border-[var(--border-color)] rounded-md p-3 bg-[var(--card-bg)]">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{t.form?.fileFilterTitle || 'File Filter Configuration'}</h3>
              
              <div className="flex gap-3">
                {/* Button to toggle filter section visibility */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsFilterSectionOpen(!isFilterSectionOpen);
                  }}
                  className="text-xs text-[var(--accent-primary)] hover:text-[var(--highlight)] transition-colors flex items-center"
                >
                  {isFilterSectionOpen ? t.form?.hideFilters : t.form?.showFilters}
                </button>

                {/* View default filters button - opens modal */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    // Use React state to show modal with default filters
                    setIsFiltersModalOpen(true);
                  }}
                  className="text-xs text-[var(--accent-primary)] hover:text-[var(--highlight)] transition-colors"
                >
                  {t.form?.viewDefaults}
                </button>
              </div>
            </div>
            
            {/* Information about current default filters - always visible */}
            <p className="text-xs text-[var(--muted)] mt-1">
              {t.form?.defaultFiltersInfo}
            </p>

            {/* Custom filters input section - only visible when expanded */}
            {isFilterSectionOpen && (
              <div className="space-y-3 mt-3 pt-3 border-t border-[var(--border-color)] mt-3">
                <div>
                  <label htmlFor="excluded-dirs" className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                    {t.form?.excludedDirs}
                  </label>
                  <textarea
                    id="excluded-dirs"
                    value={excludedDirs}
                    onChange={(e) => setExcludedDirs?.(e.target.value)}
                    placeholder="./node_modules/
./dist/
./.git/"
                    className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)] border border-[var(--border-color)] min-h-[80px]"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {t.form?.excludedDirsHelp}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="excluded-files" className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                    {t.form?.excludedFiles}
                  </label>
                  <textarea
                    id="excluded-files"
                    value={excludedFiles}
                    onChange={(e) => setExcludedFiles?.(e.target.value)}
                    placeholder="package-lock.json
yarn.lock
*.min.js"
                    className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)] border border-[var(--border-color)] min-h-[80px]"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {t.form?.excludedFilesHelp}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Modal for displaying default filters from config.py */}
          {isFiltersModalOpen && (
            <div 
              className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-center justify-center p-4"
              onClick={(e) => {
                // Only close if clicking directly on the backdrop
                if (e.target === e.currentTarget) {
                  e.preventDefault();
                  setIsFiltersModalOpen(false);
                }
              }}
            >
              <div 
                className="bg-[var(--card-bg)] max-w-2xl w-full max-h-[80vh] overflow-auto rounded-md shadow-lg border border-[var(--border-color)]"
                onClick={(e) => e.stopPropagation()} // Prevent closing the modal when clicking inside
              >
                <div className="flex justify-between items-center border-b border-[var(--border-color)] p-4">
                  <h3 className="text-base font-medium">{t.form?.defaultFilters}</h3>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFiltersModalOpen(false);
                    }}
                    className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t.form?.directories}</h4>
                    <div>
                      <pre className="bg-[var(--background)]/80 p-3 rounded-md text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                        {defaultExcludedDirs}
                      </pre>
                      <p className="text-xs text-[var(--muted)] mt-1 italic text-center">{t.form?.scrollToViewMore}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t.form?.files}</h4>
                    <div>
                      <pre className="bg-[var(--background)]/80 p-3 rounded-md text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                        {defaultExcludedFiles}
                      </pre>
                      <p className="text-xs text-[var(--muted)] mt-1 italic text-center">{t.form?.scrollToViewMore}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[var(--border-color)] p-4 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFiltersModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] rounded-md hover:bg-[var(--button-secondary-bg-hover)]"
                  >
                    {t.common?.close}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
