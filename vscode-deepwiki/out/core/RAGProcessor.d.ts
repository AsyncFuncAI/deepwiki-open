import { VectorRetriever } from './VectorRetriever';
import { Document } from '../types';
import { DeepWikiConfig } from '../config/ConfigManager';
/**
 * RAG 查询接口
 */
export interface RAGQuery {
    question: string;
    context?: string;
    maxResults?: number;
    similarityThreshold?: number;
    includeMetadata?: boolean;
    temperature?: number;
}
/**
 * RAG 检索结果接口
 */
export interface RAGResult {
    answer: string;
    sources: RetrievedDocument[];
    confidence: number;
    processingTime: number;
    metadata: {
        model: string;
        temperature: number;
        maxTokens: number;
        retrievedChunks: number;
        totalTokensUsed?: number;
    };
}
/**
 * 检索到的文档接口
 */
export interface RetrievedDocument {
    id: string;
    content: string;
    similarity: number;
    metadata: {
        filePath: string;
        chunkIndex?: number;
        totalChunks?: number;
        startLine?: number;
        endLine?: number;
        language?: string;
        fileType: string;
    };
}
/**
 * AI 提供商接口
 */
export interface AIProvider {
    generateResponse(prompt: string, context: string[], config: any): Promise<string>;
    countTokens(text: string): number;
}
/**
 * OpenAI 提供商实现
 */
export declare class OpenAIProvider implements AIProvider {
    private apiKey;
    private model;
    private baseURL?;
    constructor(apiKey: string, model?: string, baseURL?: string);
    generateResponse(prompt: string, context: string[], config: any): Promise<string>;
    countTokens(text: string): number;
}
/**
 * Anthropic Claude 提供商实现
 */
export declare class AnthropicProvider implements AIProvider {
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateResponse(prompt: string, context: string[], config: any): Promise<string>;
    countTokens(text: string): number;
}
/**
 * Qwen (Dashscope) 提供商实现
 */
export declare class QwenProvider implements AIProvider {
    private apiKey;
    private model;
    private baseURL;
    private workspaceId?;
    constructor(apiKey: string, model?: string, baseURL?: string, workspaceId?: string);
    generateResponse(prompt: string, context: string[], config: any): Promise<string>;
    countTokens(text: string): number;
}
/**
 * 本地 AI 提供商（占位符）
 */
export declare class LocalAIProvider implements AIProvider {
    private endpoint;
    private model;
    constructor(endpoint: string, model?: string);
    generateResponse(prompt: string, context: string[], config: any): Promise<string>;
    countTokens(text: string): number;
}
/**
 * RAG 处理器 - 实现类似 DeepWiki 的 RAG 检索和 AI 生成逻辑
 */
export declare class RAGProcessor {
    private vectorRetriever;
    private aiProvider;
    private config;
    private documents;
    constructor(vectorRetriever: VectorRetriever, config: DeepWikiConfig);
    /**
     * 创建 AI 提供商
     */
    private createAIProvider;
    /**
     * 初始化 RAG 处理器，添加文档到向量数据库
     */
    initialize(documents: Document[], progressCallback?: (progress: number, message: string) => void): Promise<void>;
    /**
     * 执行 RAG 查询
     */
    query(query: RAGQuery, progressCallback?: (progress: number, message: string) => void): Promise<RAGResult>;
    /**
     * 检索相关文档
     */
    private retrieveRelevantDocuments;
    /**
     * 准备上下文
     */
    private prepareContext;
    /**
     * 生成 AI 回答
     */
    private generateAnswer;
    /**
     * 计算置信度
     */
    private calculateConfidence;
    /**
     * 添加新文档到向量数据库
     */
    addDocument(document: Document): Promise<void>;
    /**
     * 批量添加文档
     */
    addDocuments(documents: Document[], progressCallback?: (progress: number, message: string) => void): Promise<void>;
    /**
     * 重置 RAG 处理器
     */
    reset(): Promise<void>;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalDocuments: number;
        aiProvider: "openai" | "google" | "ollama" | "azure" | "deepseek" | "qwen" | "zhipu" | "moonshot" | "anthropic";
        aiModel: string;
        vectorDimension: number;
        isInitialized: boolean;
    };
    /**
     * 更新 AI 配置
     */
    updateAIConfig(config: DeepWikiConfig): void;
    /**
     * 测试 AI 连接
     */
    testAIConnection(): Promise<boolean>;
    /**
     * 获取相似文档（不生成 AI 回答）
     */
    getSimilarDocuments(query: string, maxResults?: number, threshold?: number): Promise<Array<{
        document: Document;
        similarity: number;
    }>>;
    /**
     * 解释检索结果
     */
    explainRetrieval(query: string, results: RetrievedDocument[]): string;
}
//# sourceMappingURL=RAGProcessor.d.ts.map