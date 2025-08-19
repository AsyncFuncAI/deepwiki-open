import { ProjectAnalysisResult } from './ProjectAnalyzer';
import { DeepWikiConfig } from '../config/ConfigManager';
import { VectorRetriever } from './VectorRetriever';
import { Document } from '../types';
import { DocumentProcessor } from './DocumentProcessor';
import { RAGProcessor } from './RAGProcessor';
import { ConversationTurn } from './LangChainModelManager';
/**
 * Wiki 数据接口
 */
export interface WikiData {
    projectName: string;
    overview: string;
    architecture: string;
    fileStructure: string;
    codeAnalysis: CodeAnalysisSection[];
    dependencies: string;
    setup: string;
    usage: string;
    generatedAt: Date;
}
/**
 * 代码分析章节接口
 */
export interface CodeAnalysisSection {
    title: string;
    content: string;
    files: string[];
    codeBlocks: CodeBlock[];
}
/**
 * 代码块接口
 */
export interface CodeBlock {
    language: string;
    code: string;
    description: string;
    filePath: string;
}
/**
 * Wiki 生成器
 * 负责基于项目分析结果生成 Wiki 文档
 */
export declare class WikiGenerator {
    private config;
    private vectorRetriever;
    private documentProcessor;
    private langChainManager;
    private ragProcessor;
    private projectPath;
    constructor(config: DeepWikiConfig);
    /**
     * 深度研究模式生成内容
     */
    generateDeepResearchContent(query: string, analysisResult: ProjectAnalysisResult, conversationHistory?: ConversationTurn[], iterationType?: 'first' | 'intermediate' | 'final', progressCallback?: (progress: number, message: string) => void): Promise<string>;
    /**
     * 获取与查询相关的文档
     */
    private getRelevantDocuments;
    /**
     * 生成 Wiki
     */
    generateWiki(analysisResult: ProjectAnalysisResult, progressCallback?: (progress: number, message: string) => void): Promise<WikiData>;
    /**
     * 保存向量化缓存
     */
    private saveVectorCache;
    /**
     * 加载向量化缓存
     */
    loadVectorCache(): Promise<boolean>;
    /**
     * 获取向量检索器实例
     */
    getVectorRetriever(): VectorRetriever;
    /**
     * 重建向量索引
     */
    rebuildVectorIndex(analysisResult: ProjectAnalysisResult): Promise<void>;
    /**
     * 生成项目概览
     */
    private generateOverview;
    /**
     * 生成架构说明
     */
    private generateArchitecture;
    /**
     * 获取架构模式描述
     */
    private getPatternDescription;
    /**
     * 生成数据流描述
     */
    private generateDataFlowDescription;
    /**
     * 生成文件结构
     */
    private generateFileStructure;
    /**
     * 生成文件树状图
     */
    private generateFileTree;
    /**
     * 渲染树结构
     */
    private renderTree;
    /**
     * 获取文件描述
     */
    private getFileDescription;
    /**
     * 渲染结构树
     */
    private renderStructureTree;
    /**
     * 生成代码分析
     */
    private generateCodeAnalysis;
    /**
     * 生成代码章节
     */
    private generateCodeSection;
    /**
     * 生成文件类型分析
     */
    private generateTypeAnalysis;
    /**
     * 获取类型特定分析
     */
    private getTypeSpecificAnalysis;
    /**
     * 分析 JavaScript/TypeScript 文件
     */
    private analyzeJSFiles;
    /**
     * 分析 Python 文件
     */
    private analyzePythonFiles;
    /**
     * 分析 CSS 文件
     */
    private analyzeCSSFiles;
    /**
     * 分析 JSON 文件
     */
    private analyzeJSONFiles;
    /**
     * 使用AI创建代码块（深度分析）
     */
    private createCodeBlockWithAI;
    /**
     * 创建代码块（基础版本，作为AI分析失败时的fallback）
     */
    private createCodeBlock;
    /**
     * 生成依赖说明
     */
    private generateDependencies;
    /**
     * 生成设置说明
     */
    private generateSetup;
    /**
     * 生成使用说明
     */
    private generateUsage;
    private formatFileSize;
    private analyzeArchitecturePatterns;
    private getMainDirectories;
    private getDirectoryDescription;
    private groupFilesByType;
    private getFileType;
    private selectImportantFiles;
    private isImportantFile;
    private getLanguageFromExtension;
    private detectProjectType;
    /**
     * 生成技术栈信息
     */
    private generateTechStack;
    /**
     * 调用 AI 生成内容
     */
    private generateAIContent;
    /**
     * 构建文件分析专用的AI提示词
     */
    private buildFileAnalysisPrompt;
    /**
     * 构建 AI 提示词
     */
    private buildAIPrompt;
    /**
     * 执行向量化 - 使用 DocumentProcessor 处理所有项目文档
     */
    private performVectorization;
    /**
     * 基于向量化文档进行智能问答
     */
    queryWithRAG(question: string, maxResults?: number, temperature?: number): Promise<{
        answer: string;
        sources: Array<{
            document: Document;
            similarity: number;
        }>;
        confidence: number;
    }>;
    /**
     * 获取相似文档
     */
    getSimilarDocuments(query: string, maxResults?: number, threshold?: number): Promise<Array<{
        document: Document;
        similarity: number;
    }>>;
    /**
     * 获取 DocumentProcessor 实例
     */
    getDocumentProcessor(): DocumentProcessor;
    /**
     * 获取 RAGProcessor 实例
     */
    getRAGProcessor(): RAGProcessor;
    /**
     * 更新配置
     */
    updateConfig(config: DeepWikiConfig): void;
    /**
     * 获取当前配置
     */
    getConfig(): DeepWikiConfig;
}
//# sourceMappingURL=WikiGenerator.d.ts.map