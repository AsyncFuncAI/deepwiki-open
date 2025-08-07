"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGProcessor = exports.LocalAIProvider = exports.QwenProvider = exports.AnthropicProvider = exports.OpenAIProvider = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * OpenAI 提供商实现
 */
class OpenAIProvider {
    constructor(apiKey, model = 'gpt-3.5-turbo', baseURL) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseURL = baseURL;
    }
    async generateResponse(prompt, context, config) {
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful assistant that answers questions based on the provided context. Always cite specific files and code sections when relevant.'
            },
            {
                role: 'user',
                content: `Context:\n${context.join('\n\n---\n\n')}\n\nQuestion: ${prompt}`
            }
        ];
        const requestBody = {
            model: this.model,
            messages,
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2000,
            stream: false
        };
        const url = this.baseURL ? `${this.baseURL}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
        const response = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated.';
    }
    countTokens(text) {
        // 简单的 token 估算：1 token ≈ 4 字符
        return Math.ceil(text.length / 4);
    }
}
exports.OpenAIProvider = OpenAIProvider;
/**
 * Anthropic Claude 提供商实现
 */
class AnthropicProvider {
    constructor(apiKey, model = 'claude-3-sonnet-20240229') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateResponse(prompt, context, config) {
        const systemPrompt = 'You are a helpful assistant that answers questions based on the provided context. Always cite specific files and code sections when relevant.';
        const userPrompt = `Context:\n${context.join('\n\n---\n\n')}\n\nQuestion: ${prompt}`;
        const requestBody = {
            model: this.model,
            max_tokens: config.maxTokens || 2000,
            temperature: config.temperature || 0.7,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        };
        const response = await (0, node_fetch_1.default)('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        return data.content[0]?.text || 'No response generated.';
    }
    countTokens(text) {
        // 简单的 token 估算：1 token ≈ 4 字符
        return Math.ceil(text.length / 4);
    }
}
exports.AnthropicProvider = AnthropicProvider;
/**
 * Qwen (Dashscope) 提供商实现
 */
class QwenProvider {
    constructor(apiKey, model = 'qwen-turbo', baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1', workspaceId) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseURL = baseURL;
        this.workspaceId = workspaceId;
    }
    async generateResponse(prompt, context, config) {
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful assistant that answers questions based on the provided context. Always cite specific files and code sections when relevant.'
            },
            {
                role: 'user',
                content: `Context:\n${context.join('\n\n---\n\n')}\n\nQuestion: ${prompt}`
            }
        ];
        const requestBody = {
            model: this.model,
            messages,
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2000,
            stream: false,
            enable_thinking: false
        };
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
        // 添加工作空间 ID 到请求头（如果提供）
        if (this.workspaceId) {
            headers['X-DashScope-WorkSpace'] = this.workspaceId;
        }
        const response = await (0, node_fetch_1.default)(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated.';
    }
    countTokens(text) {
        // 简单的 token 估算：1 token ≈ 4 字符
        return Math.ceil(text.length / 4);
    }
}
exports.QwenProvider = QwenProvider;
/**
 * 本地 AI 提供商（占位符）
 */
class LocalAIProvider {
    constructor(endpoint, model = 'local-model') {
        this.endpoint = endpoint;
        this.model = model;
    }
    async generateResponse(prompt, context, config) {
        // 这里可以实现对本地 AI 服务的调用
        // 例如 Ollama、LocalAI 等
        const requestBody = {
            model: this.model,
            prompt: `Context:\n${context.join('\n\n---\n\n')}\n\nQuestion: ${prompt}`,
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2000
        };
        const response = await (0, node_fetch_1.default)(`${this.endpoint}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`Local AI API error: ${response.status}`);
        }
        const data = await response.json();
        return data.response || 'No response generated.';
    }
    countTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
exports.LocalAIProvider = LocalAIProvider;
/**
 * RAG 处理器 - 实现类似 DeepWiki 的 RAG 检索和 AI 生成逻辑
 */
class RAGProcessor {
    constructor(vectorRetriever, config) {
        this.documents = [];
        console.log('RAGProcessor constructor called with config:', {
            provider: config.provider,
            hasApiKey: !!config.apiKey,
            model: config.model,
            baseUrl: config.baseUrl,
            workspaceId: config.workspaceId
        });
        this.vectorRetriever = vectorRetriever;
        this.config = config;
        console.log('Creating AI provider for:', config.provider);
        this.aiProvider = this.createAIProvider();
        console.log('RAGProcessor constructor completed successfully');
    }
    /**
     * 创建 AI 提供商
     */
    createAIProvider() {
        console.log('createAIProvider called with provider:', this.config.provider);
        console.log('Available providers: openai, anthropic, qwen, ollama');
        switch (this.config.provider) {
            case 'openai':
                console.log('Creating OpenAI provider');
                return new OpenAIProvider(this.config.apiKey, this.config.model, this.config.baseUrl);
            case 'anthropic':
                console.log('Creating Anthropic provider');
                return new AnthropicProvider(this.config.apiKey, this.config.model);
            case 'qwen':
                console.log('Creating Qwen provider with config:', {
                    apiKey: this.config.apiKey ? 'present' : 'missing',
                    model: this.config.model,
                    baseUrl: this.config.baseUrl,
                    workspaceId: this.config.workspaceId
                });
                return new QwenProvider(this.config.apiKey, this.config.model, this.config.baseUrl, this.config.workspaceId);
            case 'ollama':
                console.log('Creating Ollama provider');
                return new LocalAIProvider(this.config.baseUrl || 'http://localhost:11434', this.config.model);
            default:
                console.error('Unsupported AI provider:', this.config.provider);
                console.error('Config object:', this.config);
                throw new Error(`Unsupported AI provider: ${this.config.provider}`);
        }
    }
    /**
     * 初始化 RAG 处理器，添加文档到向量数据库
     */
    async initialize(documents, progressCallback) {
        this.documents = documents;
        progressCallback?.(0, 'Initializing vector retriever...');
        // 初始化向量检索器
        await this.vectorRetriever.initialize(documents);
        progressCallback?.(20, 'Adding documents to vector database...');
        // 批量添加文档
        const batchSize = 10;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const progress = 20 + ((i / documents.length) * 60);
            progressCallback?.(progress, `Processing documents ${i + 1}-${Math.min(i + batchSize, documents.length)}...`);
            for (const doc of batch) {
                await this.vectorRetriever.addDocument(doc);
            }
        }
        progressCallback?.(80, 'Finalizing vector database...');
        // 获取统计信息
        const stats = this.vectorRetriever.getStats();
        progressCallback?.(100, `Initialized with ${stats.totalDocuments} documents`);
    }
    /**
     * 执行 RAG 查询
     */
    async query(query, progressCallback) {
        const startTime = Date.now();
        progressCallback?.(0, 'Starting RAG query...');
        // 1. 向量检索相关文档
        progressCallback?.(20, 'Retrieving relevant documents...');
        const retrievedDocs = await this.retrieveRelevantDocuments(query);
        if (retrievedDocs.length === 0) {
            return {
                answer: 'I could not find any relevant information in the codebase to answer your question.',
                sources: [],
                confidence: 0,
                processingTime: Date.now() - startTime,
                metadata: {
                    model: this.config.model,
                    temperature: 0.7,
                    maxTokens: 2000,
                    retrievedChunks: 0
                }
            };
        }
        progressCallback?.(60, 'Generating AI response...');
        // 2. 准备上下文
        const context = this.prepareContext(retrievedDocs, query);
        // 3. 生成 AI 回答
        const answer = await this.generateAnswer(query.question, context);
        progressCallback?.(90, 'Finalizing response...');
        // 4. 计算置信度
        const confidence = this.calculateConfidence(retrievedDocs, query);
        const processingTime = Date.now() - startTime;
        progressCallback?.(100, `Query completed in ${processingTime}ms`);
        return {
            answer,
            sources: retrievedDocs,
            confidence,
            processingTime,
            metadata: {
                model: this.config.model,
                temperature: 0.7,
                maxTokens: 2000,
                retrievedChunks: retrievedDocs.length,
                totalTokensUsed: this.aiProvider.countTokens(context.join(' ') + query.question + answer)
            }
        };
    }
    /**
     * 检索相关文档
     */
    async retrieveRelevantDocuments(query) {
        const maxResults = query.maxResults || 5;
        const threshold = query.similarityThreshold || 0.3;
        // 使用向量检索器搜索相关文档
        const results = await this.vectorRetriever.retrieve(query.question, maxResults);
        // 过滤低相似度的结果 - RetrievalResult.documents 是 Document 数组
        const filteredResults = results.documents.filter((doc) => (doc.relevanceScore || 0) >= threshold);
        // 转换为 RetrievedDocument 格式
        return filteredResults.map((doc) => ({
            id: doc.id,
            content: doc.content,
            similarity: doc.relevanceScore || 0,
            metadata: {
                filePath: doc.path || '',
                language: doc.metadata?.language,
                fileType: doc.type || 'unknown',
                chunkIndex: doc.metadata?.chunkIndex,
                totalChunks: doc.metadata?.totalChunks,
                startLine: doc.metadata?.startLine,
                endLine: doc.metadata?.endLine
            }
        }));
    }
    /**
     * 准备上下文
     */
    prepareContext(retrievedDocs, query) {
        const context = [];
        // 按相似度排序
        const sortedDocs = retrievedDocs.sort((a, b) => b.similarity - a.similarity);
        for (const doc of sortedDocs) {
            let contextItem = `File: ${doc.metadata.filePath}`;
            if (doc.metadata.startLine && doc.metadata.endLine) {
                contextItem += ` (Lines ${doc.metadata.startLine}-${doc.metadata.endLine})`;
            }
            if (doc.metadata.language) {
                contextItem += ` [${doc.metadata.language}]`;
            }
            contextItem += `\nSimilarity: ${(doc.similarity * 100).toFixed(1)}%`;
            contextItem += `\nContent:\n${doc.content}`;
            context.push(contextItem);
        }
        // 如果提供了额外的上下文，添加到开头
        if (query.context) {
            context.unshift(`Additional Context:\n${query.context}`);
        }
        return context;
    }
    /**
     * 生成 AI 回答
     */
    async generateAnswer(question, context) {
        const aiConfig = {
            temperature: 0.7,
            maxTokens: 2000
        };
        try {
            return await this.aiProvider.generateResponse(question, context, aiConfig);
        }
        catch (error) {
            console.error('AI generation error:', error);
            return `I encountered an error while generating the response: ${error instanceof Error ? error.message : 'Unknown error'}. However, I found the following relevant information:\n\n${context.slice(0, 2).join('\n\n---\n\n')}`;
        }
    }
    /**
     * 计算置信度
     */
    calculateConfidence(retrievedDocs, query) {
        if (retrievedDocs.length === 0) {
            return 0;
        }
        // 基于最高相似度和检索到的文档数量计算置信度
        const maxSimilarity = Math.max(...retrievedDocs.map(doc => doc.similarity));
        const docCountFactor = Math.min(retrievedDocs.length / 3, 1); // 3个或更多文档给予满分
        return Math.min(maxSimilarity * docCountFactor, 1);
    }
    /**
     * 添加新文档到向量数据库
     */
    async addDocument(document) {
        await this.vectorRetriever.addDocument(document);
        this.documents.push(document);
    }
    /**
     * 批量添加文档
     */
    async addDocuments(documents, progressCallback) {
        const batchSize = 10;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const progress = (i / documents.length) * 100;
            progressCallback?.(progress, `Adding documents ${i + 1}-${Math.min(i + batchSize, documents.length)}...`);
            for (const doc of batch) {
                await this.addDocument(doc);
            }
        }
        progressCallback?.(100, `Added ${documents.length} documents successfully`);
    }
    /**
     * 重置 RAG 处理器
     */
    async reset() {
        await this.vectorRetriever.reset();
        this.documents = [];
    }
    /**
     * 获取统计信息
     */
    getStats() {
        const vectorStats = this.vectorRetriever.getStats();
        return {
            ...vectorStats,
            totalDocuments: this.documents.length,
            aiProvider: this.config.provider,
            aiModel: this.config.model
        };
    }
    /**
     * 更新 AI 配置
     */
    updateAIConfig(config) {
        this.config = config;
        this.aiProvider = this.createAIProvider();
    }
    /**
     * 测试 AI 连接
     */
    async testAIConnection() {
        try {
            const testResponse = await this.aiProvider.generateResponse('Hello, please respond with "Connection successful"', [], { temperature: 0, maxTokens: 50 });
            return testResponse.toLowerCase().includes('connection successful') || testResponse.length > 0;
        }
        catch (error) {
            console.error('AI connection test failed:', error);
            return false;
        }
    }
    /**
     * 获取相似文档（不生成 AI 回答）
     */
    async getSimilarDocuments(query, maxResults = 10, threshold = 0.3) {
        const retrievedDocs = await this.retrieveRelevantDocuments({
            question: query,
            maxResults,
            similarityThreshold: threshold
        });
        // 转换为期望的格式
        return retrievedDocs.map(doc => ({
            document: {
                id: doc.id,
                title: doc.metadata.filePath,
                content: doc.content,
                path: doc.metadata.filePath,
                type: doc.metadata.fileType,
                metadata: doc.metadata
            },
            similarity: doc.similarity
        }));
    }
    /**
     * 解释检索结果
     */
    explainRetrieval(query, results) {
        if (results.length === 0) {
            return `No relevant documents found for query: "${query}"`;
        }
        let explanation = `Found ${results.length} relevant documents for query: "${query}"\n\n`;
        results.forEach((doc, index) => {
            explanation += `${index + 1}. ${doc.metadata.filePath} (${(doc.similarity * 100).toFixed(1)}% similarity)\n`;
            if (doc.metadata.startLine && doc.metadata.endLine) {
                explanation += `   Lines ${doc.metadata.startLine}-${doc.metadata.endLine}\n`;
            }
            explanation += `   Preview: ${doc.content.substring(0, 100)}...\n\n`;
        });
        return explanation;
    }
}
exports.RAGProcessor = RAGProcessor;
//# sourceMappingURL=RAGProcessor.js.map