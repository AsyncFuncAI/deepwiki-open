import { Document, RetrievalResult, AIConfig } from '../types';
import { DeepWikiConfig, EmbedderConfig } from '../config/ConfigManager';
const fetch = require('node-fetch');

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
export abstract class Embedder {
    protected config: DeepWikiConfig;

    constructor(config: DeepWikiConfig) {
        this.config = config;
    }

    /**
     * 生成文本嵌入
     */
    abstract embed(text: string): Promise<number[]>;

    /**
     * 批量生成嵌入
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        for (const text of texts) {
            const embedding = await this.embed(text);
            embeddings.push(embedding);
        }
        return embeddings;
    }
}

/**
 * OpenAI 嵌入器
 */
export class OpenAIEmbedder extends Embedder {
    async embed(text: string): Promise<number[]> {
        const apiKey = this.config.embedderConfig?.apiKey || this.config.apiKey;
        const model = this.config.embedderConfig?.model || 'text-embedding-ada-002';
        const baseUrl = this.config.embedderConfig?.baseUrl || this.config.baseUrl || 'https://api.openai.com/v1';

        try {
            const response = await fetch(`${baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    input: text
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI Embedding API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            return data.data[0].embedding;
        } catch (error) {
            console.error('OpenAI embedding failed:', error);
            throw error;
        }
    }
}

/**
 * 本地嵌入器（使用简单的 TF-IDF 向量化）
 */
export class LocalEmbedder extends Embedder {
    private vocabulary: Map<string, number> = new Map();
    private idf: Map<string, number> = new Map();
    private documentCount = 0;
    private vectorDimension = 512; // 固定维度

    /**
     * 训练词汇表和 IDF
     */
    train(documents: string[]): void {
        this.documentCount = documents.length;
        const wordDocumentCount = new Map<string, number>();

        // 构建词汇表
        documents.forEach(doc => {
            const words = this.tokenize(doc);
            const uniqueWords = new Set(words);
            
            uniqueWords.forEach(word => {
                if (!this.vocabulary.has(word)) {
                    this.vocabulary.set(word, this.vocabulary.size);
                }
                wordDocumentCount.set(word, (wordDocumentCount.get(word) || 0) + 1);
            });
        });

        // 计算 IDF
        for (const [word, docCount] of wordDocumentCount) {
            this.idf.set(word, Math.log(this.documentCount / docCount));
        }
    }

    async embed(text: string): Promise<number[]> {
        const words = this.tokenize(text);
        const wordCount = new Map<string, number>();
        
        // 计算词频
        words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });

        // 创建 TF-IDF 向量
        const vector = new Array(this.vectorDimension).fill(0);
        
        for (const [word, count] of wordCount) {
            const vocabIndex = this.vocabulary.get(word);
            if (vocabIndex !== undefined && vocabIndex < this.vectorDimension) {
                const tf = count / words.length;
                const idf = this.idf.get(word) || 0;
                vector[vocabIndex] = tf * idf;
            }
        }

        // 归一化向量
        const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (norm > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }

        return vector;
    }

    private tokenize(text: string): string[] {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }
}

/**
 * 向量数据库
 */
export class VectorDatabase {
    private embeddings: Embedding[] = [];
    private embedder: Embedder;

    constructor(embedder: Embedder) {
        this.embedder = embedder;
    }

    /**
     * 添加文档到向量数据库
     */
    async addDocument(document: Document): Promise<void> {
        const text = `${document.title}\n${document.content}`;
        const vector = await this.embedder.embed(text);
        
        this.embeddings.push({
            vector,
            text,
            metadata: {
                title: document.title,
                path: document.path,
                type: document.type
            }
        });
    }

    /**
     * 批量添加文档
     */
    async addDocuments(documents: Document[]): Promise<void> {
        for (const doc of documents) {
            await this.addDocument(doc);
        }
    }

    /**
     * 搜索相似文档
     */
    async search(query: string, topK: number = 5): Promise<RetrievalResult> {
        if (this.embeddings.length === 0) {
            return {
                documents: [],
                query,
                totalResults: 0
            };
        }

        const queryVector = await this.embedder.embed(query);
        
        // 计算余弦相似度
        const similarities = this.embeddings.map((embedding, index) => ({
            index,
            similarity: this.cosineSimilarity(queryVector, embedding.vector),
            embedding
        }));

        // 排序并取前 K 个
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topResults = similarities.slice(0, topK);

        const documents: Document[] = topResults.map(result => ({
            id: result.embedding.metadata.path,
            title: result.embedding.metadata.title || '',
            content: result.embedding.text || '',
            path: result.embedding.metadata.path,
            type: result.embedding.metadata.type,
            relevanceScore: result.similarity
        }));

        return {
            documents,
            query,
            totalResults: this.embeddings.length
        };
    }

    /**
     * 计算余弦相似度
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * 获取数据库统计信息
     */
    getStats(): { totalDocuments: number; vectorDimension: number } {
        return {
            totalDocuments: this.embeddings.length,
            vectorDimension: this.embeddings.length > 0 ? this.embeddings[0].vector.length : 0
        };
    }

    /**
     * 清空数据库
     */
    clear(): void {
        this.embeddings = [];
    }
}

/**
 * 向量检索器
 */
export class VectorRetriever {
    private vectorDb: VectorDatabase;
    private embedder: Embedder;
    private isInitialized = false;

    constructor(config: DeepWikiConfig) {
        // 根据配置选择嵌入器
        const provider = config.embedderConfig?.provider || 'local';
        
        if (provider === 'openai') {
            this.embedder = new OpenAIEmbedder(config);
        } else if (provider === 'google') {
            // TODO: 实现 Google 嵌入器
            this.embedder = new LocalEmbedder(config);
        } else {
            this.embedder = new LocalEmbedder(config);
        }
        
        this.vectorDb = new VectorDatabase(this.embedder);
    }

    /**
     * 初始化检索器
     */
    async initialize(documents: Document[]): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        console.log(`Initializing vector retriever with ${documents.length} documents...`);
        
        // 如果使用本地嵌入器，需要先训练
        if (this.embedder instanceof LocalEmbedder) {
            const texts = documents.map(doc => `${doc.title}\n${doc.content}`);
            this.embedder.train(texts);
        }

        // 添加文档到向量数据库
        await this.vectorDb.addDocuments(documents);
        
        this.isInitialized = true;
        console.log('Vector retriever initialized successfully');
    }

    /**
     * 检索相关文档
     */
    async retrieve(query: string, topK: number = 5): Promise<RetrievalResult> {
        if (!this.isInitialized) {
            throw new Error('Vector retriever not initialized. Call initialize() first.');
        }

        return await this.vectorDb.search(query, topK);
    }

    /**
     * 添加新文档
     */
    async addDocument(document: Document): Promise<void> {
        await this.vectorDb.addDocument(document);
    }

    /**
     * 批量添加文档
     */
    async addDocuments(documents: Document[]): Promise<void> {
        await this.vectorDb.addDocuments(documents);
    }

    /**
     * 获取统计信息
     */
    getStats(): { totalDocuments: number; vectorDimension: number; isInitialized: boolean } {
        return {
            ...this.vectorDb.getStats(),
            isInitialized: this.isInitialized
        };
    }

    /**
     * 重置检索器
     */
    reset(): void {
        this.vectorDb.clear();
        this.isInitialized = false;
    }
}

/**
 * 嵌入器工厂
 */
export class EmbedderFactory {
    static createEmbedder(config: DeepWikiConfig): Embedder {
        const provider = config.embedderConfig?.provider || 'local';
        
        switch (provider) {
            case 'openai':
                return new OpenAIEmbedder(config);
            case 'google':
                // TODO: 实现 Google 嵌入器
                return new LocalEmbedder(config);
            case 'local':
            default:
                return new LocalEmbedder(config);
        }
    }
}