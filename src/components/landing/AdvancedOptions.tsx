import { cn, t } from "@/utils/utils";
import { Messages } from "next-intl";
import { FaCog } from "react-icons/fa";
import { getConfig } from "@/config";
import { IoLanguageOutline } from "react-icons/io5";
import { MdSelectAll } from "react-icons/md";
import { GeneratorModel } from "@/app/types/types";

const config = getConfig('landingPage.advancedOptions');

export default function AdvancedOptions({
  selectedLanguage,
  setSelectedLanguage,
  generatorModelName,
  setGeneratorModelName,
  availableModels,
  setIsModelConfigModalOpen,
  messages,
}: {
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  generatorModelName: string;
  setGeneratorModelName: (modelName: string) => void;
  availableModels: {[key: string]: GeneratorModel};
  setIsModelConfigModalOpen: (open: boolean) => void;
  messages: Messages;
}) {
  return (
    <div className={cn(
      "flex flex-wrap gap-4 items-start bg-[var(--card-bg)]/80 p-4 rounded-lg border border-[var(--border-color)] shadow-sm",
      config.position === 'modal' && "flex-col gap-2 bg-transparent border-none shadow-none"
    )}>
      {/* Language selection */}
      <div className="min-w-[140px]">
        <label htmlFor="language-select" className={cn("text-xs font-medium text-[var(--foreground)] mb-1.5 flex items-center gap-2", config.position === 'modal' && "text-sm")}>
          <IoLanguageOutline size={20} />
          {t('form.wikiLanguage', messages)}
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="en">English</option>
          <option value="ja">Japanese (日本語)</option>
          <option value="zh">Mandarin (中文)</option>
          <option value="es">Spanish (Español)</option>
          <option value="kr">Korean (한국어)</option>
          <option value="vi">Vietnamese (Tiếng Việt)</option>
        </select>
      </div>

      {/* Model options with improved UI and explanations */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between">
          <label htmlFor="generator-model" className={cn("text-xs font-medium text-[var(--foreground)] mb-1.5 flex items-center gap-2", config.position === 'modal' && "text-sm")}>
            <MdSelectAll size={20} />
            {t('form.modelSelection', messages)}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModelConfigModalOpen(true)}
              className="text-xs flex items-center gap-1 text-[var(--accent-primary)] hover:text-[var(--highlight)] transition-colors"
              title={messages.modelConfig?.customizeTitle || "Learn how to customize models"}
            >
              <FaCog className="text-xs" />
              <span>{messages.modelConfig?.customizeButton || "Customize"}</span>
            </button>
            <button
              type="button"
              onClick={() => window.open('https://github.com/AsyncFuncAI/deepwiki-open/blob/main/api/config/generators.json', '_blank')}
              className="text-xs text-[var(--accent-primary)] hover:text-[var(--highlight)] transition-colors"
              title={messages.modelConfig?.viewConfigTitle || "View generators.json on GitHub"}
            >
              {messages.modelConfig?.viewConfigButton || "View Config"}
            </button>
          </div>
        </div>
        <div className="relative">
          <select
            id="generator-model"
            value={generatorModelName}
            onChange={(e) => {
              console.log('Selected model:', e.target.value);
              setGeneratorModelName(e.target.value)
            }}
            className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
            aria-describedby="model-type-description"
          >
            {Object.entries(availableModels).map(([key, model]) => (
              <option key={key} value={key}>
                {model.display_name}
              </option>
            ))}
          </select>
          <div id="model-type-description" className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="group relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--muted)] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity absolute right-0 bottom-full mb-2 w-64 bg-[var(--card-bg)] p-2 rounded-md shadow-lg border border-[var(--border-color)] text-xs z-10">
                <div className="font-medium mb-1">{messages.modelConfig?.availableModelTypes || "Available Model Types:"}</div>
                <ul className="space-y-1">
                  <li><span className="font-medium">Google:</span> {messages.modelConfig?.googleRequiresShort || "Requires GOOGLE_API_KEY"}</li>
                  <li><span className="font-medium">Ollama:</span> {messages.modelConfig?.ollamaRequiresShort || "Local models, requires Ollama running"}</li>
                  <li><span className="font-medium">OpenRouter:</span> {messages.modelConfig?.openrouterRequiresShort || "Requires OPENROUTER_API_KEY"}</li>
                  <li><span className="font-medium">OpenAI:</span> {messages.modelConfig?.openaiRequiresShort || "Requires OPENAI_API_KEY"}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* Current model type indicator */}
        <div className="mt-2 flex items-center">
          <div className={`px-2 py-0.5 rounded-full text-xs ${
            generatorModelName === 'google' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            generatorModelName === 'ollama' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            generatorModelName === 'openrouter' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {generatorModelName === 'google' ? 'Google API' :
            generatorModelName === 'ollama' ? 'Local Ollama' :
            generatorModelName === 'openrouter' ? 'OpenRouter API' :
            'API'}
          </div>
          {generatorModelName === 'ollama' && (
            <div className="ml-2 text-xs text-[var(--muted)]">
              ({messages.modelConfig?.requiresOllamaLocal || "Requires Ollama running locally"})
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-[var(--muted)] flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[var(--muted)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {messages.modelConfig?.configuredIn || "Models are configured in"} <code className="bg-[var(--background)]/50 px-1 rounded">api/config/generators.json</code>.
            {messages.modelConfig?.clickHere || "Click"} <button
              onClick={() => setIsModelConfigModalOpen(true)}
              className="text-[var(--accent-primary)] hover:underline"
            >
              {messages.modelConfig?.here || "here"}
            </button> {messages.modelConfig?.toLearnHow || "to learn how to customize models."}
          </span>
        </div>
      </div>
    </div>
  );
}