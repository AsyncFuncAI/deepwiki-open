'use client';

import React, {useState, useRef, useEffect} from 'react';
import { FaChevronLeft, FaChevronRight, FaBolt, FaMicroscope, FaBook, FaChevronDown, FaCheck } from 'react-icons/fa';
import Markdown from './Markdown';
import CodeMap, { PhaseStatus } from './CodeMap';
import type { CodeTarget } from './CodeViewer';
import { useLanguage } from '@/contexts/LanguageContext';
import RepoInfo from '@/types/repoinfo';
import getRepoUrl from '@/utils/getRepoUrl';
import ModelSelectionModal from './ModelSelectionModal';
import {
  createChatWebSocket,
  closeWebSocket,
  ChatCompletionRequest,
  createCodemapWebSocket,
  CodemapRequest,
  CodemapData,
  CodemapCitation,
  CodemapPhase,
} from '@/utils/websocketClient';

const DONE_PHASES: Record<CodemapPhase, PhaseStatus> = {
  analyzing: 'done',
  initial_codemap: 'done',
  diagrams: 'done',
};
const IDLE_PHASES: Record<CodemapPhase, PhaseStatus> = {
  analyzing: 'pending',
  initial_codemap: 'pending',
  diagrams: 'pending',
};

// Chat mode selector options (replaces the standalone Deep Research / Codemap toggles).
type ChatMode = 'fast' | 'deep_research' | 'codemap';

const MODES: { id: ChatMode; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'fast', label: 'Fast', description: 'Quick and responsive answers', icon: <FaBolt size={14} /> },
  { id: 'deep_research', label: 'Deep Research', description: 'More thorough investigation', icon: <FaMicroscope size={14} /> },
  { id: 'codemap', label: 'Codemap', description: 'Structured explanation grounded in code', icon: <FaBook size={14} /> },
];

interface Model {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
  models: Model[];
  supportsCustomModel?: boolean;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: 'normal' | 'deep_research';
}

interface ResearchStage {
  title: string;
  content: string;
  iteration: number;
  type: 'plan' | 'update' | 'conclusion';
}

// A finished exchange kept in the conversation log so previous
// question/answer pairs are preserved instead of being overwritten.
// A committed chat (normal / deep-research) exchange.
interface ChatTurn {
  kind: 'chat';
  question: string;
  response: string;
  mode: 'normal' | 'deep_research';
  // For deep research turns, every iteration/stage is preserved so the
  // committed section can still browse the full multi-turn investigation.
  researchStages?: ResearchStage[];
  // Index of the stage currently shown for this turn.
  stageIndex?: number;
}

// A committed codemap exchange.
interface CodemapTurn {
  kind: 'codemap';
  question: string;
  data: CodemapData;
}

// Unified, ordered conversation entry — chat and codemap turns share one list
// so they render in the true chronological order they were asked.
type ConversationTurn = ChatTurn | CodemapTurn;

interface AskProps {
  repoInfo: RepoInfo;
  provider?: string;
  model?: string;
  isCustomModel?: boolean;
  customModel?: string;
  language?: string;
  onRef?: (ref: { clearConversation: () => void }) => void;
  // Notifies the parent to open the right-side code viewer (rendered at the
  // modal level so it isn't clipped by this component's scroll container).
  onOpenCodeViewer?: (target: CodeTarget, files: string[]) => void;
  // Notifies the parent to close the code viewer (e.g. non-codemap query,
  // codemap with no citations, or conversation cleared).
  onCloseCodeViewer?: () => void;
}

const Ask: React.FC<AskProps> = ({
  repoInfo,
  provider = '',
  model = '',
  isCustomModel = false,
  customModel = '',
  language = 'en',
  onRef,
  onOpenCodeViewer,
  onCloseCodeViewer,
}) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);

  // Codemap state (a parallel flow to the normal/deep-research chat).
  const [codemapMode, setCodemapMode] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [codemapActive, setCodemapActive] = useState(false); // a codemap is generating
  const [codemapQuestion, setCodemapQuestion] = useState('');
  const [codemapData, setCodemapData] = useState<CodemapData | null>(null);
  const [codemapError, setCodemapError] = useState<string | null>(null);
  const [codemapPhaseStatus, setCodemapPhaseStatus] =
    useState<Record<CodemapPhase, PhaseStatus>>(IDLE_PHASES);

  // Model selection state
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [selectedModel, setSelectedModel] = useState(model);
  const [isCustomSelectedModel, setIsCustomSelectedModel] = useState(isCustomModel);
  const [customSelectedModel, setCustomSelectedModel] = useState(customModel);
  const [isModelSelectionModalOpen, setIsModelSelectionModalOpen] = useState(false);
  const [isComprehensiveView, setIsComprehensiveView] = useState(true);

  // Get language context for translations
  const { messages } = useLanguage();

  // Research navigation state
  const [researchStages, setResearchStages] = useState<ResearchStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [researchIteration, setResearchIteration] = useState(0);
  const [researchComplete, setResearchComplete] = useState(false);
  // Completed exchanges rendered as stacked sections above the live response.
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  // The question that produced the currently-streaming response.
  const [currentQuestion, setCurrentQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef(provider);
  const modelRef = useRef(model);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Expose clearConversation method to parent component
  useEffect(() => {
    if (onRef) {
      onRef({ clearConversation });
    }
  }, [onRef]);

  // Keep the newest content in view as the conversation grows or streams.
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [response, conversationTurns]);

  // Close WebSocket when component unmounts
  useEffect(() => {
    return () => {
      closeWebSocket(webSocketRef.current);
    };
  }, []);

  useEffect(() => {
    providerRef.current = provider;
    modelRef.current = model;
  }, [provider, model]);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        setIsLoading(true);

        const response = await fetch('/api/models/config');
        if (!response.ok) {
          throw new Error(`Error fetching model configurations: ${response.status}`);
        }

        const data = await response.json();

        // use latest provider/model ref to check
        if(providerRef.current == '' || modelRef.current== '') {
          setSelectedProvider(data.defaultProvider);

          // Find the default provider and set its default model
          const selectedProvider = data.providers.find((p:Provider) => p.id === data.defaultProvider);
          if (selectedProvider && selectedProvider.models.length > 0) {
            setSelectedModel(selectedProvider.models[0].id);
          }
        } else {
          setSelectedProvider(providerRef.current);
          setSelectedModel(modelRef.current);
        }
      } catch (err) {
        console.error('Failed to fetch model configurations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if(provider == '' || model == '') {
      fetchModel()
    }
  }, [provider, model]);

  const clearConversation = () => {
    setQuestion('');
    setResponse('');
    setConversationHistory([]);
    setConversationTurns([]);
    setCurrentQuestion('');
    setResearchIteration(0);
    setResearchComplete(false);
    setResearchStages([]);
    setCurrentStageIndex(0);
    // Codemap resets
    setCodemapActive(false);
    setCodemapQuestion('');
    setCodemapData(null);
    setCodemapError(null);
    setCodemapPhaseStatus(IDLE_PHASES);
    onCloseCodeViewer?.();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Build the message list for previously completed turns so follow-up
  // questions carry the earlier conversation as context.
  const buildHistoryFromTurns = (): Message[] =>
    conversationTurns.flatMap(turn =>
      turn.kind === 'codemap'
        ? [
            { role: 'user' as const, content: turn.question, mode: 'normal' as const },
            { role: 'assistant' as const, content: turn.data.summary || turn.data.title },
          ]
        : [
            { role: 'user' as const, content: turn.question, mode: turn.mode },
            { role: 'assistant' as const, content: turn.response },
          ]
    );
  const downloadresponse = (content: string = response) =>{
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `response-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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

  // WebSocket reference
  const webSocketRef = useRef<WebSocket | null>(null);
  // True while an HTTP fallback is running, so the WebSocket close handler
  // doesn't also commit a (partial/errored) turn.
  const fallbackActiveRef = useRef(false);

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
          content: 'Continue the research',
          mode: 'deep_research'
        }
      ];

      // Update conversation history
      setConversationHistory(newHistory);

      // Increment research iteration
      const newIteration = researchIteration + 1;
      setResearchIteration(newIteration);

      // Clear previous response
      setResponse('');

      // Prepare the request body
      const requestBody: ChatCompletionRequest = {
        repo_url: getRepoUrl(repoInfo),
        type: repoInfo.type,
        messages: newHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          mode: msg.mode ?? 'normal',
        })),
        provider: selectedProvider,
        model: isCustomSelectedModel ? customSelectedModel : selectedModel,
        language: language,
        research_iteration: newIteration
      };

      // Add tokens if available
      if (repoInfo?.token) {
        requestBody.token = repoInfo.token;
      }

      // Close any existing WebSocket connection
      closeWebSocket(webSocketRef.current);

      let fullResponse = '';

      // Create a new WebSocket connection
      webSocketRef.current = createChatWebSocket(
        requestBody,
        // Message handler
        (message: string) => {
          fullResponse += message;
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
        },
        // Error handler
        (error: Event) => {
          console.error('WebSocket error:', error);
          setResponse(prev => prev + '\n\nError: WebSocket connection failed. Falling back to HTTP...');

          // Fallback to HTTP if WebSocket fails
          fallbackActiveRef.current = true;
          fallbackToHttp(requestBody, currentQuestion, 'deep_research');
        },
        // Close handler
        () => {
          if (fallbackActiveRef.current) return;
          // Check if research is complete when the WebSocket closes
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
          }

          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error during API call:', error);
      setResponse(prev => prev + '\n\nError: Failed to continue research. Please try again.');
      setResearchComplete(true);
      setIsLoading(false);
    }
  };

  // Fallback to HTTP if WebSocket fails
  const fallbackToHttp = async (
    requestBody: ChatCompletionRequest,
    committedQuestion: string,
    mode: 'normal' | 'deep_research'
  ) => {
    try {
      // Make the API call using HTTP
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
          const stage = extractResearchStage(fullResponse, requestBody.research_iteration ?? 1);
          if (stage) {
            // Add the stage to the research stages
            setResearchStages(prev => {
              const existingStageIndex = prev.findIndex(s => s.iteration === stage.iteration && s.type === stage.type);
              if (existingStageIndex >= 0) {
                const newStages = [...prev];
                newStages[existingStageIndex] = stage;
                return newStages;
              } else {
                return [...prev, stage];
              }
            });
          }
        }
      }

      if (mode === 'normal') {
        // Normal mode: append the finished answer to the conversation log.
        commitTurn(committedQuestion, fullResponse, 'normal');
      } else {
        // Deep research: mirror the WebSocket close handlers so the iteration
        // counter advances and the auto-continue loop keeps running even when
        // every request falls back to HTTP (the WebSocket never connects).
        const iter = requestBody.research_iteration ?? 1;
        if (iter === 1) {
          // Iteration 1 is the research plan — always advance into the
          // subsequent iterations. Advancing here (after the stream finishes)
          // means the next turn captures this real answer, not a stale note.
          setResearchComplete(false);
          setResearchIteration(1);
        } else if (iter >= 5) {
          // Force a conclusion once the maximum iteration count is reached.
          const isComplete = checkIfResearchComplete(fullResponse);
          if (!isComplete) {
            const completionNote = "\n\n## Final Conclusion\nAfter multiple iterations of deep research, we've gathered significant insights about this topic. This concludes our investigation process, having reached the maximum number of research iterations. The findings presented across all iterations collectively form our comprehensive answer to the original question.";
            fullResponse += completionNote;
            setResponse(fullResponse);
          }
          setResearchComplete(true);
        } else {
          // Intermediate iterations: stop only if the model signalled completion.
          setResearchComplete(checkIfResearchComplete(fullResponse));
        }
      }
    } catch (error) {
      console.error('Error during HTTP fallback:', error);
      setResponse(prev => prev + '\n\nError: Failed to get a response. Please try again.');
      setResearchComplete(true);
    } finally {
      fallbackActiveRef.current = false;
      setIsLoading(false);
    }
  };

  // Effect to continue research when response is updated
  useEffect(() => {
    if (deepResearch && response && !isLoading && !researchComplete) {
      // Iteration 1 is the plan and is never "complete"; only apply the
      // completion heuristic from the second iteration onward.
      const isComplete = researchIteration >= 2 && checkIfResearchComplete(response);
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

  // When a deep research process finishes, move the final answer into the
  // conversation log so it is preserved as its own section.
  useEffect(() => {
    if (deepResearch && researchComplete && !isLoading && response && currentQuestion) {
      commitTurn(currentQuestion, response, 'deep_research', researchStages);
      setResearchIteration(0);
      setResearchComplete(false);
      fallbackActiveRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchComplete, isLoading, researchStages]);

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

    if (codemapMode) {
      handleCodemapAsk();
      return;
    }
    handleConfirmAsk();
  };

  // Unique set of files cited across a codemap (used as viewer tabs).
  const collectCodemapFiles = (data: CodemapData): string[] => {
    const files = new Set<string>();
    data.sections.forEach((s) =>
      s.steps.forEach((st) => {
        if (st.citation?.file_path) files.add(st.citation.file_path);
      })
    );
    return Array.from(files);
  };

  // First step citation across all sections (used to auto-open the viewer).
  const firstCitation = (data: CodemapData): CodemapCitation | null => {
    for (const section of data.sections) {
      for (const step of section.steps) {
        if (step.citation?.file_path) return step.citation;
      }
    }
    return null;
  };

  // Ask the parent to open the right-side viewer at a citation's grounded range.
  const handleCitationClick = (citation: CodemapCitation, data: CodemapData | null) => {
    const files = data ? collectCodemapFiles(data) : [citation.file_path];
    onOpenCodeViewer?.(
      {
        file_path: citation.file_path,
        start_line: citation.start_line,
        end_line: citation.end_line,
        snippet: citation.snippet,
      },
      files
    );
  };

  // Generate a codemap over the WebSocket NDJSON stream.
  const handleCodemapAsk = () => {
    const askedQuestion = question;
    setIsLoading(true);
    setQuestion('');
    setCodemapActive(true);
    setCodemapData(null);
    setCodemapError(null);
    setCodemapQuestion(askedQuestion);
    setCodemapPhaseStatus({ analyzing: 'active', initial_codemap: 'pending', diagrams: 'pending' });
    // Full-width progress while generating; the viewer auto-opens only once a
    // codemap with citations arrives.
    onCloseCodeViewer?.();

    const request: CodemapRequest = {
      repo_url: getRepoUrl(repoInfo),
      question: askedQuestion,
      type: repoInfo.type,
      provider: selectedProvider,
      model: isCustomSelectedModel ? customSelectedModel : selectedModel,
      language,
    };
    if (repoInfo?.token) request.token = repoInfo.token;

    closeWebSocket(webSocketRef.current);
    let finalData: CodemapData | null = null;

    webSocketRef.current = createCodemapWebSocket(request, {
      onEvent: (evt) => {
        if (evt.type === 'phase') {
          setCodemapPhaseStatus((prev) => ({
            ...prev,
            [evt.phase]: evt.status === 'done' ? 'done' : 'active',
          }));
        } else if (evt.type === 'codemap') {
          finalData = evt.data;
          setCodemapData(evt.data);
          // Auto-open the code viewer at the first citation, if any.
          const first = firstCitation(evt.data);
          if (first) {
            onOpenCodeViewer?.(
              {
                file_path: first.file_path,
                start_line: first.start_line,
                end_line: first.end_line,
                snippet: first.snippet,
              },
              collectCodemapFiles(evt.data)
            );
          }
        } else if (evt.type === 'error') {
          setCodemapError(evt.message);
        }
      },
      onError: () => {
        setCodemapError('Connection failed. Please try again.');
        setIsLoading(false);
      },
      onClose: () => {
        setIsLoading(false);
        setCodemapActive(false);
        if (finalData) {
          setConversationTurns((prev) => [
            ...prev,
            { kind: 'codemap', question: askedQuestion, data: finalData! },
          ]);
          setCodemapData(null);
          setCodemapQuestion('');
          setCodemapPhaseStatus(IDLE_PHASES);
        }
      },
    });
  };

  // Handle confirm and send request
  const handleConfirmAsk = async () => {
    // Capture the question for this turn and clear the input so the user
    // can immediately type a follow-up.
    const askedQuestion = question;
    const askedMode: 'normal' | 'deep_research' = deepResearch ? 'deep_research' : 'normal';

    fallbackActiveRef.current = false;
    setIsLoading(true);
    setResponse('');
    setCurrentQuestion(askedQuestion);
    setQuestion('');
    setResearchIteration(0);
    setResearchComplete(false);
    setResearchStages([]);
    setCurrentStageIndex(0);
    // Non-codemap answers use the full width, so make sure the viewer is closed.
    onCloseCodeViewer?.();

    try {
      // Create initial message
      const initialMessage: Message = {
        role: 'user',
        content: askedQuestion,
        mode: askedMode
      };

      // Include previously completed turns so the backend keeps context,
      // then append the new question.
      const newHistory: Message[] = [...buildHistoryFromTurns(), initialMessage];
      setConversationHistory(newHistory);

      // Prepare request body
      const requestBody: ChatCompletionRequest = {
        repo_url: getRepoUrl(repoInfo),
        type: repoInfo.type,
        messages: newHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          mode: msg.mode ?? 'normal'
        })),
        provider: selectedProvider,
        model: isCustomSelectedModel ? customSelectedModel : selectedModel,
        language: language,
        research_iteration: deepResearch ? 1 : undefined
      };

      // Add tokens if available
      if (repoInfo?.token) {
        requestBody.token = repoInfo.token;
      }

      // Close any existing WebSocket connection
      closeWebSocket(webSocketRef.current);

      let fullResponse = '';

      // Create a new WebSocket connection
      webSocketRef.current = createChatWebSocket(
        requestBody,
        // Message handler
        (message: string) => {
          fullResponse += message;
          setResponse(fullResponse);

          // Extract research stage if this is a deep research response
          if (deepResearch) {
            const stage = extractResearchStage(fullResponse, 1); // First iteration
            if (stage) {
              // Add the stage to the research stages
              setResearchStages([stage]);
              setCurrentStageIndex(0);
            }
          }
        },
        // Error handler
        (error: Event) => {
          console.error('WebSocket error:', error);
          setResponse(prev => prev + '\n\nError: WebSocket connection failed. Falling back to HTTP...');

          // Fallback to HTTP if WebSocket fails
          fallbackActiveRef.current = true;
          fallbackToHttp(requestBody, askedQuestion, askedMode);
        },
        // Close handler
        () => {
          if (fallbackActiveRef.current) return;
          // If deep research is enabled, check if we should continue
          if (deepResearch) {
            // Iteration 1 is the initial research plan — always continue into
            // the deeper iterations instead of letting the completion
            // heuristic (which can false-positive on the plan text) stop here.
            setResearchComplete(false);
            setResearchIteration(1);
            // The continueResearch function will be triggered by the useEffect.
          } else {
            // Normal mode: the answer is final, so append it to the log.
            commitTurn(askedQuestion, fullResponse, 'normal');
          }

          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error during API call:', error);
      setResponse(prev => prev + '\n\nError: Failed to get a response. Please try again.');
      setResearchComplete(true);
      setIsLoading(false);
    }
  };

  // Move a finished exchange out of the live response area and into the
  // persistent conversation log.
  const commitTurn = (
    turnQuestion: string,
    turnResponse: string,
    mode: 'normal' | 'deep_research',
    stages: ResearchStage[] = []
  ) => {
    if (!turnQuestion && !turnResponse) return;

    // For deep research, make sure the final answer is always present as the
    // last stage (stage extraction can miss it, e.g. on forced completion).
    let finalStages = stages;
    if (mode === 'deep_research') {
      const last = stages[stages.length - 1];
      if (turnResponse && (!last || last.content !== turnResponse)) {
        finalStages = [
          ...stages,
          {
            title: 'Final Result',
            content: turnResponse,
            iteration: stages.length + 1,
            type: 'conclusion',
          },
        ];
      }
    }

    setConversationTurns(prev => [...prev, {
      kind: 'chat',
      question: turnQuestion,
      response: turnResponse,
      mode,
      researchStages: finalStages,
      stageIndex: finalStages.length > 0 ? finalStages.length - 1 : 0,
    }]);
    setResponse('');
    setCurrentQuestion('');
    setResearchStages([]);
    setCurrentStageIndex(0);
  };

  // Switch which research stage is shown for a committed deep research turn.
  const setTurnStage = (turnIndex: number, stageIndex: number) => {
    setConversationTurns(prev =>
      prev.map((turn, i) =>
        i === turnIndex && turn.kind === 'chat' ? { ...turn, stageIndex } : turn
      )
    );
  };

  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Measure button width and update state
  useEffect(() => {
    if (buttonRef.current) {
      const width = buttonRef.current.offsetWidth;
      setButtonWidth(width);
    }
  }, [messages.ask?.askButton, isLoading]);

  return (
    <div className="relative flex flex-col min-h-full">
      {/* Conversation log: previous turns are preserved and new results
          are appended below as their own sections. */}
      <div className="flex-1 px-4 pt-4 space-y-6">
        {conversationTurns.map((turn, idx) => {
          // Codemap turn: render the codemap card in its chronological position.
          if (turn.kind === 'codemap') {
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--foreground)] text-sm whitespace-pre-wrap break-words">
                    {turn.question}
                  </div>
                </div>
                <CodeMap
                  data={turn.data}
                  phaseStatus={DONE_PHASES}
                  onCitationClick={(c) => handleCitationClick(c, turn.data)}
                />
              </div>
            );
          }

          // Chat turn (normal / deep research).
          // Deep research turns keep every iteration; show the selected one
          // and expose navigation. Normal turns just show their response.
          const stages = turn.researchStages ?? [];
          const hasStages = turn.mode === 'deep_research' && stages.length > 0;
          const activeStage = hasStages
            ? Math.min(turn.stageIndex ?? stages.length - 1, stages.length - 1)
            : 0;
          const displayContent = hasStages ? stages[activeStage].content : turn.response;

          return (
            <div key={idx} className="space-y-2">
              {/* User question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--foreground)] text-sm whitespace-pre-wrap break-words">
                  {turn.question}
                </div>
              </div>

              {/* Assistant response */}
              <div className="rounded-lg border border-[var(--border-color)]/40 bg-[var(--background)]/30">
                {turn.mode === 'deep_research' && (
                  <div className="px-4 pt-2 text-xs text-purple-600 dark:text-purple-400">
                    Deep Research
                    {hasStages && ` — ${stages[activeStage]?.title || `Stage ${activeStage + 1}`}`}
                  </div>
                )}
                <div className="p-4">
                  <Markdown content={displayContent} />
                </div>
                <div className="p-2 flex justify-between items-center border-t border-[var(--border-color)]/40">
                  {/* Stage navigation for deep research */}
                  {hasStages && stages.length > 1 ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTurnStage(idx, Math.max(0, activeStage - 1))}
                        disabled={activeStage === 0}
                        className={`p-1 rounded-md ${activeStage === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        aria-label="Previous stage"
                      >
                        <FaChevronLeft size={12} />
                      </button>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {activeStage + 1} / {stages.length}
                      </div>
                      <button
                        onClick={() => setTurnStage(idx, Math.min(stages.length - 1, activeStage + 1))}
                        disabled={activeStage === stages.length - 1}
                        className={`p-1 rounded-md ${activeStage === stages.length - 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        aria-label="Next stage"
                      >
                        <FaChevronRight size={12} />
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => downloadresponse(displayContent)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                    title="Download response as markdown file"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live codemap generation */}
        {codemapActive && (
          <div className="space-y-2">
            {codemapQuestion && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--foreground)] text-sm whitespace-pre-wrap break-words">
                  {codemapQuestion}
                </div>
              </div>
            )}
            <CodeMap
              data={codemapData}
              phaseStatus={codemapPhaseStatus}
              error={codemapError}
              onCitationClick={(c) => handleCitationClick(c, codemapData)}
            />
          </div>
        )}

        {/* Live turn: the question being asked and its streaming response */}
        {(currentQuestion || response) && (
          <div className="space-y-2">
            {currentQuestion && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--foreground)] text-sm whitespace-pre-wrap break-words">
                  {currentQuestion}
                </div>
              </div>
            )}

            {response && (
              <div className="rounded-lg border border-[var(--border-color)]/40 bg-[var(--background)]/30">
                <div
                  ref={responseRef}
                  className="p-4 max-h-[500px] overflow-y-auto"
                >
                  <Markdown content={response} />
                </div>

                {/* Research navigation and download */}
                <div className="p-2 flex justify-between items-center border-t border-[var(--border-color)]/40">
                  {/* Research navigation */}
                  {deepResearch && researchStages.length > 1 ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateToPreviousStage()}
                        disabled={currentStageIndex === 0}
                        className={`p-1 rounded-md ${currentStageIndex === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        aria-label="Previous stage"
                      >
                        <FaChevronLeft size={12} />
                      </button>

                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {currentStageIndex + 1} / {researchStages.length}
                      </div>

                      <button
                        onClick={() => navigateToNextStage()}
                        disabled={currentStageIndex === researchStages.length - 1}
                        className={`p-1 rounded-md ${currentStageIndex === researchStages.length - 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        aria-label="Next stage"
                      >
                        <FaChevronRight size={12} />
                      </button>

                      <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                        {researchStages[currentStageIndex]?.title || `Stage ${currentStageIndex + 1}`}
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Download button */}
                  <button
                    onClick={() => downloadresponse(response)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                    title="Download response as markdown file"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !response && !codemapActive && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {deepResearch
                  ? (researchIteration === 0
                    ? "Planning research approach..."
                    : `Research iteration ${researchIteration} in progress...`)
                  : "Thinking..."}
              </span>
            </div>
            {deepResearch && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 pl-5">
                <div className="flex flex-col space-y-1">
                  {researchIteration === 0 && (
                    <>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span>Creating research plan...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>Identifying key areas to investigate...</span>
                      </div>
                    </>
                  )}
                  {researchIteration === 1 && (
                    <>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span>Exploring first research area in depth...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>Analyzing code patterns and structures...</span>
                      </div>
                    </>
                  )}
                  {researchIteration === 2 && (
                    <>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                        <span>Investigating remaining questions...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span>Connecting findings from previous iterations...</span>
                      </div>
                    </>
                  )}
                  {researchIteration === 3 && (
                    <>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                        <span>Exploring deeper connections...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span>Analyzing complex patterns...</span>
                      </div>
                    </>
                  )}
                  {researchIteration === 4 && (
                    <>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                        <span>Refining research conclusions...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></div>
                        <span>Addressing remaining edge cases...</span>
                      </div>
                    </>
                  )}
                  {researchIteration >= 5 && (
                    <>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span>Finalizing comprehensive answer...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>Synthesizing all research findings...</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Anchor used to keep the latest content in view */}
        <div ref={conversationEndRef} />
      </div>

      {/* Input area — pinned to the bottom of the conversation for easy typing */}
      <div className="sticky bottom-0 bg-[var(--card-bg)] border-t border-[var(--border-color)]/40 px-4 py-3 mt-4">
        <div className="flex items-center justify-between mb-2">
          {/* Model selection button */}
          <button
            type="button"
            onClick={() => setIsModelSelectionModalOpen(true)}
            className="text-xs px-2.5 py-1 rounded border border-[var(--border-color)]/40 bg-[var(--background)]/10 text-[var(--foreground)]/80 hover:bg-[var(--background)]/30 hover:text-[var(--foreground)] transition-colors flex items-center gap-1.5"
          >
            <span>{selectedProvider}/{isCustomSelectedModel ? customSelectedModel : selectedModel}</span>
            <svg className="h-3.5 w-3.5 text-[var(--accent-primary)]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Clear the whole conversation */}
          {(conversationTurns.length > 0 || response || currentQuestion ||
            codemapActive || codemapData) && (
            <button
              id="ask-clear-conversation"
              onClick={clearConversation}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* Question input */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={messages.ask?.placeholder || 'What would you like to know about this codebase?'}
              className="block w-full rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)] px-5 py-3.5 text-base shadow-sm focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none transition-all"
              style={{ paddingRight: `${buttonWidth + 24}px` }}
              disabled={isLoading}
            />
            <button
              ref={buttonRef}
              type="submit"
              disabled={isLoading || !question.trim()}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-md font-medium text-sm ${
                isLoading || !question.trim()
                  ? 'bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)] cursor-not-allowed'
                  : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 shadow-sm'
              } transition-all duration-200 flex items-center gap-1.5`}
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span>{messages.ask?.askButton || 'Ask'}</span>
                </>
              )}
            </button>
          </div>

          {/* Chat mode selector (Fast / Deep Research / Codemap) */}
          <div className="mt-2 flex items-center gap-2">
            {(() => {
              const currentMode: ChatMode = codemapMode
                ? 'codemap'
                : deepResearch
                ? 'deep_research'
                : 'fast';
              const current = MODES.find((m) => m.id === currentMode)!;
              const selectMode = (id: ChatMode) => {
                setDeepResearch(id === 'deep_research');
                setCodemapMode(id === 'codemap');
                setModeMenuOpen(false);
              };
              return (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setModeMenuOpen((o) => !o)}
                    className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                      currentMode !== 'fast'
                        ? 'bg-purple-600/15 text-purple-600 dark:text-purple-400'
                        : 'border border-[var(--border-color)]/40 text-[var(--foreground)]/70 hover:bg-[var(--background)]/30'
                    }`}
                  >
                    {current.icon}
                    <span>{current.label}</span>
                    <FaChevronDown size={10} />
                  </button>
                  {modeMenuOpen && (
                    <>
                      {/* Click-away backdrop */}
                      <div className="fixed inset-0 z-10" onClick={() => setModeMenuOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-2 w-64 z-20 rounded-lg border border-[var(--border-color)]/40 bg-[var(--background)] shadow-xl overflow-hidden">
                        {MODES.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => selectMode(m.id)}
                            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-[var(--accent-primary)]/10 transition-colors"
                          >
                            <span className="mt-0.5 text-[var(--foreground)]/70">{m.icon}</span>
                            <span className="flex-1 min-w-0">
                              <span className="flex items-center justify-between">
                                <span className="text-sm text-[var(--foreground)]">{m.label}</span>
                                {currentMode === m.id && (
                                  <FaCheck size={11} className="text-purple-600 dark:text-purple-400" />
                                )}
                              </span>
                              <span className="block text-xs text-[var(--foreground)]/50">{m.description}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {deepResearch && researchIteration > 0 && (
              <span className="text-xs text-purple-600 dark:text-purple-400">
                {researchComplete ? '(complete)' : `(iteration ${researchIteration})`}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Model Selection Modal */}
      <ModelSelectionModal
        isOpen={isModelSelectionModalOpen}
        onClose={() => setIsModelSelectionModalOpen(false)}
        provider={selectedProvider}
        setProvider={setSelectedProvider}
        model={selectedModel}
        setModel={setSelectedModel}
        isCustomModel={isCustomSelectedModel}
        setIsCustomModel={setIsCustomSelectedModel}
        customModel={customSelectedModel}
        setCustomModel={setCustomSelectedModel}
        isComprehensiveView={isComprehensiveView}
        setIsComprehensiveView={setIsComprehensiveView}
        showFileFilters={false}
        onApply={() => {
          console.log('Model selection applied:', selectedProvider, selectedModel);
        }}
        showWikiType={false}
        authRequired={false}
        isAuthLoading={false}
      />
    </div>
  );
};

export default Ask;
