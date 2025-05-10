'use client';

import React, { useState, useRef, useEffect } from 'react';
import {FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Markdown from './Markdown';
import { useLanguage } from '@/contexts/LanguageContext';
import UserSelector from './UserSelector';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ResearchStage {
  title: string;
  content: string;
  iteration: number;
  type: 'plan' | 'update' | 'conclusion';
}

interface AskProps {
  repoUrl: string;
  githubToken?: string;
  gitlabToken?: string;
  bitbucketToken?: string;
  provider?: string;
  model?: string;
  isCustomModel?: boolean;
  customModel?: string;
  language?: string;
}

const Ask: React.FC<AskProps> = ({ 
  repoUrl, 
  githubToken, 
  gitlabToken, 
  bitbucketToken, 
  provider = '',
  model = '',
  isCustomModel = false,
  customModel = '',
  language = 'en' 
}) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  
  // Model selection state
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [selectedModel, setSelectedModel] = useState(model);
  const [isCustomSelectedModel, setIsCustomSelectedModel] = useState(isCustomModel);
  const [customSelectedModel, setCustomSelectedModel] = useState(customModel);
  const [showModelOptions, setShowModelOptions] = useState(false);

  // Get language context for translations
  const { messages } = useLanguage();

  // Research navigation state
  const [researchStages, setResearchStages] = useState<ResearchStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [researchIteration, setResearchIteration] = useState(0);
  const [researchComplete, setResearchComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to bottom of response when it changes
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const clearConversation = () => {
    setQuestion('');
    setResponse('');
    setHasResponse(false);
    setConversationHistory([]);
    setResearchIteration(0);
    setResearchComplete(false);
    setResearchStages([]);
    setCurrentStageIndex(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Function to check if research is complete based on response content
  const checkIfResearchComplete = (content: string): boolean => {
    // Check for explicit final conclusion markers
    if (content.includes('## Final Conclusion')) {
      return true;
    }

    // Check for conclusion sections that don't indicate further research
    if ((content.includes('## Conclusion') || content.includes('## Summary')) &&
        !content.includes('I will now proceed to') &&
        !content.includes('Next Steps') &&
        !content.includes('next iteration')) {
      return true;
    }

    // Check for phrases that explicitly indicate completion
    if (content.includes('This concludes our research') ||
        content.includes('This completes our investigation') ||
        content.includes('This concludes the deep research process') ||
        content.includes('Key Findings and Implementation Details') ||
        content.includes('In conclusion,') ||
        (content.includes('Final') && content.includes('Conclusion'))) {
      return true;
    }

    // Check for topic-specific completion indicators
    if (content.includes('Dockerfile') &&
        (content.includes('This Dockerfile') || content.includes('The Dockerfile')) &&
        !content.includes('Next Steps') &&
        !content.includes('In the next iteration')) {
      return true;
    }

    return false;
  };

  // Function to extract research stages from the response
  const extractResearchStage = (content: string, iteration: number): ResearchStage | null => {
    // Check for research plan (first iteration)
    if (iteration === 1 && content.includes('## Research Plan')) {
      const planMatch = content.match(/## Research Plan([\s\S]*?)(?:## Next Steps|$)/);
      if (planMatch) {
        return {
          title: 'Research Plan',
          content: content,
          iteration: 1,
          type: 'plan'
        };
      }
    }

    // Check for research updates (iterations 1-4)
    if (iteration >= 1 && iteration <= 4) {
      const updateMatch = content.match(new RegExp(`## Research Update ${iteration}([\\s\\S]*?)(?:## Next Steps|$)`));
      if (updateMatch) {
        return {
          title: `Research Update ${iteration}`,
          content: content,
          iteration: iteration,
          type: 'update'
        };
      }
    }

    // Check for final conclusion
    if (content.includes('## Final Conclusion')) {
      const conclusionMatch = content.match(/## Final Conclusion([\s\S]*?)$/);
      if (conclusionMatch) {
        return {
          title: 'Final Conclusion',
          content: content,
          iteration: iteration,
          type: 'conclusion'
        };
      }
    }

    return null;
  };

  // Function to navigate to a specific research stage
  const navigateToStage = (index: number) => {
    if (index >= 0 && index < researchStages.length) {
      setCurrentStageIndex(index);
      setResponse(researchStages[index].content);
    }
  };

  // Function to navigate to the next research stage
  const navigateToNextStage = () => {
    if (currentStageIndex < researchStages.length - 1) {
      navigateToStage(currentStageIndex + 1);
    }
  };

  // Function to navigate to the previous research stage
  const navigateToPreviousStage = () => {
    if (currentStageIndex > 0) {
      navigateToStage(currentStageIndex - 1);
    }
  };

  // Function to continue research automatically
  const continueResearch = async () => {
    if (!deepResearch || researchComplete || !response || isLoading) return;

    // Add a small delay to allow the user to read the current response
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(true);

    try {
      // Store the current response for use in the history
      const currentResponse = response;

      // Create a new message from the AI's previous response
      const newHistory: Message[] = [
        ...conversationHistory,
        {
          role: 'assistant',
          content: currentResponse
        },
        {
          role: 'user',
          content: '[DEEP RESEARCH] Continue the research'
        }
      ];

      // Update conversation history
      setConversationHistory(newHistory);

      // Increment research iteration
      const newIteration = researchIteration + 1;
      setResearchIteration(newIteration);

      // Prepare the request body
      const requestBody: Record<string, unknown> = {
        repo_url: repoUrl,
        messages: newHistory,
        provider: selectedProvider,
        model: isCustomSelectedModel ? customSelectedModel : selectedModel,
        language: language
      };

      // Add tokens if available
      if (githubToken && repoUrl.includes('github.com')) {
        requestBody.github_token = githubToken;
      }
      if (gitlabToken && repoUrl.includes('gitlab.com')) {
        requestBody.gitlab_token = gitlabToken;
      }
      if (bitbucketToken && repoUrl.includes('bitbucket.org')) {
        requestBody.bitbucket_token = bitbucketToken;
      }

      // Make the API call
      const apiResponse = await fetch(`/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      // Clear previous response
      setResponse('');

      // Process the streaming response
      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      // Read the stream
      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setResponse(fullResponse);

        // Extract research stage if this is a deep research response
        if (deepResearch) {
          const stage = extractResearchStage(fullResponse, newIteration);
          if (stage) {
            // Add the stage to the research stages if it's not already there
            setResearchStages(prev => {
              // Check if we already have this stage
              const existingStageIndex = prev.findIndex(s => s.iteration === stage.iteration && s.type === stage.type);
              if (existingStageIndex >= 0) {
                // Update existing stage
                const newStages = [...prev];
                newStages[existingStageIndex] = stage;
                return newStages;
              } else {
                // Add new stage
                return [...prev, stage];
              }
            });

            // Update current stage index to the latest stage
            setCurrentStageIndex(researchStages.length);
          }
        }
      }

      // Check if research is complete
      const isComplete = checkIfResearchComplete(fullResponse);

      // Force completion after a maximum number of iterations (5)
      const forceComplete = newIteration >= 5;

      if (forceComplete && !isComplete) {
        // If we're forcing completion, append a comprehensive conclusion to the response
        const completionNote = "\n\n## Final Conclusion\nAfter multiple iterations of deep research, we've gathered significant insights about this topic. This concludes our investigation process, having reached the maximum number of research iterations. The findings presented across all iterations collectively form our comprehensive answer to the original question.";
        fullResponse += completionNote;
        setResponse(fullResponse);
        setResearchComplete(true);
      } else {
        setResearchComplete(isComplete);

        // If not complete and we haven't reached max iterations, continue research
        // Don't call continueResearch directly to avoid stack overflow
        // The useEffect will trigger it after a short delay
      }
    } catch (error) {
      console.error('Error during API call:', error);
      setResponse(prev => prev + '\n\nError: Failed to continue research. Please try again.');
      setResearchComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to continue research when response is updated
  useEffect(() => {
    if (deepResearch && response && !isLoading && !researchComplete) {
      const isComplete = checkIfResearchComplete(response);
      if (isComplete) {
        setResearchComplete(true);
      } else if (researchIteration > 0 && researchIteration < 5) {
        // Only auto-continue if we're already in a research process and haven't reached max iterations
        // Use setTimeout to avoid potential infinite loops
        const timer = setTimeout(() => {
          continueResearch();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, isLoading, deepResearch, researchComplete, researchIteration]);

  // Effect to update research stages when the response changes
  useEffect(() => {
    if (deepResearch && response && !isLoading) {
      // Try to extract a research stage from the response
      const stage = extractResearchStage(response, researchIteration);
      if (stage) {
        // Add or update the stage in the research stages
        setResearchStages(prev => {
          // Check if we already have this stage
          const existingStageIndex = prev.findIndex(s => s.iteration === stage.iteration && s.type === stage.type);
          if (existingStageIndex >= 0) {
            // Update existing stage
            const newStages = [...prev];
            newStages[existingStageIndex] = stage;
            return newStages;
          } else {
            // Add new stage
            return [...prev, stage];
          }
        });

        // Update current stage index to point to this stage
        setCurrentStageIndex(prev => {
          const newIndex = researchStages.findIndex(s => s.iteration === stage.iteration && s.type === stage.type);
          return newIndex >= 0 ? newIndex : prev;
        });
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, isLoading, deepResearch, researchIteration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    
    // Submit directly instead of showing model selector
    handleConfirmAsk();
  };
  
  // Handle confirm and send request
  const handleConfirmAsk = async () => {
    setIsLoading(true);
    setHasResponse(false);

    try {
      // Prepare the conversation history
      const newHistory: Message[] = [
        {
          role: 'user',
          content: question
        }
      ];

      // Update conversation history
      setConversationHistory(newHistory);

      // Prepare the request body
      const requestBody: Record<string, unknown> = {
        repo_url: repoUrl,
        messages: newHistory,
        provider: selectedProvider,
        model: isCustomSelectedModel ? customSelectedModel : selectedModel,
        language: language
      };

      // Add tokens if available
      if (githubToken && repoUrl.includes('github.com')) {
        requestBody.github_token = githubToken;
      }
      if (gitlabToken && repoUrl.includes('gitlab.com')) {
        requestBody.gitlab_token = gitlabToken;
      }
      if (bitbucketToken && repoUrl.includes('bitbucket.org')) {
        requestBody.bitbucket_token = bitbucketToken;
      }

      // Make the API call
      const apiResponse = await fetch(`/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      // Process the streaming response
      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      // Clear previous response
      setResponse('');

      // Read the stream
      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setResponse(fullResponse);
      }

      // Update state to indicate we have a response
      setHasResponse(true);
    } catch (error) {
      console.error('Error during API call:', error);
      setResponse('Error: Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the component
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md overflow-hidden shadow-sm">
      <div className="p-4">
        <h2 className="text-xl font-serif mb-4 text-[var(--accent-primary)]">
          {messages.ask?.title || 'Ask about this repository'}
        </h2>

        {/* Model options (always available as a collapsible section) */}
        <div className="mb-4">
          <button
            onClick={() => setShowModelOptions(prev => !prev)}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--highlight-bg)] transition-colors"
          >
            <div className="flex items-center">
              <span className="text-sm">
                <span className="font-medium">{messages.form?.modelProvider || 'Provider'}:</span> {selectedProvider}
                <span className="mx-2">|</span>
                <span className="font-medium">{messages.form?.modelSelection || 'Model'}:</span> {isCustomSelectedModel ? customSelectedModel : selectedModel}
              </span>
            </div>
            <span className="text-[var(--accent-primary)]">
              {showModelOptions ? '▲' : '▼'}
            </span>
          </button>
          {showModelOptions && (
            <div className="mt-2">
              <UserSelector
                provider={selectedProvider}
                setProvider={setSelectedProvider}
                model={selectedModel}
                setModel={setSelectedModel}
                isCustomModel={isCustomSelectedModel}
                setIsCustomModel={setIsCustomSelectedModel}
                customModel={customSelectedModel}
                setCustomModel={setCustomSelectedModel}
                showFileFilters={false}
              />
            </div>
          )}
        </div>

        {/* Question input */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={messages.ask?.placeholder || 'Ask a question about this repo...'}
              className="block w-full rounded-md border-2 border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)] px-4 py-3 text-base focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-opacity-50 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1.5 rounded-md ${
                isLoading || !question.trim()
                  ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)] cursor-not-allowed'
                  : 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-bg-hover)]'
              } transition-colors`}
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[var(--button-primary-text)] animate-spin" />
              ) : (
                messages.ask?.askButton || 'Ask'
              )}
            </button>
          </div>
        </form>

        {/* Response area */}
        {(response || isLoading) && (
          <div className="mt-6">
            <div className="border-t border-[var(--border-color)] pt-4">
              <h3 className="text-lg font-medium mb-2 text-[var(--foreground)]">
                {messages.ask?.response || 'Response:'}
              </h3>
              <div
                ref={responseRef}
                className="prose prose-sm max-w-none overflow-auto max-h-[70vh]"
              >
                {response ? (
                  <Markdown content={response} />
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Research navigation (if deep research is enabled) */}
              {researchStages.length > 0 && (
                <div className="mt-6 border-t border-[var(--border-color)] pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-[var(--foreground)]">
                      {messages.ask?.researchStages || 'Research Stages:'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={navigateToPreviousStage}
                        disabled={currentStageIndex <= 0}
                        className={`p-2 rounded-full ${
                          currentStageIndex <= 0
                            ? 'text-[var(--muted)] cursor-not-allowed'
                            : 'text-[var(--accent-primary)] hover:bg-[var(--highlight-bg)] transition-colors'
                        }`}
                      >
                        <FaChevronLeft size={16} />
                      </button>
                      <button
                        onClick={navigateToNextStage}
                        disabled={currentStageIndex >= researchStages.length - 1}
                        className={`p-2 rounded-full ${
                          currentStageIndex >= researchStages.length - 1
                            ? 'text-[var(--muted)] cursor-not-allowed'
                            : 'text-[var(--accent-primary)] hover:bg-[var(--highlight-bg)] transition-colors'
                        }`}
                      >
                        <FaChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {researchStages.map((stage, index) => (
                      <button
                        key={`${stage.type}-${stage.iteration}`}
                        onClick={() => navigateToStage(index)}
                        className={`whitespace-nowrap px-3 py-1.5 text-sm rounded-md border ${
                          currentStageIndex === index
                            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                            : 'bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--border-color)] hover:bg-[var(--highlight-bg)] transition-colors'
                        }`}
                      >
                        {stage.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear button */}
              {response && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearConversation}
                    className="px-3 py-1.5 text-sm rounded-md bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-bg-hover)] transition-colors"
                  >
                    {messages.ask?.clearButton || 'Clear conversation'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ask;