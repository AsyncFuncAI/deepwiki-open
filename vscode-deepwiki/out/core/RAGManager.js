"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGManager = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const AIModelClient_1 = require("./AIModelClient");
const VectorRetriever_1 = require("./VectorRetriever");
const ConversationMemory_1 = require("./ConversationMemory");
// Types moved to ../types/index.ts
/**
 * RAG 管理器主类
 */
class RAGManager {
    constructor(config, workspaceRoot) {
        this.documents = [];
        this.isInitialized = false;
        this.config = config;
        this.memory = new ConversationMemory_1.ConversationMemory(workspaceRoot);
        this.retriever = new VectorRetriever_1.VectorRetriever(config);
    }
    /**
     * 准备检索器
     */
    async prepareRetriever(repoPath) {
        this.repoPath = repoPath;
        try {
            // 加载文档
            await this.loadDocuments(repoPath);
            // 初始化向量检索器
            console.log('Preparing vector retriever...');
            await this.retriever.initialize(this.documents);
            this.isInitialized = true;
            console.log(`RAG准备完成，加载了 ${this.documents.length} 个文档`);
        }
        catch (error) {
            console.error('准备检索器时出错:', error);
            throw error;
        }
    }
    /**
     * 加载文档
     */
    async loadDocuments(repoPath) {
        const deepwikiPath = path.join(repoPath, '.deepwiki');
        // 检查 .deepwiki 目录是否存在
        if (!fs.existsSync(deepwikiPath)) {
            throw new Error('未找到 .deepwiki 目录，请先生成 Wiki');
        }
        // 读取项目分析结果
        const analysisPath = path.join(deepwikiPath, 'project_analysis.json');
        if (!fs.existsSync(analysisPath)) {
            throw new Error('未找到项目分析文件，请先生成 Wiki');
        }
        try {
            const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
            // 从分析结果中提取文档
            this.documents = this.extractDocumentsFromAnalysis(analysisData);
            console.log(`从项目分析中提取了 ${this.documents.length} 个文档`);
        }
        catch (error) {
            console.error('加载文档时出错:', error);
            throw error;
        }
    }
    /**
     * 从项目分析结果中提取文档
     */
    extractDocumentsFromAnalysis(analysisData) {
        const documents = [];
        // 处理文件信息
        if (analysisData.files && Array.isArray(analysisData.files)) {
            for (const file of analysisData.files) {
                if (file.content && file.path) {
                    documents.push({
                        id: file.path,
                        title: path.basename(file.path),
                        content: file.content,
                        path: file.path,
                        type: file.type || 'unknown',
                        metadata: {
                            filePath: file.path,
                            fileType: file.type || 'unknown',
                            size: file.size || 0
                        }
                    });
                }
            }
        }
        // 处理目录结构信息
        if (analysisData.structure) {
            documents.push({
                id: 'project-structure',
                title: '项目结构',
                content: `项目结构:\n${JSON.stringify(analysisData.structure, null, 2)}`,
                path: 'project-structure.json',
                type: 'structure',
                metadata: {
                    filePath: 'project_structure',
                    fileType: 'structure'
                }
            });
        }
        // 处理统计信息
        if (analysisData.statistics) {
            documents.push({
                id: 'project-statistics',
                title: '项目统计',
                content: `项目统计:\n${JSON.stringify(analysisData.statistics, null, 2)}`,
                path: 'project-statistics.json',
                type: 'statistics',
                metadata: {
                    filePath: 'project_statistics',
                    fileType: 'statistics'
                }
            });
        }
        return documents;
    }
    /**
     * 执行 RAG 查询
     */
    async query(userQuery) {
        if (!this.isInitialized) {
            throw new Error('检索器未初始化，请先调用 prepareRetriever');
        }
        try {
            // 使用向量检索器进行检索
            const retrievalResult = await this.retriever.retrieve(userQuery, 5);
            // 构建上下文
            const context = this.buildContext(retrievalResult.documents);
            // 添加用户消息到对话历史
            this.memory.addMessage({
                role: 'user',
                content: userQuery
            });
            // 生成回答
            const answer = await this.generateAnswer(userQuery, context, retrievalResult.documents);
            // 添加助手回答到对话历史
            this.memory.addMessage({
                role: 'assistant',
                content: answer.answer,
                sources: retrievalResult.documents
            });
            return answer;
        }
        catch (error) {
            console.error('RAG查询时出错:', error);
            return {
                rationale: '查询过程中发生错误',
                answer: '抱歉，我在处理您的问题时遇到了错误。请重试或重新表述您的问题。'
            };
        }
    }
    /**
     * 构建上下文
     */
    buildContext(documents) {
        if (documents.length === 0) {
            return '没有找到相关的文档内容。';
        }
        let context = '相关文档内容:\n\n';
        documents.forEach((doc, index) => {
            context += `## 文件: ${doc.metadata?.filePath || doc.path}\n\n`;
            context += `${doc.content}\n\n`;
            context += '---\n\n';
        });
        return context;
    }
    /**
     * 生成回答
     */
    async generateAnswer(query, context, sources) {
        // 构建系统提示
        const systemPrompt = `你是一个代码助手，专门回答关于 GitHub 仓库的问题。
你将收到用户查询、相关上下文和过去的对话历史。

语言检测和响应:
- 检测用户查询的语言
- 用与用户查询相同的语言回答
- 重要：如果提示中要求特定语言，优先使用该语言而不是查询语言

使用 MARKDOWN 格式化你的回答:
- 对所有格式使用正确的 markdown 语法
- 对于代码块，使用三重反引号和语言规范（\`\`\`python, \`\`\`javascript 等）
- 使用 ## 标题作为主要部分
- 在适当的地方使用项目符号或编号列表
- 在呈现结构化数据时使用 markdown 表格语法格式化表格
- 使用 **粗体** 和 *斜体* 来强调
- 引用文件路径时，使用 \`内联代码\` 格式

重要的格式规则:
1. 不要在答案的开头或结尾包含 \`\`\`markdown 围栏
2. 直接从内容开始你的回答
3. 内容将已经呈现为 markdown，所以只需提供原始 markdown 内容

逐步思考，确保你的答案结构良好且视觉上有组织。`;
        // 构建对话历史
        const conversationHistory = this.buildConversationHistory();
        // 构建完整的提示
        const fullPrompt = `${systemPrompt}\n\n${conversationHistory}\n\n上下文信息:\n${context}\n\n用户问题: ${query}\n\n请基于上述上下文信息回答用户的问题。`;
        try {
            // 调用 AI 模型生成回答
            const response = await this.callAIModel(fullPrompt);
            return {
                rationale: '基于项目文档和代码分析生成回答',
                answer: response,
                sources: sources,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error('生成回答时出错:', error);
            return {
                rationale: '生成回答时发生错误',
                answer: '抱歉，我无法生成回答。请检查您的 AI 配置并重试。'
            };
        }
    }
    /**
     * 构建对话历史
     */
    buildConversationHistory() {
        const messages = this.memory.getContextMessages(10);
        if (messages.length === 0) {
            return '';
        }
        let history = '对话历史:\n';
        messages.forEach((message, index) => {
            const role = message.role === 'user' ? '用户' : '助手';
            history += `${role}: ${message.content}\n\n`;
        });
        return history;
    }
    /**
     * 调用 AI 模型
     */
    async callAIModel(prompt) {
        try {
            const aiClient = AIModelClient_1.AIModelClientFactory.createClient(this.config);
            const response = await aiClient.generateResponse(prompt);
            return response.content;
        }
        catch (error) {
            console.error('AI model call failed:', error);
            // 返回错误信息作为回答
            return `抱歉，AI 模型调用失败: ${error instanceof Error ? error.message : '未知错误'}。请检查您的配置和网络连接。`;
        }
    }
    /**
     * 获取对话历史
     */
    getConversationHistory() {
        return this.memory.getCurrentMessages();
    }
    /**
     * 清除对话历史
     */
    clearConversationHistory() {
        this.memory.clearAllSessions();
    }
    /**
     * 创建新的对话会话
     */
    createNewSession(title) {
        return this.memory.createSession(title);
    }
    /**
     * 获取会话管理器
     */
    getConversationMemory() {
        return this.memory;
    }
    /**
     * 获取当前会话ID
     */
    getCurrentSessionId() {
        return this.memory.getCurrentSessionId();
    }
    /**
     * 设置当前会话
     */
    setCurrentSession(sessionId) {
        return this.memory.setCurrentSession(sessionId);
    }
    /**
     * 获取已加载的文档数量
     */
    getDocumentCount() {
        return this.documents.length;
    }
    /**
     * 检查是否已准备就绪
     */
    isReady() {
        return this.isInitialized && this.documents.length > 0;
    }
    /**
     * 获取统计信息
     */
    getStats() {
        const stats = {
            documentsLoaded: this.documents.length,
            isInitialized: this.isInitialized
        };
        if (this.isInitialized) {
            return {
                ...stats,
                retrieverStats: this.retriever.getStats()
            };
        }
        return stats;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        console.log('RAGManager updateConfig called with provider:', config.provider);
        this.config = config;
        // 重新初始化向量检索器
        this.retriever = new VectorRetriever_1.VectorRetriever(config);
        console.log('RAGManager VectorRetriever updated');
        // 如果已经初始化过，需要重新加载文档
        if (this.isInitialized && this.repoPath) {
            console.log('RAGManager re-initializing with new config...');
            // 异步重新初始化，不阻塞当前操作
            this.prepareRetriever(this.repoPath).catch((error) => {
                console.error('Failed to re-initialize RAGManager with new config:', error);
            });
        }
    }
}
exports.RAGManager = RAGManager;
//# sourceMappingURL=RAGManager.js.map