import * as vscode from 'vscode';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
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
export class CacheManager {
    private static readonly CACHE_VERSION = '1.0.0';
    private static readonly CACHE_DIR_NAME = '.deepwiki';
    private static readonly CACHE_FILE_NAME = 'wiki-cache.json';
    private static readonly ANALYSIS_FILE_NAME = 'analysis-cache.json';
    private static readonly MAX_CACHE_AGE_DAYS = 7;
    private static readonly MAX_CACHE_ENTRIES = 10;

    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 获取项目的缓存目录路径
     */
    private getCacheDir(projectPath: string): string {
        return path.join(projectPath, CacheManager.CACHE_DIR_NAME);
    }

    /**
     * 获取 Wiki 缓存文件路径
     */
    private getWikiCacheFile(projectPath: string): string {
        return path.join(this.getCacheDir(projectPath), CacheManager.CACHE_FILE_NAME);
    }

    /**
     * 获取分析缓存文件路径
     */
    private getAnalysisCacheFile(projectPath: string): string {
        return path.join(this.getCacheDir(projectPath), CacheManager.ANALYSIS_FILE_NAME);
    }

    /**
     * 检查项目是否有缓存
     */
    async hasCache(projectPath: string): Promise<boolean> {
        try {
            const wikiCacheFile = this.getWikiCacheFile(projectPath);
            const analysisCacheFile = this.getAnalysisCacheFile(projectPath);
            
            const [wikiExists, analysisExists] = await Promise.all([
                fsPromises.access(wikiCacheFile).then(() => true).catch(() => false),
                fsPromises.access(analysisCacheFile).then(() => true).catch(() => false)
            ]);
            
            return wikiExists && analysisExists;
        } catch (error) {
            return false;
        }
    }

    /**
     * 保存 Wiki 数据到缓存
     */
    async saveWikiCache(
        projectPath: string,
        wikiData: WikiData,
        analysisResult: ProjectAnalysisResult
    ): Promise<void> {
        try {
            const cacheDir = this.getCacheDir(projectPath);
            await fsPromises.mkdir(cacheDir, { recursive: true });

            const cacheEntry: CacheEntry = {
                projectPath,
                projectName: analysisResult.projectName,
                wikiData,
                analysisResult,
                createdAt: new Date(),
                lastModified: new Date(),
                version: CacheManager.CACHE_VERSION
            };

            // 保存 Wiki 缓存
            const wikiCacheFile = this.getWikiCacheFile(projectPath);
            await fsPromises.writeFile(wikiCacheFile, JSON.stringify({
                version: CacheManager.CACHE_VERSION,
                wikiData,
                createdAt: cacheEntry.createdAt,
                lastModified: cacheEntry.lastModified
            }, null, 2), 'utf8');

            // 保存分析缓存
            const analysisCacheFile = this.getAnalysisCacheFile(projectPath);
            await fsPromises.writeFile(analysisCacheFile, JSON.stringify({
                version: CacheManager.CACHE_VERSION,
                analysisResult,
                createdAt: cacheEntry.createdAt,
                lastModified: cacheEntry.lastModified
            }, null, 2), 'utf8');

            // 更新全局缓存索引
            await this.updateGlobalCacheIndex(cacheEntry);

        } catch (error) {
            console.error('Failed to save cache:', error);
            throw new Error(`Failed to save cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 从缓存加载 Wiki 数据
     */
    async loadWikiCache(projectPath: string): Promise<{ wikiData: WikiData; analysisResult: ProjectAnalysisResult } | null> {
        try {
            const wikiCacheFile = this.getWikiCacheFile(projectPath);
            const analysisCacheFile = this.getAnalysisCacheFile(projectPath);

            const [wikiExists, analysisExists] = await Promise.all([
                fsPromises.access(wikiCacheFile).then(() => true).catch(() => false),
                fsPromises.access(analysisCacheFile).then(() => true).catch(() => false)
            ]);

            if (!wikiExists || !analysisExists) {
                return null;
            }

            const [wikiCache, analysisCache] = await Promise.all([
                fsPromises.readFile(wikiCacheFile, 'utf8').then(JSON.parse),
                fsPromises.readFile(analysisCacheFile, 'utf8').then(JSON.parse)
            ]);

            // 检查缓存版本
            if (wikiCache.version !== CacheManager.CACHE_VERSION || 
                analysisCache.version !== CacheManager.CACHE_VERSION) {
                console.warn('Cache version mismatch, invalidating cache');
                await this.clearProjectCache(projectPath);
                return null;
            }

            // 检查缓存是否过期
            const cacheAge = Date.now() - new Date(wikiCache.createdAt).getTime();
            const maxAge = CacheManager.MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
            
            if (cacheAge > maxAge) {
                console.warn('Cache expired, invalidating cache');
                await this.clearProjectCache(projectPath);
                return null;
            }

            return {
                wikiData: wikiCache.wikiData,
                analysisResult: analysisCache.analysisResult
            };

        } catch (error) {
            console.error('Failed to load cache:', error);
            return null;
        }
    }

    /**
     * 清除项目缓存
     */
    async clearProjectCache(projectPath: string): Promise<void> {
        try {
            const cacheDir = this.getCacheDir(projectPath);
            
            try {
                await fsPromises.access(cacheDir);
                await fsPromises.rmdir(cacheDir, { recursive: true });
            } catch (error) {
                // Directory doesn't exist, ignore
            }

            // 从全局索引中移除
            await this.removeFromGlobalCacheIndex(projectPath);

        } catch (error) {
            console.error('Failed to clear project cache:', error);
            throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 清除所有缓存
     */
    async clearAllCache(): Promise<void> {
        try {
            const globalCacheIndex = await this.getGlobalCacheIndex();
            
            for (const entry of globalCacheIndex.entries) {
                await this.clearProjectCache(entry.projectPath);
            }

            // 清除全局索引
            await this.clearGlobalCacheIndex();

        } catch (error) {
            console.error('Failed to clear all cache:', error);
            throw new Error(`Failed to clear all cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 获取缓存统计信息
     */
    async getCacheStats(): Promise<{
        totalEntries: number;
        totalSize: string;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    }> {
        try {
            const globalCacheIndex = await this.getGlobalCacheIndex();
            let totalSize = 0;
            let oldestEntry: Date | null = null;
            let newestEntry: Date | null = null;

            for (const entry of globalCacheIndex.entries) {
                const cacheDir = this.getCacheDir(entry.projectPath);
                
                try {
                    await fsPromises.access(cacheDir);
                    const stats = await this.calculateDirectorySize(cacheDir);
                    totalSize += stats.size;

                    const entryDate = new Date(entry.createdAt);
                    if (!oldestEntry || entryDate < oldestEntry) {
                        oldestEntry = entryDate;
                    }
                    if (!newestEntry || entryDate > newestEntry) {
                        newestEntry = entryDate;
                    }
                } catch (error) {
                    // Directory doesn't exist, skip
                }
            }

            return {
                totalEntries: globalCacheIndex.entries.length,
                totalSize: this.formatFileSize(totalSize),
                oldestEntry,
                newestEntry
            };

        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return {
                totalEntries: 0,
                totalSize: '0 B',
                oldestEntry: null,
                newestEntry: null
            };
        }
    }

    /**
     * 清理过期缓存
     */
    async cleanupExpiredCache(): Promise<number> {
        try {
            const globalCacheIndex = await this.getGlobalCacheIndex();
            const maxAge = CacheManager.MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
            const now = Date.now();
            let cleanedCount = 0;

            for (const entry of globalCacheIndex.entries) {
                const cacheAge = now - new Date(entry.createdAt).getTime();
                
                if (cacheAge > maxAge) {
                    await this.clearProjectCache(entry.projectPath);
                    cleanedCount++;
                }
            }

            // 更新清理时间
            globalCacheIndex.lastCleanup = new Date();
            await this.saveGlobalCacheIndex(globalCacheIndex);

            return cleanedCount;

        } catch (error) {
            console.error('Failed to cleanup expired cache:', error);
            return 0;
        }
    }

    /**
     * 获取全局缓存索引
     */
    private async getGlobalCacheIndex(): Promise<CacheMetadata> {
        try {
            const indexFile = this.getGlobalCacheIndexFile();
            
            try {
                await fsPromises.access(indexFile);
                const indexData = await fsPromises.readFile(indexFile, 'utf8');
                const index = JSON.parse(indexData);
                return {
                    version: index.version || CacheManager.CACHE_VERSION,
                    entries: index.entries || [],
                    lastCleanup: new Date(index.lastCleanup || Date.now())
                };
            } catch (error) {
                return {
                    version: CacheManager.CACHE_VERSION,
                    entries: [],
                    lastCleanup: new Date()
                };
            }

        } catch (error) {
            console.error('Failed to get global cache index:', error);
            return {
                version: CacheManager.CACHE_VERSION,
                entries: [],
                lastCleanup: new Date()
            };
        }
    }

    /**
     * 保存全局缓存索引
     */
    private async saveGlobalCacheIndex(metadata: CacheMetadata): Promise<void> {
        try {
            const indexFile = this.getGlobalCacheIndexFile();
            await fsPromises.mkdir(path.dirname(indexFile), { recursive: true });
            await fsPromises.writeFile(indexFile, JSON.stringify(metadata, null, 2), 'utf8');
        } catch (error) {
            console.error('Failed to save global cache index:', error);
        }
    }

    /**
     * 更新全局缓存索引
     */
    private async updateGlobalCacheIndex(entry: CacheEntry): Promise<void> {
        const metadata = await this.getGlobalCacheIndex();
        
        // 移除已存在的条目
        metadata.entries = metadata.entries.filter(e => e.projectPath !== entry.projectPath);
        
        // 添加新条目
        metadata.entries.unshift(entry);
        
        // 限制条目数量
        if (metadata.entries.length > CacheManager.MAX_CACHE_ENTRIES) {
            const removedEntries = metadata.entries.splice(CacheManager.MAX_CACHE_ENTRIES);
            
            // 清理被移除的缓存
            for (const removedEntry of removedEntries) {
                await this.clearProjectCache(removedEntry.projectPath);
            }
        }
        
        await this.saveGlobalCacheIndex(metadata);
    }

    /**
     * 从全局缓存索引中移除项目
     */
    private async removeFromGlobalCacheIndex(projectPath: string): Promise<void> {
        const metadata = await this.getGlobalCacheIndex();
        metadata.entries = metadata.entries.filter(e => e.projectPath !== projectPath);
        await this.saveGlobalCacheIndex(metadata);
    }

    /**
     * 清除全局缓存索引
     */
    private async clearGlobalCacheIndex(): Promise<void> {
        try {
            const indexFile = this.getGlobalCacheIndexFile();
            
            try {
                await fsPromises.access(indexFile);
                await fsPromises.unlink(indexFile);
            } catch (error) {
                // File doesn't exist, ignore
            }
        } catch (error) {
            console.error('Failed to clear global cache index:', error);
        }
    }

    /**
     * 获取全局缓存索引文件路径
     */
    private getGlobalCacheIndexFile(): string {
        return path.join(this.context.globalStorageUri.fsPath, 'deepwiki-cache-index.json');
    }

    /**
     * 计算目录大小
     */
    private async calculateDirectorySize(dirPath: string): Promise<{ size: number; files: number }> {
        let totalSize = 0;
        let fileCount = 0;

        try {
            const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    const subStats = await this.calculateDirectorySize(fullPath);
                    totalSize += subStats.size;
                    fileCount += subStats.files;
                } else if (entry.isFile()) {
                    const stats = await fsPromises.stat(fullPath);
                    totalSize += stats.size;
                    fileCount++;
                }
            }
        } catch (error) {
            console.warn(`Failed to calculate size for ${dirPath}:`, error);
        }

        return { size: totalSize, files: fileCount };
    }

    /**
     * 格式化文件大小
     */
    private formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * 检查是否需要自动清理
     */
    async shouldAutoCleanup(): Promise<boolean> {
        const metadata = await this.getGlobalCacheIndex();
        const daysSinceLastCleanup = (Date.now() - new Date(metadata.lastCleanup).getTime()) / (24 * 60 * 60 * 1000);
        
        return daysSinceLastCleanup >= 1; // 每天自动清理一次
    }

    /**
     * 获取缓存的项目列表
     */
    async getCachedProjects(): Promise<Array<{ name: string; path: string; lastModified: Date }>> {
        const metadata = await this.getGlobalCacheIndex();
        
        return metadata.entries.map(entry => ({
            name: entry.projectName,
            path: entry.projectPath,
            lastModified: new Date(entry.lastModified)
        }));
    }
}