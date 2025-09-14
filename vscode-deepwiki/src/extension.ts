import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { ConfigManager } from './config/ConfigManager';
import { ProjectAnalyzer } from './core/ProjectAnalyzer';
import { WikiGenerator } from './core/WikiGenerator';
import { CacheManager } from './core/CacheManager';
import { RAGManager } from './core/RAGManager';
import { RAGAnswer } from './types';

/**
 * 插件激活函数
 * @param context VSCode 扩展上下文
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('DeepWiki extension is now active!');
    console.log('Extension context:', context.extensionPath);

    try {
        // 初始化管理器
        console.log('Initializing managers...');
        const configManager = new ConfigManager(context);
        const config = configManager.getConfiguration();
        console.log('Configuration loaded:', {
            provider: config.provider,
            hasApiKey: !!config.apiKey,
            model: config.model,
            workspaceId: config.workspaceId
        });
        
        const projectAnalyzer = new ProjectAnalyzer(config.excludedDirs, config.excludedFiles);
        console.log('ProjectAnalyzer initialized');
        
        console.log('=== WikiGenerator Initialization Debug ===');
        console.log('Config passed to WikiGenerator:', JSON.stringify(config, null, 2));
        console.log('Provider:', config.provider);
        console.log('API Key exists:', !!config.apiKey);
        console.log('API Key length:', config.apiKey ? config.apiKey.length : 0);
        console.log('=== End WikiGenerator Debug ===');
        const wikiGenerator = new WikiGenerator(config);
        console.log('WikiGenerator initialized successfully');
        
        const cacheManager = new CacheManager(context);
        console.log('CacheManager initialized');
        
        // 获取工作区路径用于 RAGManager
        const workspaceFolder = getWorkspaceFolder();
        const workspaceRoot = workspaceFolder ? workspaceFolder.uri.fsPath : '';
        console.log('Initializing RAGManager with config provider:', config.provider);
        const ragManager = new RAGManager(config, workspaceRoot);
        console.log('RAGManager initialized successfully');
        
        console.log('All managers initialized successfully');

    // 状态栏项
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = '$(book) DeepWiki';
    statusBarItem.tooltip = 'Click to generate wiki';
    statusBarItem.command = 'deepwiki.generateWiki';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

        // 注册命令：生成 Wiki
        console.log('Registering generateWiki command...');
        const generateWikiCommand = vscode.commands.registerCommand(
            'deepwiki.generateWiki',
            async () => {
                console.log('generateWiki command executed');
                try {
                    await generateWiki(
                        configManager,
                        projectAnalyzer,
                        wikiGenerator,
                        cacheManager,
                        statusBarItem
                    );
                } catch (error) {
                    console.error('Error in generateWiki:', error);
                    vscode.window.showErrorMessage(
                        `DeepWiki Error: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        );

        // 注册命令：打开配置
        console.log('Registering openConfig command...');
        const openConfigCommand = vscode.commands.registerCommand(
            'deepwiki.openConfig',
            async () => {
                console.log('openConfig command executed');
                try {
                    await configManager.openConfigurationPanel();
                } catch (error) {
                    console.error('Error in openConfig:', error);
                    vscode.window.showErrorMessage(
                        `Configuration Error: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        );

        // 注册命令：清除缓存
        console.log('Registering clearCache command...');
        const clearCacheCommand = vscode.commands.registerCommand(
            'deepwiki.clearCache',
            async () => {
                console.log('clearCache command executed');
                try {
                    const workspaceFolder = getWorkspaceFolder();
                    if (!workspaceFolder) {
                        return;
                    }

                    await cacheManager.clearProjectCache(workspaceFolder.uri.fsPath);
                    vscode.window.showInformationMessage('DeepWiki cache cleared successfully!');
                } catch (error) {
                    console.error('Error in clearCache:', error);
                    vscode.window.showErrorMessage(
                        `Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        );

        // 注册命令：启动 RAG 聊天
        console.log('Registering startRAGChat command...');
        const startRAGChatCommand = vscode.commands.registerCommand(
            'deepwiki.startRAGChat',
            async () => {
                console.log('startRAGChat command executed');
                try {
                    await startRAGChat(configManager, ragManager, cacheManager);
                } catch (error) {
                    console.error('Error in startRAGChat:', error);
                    vscode.window.showErrorMessage(
                        `RAG Chat Error: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        );

        // 注册命令：快速问答
        console.log('Registering quickRAGQuery command...');
        const quickRAGQueryCommand = vscode.commands.registerCommand(
            'deepwiki.quickRAGQuery',
            async () => {
                console.log('quickRAGQuery command executed');
                try {
                    await quickRAGQuery(configManager, ragManager, cacheManager);
                } catch (error) {
                    console.error('Error in quickRAGQuery:', error);
                    vscode.window.showErrorMessage(
                        `Quick Query Error: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        );

        // 监听配置变更
        console.log('Setting up configuration change listener...');
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('deepwiki')) {
                console.log('DeepWiki configuration changed, updating managers...');
                try {
                    const newConfig = configManager.getConfiguration();
                    console.log('New configuration:', {
                        provider: newConfig.provider,
                        hasApiKey: !!newConfig.apiKey,
                        model: newConfig.model
                    });
                    
                    // 更新 WikiGenerator 配置
                    wikiGenerator.updateConfig(newConfig);
                    console.log('WikiGenerator configuration updated');
                    
                    // 更新 RAGManager 配置
                    ragManager.updateConfig(newConfig);
                    console.log('RAGManager configuration updated');
                    
                    vscode.window.showInformationMessage('DeepWiki configuration updated successfully!');
                } catch (error) {
                    console.error('Failed to update configuration:', error);
                    vscode.window.showErrorMessage(
                        `Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        });

        // 添加命令到订阅列表
        console.log('Adding commands to subscriptions...');
        context.subscriptions.push(
            generateWikiCommand,
            openConfigCommand,
            clearCacheCommand,
            startRAGChatCommand,
            quickRAGQueryCommand,
            configChangeListener
        );
        console.log('All commands registered successfully');

    } catch (error) {
        console.error('Error during extension activation:', error);
        vscode.window.showErrorMessage(
            `DeepWiki activation failed: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * 生成 Wiki 的主要逻辑
 */
async function generateWiki(
    configManager: ConfigManager,
    projectAnalyzer: ProjectAnalyzer,
    wikiGenerator: WikiGenerator,
    cacheManager: CacheManager,
    statusBarItem: vscode.StatusBarItem
): Promise<void> {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    const deepwikiPath = path.join(projectPath, '.deepwiki');

    // 检查配置是否完整
    const config = configManager.getConfiguration();
    if (!config.apiKey || !config.provider) {
        const result = await vscode.window.showWarningMessage(
            'DeepWiki configuration is incomplete. Please configure your AI provider settings.',
            'Open Configuration',
            'Cancel'
        );
        
        if (result === 'Open Configuration') {
            await configManager.openConfigurationPanel();
        }
        return;
    }

    // 检查是否存在缓存
    const cacheExists = await cacheManager.hasCache(projectPath);
    if (cacheExists) {
        const result = await vscode.window.showInformationMessage(
            'Found existing wiki cache. What would you like to do?',
            'Use Cache',
            'Regenerate',
            'Cancel'
        );

        if (result === 'Cancel') {
            return;
        }

        if (result === 'Use Cache') {
            await displayWikiFromCache(cacheManager, projectPath);
            return;
        }
    }

    // 显示进度
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Generating DeepWiki',
            cancellable: true
        },
        async (progress, token) => {
            try {
                // 更新状态栏
                statusBarItem.text = '$(sync~spin) Generating Wiki...';

                // 步骤 1: 分析项目 (0-40%)
                let currentProgress = 0;
                progress.report({ increment: 0, message: 'Analyzing project structure...' });
                const analysisResult = await projectAnalyzer.analyzeProject(
                    projectPath,
                    (progressPercent, message) => {
                        const newProgress = Math.round(progressPercent * 0.4);
                        const increment = newProgress - currentProgress;
                        if (increment > 0) {
                            progress.report({ increment, message });
                            currentProgress = newProgress;
                        }
                    }
                );

                if (token.isCancellationRequested) {
                    return;
                }

                // 步骤 2: 生成 Wiki (40-85%)
                const wikiStartProgress = currentProgress;
                progress.report({ increment: 0, message: 'Generating documentation...' });
                const wikiData = await wikiGenerator.generateWiki(analysisResult, (progressPercent) => {
                    const newProgress = wikiStartProgress + Math.round(progressPercent * 0.45);
                    const increment = newProgress - currentProgress;
                    if (increment > 0) {
                        progress.report({ 
                            increment, 
                            message: `Generating documentation... ${Math.round(progressPercent)}%` 
                        });
                        currentProgress = newProgress;
                    }
                });

                if (token.isCancellationRequested) {
                    return;
                }

                // 步骤 3: 保存缓存 (85-95%)
                const saveIncrement = 95 - currentProgress;
                if (saveIncrement > 0) {
                    progress.report({ increment: saveIncrement, message: 'Saving wiki data...' });
                    currentProgress = 95;
                }
                await cacheManager.saveWikiCache(projectPath, wikiData, analysisResult);

                // 步骤 4: 显示结果 (95-100%)
                const finalIncrement = 100 - currentProgress;
                if (finalIncrement > 0) {
                    progress.report({ increment: finalIncrement, message: 'Opening wiki...' });
                }
                await displayWikiFromCache(cacheManager, projectPath);

                vscode.window.showInformationMessage('DeepWiki generated successfully!');
            } catch (error) {
                throw error;
            } finally {
                // 恢复状态栏
                statusBarItem.text = '$(book) DeepWiki';
            }
        }
    );
}

/**
 * 从缓存显示 Wiki
 */
async function displayWikiFromCache(
    cacheManager: CacheManager,
    projectPath: string
): Promise<void> {
    try {
        const cachedData = await cacheManager.loadWikiCache(projectPath);
        const wikiData = cachedData?.wikiData;
        if (!wikiData) {
            vscode.window.showErrorMessage('No wiki cache found.');
            return;
        }

        // 创建 WebView 显示 Wiki
        const panel = vscode.window.createWebviewPanel(
            'deepwiki',
            'DeepWiki Documentation',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // 设置 WebView 内容
        panel.webview.html = generateWebviewContent(wikiData);

        // 处理 WebView 消息
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'export':
                        exportWiki(wikiData, message.format);
                        break;
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to display wiki: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * 生成 WebView HTML 内容
 */
function generateWebviewContent(wikiData: any): string {
    return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DeepWiki Documentation</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/tomorrow.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"></script>
            <style>
                :root {
                    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                    --font-serif: 'Georgia', 'Times New Roman', serif;
                    --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
                    --border-radius: 8px;
                    --transition: all 0.2s ease;
                    --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    
                    /* Light mode colors - matching DeepWiki Open */
                    --background: #faf9f7;
                    --foreground: #2c2c2c;
                    --shadow-color: rgba(0, 0, 0, 0.1);
                    --accent-primary: #8b5a3c;
                    --accent-secondary: #d4af37;
                    --border-color: #e8e3d8;
                    --card-bg: #ffffff;
                    --highlight: #c9302c;
                    --muted: #6c757d;
                    --link-color: #8b5a3c;
                    --sidebar-bg: rgba(248, 246, 243, 0.8);
                    --sidebar-border: #e8e3d8;
                    --hover-bg: rgba(139, 90, 60, 0.1);
                    --active-bg: rgba(139, 90, 60, 0.15);
                }
                
                /* Dark mode adjustments */
                @media (prefers-color-scheme: dark) {
                    :root {
                        --background: #1a1a1a;
                        --foreground: #f0f0f0;
                        --shadow-color: rgba(0, 0, 0, 0.2);
                        --accent-primary: #9370db;
                        --accent-secondary: #5d4037;
                        --border-color: #2c2c2c;
                        --card-bg: #222222;
                        --highlight: #e57373;
                        --muted: #8c8c8c;
                        --link-color: #b19cd9;
                        --sidebar-bg: rgba(30, 30, 30, 0.8);
                        --sidebar-border: #2c2c2c;
                        --hover-bg: rgba(147, 112, 219, 0.1);
                        --active-bg: rgba(147, 112, 219, 0.2);
                    }
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: var(--font-sans);
                    background: var(--background);
                    color: var(--foreground);
                    line-height: 1.6;
                    overflow-x: hidden;
                }
                
                /* Main Layout - DeepWiki Open Style */
                .app-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    max-width: 90%;
                    margin: 0 auto;
                    padding: 2rem 0;
                }
                
                @media (min-width: 1400px) {
                    .app-container {
                        max-width: 1400px;
                    }
                }
                
                /* Header */
                .header {
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .header-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--accent-primary);
                    margin-bottom: 0.5rem;
                    font-family: var(--font-serif);
                }
                
                .header-subtitle {
                    font-size: 1.125rem;
                    color: var(--muted);
                    font-weight: 400;
                }
                
                /* Main content layout */
                .main-layout {
                    display: flex;
                    flex: 1;
                    gap: 1rem;
                    background: var(--card-bg);
                    border-radius: var(--border-radius);
                    box-shadow: 0 4px 16px var(--shadow-color);
                    overflow: hidden;
                    min-height: 80vh;
                }
                
                @media (max-width: 1024px) {
                    .main-layout {
                        flex-direction: column;
                    }
                }
                
                /* Sidebar Navigation */
                .sidebar {
                    width: 320px;
                    flex-shrink: 0;
                    background: var(--sidebar-bg);
                    border-right: 1px solid var(--border-color);
                    padding: 1.25rem;
                    overflow-y: auto;
                    backdrop-filter: blur(10px);
                }
                
                @media (max-width: 1024px) {
                    .sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                    }
                }
                
                .sidebar-header {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .sidebar-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--accent-primary);
                    margin-bottom: 0.25rem;
                    font-family: var(--font-serif);
                }
                
                .sidebar-subtitle {
                    font-size: 0.875rem;
                    color: var(--muted);
                    font-weight: 400;
                }
                
                .nav-list {
                    list-style: none;
                }
                
                .nav-item {
                    margin-bottom: 0.25rem;
                }
                
                .nav-link {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    color: var(--foreground);
                    text-decoration: none;
                    border-radius: 0.5rem;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                
                .nav-link:hover {
                    background: var(--hover-bg);
                    color: var(--accent-primary);
                    transform: translateX(4px);
                }
                
                .nav-link.active {
                    background: var(--active-bg);
                    color: var(--accent-primary);
                    font-weight: 600;
                }
                
                .nav-icon {
                    width: 1rem;
                    height: 1rem;
                    margin-right: 0.75rem;
                    opacity: 0.7;
                    flex-shrink: 0;
                }
                
                .nav-link.active .nav-icon,
                .nav-link:hover .nav-icon {
                    opacity: 1;
                }
                
                /* Main content */
                .main-content {
                    flex: 1;
                    padding: 2rem;
                    overflow-y: auto;
                    background: var(--background);
                }
                
                .content-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .content-title-section {
                    flex: 1;
                }
                
                .content-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--accent-primary);
                    margin-bottom: 0.5rem;
                    font-family: var(--font-serif);
                }
                
                .content-subtitle {
                    font-size: 1rem;
                    color: var(--muted);
                    font-weight: 400;
                }
                
                .export-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                
                .export-button {
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                    border: none;
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(147, 112, 219, 0.2);
                    font-size: 0.875rem;
                    min-width: 80px;
                }
                
                .export-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(147, 112, 219, 0.3);
                }
                
                .export-button:active {
                    transform: translateY(0);
                }
                
                .content-body {
                    padding: 2rem;
                }
                
                /* Section styles */
                .section {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    margin-bottom: 1.5rem;
                    box-shadow: var(--shadow);
                    overflow: hidden;
                    transition: var(--transition);
                }
                
                .section:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px var(--shadow-color);
                }
                
                .section-header {
                    background: var(--card-bg);
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .section-header:hover {
                    background: var(--hover-bg);
                }
                
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--accent-primary);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .section-icon {
                    font-size: 1.25rem;
                }
                
                .section-toggle {
                    font-size: 1.25rem;
                    transition: var(--transition);
                    color: var(--muted);
                    opacity: 0.7;
                }
                
                .section-content {
                    padding: 2rem;
                    display: block;
                    background: var(--background);
                }
                
                .section.collapsed .section-content {
                    display: none;
                }
                
                .section.collapsed .section-toggle {
                    transform: rotate(-90deg);
                }
                
                .page-content {
                    color: var(--foreground);
                    line-height: 1.7;
                    font-size: 1rem;
                }
                
                .page-content h1 {
                    color: var(--accent-primary);
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin: 2rem 0 1rem 0;
                    border-bottom: 2px solid var(--border-color);
                    padding-bottom: 0.5rem;
                }
                
                .page-content h2 {
                    color: var(--accent-primary);
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 1.5rem 0 1rem 0;
                }
                
                .page-content h3 {
                    color: var(--accent-secondary);
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 1.25rem 0 0.75rem 0;
                }
                
                .page-content p {
                    margin: 1rem 0;
                    color: var(--foreground);
                }
                
                .page-content strong {
                    color: var(--accent-primary);
                    font-weight: 600;
                }
                
                .page-content em {
                    color: var(--accent-secondary);
                    font-style: italic;
                }
                
                /* Code highlighting */
                pre {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    padding: 1.5rem;
                    margin: 1.5rem 0;
                    overflow-x: auto;
                    position: relative;
                    box-shadow: var(--shadow);
                }
                
                pre:hover {
                    box-shadow: 0 4px 12px var(--shadow-color);
                }
                
                code {
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    line-height: 1.5;
                }
                
                .inline-code {
                    background: var(--hover-bg);
                    color: var(--accent-primary);
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    font-weight: 500;
                    border: 1px solid var(--border-color);
                }
                
                /* Tables */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.5rem 0;
                    background: var(--card-bg);
                    border-radius: var(--border-radius);
                    overflow: hidden;
                    box-shadow: var(--shadow);
                    border: 1px solid var(--border-color);
                }
                
                th, td {
                    padding: 0.75rem 1rem;
                    text-align: left;
                    border-bottom: 1px solid var(--border-color);
                }
                
                th {
                    background: var(--hover-bg);
                    font-weight: 600;
                    color: var(--accent-primary);
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                tr:hover {
                    background: var(--hover-bg);
                }
                
                tr:last-child td {
                    border-bottom: none;
                }
                
                /* Lists */
                .page-content ul, .page-content ol {
                    padding-left: 1.5rem;
                    margin: 1rem 0;
                }
                
                .page-content li {
                    margin: 0.5rem 0;
                    color: var(--foreground);
                }
                
                .page-content ul li {
                    list-style-type: none;
                    position: relative;
                }
                
                .page-content ul li::before {
                    content: '•';
                    color: var(--accent-primary);
                    font-weight: bold;
                    position: absolute;
                    left: -1rem;
                }
                
                .page-content ol li {
                    list-style-type: decimal;
                    color: var(--foreground);
                }
                
                /* Links */
                .page-content a {
                    color: var(--link);
                    text-decoration: none;
                    transition: var(--transition);
                    font-weight: 500;
                    border-bottom: 1px solid transparent;
                }
                
                .page-content a:hover {
                    color: var(--accent-primary);
                    border-bottom-color: var(--accent-primary);
                }
                

                
                /* Badges */
                .badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    margin: 0.125rem;
                    border: 1px solid var(--border-color);
                    transition: var(--transition);
                }
                
                .badge-primary {
                    background: var(--accent-primary);
                    color: white;
                    border-color: var(--accent-primary);
                }
                
                .badge-success {
                    background: var(--success);
                    color: white;
                    border-color: var(--success);
                }
                
                .badge-warning {
                    background: var(--warning);
                    color: var(--foreground);
                    border-color: var(--warning);
                }
                
                .badge:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow);
                }
                
                /* Responsive design */
                @media (max-width: 1024px) {
                    .app-container {
                        max-width: 95%;
                        padding: 1rem 0;
                    }
                    
                    .header-title {
                        font-size: 2rem;
                    }
                    
                    .main-layout {
                        flex-direction: column;
                        min-height: auto;
                    }
                    
                    .sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                    }
                    
                    .main-content {
                        padding: 1.5rem;
                    }
                    
                    .content-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    
                    .content-title {
                        font-size: 1.5rem;
                    }
                    
                    .export-actions {
                        width: 100%;
                        justify-content: flex-start;
                    }
                }
                
                @media (max-width: 640px) {
                    .app-container {
                        max-width: 100%;
                        padding: 0.5rem;
                    }
                    
                    .header {
                        margin-bottom: 1rem;
                        padding: 0 1rem;
                    }
                    
                    .header-title {
                        font-size: 1.75rem;
                    }
                    
                    .header-subtitle {
                        font-size: 1rem;
                    }
                    
                    .main-content {
                        padding: 1rem;
                    }
                    
                    .content-header {
                        padding-bottom: 1rem;
                        margin-bottom: 1rem;
                    }
                    
                    .content-title {
                        font-size: 1.25rem;
                    }
                    
                    .sidebar {
                        padding: 1rem;
                    }
                    
                    .export-actions {
                        flex-direction: column;
                        width: 100%;
                    }
                    
                    .export-button {
                        width: 100%;
                        justify-content: center;
                        padding: 0.75rem;
                    }
                    
                    .section {
                        margin-bottom: 1rem;
                    }
                    
                    .section-header {
                        padding: 1rem;
                    }
                    
                    .section-content {
                        padding: 1rem;
                    }
                    
                    .section-title {
                        font-size: 1.25rem;
                    }
                }
                
                /* Scrollbar styling */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                
                ::-webkit-scrollbar-track {
                    background: var(--background);
                }
                
                ::-webkit-scrollbar-thumb {
                    background: var(--muted);
                    border-radius: 3px;
                    transition: var(--transition);
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: var(--accent-primary);
                }
                
                ::-webkit-scrollbar-corner {
                    background: var(--background);
                }
                
                /* Firefox scrollbar */
                * {
                    scrollbar-width: thin;
                    scrollbar-color: var(--muted) var(--background);
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                <!-- Header -->
                <div class="header">
                    <h1 class="header-title">${wikiData.projectName || 'Project Documentation'}</h1>
                    <p class="header-subtitle">自动生成的项目文档 - ${wikiData.generatedAt ? new Date(wikiData.generatedAt).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN')}</p>
                </div>
                
                <!-- Main Layout -->
                <div class="main-layout">
                    <!-- Sidebar Navigation -->
                    <div class="sidebar">
                        <div class="sidebar-header">
                            <div class="sidebar-title">
                                📚 目录导航
                            </div>
                            <div class="sidebar-subtitle">
                                ${generateNavigationData(wikiData).length} 个章节
                            </div>
                        </div>
                        
                        <nav class="nav-list">
                            ${generateNavigationData(wikiData).map((item: any) => `
                                <div class="nav-item">
                                    <a href="#${item.id}" class="nav-link" onclick="scrollToSection('${item.id}')">
                                        <span class="nav-icon">${item.icon}</span>
                                        ${item.title}
                                    </a>
                                </div>
                            `).join('')}
                        </nav>
                    </div>
                    
                    <!-- Main Content -->
                    <div class="main-content">
                        <div class="content-header">
                            <div class="content-title-section">
                                <h2 class="content-title">
                                    📖 项目文档
                                </h2>
                                <p class="content-subtitle">
                                    详细的项目分析和文档
                                </p>
                            </div>
                            
                            <div class="export-actions">
                                <button class="export-button" onclick="exportWiki('markdown')">
                                    📄 Markdown
                                </button>
                                <button class="export-button" onclick="exportWiki('json')">
                                    📊 JSON
                                </button>
                            </div>
                        </div>
                        
                        <div class="content-body">
                            ${generateWikiSections(wikiData)}
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                // Define exportWiki function in global scope immediately
                window.exportWiki = function(format) {
                    try {
                        console.log('Exporting wiki in format:', format);
                        vscode.postMessage({
                            command: 'export',
                            format: format
                        });
                    } catch (error) {
                        console.error('Error in exportWiki:', error);
                    }
                };
                
                // Initialize syntax highlighting
                document.addEventListener('DOMContentLoaded', function() {
                    hljs.highlightAll();
                    
                    // Initialize Mermaid
                    mermaid.initialize({ 
                        theme: 'dark',
                        startOnLoad: true,
                        securityLevel: 'loose'
                    });
                    
                    // Add section toggle functionality
                    document.querySelectorAll('.section-header').forEach(header => {
                        header.addEventListener('click', function() {
                            const section = this.parentElement;
                            section.classList.toggle('collapsed');
                        });
                    });
                    
                    // Process code blocks for syntax highlighting
                    document.querySelectorAll('pre code').forEach(block => {
                        hljs.highlightElement(block);
                    });
                    
                    // Process inline code
                    document.querySelectorAll('code:not(pre code)').forEach(code => {
                        code.classList.add('inline-code');
                    });
                    
                    // Initialize navigation
                    initializeNavigation();
                });
                
                // Also define as regular function for backward compatibility
                function exportWiki(format) {
                    return window.exportWiki(format);
                }
                
                function scrollToSection(sectionId) {
                    const target = document.getElementById(sectionId);
                    if (target) {
                        // Update active nav item
                        document.querySelectorAll('.nav-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        
                        const activeNavItem = document.querySelector('[onclick*="scrollToSection(\'' + sectionId + '\')"');
                        if (activeNavItem) {
                            activeNavItem.classList.add('active');
                        }
                        
                        // Smooth scroll to target
                        target.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
                
                function initializeNavigation() {
                    // Set first nav item as active by default
                    const firstNavItem = document.querySelector('.nav-item');
                    if (firstNavItem) {
                        firstNavItem.classList.add('active');
                    }
                    
                    // Add scroll spy functionality
                    const sections = document.querySelectorAll('.section');
                    const navItems = document.querySelectorAll('.nav-item');
                    
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const sectionId = entry.target.id;
                                if (sectionId) {
                                    navItems.forEach(item => item.classList.remove('active'));
                                    const activeNavItem = document.querySelector('[onclick*="scrollToSection(\'' + sectionId + '\')"');
                                    if (activeNavItem) {
                                        activeNavItem.classList.add('active');
                                    }
                                }
                            }
                        });
                    }, {
                        threshold: 0.3,
                        rootMargin: '-20% 0px -70% 0px'
                    });
                    
                    sections.forEach(section => {
                        if (section.id) {
                            observer.observe(section);
                        }
                    });
                }
                
                // Smooth scrolling for internal links
                document.addEventListener('click', function(e) {
                    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
                        e.preventDefault();
                        const target = document.querySelector(e.target.getAttribute('href'));
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;
}

/**
 * 生成导航数据
 */
function generateNavigationData(wikiData: any): any {
    const sections = [];
    
    // 添加概览页面
    if (wikiData.overview) {
        sections.push({
            id: 'overview',
            title: 'Overview',
            icon: '📋'
        });
    }
    
    // 添加架构页面
    if (wikiData.architecture) {
        sections.push({
            id: 'architecture',
            title: 'Architecture',
            icon: '🏗️'
        });
    }
    
    // 添加文件结构页面
    if (wikiData.fileStructure) {
        sections.push({
            id: 'file-structure',
            title: 'File Structure',
            icon: '📁'
        });
    }
    
    // 添加代码分析页面
    if (wikiData.codeAnalysis && Array.isArray(wikiData.codeAnalysis) && wikiData.codeAnalysis.length > 0) {
        wikiData.codeAnalysis.forEach((section: any, index: number) => {
            sections.push({
                id: `code-analysis-${index}`,
                title: section.title || `Code Analysis ${index + 1}`,
                icon: '🔍'
            });
        });
    }
    
    // 添加依赖页面
    if (wikiData.dependencies) {
        sections.push({
            id: 'dependencies',
            title: 'Dependencies',
            icon: '📦'
        });
    }
    
    // 添加设置页面
    if (wikiData.setup) {
        sections.push({
            id: 'setup',
            title: 'Setup',
            icon: '⚙️'
        });
    }
    
    // 添加使用说明页面
    if (wikiData.usage) {
        sections.push({
            id: 'usage',
            title: 'Usage',
            icon: '🚀'
        });
    }
    
    return sections;
}

/**
 * 生成 Wiki 章节内容
 */
function generateWikiSections(wikiData: any): string {
    // 检查是否有有效的 Wiki 数据
    if (!wikiData || typeof wikiData !== 'object') {
        return '<div class="section"><div class="section-content">No documentation data found.</div></div>';
    }

    const sectionIcons: { [key: string]: string } = {
        'Overview': '📋',
        'Architecture': '🏗️',
        'File Structure': '📁',
        'Code Analysis': '🔍',
        'Dependencies': '📦',
        'Setup': '⚙️',
        'Usage': '🚀',
        'API': '🔌',
        'Configuration': '⚙️',
        'Testing': '🧪',
        'Deployment': '🚀',
        'Contributing': '🤝',
        'License': '📄'
    };

    // 构建页面数组从 WikiData 字段
    const pages = [];
    
    // 添加概览页面
    if (wikiData.overview) {
        pages.push({
            title: 'Overview',
            content: wikiData.overview
        });
    }
    
    // 添加架构页面
    if (wikiData.architecture) {
        pages.push({
            title: 'Architecture',
            content: wikiData.architecture
        });
    }
    
    // 添加文件结构页面
    if (wikiData.fileStructure) {
        pages.push({
            title: 'File Structure',
            content: wikiData.fileStructure
        });
    }
    
    // 添加代码分析页面
    if (wikiData.codeAnalysis && Array.isArray(wikiData.codeAnalysis) && wikiData.codeAnalysis.length > 0) {
        wikiData.codeAnalysis.forEach((section: any, index: number) => {
            pages.push({
                title: section.title || `Code Analysis ${index + 1}`,
                content: section.content || ''
            });
        });
    }
    
    // 添加依赖页面
    if (wikiData.dependencies) {
        pages.push({
            title: 'Dependencies',
            content: wikiData.dependencies
        });
    }
    
    // 添加设置页面
    if (wikiData.setup) {
        pages.push({
            title: 'Setup',
            content: wikiData.setup
        });
    }
    
    // 添加使用说明页面
    if (wikiData.usage) {
        pages.push({
            title: 'Usage',
            content: wikiData.usage
        });
    }
    
    // 如果没有任何页面，显示错误信息
    if (pages.length === 0) {
        return '<div class="section"><div class="section-content">No documentation pages found. Please check if the wiki generation completed successfully.</div></div>';
    }

    return pages.map((page: any, index: number) => {
        const icon = sectionIcons[page.title] || '📄';
        
        // Generate section ID that matches navigation data
        let sectionId = '';
        switch (page.title) {
            case 'Overview':
                sectionId = 'overview';
                break;
            case 'Architecture':
                sectionId = 'architecture';
                break;
            case 'File Structure':
                sectionId = 'file-structure';
                break;
            case 'Dependencies':
                sectionId = 'dependencies';
                break;
            case 'Setup':
                sectionId = 'setup';
                break;
            case 'Usage':
                sectionId = 'usage';
                break;
            default:
                if (page.title.includes('Code Analysis')) {
                    sectionId = `code-analysis-${index}`;
                } else {
                    sectionId = `section-${index}`;
                }
        }
        
        // Process content for better formatting
        let processedContent = processWikiContent(page.content);
        
        return `
            <div class="section" id="${sectionId}">
                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">${icon}</span>
                        ${page.title}
                    </div>
                    <span class="section-toggle">▼</span>
                </div>
                <div class="section-content">
                    <div class="page-content">${processedContent}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 处理 Wiki 内容，添加语法高亮和格式化
 */
function processWikiContent(content: string): string {
    if (!content) return '';
    
    // Convert markdown-style code blocks to HTML
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text';
        return `<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Convert inline code
    content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert headers
    content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Convert bold text
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic text
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert lists
    content = content.replace(/^- (.+)$/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert numbered lists
    content = content.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Convert links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Convert line breaks
    content = content.replace(/\n\n/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already wrapped
    if (!content.startsWith('<')) {
        content = `<p>${content}</p>`;
    }
    
    // Process tables (simple markdown tables)
    content = content.replace(/\|(.+)\|/g, (match, row) => {
        const cells = row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell);
        const cellTags = cells.map((cell: string) => `<td>${cell}</td>`).join('');
        return `<tr>${cellTags}</tr>`;
    });
    
    // Wrap table rows in table
    if (content.includes('<tr>')) {
        content = content.replace(/(<tr>.*<\/tr>)/s, '<table>$1</table>');
    }
    
    return content;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
    const htmlEscapes: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * 导出 Wiki
 */
async function exportWiki(wikiData: any, format: string): Promise<void> {
    try {
        const workspaceFolder = getWorkspaceFolder();
        if (!workspaceFolder) {
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const exportPath = path.join(workspaceFolder.uri.fsPath, `deepwiki-export-${timestamp}.${format}`);
        
        let content: string;
        
        switch (format) {
            case 'json':
                content = JSON.stringify(wikiData, null, 2);
                break;
            case 'markdown':
                content = generateMarkdown(wikiData);
                break;
            case 'html':
                content = generateStandaloneHtml(wikiData);
                break;
            case 'pdf':
                await generatePDF(wikiData, exportPath);
                const action = await vscode.window.showInformationMessage(
                    `Wiki exported to ${path.basename(exportPath)}`,
                    'Open File',
                    'Show in Folder'
                );
                
                if (action === 'Open File') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(exportPath));
                } else if (action === 'Show in Folder') {
                    vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(exportPath));
                }
                return;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
        
        await fsPromises.writeFile(exportPath, content, 'utf8');
        
        const action = await vscode.window.showInformationMessage(
            `Wiki exported to ${path.basename(exportPath)}`,
            'Open File',
            'Show in Folder'
        );
        
        if (action === 'Open File') {
            const doc = await vscode.workspace.openTextDocument(exportPath);
            await vscode.window.showTextDocument(doc);
        } else if (action === 'Show in Folder') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(exportPath));
        }
    } catch (error) {
        vscode.window.showErrorMessage(
            `Export failed: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * 生成 Markdown 格式
 */
function generateMarkdown(wikiData: any): string {
    let markdown = `# ${wikiData.wiki_structure?.title || 'Project Documentation'}\n\n`;
    
    if (wikiData.wiki_structure?.description) {
        markdown += `${wikiData.wiki_structure.description}\n\n`;
    }
    
    // Add table of contents
    if (wikiData.wiki_structure?.pages && wikiData.wiki_structure.pages.length > 0) {
        markdown += `## Table of Contents\n\n`;
        wikiData.wiki_structure.pages.forEach((page: any, index: number) => {
            const anchor = page.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            markdown += `${index + 1}. [${page.title}](#${anchor})\n`;
        });
        markdown += `\n`;
    }

    if (wikiData.wiki_structure?.pages) {
        wikiData.wiki_structure.pages.forEach((page: any) => {
            const anchor = page.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            markdown += `## ${page.title} {#${anchor}}\n\n`;
            
            // Clean up content for markdown
            let content = page.content || '';
            // Remove HTML tags if any
            content = content.replace(/<[^>]*>/g, '');
            // Fix line breaks
            content = content.replace(/\n\s*\n/g, '\n\n');
            
            markdown += `${content}\n\n`;
            markdown += `---\n\n`;
        });
    }
    
    // Add footer
    markdown += `\n---\n\n*Generated by DeepWiki on ${new Date().toLocaleString()}*\n`;

    return markdown;
}

/**
 * 生成 PDF 文件
 */
async function generatePDF(wikiData: any, outputPath: string): Promise<void> {
    throw new Error('PDF generation is currently disabled. Please use HTML export instead.');
}

/**
 * 生成独立的 HTML 文件
 */
function generateStandaloneHtml(wikiData: any): string {
    const title = wikiData.wiki_structure?.title || 'Project Documentation';
    const description = wikiData.wiki_structure?.description || 'Generated by DeepWiki';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"></script>
    <style>
        :root {
            --primary-color: #007acc;
            --secondary-color: #1e1e1e;
            --accent-color: #569cd6;
            --success-color: #4ec9b0;
            --warning-color: #dcdcaa;
            --error-color: #f44747;
            --bg-color: #0d1117;
            --surface-color: #161b22;
            --border-color: #30363d;
            --text-color: #c9d1d9;
            --text-muted: #8b949e;
            --border-radius: 8px;
            --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            --transition: all 0.3s ease;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--accent-color), var(--success-color));
        }
        
        .title {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .description {
            color: var(--text-muted);
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .toc {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .toc h2 {
            margin-top: 0;
            color: var(--primary-color);
        }
        
        .toc ul {
            list-style: none;
            padding: 0;
        }
        
        .toc li {
            margin: 8px 0;
        }
        
        .toc a {
            color: var(--text-color);
            text-decoration: none;
            transition: var(--transition);
        }
        
        .toc a:hover {
            color: var(--primary-color);
        }
        
        .section {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            margin-bottom: 25px;
            box-shadow: var(--shadow);
            overflow: hidden;
        }
        
        .section-header {
            background: var(--bg-color);
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .section-title {
            font-size: 1.4em;
            font-weight: 600;
            color: var(--primary-color);
            margin: 0;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            margin-right: 10px;
            font-size: 1.2em;
        }
        
        .section-content {
            padding: 25px;
        }
        
        .page-content {
            color: var(--text-color);
            line-height: 1.7;
        }
        
        pre {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 20px;
            margin: 15px 0;
            overflow-x: auto;
        }
        
        code {
            font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
            font-size: 0.9em;
        }
        
        .inline-code {
            background: var(--bg-color);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Fira Code', 'Cascadia Code', monospace;
            font-size: 0.9em;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: var(--surface-color);
            border-radius: var(--border-radius);
            overflow: hidden;
        }
        
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        th {
            background: var(--bg-color);
            font-weight: 600;
            color: var(--primary-color);
        }
        
        a {
            color: var(--primary-color);
            text-decoration: none;
        }
        
        a:hover {
            color: var(--accent-color);
            text-decoration: underline;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: var(--text-muted);
            border-top: 1px solid var(--border-color);
            margin-top: 40px;
        }
        
        @media print {
            .container {
                max-width: none;
                padding: 0;
            }
            
            .section {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">${title}</div>
            <div class="description">${description}</div>
        </div>
        
        ${generateTableOfContents(wikiData)}
        
        <div class="content">
            ${generateStandaloneWikiSections(wikiData)}
        </div>
        
        <div class="footer">
            <p>Generated by <strong>DeepWiki</strong> on ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <script>
        // Initialize syntax highlighting
        document.addEventListener('DOMContentLoaded', function() {
            hljs.highlightAll();
            
            // Initialize Mermaid
            mermaid.initialize({ 
                theme: 'dark',
                startOnLoad: true,
                securityLevel: 'loose'
            });
            
            // Smooth scrolling for internal links
            document.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(e.target.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    </script>
</body>
</html>`;
}

/**
 * 生成目录
 */
function generateTableOfContents(wikiData: any): string {
    if (!wikiData.wiki_structure?.pages || wikiData.wiki_structure.pages.length === 0) {
        return '';
    }
    
    const sectionIcons: { [key: string]: string } = {
        'Overview': '📋',
        'Architecture': '🏗️',
        'File Structure': '📁',
        'Code Analysis': '🔍',
        'Dependencies': '📦',
        'Setup': '⚙️',
        'Usage': '🚀',
        'API': '🔌',
        'Configuration': '⚙️',
        'Testing': '🧪',
        'Deployment': '🚀',
        'Contributing': '🤝',
        'License': '📄'
    };
    
    const tocItems = wikiData.wiki_structure.pages.map((page: any, index: number) => {
        const icon = sectionIcons[page.title] || '📄';
        const anchor = `section-${index}`;
        return `<li><a href="#${anchor}">${icon} ${page.title}</a></li>`;
    }).join('');
    
    return `
        <div class="toc">
            <h2>📚 Table of Contents</h2>
            <ul>${tocItems}</ul>
        </div>
    `;
}

/**
 * 生成独立 HTML 的 Wiki 章节
 */
function generateStandaloneWikiSections(wikiData: any): string {
    if (!wikiData.wiki_structure?.pages) {
        return '<div class="section"><div class="section-content">No documentation pages found.</div></div>';
    }
    
    const sectionIcons: { [key: string]: string } = {
        'Overview': '📋',
        'Architecture': '🏗️',
        'File Structure': '📁',
        'Code Analysis': '🔍',
        'Dependencies': '📦',
        'Setup': '⚙️',
        'Usage': '🚀',
        'API': '🔌',
        'Configuration': '⚙️',
        'Testing': '🧪',
        'Deployment': '🚀',
        'Contributing': '🤝',
        'License': '📄'
    };
    
    return wikiData.wiki_structure.pages.map((page: any, index: number) => {
        const icon = sectionIcons[page.title] || '📄';
        const sectionId = `section-${index}`;
        
        // Process content for better formatting
        let processedContent = processWikiContent(page.content);
        
        return `
            <div class="section" id="${sectionId}">
                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">${icon}</span>
                        ${page.title}
                    </div>
                </div>
                <div class="section-content">
                    <div class="page-content">${processedContent}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 获取当前工作区文件夹
 */
function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return undefined;
    }
    return workspaceFolders[0];
}

/**
 * 启动 RAG 聊天界面
 */
async function startRAGChat(
    configManager: ConfigManager,
    ragManager: RAGManager,
    cacheManager: CacheManager
): Promise<void> {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    
    // 检查配置
    const config = configManager.getConfiguration();
    if (!config.apiKey || !config.provider) {
        const result = await vscode.window.showWarningMessage(
            'RAG Chat requires AI provider configuration. Please configure your settings.',
            'Open Configuration',
            'Cancel'
        );
        
        if (result === 'Open Configuration') {
            await configManager.openConfigurationPanel();
        }
        return;
    }

    // 检查是否有项目分析数据
    const hasCache = await cacheManager.hasCache(projectPath);
    if (!hasCache) {
        const result = await vscode.window.showWarningMessage(
            'RAG Chat requires project analysis data. Please generate wiki first.',
            'Generate Wiki',
            'Cancel'
        );
        
        if (result === 'Generate Wiki') {
            vscode.commands.executeCommand('deepwiki.generateWiki');
        }
        return;
    }

    // 初始化 RAG
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Initializing RAG Chat',
            cancellable: false
        },
        async (progress) => {
            progress.report({ increment: 0, message: 'Loading project data...' });
            
            try {
                await ragManager.prepareRetriever(projectPath);
                progress.report({ increment: 100, message: 'RAG initialized successfully' });
                
                // 创建聊天界面
                createRAGChatPanel(ragManager);
                
            } catch (error) {
                throw new Error(`Failed to initialize RAG: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );
}

/**
 * 快速 RAG 查询
 */
async function quickRAGQuery(
    configManager: ConfigManager,
    ragManager: RAGManager,
    cacheManager: CacheManager
): Promise<void> {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    
    // 检查配置
    const config = configManager.getConfiguration();
    if (!config.apiKey || !config.provider) {
        vscode.window.showWarningMessage('Please configure AI provider settings first.');
        return;
    }

    // 检查是否有项目分析数据
    const hasCache = await cacheManager.hasCache(projectPath);
    if (!hasCache) {
        vscode.window.showWarningMessage('Please generate wiki first to enable RAG queries.');
        return;
    }

    // 获取用户输入
    const query = await vscode.window.showInputBox({
        prompt: 'Ask a question about your project',
        placeHolder: 'e.g., How does the authentication system work?',
        ignoreFocusOut: true
    });

    if (!query) {
        return;
    }

    // 执行查询
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Processing RAG Query',
            cancellable: false
        },
        async (progress) => {
            try {
                progress.report({ increment: 0, message: 'Initializing RAG...' });
                
                if (!ragManager.isReady()) {
                    await ragManager.prepareRetriever(projectPath);
                }
                
                progress.report({ increment: 50, message: 'Searching relevant documents...' });
                
                const result = await ragManager.query(query);
                
                progress.report({ increment: 100, message: 'Query completed' });
                
                // 显示结果
                showRAGResult(query, result);
                
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Query failed: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
    );
}

/**
 * 创建 RAG 聊天面板
 */
function createRAGChatPanel(ragManager: RAGManager): void {
    const panel = vscode.window.createWebviewPanel(
        'deepwikiRAGChat',
        'DeepWiki RAG Chat',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // 设置 WebView 内容
    panel.webview.html = generateRAGChatHTML();

    // 处理消息
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'query':
                    try {
                        const result = await ragManager.query(message.text);
                        panel.webview.postMessage({
                                command: 'response',
                                data: {
                                    answer: result.answer,
                                    sources: result.sources || [],
                                    timestamp: result.timestamp || Date.now()
                                }
                            });
                    } catch (error) {
                        panel.webview.postMessage({
                            command: 'error',
                            data: {
                                message: error instanceof Error ? error.message : String(error)
                            }
                        });
                    }
                    break;
                case 'getStats':
                    const stats = ragManager.getStats();
                    panel.webview.postMessage({
                        command: 'stats',
                        data: stats
                    });
                    break;
            }
        }
    );
}

/**
 * 生成 RAG 聊天界面 HTML
 */
function generateRAGChatHTML(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DeepWiki RAG Chat</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    display: flex;
                    flex-direction: column;
                }
                .header {
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    background-color: var(--vscode-sideBar-background);
                }
                .title {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin: 0;
                }
                .subtitle {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin: 5px 0 0 0;
                }
                .chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
                .message {
                    margin-bottom: 20px;
                    padding: 15px;
                    border-radius: 8px;
                }
                .user-message {
                    background-color: var(--vscode-inputOption-activeBackground);
                    margin-left: 20%;
                }
                .assistant-message {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    margin-right: 20%;
                }
                .message-content {
                    white-space: pre-wrap;
                    line-height: 1.5;
                }
                .message-sources {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid var(--vscode-panel-border);
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                .source-item {
                    margin: 5px 0;
                }
                .input-container {
                    padding: 20px;
                    border-top: 1px solid var(--vscode-panel-border);
                    background-color: var(--vscode-sideBar-background);
                }
                .input-row {
                    display: flex;
                    gap: 10px;
                }
                .query-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-size: 14px;
                }
                .send-button {
                    padding: 10px 20px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .send-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .loading {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    padding: 20px;
                }
                .stats {
                    font-size: 0.8em;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">DeepWiki RAG Chat</div>
                <div class="subtitle">Ask questions about your project</div>
                <div class="stats" id="stats">Loading...</div>
            </div>
            
            <div class="chat-container">
                <div class="messages" id="messages">
                    <div class="message assistant-message">
                        <div class="message-content">Hello! I'm your project assistant. Ask me anything about your codebase and I'll help you understand it better.</div>
                    </div>
                </div>
                
                <div class="input-container">
                    <div class="input-row">
                        <input type="text" class="query-input" id="queryInput" placeholder="Ask a question about your project..." />
                        <button class="send-button" id="sendButton" onclick="sendQuery()">Send</button>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let isLoading = false;
                
                // 获取统计信息
                vscode.postMessage({ command: 'getStats' });
                
                // 处理消息
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'response':
                            addAssistantMessage(message.data);
                            setLoading(false);
                            break;
                        case 'error':
                            addErrorMessage(message.data.message);
                            setLoading(false);
                            break;
                        case 'stats':
                            updateStats(message.data);
                            break;
                    }
                });
                
                function sendQuery() {
                    const input = document.getElementById('queryInput');
                    const query = input.value.trim();
                    
                    if (!query || isLoading) {
                        return;
                    }
                    
                    addUserMessage(query);
                    input.value = '';
                    setLoading(true);
                    
                    vscode.postMessage({
                        command: 'query',
                        text: query
                    });
                }
                
                function addUserMessage(text) {
                    const messages = document.getElementById('messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message user-message';
                    messageDiv.innerHTML = '<div class="message-content">' + escapeHtml(text) + '</div>';
                    messages.appendChild(messageDiv);
                    messages.scrollTop = messages.scrollHeight;
                }
                
                function addAssistantMessage(data) {
                    const messages = document.getElementById('messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message assistant-message';
                    
                    let sourcesHtml = '';
                    if (data.sources && data.sources.length > 0) {
                        sourcesHtml = '<div class="message-sources"><strong>Sources:</strong>';
                        data.sources.forEach(source => {
                            sourcesHtml += '<div class="source-item">📄 ' + source.title + ' (' + source.path + ')</div>';
                        });
                        sourcesHtml += '</div>';
                    }
                    
                    messageDiv.innerHTML = '<div class="message-content">' + escapeHtml(data.answer) + '</div>' + sourcesHtml;
                    
                    messages.appendChild(messageDiv);
                    messages.scrollTop = messages.scrollHeight;
                }
                
                function addErrorMessage(error) {
                    const messages = document.getElementById('messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message assistant-message';
                    messageDiv.innerHTML = '<div class="message-content" style="color: var(--vscode-errorForeground);">Error: ' + escapeHtml(error) + '</div>';
                    messages.appendChild(messageDiv);
                    messages.scrollTop = messages.scrollHeight;
                }
                
                function setLoading(loading) {
                    isLoading = loading;
                    const button = document.getElementById('sendButton');
                    const input = document.getElementById('queryInput');
                    
                    button.disabled = loading;
                    input.disabled = loading;
                    
                    if (loading) {
                        const messages = document.getElementById('messages');
                        const loadingDiv = document.createElement('div');
                        loadingDiv.className = 'loading';
                        loadingDiv.id = 'loading';
                        loadingDiv.textContent = 'Thinking...';
                        messages.appendChild(loadingDiv);
                        messages.scrollTop = messages.scrollHeight;
                    } else {
                        const loadingDiv = document.getElementById('loading');
                        if (loadingDiv) {
                            loadingDiv.remove();
                        }
                    }
                }
                
                function updateStats(stats) {
                    const statsDiv = document.getElementById('stats');
                    statsDiv.textContent = 'Documents: ' + stats.documentsLoaded + ' | Initialized: ' + (stats.isInitialized ? 'Yes' : 'No');
                }
                
                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }
                
                // 回车发送
                document.getElementById('queryInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendQuery();
                    }
                });
            </script>
        </body>
        </html>
    `;
}

/**
 * 显示 RAG 查询结果
 */
function showRAGResult(query: string, result: any): void {
    const panel = vscode.window.createWebviewPanel(
        'deepwikiRAGResult',
        'RAG Query Result',
        vscode.ViewColumn.Two,
        {
            enableScripts: true
        }
    );

    let sourcesHtml = '';
    if (result.sources && result.sources.length > 0) {
        sourcesHtml = '<div class="sources"><div class="sources-title">Sources:</div>';
        result.sources.forEach((source: any) => {
            sourcesHtml += '<div class="source-item"><div class="source-title">' + source.title + '</div><div class="source-path">' + source.path + '</div></div>';
        });
        sourcesHtml += '</div>';
    }

    const escapedQuery = query.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedAnswer = result.answer.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    
    panel.webview.html = '<!DOCTYPE html>' +
        '<html lang="en">' +
        '<head>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>RAG Query Result</title>' +
            '<style>' +
                'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }' +
                '.query { background-color: var(--vscode-inputOption-activeBackground); padding: 15px; border-radius: 8px; margin-bottom: 20px; }' +
                '.query-title { font-weight: bold; margin-bottom: 10px; }' +
                '.answer { background-color: var(--vscode-editor-inactiveSelectionBackground); padding: 15px; border-radius: 8px; margin-bottom: 20px; }' +
                '.answer-title { font-weight: bold; margin-bottom: 10px; color: var(--vscode-textLink-foreground); }' +
                '.sources { margin-top: 20px; }' +
                '.sources-title { font-weight: bold; margin-bottom: 10px; }' +
                '.source-item { background-color: var(--vscode-list-hoverBackground); padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid var(--vscode-textLink-foreground); }' +
                '.source-title { font-weight: bold; margin-bottom: 5px; }' +
                '.source-path { font-size: 0.9em; color: var(--vscode-descriptionForeground); }' +
            '</style>' +
        '</head>' +
        '<body>' +
            '<div class="query">' +
                '<div class="query-title">Your Question:</div>' +
                '<div>' + escapedQuery + '</div>' +
            '</div>' +
            '<div class="answer">' +
                '<div class="answer-title">Answer:</div>' +
                '<div>' + escapedAnswer + '</div>' +
            '</div>' +
            sourcesHtml +
        '</body>' +
        '</html>';
}

/**
 * 插件停用函数
 */
export function deactivate() {
    console.log('DeepWiki extension is now deactivated!');
}