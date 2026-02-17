/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import enMessages from '../messages/en.json';

type Messages = Record<string, any>;
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  messages: Messages;
  supportedLanguages: Record<string, string>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [messages] = useState<Messages>(enMessages);

  return (
    <LanguageContext.Provider value={{
      language: 'en',
      setLanguage: () => {},
      messages,
      supportedLanguages: { en: 'English' },
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
