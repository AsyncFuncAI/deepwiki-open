'use client';

import React, { useState, useEffect } from 'react';
import { FaGithub, FaPlus, FaEye, FaStar, FaCodeBranch, FaCalendarAlt, FaExternalLinkAlt, FaHome, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  clone_url: string;
  ssh_url: string;
  owner: {
    login: string;
    type: string;
  };
}

interface GitHubOrg {
  login: string;
  id: number;
  description: string | null;
  public_repos: number;
}

export default function OrganizationReposPage() {
  const router = useRouter();
  const { messages } = useLanguage();
  const [githubToken, setGithubToken] = useState('');
  const [organization, setOrganization] = useState('');
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [generatingWikis, setGeneratingWikis] = useState<Set<string>>(new Set());

  // 从环境变量预填充GitHub Token
  useEffect(() => {
    // 尝试从localStorage获取token
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setGithubToken(savedToken);
      fetchUserOrganizations(savedToken);
    } else {
      // 检查是否有预配置的token（在生产环境中通过环境变量）
      fetch('/api/github/token')
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            setGithubToken(data.token);
            fetchUserOrganizations(data.token);
          }
        })
        .catch(err => console.log('No pre-configured GitHub token found'));
    }
  }, []);

  // 获取用户所属的组织
  const fetchUserOrganizations = async (token: string) => {
    if (!token) return;
    
    setOrgLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.github.com/user/orgs', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data: GitHubOrg[] = await response.json();
      setOrgs(data);
      
      // 如果只有一个组织，自动选择
      if (data.length === 1) {
        setOrganization(data[0].login);
        fetchRepositories(token, data[0].login);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取组织失败');
    } finally {
      setOrgLoading(false);
    }
  };

  // 获取组织的仓库
  const fetchRepositories = async (token: string, org: string) => {
    if (!token || !org) return;

    setLoading(true);
    setError('');

    try {
      // 先获取第一页看看总数
      let allRepos: GitHubRepo[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await fetch(`https://api.github.com/orgs/${org}/repos?page=${page}&per_page=${perPage}&sort=updated`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data: GitHubRepo[] = await response.json();
        if (data.length === 0) break;

        allRepos.push(...data);
        page++;

        // 防止无限循环，最多获取1000个仓库
        if (allRepos.length >= 1000) break;
      }

      setRepos(allRepos);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取仓库失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存Token
  const handleSaveToken = () => {
    if (githubToken) {
      localStorage.setItem('github_token', githubToken);
      fetchUserOrganizations(githubToken);
    }
  };

  // 选择组织
  const handleOrgSelect = (orgLogin: string) => {
    setOrganization(orgLogin);
    fetchRepositories(githubToken, orgLogin);
  };

  // 过滤仓库
  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.language?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 生成单个Wiki
  const generateWikiForRepo = async (repo: GitHubRepo) => {
    setGeneratingWikis(prev => new Set([...prev, repo.full_name]));

    try {
      // 构建参数
      const params = new URLSearchParams({
        type: 'github',
        token: githubToken,
        provider: 'google',
        model: 'gemini-1.5-pro',
        language: 'zh',
        comprehensive: 'true'
      });

      // 导航到wiki生成页面
      router.push(`/${repo.owner.login}/${repo.name}?${params.toString()}`);
    } catch (error) {
      console.error('Error generating wiki:', error);
      setGeneratingWikis(prev => {
        const newSet = new Set(prev);
        newSet.delete(repo.full_name);
        return newSet;
      });
    }
  };

  // 批量生成Wiki
  const generateSelectedWikis = async () => {
    if (selectedRepos.length === 0) return;

    for (const repoFullName of selectedRepos) {
      const repo = repos.find(r => r.full_name === repoFullName);
      if (repo) {
        await generateWikiForRepo(repo);
        // 添加延迟避免同时发起太多请求
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    setSelectedRepos([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const t = (key: string, defaultValue: string) => {
    return messages?.orgRepos?.[key] || defaultValue;
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
              <FaGithub className="text-2xl text-gray-900 dark:text-white" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('title', '组织仓库管理')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* GitHub Token 配置区 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('tokenConfig', 'GitHub Token 配置')}
          </h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder={t('tokenPlaceholder', '输入您的 GitHub Personal Access Token')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveToken}
              disabled={!githubToken || orgLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {orgLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>{t('loading', '加载中...')}</span>
                </>
              ) : (
                <span>{t('saveToken', '保存并获取组织')}</span>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('tokenNote', '需要具有读取组织和仓库权限的 Personal Access Token')}
          </p>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* 组织选择 */}
        {orgs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('selectOrganization', '选择组织')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  onClick={() => handleOrgSelect(org.login)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    organization === org.login
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">{org.login}</h3>
                  {org.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{org.description}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {org.public_repos} 个公开仓库
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 仓库列表 */}
        {organization && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organization} {t('repositories', '的仓库')} ({filteredRepos.length})
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 sm:flex-none">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('searchRepos', '搜索仓库...')}
                      className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {selectedRepos.length > 0 && (
                    <button
                      onClick={generateSelectedWikis}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <FaPlus />
                      <span>{t('generateSelected', '生成选中的Wiki')} ({selectedRepos.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">{t('loadingRepos', '加载仓库中...')}</span>
                </div>
              ) : filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedRepos.includes(repo.full_name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRepos(prev => [...prev, repo.full_name]);
                                } else {
                                  setSelectedRepos(prev => prev.filter(r => r !== repo.full_name));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                              {repo.name}
                            </h3>
                            {repo.private && (
                              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                                Private
                              </span>
                            )}
                          </div>
                          
                          {repo.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {repo.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {repo.language && (
                              <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center">
                              <FaStar className="mr-1" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center">
                              <FaCodeBranch className="mr-1" />
                              {repo.forks_count}
                            </span>
                            <span className="flex items-center">
                              <FaCalendarAlt className="mr-1" />
                              {formatDate(repo.updated_at)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
                            >
                              <FaExternalLinkAlt className="mr-1" />
                              {t('viewOnGitHub', '在GitHub查看')}
                            </a>
                          </div>
                        </div>

                        <button
                          onClick={() => generateWikiForRepo(repo)}
                          disabled={generatingWikis.has(repo.full_name)}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ml-4"
                        >
                          {generatingWikis.has(repo.full_name) ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              <span>{t('generating', '生成中...')}</span>
                            </>
                          ) : (
                            <>
                              <FaPlus />
                              <span>{t('generateWiki', '生成Wiki')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaGithub className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? t('noSearchResults', '没有匹配的仓库') : t('noRepos', '没有找到仓库')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 