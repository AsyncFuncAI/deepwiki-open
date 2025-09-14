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
exports.WikiGenerator = void 0;
const path = __importStar(require("path"));
const VectorRetriever_1 = require("./VectorRetriever");
const fs_1 = require("fs");
const DocumentProcessor_1 = require("./DocumentProcessor");
const RAGProcessor_1 = require("./RAGProcessor");
const LangChainModelManager_1 = require("./LangChainModelManager");
/**
 * Wiki 生成器
 * 负责基于项目分析结果生成 Wiki 文档
 */
class WikiGenerator {
    constructor(config) {
        this.projectPath = '';
        console.log('WikiGenerator constructor called with config provider:', config.provider);
        this.config = config;
        console.log('Initializing VectorRetriever...');
        this.vectorRetriever = new VectorRetriever_1.VectorRetriever(config);
        console.log('VectorRetriever initialized successfully');
        // 初始化文档处理器
        console.log('Initializing DocumentProcessor...');
        this.documentProcessor = new DocumentProcessor_1.DocumentProcessor({
            maxFileSize: 1024 * 1024, // 1MB
            maxTokens: 100000,
            chunkSize: 1000,
            chunkOverlap: 200,
            excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.deepwiki/**'],
            includePatterns: ['**/*.ts', '**/*.js', '**/*.md', '**/*.json', '**/*.py', '**/*.java', '**/*.cpp', '**/*.h']
        });
        console.log('DocumentProcessor initialized successfully');
        // 初始化 LangChain 模型管理器
        console.log('Initializing LangChainModelManager with provider:', config.provider || 'openai');
        this.langChainManager = new LangChainModelManager_1.LangChainModelManager(config);
        console.log('LangChainModelManager initialized successfully');
        // 初始化 RAGProcessor
        console.log('Initializing RAGProcessor...');
        this.ragProcessor = new RAGProcessor_1.RAGProcessor(this.vectorRetriever, config);
        console.log('RAGProcessor initialized successfully');
        console.log('WikiGenerator constructor completed');
    }
    /**
     * 深度研究模式生成内容
     */
    async generateDeepResearchContent(query, analysisResult, conversationHistory = [], iterationType = 'first', progressCallback) {
        progressCallback?.(0, 'Starting deep research analysis...');
        try {
            // 设置项目路径
            this.projectPath = analysisResult.projectPath || '';
            // 构建深度研究配置
            const deepResearchConfig = {
                iterationType,
                repositoryType: 'local',
                repositoryUrl: this.projectPath,
                repositoryName: analysisResult.projectName,
                language: 'zh-CN',
                researchIteration: conversationHistory.length + 1,
                isDeepResearch: true
            };
            progressCallback?.(30, 'Building context from project documents...');
            // 获取相关文档（这里可以集成向量检索）
            const documents = await this.getRelevantDocuments(query, analysisResult);
            progressCallback?.(60, 'Generating deep research content...');
            // 构建仓库信息
            const repositoryInfo = {
                name: analysisResult.projectName,
                type: 'local',
                language: analysisResult.languages?.[0]?.language || 'Unknown'
            };
            // 使用 LangChain 模型管理器生成深度研究内容
            const result = await this.langChainManager.generateDeepResearchContent(query, deepResearchConfig, conversationHistory, '', // contextText
            '', // fileContent
            documents, repositoryInfo);
            progressCallback?.(100, 'Deep research analysis complete!');
            return result;
        }
        catch (error) {
            console.error('Deep research content generation failed:', error);
            throw error;
        }
    }
    /**
     * 获取与查询相关的文档
     */
    async getRelevantDocuments(query, analysisResult) {
        try {
            // 这里可以使用向量检索来获取相关文档
            // 目前先返回项目的主要文件信息
            const documents = [];
            // 添加主要文件的内容
            if (analysisResult.files && analysisResult.files.length > 0) {
                for (const file of analysisResult.files.slice(0, 10)) { // 限制文件数量
                    try {
                        const content = await fs_1.promises.readFile(file.path, 'utf8');
                        documents.push({
                            id: file.path,
                            content: content.substring(0, 2000), // 限制内容长度
                            metadata: {
                                filePath: file.path,
                                language: file.language,
                                size: file.size
                            }
                        });
                    }
                    catch (error) {
                        console.warn(`Failed to read file ${file.path}:`, error);
                    }
                }
            }
            return documents;
        }
        catch (error) {
            console.error('Failed to get relevant documents:', error);
            return [];
        }
    }
    /**
     * 生成 Wiki
     */
    async generateWiki(analysisResult, progressCallback) {
        progressCallback?.(0, 'Starting Wiki generation...');
        // 设置项目路径
        this.projectPath = analysisResult.projectPath || '';
        const wikiData = {
            projectName: analysisResult.projectName,
            overview: '',
            architecture: '',
            fileStructure: '',
            codeAnalysis: [],
            dependencies: '',
            setup: '',
            usage: '',
            generatedAt: new Date()
        };
        // 生成项目概览
        progressCallback?.(10, 'Generating project overview...');
        wikiData.overview = await this.generateOverview(analysisResult);
        // 生成架构说明
        progressCallback?.(25, 'Analyzing project architecture...');
        wikiData.architecture = await this.generateArchitecture(analysisResult);
        // 生成文件结构
        progressCallback?.(40, 'Building file structure...');
        wikiData.fileStructure = this.generateFileStructure(analysisResult);
        // 生成代码分析
        progressCallback?.(55, 'Analyzing code sections...');
        wikiData.codeAnalysis = await this.generateCodeAnalysis(analysisResult, progressCallback);
        // 生成依赖说明
        progressCallback?.(80, 'Analyzing dependencies...');
        wikiData.dependencies = await this.generateDependencies(analysisResult);
        // 生成设置和使用说明
        progressCallback?.(90, 'Generating setup and usage...');
        wikiData.setup = await this.generateSetup(analysisResult);
        wikiData.usage = await this.generateUsage(analysisResult);
        // 自动进行向量化
        progressCallback?.(95, 'Performing vectorization...');
        try {
            await this.performVectorization(analysisResult, wikiData, progressCallback);
            console.log('Wiki 向量化完成');
        }
        catch (error) {
            console.error('Wiki 向量化失败:', error);
            // 向量化失败不影响 Wiki 生成
        }
        progressCallback?.(100, 'Wiki generation complete!');
        return wikiData;
    }
    /**
     * 保存向量化缓存
     */
    async saveVectorCache(documents) {
        try {
            const cacheDir = path.join(this.projectPath, '.deepwiki', 'cache');
            const vectorCacheFile = path.join(cacheDir, 'vectors.json');
            // 确保缓存目录存在
            await fs_1.promises.mkdir(cacheDir, { recursive: true });
            // 获取向量化统计信息
            const stats = this.vectorRetriever.getStats();
            const cacheData = {
                version: '1.0.0',
                generatedAt: new Date().toISOString(),
                config: {
                    provider: this.config.embedderConfig?.provider || 'local',
                    model: this.config.embedderConfig?.model || 'tfidf',
                    dimensions: this.config.embedderConfig?.dimensions || 100
                },
                stats,
                documents: documents.map(doc => ({
                    id: doc.id,
                    content: doc.content.substring(0, 500), // 只保存前500字符用于预览
                    metadata: doc.metadata
                }))
            };
            await fs_1.promises.writeFile(vectorCacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
            console.log(`向量化缓存已保存到: ${vectorCacheFile}`);
        }
        catch (error) {
            console.error('保存向量化缓存失败:', error);
        }
    }
    /**
     * 加载向量化缓存
     */
    async loadVectorCache() {
        try {
            const cacheDir = path.join(this.projectPath, '.deepwiki', 'cache');
            const vectorCacheFile = path.join(cacheDir, 'vectors.json');
            const cacheData = JSON.parse(await fs_1.promises.readFile(vectorCacheFile, 'utf8'));
            // 检查缓存版本和配置是否匹配
            const currentConfig = {
                provider: this.config.embedderConfig?.provider || 'local',
                model: this.config.embedderConfig?.model || 'tfidf',
                dimensions: this.config.embedderConfig?.dimensions || 100
            };
            if (JSON.stringify(cacheData.config) !== JSON.stringify(currentConfig)) {
                console.log('向量化配置已更改，需要重新生成向量');
                return false;
            }
            console.log(`找到向量化缓存，包含 ${cacheData.documents.length} 个文档`);
            return true;
        }
        catch (error) {
            console.log('未找到向量化缓存或加载失败:', error instanceof Error ? error.message : String(error));
            return false;
        }
    }
    /**
     * 获取向量检索器实例
     */
    getVectorRetriever() {
        return this.vectorRetriever;
    }
    /**
     * 重建向量索引
     */
    async rebuildVectorIndex(analysisResult) {
        console.log('开始重建向量索引...');
        // 重置向量检索器
        this.vectorRetriever.reset();
        // 删除旧的缓存
        try {
            const cacheDir = path.join(this.projectPath, '.deepwiki', 'cache');
            const vectorCacheFile = path.join(cacheDir, 'vectors.json');
            await fs_1.promises.unlink(vectorCacheFile);
        }
        catch (error) {
            // 忽略删除失败的错误
        }
        // 重新生成 Wiki 和向量化
        await this.generateWiki(analysisResult);
        console.log('向量索引重建完成');
    }
    /**
     * 生成项目概览
     */
    async generateOverview(analysisResult) {
        const { projectName, totalFiles, totalSize, languages } = analysisResult;
        const projectType = this.detectProjectType(analysisResult);
        const totalLines = analysisResult.files.reduce((sum, file) => sum + (file.content ? file.content.split('\n').length : 0), 0);
        const techStack = this.generateTechStack(analysisResult);
        const mainDirs = this.getMainDirectories(analysisResult);
        const architecturePatterns = this.analyzeArchitecturePatterns(analysisResult);
        let overview = `# 📚 ${projectName}\n\n`;
        overview += `> 🚀 **项目文档** - 自动生成于 ${new Date().toLocaleDateString('zh-CN')}\n\n`;
        overview += `---\n\n`;
        overview += `## 📊 项目概览\n\n`;
        overview += `<div style="display: flex; gap: 20px; margin: 20px 0;">\n`;
        overview += `  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; flex: 1;">\n`;
        overview += `    <h3 style="margin: 0; font-size: 16px;">📁 项目类型</h3>\n`;
        overview += `    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${projectType.toUpperCase()}</p>\n`;
        overview += `  </div>\n`;
        overview += `  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px; border-radius: 10px; flex: 1;">\n`;
        overview += `    <h3 style="margin: 0; font-size: 16px;">📄 文件总数</h3>\n`;
        overview += `    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${totalFiles.toLocaleString()}</p>\n`;
        overview += `  </div>\n`;
        overview += `  <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px; border-radius: 10px; flex: 1;">\n`;
        overview += `    <h3 style="margin: 0; font-size: 16px;">📝 代码行数</h3>\n`;
        overview += `    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${totalLines.toLocaleString()}</p>\n`;
        overview += `  </div>\n`;
        overview += `  <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 15px; border-radius: 10px; flex: 1;">\n`;
        overview += `    <h3 style="margin: 0; font-size: 16px;">💾 项目大小</h3>\n`;
        overview += `    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${this.formatFileSize(totalSize)}</p>\n`;
        overview += `  </div>\n`;
        overview += `</div>\n\n`;
        overview += `---\n\n`;
        overview += `## 🛠️ 主要技术栈\n\n`;
        overview += `${techStack}\n\n`;
        overview += `---\n\n`;
        overview += `## 🏗️ 项目结构\n\n`;
        overview += mainDirs.map(dir => `### 📂 ${dir.name}\n${dir.description}\n`).join('\n');
        overview += `---\n\n`;
        overview += `## 🎯 架构模式\n\n`;
        overview += architecturePatterns.length > 0 ?
            architecturePatterns.map(pattern => `- 🔧 **${pattern}**`).join('\n') :
            '- 🔍 **未检测到特定架构模式**';
        overview += `\n\n---\n\n`;
        // 如果配置了 AI，尝试生成更详细的概览
        if (this.config.provider && this.config.apiKey) {
            try {
                const aiPrompt = `为项目"${projectName}"生成一个全面且引人入胜的项目概览。请包含项目目的、核心功能、目标用户和独特卖点。要求专业且易于理解。请基于已有的项目分析结果，提供深度的架构洞察和项目能力说明，帮助用户快速理解这个项目能做什么以及它的技术架构特点。`;
                const aiOverview = await this.generateAIContent(aiPrompt, overview);
                return aiOverview || overview;
            }
            catch (error) {
                console.warn('AI overview generation failed, using default:', error);
                return overview;
            }
        }
        return overview;
    }
    /**
     * 生成架构说明
     */
    async generateArchitecture(analysisResult) {
        const patterns = this.analyzeArchitecturePatterns(analysisResult);
        const mainDirs = this.getMainDirectories(analysisResult);
        const projectType = this.detectProjectType(analysisResult);
        let architecture = `# 🏛️ 系统架构\n\n`;
        // 架构概述
        architecture += `## 📋 架构概述\n\n`;
        architecture += `> 本项目采用 **${projectType.toUpperCase()}** 技术栈，具有以下架构特征：\n\n`;
        // 检测到的架构模式
        if (patterns.length > 0) {
            architecture += `## 🎯 架构模式\n\n`;
            patterns.forEach(pattern => {
                architecture += `### 🔧 ${pattern}\n`;
                architecture += this.getPatternDescription(pattern) + '\n\n';
            });
        }
        else {
            architecture += `## 🎯 架构模式\n\n`;
            architecture += `📝 **简单架构**: 项目采用简单直接的架构模式，适合快速开发和维护。\n\n`;
        }
        // 目录结构说明
        architecture += `## 📁 核心目录结构\n\n`;
        architecture += `\`\`\`\n`;
        architecture += `${analysisResult.projectName}/\n`;
        mainDirs.forEach(dir => {
            architecture += `├── ${dir.name}/\n`;
        });
        architecture += `\`\`\`\n\n`;
        // 详细目录说明
        architecture += `### 📂 目录说明\n\n`;
        mainDirs.forEach(dir => {
            architecture += `#### ${dir.name}\n`;
            architecture += `${dir.description}\n\n`;
        });
        // 数据流图
        architecture += `## 🔄 数据流向\n\n`;
        architecture += this.generateDataFlowDescription(analysisResult);
        return architecture;
    }
    /**
     * 获取架构模式描述
     */
    getPatternDescription(pattern) {
        const descriptions = {
            'MVC': '📊 **Model-View-Controller**: 将应用程序分为模型、视图和控制器三个核心组件，实现关注点分离。',
            'MVP': '🎭 **Model-View-Presenter**: 类似于MVC，但Presenter负责处理所有UI逻辑。',
            'MVVM': '🔗 **Model-View-ViewModel**: 通过数据绑定实现视图和模型的分离。',
            'Microservices': '🌐 **微服务架构**: 将应用程序构建为一套小型服务，每个服务运行在自己的进程中。',
            'Layered': '🏗️ **分层架构**: 将应用程序组织成水平层，每层只与相邻层通信。',
            'Component-based': '🧩 **组件化架构**: 基于可重用组件构建应用程序。',
            'RESTful': '🌍 **RESTful API**: 遵循REST架构风格的Web服务设计。'
        };
        return descriptions[pattern] || `🔧 **${pattern}**: 项目采用${pattern}架构模式。`;
    }
    /**
     * 生成数据流描述
     */
    generateDataFlowDescription(analysisResult) {
        const projectType = this.detectProjectType(analysisResult);
        const mainDirs = this.getMainDirectories(analysisResult);
        const files = analysisResult.files;
        // 根据实际项目结构生成架构图
        let mermaidCode = 'graph TD\n';
        // 检测项目的实际架构模式
        const hasComponents = mainDirs.some(dir => dir.name === 'components');
        const hasPages = mainDirs.some(dir => dir.name === 'pages' || dir.name === 'views');
        const hasApi = mainDirs.some(dir => dir.name === 'api' || dir.name === 'routes');
        const hasServices = mainDirs.some(dir => dir.name === 'services');
        const hasUtils = mainDirs.some(dir => dir.name === 'utils' || dir.name === 'helpers');
        const hasStore = mainDirs.some(dir => dir.name === 'store' || dir.name === 'state');
        const hasModels = mainDirs.some(dir => dir.name === 'models');
        const hasControllers = mainDirs.some(dir => dir.name === 'controllers');
        const hasMiddleware = mainDirs.some(dir => dir.name === 'middleware');
        const hasDatabase = mainDirs.some(dir => dir.name === 'database' || dir.name === 'db');
        // 检测配置文件
        const hasPackageJson = files.some(f => f.relativePath === 'package.json');
        const hasReactFiles = files.some(f => f.relativePath.endsWith('.jsx') || f.relativePath.endsWith('.tsx'));
        const hasVueFiles = files.some(f => f.relativePath.endsWith('.vue'));
        const hasExpressFiles = files.some(f => f.content && f.content.includes('express'));
        const hasNextJs = files.some(f => f.relativePath === 'next.config.js' || f.content?.includes('next'));
        const hasNuxtJs = files.some(f => f.relativePath === 'nuxt.config.js' || f.content?.includes('nuxt'));
        if (hasReactFiles || hasVueFiles || hasNextJs || hasNuxtJs) {
            // 前端项目架构
            mermaidCode += '    A[用户界面] --> B[路由系统]\n';
            if (hasComponents) {
                mermaidCode += '    B --> C[组件层]\n';
                mermaidCode += '    C --> D[业务组件]\n';
            }
            if (hasStore) {
                mermaidCode += '    D --> E[状态管理]\n';
                mermaidCode += '    E --> F[数据层]\n';
            }
            else {
                mermaidCode += '    D --> F[数据层]\n';
            }
            if (hasApi) {
                mermaidCode += '    F --> G[API接口]\n';
                mermaidCode += '    G --> H[后端服务]\n';
            }
            if (hasUtils) {
                mermaidCode += '    D --> I[工具函数]\n';
            }
        }
        else if (hasExpressFiles || hasControllers || hasMiddleware) {
            // 后端项目架构
            mermaidCode += '    A[客户端请求] --> B[路由层]\n';
            if (hasMiddleware) {
                mermaidCode += '    B --> C[中间件层]\n';
                mermaidCode += '    C --> D[控制器层]\n';
            }
            else {
                mermaidCode += '    B --> D[控制器层]\n';
            }
            if (hasServices) {
                mermaidCode += '    D --> E[服务层]\n';
                mermaidCode += '    E --> F[业务逻辑]\n';
            }
            else {
                mermaidCode += '    D --> F[业务逻辑]\n';
            }
            if (hasModels) {
                mermaidCode += '    F --> G[数据模型]\n';
            }
            if (hasDatabase) {
                mermaidCode += '    G --> H[数据库层]\n';
            }
        }
        else if (projectType === 'python') {
            // Python 项目架构
            mermaidCode += '    A[应用入口] --> B[主模块]\n';
            if (hasModels) {
                mermaidCode += '    B --> C[数据模型]\n';
            }
            if (hasServices) {
                mermaidCode += '    B --> D[服务层]\n';
                mermaidCode += '    D --> E[业务逻辑]\n';
            }
            else {
                mermaidCode += '    B --> E[业务逻辑]\n';
            }
            if (hasUtils) {
                mermaidCode += '    E --> F[工具模块]\n';
            }
        }
        else {
            // 通用项目架构
            mermaidCode += '    A[项目入口] --> B[核心模块]\n';
            // 根据主要目录添加节点
            const importantDirs = mainDirs.filter(dir => !['node_modules', '.git', 'dist', 'build', '.vscode'].includes(dir.name)).slice(0, 4);
            importantDirs.forEach((dir, index) => {
                const nodeId = String.fromCharCode(67 + index); // C, D, E, F
                mermaidCode += `    B --> ${nodeId}[${dir.name}]\n`;
            });
        }
        return `\`\`\`mermaid\n${mermaidCode}\`\`\`\n\n`;
    }
    /**
     * 生成文件结构
     */
    generateFileStructure(analysisResult) {
        let structure = `# 📁 文件结构\n\n`;
        // 生成树状结构
        structure += `## 🌳 项目树状图\n\n`;
        structure += `\`\`\`\n`;
        structure += this.generateFileTree(analysisResult.files);
        structure += `\`\`\`\n\n`;
        // 按文件类型分组统计
        const filesByType = this.groupFilesByType(analysisResult.files);
        structure += `## 📊 文件类型统计\n\n`;
        const typeIcons = {
            'javascript': '🟨',
            'typescript': '🔷',
            'python': '🐍',
            'java': '☕',
            'css': '🎨',
            'html': '🌐',
            'json': '📋',
            'markdown': '📝',
            'other': '📄'
        };
        Object.entries(filesByType).forEach(([type, files]) => {
            const icon = typeIcons[type] || '📄';
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            structure += `### ${icon} ${type.toUpperCase()} 文件\n`;
            structure += `- **数量**: ${files.length} 个文件\n`;
            structure += `- **总大小**: ${this.formatFileSize(totalSize)}\n`;
            structure += `- **平均大小**: ${this.formatFileSize(totalSize / files.length)}\n\n`;
        });
        // 重要文件列表
        const importantFiles = this.selectImportantFiles(analysisResult.files, 10);
        if (importantFiles.length > 0) {
            structure += `## ⭐ 重要文件\n\n`;
            structure += `| 文件名 | 类型 | 大小 | 描述 |\n`;
            structure += `|--------|------|------|------|\n`;
            importantFiles.forEach(file => {
                const type = this.getFileType(path.extname(file.relativePath));
                const icon = typeIcons[type] || '📄';
                const description = this.getFileDescription(file.relativePath);
                structure += `| ${icon} ${path.basename(file.relativePath)} | ${type} | ${this.formatFileSize(file.size)} | ${description} |\n`;
            });
            structure += `\n`;
        }
        return structure;
    }
    /**
     * 生成文件树状图
     */
    generateFileTree(files) {
        const tree = {};
        // 构建树结构
        files.forEach(file => {
            const parts = file.relativePath.split('/');
            let current = tree;
            parts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = index === parts.length - 1 ? null : {};
                }
                if (current[part] !== null) {
                    current = current[part];
                }
            });
        });
        // 生成树状字符串
        return this.renderTree(tree, '', true);
    }
    /**
     * 渲染树结构
     */
    renderTree(node, prefix, isLast) {
        let result = '';
        const entries = Object.entries(node);
        entries.forEach(([key, value], index) => {
            const isLastEntry = index === entries.length - 1;
            const connector = isLastEntry ? '└── ' : '├── ';
            const icon = value === null ? '📄' : '📁';
            result += `${prefix}${connector}${icon} ${key}\n`;
            if (value !== null) {
                const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
                result += this.renderTree(value, newPrefix, isLastEntry);
            }
        });
        return result;
    }
    /**
     * 获取文件描述
     */
    getFileDescription(filePath) {
        const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
        const descriptions = {
            'index': '入口文件',
            'main': '主文件',
            'app': '应用主文件',
            'server': '服务器文件',
            'config': '配置文件',
            'router': '路由文件',
            'controller': '控制器',
            'model': '数据模型',
            'view': '视图文件',
            'component': '组件文件',
            'service': '服务文件',
            'util': '工具函数',
            'helper': '辅助函数',
            'test': '测试文件',
            'spec': '测试规范',
            'readme': '项目说明',
            'package': '包配置',
            'tsconfig': 'TypeScript配置',
            'webpack': 'Webpack配置',
            'babel': 'Babel配置'
        };
        for (const [key, desc] of Object.entries(descriptions)) {
            if (fileName.includes(key)) {
                return desc;
            }
        }
        const ext = path.extname(filePath);
        switch (ext) {
            case '.md': return '文档文件';
            case '.json': return 'JSON配置';
            case '.css': return '样式文件';
            case '.js': return 'JavaScript文件';
            case '.ts': return 'TypeScript文件';
            case '.html': return 'HTML文件';
            case '.py': return 'Python文件';
            default: return '项目文件';
        }
    }
    /**
     * 渲染结构树
     */
    renderStructureTree(node, depth) {
        const indent = '  '.repeat(depth);
        let result = `${indent}${node.name}${node.type === 'directory' ? '/' : ''}\n`;
        if (node.children) {
            for (const child of node.children.slice(0, 20)) { // 限制显示数量
                result += this.renderStructureTree(child, depth + 1);
            }
            if (node.children.length > 20) {
                result += `${indent}  ... (${node.children.length - 20} more items)\n`;
            }
        }
        return result;
    }
    /**
     * 生成代码分析
     */
    async generateCodeAnalysis(analysisResult, progressCallback) {
        const sections = [];
        // 按文件类型分组
        const filesByType = this.groupFilesByType(analysisResult.files);
        let sectionIndex = 0;
        const totalSections = Object.keys(filesByType).length;
        for (const [fileType, files] of Object.entries(filesByType)) {
            const progress = 55 + (sectionIndex / totalSections) * 20;
            progressCallback?.(progress, `Analyzing ${fileType} files...`);
            const section = await this.generateCodeSection(fileType, files, progressCallback);
            if (section) {
                sections.push(section);
            }
            sectionIndex++;
        }
        return sections;
    }
    /**
     * 生成代码章节
     */
    async generateCodeSection(fileType, files, progressCallback) {
        if (files.length === 0)
            return null;
        const typeIcons = {
            'javascript': '🟨 JavaScript',
            'typescript': '🔷 TypeScript',
            'python': '🐍 Python',
            'java': '☕ Java',
            'css': '🎨 CSS',
            'html': '🌐 HTML',
            'json': '📋 JSON',
            'markdown': '📝 Markdown',
            'other': '📄 其他'
        };
        const section = {
            title: `${typeIcons[fileType] || `📄 ${fileType.toUpperCase()}`} 文件分析`,
            content: this.generateTypeAnalysis(fileType, files),
            files: files.map(f => f.relativePath),
            codeBlocks: []
        };
        // 选择重要文件生成代码块
        const importantFiles = this.selectImportantFiles(files, 3);
        // 逐个处理重要文件，调用AI进行深度分析
        for (let i = 0; i < importantFiles.length; i++) {
            const file = importantFiles[i];
            const fileProgress = (i / importantFiles.length) * 100;
            progressCallback?.(fileProgress, `Analyzing ${file.relativePath} with AI...`);
            try {
                const codeBlock = await this.createCodeBlockWithAI(file);
                if (codeBlock) {
                    section.codeBlocks.push(codeBlock);
                }
            }
            catch (error) {
                console.error(`Failed to analyze file ${file.relativePath} with AI:`, error);
                // 如果AI分析失败，回退到基础分析
                const fallbackCodeBlock = this.createCodeBlock(file);
                if (fallbackCodeBlock) {
                    section.codeBlocks.push(fallbackCodeBlock);
                }
            }
        }
        return section;
    }
    /**
     * 生成文件类型分析
     */
    generateTypeAnalysis(type, files) {
        let analysis = `## 📊 ${type.toUpperCase()} 文件概览\n\n`;
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const totalLines = files.reduce((sum, file) => sum + (file.content ? file.content.split('\n').length : 0), 0);
        const avgSize = totalSize / files.length;
        const avgLines = totalLines / files.length;
        analysis += `### 📈 统计信息\n\n`;
        analysis += `| 指标 | 数值 |\n`;
        analysis += `|------|------|\n`;
        analysis += `| 📁 文件数量 | ${files.length} |\n`;
        analysis += `| 📏 总大小 | ${this.formatFileSize(totalSize)} |\n`;
        analysis += `| 📝 总行数 | ${totalLines.toLocaleString()} |\n`;
        analysis += `| 📊 平均大小 | ${this.formatFileSize(avgSize)} |\n`;
        analysis += `| 📋 平均行数 | ${Math.round(avgLines)} |\n\n`;
        // 文件列表
        analysis += `### 📂 文件列表\n\n`;
        files.forEach(file => {
            const description = this.getFileDescription(file.relativePath);
            analysis += `- **${path.basename(file.relativePath)}** (${this.formatFileSize(file.size)}) - ${description}\n`;
        });
        analysis += `\n`;
        // 类型特定分析
        analysis += this.getTypeSpecificAnalysis(type, files);
        return analysis;
    }
    /**
     * 获取类型特定分析
     */
    getTypeSpecificAnalysis(type, files) {
        switch (type) {
            case 'javascript':
            case 'typescript':
                return this.analyzeJSFiles(files);
            case 'python':
                return this.analyzePythonFiles(files);
            case 'css':
                return this.analyzeCSSFiles(files);
            case 'json':
                return this.analyzeJSONFiles(files);
            default:
                return '';
        }
    }
    /**
     * 分析 JavaScript/TypeScript 文件
     */
    analyzeJSFiles(files) {
        let analysis = `### 🔍 JavaScript/TypeScript 特性分析\n\n`;
        const features = {
            'React组件': files.filter(f => f.content?.includes('React') || f.relativePath.includes('component')).length,
            'Express路由': files.filter(f => f.content?.includes('express') || f.content?.includes('router')).length,
            '异步函数': files.filter(f => f.content?.includes('async') || f.content?.includes('await')).length,
            'ES6模块': files.filter(f => f.content?.includes('import') || f.content?.includes('export')).length,
            '类定义': files.filter(f => f.content?.includes('class ')).length
        };
        analysis += `| 特性 | 文件数 |\n`;
        analysis += `|------|--------|\n`;
        Object.entries(features).forEach(([feature, count]) => {
            if (count > 0) {
                analysis += `| ${feature} | ${count} |\n`;
            }
        });
        analysis += `\n`;
        return analysis;
    }
    /**
     * 分析 Python 文件
     */
    analyzePythonFiles(files) {
        let analysis = `### 🐍 Python 特性分析\n\n`;
        const features = {
            'Flask应用': files.filter(f => f.content?.includes('Flask')).length,
            'Django模型': files.filter(f => f.content?.includes('django')).length,
            '类定义': files.filter(f => f.content?.includes('class ')).length,
            '函数定义': files.filter(f => f.content?.includes('def ')).length,
            '装饰器': files.filter(f => f.content?.includes('@')).length
        };
        analysis += `| 特性 | 文件数 |\n`;
        analysis += `|------|--------|\n`;
        Object.entries(features).forEach(([feature, count]) => {
            if (count > 0) {
                analysis += `| ${feature} | ${count} |\n`;
            }
        });
        analysis += `\n`;
        return analysis;
    }
    /**
     * 分析 CSS 文件
     */
    analyzeCSSFiles(files) {
        let analysis = `### 🎨 CSS 特性分析\n\n`;
        const features = {
            'CSS变量': files.filter(f => f.content?.includes('--')).length,
            'Flexbox': files.filter(f => f.content?.includes('flex')).length,
            'Grid布局': files.filter(f => f.content?.includes('grid')).length,
            '媒体查询': files.filter(f => f.content?.includes('@media')).length,
            '动画': files.filter(f => f.content?.includes('animation') || f.content?.includes('transition')).length
        };
        analysis += `| 特性 | 文件数 |\n`;
        analysis += `|------|--------|\n`;
        Object.entries(features).forEach(([feature, count]) => {
            if (count > 0) {
                analysis += `| ${feature} | ${count} |\n`;
            }
        });
        analysis += `\n`;
        return analysis;
    }
    /**
     * 分析 JSON 文件
     */
    analyzeJSONFiles(files) {
        let analysis = `### 📋 JSON 文件分析\n\n`;
        const jsonTypes = {
            'package.json': files.filter(f => f.relativePath.includes('package.json')).length,
            'tsconfig.json': files.filter(f => f.relativePath.includes('tsconfig')).length,
            '配置文件': files.filter(f => f.relativePath.includes('config')).length,
            '数据文件': files.filter(f => !f.relativePath.includes('package') && !f.relativePath.includes('config')).length
        };
        analysis += `| 类型 | 文件数 |\n`;
        analysis += `|------|--------|\n`;
        Object.entries(jsonTypes).forEach(([type, count]) => {
            if (count > 0) {
                analysis += `| ${type} | ${count} |\n`;
            }
        });
        analysis += `\n`;
        return analysis;
    }
    /**
     * 使用AI创建代码块（深度分析）
     */
    async createCodeBlockWithAI(file) {
        const language = this.getLanguageFromExtension(file.extension);
        // 截取代码片段（前100行或前4000字符用于AI分析）
        const lines = file.content.split('\n');
        const maxLines = 100;
        const maxChars = 4000;
        let code = lines.slice(0, maxLines).join('\n');
        if (code.length > maxChars) {
            code = code.substring(0, maxChars) + '\n// ... (truncated for analysis)';
        }
        // 构建AI分析提示词
        const analysisPrompt = this.buildFileAnalysisPrompt(file.relativePath, language, code);
        try {
            // 调用AI进行文件分析
            const aiAnalysis = await this.generateAIContent(analysisPrompt, code);
            return {
                language,
                code,
                description: aiAnalysis || `AI-analyzed code from ${file.relativePath}`,
                filePath: file.relativePath
            };
        }
        catch (error) {
            console.error(`AI analysis failed for ${file.relativePath}:`, error);
            // 如果AI分析失败，返回null让调用者使用fallback
            return null;
        }
    }
    /**
     * 创建代码块（基础版本，作为AI分析失败时的fallback）
     */
    createCodeBlock(file) {
        const language = this.getLanguageFromExtension(file.extension);
        // 截取代码片段（前50行或前2000字符）
        const lines = file.content.split('\n');
        const maxLines = 50;
        const maxChars = 2000;
        let code = lines.slice(0, maxLines).join('\n');
        if (code.length > maxChars) {
            code = code.substring(0, maxChars) + '\n// ... (truncated)';
        }
        return {
            language,
            code,
            description: `Code from ${file.relativePath}`,
            filePath: file.relativePath
        };
    }
    /**
     * 生成依赖说明
     */
    async generateDependencies(analysisResult) {
        let dependencies = `## Dependencies\n\n`;
        // 查找包管理文件
        const packageFiles = analysisResult.files.filter(f => ['package.json', 'requirements.txt', 'Gemfile', 'go.mod', 'Cargo.toml'].includes(path.basename(f.path)));
        for (const file of packageFiles) {
            dependencies += `### ${path.basename(file.path)}\n`;
            dependencies += '```json\n';
            dependencies += file.content.substring(0, 1000); // 限制长度
            dependencies += '\n```\n\n';
        }
        if (packageFiles.length === 0) {
            dependencies += 'No dependency files found in the project.\n\n';
        }
        return dependencies;
    }
    /**
     * 生成设置说明
     */
    async generateSetup(analysisResult) {
        let setup = `## Setup Instructions\n\n`;
        // 根据项目类型生成设置说明
        const projectType = this.detectProjectType(analysisResult);
        switch (projectType) {
            case 'node':
                setup += `### Node.js Project\n`;
                setup += `1. Install dependencies: \`npm install\`\n`;
                setup += `2. Start development server: \`npm run dev\`\n`;
                setup += `3. Build for production: \`npm run build\`\n\n`;
                break;
            case 'python':
                setup += `### Python Project\n`;
                setup += `1. Create virtual environment: \`python -m venv venv\`\n`;
                setup += `2. Activate virtual environment: \`source venv/bin/activate\`\n`;
                setup += `3. Install dependencies: \`pip install -r requirements.txt\`\n\n`;
                break;
            default:
                setup += `### General Setup\n`;
                setup += `Please refer to the project documentation for specific setup instructions.\n\n`;
        }
        return setup;
    }
    /**
     * 生成使用说明
     */
    async generateUsage(analysisResult) {
        let usage = `## Usage\n\n`;
        // 查找 README 文件
        const readmeFile = analysisResult.files.find(f => path.basename(f.path).toLowerCase().startsWith('readme'));
        if (readmeFile) {
            usage += `### From README\n`;
            usage += readmeFile.content.substring(0, 2000) + '\n\n';
        }
        else {
            usage += `### Basic Usage\n`;
            usage += `Please refer to the project documentation for usage instructions.\n\n`;
        }
        return usage;
    }
    // 辅助方法
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    analyzeArchitecturePatterns(analysisResult) {
        const patterns = [];
        const files = analysisResult.files;
        const mainDirs = this.getMainDirectories(analysisResult);
        const dirNames = mainDirs.map(dir => dir.name);
        // 检查MVC模式
        const hasModels = dirNames.includes('models') || files.some(f => f.relativePath.includes('model'));
        const hasViews = dirNames.includes('views') || dirNames.includes('pages') || files.some(f => f.relativePath.includes('view'));
        const hasControllers = dirNames.includes('controllers') || files.some(f => f.relativePath.includes('controller'));
        if (hasModels && hasViews && hasControllers) {
            patterns.push('MVC');
        }
        // 检查组件化架构
        const hasComponents = dirNames.includes('components') || files.some(f => f.relativePath.includes('component'));
        if (hasComponents) {
            patterns.push('Component-based');
        }
        // 检查分层架构
        const hasServices = dirNames.includes('services');
        const hasRepositories = dirNames.includes('repositories') || files.some(f => f.relativePath.includes('repository'));
        const hasDao = files.some(f => f.relativePath.includes('dao'));
        if (hasServices || hasRepositories || hasDao) {
            patterns.push('Layered');
        }
        // 检查RESTful API
        const hasApiRoutes = dirNames.includes('api') || dirNames.includes('routes') || files.some(f => f.relativePath.includes('api') || f.relativePath.includes('route'));
        if (hasApiRoutes) {
            patterns.push('RESTful');
        }
        // 检查微服务架构
        const hasMultipleServices = dirNames.filter(name => name.includes('service')).length > 1;
        const hasDockerCompose = files.some(f => f.relativePath === 'docker-compose.yml');
        if (hasMultipleServices || hasDockerCompose) {
            patterns.push('Microservices');
        }
        // 检查事件驱动架构
        const hasEventHandlers = files.some(f => f.content && (f.content.includes('EventEmitter') ||
            f.content.includes('addEventListener') ||
            f.content.includes('event') && f.content.includes('handler')));
        if (hasEventHandlers) {
            patterns.push('Event-driven');
        }
        // 检查MVVM模式（主要用于前端）
        const hasViewModels = files.some(f => f.relativePath.includes('viewmodel') || f.relativePath.includes('vm'));
        const hasDataBinding = files.some(f => f.content && (f.content.includes('v-model') ||
            f.content.includes('useState') ||
            f.content.includes('observable')));
        if (hasViewModels || hasDataBinding) {
            patterns.push('MVVM');
        }
        // 检查单体架构
        if (patterns.length === 0 || (!hasMultipleServices && !hasDockerCompose)) {
            patterns.push('Monolithic');
        }
        return patterns;
    }
    getMainDirectories(analysisResult) {
        const mainDirs = [];
        const children = analysisResult.structure.children || [];
        for (const child of children) {
            if (child.type === 'directory') {
                mainDirs.push({
                    name: child.name,
                    description: this.getDirectoryDescription(child.name)
                });
            }
        }
        return mainDirs;
    }
    getDirectoryDescription(dirName) {
        const descriptions = {
            'src': 'Source code directory',
            'components': 'Reusable UI components',
            'pages': 'Application pages/routes',
            'api': 'API endpoints and server logic',
            'utils': 'Utility functions and helpers',
            'config': 'Configuration files',
            'assets': 'Static assets (images, fonts, etc.)',
            'styles': 'Stylesheets and styling files',
            'tests': 'Test files and test utilities',
            'docs': 'Documentation files'
        };
        return descriptions[dirName] || 'Project directory';
    }
    groupFilesByType(files) {
        const groups = {};
        for (const file of files) {
            const type = this.getFileType(file.extension);
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(file);
        }
        return groups;
    }
    getFileType(extension) {
        const typeMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.css': 'css',
            '.scss': 'scss',
            '.html': 'html',
            '.json': 'json',
            '.md': 'markdown'
        };
        return typeMap[extension] || 'other';
    }
    selectImportantFiles(files, maxCount) {
        // 按文件大小和重要性排序
        return files
            .sort((a, b) => {
            // 优先选择主要文件
            const aImportant = this.isImportantFile(a.relativePath);
            const bImportant = this.isImportantFile(b.relativePath);
            if (aImportant && !bImportant)
                return -1;
            if (!aImportant && bImportant)
                return 1;
            // 然后按大小排序
            return b.size - a.size;
        })
            .slice(0, maxCount);
    }
    isImportantFile(filePath) {
        const importantPatterns = [
            'index',
            'main',
            'app',
            'server',
            'config',
            'router',
            'controller'
        ];
        const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
        return importantPatterns.some(pattern => fileName.includes(pattern));
    }
    getLanguageFromExtension(extension) {
        const languageMap = {
            '.js': 'javascript',
            '.jsx': 'jsx',
            '.ts': 'typescript',
            '.tsx': 'tsx',
            '.py': 'python',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.css': 'css',
            '.scss': 'scss',
            '.html': 'html',
            '.json': 'json',
            '.md': 'markdown'
        };
        return languageMap[extension] || 'text';
    }
    detectProjectType(analysisResult) {
        const files = analysisResult.files;
        // 检查配置文件
        const hasPackageJson = files.some(f => f.relativePath === 'package.json');
        const hasRequirementsTxt = files.some(f => f.relativePath === 'requirements.txt');
        const hasPomXml = files.some(f => f.relativePath === 'pom.xml');
        const hasCargoToml = files.some(f => f.relativePath === 'Cargo.toml');
        const hasGemfile = files.some(f => f.relativePath === 'Gemfile');
        const hasGoMod = files.some(f => f.relativePath === 'go.mod');
        const hasComposerJson = files.some(f => f.relativePath === 'composer.json');
        // 检查文件类型
        const jsFiles = files.filter(f => f.relativePath.endsWith('.js'));
        const tsFiles = files.filter(f => f.relativePath.endsWith('.ts'));
        const jsxFiles = files.filter(f => f.relativePath.endsWith('.jsx'));
        const tsxFiles = files.filter(f => f.relativePath.endsWith('.tsx'));
        const vueFiles = files.filter(f => f.relativePath.endsWith('.vue'));
        const pyFiles = files.filter(f => f.relativePath.endsWith('.py'));
        const javaFiles = files.filter(f => f.relativePath.endsWith('.java'));
        const rustFiles = files.filter(f => f.relativePath.endsWith('.rs'));
        const rbFiles = files.filter(f => f.relativePath.endsWith('.rb'));
        const goFiles = files.filter(f => f.relativePath.endsWith('.go'));
        const phpFiles = files.filter(f => f.relativePath.endsWith('.php'));
        if (hasPackageJson && (jsFiles.length > 0 || tsFiles.length > 0)) {
            // 检查前端框架
            if (jsxFiles.length > 0 || tsxFiles.length > 0) {
                // 检查是否是Next.js
                if (files.some(f => f.relativePath === 'next.config.js' || f.content?.includes('next'))) {
                    return 'nextjs';
                }
                return 'react';
            }
            if (vueFiles.length > 0) {
                // 检查是否是Nuxt.js
                if (files.some(f => f.relativePath === 'nuxt.config.js' || f.content?.includes('nuxt'))) {
                    return 'nuxtjs';
                }
                return 'vue';
            }
            // 检查是否是Angular
            if (files.some(f => f.relativePath === 'angular.json' || f.content?.includes('@angular'))) {
                return 'angular';
            }
            // 检查是否是Express.js
            if (files.some(f => f.content && f.content.includes('express'))) {
                return 'express';
            }
            // 检查是否是Electron
            if (files.some(f => f.content && f.content.includes('electron'))) {
                return 'desktop';
            }
            // 检查是否是React Native
            if (files.some(f => f.content && f.content.includes('react-native'))) {
                return 'mobile';
            }
            return 'node';
        }
        if (hasRequirementsTxt && pyFiles.length > 0) {
            // 检查Python框架
            if (files.some(f => f.content && f.content.includes('django'))) {
                return 'django';
            }
            if (files.some(f => f.content && f.content.includes('flask'))) {
                return 'flask';
            }
            if (files.some(f => f.content && f.content.includes('fastapi'))) {
                return 'fastapi';
            }
            return 'python';
        }
        if (hasPomXml && javaFiles.length > 0) {
            // 检查Java框架
            if (files.some(f => f.content && f.content.includes('spring'))) {
                return 'spring';
            }
            return 'java';
        }
        if (hasCargoToml && rustFiles.length > 0) {
            return 'rust';
        }
        if (hasGemfile && rbFiles.length > 0) {
            // 检查Ruby框架
            if (files.some(f => f.content && f.content.includes('rails'))) {
                return 'rails';
            }
            return 'ruby';
        }
        if (hasGoMod && goFiles.length > 0) {
            return 'go';
        }
        if (hasComposerJson && phpFiles.length > 0) {
            // 检查PHP框架
            if (files.some(f => f.content && f.content.includes('laravel'))) {
                return 'laravel';
            }
            return 'php';
        }
        // 基于文件数量判断
        const fileCounts = [
            { type: 'python', count: pyFiles.length },
            { type: 'java', count: javaFiles.length },
            { type: 'javascript', count: jsFiles.length + tsFiles.length },
            { type: 'rust', count: rustFiles.length },
            { type: 'ruby', count: rbFiles.length },
            { type: 'go', count: goFiles.length },
            { type: 'php', count: phpFiles.length }
        ];
        const dominantType = fileCounts.reduce((max, current) => current.count > max.count ? current : max);
        if (dominantType.count > 0) {
            return dominantType.type;
        }
        // 检查是否是库项目
        if (files.some(f => f.relativePath === 'README.md' && f.content?.includes('library'))) {
            return 'library';
        }
        return 'unknown';
    }
    /**
     * 生成技术栈信息
     */
    generateTechStack(analysisResult) {
        const languages = analysisResult.languages || [];
        if (languages.length === 0) {
            return '未检测到主要技术栈';
        }
        return languages.map(lang => `- ${lang}`).join('\n');
    }
    /**
     * 调用 AI 生成内容
     */
    async generateAIContent(prompt, context) {
        if (!this.config.provider || !this.config.apiKey) {
            console.warn('AI provider or API key not configured');
            return context || `Generated content for: ${prompt}`;
        }
        try {
            const fullPrompt = this.buildAIPrompt(prompt, context);
            console.log('WikiGenerator generateAIContent called with provider:', this.config.provider);
            // 使用 LangChain 模型管理器生成内容
            return await this.langChainManager.generateContent(fullPrompt);
        }
        catch (error) {
            console.error('AI content generation failed:', error);
            return context || `Generated content for: ${prompt}`;
        }
    }
    /**
     * 构建文件分析专用的AI提示词
     */
    buildFileAnalysisPrompt(filePath, language, code) {
        const fileName = path.basename(filePath);
        const fileExtension = path.extname(filePath);
        let prompt = `你是一位资深软件工程师和代码分析专家。请分析以下${language}文件并提供全面的分析。\n\n`;
        prompt += `文件名: ${fileName}\n`;
        prompt += `文件路径: ${filePath}\n`;
        prompt += `编程语言: ${language}\n\n`;
        prompt += `待分析代码:\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        prompt += `请提供详细分析，包括：\n`;
        prompt += `1. **核心功能**: 这个文件的主要功能和在项目中的作用\n`;
        prompt += `2. **架构设计**: 代码的设计模式、架构思路和技术选型\n`;
        prompt += `3. **关键实现**: 重要的算法、核心逻辑和技术特点\n`;
        prompt += `4. **依赖分析**: 主要的导入模块、外部依赖和接口调用\n`;
        prompt += `5. **使用价值**: 这个模块为项目提供了什么能力，如何被其他部分使用\n\n`;
        prompt += `分析要求：\n`;
        prompt += `- 必须使用中文回答\n`;
        prompt += `- 提供深度的技术洞察，不只是表面描述\n`;
        prompt += `- 重点分析代码的业务价值和技术价值\n`;
        prompt += `- 如果代码被截断，基于可见部分进行合理推断\n`;
        prompt += `- 使用markdown格式，结构清晰，便于阅读\n`;
        prompt += `- 帮助读者快速理解这个文件在整个项目中的重要性\n\n`;
        prompt += `请开始深度分析:`;
        return prompt;
    }
    /**
     * 构建 AI 提示词
     */
    buildAIPrompt(prompt, context) {
        let fullPrompt = `你是一位专业的技术文档专家和代码分析师。请帮助生成高质量的项目文档。\n\n`;
        fullPrompt += `任务: ${prompt}\n\n`;
        if (context) {
            fullPrompt += `上下文信息:\n${context}\n\n`;
        }
        fullPrompt += `要求:\n`;
        fullPrompt += `- 必须使用中文回答\n`;
        fullPrompt += `- 使用清晰、专业的语言\n`;
        fullPrompt += `- 使用正确的markdown格式\n`;
        fullPrompt += `- 包含相关的技术细节\n`;
        fullPrompt += `- 内容要全面但简洁\n`;
        fullPrompt += `- 专注于实用信息\n`;
        fullPrompt += `- 提供深度的架构分析和项目洞察\n`;
        fullPrompt += `- 帮助用户快速理解项目的核心功能和架构\n\n`;
        fullPrompt += `请生成内容:`;
        return fullPrompt;
    }
    /**
     * 执行向量化 - 使用 DocumentProcessor 处理所有项目文档
     */
    async performVectorization(analysisResult, wikiData, progressCallback) {
        const allDocuments = [];
        progressCallback?.(96, 'Processing project documents...');
        try {
            // 使用 DocumentProcessor 递归读取和处理所有项目文档
            const projectDocuments = await this.documentProcessor.processDirectory(this.projectPath, (current, total, fileName) => {
                const progress = 96 + Math.floor((current / total) * 2); // 96-98%
                progressCallback?.(progress, `Processing ${fileName}...`);
            });
            allDocuments.push(...projectDocuments);
            console.log(`DocumentProcessor 处理了 ${projectDocuments.length} 个项目文档`);
        }
        catch (error) {
            console.error('DocumentProcessor 处理失败:', error);
            // 继续处理 Wiki 文档，即使项目文档处理失败
        }
        // 添加 Wiki 内容作为文档
        progressCallback?.(98, 'Adding wiki content to index...');
        const wikiDocuments = [
            {
                id: `wiki-overview-${analysisResult.projectName}`,
                title: 'Project Overview',
                content: wikiData.overview,
                path: 'wiki/overview',
                type: 'wiki-overview',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: 'wiki/overview',
                    isWikiContent: true
                }
            },
            {
                id: `wiki-architecture-${analysisResult.projectName}`,
                title: 'Project Architecture',
                content: wikiData.architecture,
                path: 'wiki/architecture',
                type: 'wiki-architecture',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: 'wiki/architecture',
                    isWikiContent: true
                }
            },
            {
                id: `wiki-filestructure-${analysisResult.projectName}`,
                title: 'File Structure',
                content: wikiData.fileStructure,
                path: 'wiki/filestructure',
                type: 'wiki-filestructure',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: 'wiki/filestructure',
                    isWikiContent: true
                }
            },
            {
                id: `wiki-dependencies-${analysisResult.projectName}`,
                title: 'Dependencies',
                content: wikiData.dependencies,
                path: 'wiki/dependencies',
                type: 'wiki-dependencies',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: 'wiki/dependencies',
                    isWikiContent: true
                }
            },
            {
                id: `wiki-setup-${analysisResult.projectName}`,
                title: 'Setup Guide',
                content: wikiData.setup,
                path: 'wiki/setup',
                type: 'wiki-setup',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: 'wiki/setup',
                    isWikiContent: true
                }
            },
            {
                id: `wiki-usage-${analysisResult.projectName}`,
                title: 'Usage Guide',
                content: wikiData.usage,
                path: 'wiki/usage',
                type: 'wiki-usage',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: 'wiki/usage',
                    isWikiContent: true
                }
            }
        ];
        // 添加代码分析章节
        wikiData.codeAnalysis.forEach((section, index) => {
            wikiDocuments.push({
                id: `wiki-codeanalysis-${analysisResult.projectName}-${index}`,
                title: section.title,
                content: `${section.title}\n\n${section.content}`,
                path: `wiki/codeanalysis/${index}`,
                type: 'wiki-codeanalysis',
                metadata: {
                    projectName: analysisResult.projectName,
                    filePath: `wiki/codeanalysis/${index}`,
                    sectionTitle: section.title,
                    files: section.files,
                    isWikiContent: true
                }
            });
        });
        allDocuments.push(...wikiDocuments);
        // 执行向量化
        progressCallback?.(99, `Initializing vector index for ${allDocuments.length} documents...`);
        await this.vectorRetriever.initialize(allDocuments);
        // 保存向量化结果到缓存
        await this.saveVectorCache(allDocuments);
        console.log(`向量化完成，处理了 ${allDocuments.length} 个文档 (${allDocuments.length - wikiDocuments.length} 个项目文档 + ${wikiDocuments.length} 个 Wiki 文档)`);
        // 获取处理统计信息
        const stats = this.documentProcessor.getStats();
        console.log('文档处理统计:', stats);
    }
    /**
     * 基于向量化文档进行智能问答
     */
    async queryWithRAG(question, maxResults = 10, temperature = 0.7) {
        const result = await this.ragProcessor.query({
            question,
            maxResults,
            temperature,
            includeMetadata: true
        });
        return {
            answer: result.answer,
            sources: result.sources.map(source => ({
                document: {
                    id: source.id,
                    title: source.metadata.filePath,
                    content: source.content,
                    path: source.metadata.filePath,
                    type: source.metadata.fileType,
                    metadata: source.metadata
                },
                similarity: source.similarity
            })),
            confidence: result.confidence
        };
    }
    /**
     * 获取相似文档
     */
    async getSimilarDocuments(query, maxResults = 10, threshold = 0.3) {
        return this.ragProcessor.getSimilarDocuments(query, maxResults, threshold);
    }
    /**
     * 获取 DocumentProcessor 实例
     */
    getDocumentProcessor() {
        return this.documentProcessor;
    }
    /**
     * 获取 RAGProcessor 实例
     */
    getRAGProcessor() {
        return this.ragProcessor;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        console.log('WikiGenerator updateConfig called with provider:', config.provider);
        this.config = config;
        // 更新 LangChain 模型管理器配置
        this.langChainManager.updateConfig(config);
        // 更新向量检索器配置
        this.vectorRetriever = new VectorRetriever_1.VectorRetriever(config);
        // 更新 RAGProcessor 配置
        this.ragProcessor = new RAGProcessor_1.RAGProcessor(this.vectorRetriever, config);
        console.log('WikiGenerator configuration updated successfully');
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return this.config;
    }
}
exports.WikiGenerator = WikiGenerator;
//# sourceMappingURL=WikiGenerator.js.map