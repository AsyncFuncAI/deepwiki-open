import * as vscode from 'vscode';
/**
 * DeepWiki 配置接口
 */
export interface DeepWikiConfig {
    provider: 'openai' | 'google' | 'ollama' | 'azure' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot' | 'anthropic';
    model: string;
    apiKey: string;
    baseUrl?: string;
    workspaceId?: string;
    excludedDirs: string[];
    excludedFiles: string[];
    embedderConfig: EmbedderConfig;
}
/**
 * 向量模型配置接口
 */
export interface EmbedderConfig {
    provider: 'openai' | 'local' | 'google' | 'ollama' | 'azure' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    dimensions: number;
    batchSize: number;
    localConfig?: {
        algorithm: 'tfidf' | 'word2vec';
        maxFeatures: number;
        minDf: number;
        maxDf: number;
    };
}
/**
 * 配置管理器
 * 负责管理插件配置、验证设置和提供配置界面
 */
export declare class ConfigManager {
    private context;
    private configSection;
    constructor(context: vscode.ExtensionContext);
    /**
     * 获取当前配置
     */
    getConfiguration(): DeepWikiConfig;
    /**
     * 更新配置
     */
    updateConfiguration(key: string, value: any): Promise<void>;
    /**
     * 验证配置是否完整
     */
    validateConfiguration(): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * 测试 API 连接
     */
    testConnection(config?: DeepWikiConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 打开配置面板
     */
    openConfigurationPanel(): Promise<void>;
    /**
     * 从 webview 更新配置
     */
    private updateConfigFromWebview;
    /**
     * 生成配置 webview 的 HTML 内容
     */
    private getConfigurationWebviewContent;
    /**
     * 获取 webview HTML 内容
     */
    private getWebviewHtml;
    /**
     * 获取向量模型配置
     */
    getEmbedderConfig(): EmbedderConfig;
    /**
     * 更新向量模型配置
     */
    updateEmbedderConfig(embedderConfig: EmbedderConfig): Promise<void>;
    /**
     * 生成向量模型配置文件
     */
    generateEmbedderConfigFile(projectPath: string): Promise<void>;
}
//# sourceMappingURL=ConfigManager.d.ts.map