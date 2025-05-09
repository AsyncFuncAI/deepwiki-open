'use client';

import React from 'react';
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
}: ModelSelectorProps) {
  const { messages: t } = useLanguage();

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
    </div>
  );
}
