import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ConversationMessage, ConversationSession } from '../types';

/**
 * 管理 RAG 对话的历史记录和上下文
 */
export class ConversationMemory {
    private sessions: Map<string, ConversationSession> = new Map();
    private currentSessionId: string | null = null;
    private maxHistoryLength: number = 50;
    private storageDir: string;

    constructor(workspaceRoot: string) {
        this.storageDir = path.join(workspaceRoot, '.deepwiki', 'conversations');
        this.ensureStorageDir();
        this.loadSessions();
    }

    /**
     * 确保存储目录存在
     */
    private async ensureStorageDir(): Promise<void> {
        try {
            await fs.ensureDir(this.storageDir);
        } catch (error) {
            console.error('Failed to create conversation storage directory:', error);
        }
    }

    /**
     * 加载已保存的会话
     */
    private async loadSessions(): Promise<void> {
        try {
            // 检查存储目录是否存在
            const exists = await fs.pathExists(this.storageDir);
            if (!exists) {
                console.log('Conversation storage directory does not exist, skipping session loading');
                return;
            }

            const files = await fs.readdir(this.storageDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sessionPath = path.join(this.storageDir, file);
                    const sessionData = await fs.readJson(sessionPath);
                    this.sessions.set(sessionData.id, sessionData);
                }
            }
        } catch (error) {
            console.error('Failed to load conversation sessions:', error);
        }
    }

    /**
     * 保存会话到磁盘
     */
    private async saveSession(session: ConversationSession): Promise<void> {
        try {
            const sessionPath = path.join(this.storageDir, `${session.id}.json`);
            await fs.writeJson(sessionPath, session, { spaces: 2 });
        } catch (error) {
            console.error('Failed to save conversation session:', error);
        }
    }

    /**
     * 创建新的对话会话
     */
    public createSession(title?: string): string {
        const sessionId = this.generateSessionId();
        const session: ConversationSession = {
            id: sessionId,
            title: title || `对话 ${new Date().toLocaleString()}`,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {}
        };

        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;
        this.saveSession(session);

        return sessionId;
    }

    /**
     * 获取当前会话ID
     */
    public getCurrentSessionId(): string | null {
        return this.currentSessionId;
    }

    /**
     * 设置当前会话
     */
    public setCurrentSession(sessionId: string): boolean {
        if (this.sessions.has(sessionId)) {
            this.currentSessionId = sessionId;
            return true;
        }
        return false;
    }

    /**
     * 添加消息到当前会话
     */
    public addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): void {
        if (!this.currentSessionId) {
            this.createSession();
        }

        const session = this.sessions.get(this.currentSessionId!);
        if (!session) {
            return;
        }

        const fullMessage: ConversationMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: new Date()
        };

        session.messages.push(fullMessage);
        session.updatedAt = new Date();

        // 限制历史记录长度
        if (session.messages.length > this.maxHistoryLength) {
            session.messages = session.messages.slice(-this.maxHistoryLength);
        }

        this.saveSession(session);
    }

    /**
     * 获取当前会话的消息历史
     */
    public getCurrentMessages(): ConversationMessage[] {
        if (!this.currentSessionId) {
            return [];
        }

        const session = this.sessions.get(this.currentSessionId);
        return session ? session.messages : [];
    }

    /**
     * 获取会话的上下文消息（用于 AI 模型）
     */
    public getContextMessages(limit: number = 10): ConversationMessage[] {
        const messages = this.getCurrentMessages();
        return messages.slice(-limit);
    }

    /**
     * 获取所有会话列表
     */
    public getAllSessions(): ConversationSession[] {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    /**
     * 获取特定会话
     */
    public getSession(sessionId: string): ConversationSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * 删除会话
     */
    public async deleteSession(sessionId: string): Promise<boolean> {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return false;
            }

            // 从内存中删除
            this.sessions.delete(sessionId);

            // 从磁盘删除
            const sessionPath = path.join(this.storageDir, `${sessionId}.json`);
            await fs.remove(sessionPath);

            // 如果删除的是当前会话，清除当前会话ID
            if (this.currentSessionId === sessionId) {
                this.currentSessionId = null;
            }

            return true;
        } catch (error) {
            console.error('Failed to delete conversation session:', error);
            return false;
        }
    }

    /**
     * 清除所有会话
     */
    public async clearAllSessions(): Promise<void> {
        try {
            // 清除内存中的会话
            this.sessions.clear();
            this.currentSessionId = null;

            // 清除磁盘上的会话文件
            await fs.emptyDir(this.storageDir);
        } catch (error) {
            console.error('Failed to clear all conversation sessions:', error);
        }
    }

    /**
     * 更新会话标题
     */
    public updateSessionTitle(sessionId: string, title: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        session.title = title;
        session.updatedAt = new Date();
        this.saveSession(session);
        return true;
    }

    /**
     * 获取会话统计信息
     */
    public getStats(): {
        totalSessions: number;
        totalMessages: number;
        currentSessionMessages: number;
    } {
        const totalSessions = this.sessions.size;
        const totalMessages = Array.from(this.sessions.values())
            .reduce((sum, session) => sum + session.messages.length, 0);
        const currentSessionMessages = this.getCurrentMessages().length;

        return {
            totalSessions,
            totalMessages,
            currentSessionMessages
        };
    }

    /**
     * 导出会话数据
     */
    public exportSession(sessionId: string): ConversationSession | null {
        const session = this.sessions.get(sessionId);
        return session ? JSON.parse(JSON.stringify(session)) : null;
    }

    /**
     * 导入会话数据
     */
    public async importSession(sessionData: ConversationSession): Promise<boolean> {
        try {
            // 确保会话ID唯一
            if (this.sessions.has(sessionData.id)) {
                sessionData.id = this.generateSessionId();
            }

            this.sessions.set(sessionData.id, sessionData);
            await this.saveSession(sessionData);
            return true;
        } catch (error) {
            console.error('Failed to import conversation session:', error);
            return false;
        }
    }

    /**
     * 生成会话ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成消息ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 设置最大历史记录长度
     */
    public setMaxHistoryLength(length: number): void {
        this.maxHistoryLength = Math.max(1, length);
    }

    /**
     * 获取最大历史记录长度
     */
    public getMaxHistoryLength(): number {
        return this.maxHistoryLength;
    }
}