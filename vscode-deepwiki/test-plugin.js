/**
 * 简单的插件功能测试脚本
 * 用于验证 DeepWiki 插件的核心功能
 */

const fs = require('fs');
const path = require('path');

// 模拟 VS Code 环境
const mockVscode = {
    workspace: {
        getConfiguration: () => ({
            get: (key) => {
                const config = {
                    'deepwiki.provider': 'openai',
                    'deepwiki.model': 'gpt-3.5-turbo',
                    'deepwiki.apiKey': '',
                    'deepwiki.baseUrl': 'https://api.openai.com/v1',
                    'deepwiki.excludedDirs': ['node_modules', '.git', 'dist'],
                    'deepwiki.excludedFiles': ['*.log', '*.tmp']
                };
                return config[key];
            }
        }),
        workspaceFolders: [{
            uri: { fsPath: __dirname }
        }]
    },
    window: {
        showInformationMessage: (msg) => console.log('INFO:', msg),
        showErrorMessage: (msg) => console.log('ERROR:', msg),
        showWarningMessage: (msg) => console.log('WARN:', msg)
    },
    Uri: {
        file: (path) => ({ fsPath: path })
    }
};

// 设置全局 vscode 模拟
global.vscode = mockVscode;

async function testProjectAnalyzer() {
    console.log('\n=== 测试 ProjectAnalyzer ===');
    
    try {
        const { ProjectAnalyzer } = require('./out/core/ProjectAnalyzer');
        const analyzer = new ProjectAnalyzer(['node_modules', '.git'], ['*.log']);
        
        console.log('✓ ProjectAnalyzer 创建成功');
        
        // 测试分析当前项目
        const result = await analyzer.analyzeProject(__dirname, (progress, message) => {
            console.log(`进度: ${progress.toFixed(1)}% - ${message}`);
        });
        
        console.log('✓ 项目分析完成');
        console.log(`  - 项目名称: ${result.projectName}`);
        console.log(`  - 文件总数: ${result.totalFiles}`);
        console.log(`  - 总大小: ${(result.totalSize / 1024).toFixed(2)} KB`);
        console.log(`  - 语言类型: ${result.languages.join(', ')}`);
        
        return result;
    } catch (error) {
        console.log('✗ ProjectAnalyzer 测试失败:', error.message);
        return null;
    }
}

async function testWikiGenerator(analysisResult) {
    console.log('\n=== 测试 WikiGenerator ===');
    
    if (!analysisResult) {
        console.log('✗ 跳过 WikiGenerator 测试（没有分析结果）');
        return null;
    }
    
    try {
        const { WikiGenerator } = require('./out/core/WikiGenerator');
        const config = {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            excludedDirs: ['node_modules'],
            excludedFiles: ['*.log']
        };
        
        const generator = new WikiGenerator(config);
        console.log('✓ WikiGenerator 创建成功');
        
        const wikiData = await generator.generateWiki(analysisResult, (progress, message) => {
            console.log(`进度: ${progress.toFixed(1)}% - ${message}`);
        });
        
        console.log('✓ Wiki 生成完成');
        console.log(`  - 项目名称: ${wikiData.projectName}`);
        console.log(`  - 概览长度: ${wikiData.overview.length} 字符`);
        console.log(`  - 代码分析章节: ${wikiData.codeAnalysis.length} 个`);
        console.log(`  - 生成时间: ${wikiData.generatedAt.toISOString()}`);
        
        return wikiData;
    } catch (error) {
        console.log('✗ WikiGenerator 测试失败:', error.message);
        return null;
    }
}

async function testCacheManager(wikiData, analysisResult) {
    console.log('\n=== 测试 CacheManager ===');
    
    if (!wikiData || !analysisResult) {
        console.log('✗ 跳过 CacheManager 测试（没有数据）');
        return;
    }
    
    try {
        const { CacheManager } = require('./out/core/CacheManager');
        const mockContext = {
            globalStorageUri: { fsPath: path.join(__dirname, '.test-cache') }
        };
        
        const cacheManager = new CacheManager(mockContext);
        console.log('✓ CacheManager 创建成功');
        
        // 测试保存缓存
        await cacheManager.saveWikiCache(__dirname, wikiData, analysisResult);
        console.log('✓ 缓存保存成功');
        
        // 测试检查缓存
        const hasCache = await cacheManager.hasCache(__dirname);
        console.log(`✓ 缓存检查: ${hasCache ? '存在' : '不存在'}`);
        
        // 测试加载缓存
        const cachedData = await cacheManager.loadWikiCache(__dirname);
        if (cachedData) {
            console.log('✓ 缓存加载成功');
            console.log(`  - 项目名称: ${cachedData.wikiData.projectName}`);
        } else {
            console.log('✗ 缓存加载失败');
        }
        
        // 测试缓存统计
        const stats = await cacheManager.getCacheStats();
        console.log(`✓ 缓存统计: ${stats.totalEntries} 个条目, ${stats.totalSize}`);
        
        // 清理测试缓存
        await cacheManager.clearProjectCache(__dirname);
        console.log('✓ 测试缓存已清理');
        
    } catch (error) {
        console.log('✗ CacheManager 测试失败:', error.message);
    }
}

async function testConfigManager() {
    console.log('\n=== 测试 ConfigManager ===');
    
    try {
        const { ConfigManager } = require('./out/config/ConfigManager');
        const mockContext = {
            globalStorageUri: { fsPath: path.join(__dirname, '.test-config') }
        };
        
        const configManager = new ConfigManager(mockContext);
        console.log('✓ ConfigManager 创建成功');
        
        // 测试获取配置
        const config = configManager.getConfiguration();
        console.log('✓ 配置获取成功');
        console.log(`  - 提供商: ${config.provider}`);
        console.log(`  - 模型: ${config.model}`);
        console.log(`  - 排除目录: ${config.excludedDirs.join(', ')}`);
        
        // 测试配置验证
        const isValid = configManager.validateConfiguration(config);
        console.log(`✓ 配置验证: ${isValid ? '有效' : '无效'}`);
        
    } catch (error) {
        console.log('✗ ConfigManager 测试失败:', error.message);
    }
}

async function runTests() {
    console.log('开始测试 DeepWiki 插件功能...');
    console.log('='.repeat(50));
    
    // 确保输出目录存在
    if (!fs.existsSync('./out')) {
        console.log('✗ 输出目录不存在，请先运行 npm run compile');
        return;
    }
    
    await testConfigManager();
    const analysisResult = await testProjectAnalyzer();
    const wikiData = await testWikiGenerator(analysisResult);
    await testCacheManager(wikiData, analysisResult);
    
    console.log('\n' + '='.repeat(50));
    console.log('测试完成！');
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };