'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import UserSelector from './UserSelector';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: string;
  setProvider: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  isCustomModel: boolean;
  setIsCustomModel: (value: boolean) => void;
  customModel: string;
  setCustomModel: (value: string) => void;
  onApply: () => void;
  
  // File filter options - optional
  excludedDirs?: string;
  setExcludedDirs?: (value: string) => void;
  excludedFiles?: string;
  setExcludedFiles?: (value: string) => void;
  showFileFilters?: boolean;
}

export default function ModelSelectionModal({
  isOpen,
  onClose,
  provider,
  setProvider,
  model,
  setModel,
  isCustomModel,
  setIsCustomModel,
  customModel,
  setCustomModel,
  onApply,
  excludedDirs = '',
  setExcludedDirs,
  excludedFiles = '',
  setExcludedFiles,
  showFileFilters = false
}: ModelSelectionModalProps) {
  const { messages: t } = useLanguage();
  
  // Local state for form values (to only apply changes when the user clicks "Submit")
  const [localProvider, setLocalProvider] = useState(provider);
  const [localModel, setLocalModel] = useState(model);
  const [localIsCustomModel, setLocalIsCustomModel] = useState(isCustomModel);
  const [localCustomModel, setLocalCustomModel] = useState(customModel);
  const [localExcludedDirs, setLocalExcludedDirs] = useState(excludedDirs);
  const [localExcludedFiles, setLocalExcludedFiles] = useState(excludedFiles);
  
  // Reset local state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setLocalProvider(provider);
      setLocalModel(model);
      setLocalIsCustomModel(isCustomModel);
      setLocalCustomModel(customModel);
      setLocalExcludedDirs(excludedDirs);
      setLocalExcludedFiles(excludedFiles);
    }
  }, [isOpen, provider, model, isCustomModel, customModel, excludedDirs, excludedFiles]);

  // Handler for applying changes
  const handleApply = () => {
    setProvider(localProvider);
    setModel(localModel);
    setIsCustomModel(localIsCustomModel);
    setCustomModel(localCustomModel);
    if (setExcludedDirs) setExcludedDirs(localExcludedDirs);
    if (setExcludedFiles) setExcludedFiles(localExcludedFiles);
    onApply();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center bg-black/50">
        <div className="relative transform overflow-hidden rounded-lg bg-[var(--card-bg)] text-left shadow-xl transition-all sm:my-8 sm:max-w-lg sm:w-full">
          {/* Modal header with close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-lg font-medium text-[var(--accent-primary)]">
              <span className="text-[var(--accent-primary)]">{t.form?.modelSelection || 'Model Selection'}</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal body */}
          <div className="p-6">
            <UserSelector
              provider={localProvider}
              setProvider={setLocalProvider}
              model={localModel}
              setModel={setLocalModel}
              isCustomModel={localIsCustomModel}
              setIsCustomModel={setLocalIsCustomModel}
              customModel={localCustomModel}
              setCustomModel={setLocalCustomModel}
              showFileFilters={showFileFilters}
              excludedDirs={localExcludedDirs}
              setExcludedDirs={showFileFilters ? (value: string) => setLocalExcludedDirs(value) : undefined}
              excludedFiles={localExcludedFiles}
              setExcludedFiles={showFileFilters ? (value: string) => setLocalExcludedFiles(value) : undefined}
            />
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
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium rounded-md border border-transparent bg-[var(--accent-primary)]/90 text-white hover:bg-[var(--accent-primary)] transition-colors"
            >
              {t.common?.submit || 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
