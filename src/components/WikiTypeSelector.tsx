'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaBookOpen, FaList } from 'react-icons/fa';

interface WikiTypeSelectorProps {
  isComprehensiveView: boolean;
  setIsComprehensiveView: (value: boolean) => void;
}

const WikiTypeSelector: React.FC<WikiTypeSelectorProps> = ({
  isComprehensiveView,
  setIsComprehensiveView,
}) => {
  const { messages: t } = useLanguage();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
        {t.form?.wikiType || 'Wiki Type'}
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setIsComprehensiveView(true)}
          data-active={isComprehensiveView}
          className="inline-flex items-center gap-1 rounded-[8.4px] border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1f1f1f] text-neutral-700 dark:text-neutral-300 text-xs px-2.5 py-[2px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
        >
          <FaBookOpen className="text-neutral-500 dark:text-neutral-400" />
          <span>{t.form?.comprehensive || 'Comprehensive'}</span>
        </button>
        
        <button
          type="button"
          onClick={() => setIsComprehensiveView(false)}
          data-active={!isComprehensiveView}
          className="inline-flex items-center gap-1 rounded-[8.4px] border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1f1f1f] text-neutral-700 dark:text-neutral-300 text-xs px-2.5 py-[2px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
        >
          <FaList className="text-neutral-500 dark:text-neutral-400" />
          <span>{t.form?.concise || 'Concise'}</span>
        </button>
      </div>
    </div>
  );
};

export default WikiTypeSelector;
