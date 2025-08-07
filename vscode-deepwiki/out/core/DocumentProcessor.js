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
exports.DocumentProcessor = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
/**
 * 文档处理器 - 实现类似 DeepWiki 的文档处理逻辑
 */
class DocumentProcessor {
    constructor(config = {}) {
        this.projectPath = '';
        // 代码文件扩展名
        this.CODE_EXTENSIONS = new Set([
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h', '.hpp',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
            '.hs', '.ml', '.fs', '.vb', '.pl', '.r', '.m', '.sh', '.bash', '.zsh',
            '.ps1', '.bat', '.cmd', '.sql', '.html', '.css', '.scss', '.sass',
            '.less', '.vue', '.svelte', '.dart', '.lua', '.nim', '.zig', '.jl'
        ]);
        // 文档文件扩展名
        this.DOCUMENT_EXTENSIONS = new Set([
            '.md', '.txt', '.rst', '.adoc', '.org', '.tex', '.rtf'
        ]);
        // 配置文件扩展名
        this.CONFIG_EXTENSIONS = new Set([
            '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.xml'
        ]);
        // 默认排除的目录
        this.DEFAULT_EXCLUDED_DIRS = [
            'node_modules', '.git', '.svn', '.hg', '__pycache__', '.pytest_cache',
            'venv', 'env', '.env', 'dist', 'build', 'target', 'bin', 'obj',
            '.vscode', '.idea', '.vs', 'coverage', '.nyc_output', 'logs',
            'tmp', 'temp', '.cache', '.next', '.nuxt', 'out'
        ];
        // 默认排除的文件模式
        this.DEFAULT_EXCLUDED_FILES = [
            '*.log', '*.tmp', '*.temp', '*.cache', '*.lock', '*.pid',
            '*.swp', '*.swo', '*~', '.DS_Store', 'Thumbs.db',
            '*.min.js', '*.min.css', '*.bundle.js', '*.bundle.css',
            '*.map', '*.d.ts.map', '*.js.map', '*.css.map'
        ];
        this.stats = {
            totalFiles: 0,
            processedFiles: 0,
            totalSize: 0,
            totalTokens: 0,
            errors: 0
        };
        this.config = {
            maxFileSize: 1024 * 1024, // 1MB
            maxTokens: 8000,
            chunkSize: 1000,
            chunkOverlap: 200,
            excludePatterns: config.excludePatterns || ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
            includePatterns: config.includePatterns || ['**/*'],
            ...config
        };
    }
    /**
     * 递归读取所有文档 - 类似 DeepWiki 的 read_all_documents
     */
    async readAllDocuments(progressCallback) {
        progressCallback?.(0, 'Starting document scanning...');
        const allFiles = await this.scanDirectory(this.projectPath);
        const filteredFiles = this.filterFiles(allFiles);
        progressCallback?.(20, `Found ${filteredFiles.length} files to process...`);
        const processedFiles = [];
        for (let i = 0; i < filteredFiles.length; i++) {
            const filePath = filteredFiles[i];
            const progress = 20 + (i / filteredFiles.length) * 60;
            try {
                progressCallback?.(progress, `Processing ${path.basename(filePath)}...`);
                const fileInfo = await this.processFile(filePath);
                if (fileInfo) {
                    processedFiles.push(fileInfo);
                }
            }
            catch (error) {
                console.warn(`Failed to process file ${filePath}:`, error);
            }
        }
        progressCallback?.(80, `Processed ${processedFiles.length} files successfully`);
        return processedFiles;
    }
    /**
     * 扫描目录获取所有文件
     */
    async scanDirectory(dirPath) {
        const files = [];
        const scanRecursive = async (currentPath) => {
            try {
                const entries = await fs_1.promises.readdir(currentPath, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);
                    if (entry.isDirectory()) {
                        // 检查是否应该排除此目录
                        if (!this.shouldExcludeDirectory(entry.name, fullPath)) {
                            await scanRecursive(fullPath);
                        }
                    }
                    else if (entry.isFile()) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to scan directory ${currentPath}:`, error);
            }
        };
        await scanRecursive(dirPath);
        return files;
    }
    /**
     * 过滤文件
     */
    filterFiles(files) {
        return files.filter(filePath => {
            const fileName = path.basename(filePath);
            const ext = path.extname(filePath).toLowerCase();
            // 检查文件大小
            try {
                const stats = fs.statSync(filePath);
                if (stats.size > this.config.maxFileSize) {
                    return false;
                }
            }
            catch (error) {
                return false;
            }
            // 检查是否应该排除此文件
            if (this.shouldExcludeFile(fileName, filePath)) {
                return false;
            }
            // 检查是否是支持的文件类型
            return this.isSupportedFileType(ext);
        });
    }
    /**
     * 检查是否应该排除目录
     */
    shouldExcludeDirectory(dirName, fullPath) {
        const relativePath = path.relative(this.projectPath, fullPath);
        // 检查默认排除列表
        if (this.DEFAULT_EXCLUDED_DIRS.includes(dirName)) {
            return true;
        }
        // 检查包含列表（如果指定）
        if (this.config.includePatterns && this.config.includePatterns.length > 0) {
            return !this.config.includePatterns.some((pattern) => this.matchPattern(relativePath, pattern) || this.matchPattern(dirName, pattern));
        }
        // 检查排除列表
        const excludePatterns = this.config.excludePatterns || [];
        return excludePatterns.some((pattern) => this.matchPattern(relativePath, pattern) || this.matchPattern(dirName, pattern));
    }
    /**
     * 检查是否应该排除文件
     */
    shouldExcludeFile(fileName, fullPath) {
        const relativePath = path.relative(this.projectPath, fullPath);
        // 检查默认排除文件
        if (this.DEFAULT_EXCLUDED_FILES.some(pattern => this.matchPattern(fileName, pattern))) {
            return true;
        }
        // 检查包含列表（如果指定）
        if (this.config.includePatterns && this.config.includePatterns.length > 0) {
            return !this.config.includePatterns.some((pattern) => this.matchPattern(relativePath, pattern) || this.matchPattern(fileName, pattern));
        }
        // 检查排除列表
        const excludePatterns = this.config.excludePatterns || [];
        return excludePatterns.some((pattern) => this.matchPattern(relativePath, pattern) || this.matchPattern(fileName, pattern));
    }
    /**
     * 模式匹配（支持通配符）
     */
    matchPattern(text, pattern) {
        // 简单的通配符匹配
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(text);
    }
    /**
     * 检查是否是支持的文件类型
     */
    isSupportedFileType(extension) {
        return this.CODE_EXTENSIONS.has(extension) ||
            this.DOCUMENT_EXTENSIONS.has(extension) ||
            this.CONFIG_EXTENSIONS.has(extension);
    }
    /**
     * 处理单个文件
     */
    async processFile(filePath) {
        try {
            const content = await fs_1.promises.readFile(filePath, 'utf8');
            const stats = await fs_1.promises.stat(filePath);
            const extension = path.extname(filePath).toLowerCase();
            const relativePath = path.relative(this.projectPath, filePath);
            // 计算 token 数量（简单估算：1 token ≈ 4 字符）
            const tokenCount = Math.ceil(content.length / 4);
            // 检查 token 限制
            if (tokenCount > this.config.maxTokens) {
                console.warn(`File ${relativePath} exceeds token limit (${tokenCount} > ${this.config.maxTokens})`);
                // 可以选择截断或跳过
                return null;
            }
            const language = this.getLanguageFromExtension(extension);
            const isCode = this.CODE_EXTENSIONS.has(extension);
            const isDocument = this.DOCUMENT_EXTENSIONS.has(extension);
            return {
                path: filePath,
                relativePath,
                content,
                size: stats.size,
                extension,
                language,
                tokenCount,
                isCode,
                isDocument
            };
        }
        catch (error) {
            console.error(`Failed to process file ${filePath}:`, error);
            return null;
        }
    }
    /**
     * 根据文件扩展名获取语言
     */
    getLanguageFromExtension(extension) {
        const languageMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.clj': 'clojure',
            '.hs': 'haskell',
            '.ml': 'ocaml',
            '.fs': 'fsharp',
            '.vb': 'vbnet',
            '.pl': 'perl',
            '.r': 'r',
            '.m': 'matlab',
            '.sh': 'bash',
            '.bash': 'bash',
            '.zsh': 'zsh',
            '.ps1': 'powershell',
            '.bat': 'batch',
            '.cmd': 'batch',
            '.sql': 'sql',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.vue': 'vue',
            '.svelte': 'svelte',
            '.dart': 'dart',
            '.lua': 'lua',
            '.nim': 'nim',
            '.zig': 'zig',
            '.jl': 'julia',
            '.md': 'markdown',
            '.txt': 'text',
            '.rst': 'restructuredtext',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.toml': 'toml',
            '.xml': 'xml'
        };
        return languageMap[extension] || 'text';
    }
    /**
     * 将文件分块 - 类似 DeepWiki 的文档分块逻辑
     */
    async chunkDocuments(files, progressCallback) {
        const chunks = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            progressCallback?.(progress, `Chunking ${file.relativePath}...`);
            const fileChunks = this.chunkFile(file);
            chunks.push(...fileChunks);
        }
        return chunks;
    }
    /**
     * 对单个文件进行分块
     */
    chunkFile(file) {
        const chunks = [];
        const content = file.content;
        const chunkSize = this.config.chunkSize;
        const overlap = this.config.chunkOverlap;
        // 如果文件很小，不需要分块
        if (content.length <= chunkSize) {
            chunks.push({
                id: `${file.relativePath}-0`,
                content: content,
                metadata: {
                    filePath: file.relativePath,
                    chunkIndex: 0,
                    totalChunks: 1,
                    language: file.language,
                    fileType: file.isCode ? 'code' : file.isDocument ? 'document' : 'config'
                }
            });
            return chunks;
        }
        // 对于代码文件，按行分块
        if (file.isCode) {
            return this.chunkCodeFile(file);
        }
        // 对于文档文件，按段落分块
        if (file.isDocument) {
            return this.chunkDocumentFile(file);
        }
        // 对于其他文件，按字符分块
        return this.chunkByCharacters(file);
    }
    /**
     * 按行分块代码文件
     */
    chunkCodeFile(file) {
        const chunks = [];
        const lines = file.content.split('\n');
        const chunkSize = this.config.chunkSize;
        const overlap = this.config.chunkOverlap;
        let currentChunk = '';
        let currentLines = 0;
        let startLine = 0;
        let chunkIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1; // +1 for newline
            // 如果添加这行会超过块大小，保存当前块
            if (currentChunk.length + lineLength > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `${file.relativePath}-${chunkIndex}`,
                    content: currentChunk.trim(),
                    metadata: {
                        filePath: file.relativePath,
                        chunkIndex,
                        totalChunks: 0, // 稍后更新
                        startLine: startLine + 1,
                        endLine: i,
                        language: file.language,
                        fileType: 'code'
                    }
                });
                // 开始新块，包含重叠
                const overlapLines = Math.min(overlap / 50, currentLines); // 假设平均每行50字符
                const overlapStart = Math.max(0, i - overlapLines);
                currentChunk = lines.slice(overlapStart, i + 1).join('\n');
                startLine = overlapStart;
                currentLines = i - overlapStart + 1;
                chunkIndex++;
            }
            else {
                currentChunk += line + '\n';
                currentLines++;
            }
        }
        // 添加最后一个块
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `${file.relativePath}-${chunkIndex}`,
                content: currentChunk.trim(),
                metadata: {
                    filePath: file.relativePath,
                    chunkIndex,
                    totalChunks: 0,
                    startLine: startLine + 1,
                    endLine: lines.length,
                    language: file.language,
                    fileType: 'code'
                }
            });
        }
        // 更新总块数
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * 按段落分块文档文件
     */
    chunkDocumentFile(file) {
        const chunks = [];
        const paragraphs = file.content.split(/\n\s*\n/);
        const chunkSize = this.config.chunkSize;
        const overlap = this.config.chunkOverlap;
        let currentChunk = '';
        let chunkIndex = 0;
        for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `${file.relativePath}-${chunkIndex}`,
                    content: currentChunk.trim(),
                    metadata: {
                        filePath: file.relativePath,
                        chunkIndex,
                        totalChunks: 0,
                        language: file.language,
                        fileType: 'document'
                    }
                });
                // 开始新块，包含重叠
                currentChunk = currentChunk.slice(-overlap) + '\n\n' + paragraph;
                chunkIndex++;
            }
            else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
        // 添加最后一个块
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `${file.relativePath}-${chunkIndex}`,
                content: currentChunk.trim(),
                metadata: {
                    filePath: file.relativePath,
                    chunkIndex,
                    totalChunks: 0,
                    language: file.language,
                    fileType: 'document'
                }
            });
        }
        // 更新总块数
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * 按字符分块
     */
    chunkByCharacters(file) {
        const chunks = [];
        const content = file.content;
        const chunkSize = this.config.chunkSize;
        const overlap = this.config.chunkOverlap;
        let start = 0;
        let chunkIndex = 0;
        while (start < content.length) {
            const end = Math.min(start + chunkSize, content.length);
            const chunkContent = content.slice(start, end);
            chunks.push({
                id: `${file.relativePath}-${chunkIndex}`,
                content: chunkContent,
                metadata: {
                    filePath: file.relativePath,
                    chunkIndex,
                    totalChunks: 0,
                    language: file.language,
                    fileType: 'config'
                }
            });
            start = end - overlap;
            chunkIndex++;
        }
        // 更新总块数
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * 将文档块转换为 Document 对象
     */
    convertChunksToDocuments(chunks) {
        return chunks.map(chunk => ({
            id: chunk.id,
            title: `${path.basename(chunk.metadata.filePath)} (Chunk ${chunk.metadata.chunkIndex + 1}/${chunk.metadata.totalChunks})`,
            content: chunk.content,
            path: chunk.metadata.filePath,
            type: chunk.metadata.fileType,
            metadata: {
                ...chunk.metadata,
                chunkId: chunk.id
            }
        }));
    }
    /**
     * 获取处理统计信息
     */
    getProcessingStats(files, chunks) {
        const codeFiles = files.filter(f => f.isCode);
        const documentFiles = files.filter(f => f.isDocument);
        const configFiles = files.filter(f => !f.isCode && !f.isDocument);
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const totalTokens = files.reduce((sum, f) => sum + f.tokenCount, 0);
        const languageStats = files.reduce((stats, file) => {
            stats[file.language] = (stats[file.language] || 0) + 1;
            return stats;
        }, {});
        return {
            totalFiles: files.length,
            codeFiles: codeFiles.length,
            documentFiles: documentFiles.length,
            configFiles: configFiles.length,
            totalSize,
            totalTokens,
            totalChunks: chunks.length,
            languageStats,
            averageChunksPerFile: chunks.length / files.length
        };
    }
    /**
     * 处理目录 - 主要入口方法
     */
    async processDirectory(directoryPath, progressCallback) {
        this.projectPath = directoryPath;
        this.stats = {
            totalFiles: 0,
            processedFiles: 0,
            totalSize: 0,
            totalTokens: 0,
            errors: 0
        };
        try {
            // 读取所有文档
            const files = await this.readAllDocuments((progress, message) => {
                // 转换进度回调格式
                if (progressCallback) {
                    const current = Math.floor(progress);
                    progressCallback(current, 100, message);
                }
            });
            this.stats.totalFiles = files.length;
            this.stats.processedFiles = files.length;
            this.stats.totalSize = files.reduce((sum, f) => sum + f.size, 0);
            this.stats.totalTokens = files.reduce((sum, f) => sum + f.tokenCount, 0);
            // 转换为文档块
            const allChunks = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progressCallback?.(i + 1, files.length, file.relativePath);
                try {
                    const chunks = this.chunkFile(file);
                    allChunks.push(...chunks);
                }
                catch (error) {
                    console.warn(`Failed to chunk file ${file.relativePath}:`, error);
                    this.stats.errors++;
                }
            }
            // 转换为 Document 对象
            return this.convertChunksToDocuments(allChunks);
        }
        catch (error) {
            console.error('Failed to process directory:', error);
            this.stats.errors++;
            throw error;
        }
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return { ...this.stats };
    }
}
exports.DocumentProcessor = DocumentProcessor;
//# sourceMappingURL=DocumentProcessor.js.map