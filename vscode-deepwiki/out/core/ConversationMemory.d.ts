import { ConversationMessage, ConversationSession } from '../types';
/**
 * 管理 RAG 对话的历史记录和上下文
 */
export declare class ConversationMemory {
    private sessions;
    private currentSessionId;
    private maxHistoryLength;
    private storageDir;
    constructor(workspaceRoot: string);
    /**
     * 确保存储目录存在
     */
    private ensureStorageDir;
    /**
     * 加载已保存的会话
     */
    private loadSessions;
    /**
     * 保存会话到磁盘
     */
    private saveSession;
    /**
     * 创建新的对话会话
     */
    createSession(title?: string): string;
    /**
     * 获取当前会话ID
     */
    getCurrentSessionId(): string | null;
    /**
     * 设置当前会话
     */
    setCurrentSession(sessionId: string): boolean;
    /**
     * 添加消息到当前会话
     */
    addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): void;
    /**
     * 获取当前会话的消息历史
     */
    getCurrentMessages(): ConversationMessage[];
    /**
     * 获取会话的上下文消息（用于 AI 模型）
     */
    getContextMessages(limit?: number): ConversationMessage[];
    /**
     * 获取所有会话列表
     */
    getAllSessions(): ConversationSession[];
    /**
     * 获取特定会话
     */
    getSession(sessionId: string): ConversationSession | undefined;
    /**
     * 删除会话
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * 清除所有会话
     */
    clearAllSessions(): Promise<void>;
    /**
     * 更新会话标题
     */
    updateSessionTitle(sessionId: string, title: string): boolean;
    /**
     * 获取会话统计信息
     */
    getStats(): {
        totalSessions: number;
        totalMessages: number;
        currentSessionMessages: number;
    };
    /**
     * 导出会话数据
     */
    exportSession(sessionId: string): ConversationSession | null;
    /**
     * 导入会话数据
     */
    importSession(sessionData: ConversationSession): Promise<boolean>;
    /**
     * 生成会话ID
     */
    private generateSessionId;
    /**
     * 生成消息ID
     */
    private generateMessageId;
    /**
     * 设置最大历史记录长度
     */
    setMaxHistoryLength(length: number): void;
    /**
     * 获取最大历史记录长度
     */
    getMaxHistoryLength(): number;
}
//# sourceMappingURL=ConversationMemory.d.ts.map