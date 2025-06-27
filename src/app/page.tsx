'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [repositoryInput, setRepositoryInput] = useState('https://github.com/AsyncFuncAI/deepwiki-open');
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repositoryInput.trim()) {
      setError('请输入仓库URL');
      return;
    }

    // 简单的URL解析
    const match = repositoryInput.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      setError('请输入有效的GitHub URL');
      return;
    }

    const [, owner, repo] = match;
    router.push(`/${owner}/${repo.replace('.git', '')}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
            🎉 DeepWiki - 所有功能已部署成功！
          </h1>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link 
              href="/global-chat"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              💬 全局对话
            </Link>
            <Link 
              href="/organization-repos"
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              📁 组织仓库
            </Link>
            <Link 
              href="/wiki/projects"
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              📊 Wiki项目
            </Link>
          </div>

          {/* Wiki Generation Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub 仓库 URL:
              </label>
              <input
                type="text"
                value={repositoryInput}
                onChange={(e) => setRepositoryInput(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🚀 生成 Wiki
            </button>
          </form>
        </div>

        {/* Feature Status */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">✅ 功能状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>邮箱验证系统</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>全局对话功能</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>组织仓库管理</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>默认深度搜索</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>多轮对话支持</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>持久化存储</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">🎯 使用说明:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 输入GitHub仓库URL生成Wiki</li>
              <li>• 点击"全局对话"进行跨项目智能问答</li>
              <li>• 点击"组织仓库"管理和批量生成Wiki</li>
              <li>• 所有数据支持持久化存储</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}