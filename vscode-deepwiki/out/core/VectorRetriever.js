"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedderFactory = exports.VectorRetriever = exports.VectorDatabase = exports.LocalEmbedder = exports.OpenAIEmbedder = exports.Embedder = void 0;
const fetch = require('node-fetch');
/**
 * 嵌入器抽象基类
 */
class Embedder {
    constructor(config) {
        this.config = config;
    }
    /**
     * 批量生成嵌入
     */
    async embedBatch(texts) {
        const embeddings = [];
        for (const text of texts) {
            const embedding = await this.embed(text);
            embeddings.push(embedding);
        }
        return embeddings;
    }
}
exports.Embedder = Embedder;
/**
 * OpenAI 嵌入器
 */
class OpenAIEmbedder extends Embedder {
    async embed(text) {
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
            const data = await response.json();
            return data.data[0].embedding;
        }
        catch (error) {
            console.error('OpenAI embedding failed:', error);
            throw error;
        }
    }
}
exports.OpenAIEmbedder = OpenAIEmbedder;
/**
 * 本地嵌入器（使用简单的 TF-IDF 向量化）
 */
class LocalEmbedder extends Embedder {
    constructor() {
        super(...arguments);
        this.vocabulary = new Map();
        this.idf = new Map();
        this.documentCount = 0;
        this.vectorDimension = 512; // 固定维度
    }
    /**
     * 训练词汇表和 IDF
     */
    train(documents) {
        this.documentCount = documents.length;
        const wordDocumentCount = new Map();
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
    async embed(text) {
        const words = this.tokenize(text);
        const wordCount = new Map();
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
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }
}
exports.LocalEmbedder = LocalEmbedder;
/**
 * 向量数据库
 */
class VectorDatabase {
    constructor(embedder) {
        this.embeddings = [];
        this.embedder = embedder;
    }
    /**
     * 添加文档到向量数据库
     */
    async addDocument(document) {
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
    async addDocuments(documents) {
        for (const doc of documents) {
            await this.addDocument(doc);
        }
    }
    /**
     * 搜索相似文档
     */
    async search(query, topK = 5) {
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
        const documents = topResults.map(result => ({
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
    cosineSimilarity(a, b) {
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
    getStats() {
        return {
            totalDocuments: this.embeddings.length,
            vectorDimension: this.embeddings.length > 0 ? this.embeddings[0].vector.length : 0
        };
    }
    /**
     * 清空数据库
     */
    clear() {
        this.embeddings = [];
    }
}
exports.VectorDatabase = VectorDatabase;
/**
 * 向量检索器
 */
class VectorRetriever {
    constructor(config) {
        this.isInitialized = false;
        // 根据配置选择嵌入器
        const provider = config.embedderConfig?.provider || 'local';
        if (provider === 'openai') {
            this.embedder = new OpenAIEmbedder(config);
        }
        else if (provider === 'google') {
            // TODO: 实现 Google 嵌入器
            this.embedder = new LocalEmbedder(config);
        }
        else {
            this.embedder = new LocalEmbedder(config);
        }
        this.vectorDb = new VectorDatabase(this.embedder);
    }
    /**
     * 初始化检索器
     */
    async initialize(documents) {
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
    async retrieve(query, topK = 5) {
        if (!this.isInitialized) {
            throw new Error('Vector retriever not initialized. Call initialize() first.');
        }
        return await this.vectorDb.search(query, topK);
    }
    /**
     * 添加新文档
     */
    async addDocument(document) {
        await this.vectorDb.addDocument(document);
    }
    /**
     * 批量添加文档
     */
    async addDocuments(documents) {
        await this.vectorDb.addDocuments(documents);
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.vectorDb.getStats(),
            isInitialized: this.isInitialized
        };
    }
    /**
     * 重置检索器
     */
    reset() {
        this.vectorDb.clear();
        this.isInitialized = false;
    }
}
exports.VectorRetriever = VectorRetriever;
/**
 * 嵌入器工厂
 */
class EmbedderFactory {
    static createEmbedder(config) {
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
exports.EmbedderFactory = EmbedderFactory;
//# sourceMappingURL=VectorRetriever.js.map