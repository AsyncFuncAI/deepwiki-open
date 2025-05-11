import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple syntax highlighting function for JSON
const highlightJson = (json: string): React.ReactNode => {
  // Replace with styled spans
  const highlighted = json
    // Highlight keys
    .replace(/"([^"]+)":/g, '<span class="text-blue-600 dark:text-blue-400">"$1"</span>:')
    // Highlight string values
    .replace(/: "([^"]+)"/g, ': <span class="text-green-600 dark:text-green-400">"$1"</span>')
    // Highlight numbers
    .replace(/: ([0-9.]+)([,}])/g, ': <span class="text-amber-600 dark:text-amber-400">$1</span>$2')
    // Highlight booleans
    .replace(/: (true|false)([,}])/g, ': <span class="text-purple-600 dark:text-purple-400">$1</span>$2')
    // Highlight comments
    .replace(/(\/\/.+)$/gm, '<span class="text-gray-500 dark:text-gray-400">$1</span>');

  return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

const ModelConfigModal: React.FC<ModelConfigModalProps> = ({ isOpen, onClose }) => {
  const { messages } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div className="bg-[var(--card-bg)] rounded-lg shadow-custom border border-[var(--border-color)] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{messages.modelConfig?.title || "Customizing Model Configuration"}</h2>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              <section>
                <h3 className="text-md font-medium text-[var(--foreground)] mb-2">{messages.modelConfig?.aboutTitle || "About Model Configuration"}</h3>
                <p className="text-sm text-[var(--foreground)] mb-4">
                  {messages.modelConfig?.aboutDescription || "DeepWiki supports multiple AI models through a configuration file called"} <code className="bg-[var(--background)]/50 px-1 rounded">generators.json</code>.
                  {messages.modelConfig?.aboutDescription2 || "This file defines which models are available in the dropdown menu and their settings."}
                </p>
              </section>

              <section>
                <h3 className="text-md font-medium text-[var(--foreground)] mb-2">{messages.modelConfig?.customizeTitle || "How to Customize Models"}</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-[var(--foreground)]">
                  <li>
                    <span className="font-medium">{messages.modelConfig?.locateFile || "Locate the configuration file:"}</span>
                    <div className="bg-[var(--background)]/70 p-2 rounded mt-1 font-mono text-xs">
                      api/config/generators.json
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">{messages.modelConfig?.editFile || "Edit the file to add or modify models:"}</span>
                    <div className="bg-[var(--background)]/70 p-3 rounded mt-1 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {highlightJson(`{
  "google": {
    "model_type": "google",
    "model_kwargs": {
      "model": "gemini-2.5-flash-preview-04-17",
      "temperature": 0.7,
      "top_p": 0.8
    }
  },

  "ollama": {
    "model_type": "ollama",
    "model_kwargs": {
      "model": "qwen3:1.7b",
      "options": {
        "temperature": 0.7,
        "top_p": 0.8
      }
    }
  },

  "openrouter": {
    "model_type": "openrouter",
    "model_kwargs": {
      "model": "qwen/qwen3-235b-a22b",
      "temperature": 0.7,
      "top_p": 0.8
    }
  }
}`)}
                      </pre>
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">{messages.modelConfig?.restartServer || "Restart the API server for changes to take effect"}</span>
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-md font-medium text-[var(--foreground)] mb-2">{messages.modelConfig?.supportedTypes || "Supported Model Types"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-[var(--background)]/50 p-3 rounded border border-[var(--border-color)]">
                    <h4 className="font-medium mb-1">{messages.modelConfig?.googleTitle || "Google (Gemini)"}</h4>
                    <p className="text-xs text-[var(--muted)] mb-2">{messages.modelConfig?.googleRequires || "Requires GOOGLE_API_KEY environment variable"}</p>
                    <code className="text-xs block">model_type: &quot;google&quot;</code>
                  </div>

                  <div className="bg-[var(--background)]/50 p-3 rounded border border-[var(--border-color)]">
                    <h4 className="font-medium mb-1">{messages.modelConfig?.ollamaTitle || "Ollama (Local Models)"}</h4>
                    <p className="text-xs text-[var(--muted)] mb-2">{messages.modelConfig?.ollamaRequires || "Requires Ollama running locally"}</p>
                    <code className="text-xs block">model_type: &quot;ollama&quot;</code>
                  </div>

                  <div className="bg-[var(--background)]/50 p-3 rounded border border-[var(--border-color)]">
                    <h4 className="font-medium mb-1">{messages.modelConfig?.openrouterTitle || "OpenRouter"}</h4>
                    <p className="text-xs text-[var(--muted)] mb-2">{messages.modelConfig?.openrouterRequires || "Requires OPENROUTER_API_KEY environment variable"}</p>
                    <code className="text-xs block">model_type: &quot;openrouter&quot;</code>
                  </div>

                  <div className="bg-[var(--background)]/50 p-3 rounded border border-[var(--border-color)]">
                    <h4 className="font-medium mb-1">{messages.modelConfig?.openaiTitle || "OpenAI & Compatible Providers"}</h4>
                    <p className="text-xs text-[var(--muted)] mb-2">
                      {messages.modelConfig?.openaiRequires || "Uses OPENAI_API_KEY environment variable by default, or custom API key and base URL in configuration"}
                    </p>
                    <code className="text-xs block">model_type: &quot;openai&quot;</code>
                    <p className="text-xs text-[var(--muted)] mt-2">
                      {messages.modelConfig?.openaiSupports || "Supports custom OpenAI-compatible providers by adding"} <code className="text-xs">base_url</code> {messages.modelConfig?.and || "and"} <code className="text-xs">api_key</code> {messages.modelConfig?.toModelKwargs || "to model_kwargs"}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-md font-medium text-[var(--foreground)] mb-2">{messages.modelConfig?.examplesTitle || "Example: Adding New Models"}</h3>

                <h4 className="text-sm font-medium text-[var(--foreground)] mt-3 mb-2">{messages.modelConfig?.standardOpenaiTitle || "Standard OpenAI Model"}</h4>
                <div className="bg-[var(--background)]/70 p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {highlightJson(`// ${messages.modelConfig?.addToFile || "Add this to your generators.json file:"}

"openai-gpt4": {
  "model_type": "openai",
  "model_kwargs": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "top_p": 0.9
  }
}`)}
                  </pre>
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  {messages.modelConfig?.standardOpenaiDescription || "This uses the standard OpenAI API with your OPENAI_API_KEY environment variable."}
                </p>

                <h4 className="text-sm font-medium text-[var(--foreground)] mt-4 mb-2">{messages.modelConfig?.customOpenaiTitle || "Custom OpenAI-Compatible Provider"}</h4>
                <div className="bg-[var(--background)]/70 p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {highlightJson(`// ${messages.modelConfig?.addToUseCustom || "Add this to use a custom OpenAI-compatible API:"}

"custom-openai": {
  "model_type": "openai",
  "model_kwargs": {
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "top_p": 0.8,
    "base_url": "https://aihubmix.com/v1",
    "api_key": "sk-xxxx"
  }
}`)}
                  </pre>
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  {messages.modelConfig?.customOpenaiDescription || "This allows you to use any OpenAI-compatible API by specifying a custom base_url and api_key."}
                </p>

                <h4 className="text-sm font-medium text-[var(--foreground)] mt-4 mb-2">{messages.modelConfig?.completeExampleTitle || "Complete Example with New Models"}</h4>
                <div className="bg-[var(--background)]/70 p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {highlightJson(`{
  "google": {
    "model_type": "google",
    "model_kwargs": {
      "model": "gemini-2.5-flash-preview-04-17",
      "temperature": 0.7,
      "top_p": 0.8
    }
  },

  "ollama": {
    "model_type": "ollama",
    "model_kwargs": {
      "model": "qwen3:1.7b",
      "options": {
        "temperature": 0.7,
        "top_p": 0.8
      }
    }
  },

  "openrouter": {
    "model_type": "openrouter",
    "model_kwargs": {
      "model": "qwen/qwen3-235b-a22b",
      "temperature": 0.7,
      "top_p": 0.8
    }
  },

  // ${messages.modelConfig?.standardOpenaiComment || "Standard OpenAI model"}
  "openai-gpt4": {
    "model_type": "openai",
    "model_kwargs": {
      "model": "gpt-4o",
      "temperature": 0.7,
      "top_p": 0.9
    }
  },

  // ${messages.modelConfig?.customOpenaiComment || "Custom OpenAI-compatible provider"}
  "custom-openai": {
    "model_type": "openai",
    "model_kwargs": {
      "model": "gpt-3.5-turbo",
      "temperature": 0.7,
      "top_p": 0.8,
      "base_url": "https://aihubmix.com/v1",
      "api_key": "sk-xxxx"
    }
  }
}`)}
                  </pre>
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  {messages.modelConfig?.completeExampleDescription || "After adding the new models, they will appear in the dropdown menu on the homepage."}
                </p>
              </section>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-primary)]/90 transition-colors"
            >
              {messages.common?.close || "Close"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelConfigModal;
