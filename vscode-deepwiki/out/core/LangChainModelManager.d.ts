import { DeepWikiConfig } from '../config/ConfigManager';
/**
 * 对话历史接口
 */
export interface ConversationTurn {
    userQuery: string;
    assistantResponse: string;
}
/**
 * 深度研究配置接口
 */
export interface DeepResearchConfig {
    isDeepResearch: boolean;
    researchIteration: number;
    repositoryType: string;
    repositoryUrl: string;
    repositoryName: string;
    language: string;
    iterationType: 'first' | 'intermediate' | 'final';
}
/**
 * LangChain 模型管理器
 * 负责统一管理不同的 LLM 提供商，参考 DeepWiki Open 的实现方式
 */
export declare class LangChainModelManager {
    private config;
    private model;
    constructor(config: DeepWikiConfig);
    /**
     * 初始化模型
     */
    private initializeModel;
    /**
     * 检查模型是否已初始化
     */
    private ensureModelInitialized;
    /**
     * 生成 AI 内容 - 基础版本
     */
    generateContent(prompt: string, context?: string): Promise<string>;
    /**
     * 深度研究模式生成内容 - 参考 DeepWiki Open 的实现
     */
    generateDeepResearchContent(query: string, config: DeepResearchConfig, conversationHistory?: ConversationTurn[], contextText?: string, fileContent?: string, documents?: any[], repositoryInfo?: any): Promise<string>;
    /**
     * 构建基础系统提示词
     */
    private buildBasicSystemPrompt;
    /**
     * 构建深度研究系统提示词 - 参考 DeepWiki Open 的实现
     */
    private buildDeepResearchSystemPrompt;
    /**
     * 构建简单分析提示词
     */
    private buildSimpleAnalysisPrompt;
    /**
     * 构建首次迭代提示词
     */
    private buildFirstIterationPrompt;
    /**
     * 构建中间迭代提示词
     */
    private buildIntermediateIterationPrompt;
    /**
     * 构建最终迭代提示词
     */
    private buildFinalIterationPrompt;
    /**
     * 构建基础提示词
     */
    private buildPrompt;
    /**
     * 构建上下文信息
     */
    buildContextFromDocuments(documents: any[], repositoryInfo?: any): string;
    /**
     * 按文件路径分组文档
     */
    private groupDocumentsByPath;
    /**
     * 构建对话历史上下文
     */
    buildConversationContext(conversationHistory: ConversationTurn[]): string;
    /**
     * 构建深度研究提示词 - 参考 DeepWiki Open 的实现
     */
    private buildDeepResearchPrompt;
    /**
     * 验证配置
     */
    private validateConfig;
    /**
     * 获取默认 Base URL
     */
    private getDefaultBaseUrl;
    /**
     * 获取默认模型
     */
    private getDefaultModel;
    /**
     * 更新配置
     */
    updateConfig(config: DeepWikiConfig): void;
    /**
     * 获取当前模型信息
     */
    getModelInfo(): {
        provider: string;
        model: string;
    };
}
//# sourceMappingURL=LangChainModelManager.d.ts.map