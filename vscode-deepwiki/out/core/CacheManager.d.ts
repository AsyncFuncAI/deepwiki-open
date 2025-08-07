import * as vscode from 'vscode';
import { WikiData } from './WikiGenerator';
import { ProjectAnalysisResult } from './ProjectAnalyzer';
/**
 * 缓存条目接口
 */
export interface CacheEntry {
    projectPath: string;
    projectName: string;
    wikiData: WikiData;
    analysisResult: ProjectAnalysisResult;
    createdAt: Date;
    lastModified: Date;
    version: string;
}
/**
 * 缓存元数据接口
 */
export interface CacheMetadata {
    version: string;
    entries: CacheEntry[];
    lastCleanup: Date;
}
/**
 * 缓存管理器
 * 负责管理 Wiki 数据的本地缓存
 */
export declare class CacheManager {
    private static readonly CACHE_VERSION;
    private static readonly CACHE_DIR_NAME;
    private static readonly CACHE_FILE_NAME;
    private static readonly ANALYSIS_FILE_NAME;
    private static readonly MAX_CACHE_AGE_DAYS;
    private static readonly MAX_CACHE_ENTRIES;
    private context;
    constructor(context: vscode.ExtensionContext);
    /**
     * 获取项目的缓存目录路径
     */
    private getCacheDir;
    /**
     * 获取 Wiki 缓存文件路径
     */
    private getWikiCacheFile;
    /**
     * 获取分析缓存文件路径
     */
    private getAnalysisCacheFile;
    /**
     * 检查项目是否有缓存
     */
    hasCache(projectPath: string): Promise<boolean>;
    /**
     * 保存 Wiki 数据到缓存
     */
    saveWikiCache(projectPath: string, wikiData: WikiData, analysisResult: ProjectAnalysisResult): Promise<void>;
    /**
     * 从缓存加载 Wiki 数据
     */
    loadWikiCache(projectPath: string): Promise<{
        wikiData: WikiData;
        analysisResult: ProjectAnalysisResult;
    } | null>;
    /**
     * 清除项目缓存
     */
    clearProjectCache(projectPath: string): Promise<void>;
    /**
     * 清除所有缓存
     */
    clearAllCache(): Promise<void>;
    /**
     * 获取缓存统计信息
     */
    getCacheStats(): Promise<{
        totalEntries: number;
        totalSize: string;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    }>;
    /**
     * 清理过期缓存
     */
    cleanupExpiredCache(): Promise<number>;
    /**
     * 获取全局缓存索引
     */
    private getGlobalCacheIndex;
    /**
     * 保存全局缓存索引
     */
    private saveGlobalCacheIndex;
    /**
     * 更新全局缓存索引
     */
    private updateGlobalCacheIndex;
    /**
     * 从全局缓存索引中移除项目
     */
    private removeFromGlobalCacheIndex;
    /**
     * 清除全局缓存索引
     */
    private clearGlobalCacheIndex;
    /**
     * 获取全局缓存索引文件路径
     */
    private getGlobalCacheIndexFile;
    /**
     * 计算目录大小
     */
    private calculateDirectorySize;
    /**
     * 格式化文件大小
     */
    private formatFileSize;
    /**
     * 检查是否需要自动清理
     */
    shouldAutoCleanup(): Promise<boolean>;
    /**
     * 获取缓存的项目列表
     */
    getCachedProjects(): Promise<Array<{
        name: string;
        path: string;
        lastModified: Date;
    }>>;
}
//# sourceMappingURL=CacheManager.d.ts.map