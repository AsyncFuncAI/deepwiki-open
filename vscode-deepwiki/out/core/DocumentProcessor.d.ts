import { Document } from '../types';
/**
 * 文档处理配置接口
 */
export interface DocumentProcessorConfig {
    excludePatterns?: string[];
    includePatterns?: string[];
    maxFileSize?: number;
    maxTokens?: number;
    chunkSize?: number;
    chunkOverlap?: number;
}
/**
 * 文件信息接口
 */
export interface ProcessedFileInfo {
    path: string;
    relativePath: string;
    content: string;
    size: number;
    extension: string;
    language: string;
    tokenCount: number;
    isCode: boolean;
    isDocument: boolean;
}
/**
 * 文档块接口
 */
export interface DocumentChunk {
    id: string;
    content: string;
    metadata: {
        filePath: string;
        chunkIndex: number;
        totalChunks: number;
        startLine?: number;
        endLine?: number;
        language?: string;
        fileType: string;
    };
}
/**
 * 文档处理器 - 实现类似 DeepWiki 的文档处理逻辑
 */
export declare class DocumentProcessor {
    private config;
    private deepWikiConfig?;
    private projectPath;
    private readonly CODE_EXTENSIONS;
    private readonly DOCUMENT_EXTENSIONS;
    private readonly CONFIG_EXTENSIONS;
    private readonly DEFAULT_EXCLUDED_DIRS;
    private readonly DEFAULT_EXCLUDED_FILES;
    private stats;
    constructor(config?: DocumentProcessorConfig);
    /**
     * 递归读取所有文档 - 类似 DeepWiki 的 read_all_documents
     */
    readAllDocuments(progressCallback?: (progress: number, message: string) => void): Promise<ProcessedFileInfo[]>;
    /**
     * 扫描目录获取所有文件
     */
    private scanDirectory;
    /**
     * 过滤文件
     */
    private filterFiles;
    /**
     * 检查是否应该排除目录
     */
    private shouldExcludeDirectory;
    /**
     * 检查是否应该排除文件
     */
    private shouldExcludeFile;
    /**
     * 模式匹配（支持通配符）
     */
    private matchPattern;
    /**
     * 检查是否是支持的文件类型
     */
    private isSupportedFileType;
    /**
     * 处理单个文件
     */
    private processFile;
    /**
     * 根据文件扩展名获取语言
     */
    private getLanguageFromExtension;
    /**
     * 将文件分块 - 类似 DeepWiki 的文档分块逻辑
     */
    chunkDocuments(files: ProcessedFileInfo[], progressCallback?: (progress: number, message: string) => void): Promise<DocumentChunk[]>;
    /**
     * 对单个文件进行分块
     */
    private chunkFile;
    /**
     * 按行分块代码文件
     */
    private chunkCodeFile;
    /**
     * 按段落分块文档文件
     */
    private chunkDocumentFile;
    /**
     * 按字符分块
     */
    private chunkByCharacters;
    /**
     * 将文档块转换为 Document 对象
     */
    convertChunksToDocuments(chunks: DocumentChunk[]): Document[];
    /**
     * 获取处理统计信息
     */
    getProcessingStats(files: ProcessedFileInfo[], chunks: DocumentChunk[]): {
        totalFiles: number;
        codeFiles: number;
        documentFiles: number;
        configFiles: number;
        totalSize: number;
        totalTokens: number;
        totalChunks: number;
        languageStats: Record<string, number>;
        averageChunksPerFile: number;
    };
    /**
     * 处理目录 - 主要入口方法
     */
    processDirectory(directoryPath: string, progressCallback?: (current: number, total: number, fileName: string) => void): Promise<Document[]>;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalFiles: number;
        processedFiles: number;
        totalSize: number;
        totalTokens: number;
        errors: number;
    };
}
//# sourceMappingURL=DocumentProcessor.d.ts.map