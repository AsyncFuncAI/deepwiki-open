'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import Markdown from './Markdown';
import { useLanguage } from '@/contexts/LanguageContext';

interface Repository {
  repo_url: string;
  access_token?: string;
  description?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MultiRepoChatProps {
  repositories: Repository[];
  localOllama?: boolean;
  useOpenRouter?: boolean;
  openRouterModel?: string;
  language?: string;
}

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8001';

const MultiRepoChat: React.FC<MultiRepoChatProps> = ({ 
  repositories, 
  localOllama = false, 
  useOpenRouter = false, 
  openRouterModel = 'openai/gpt-4o', 
  language = 'en' 
}) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [hasResponse, setHasResponse] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  
  // Get language context for translations
  const { messages } = useLanguage();
  
  // Focus input on mount
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) {
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    
    try {
      // Create initial message
      const initialMessage: Message = {
        role: 'user',
        content: question
      };
      
      // Set initial conversation history
      const newHistory: Message[] = [...conversationHistory, initialMessage];
      setConversationHistory(newHistory);
      
      // Prepare request body
      const requestBody: Record<string, unknown> = {
        repositories: repositories,
        messages: newHistory,
        local_ollama: localOllama,
        use_openrouter: useOpenRouter,
        language: language
      };
      
      // Add OpenRouter model if using OpenRouter
      if (useOpenRouter) {
        requestBody.openrouter_model = openRouterModel;
      }
      
      // Make API call
      const response = await fetch(`${SERVER_BASE_URL}/multi_repo/chat/completions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Get response reader
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      // Read response stream
      let fullResponse = '';
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setResponse(fullResponse);
      }
      
      // Add assistant response to conversation history
      setConversationHistory([...newHistory, { role: 'assistant', content: fullResponse }]);
      
      // Clear input
      setQuestion('');
      
      // Set hasResponse to true after successful response
      setHasResponse(true);
      
    } catch (error) {
      console.error('Error during API call:', error);
      setResponse(prev => prev + '\n\nError: Failed to get a response. Please try again.');
      setHasResponse(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-full">
      <div className="rounded-lg overflow-hidden">
        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-0">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={messages?.multiRepo?.askPlaceholder || "Ask about these repositories..."}
              className="w-full p-3 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 text-white p-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowRight size={14} />
            </button>
          </div>
        </form>
        
        {/* Response area */}
        {(response || isLoading) && (
          <div 
            ref={responseRef}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto"
          >
            {isLoading && !response && (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {messages?.multiRepo?.thinking || "Thinking..."}
                </span>
              </div>
            )}
            
            {response && (
              <div className="prose dark:prose-invert max-w-none">
                <Markdown content={response} />
              </div>
            )}
          </div>
        )}
        
        {/* Conversation history */}
        {conversationHistory.length > 2 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {messages?.multiRepo?.conversationHistory || "Conversation History"}
            </h3>
            <div className="space-y-4">
              {conversationHistory.slice(0, -2).map((message, index) => (
                <div key={index} className={`p-3 rounded-md ${
                  message.role === 'user' 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30' 
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {message.role === 'user' ? (messages?.multiRepo?.you || "You") : (messages?.multiRepo?.assistant || "Assistant")}
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    {message.role === 'user' ? (
                      <p>{message.content}</p>
                    ) : (
                      <Markdown content={message.content} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiRepoChat;
