'use client';

import React from 'react';
import ProcessedProjects from '@/components/ProcessedProjects';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WikiProjectsPage() {
  const { messages } = useLanguage();

  return (
    <div className="container mx-auto p-4">
      <ProcessedProjects
        showHeader={true}
        messages={messages}
        className=""
      />
    </div>
  );
}