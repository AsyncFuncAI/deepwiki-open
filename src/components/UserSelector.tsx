'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// ===== Types =====
interface Model { id: string; name: string }
interface Provider { id: string; name: string; models: Model[]; supportsCustomModel?: boolean }
interface ModelConfig { providers: Provider[]; defaultProvider: string }

interface ModelSelectorProps {
  provider: string;
  setProvider: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  isCustomModel: boolean;
  setIsCustomModel: (value: boolean) => void;
  customModel: string;
  setCustomModel: (value: string) => void;
  forceRefetch: boolean;
  setForceRefetch: (forceRefetch: boolean) => void;

  // File filter configuration
  showFileFilters?: boolean;
  excludedDirs?: string;
  setExcludedDirs?: (value: string) => void;
  excludedFiles?: string;
  setExcludedFiles?: (value: string) => void;
  includedDirs?: string;
  setIncludedDirs?: (value: string) => void;
  includedFiles?: string;
  setIncludedFiles?: (value: string) => void;
}

// ===== Constants (kept outside component so they're not re-created) =====
const DEFAULT_EXCLUDED_DIRS = `./.venv/
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

const DEFAULT_EXCLUDED_FILES = `package-lock.json
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

// ===== Small UI primitives =====
const Label: React.FC<React.PropsWithChildren<{ htmlFor?: string }>> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
      {children}
    </label>
);

const InputShell: React.FC<React.PropsWithChildren<{ disabled?: boolean }>> = ({ children }) => (
    <div className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]">
      {children}
    </div>
);

const Select = (
    props: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>
) => (
    <select
        {...props}
        className={
          [
            'input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]',
            props.className || ''
          ].join(' ')
        }
    />
);

const Toggle: React.FC<{
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
}> = ({ id, checked, onChange, label, className }) => (
    <div className="mb-2">
      <div className="flex items-center gap-2 pb-1">
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={`${id}-label`}
            onClick={() => onChange(!checked)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(!checked);
              }
            }}
            className={[
              'relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus-visible:ring focus-visible:ring-[var(--accent-primary)]',
              className || ''
            ].join(' ')}
            data-state={checked ? 'on' : 'off'}
        >
          {/* Track */}
          <span
              aria-hidden
              className={`absolute inset-0 rounded-full ${checked ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}
          />
          {/* Thumb */}
          <span
              aria-hidden
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform transform ${checked ? 'translate-x-5' : ''}`}
          />
        </button>
        <label
            id={`${id}-label`}
            className="text-sm font-medium text-[var(--muted)] cursor-pointer"
            onClick={() => onChange(!checked)}
        >
          {label}
        </label>
      </div>
    </div>
);

const TextArea: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
  rows?: number;
  placeholder?: string;
}> = ({ value, onChange, rows = 4, placeholder }) => (
    <textarea
        value={value}
        onChange={e => onChange?.(e.target.value)}
        rows={rows}
        className="block w-full rounded-md border border-[var(--border-color)]/50 bg-[var(--input-bg)] text-[var(--foreground)] px-3 py-2 text-sm focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-opacity-50 shadow-sm"
        placeholder={placeholder}
    />
);

// ===== Main component =====
export default function UserSelector({
                                       provider,
                                       setProvider,
                                       model,
                                       setModel,
                                       isCustomModel,
                                       setIsCustomModel,
                                       customModel,
                                       setCustomModel,
                                       forceRefetch,
                                       setForceRefetch,

                                       showFileFilters = false,
                                       excludedDirs = '',
                                       setExcludedDirs,
                                       excludedFiles = '',
                                       setExcludedFiles,
                                       includedDirs = '',
                                       setIncludedDirs,
                                       includedFiles = '',
                                       setIncludedFiles
                                     }: ModelSelectorProps) {
  const { messages: t } = useLanguage();

  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'exclude' | 'include'>('exclude');
  const [showDefaultDirs, setShowDefaultDirs] = useState(false);
  const [showDefaultFiles, setShowDefaultFiles] = useState(false);

  // Fetch config once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/models/config');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ModelConfig = await res.json();
        if (!mounted) return;
        setModelConfig(data);

        // initialize defaults once
        if (!provider && data.defaultProvider) {
          setProvider(data.defaultProvider);
          const defProv = data.providers.find(p => p.id === data.defaultProvider);
          if (defProv?.models?.[0]) setModel(defProv.models[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch model configurations', e);
        if (mounted) setError('Failed to load model configurations. Using default options.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProvider = useMemo(
      () => modelConfig?.providers.find(p => p.id === provider) || null,
      [modelConfig, provider]
  );

  const supportsCustomModel = !!selectedProvider?.supportsCustomModel;

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setIsCustomModel(false);
    const p = modelConfig?.providers.find(pp => pp.id === newProvider);
    if (p?.models?.[0]) setModel(p.models[0].id);
  };

  const modelOptions = selectedProvider?.models ?? [];

  if (isLoading) {
    return (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-[var(--muted)]">Loading model configurations...</div>
        </div>
    );
  }

  return (
      <div className="flex flex-col gap-3">
        <div className="space-y-4">
          {error && <div className="text-sm text-red-500 mb-2">{error}</div>}

          {/* Provider */}
          <div>
            <Label htmlFor="provider-dropdown">{t.form?.modelProvider || 'Model Provider'}</Label>
            <Select
                id="provider-dropdown"
                value={provider}
                onChange={e => handleProviderChange(e.target.value)}
            >
              <option value="" disabled>{t.form?.selectProvider || 'Select Provider'}</option>
              {modelConfig?.providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {t.form?.[`provider${p.id.charAt(0).toUpperCase() + p.id.slice(1)}`] || p.name}
                  </option>
              ))}
            </Select>
          </div>

          {/* Model selection */}
          <div>
            <Label htmlFor={isCustomModel ? 'custom-model-input' : 'model-dropdown'}>
              {t.form?.modelSelection || 'Model Selection'}
            </Label>

            {isCustomModel ? (
                <input
                    id="custom-model-input"
                    type="text"
                    value={customModel}
                    onChange={e => { setCustomModel(e.target.value); setModel(e.target.value); }}
                    placeholder={t.form?.customModelPlaceholder || 'Enter custom model name'}
                    className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
            ) : (
                <Select
                    id="model-dropdown"
                    value={model}
                    disabled={!provider || !modelOptions.length}
                    onChange={e => setModel(e.target.value)}
                >
                  {modelOptions.length === 0 ? (
                      <option value="">{t.form?.selectModel || 'Select Model'}</option>
                  ) : (
                      modelOptions.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                      ))
                  )}
                </Select>
            )}
          </div>

          {/* Toggles */}
          <Toggle
              id="is-need-refetch"
              checked={forceRefetch}
              onChange={setForceRefetch}
              label={t.form?.needRefetchRepo || 'Force refetch repo'}
          />

          {supportsCustomModel && (
              <Toggle
                  id="use-custom-model"
                  checked={isCustomModel}
                  onChange={(next) => {
                    setIsCustomModel(next);
                    if (next) setCustomModel(model);
                  }}
                  label={t.form?.useCustomModel || 'Use custom model'}
              />
          )}

          {/* Advanced file filters */}
          {showFileFilters && (
              <div className="mt-4">
                <button
                    type="button"
                    onClick={() => setIsFilterSectionOpen(o => !o)}
                    className="flex items-center text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
                >
                  <span className="mr-1.5 text-xs">{isFilterSectionOpen ? '▼' : '►'}</span>
                  {t.form?.advancedOptions || 'Advanced Options'}
                </button>

                {isFilterSectionOpen && (
                    <div className="mt-3 p-3 border border-[var(--border-color)]/70 rounded-md bg-[var(--background)]/30">
                      {/* Mode */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          {t.form?.filterMode || 'Filter Mode'}
                        </label>
                        <div className="flex gap-2">
                          {(['exclude','include'] as const).map(mode => (
                              <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setFilterMode(mode)}
                                  className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors ${
                                      filterMode === mode
                                          ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                          : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
                                  }`}
                              >
                                {mode === 'exclude' ? (t.form?.excludeMode || 'Exclude Paths') : (t.form?.includeMode || 'Include Only Paths')}
                              </button>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {filterMode === 'exclude'
                              ? (t.form?.excludeModeDescription || 'Specify paths to exclude from processing (default behavior)')
                              : (t.form?.includeModeDescription || 'Specify only the paths to include, ignoring all others')}
                        </p>
                      </div>

                      {/* Directories */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-[var(--muted)] mb-1.5">
                          {filterMode === 'exclude' ? (t.form?.excludedDirs || 'Excluded Directories') : (t.form?.includedDirs || 'Included Directories')}
                        </label>
                        <TextArea
                            value={filterMode === 'exclude' ? excludedDirs : includedDirs}
                            onChange={(v) => filterMode === 'exclude' ? setExcludedDirs?.(v) : setIncludedDirs?.(v)}
                            placeholder={filterMode === 'exclude' ? (t.form?.enterExcludedDirs || 'Enter excluded directories, one per line...') : (t.form?.enterIncludedDirs || 'Enter included directories, one per line...')}
                        />

                        {filterMode === 'exclude' && (
                            <>
                              <div className="flex mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => setShowDefaultDirs(v => !v)}
                                    className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
                                >
                                  {showDefaultDirs ? (t.form?.hideDefault || 'Hide Default') : (t.form?.viewDefault || 'View Default')}
                                </button>
                              </div>
                              {showDefaultDirs && (
                                  <div className="mt-2 p-2 rounded bg-[var(--background)]/50 text-xs">
                                    <p className="mb-1 text-[var(--muted)]">{t.form?.defaultNote || 'These defaults are already applied. Add your custom exclusions above.'}</p>
                                    <pre className="whitespace-pre-wrap font-mono text-[var(--muted)] overflow-y-auto max-h-32">{DEFAULT_EXCLUDED_DIRS}</pre>
                                  </div>
                              )}
                            </>
                        )}
                      </div>

                      {/* Files */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)] mb-1.5">
                          {filterMode === 'exclude' ? (t.form?.excludedFiles || 'Excluded Files') : (t.form?.includedFiles || 'Included Files')}
                        </label>
                        <TextArea
                            value={filterMode === 'exclude' ? excludedFiles : includedFiles}
                            onChange={(v) => filterMode === 'exclude' ? setExcludedFiles?.(v) : setIncludedFiles?.(v)}
                            placeholder={filterMode === 'exclude' ? (t.form?.enterExcludedFiles || 'Enter excluded files, one per line...') : (t.form?.enterIncludedFiles || 'Enter included files, one per line...')}
                        />

                        {filterMode === 'exclude' && (
                            <>
                              <div className="flex mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => setShowDefaultFiles(v => !v)}
                                    className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
                                >
                                  {showDefaultFiles ? (t.form?.hideDefault || 'Hide Default') : (t.form?.viewDefault || 'View Default')}
                                </button>
                              </div>
                              {showDefaultFiles && (
                                  <div className="mt-2 p-2 rounded bg-[var(--background)]/50 text-xs">
                                    <p className="mb-1 text-[var(--muted)]">{t.form?.defaultNote || 'These defaults are already applied. Add your custom exclusions above.'}</p>
                                    <pre className="whitespace-pre-wrap font-mono text-[var(--muted)] overflow-y-auto max-h-32">{DEFAULT_EXCLUDED_FILES}</pre>
                                  </div>
                              )}
                            </>
                        )}
                      </div>
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}
