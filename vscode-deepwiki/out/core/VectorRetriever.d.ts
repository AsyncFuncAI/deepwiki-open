import { Document, RetrievalResult } from '../types';
import { DeepWikiConfig } from '../config/ConfigManager';
/**
 * 向量嵌入接口
 */
export interface Embedding {
    vector: number[];
    text: string;
    metadata?: any;
}
/**
 * 嵌入器抽象基类
 */
export declare abstract class Embedder {
    protected config: DeepWikiConfig;
    constructor(config: DeepWikiConfig);
    /**
     * 生成文本嵌入
     */
    abstract embed(text: string): Promise<number[]>;
    /**
     * 批量生成嵌入
     */
    embedBatch(texts: string[]): Promise<number[][]>;
}
/**
 * OpenAI 嵌入器
 */
export declare class OpenAIEmbedder extends Embedder {
    embed(text: string): Promise<number[]>;
}
/**
 * 本地嵌入器（使用简单的 TF-IDF 向量化）
 */
export declare class LocalEmbedder extends Embedder {
    private vocabulary;
    private idf;
    private documentCount;
    private vectorDimension;
    /**
     * 训练词汇表和 IDF
     */
    train(documents: string[]): void;
    embed(text: string): Promise<number[]>;
    private tokenize;
}
/**
 * 向量数据库
 */
export declare class VectorDatabase {
    private embeddings;
    private embedder;
    constructor(embedder: Embedder);
    /**
     * 添加文档到向量数据库
     */
    addDocument(document: Document): Promise<void>;
    /**
     * 批量添加文档
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * 搜索相似文档
     */
    search(query: string, topK?: number): Promise<RetrievalResult>;
    /**
     * 计算余弦相似度
     */
    private cosineSimilarity;
    /**
     * 获取数据库统计信息
     */
    getStats(): {
        totalDocuments: number;
        vectorDimension: number;
    };
    /**
     * 清空数据库
     */
    clear(): void;
}
/**
 * 向量检索器
 */
export declare class VectorRetriever {
    private vectorDb;
    private embedder;
    private isInitialized;
    constructor(config: DeepWikiConfig);
    /**
     * 初始化检索器
     */
    initialize(documents: Document[]): Promise<void>;
    /**
     * 检索相关文档
     */
    retrieve(query: string, topK?: number): Promise<RetrievalResult>;
    /**
     * 添加新文档
     */
    addDocument(document: Document): Promise<void>;
    /**
     * 批量添加文档
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalDocuments: number;
        vectorDimension: number;
        isInitialized: boolean;
    };
    /**
     * 重置检索器
     */
    reset(): void;
}
/**
 * 嵌入器工厂
 */
export declare class EmbedderFactory {
    static createEmbedder(config: DeepWikiConfig): Embedder;
}
//# sourceMappingURL=VectorRetriever.d.ts.map