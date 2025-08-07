import * as vscode from 'vscode';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

/**
 * 文件类型枚举
 */
export enum FileType {
    CODE = 'code',
    DOCUMENTATION = 'documentation',
    CONFIG = 'config',
    DATA = 'data',
    ASSET = 'asset',
    TEST = 'test',
    BUILD = 'build'
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
        importance: number; // 0-1, 文件重要性评分
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
    projectType: string; // 项目类型：web, mobile, library, etc.
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
export class ProjectAnalyzer {
    private excludedDirs: string[];
    private excludedFiles: string[];
    private includedDirs: string[];
    private includedFiles: string[];
    private maxFileSize: number = 1024 * 1024; // 1MB
    private maxTokens: number = 100000;
    
    // 文件类型映射
    private readonly fileTypeMap: Map<string, FileType> = new Map([
        // 代码文件
        ['.js', FileType.CODE], ['.jsx', FileType.CODE], ['.ts', FileType.CODE], ['.tsx', FileType.CODE],
        ['.py', FileType.CODE], ['.java', FileType.CODE], ['.c', FileType.CODE], ['.cpp', FileType.CODE],
        ['.h', FileType.CODE], ['.hpp', FileType.CODE], ['.cs', FileType.CODE], ['.php', FileType.CODE],
        ['.rb', FileType.CODE], ['.go', FileType.CODE], ['.rs', FileType.CODE], ['.swift', FileType.CODE],
        ['.kt', FileType.CODE], ['.scala', FileType.CODE], ['.clj', FileType.CODE], ['.hs', FileType.CODE],
        ['.vue', FileType.CODE], ['.svelte', FileType.CODE],
        
        // 样式文件
        ['.css', FileType.CODE], ['.scss', FileType.CODE], ['.sass', FileType.CODE], ['.less', FileType.CODE],
        ['.styl', FileType.CODE],
        
        // 模板文件
        ['.html', FileType.CODE], ['.htm', FileType.CODE], ['.xml', FileType.CODE], ['.jsp', FileType.CODE],
        ['.erb', FileType.CODE], ['.ejs', FileType.CODE], ['.hbs', FileType.CODE], ['.mustache', FileType.CODE],
        
        // 文档文件
        ['.md', FileType.DOCUMENTATION], ['.mdx', FileType.DOCUMENTATION], ['.txt', FileType.DOCUMENTATION],
        ['.rst', FileType.DOCUMENTATION], ['.adoc', FileType.DOCUMENTATION], ['.org', FileType.DOCUMENTATION],
        
        // 配置文件
        ['.json', FileType.CONFIG], ['.yaml', FileType.CONFIG], ['.yml', FileType.CONFIG],
        ['.toml', FileType.CONFIG], ['.ini', FileType.CONFIG], ['.conf', FileType.CONFIG],
        ['.env', FileType.CONFIG], ['.properties', FileType.CONFIG],
        
        // 测试文件
        ['.test.js', FileType.TEST], ['.test.ts', FileType.TEST], ['.spec.js', FileType.TEST],
        ['.spec.ts', FileType.TEST], ['.test.jsx', FileType.TEST], ['.test.tsx', FileType.TEST],
        
        // 构建文件
        ['.dockerfile', FileType.BUILD], ['.dockerignore', FileType.BUILD],
        
        // 数据文件
        ['.sql', FileType.DATA], ['.db', FileType.DATA], ['.sqlite', FileType.DATA],
        ['.csv', FileType.DATA], ['.tsv', FileType.DATA], ['.json', FileType.DATA],
        
        // 资源文件
        ['.png', FileType.ASSET], ['.jpg', FileType.ASSET], ['.jpeg', FileType.ASSET],
        ['.gif', FileType.ASSET], ['.svg', FileType.ASSET], ['.ico', FileType.ASSET],
        ['.woff', FileType.ASSET], ['.woff2', FileType.ASSET], ['.ttf', FileType.ASSET],
        ['.eot', FileType.ASSET], ['.mp3', FileType.ASSET], ['.mp4', FileType.ASSET],
        ['.wav', FileType.ASSET], ['.avi', FileType.ASSET]
    ]);
    
    // 语言映射
    private readonly languageMap: Map<string, string> = new Map([
        ['.js', 'JavaScript'], ['.jsx', 'JavaScript'], ['.ts', 'TypeScript'], ['.tsx', 'TypeScript'],
        ['.py', 'Python'], ['.java', 'Java'], ['.c', 'C'], ['.cpp', 'C++'], ['.h', 'C/C++'],
        ['.hpp', 'C++'], ['.cs', 'C#'], ['.php', 'PHP'], ['.rb', 'Ruby'], ['.go', 'Go'],
        ['.rs', 'Rust'], ['.swift', 'Swift'], ['.kt', 'Kotlin'], ['.scala', 'Scala'],
        ['.vue', 'Vue'], ['.svelte', 'Svelte'], ['.html', 'HTML'], ['.css', 'CSS'],
        ['.scss', 'SCSS'], ['.sass', 'Sass'], ['.less', 'Less'], ['.md', 'Markdown']
    ]);
    
    // 重要文件模式
    private readonly importantFilePatterns: RegExp[] = [
        /^(index|main|app|server|client)\.(js|ts|jsx|tsx|py|java|go|rs)$/i,
        /^(package\.json|requirements\.txt|Cargo\.toml|pom\.xml|build\.gradle)$/i,
        /^(README|CHANGELOG|LICENSE|CONTRIBUTING)\.(md|txt|rst)$/i,
        /^(dockerfile|docker-compose\.ya?ml)$/i,
        /^\.(gitignore|env|env\.example)$/i
    ];

    constructor(excludedDirs: string[] = [], excludedFiles: string[] = [], includedDirs: string[] = [], includedFiles: string[] = []) {
        // 参考 deepwiki open 的排除规则
        this.excludedDirs = [
            'node_modules', '.git', 'dist', 'build', '.vscode', 'out', '.next',
            'coverage', '.nyc_output', '__pycache__', '.pytest_cache', 'venv', 'env',
            '.env', 'target', 'bin', 'obj', '.gradle', '.idea', '.vs', '.vscode',
            'logs', 'tmp', 'temp', '.cache', '.parcel-cache', '.nuxt', '.output',
            'vendor', 'Pods', 'DerivedData', '.build', '.swiftpm',
            ...excludedDirs
        ];
        
        this.excludedFiles = [
            '*.log', '*.tmp', '*.cache', '*.lock', '*.map', '.DS_Store',
            'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Pipfile.lock',
            '*.pyc', '*.pyo', '*.pyd', '__pycache__', '*.so', '*.dylib', '*.dll',
            '*.class', '*.jar', '*.war', '*.ear', '*.zip', '*.tar.gz', '*.rar',
            '*.7z', '*.exe', '*.msi', '*.deb', '*.rpm', '*.dmg', '*.iso',
            'thumbs.db', 'desktop.ini', '.directory', '*.swp', '*.swo', '*~',
            ...excludedFiles
        ];
        
        this.includedDirs = includedDirs;
        this.includedFiles = includedFiles;
    }

    /**
     * 分析项目 - 参考 deepwiki open 的智能分析逻辑
     */
    async analyzeProject(
        projectPath: string,
        progressCallback?: (progress: number, message: string) => void
    ): Promise<ProjectAnalysisResult> {
        const projectName = path.basename(projectPath);
        const files: FileInfo[] = [];
        let totalSize = 0;
        let totalTokens = 0;

        progressCallback?.(0, 'Starting intelligent project analysis...');

        // 步骤1: 检测项目类型和架构
        progressCallback?.(5, 'Detecting project type and architecture...');
        const projectType = await this.detectProjectType(projectPath);
        const architecture = await this.analyzeArchitecture(projectPath);
        const dependencies = await this.analyzeDependencies(projectPath);

        // 步骤2: 智能文件扫描
        progressCallback?.(15, 'Scanning files with intelligent filtering...');
        const allFiles = await this.scanFiles(projectPath);
        const totalFilesCount = allFiles.length;
        
        // 步骤3: 文件优先级排序
        progressCallback?.(25, 'Prioritizing files by importance...');
        const prioritizedFiles = this.prioritizeFiles(allFiles, projectPath);

        // 步骤4: 分析文件
        progressCallback?.(30, 'Analyzing files...');
        for (let i = 0; i < prioritizedFiles.length; i++) {
            const filePath = prioritizedFiles[i];
            const progress = 30 + (i / prioritizedFiles.length) * 50;
            
            progressCallback?.(progress, `Processing ${path.basename(filePath)}...`);

            try {
                const fileInfo = await this.analyzeFile(filePath, projectPath);
                if (fileInfo) {
                    files.push(fileInfo);
                    totalSize += fileInfo.size;
                    totalTokens += fileInfo.tokenCount;
                }
            } catch (error) {
                console.warn(`Failed to analyze file ${filePath}:`, error);
            }
            
            // 检查token限制
            if (totalTokens > this.maxTokens) {
                console.log(`Reached token limit (${this.maxTokens}), stopping file analysis`);
                break;
            }
        }

        // 步骤5: 分类文件
        progressCallback?.(85, 'Categorizing files...');
        const codeFiles = files.filter(f => f.fileType === FileType.CODE);
        const documentFiles = files.filter(f => f.fileType === FileType.DOCUMENTATION);
        const configFiles = files.filter(f => f.fileType === FileType.CONFIG);

        // 步骤6: 生成语言统计
        progressCallback?.(90, 'Generating language statistics...');
        const languages = this.generateLanguageStats(files);

        // 步骤7: 构建项目结构
        progressCallback?.(95, 'Building project structure...');
        const structure = await this.buildProjectStructure(projectPath, files);

        // 步骤8: 检测入口点和主要目录
        const entryPoints = this.detectEntryPoints(files);
        const mainDirectories = this.detectMainDirectories(projectPath, files);

        progressCallback?.(100, 'Analysis complete!');

        const result: ProjectAnalysisResult = {
            projectPath,
            projectName,
            projectType,
            files,
            codeFiles,
            documentFiles,
            configFiles,
            totalFiles: files.length,
            totalSize,
            totalTokens,
            languages,
            structure,
            architecture,
            dependencies,
            entryPoints,
            mainDirectories
        };

        return result;
    }

    /**
     * 扫描项目中的所有文件
     */
    private async scanFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];

        const scanDirectory = async (currentPath: string) => {
            try {
                const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.isDirectory()) {
                        if (!this.isExcludedDirectory(entry.name)) {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        if (!this.isExcludedFile(entry.name)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to scan directory ${currentPath}:`, error);
            }
        };

        await scanDirectory(dirPath);
        return files;
    }

    /**
     * 分析单个文件 - 参考 deepwiki open 的智能分析
     */
    private async analyzeFile(filePath: string, projectPath: string): Promise<FileInfo | null> {
        try {
            const stats = await fsPromises.stat(filePath);
            
            // 跳过过大的文件
            if (stats.size > this.maxFileSize) {
                console.log(`Skipping large file: ${filePath} (${stats.size} bytes)`);
                return null;
            }

            const content = await fsPromises.readFile(filePath, 'utf-8');
            const relativePath = path.relative(projectPath, filePath);
            const extension = path.extname(filePath).toLowerCase();
            const fileName = path.basename(filePath);
            
            // 确定文件类型
            const fileType = this.determineFileType(filePath, content);
            
            // 跳过非重要的资源文件
            if (fileType === FileType.ASSET && !this.isImportantFile(fileName)) {
                return null;
            }
            
            // 计算token数量
            const tokenCount = this.countTokens(content);
            
            // 获取语言
            const language = this.languageMap.get(extension);
            
            // 分析文件元数据
            const metadata = await this.analyzeFileMetadata(filePath, content, fileType);
            
            // 生成唯一ID
            const id = this.generateFileId(relativePath);

            return {
                id,
                path: filePath,
                relativePath,
                content,
                size: stats.size,
                extension,
                fileType,
                language,
                tokenCount,
                lastModified: stats.mtime,
                metadata
            };
        } catch (error) {
            // 可能是二进制文件或无法读取的文件
            console.warn(`Failed to read file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * 检测项目类型
     */
    private async detectProjectType(projectPath: string): Promise<string> {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const requirementsPath = path.join(projectPath, 'requirements.txt');
            const cargoTomlPath = path.join(projectPath, 'Cargo.toml');
            const pomXmlPath = path.join(projectPath, 'pom.xml');
            const buildGradlePath = path.join(projectPath, 'build.gradle');
            
            if (await this.fileExists(packageJsonPath)) {
                const packageJson = JSON.parse(await fsPromises.readFile(packageJsonPath, 'utf-8'));
                if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
                    return 'React Application';
                }
                if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
                    return 'Vue Application';
                }
                if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
                    return 'Next.js Application';
                }
                if (packageJson.dependencies?.express || packageJson.devDependencies?.express) {
                    return 'Node.js/Express Application';
                }
                return 'JavaScript/TypeScript Project';
            }
            
            if (await this.fileExists(requirementsPath)) {
                return 'Python Project';
            }
            
            if (await this.fileExists(cargoTomlPath)) {
                return 'Rust Project';
            }
            
            if (await this.fileExists(pomXmlPath)) {
                return 'Java/Maven Project';
            }
            
            if (await this.fileExists(buildGradlePath)) {
                return 'Java/Gradle Project';
            }
            
            return 'General Project';
        } catch (error) {
            return 'Unknown Project';
        }
    }
    
    /**
     * 分析项目架构
     */
    private async analyzeArchitecture(projectPath: string): Promise<ProjectArchitecture> {
        const architecture: ProjectArchitecture = {
            type: 'single',
            layers: [],
            patterns: []
        };
        
        try {
            // 检测包管理器
            if (await this.fileExists(path.join(projectPath, 'package.json'))) {
                architecture.packageManager = 'npm';
                if (await this.fileExists(path.join(projectPath, 'yarn.lock'))) {
                    architecture.packageManager = 'yarn';
                } else if (await this.fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
                    architecture.packageManager = 'pnpm';
                }
            }
            
            // 检测构建工具
            if (await this.fileExists(path.join(projectPath, 'webpack.config.js'))) {
                architecture.buildTool = 'webpack';
            } else if (await this.fileExists(path.join(projectPath, 'vite.config.js'))) {
                architecture.buildTool = 'vite';
            } else if (await this.fileExists(path.join(projectPath, 'rollup.config.js'))) {
                architecture.buildTool = 'rollup';
            }
            
            // 检测框架
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (await this.fileExists(packageJsonPath)) {
                const packageJson = JSON.parse(await fsPromises.readFile(packageJsonPath, 'utf-8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                if (deps.react) architecture.framework = 'React';
                else if (deps.vue) architecture.framework = 'Vue';
                else if (deps.angular) architecture.framework = 'Angular';
                else if (deps.svelte) architecture.framework = 'Svelte';
                else if (deps.express) architecture.framework = 'Express';
                else if (deps.fastify) architecture.framework = 'Fastify';
            }
            
            // 分析架构层级
            architecture.layers = await this.detectArchitectureLayers(projectPath);
            
            // 检测设计模式
            architecture.patterns = await this.detectDesignPatterns(projectPath);
            
        } catch (error) {
            console.warn('Failed to analyze architecture:', error);
        }
        
        return architecture;
    }
    
    /**
     * 分析项目依赖
     */
    private async analyzeDependencies(projectPath: string): Promise<DependencyInfo> {
        const dependencies: DependencyInfo = {
            dependencies: [],
            devDependencies: [],
            peerDependencies: [],
            internalDependencies: new Map()
        };
        
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (await this.fileExists(packageJsonPath)) {
                const packageJson = JSON.parse(await fsPromises.readFile(packageJsonPath, 'utf-8'));
                dependencies.packageJson = packageJson;
                dependencies.dependencies = Object.keys(packageJson.dependencies || {});
                dependencies.devDependencies = Object.keys(packageJson.devDependencies || {});
                dependencies.peerDependencies = Object.keys(packageJson.peerDependencies || {});
            }
            
            const requirementsPath = path.join(projectPath, 'requirements.txt');
            if (await this.fileExists(requirementsPath)) {
                const content = await fsPromises.readFile(requirementsPath, 'utf-8');
                dependencies.requirements = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            }
        } catch (error) {
            console.warn('Failed to analyze dependencies:', error);
        }
        
        return dependencies;
    }
    
    /**
     * 文件优先级排序
     */
    private prioritizeFiles(files: string[], projectPath: string): string[] {
        return files.sort((a, b) => {
            const aImportance = this.calculateFileImportance(a, projectPath);
            const bImportance = this.calculateFileImportance(b, projectPath);
            return bImportance - aImportance; // 降序排列
        });
    }
    
    /**
     * 计算文件重要性
     */
    private calculateFileImportance(filePath: string, projectPath: string): number {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(projectPath, filePath);
        const extension = path.extname(filePath).toLowerCase();
        
        let importance = 0;
        
        // 重要文件模式匹配
        if (this.importantFilePatterns.some(pattern => pattern.test(fileName))) {
            importance += 100;
        }
        
        // 根据文件类型评分
        const fileType = this.fileTypeMap.get(extension);
        switch (fileType) {
            case FileType.CODE:
                importance += 50;
                break;
            case FileType.DOCUMENTATION:
                importance += 30;
                break;
            case FileType.CONFIG:
                importance += 40;
                break;
            case FileType.TEST:
                importance += 20;
                break;
            default:
                importance += 10;
        }
        
        // 根据目录深度评分（越浅越重要）
        const depth = relativePath.split(path.sep).length;
        importance += Math.max(0, 20 - depth * 2);
        
        // 根据文件名评分
        if (fileName.toLowerCase().includes('main') || fileName.toLowerCase().includes('index')) {
            importance += 30;
        }
        
        return importance;
    }
    
    /**
     * 确定文件类型
     */
    private determineFileType(filePath: string, content: string): FileType {
        const extension = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        
        // 特殊文件名检查
        if (fileName.includes('test') || fileName.includes('spec')) {
            return FileType.TEST;
        }
        
        if (fileName.includes('config') || fileName.includes('setting')) {
            return FileType.CONFIG;
        }
        
        if (fileName === 'dockerfile' || fileName.includes('docker')) {
            return FileType.BUILD;
        }
        
        // 根据扩展名确定类型
        return this.fileTypeMap.get(extension) || FileType.CODE;
    }
    
    /**
     * 计算token数量 - 简单实现
     */
    private countTokens(content: string): number {
        // 简单的token计算：按空格和标点符号分割
        return content.split(/\s+|[.,;:!?(){}\[\]"'`]/).filter(token => token.length > 0).length;
    }
    
    /**
     * 分析文件元数据
     */
    private async analyzeFileMetadata(filePath: string, content: string, fileType: FileType): Promise<FileInfo['metadata']> {
        const fileName = path.basename(filePath);
        const metadata: FileInfo['metadata'] = {
            isMainFile: this.isImportantFile(fileName),
            importance: this.calculateFileImportance(filePath, path.dirname(filePath)),
            dependencies: [],
            exports: [],
            imports: []
        };
        
        // 分析代码文件的导入导出
        if (fileType === FileType.CODE) {
            metadata.imports = this.extractImports(content);
            metadata.exports = this.extractExports(content);
        }
        
        return metadata;
    }
    
    /**
     * 提取导入语句
     */
    private extractImports(content: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }
    
    /**
     * 提取导出语句
     */
    private extractExports(content: string): string[] {
        const exports: string[] = [];
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        return exports;
    }
    
    /**
     * 生成文件ID
     */
    private generateFileId(relativePath: string): string {
        return relativePath.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    /**
     * 检查文件是否重要
     */
    private isImportantFile(fileName: string): boolean {
        return this.importantFilePatterns.some(pattern => pattern.test(fileName));
    }
    
    /**
     * 生成语言统计
     */
    private generateLanguageStats(files: FileInfo[]): LanguageStats[] {
        const stats = new Map<string, LanguageStats>();
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const totalTokens = files.reduce((sum, file) => sum + file.tokenCount, 0);
        
        for (const file of files) {
            const language = file.language || 'Unknown';
            const extension = file.extension;
            
            if (!stats.has(language)) {
                stats.set(language, {
                    language,
                    extension,
                    fileCount: 0,
                    totalSize: 0,
                    totalTokens: 0,
                    percentage: 0
                });
            }
            
            const langStats = stats.get(language)!;
            langStats.fileCount++;
            langStats.totalSize += file.size;
            langStats.totalTokens += file.tokenCount;
        }
        
        // 计算百分比
        for (const langStats of stats.values()) {
            langStats.percentage = totalSize > 0 ? (langStats.totalSize / totalSize) * 100 : 0;
        }
        
        return Array.from(stats.values()).sort((a, b) => b.percentage - a.percentage);
    }
    
    /**
     * 检测入口点
     */
    private detectEntryPoints(files: FileInfo[]): string[] {
        const entryPoints: string[] = [];
        const entryPatterns = [
            /^(index|main|app|server|client)\.(js|ts|jsx|tsx|py)$/i,
            /^src\/(index|main|app)\.(js|ts|jsx|tsx)$/i,
            /^(app|main)\.py$/i
        ];
        
        for (const file of files) {
            const fileName = path.basename(file.path);
            if (entryPatterns.some(pattern => pattern.test(fileName))) {
                entryPoints.push(file.relativePath);
            }
        }
        
        return entryPoints;
    }
    
    /**
     * 检测主要目录
     */
    private detectMainDirectories(projectPath: string, files: FileInfo[]): string[] {
        const dirCounts = new Map<string, number>();
        
        for (const file of files) {
            const dir = path.dirname(file.relativePath);
            const topLevelDir = dir.split(path.sep)[0];
            if (topLevelDir && topLevelDir !== '.') {
                dirCounts.set(topLevelDir, (dirCounts.get(topLevelDir) || 0) + 1);
            }
        }
        
        return Array.from(dirCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([dir]) => dir);
    }
    
    /**
     * 检测架构层级
     */
    private async detectArchitectureLayers(projectPath: string): Promise<ArchitectureLayer[]> {
        const layers: ArchitectureLayer[] = [];
        
        // 常见的架构层级目录
        const layerPatterns = [
            { pattern: /^(src|source)$/i, type: 'presentation' as const, name: 'Source Code' },
            { pattern: /^(components?|views?|pages?)$/i, type: 'presentation' as const, name: 'Presentation Layer' },
            { pattern: /^(services?|business|logic)$/i, type: 'business' as const, name: 'Business Logic' },
            { pattern: /^(data|models?|entities?)$/i, type: 'data' as const, name: 'Data Layer' },
            { pattern: /^(utils?|helpers?|lib|libraries?)$/i, type: 'infrastructure' as const, name: 'Infrastructure' },
            { pattern: /^(config|configurations?)$/i, type: 'infrastructure' as const, name: 'Configuration' }
        ];
        
        try {
            const entries = await fsPromises.readdir(projectPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    for (const layerPattern of layerPatterns) {
                        if (layerPattern.pattern.test(entry.name)) {
                            layers.push({
                                name: layerPattern.name,
                                type: layerPattern.type,
                                directories: [entry.name],
                                files: [],
                                description: `${layerPattern.name} containing ${entry.name} directory`
                            });
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to detect architecture layers:', error);
        }
        
        return layers;
    }
    
    /**
     * 检测设计模式
     */
    private async detectDesignPatterns(projectPath: string): Promise<string[]> {
        const patterns: string[] = [];
        
        try {
            // 检测常见的设计模式目录结构
            const entries = await fsPromises.readdir(projectPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    switch (entry.name.toLowerCase()) {
                        case 'controllers':
                            patterns.push('MVC Pattern');
                            break;
                        case 'middleware':
                            patterns.push('Middleware Pattern');
                            break;
                        case 'factories':
                            patterns.push('Factory Pattern');
                            break;
                        case 'adapters':
                            patterns.push('Adapter Pattern');
                            break;
                        case 'observers':
                            patterns.push('Observer Pattern');
                            break;
                        case 'strategies':
                            patterns.push('Strategy Pattern');
                            break;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to detect design patterns:', error);
        }
        
        return patterns;
    }
    
    /**
     * 检查文件是否存在
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 构建项目结构树 - 增强版本
     */
    private async buildProjectStructure(dirPath: string, analyzedFiles?: FileInfo[]): Promise<ProjectStructure> {
        const name = path.basename(dirPath);
        const relativePath = path.relative(path.dirname(dirPath), dirPath);
        const structure: ProjectStructure = {
            name,
            type: 'directory',
            path: dirPath,
            relativePath,
            children: []
        };

        try {
            const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
            let totalSize = 0;
            let totalTokens = 0;

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const entryRelativePath = path.relative(path.dirname(dirPath), fullPath);

                if (entry.isDirectory()) {
                    if (!this.isExcludedDirectory(entry.name)) {
                        const childStructure = await this.buildProjectStructure(fullPath, analyzedFiles);
                        structure.children!.push(childStructure);
                        totalSize += childStructure.size || 0;
                        totalTokens += childStructure.tokenCount || 0;
                    }
                } else if (entry.isFile()) {
                    if (!this.isExcludedFile(entry.name)) {
                        const stats = await fsPromises.stat(fullPath);
                        const fileInfo = analyzedFiles?.find(f => f.path === fullPath);
                        const extension = path.extname(entry.name).toLowerCase();
                        const fileType = this.determineFileType(fullPath, '');
                        const importance = this.calculateFileImportance(fullPath, dirPath);
                        
                        const fileStructure: ProjectStructure = {
                            name: entry.name,
                            type: 'file',
                            path: fullPath,
                            relativePath: entryRelativePath,
                            fileType,
                            importance,
                            size: stats.size,
                            tokenCount: fileInfo?.tokenCount || 0,
                            description: fileInfo ? `${fileInfo.language || 'Unknown'} file` : undefined
                        };
                        
                        structure.children!.push(fileStructure);
                        totalSize += stats.size;
                        totalTokens += fileInfo?.tokenCount || 0;
                    }
                }
            }
            
            // 设置目录的总大小和token数
            structure.size = totalSize;
            structure.tokenCount = totalTokens;
            
            // 按重要性和类型排序
            structure.children!.sort((a, b) => {
                // 目录优先
                if (a.type === 'directory' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'directory') return 1;
                
                // 同类型按重要性排序
                const aImportance = a.importance || 0;
                const bImportance = b.importance || 0;
                return bImportance - aImportance;
            });
            
        } catch (error) {
            console.warn(`Failed to build structure for ${dirPath}:`, error);
        }

        return structure;
    }

    /**
     * 检查目录是否被排除
     */
    private isExcludedDirectory(dirName: string): boolean {
        // 检查是否在排除列表中
        if (this.excludedDirs.includes(dirName)) {
            return true;
        }
        
        // 检查是否在包含列表中（如果有的话）
        if (this.includedDirs.length > 0 && !this.includedDirs.includes(dirName)) {
            return true;
        }
        
        // 检查隐藏目录（除了重要的配置目录）
        if (dirName.startsWith('.') && !['src', 'lib', 'app', '.github', '.vscode'].includes(dirName)) {
            return true;
        }
        
        return false;
    }

    /**
     * 检查文件是否被排除
     */
    private isExcludedFile(fileName: string): boolean {
        // 检查精确匹配
        if (this.excludedFiles.includes(fileName)) {
            return true;
        }
        
        // 检查是否在包含列表中（如果有的话）
        if (this.includedFiles.length > 0) {
            const ext = path.extname(fileName).toLowerCase();
            const isIncluded = this.includedFiles.includes(fileName) || 
                              this.includedFiles.some(pattern => pattern.endsWith(ext));
            if (!isIncluded) {
                return true;
            }
        }
        
        // 检查文件扩展名
        const ext = path.extname(fileName).toLowerCase();
        if (this.excludedFiles.includes(ext)) {
            return true;
        }

        // 检查模式匹配
        for (const pattern of this.excludedFiles) {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                if (regex.test(fileName)) {
                    return true;
                }
            }
        }
        
        // 检查隐藏文件（除了重要的配置文件）
        if (fileName.startsWith('.') && !this.isImportantFile(fileName)) {
            return true;
        }

        return false;
    }

    /**
     * 获取支持的编程语言
     */
    static getSupportedLanguages(): string[] {
        return [
            '.js', '.jsx', '.ts', '.tsx',
            '.py', '.java', '.c', '.cpp', '.h', '.hpp',
            '.cs', '.php', '.rb', '.go', '.rs',
            '.html', '.css', '.scss', '.sass', '.less',
            '.json', '.xml', '.yaml', '.yml',
            '.md', '.txt', '.sql', '.sh', '.bat'
        ];
    }

    /**
     * 获取语言统计信息
     */
    getLanguageStats(files: FileInfo[]): Record<string, { count: number; size: number }> {
        const stats: Record<string, { count: number; size: number }> = {};

        for (const file of files) {
            const ext = file.extension || 'unknown';
            if (!stats[ext]) {
                stats[ext] = { count: 0, size: 0 };
            }
            stats[ext].count++;
            stats[ext].size += file.size;
        }

        return stats;
    }
    
    /**
     * 获取文件语言
     */
    private getFileLanguage(filePath: string): string {
        const extension = path.extname(filePath).toLowerCase();
        return this.languageMap.get(extension) || 'Unknown';
    }
    
    /**
     * 智能文件扫描 - 根据项目类型和重要性过滤
     */
    private async smartScanFiles(projectPath: string, projectType: string): Promise<string[]> {
        const allFiles = await this.scanFiles(projectPath);
        
        // 根据项目类型调整扫描策略
        let filteredFiles = allFiles;
        
        // 对于大型项目，优先扫描重要文件
        if (allFiles.length > 1000) {
            filteredFiles = allFiles.filter(file => {
                const fileName = path.basename(file);
                const relativePath = path.relative(projectPath, file);
                
                // 保留重要文件
                if (this.isImportantFile(fileName)) {
                    return true;
                }
                
                // 保留浅层目录的文件
                const depth = relativePath.split(path.sep).length;
                if (depth <= 3) {
                    return true;
                }
                
                // 保留代码文件
                const extension = path.extname(file).toLowerCase();
                const fileType = this.fileTypeMap.get(extension);
                return fileType === FileType.CODE || fileType === FileType.CONFIG;
            });
        }
        
        return filteredFiles;
    }
    
    /**
     * 获取项目摘要信息
     */
    getProjectSummary(result: ProjectAnalysisResult): string {
        const { projectName, projectType, totalFiles, languages, totalSize } = result;
        const mainLanguage = languages[0]?.language || 'Unknown';
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        return `${projectName} is a ${projectType} project with ${totalFiles} files, primarily written in ${mainLanguage}. Total size: ${sizeInMB}MB.`;
    }
}