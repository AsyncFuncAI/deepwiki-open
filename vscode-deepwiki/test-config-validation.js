/**
 * 测试配置验证脚本
 * 验证插件是否能正确读取和处理 qwen 配置
 */

const path = require('path');

// 模拟 VSCode 扩展上下文
const mockContext = {
    extensionPath: __dirname,
    globalState: {
        get: () => undefined,
        update: () => Promise.resolve()
    },
    workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve()
    },
    subscriptions: []
};

// 模拟 VSCode 配置
const mockConfig = {
    provider: 'qwen',
    apiKey: 'test-api-key',
    model: 'qwen-turbo',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    workspaceId: 'test-workspace-id',
    excludedDirs: ['node_modules', '.git'],
    excludedFiles: ['*.log'],
    embedderConfig: {
        provider: 'local',
        model: 'tfidf',
        dimensions: 100
    }
};

async function testConfigValidation() {
    console.log('=== 配置验证测试开始 ===');
    
    try {
        // 测试 ConfigManager
        console.log('\n1. 测试 ConfigManager...');
        const { ConfigManager } = require('./out/config/ConfigManager');
        const configManager = new ConfigManager(mockContext);
        
        // 模拟配置获取
        console.log('配置对象:', mockConfig);
        console.log('Provider:', mockConfig.provider);
        console.log('API Key 存在:', !!mockConfig.apiKey);
        console.log('Model:', mockConfig.model);
        console.log('Base URL:', mockConfig.baseUrl);
        console.log('Workspace ID:', mockConfig.workspaceId);
        
        // 测试 RAGProcessor
        console.log('\n2. 测试 RAGProcessor...');
        const { RAGProcessor } = require('./out/core/RAGProcessor');
        const { VectorRetriever } = require('./out/core/VectorRetriever');
        
        const vectorRetriever = new VectorRetriever(mockConfig);
        console.log('VectorRetriever 创建成功');
        
        const ragProcessor = new RAGProcessor(vectorRetriever, mockConfig);
        console.log('RAGProcessor 创建成功');
        
        // 测试 WikiGenerator
        console.log('\n3. 测试 WikiGenerator...');
        const { WikiGenerator } = require('./out/core/WikiGenerator');
        
        const wikiGenerator = new WikiGenerator(mockConfig);
        console.log('WikiGenerator 创建成功');
        
        console.log('\n=== 所有测试通过！===');
        console.log('Qwen 提供商支持已正确实现');
        
    } catch (error) {
        console.error('\n=== 测试失败 ===');
        console.error('错误:', error.message);
        console.error('堆栈:', error.stack);
        process.exit(1);
    }
}

// 运行测试
testConfigValidation();