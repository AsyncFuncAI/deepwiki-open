/**
 * 文件类型枚举
 */
export declare enum FileType {
    CODE = "code",
    DOCUMENTATION = "documentation",
    CONFIG = "config",
    DATA = "data",
    ASSET = "asset",
    TEST = "test",
    BUILD = "build"
}
/**
 * 文件信息接口 - 参考 deepwiki open 的 Document 结构
 */
export interface FileInfo {
    id: string;
    path: string;
    relativePath: string;
    content: string;
    size: number;
    extension: string;
    fileType: FileType;
    language?: string;
    tokenCount: number;
    lastModified: Date;
    metadata: {
        isMainFile: boolean;
        importance: number;
        dependencies: string[];
        exports: string[];
        imports: string[];
    };
}
/**
 * 项目分析结果接口 - 增强版本
 */
export interface ProjectAnalysisResult {
    projectPath: string;
    projectName: string;
    projectType: string;
    files: FileInfo[];
    codeFiles: FileInfo[];
    documentFiles: FileInfo[];
    configFiles: FileInfo[];
    totalFiles: number;
    totalSize: number;
    totalTokens: number;
    languages: LanguageStats[];
    structure: ProjectStructure;
    architecture: ProjectArchitecture;
    dependencies: DependencyInfo;
    entryPoints: string[];
    mainDirectories: string[];
}
/**
 * 语言统计信息
 */
export interface LanguageStats {
    language: string;
    extension: string;
    fileCount: number;
    totalSize: number;
    totalTokens: number;
    percentage: number;
}
/**
 * 项目架构信息
 */
export interface ProjectArchitecture {
    type: 'monorepo' | 'single' | 'microservice';
    framework?: string;
    buildTool?: string;
    packageManager?: string;
    layers: ArchitectureLayer[];
    patterns: string[];
}
/**
 * 架构层级
 */
export interface ArchitectureLayer {
    name: string;
    type: 'presentation' | 'business' | 'data' | 'infrastructure';
    directories: string[];
    files: string[];
    description: string;
}
/**
 * 依赖信息
 */
export interface DependencyInfo {
    packageJson?: any;
    requirements?: string[];
    dependencies: string[];
    devDependencies: string[];
    peerDependencies: string[];
    internalDependencies: Map<string, string[]>;
}
/**
 * 项目结构接口 - 增强版本
 */
export interface ProjectStructure {
    name: string;
    type: 'file' | 'directory';
    path: string;
    relativePath: string;
    fileType?: FileType;
    importance?: number;
    children?: ProjectStructure[];
    size?: number;
    tokenCount?: number;
    description?: string;
}
/**
 * 项目分析器 - 参考 deepwiki open 的智能分析逻辑
 * 负责扫描和分析项目文件结构，实现智能文件分类和架构分析
 */
export declare class ProjectAnalyzer {
    private excludedDirs;
    private excludedFiles;
    private includedDirs;
    private includedFiles;
    private maxFileSize;
    private maxTokens;
    private readonly fileTypeMap;
    private readonly languageMap;
    private readonly importantFilePatterns;
    constructor(excludedDirs?: string[], excludedFiles?: string[], includedDirs?: string[], includedFiles?: string[]);
    /**
     * 分析项目 - 参考 deepwiki open 的智能分析逻辑
     */
    analyzeProject(projectPath: string, progressCallback?: (progress: number, message: string) => void): Promise<ProjectAnalysisResult>;
    /**
     * 扫描项目中的所有文件
     */
    private scanFiles;
    /**
     * 分析单个文件 - 参考 deepwiki open 的智能分析
     */
    private analyzeFile;
    /**
     * 检测项目类型
     */
    private detectProjectType;
    /**
     * 分析项目架构
     */
    private analyzeArchitecture;
    /**
     * 分析项目依赖
     */
    private analyzeDependencies;
    /**
     * 文件优先级排序
     */
    private prioritizeFiles;
    /**
     * 计算文件重要性
     */
    private calculateFileImportance;
    /**
     * 确定文件类型
     */
    private determineFileType;
    /**
     * 计算token数量 - 简单实现
     */
    private countTokens;
    /**
     * 分析文件元数据
     */
    private analyzeFileMetadata;
    /**
     * 提取导入语句
     */
    private extractImports;
    /**
     * 提取导出语句
     */
    private extractExports;
    /**
     * 生成文件ID
     */
    private generateFileId;
    /**
     * 检查文件是否重要
     */
    private isImportantFile;
    /**
     * 生成语言统计
     */
    private generateLanguageStats;
    /**
     * 检测入口点
     */
    private detectEntryPoints;
    /**
     * 检测主要目录
     */
    private detectMainDirectories;
    /**
     * 检测架构层级
     */
    private detectArchitectureLayers;
    /**
     * 检测设计模式
     */
    private detectDesignPatterns;
    /**
     * 检查文件是否存在
     */
    private fileExists;
    /**
     * 构建项目结构树 - 增强版本
     */
    private buildProjectStructure;
    /**
     * 检查目录是否被排除
     */
    private isExcludedDirectory;
    /**
     * 检查文件是否被排除
     */
    private isExcludedFile;
    /**
     * 获取支持的编程语言
     */
    static getSupportedLanguages(): string[];
    /**
     * 获取语言统计信息
     */
    getLanguageStats(files: FileInfo[]): Record<string, {
        count: number;
        size: number;
    }>;
    /**
     * 获取文件语言
     */
    private getFileLanguage;
    /**
     * 智能文件扫描 - 根据项目类型和重要性过滤
     */
    private smartScanFiles;
    /**
     * 获取项目摘要信息
     */
    getProjectSummary(result: ProjectAnalysisResult): string;
}
//# sourceMappingURL=ProjectAnalyzer.d.ts.map