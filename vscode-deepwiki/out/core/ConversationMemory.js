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
exports.ConversationMemory = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * 管理 RAG 对话的历史记录和上下文
 */
class ConversationMemory {
    constructor(workspaceRoot) {
        this.sessions = new Map();
        this.currentSessionId = null;
        this.maxHistoryLength = 50;
        this.storageDir = path.join(workspaceRoot, '.deepwiki', 'conversations');
        this.ensureStorageDir();
        this.loadSessions();
    }
    /**
     * 确保存储目录存在
     */
    async ensureStorageDir() {
        try {
            await fs.ensureDir(this.storageDir);
        }
        catch (error) {
            console.error('Failed to create conversation storage directory:', error);
        }
    }
    /**
     * 加载已保存的会话
     */
    async loadSessions() {
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
        }
        catch (error) {
            console.error('Failed to load conversation sessions:', error);
        }
    }
    /**
     * 保存会话到磁盘
     */
    async saveSession(session) {
        try {
            const sessionPath = path.join(this.storageDir, `${session.id}.json`);
            await fs.writeJson(sessionPath, session, { spaces: 2 });
        }
        catch (error) {
            console.error('Failed to save conversation session:', error);
        }
    }
    /**
     * 创建新的对话会话
     */
    createSession(title) {
        const sessionId = this.generateSessionId();
        const session = {
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
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    /**
     * 设置当前会话
     */
    setCurrentSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            this.currentSessionId = sessionId;
            return true;
        }
        return false;
    }
    /**
     * 添加消息到当前会话
     */
    addMessage(message) {
        if (!this.currentSessionId) {
            this.createSession();
        }
        const session = this.sessions.get(this.currentSessionId);
        if (!session) {
            return;
        }
        const fullMessage = {
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
    getCurrentMessages() {
        if (!this.currentSessionId) {
            return [];
        }
        const session = this.sessions.get(this.currentSessionId);
        return session ? session.messages : [];
    }
    /**
     * 获取会话的上下文消息（用于 AI 模型）
     */
    getContextMessages(limit = 10) {
        const messages = this.getCurrentMessages();
        return messages.slice(-limit);
    }
    /**
     * 获取所有会话列表
     */
    getAllSessions() {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    /**
     * 获取特定会话
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * 删除会话
     */
    async deleteSession(sessionId) {
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
        }
        catch (error) {
            console.error('Failed to delete conversation session:', error);
            return false;
        }
    }
    /**
     * 清除所有会话
     */
    async clearAllSessions() {
        try {
            // 清除内存中的会话
            this.sessions.clear();
            this.currentSessionId = null;
            // 清除磁盘上的会话文件
            await fs.emptyDir(this.storageDir);
        }
        catch (error) {
            console.error('Failed to clear all conversation sessions:', error);
        }
    }
    /**
     * 更新会话标题
     */
    updateSessionTitle(sessionId, title) {
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
    getStats() {
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
    exportSession(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? JSON.parse(JSON.stringify(session)) : null;
    }
    /**
     * 导入会话数据
     */
    async importSession(sessionData) {
        try {
            // 确保会话ID唯一
            if (this.sessions.has(sessionData.id)) {
                sessionData.id = this.generateSessionId();
            }
            this.sessions.set(sessionData.id, sessionData);
            await this.saveSession(sessionData);
            return true;
        }
        catch (error) {
            console.error('Failed to import conversation session:', error);
            return false;
        }
    }
    /**
     * 生成会话ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 生成消息ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 设置最大历史记录长度
     */
    setMaxHistoryLength(length) {
        this.maxHistoryLength = Math.max(1, length);
    }
    /**
     * 获取最大历史记录长度
     */
    getMaxHistoryLength() {
        return this.maxHistoryLength;
    }
}
exports.ConversationMemory = ConversationMemory;
//# sourceMappingURL=ConversationMemory.js.map