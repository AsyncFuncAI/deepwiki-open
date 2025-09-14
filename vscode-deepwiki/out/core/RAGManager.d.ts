import { DeepWikiConfig } from '../config/ConfigManager';
import { ConversationMemory } from './ConversationMemory';
import { RAGAnswer, ConversationMessage } from '../types';
/**
 * 用户查询接口
 */
export interface UserQuery {
    queryStr: string;
}
/**
 * 助手响应接口
 */
export interface AssistantResponse {
    responseStr: string;
}
/**
 * 对话轮次接口
 */
export interface DialogTurn {
    id: string;
    userQuery: UserQuery;
    assistantResponse: AssistantResponse;
}
/**
 * RAG 管理器主类
 */
export declare class RAGManager {
    private config;
    private memory;
    private documents;
    private retriever;
    private repoPath?;
    private isInitialized;
    constructor(config: DeepWikiConfig, workspaceRoot: string);
    /**
     * 准备检索器
     */
    prepareRetriever(repoPath: string): Promise<void>;
    /**
     * 加载文档
     */
    private loadDocuments;
    /**
     * 从项目分析结果中提取文档
     */
    private extractDocumentsFromAnalysis;
    /**
     * 执行 RAG 查询
     */
    query(userQuery: string): Promise<RAGAnswer>;
    /**
     * 构建上下文
     */
    private buildContext;
    /**
     * 生成回答
     */
    private generateAnswer;
    /**
     * 构建对话历史
     */
    private buildConversationHistory;
    /**
     * 调用 AI 模型
     */
    private callAIModel;
    /**
     * 获取对话历史
     */
    getConversationHistory(): ConversationMessage[];
    /**
     * 清除对话历史
     */
    clearConversationHistory(): void;
    /**
     * 创建新的对话会话
     */
    createNewSession(title?: string): string;
    /**
     * 获取会话管理器
     */
    getConversationMemory(): ConversationMemory;
    /**
     * 获取当前会话ID
     */
    getCurrentSessionId(): string | null;
    /**
     * 设置当前会话
     */
    setCurrentSession(sessionId: string): boolean;
    /**
     * 获取已加载的文档数量
     */
    getDocumentCount(): number;
    /**
     * 检查是否已准备就绪
     */
    isReady(): boolean;
    /**
     * 获取统计信息
     */
    getStats(): {
        documentsLoaded: number;
        isInitialized: boolean;
        retrieverStats?: any;
    };
    /**
     * 更新配置
     */
    updateConfig(config: DeepWikiConfig): void;
}
//# sourceMappingURL=RAGManager.d.ts.map