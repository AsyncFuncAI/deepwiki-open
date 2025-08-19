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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
/**
 * 配置管理器
 * 负责管理插件配置、验证设置和提供配置界面
 */
class ConfigManager {
    constructor(context) {
        this.configSection = 'deepwiki';
        this.context = context;
    }
    /**
     * 获取当前配置
     */
    getConfiguration() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return {
            provider: config.get('provider', 'openai'),
            model: config.get('model', 'gpt-4'),
            apiKey: config.get('apiKey', ''),
            baseUrl: config.get('baseUrl', ''),
            workspaceId: config.get('workspaceId', ''),
            excludedDirs: config.get('excludedDirs', [
                'node_modules', '.git', 'dist', 'build', '.vscode'
            ]),
            excludedFiles: config.get('excludedFiles', [
                '*.log', '*.tmp', '*.cache'
            ]),
            embedderConfig: config.get('embedderConfig', {
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
            })
        };
    }
    /**
     * 更新配置
     */
    async updateConfiguration(key, value) {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
    /**
     * 验证配置是否完整
     */
    validateConfiguration() {
        const config = this.getConfiguration();
        const errors = [];
        // 验证 AI 模型配置
        if (!config.apiKey) {
            errors.push('AI API Key is required');
        }
        if (!config.provider) {
            errors.push('AI Provider is required');
        }
        if (!config.model) {
            errors.push('AI Model is required');
        }
        // 验证 AI provider 特定的配置
        switch (config.provider) {
            case 'openai':
                if (!config.apiKey.startsWith('sk-')) {
                    errors.push('OpenAI API key should start with "sk-"');
                }
                break;
            case 'google':
                // Google API key 验证
                break;
            case 'ollama':
                if (!config.baseUrl) {
                    errors.push('Ollama requires a base URL');
                }
                break;
            case 'azure':
                if (!config.baseUrl) {
                    errors.push('Azure requires a base URL');
                }
                break;
            case 'qwen':
                if (!config.apiKey) {
                    errors.push('Qwen requires an API key');
                }
                // workspaceId 是可选的，不强制要求
                break;
            case 'anthropic':
                if (!config.apiKey) {
                    errors.push('Anthropic requires an API key');
                }
                break;
        }
        // 验证向量模型配置
        if (!config.embedderConfig) {
            errors.push('Embedder configuration is required');
        }
        else {
            const embedderConfig = config.embedderConfig;
            if (!embedderConfig.provider) {
                errors.push('Embedder provider is required');
            }
            if (!embedderConfig.model) {
                errors.push('Embedder model is required');
            }
            if (embedderConfig.dimensions <= 0) {
                errors.push('Embedder dimensions must be positive');
            }
            if (embedderConfig.batchSize <= 0) {
                errors.push('Embedder batch size must be positive');
            }
            // 验证在线向量模型的 API Key
            if (embedderConfig.provider !== 'local' && !embedderConfig.apiKey) {
                errors.push(`Embedder API Key is required for ${embedderConfig.provider}`);
            }
            // 验证本地向量模型配置
            if (embedderConfig.provider === 'local' && !embedderConfig.localConfig) {
                errors.push('Local embedder configuration is required');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * 测试 API 连接
     */
    async testConnection(config) {
        const testConfig = config || this.getConfiguration();
        try {
            // 这里应该调用实际的 API 测试
            // 暂时返回模拟结果
            if (!testConfig.apiKey) {
                return {
                    success: false,
                    message: 'API Key is required'
                };
            }
            // TODO: 实现实际的 API 测试逻辑
            return {
                success: true,
                message: 'Connection successful'
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * 打开配置面板
     */
    async openConfigurationPanel() {
        const panel = vscode.window.createWebviewPanel('deepwikiConfig', 'DeepWiki Configuration', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.getConfigurationWebviewContent();
        // 处理来自 webview 的消息
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'getConfig':
                    panel.webview.postMessage({
                        command: 'configData',
                        data: this.getConfiguration()
                    });
                    break;
                case 'updateConfig':
                    await this.updateConfigFromWebview(message.data);
                    vscode.window.showInformationMessage('Configuration updated successfully!');
                    break;
                case 'testConnection':
                    const result = await this.testConnection(message.data);
                    panel.webview.postMessage({
                        command: 'testResult',
                        data: result
                    });
                    break;
                case 'validateConfig':
                    const validation = this.validateConfiguration();
                    panel.webview.postMessage({
                        command: 'validationResult',
                        data: validation
                    });
                    break;
            }
        });
    }
    /**
     * 从 webview 更新配置
     */
    async updateConfigFromWebview(data) {
        for (const [key, value] of Object.entries(data)) {
            await this.updateConfiguration(key, value);
        }
    }
    /**
     * 生成配置 webview 的 HTML 内容
     */
    getConfigurationWebviewContent() {
        return this.getWebviewHtml();
    }
    /**
     * 获取 webview HTML 内容
     */
    getWebviewHtml() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepWiki Configuration</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            box-sizing: border-box;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .error {
            color: var(--vscode-errorForeground);
            margin-top: 5px;
        }
        .success {
            color: var(--vscode-terminal-ansiGreen);
            margin-top: 5px;
        }
        .section {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
        }
        .help-text {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        #testResult {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        #testResult.success {
            background-color: var(--vscode-terminal-ansiGreen);
            color: var(--vscode-editor-background);
        }
        #testResult.error {
            background-color: var(--vscode-errorBackground);
            color: var(--vscode-errorForeground);
        }
    </style>
</head>
<body>
    <h1>DeepWiki Configuration</h1>
    
    <div class="section">
        <div class="section-title">AI Provider Settings</div>
        
        <div class="form-group">
            <label for="provider">Provider:</label>
            <select id="provider">
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
                <option value="ollama">Ollama</option>
                <option value="azure">Azure</option>
                <option value="deepseek">DeepSeek</option>
                <option value="qwen">Qwen</option>
                <option value="zhipu">Zhipu</option>
                <option value="moonshot">Moonshot</option>
            </select>
            <div class="help-text">Choose your AI provider</div>
        </div>
        
        <div class="form-group">
            <label for="model">Model:</label>
            <input type="text" id="model" placeholder="e.g., gpt-4, gemini-pro">
            <div class="help-text">Model name to use for generation</div>
        </div>
        
        <div class="form-group">
            <label for="apiKey">API Key:</label>
            <input type="password" id="apiKey" placeholder="Your API key">
            <div class="help-text">API key for the selected provider</div>
        </div>
        
        <div class="form-group">
            <label for="baseUrl">Base URL (Optional):</label>
            <input type="text" id="baseUrl" placeholder="https://api.openai.com/v1">
            <div class="help-text">Custom API endpoint (required for Ollama and Azure)</div>
        </div>
        
        <button class="button secondary" onclick="testConnection()">Test Connection</button>
        <div id="testResult"></div>
    </div>
    
    <div class="section">
        <div class="section-title">Vector Embedder Settings</div>
        
        <div class="form-group">
            <label for="embedderProvider">Embedder Provider:</label>
            <select id="embedderProvider" onchange="toggleEmbedderConfig()">
                <option value="local">Local (TF-IDF)</option>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
                <option value="ollama">Ollama</option>
                <option value="azure">Azure</option>
                <option value="deepseek">DeepSeek</option>
                <option value="qwen">Qwen</option>
                <option value="zhipu">Zhipu</option>
                <option value="moonshot">Moonshot</option>
            </select>
            <div class="help-text">Choose your vector embedder provider</div>
        </div>
        
        <div class="form-group">
            <label for="embedderModel">Embedder Model:</label>
            <input type="text" id="embedderModel" placeholder="e.g., text-embedding-3-small, tfidf">
            <div class="help-text">Model name for vector embeddings</div>
        </div>
        
        <div id="embedderApiKeyGroup" class="form-group">
            <label for="embedderApiKey">Embedder API Key:</label>
            <input type="password" id="embedderApiKey" placeholder="API key for embedder (if different from AI provider)">
            <div class="help-text">API key for the embedder provider (leave empty to use AI provider key)</div>
        </div>
        
        <div id="embedderBaseUrlGroup" class="form-group">
            <label for="embedderBaseUrl">Embedder Base URL:</label>
            <input type="text" id="embedderBaseUrl" placeholder="https://api.openai.com/v1">
            <div class="help-text">Custom API endpoint for embedder</div>
        </div>
        
        <div class="form-group">
            <label for="embedderDimensions">Vector Dimensions:</label>
            <input type="number" id="embedderDimensions" value="256" min="1" max="4096">
            <div class="help-text">Dimension size for vector embeddings</div>
        </div>
        
        <div class="form-group">
            <label for="embedderBatchSize">Batch Size:</label>
            <input type="number" id="embedderBatchSize" value="10" min="1" max="100">
            <div class="help-text">Number of documents to process in each batch</div>
        </div>
        
        <div id="localEmbedderConfig" class="form-group">
            <div class="section-title" style="font-size: 1em; margin-bottom: 10px;">Local Embedder Settings</div>
            
            <div class="form-group">
                <label for="localAlgorithm">Algorithm:</label>
                <select id="localAlgorithm">
                    <option value="tfidf">TF-IDF</option>
                    <option value="word2vec">Word2Vec</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="maxFeatures">Max Features:</label>
                <input type="number" id="maxFeatures" value="5000" min="100" max="50000">
                <div class="help-text">Maximum number of features for TF-IDF</div>
            </div>
            
            <div class="form-group">
                <label for="minDf">Min Document Frequency:</label>
                <input type="number" id="minDf" value="1" min="1" max="100">
                <div class="help-text">Minimum document frequency for terms</div>
            </div>
            
            <div class="form-group">
                <label for="maxDf">Max Document Frequency:</label>
                <input type="number" id="maxDf" value="0.95" min="0.1" max="1" step="0.05">
                <div class="help-text">Maximum document frequency ratio for terms</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Project Analysis Settings</div>
        
        <div class="form-group">
            <label for="excludedDirs">Excluded Directories:</label>
            <textarea id="excludedDirs" rows="3" placeholder="node_modules, .git, dist"></textarea>
            <div class="help-text">Comma-separated list of directories to exclude</div>
        </div>
        
        <div class="form-group">
            <label for="excludedFiles">Excluded File Patterns:</label>
            <textarea id="excludedFiles" rows="3" placeholder="*.log, *.tmp, *.cache"></textarea>
            <div class="help-text">Comma-separated list of file patterns to exclude</div>
        </div>
    </div>
    
    <div class="form-group">
        <button class="button" onclick="saveConfiguration()">Save Configuration</button>
        <button class="button secondary" onclick="validateConfiguration()">Validate</button>
    </div>
    
    <div id="validationResult"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'getConfig' });
        });
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'configData':
                    loadConfiguration(message.data);
                    break;
                case 'testResult':
                    showTestResult(message.data);
                    break;
                case 'validationResult':
                    showValidationResult(message.data);
                    break;
            }
        });
        
        function loadConfiguration(config) {
            // AI Provider settings
            document.getElementById('provider').value = config.provider || 'openai';
            document.getElementById('model').value = config.model || '';
            document.getElementById('apiKey').value = config.apiKey || '';
            document.getElementById('baseUrl').value = config.baseUrl || '';
            
            // Embedder settings
            const embedderConfig = config.embedderConfig || {};
            document.getElementById('embedderProvider').value = embedderConfig.provider || 'local';
            document.getElementById('embedderModel').value = embedderConfig.model || 'tfidf';
            document.getElementById('embedderApiKey').value = embedderConfig.apiKey || '';
            document.getElementById('embedderBaseUrl').value = embedderConfig.baseUrl || '';
            document.getElementById('embedderDimensions').value = embedderConfig.dimensions || 256;
            document.getElementById('embedderBatchSize').value = embedderConfig.batchSize || 10;
            
            // Local embedder settings
            const localConfig = embedderConfig.localConfig || {};
            document.getElementById('localAlgorithm').value = localConfig.algorithm || 'tfidf';
            document.getElementById('maxFeatures').value = localConfig.maxFeatures || 5000;
            document.getElementById('minDf').value = localConfig.minDf || 1;
            document.getElementById('maxDf').value = localConfig.maxDf || 0.95;
            
            // Project settings
            document.getElementById('excludedDirs').value = (config.excludedDirs || []).join(', ');
            document.getElementById('excludedFiles').value = (config.excludedFiles || []).join(', ');
            
            // Toggle embedder config visibility
            toggleEmbedderConfig();
        }
        
        function saveConfiguration() {
            const embedderProvider = document.getElementById('embedderProvider').value;
            
            const config = {
                provider: document.getElementById('provider').value,
                model: document.getElementById('model').value,
                apiKey: document.getElementById('apiKey').value,
                baseUrl: document.getElementById('baseUrl').value,
                excludedDirs: document.getElementById('excludedDirs').value.split(',').map(s => s.trim()).filter(s => s),
                excludedFiles: document.getElementById('excludedFiles').value.split(',').map(s => s.trim()).filter(s => s),
                embedderConfig: {
                    provider: embedderProvider,
                    model: document.getElementById('embedderModel').value,
                    apiKey: document.getElementById('embedderApiKey').value,
                    baseUrl: document.getElementById('embedderBaseUrl').value,
                    dimensions: parseInt(document.getElementById('embedderDimensions').value) || 256,
                    batchSize: parseInt(document.getElementById('embedderBatchSize').value) || 10,
                    localConfig: embedderProvider === 'local' ? {
                        algorithm: document.getElementById('localAlgorithm').value,
                        maxFeatures: parseInt(document.getElementById('maxFeatures').value) || 5000,
                        minDf: parseInt(document.getElementById('minDf').value) || 1,
                        maxDf: parseFloat(document.getElementById('maxDf').value) || 0.95
                    } : undefined
                }
            };
            
            vscode.postMessage({
                command: 'updateConfig',
                data: config
            });
        }
        
        function testConnection() {
            const config = {
                provider: document.getElementById('provider').value,
                model: document.getElementById('model').value,
                apiKey: document.getElementById('apiKey').value,
                baseUrl: document.getElementById('baseUrl').value,
                excludedDirs: document.getElementById('excludedDirs').value.split(',').map(s => s.trim()).filter(s => s),
                excludedFiles: document.getElementById('excludedFiles').value.split(',').map(s => s.trim()).filter(s => s)
            };
            
            vscode.postMessage({ 
                command: 'testConnection',
                data: config
            });
        }
        
        function validateConfiguration() {
            vscode.postMessage({ command: 'validateConfig' });
        }
        
        function showTestResult(result) {
            const resultDiv = document.getElementById('testResult');
            resultDiv.style.display = 'block';
            resultDiv.textContent = result.message;
            resultDiv.className = result.success ? 'success' : 'error';
        }
        
        function showValidationResult(result) {
            const resultDiv = document.getElementById('validationResult');
            
            if (result.isValid) {
                resultDiv.innerHTML = '<div class="success">Configuration is valid!</div>';
            } else {
                const errorList = result.errors.map(error => '<div class="error">• ' + error + '</div>').join('');
                resultDiv.innerHTML = '<div class="error">Configuration errors:</div>' + errorList;
            }
        }
        
        function toggleEmbedderConfig() {
            const provider = document.getElementById('embedderProvider').value;
            const apiKeyGroup = document.getElementById('embedderApiKeyGroup');
            const baseUrlGroup = document.getElementById('embedderBaseUrlGroup');
            const localConfig = document.getElementById('localEmbedderConfig');
            
            if (provider === 'local') {
                apiKeyGroup.style.display = 'none';
                baseUrlGroup.style.display = 'none';
                localConfig.style.display = 'block';
                
                // Set default model for local
                const modelInput = document.getElementById('embedderModel');
                if (!modelInput.value || modelInput.value === 'text-embedding-3-small') {
                    modelInput.value = 'tfidf';
                }
            } else {
                apiKeyGroup.style.display = 'block';
                baseUrlGroup.style.display = provider === 'ollama' ? 'block' : 'none';
                localConfig.style.display = 'none';
                
                // Set default model for online providers
                const modelInput = document.getElementById('embedderModel');
                if (!modelInput.value || modelInput.value === 'tfidf') {
                    switch (provider) {
                        case 'openai':
                            modelInput.value = 'text-embedding-3-small';
                            break;
                        case 'google':
                            modelInput.value = 'embedding-001';
                            break;
                        case 'ollama':
                            modelInput.value = 'nomic-embed-text';
                            break;
                        case 'azure':
                            modelInput.value = 'text-embedding-ada-002';
                            break;
                        case 'deepseek':
                            modelInput.value = 'text-embedding-v1';
                            break;
                        case 'qwen':
                            modelInput.value = 'text-embedding-v1';
                            break;
                        case 'zhipu':
                            modelInput.value = 'embedding-2';
                            break;
                        case 'moonshot':
                            modelInput.value = 'moonshot-embedding-v1';
                            break;
                        default:
                            modelInput.value = 'text-embedding-3-small';
                    }
                }
            }
        }
    </script>
</body>
</html>`;
        return html;
    }
    /**
     * 获取向量模型配置
     */
    getEmbedderConfig() {
        return this.getConfiguration().embedderConfig;
    }
    /**
     * 更新向量模型配置
     */
    async updateEmbedderConfig(embedderConfig) {
        await this.updateConfiguration('embedderConfig', embedderConfig);
    }
    /**
     * 生成向量模型配置文件
     */
    async generateEmbedderConfigFile(projectPath) {
        const embedderConfig = this.getEmbedderConfig();
        const configPath = path.join(projectPath, '.deepwiki', 'embedder.json');
        await fs_1.promises.mkdir(path.dirname(configPath), { recursive: true });
        await fs_1.promises.writeFile(configPath, JSON.stringify({ embedder: embedderConfig }, null, 2), 'utf8');
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map