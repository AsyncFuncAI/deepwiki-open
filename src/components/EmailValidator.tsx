'use client';

import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaCheck } from 'react-icons/fa';

interface EmailValidatorProps {
  onValidated: (email: string) => void;
  messages?: Record<string, Record<string, string>>;
}

export default function EmailValidator({ onValidated, messages }: EmailValidatorProps) {
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  // Check if email is already validated in localStorage
  useEffect(() => {
    const validatedEmail = localStorage.getItem('deepwiki_validated_email');
    if (validatedEmail && validatedEmail.endsWith('@srp.one')) {
      onValidated(validatedEmail);
    }
  }, [onValidated]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@srp\.one$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    if (!validateEmail(email)) {
      setError('请输入以@srp.one结尾的有效邮箱地址');
      setIsValidating(false);
      return;
    }

    try {
      // Store validated email in localStorage
      localStorage.setItem('deepwiki_validated_email', email);
      onValidated(email);
    } catch (err) {
      setError('验证过程中出现错误，请重试');
    } finally {
      setIsValidating(false);  
    }
  };

  const t = (key: string, defaultValue: string) => {
    return messages?.auth?.[key] || defaultValue;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-white text-2xl" />  
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('title', '欢迎使用 DeepWiki')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('subtitle', '请输入您的@srp.one邮箱地址以继续')}
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('emailLabel', '邮箱地址')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-name@srp.one"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  autoComplete="email"
                  disabled={isValidating}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <FaEnvelope className="text-gray-400" />
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isValidating || !email}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{t('validating', '验证中...')}</span>
                </>
              ) : (
                <>
                  <FaCheck />
                  <span>{t('continue', '继续')}</span>
                </>
              )}
            </button>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{t('noteTitle', '注意：')}</strong> {t('noteText', '此功能仅限@srp.one域名用户使用。如果您没有@srp.one邮箱，请联系管理员。')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 