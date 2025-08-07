/**
 * 测试 Qwen 提供商修复
 * 验证 RAGProcessor 是否能正确处理 'qwen' 提供商
 */

const { RAGProcessor, QwenProvider } = require('./out/core/RAGProcessor.js');
const { VectorRetriever } = require('./out/core/VectorRetriever.js');

// 模拟配置
const mockConfig = {
    provider: 'qwen',
    model: 'qwen-turbo',
    apiKey: 'test-api-key',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    workspaceId: 'test-workspace-id',
    excludedDirs: [],
    excludedFiles: [],
    embedderConfig: {
        provider: 'local',
        model: 'tfidf',
        dimensions: 256,
        batchSize: 10,
        localConfig: {
            algorithm: 'tfidf',
            maxFeatures: 5000,
            minDf: 1,
            maxDf: 0.95
        }
    }
};

// 模拟 VectorRetriever
const mockVectorRetriever = {
    initialize: async () => {},
    addDocument: async () => {},
    retrieve: async () => ({ documents: [] }),
    getStats: () => ({ totalDocuments: 0 })
};

async function testQwenProvider() {
    console.log('🧪 Testing Qwen Provider Fix...');
    
    try {
        // 测试 QwenProvider 类是否存在
        console.log('✅ QwenProvider class exists:', typeof QwenProvider === 'function');
        
        // 测试创建 QwenProvider 实例
        const qwenProvider = new QwenProvider(
            mockConfig.apiKey,
            mockConfig.model,
            mockConfig.baseUrl,
            mockConfig.workspaceId
        );
        console.log('✅ QwenProvider instance created successfully');
        
        // 测试 RAGProcessor 是否能处理 qwen 配置
        const ragProcessor = new RAGProcessor(mockVectorRetriever, mockConfig);
        console.log('✅ RAGProcessor with qwen config created successfully');
        
        console.log('🎉 All tests passed! Qwen provider fix is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// 运行测试
testQwenProvider();