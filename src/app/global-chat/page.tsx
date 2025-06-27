'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaGlobe, FaComments, FaPlus, FaTrash, FaPaperPlane, FaSearch, FaChevronDown, FaChevronUp, FaHome } from 'react-icons/fa';
import Link from 'next/link';
import Markdown from '@/components/Markdown';
import { useLanguage } from '@/contexts/LanguageContext';
import { createChatWebSocket, closeWebSocket, ChatCompletionRequest } from '@/utils/websocketClient';

interface ProcessedProject {
  id: string;
  owner: string;
  repo: string;  
  name: string;
  repo_type: string;
  submittedAt: number;
  language: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  projects?: string[]; // 与此消息相关的项目
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export default function GlobalChatPage() {
  const { messages, language } = useLanguage();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<ProcessedProject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [githubToken, setGithubToken] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  // 获取当前会话
  const currentSession = chatSessions.find(s => s.id === currentSessionId);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 获取GitHub token
  useEffect(() => {
    const fetchGithubToken = async () => {
      try {
        // 首先尝试从localStorage获取
        const localToken = localStorage.getItem('github-token');
        if (localToken) {
          setGithubToken(localToken);
          return;
        }

        // 如果localStorage没有，尝试从API获取环境变量中的token
        const response = await fetch('/api/github/token');
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setGithubToken(data.token);
          }
        }
      } catch (error) {
        console.error('Failed to fetch GitHub token:', error);
      }
    };

    fetchGithubToken();
  }, []);

  // 获取已处理的项目
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/wiki/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, []);

  // 创建新会话
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `对话 ${chatSessions.length + 1}`,
      messages: [],
      timestamp: Date.now()
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = chatSessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  // 更新会话标题
  const updateSessionTitle = (sessionId: string, newTitle: string) => {
    setChatSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title: newTitle } : s
    ));
  };

  // 添加消息到当前会话
  const addMessageToCurrentSession = (message: ChatMessage) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: [...session.messages, message] }
        : session
    ));
  };

  // 处理消息发送
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // 如果没有当前会话，创建一个
    if (!currentSessionId) {
      createNewSession();
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
      projects: selectedProjects
    };

    addMessageToCurrentSession(userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 构建请求体
      const requestBody: ChatCompletionRequest = {
        repo_url: selectedProjects.length > 0 ? selectedProjects.join(',') : '',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的代码分析助手。用户正在查询以下项目的信息：${selectedProjects.join(', ')}。请基于这些项目的代码和文档来回答用户的问题。如果问题涉及多个项目之间的关系，请详细分析它们的交互和依赖关系。`
          },
          {
            role: 'user', 
            content: inputMessage
          }
        ],
        provider: '',  // 使用默认配置的provider
        model: '',     // 使用默认配置的model
        language: language,
        type: 'global_chat',
        token: githubToken // 添加GitHub token
      };

      // 使用WebSocket连接
      const serverBaseUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8001';
      const wsBaseUrl = serverBaseUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/ws/chat`;

      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      let assistantResponse = '';

      ws.onopen = () => {
        ws.send(JSON.stringify(requestBody));
      };

      ws.onmessage = (event) => {
        assistantResponse += event.data;
        // 实时更新助手消息
        setChatSessions(prev => prev.map(session => {
          if (session.id !== currentSessionId) return session;
          
          const messages = [...session.messages];
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = assistantResponse;
          } else {
            messages.push({
              role: 'assistant',
              content: assistantResponse,
              timestamp: Date.now(),
              projects: selectedProjects
            });
          }
          
          return { ...session, messages };
        }));
      };

      ws.onclose = () => {
        setIsLoading(false);
        scrollToBottom();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsLoading(false);
      };

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  // 键盘事件处理
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 过滤项目
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.repo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 初始化时创建第一个会话
  useEffect(() => {
    if (chatSessions.length === 0) {
      createNewSession();
    }
  }, [chatSessions.length]);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // 清理WebSocket连接
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        closeWebSocket(webSocketRef.current);
      }
    };
  }, []);

  const t = (key: string, defaultValue: string) => {
    return messages?.globalChat?.[key] || defaultValue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              <FaHome className="text-xl" />
              <span className="font-medium">首页</span>
            </Link>
            <div className="flex items-center space-x-2">
              <FaGlobe className="text-2xl text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('title', '全局对话')}
              </h1>
            </div>
          </div>
          
          <button
            onClick={createNewSession}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaPlus />
            <span>{t('newChat', '新对话')}</span>
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] max-w-7xl mx-auto">
        {/* 左侧会话列表 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* 会话列表 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('conversations', '对话记录')}
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    session.id === currentSessionId
                      ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {session.messages.length} 条消息
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 项目选择器 */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('selectProjects', '选择项目')}
              </h3>
              <button
                onClick={() => setShowProjectSelector(!showProjectSelector)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showProjectSelector ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>

            {showProjectSelector && (
              <div className="space-y-3">
                {/* 搜索框 */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchProjects', '搜索项目...')}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 项目列表 */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredProjects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects(prev => [...prev, project.name]);
                          } else {
                            setSelectedProjects(prev => prev.filter(p => p !== project.name));
                          }
                        }}
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {project.repo_type}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedProjects.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                      {t('selectedProjects', '已选择项目')}:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedProjects.map((project) => (
                        <span
                          key={project}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                        >
                          {project}
                          <button
                            onClick={() => setSelectedProjects(prev => prev.filter(p => p !== project))}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧聊天区 */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {/* 聊天消息 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentSession?.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Markdown content={message.content} />
                  ) : (
                    <div>
                      <p>{message.content}</p>
                      {message.projects && message.projects.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-500">
                          <p className="text-xs opacity-80">
                            {t('relatedProjects', '相关项目')}: {message.projects.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    <span className="text-gray-600 dark:text-gray-300">正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('inputPlaceholder', '输入消息...')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isLoading}
                />
                {selectedProjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedProjects.map((project) => (
                      <span
                        key={project}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {project}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 