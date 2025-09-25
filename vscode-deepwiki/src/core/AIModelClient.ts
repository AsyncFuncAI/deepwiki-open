import { DeepWikiConfig } from '../config/ConfigManager';
import { AIConfig, ChatMessage } from '../types';
import fetch from 'node-fetch';

/**
 * AI 模型响应接口
 */
export interface AIModelResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * AI 模型客户端抽象基类
 */
export abstract class AIModelClient {
    protected config: DeepWikiConfig;

    constructor(config: DeepWikiConfig) {
        this.config = config;
    }

    /**
     * 生成文本回复
     */
    abstract generateResponse(prompt: string): Promise<AIModelResponse>;

    /**
     * 验证配置
     */
    abstract validateConfig(): boolean;
}

/**
 * OpenAI 客户端
 */
export class OpenAIClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'gpt-4';
        const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            console.error('OpenAI API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiKey.startsWith('sk-'));
    }
}

/**
 * DeepSeek 客户端
 */
export class DeepSeekClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'deepseek-chat';
        const baseUrl = this.config.baseUrl || 'https://api.deepseek.com/v1';

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            console.error('DeepSeek API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiKey.length > 0);
    }
}

/**
 * Qwen 客户端
 */
export class QwenClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'qwen-turbo';
        const baseUrl = this.config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1';

        try {
            const response = await fetch(`${baseUrl}/services/aigc/text-generation/generation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ]
                    },
                    parameters: {
                        temperature: 0.7,
                        max_tokens: 2000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.output?.choices?.[0]?.message?.content || '',
                usage: {
                    promptTokens: data.usage?.input_tokens || 0,
                    completionTokens: data.usage?.output_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            console.error('Qwen API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiKey.length > 0);
    }
}

/**
 * Google Gemini 客户端
 */
export class GoogleClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'gemini-pro';
        const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';

        try {
            const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Google API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
                usage: {
                    promptTokens: data.usageMetadata?.promptTokenCount || 0,
                    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                    totalTokens: data.usageMetadata?.totalTokenCount || 0
                }
            };
        } catch (error) {
            console.error('Google API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiKey.length > 0);
    }
}

/**
 * Zhipu 客户端
 */
export class ZhipuClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'glm-4';
        const baseUrl = this.config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4';

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`Zhipu API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            console.error('Zhipu API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiKey.length > 0);
    }
}

/**
 * Moonshot 客户端
 */
export class MoonshotClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'moonshot-v1-8k';
        const baseUrl = this.config.baseUrl || 'https://api.moonshot.cn/v1';

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`Moonshot API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            console.error('Moonshot API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiKey.length > 0);
    }
}

/**
 * Ollama 客户端
 */
export class OllamaClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const model = this.config.model || 'llama2';
        const baseUrl = this.config.baseUrl || 'http://localhost:11434';

        try {
            const response = await fetch(`${baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.response || '',
                usage: {
                    promptTokens: 0, // Ollama doesn't provide token usage
                    completionTokens: 0,
                    totalTokens: 0
                }
            };
        } catch (error) {
            console.error('Ollama API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.baseUrl && this.config.model);
    }
}

/**
 * Azure OpenAI 客户端
 */
export class AzureClient extends AIModelClient {
    async generateResponse(prompt: string): Promise<AIModelResponse> {
        const apiKey = this.config.apiKey;
        const model = this.config.model || 'gpt-4';
        const baseUrl = this.config.baseUrl;

        if (!baseUrl) {
            throw new Error('Azure base URL is required');
        }

        try {
            const response = await fetch(`${baseUrl}/openai/deployments/${model}/chat/completions?api-version=2023-12-01-preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`Azure API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            console.error('Azure API call failed:', error);
            throw error;
        }
    }

    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.baseUrl);
    }
}

/**
 * AI 模型客户端工厂
 */
export class AIModelClientFactory {
    static createClient(config: DeepWikiConfig): AIModelClient {
        switch (config.provider) {
            case 'openai':
                return new OpenAIClient(config);
            case 'deepseek':
                return new DeepSeekClient(config);
            case 'qwen':
                return new QwenClient(config);
            case 'google':
                return new GoogleClient(config);
            case 'zhipu':
                return new ZhipuClient(config);
            case 'moonshot':
                return new MoonshotClient(config);
            case 'ollama':
                return new OllamaClient(config);
            case 'azure':
                return new AzureClient(config);
            default:
                throw new Error(`Unsupported AI provider: ${config.provider}`);
        }
    }
}