import { DeepWikiConfig } from '../config/ConfigManager';
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
export declare abstract class AIModelClient {
    protected config: DeepWikiConfig;
    constructor(config: DeepWikiConfig);
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
export declare class OpenAIClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * DeepSeek 客户端
 */
export declare class DeepSeekClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * Qwen 客户端
 */
export declare class QwenClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * Google Gemini 客户端
 */
export declare class GoogleClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * Zhipu 客户端
 */
export declare class ZhipuClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * Moonshot 客户端
 */
export declare class MoonshotClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * Ollama 客户端
 */
export declare class OllamaClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * Azure OpenAI 客户端
 */
export declare class AzureClient extends AIModelClient {
    generateResponse(prompt: string): Promise<AIModelResponse>;
    validateConfig(): boolean;
}
/**
 * AI 模型客户端工厂
 */
export declare class AIModelClientFactory {
    static createClient(config: DeepWikiConfig): AIModelClient;
}
//# sourceMappingURL=AIModelClient.d.ts.map