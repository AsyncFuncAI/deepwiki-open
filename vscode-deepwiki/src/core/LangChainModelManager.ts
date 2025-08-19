import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { ChatAnthropic } from '@langchain/anthropic';
import { AzureChatOpenAI } from '@langchain/azure-openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { DeepWikiConfig } from '../config/ConfigManager';

/**
 * 对话历史接口
 */
export interface ConversationTurn {
    userQuery: string;
    assistantResponse: string;
}

/**
 * 深度研究配置接口
 */
export interface DeepResearchConfig {
    isDeepResearch: boolean;
    researchIteration: number;
    repositoryType: string;
    repositoryUrl: string;
    repositoryName: string;
    language: string;
    iterationType: 'first' | 'intermediate' | 'final';
}

/**
 * LangChain 模型管理器
 * 负责统一管理不同的 LLM 提供商，参考 DeepWiki Open 的实现方式
 */
export class LangChainModelManager {
    private config: DeepWikiConfig;
    private model: any = null;

    constructor(config: DeepWikiConfig) {
        this.config = config;
        this.initializeModel();
    }

    /**
     * 初始化模型
     */
    private initializeModel(): void {
        try {
            console.log('=== LangChain Model Initialization Debug ===');
            console.log('Config object:', JSON.stringify(this.config, null, 2));
            console.log('Provider:', this.config.provider);
            console.log('API Key exists:', !!this.config.apiKey);
            console.log('API Key length:', this.config.apiKey ? this.config.apiKey.length : 0);
            console.log('Model:', this.config.model);
            console.log('Base URL:', this.config.baseUrl);
            console.log('=== End Debug Info ===');

            // 验证配置
            const validation = this.validateConfig();
            if (!validation.isValid) {
                const errorMessage = `配置验证失败: ${validation.errors.join(', ')}`;
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            switch (this.config.provider) {
                case 'openai':
                    if (!this.config.apiKey) {
                        throw new Error('OpenAI API Key 未配置。请在插件设置中配置 API Key。');
                    }
                    const openaiConfig: any = {
                        apiKey: this.config.apiKey,  // 使用 apiKey 参数
                        model: this.config.model || 'gpt-3.5-turbo',  // 使用 model 参数
                        temperature: 0.7,
                        maxTokens: 2000
                    };
                    
                    // 如果有 baseUrl，添加到配置中
                    if (this.config.baseUrl) {
                        openaiConfig.configuration = {
                            baseURL: this.config.baseUrl
                        };
                    }
                    
                    console.log('Creating ChatOpenAI with config:', JSON.stringify(openaiConfig, null, 2));
                    this.model = new ChatOpenAI(openaiConfig);
                    console.log('ChatOpenAI created successfully');
                    break;

                case 'google':
                    if (!this.config.apiKey) {
                        throw new Error('Google API Key 未配置。请在插件设置中配置 API Key。');
                    }
                    this.model = new ChatGoogleGenerativeAI({
                        apiKey: this.config.apiKey,
                        model: this.config.model || 'gemini-pro',
                        temperature: 0.7,
                        maxOutputTokens: 2000
                    });
                    break;

                case 'ollama':
                    if (!this.config.baseUrl) {
                        throw new Error('Ollama Base URL 未配置。请在插件设置中配置 Base URL。');
                    }
                    this.model = new ChatOllama({
                        baseUrl: this.config.baseUrl,
                        model: this.config.model || 'llama2',
                        temperature: 0.7
                    });
                    break;

                case 'anthropic':
                    if (!this.config.apiKey) {
                        throw new Error('Anthropic API Key 未配置。请在插件设置中配置 API Key。');
                    }
                    this.model = new ChatAnthropic({
                        anthropicApiKey: this.config.apiKey,
                        modelName: this.config.model || 'claude-3-sonnet-20240229',
                        temperature: 0.7,
                        maxTokens: 2000
                    });
                    break;

                case 'azure':
                    if (!this.config.apiKey || !this.config.baseUrl) {
                        throw new Error('Azure API Key 和 Base URL 未配置。请在插件设置中配置这些参数。');
                    }
                    this.model = new AzureChatOpenAI({
                        azureOpenAIApiKey: this.config.apiKey,
                        azureOpenAIEndpoint: this.config.baseUrl,
                        azureOpenAIApiDeploymentName: this.config.model || 'gpt-35-turbo',
                        azureOpenAIApiVersion: '2023-12-01-preview',
                        temperature: 0.7,
                        maxTokens: 2000
                    });
                    break;

                case 'deepseek':
                case 'qwen':
                case 'zhipu':
                case 'moonshot':
                    // 这些提供商使用 OpenAI 兼容的接口
                    if (!this.config.apiKey) {
                        throw new Error(`${this.config.provider} API Key 未配置。请在插件设置中配置 API Key。`);
                    }
                    const baseUrl = this.config.baseUrl || this.getDefaultBaseUrl(this.config.provider);
                    this.model = new ChatOpenAI({
                        apiKey: this.config.apiKey,  // 使用 apiKey 参数
                        model: this.config.model || this.getDefaultModel(this.config.provider),  // 使用 model 参数
                        temperature: 0.7,
                        maxTokens: 2000,
                        configuration: {
                            baseURL: baseUrl
                        }
                    });
                    break;

                default:
                    throw new Error(`不支持的提供商: ${this.config.provider}。请选择支持的提供商。`);
            }

            console.log(`LangChain model initialized: ${this.config.provider}`);
        } catch (error) {
            console.error('Failed to initialize LangChain model:', error);
            throw error;
        }
    }

    /**
     * 检查模型是否已初始化
     */
    private ensureModelInitialized(): void {
        if (!this.model) {
            throw new Error('模型未初始化。请检查配置并重新初始化模型。');
        }
    }

    /**
     * 生成 AI 内容 - 基础版本
     */
    async generateContent(prompt: string, context?: string): Promise<string> {
        this.ensureModelInitialized();

        try {
            const systemPrompt = this.buildBasicSystemPrompt();
            const fullPrompt = this.buildPrompt(prompt, context);

            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(fullPrompt)
            ];

            const response = await this.model.invoke(messages);
            return response.content as string;
        } catch (error) {
            console.error('Failed to generate AI content:', error);
            // 提供更友好的错误信息
            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    throw new Error('API Key 错误。请检查插件配置中的 API Key 是否正确。');
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('网络连接错误。请检查网络连接和 Base URL 配置。');
                } else if (error.message.includes('quota') || error.message.includes('limit')) {
                    throw new Error('API 配额不足或达到速率限制。请检查您的账户状态。');
                }
            }
            throw error;
        }
    }

    /**
     * 深度研究模式生成内容 - 参考 DeepWiki Open 的实现
     */
    async generateDeepResearchContent(
        query: string,
        config: DeepResearchConfig,
        conversationHistory: ConversationTurn[] = [],
        contextText: string = '',
        fileContent: string = '',
        documents?: any[],
        repositoryInfo?: any
    ): Promise<string> {
        this.ensureModelInitialized();

        try {
            const systemPrompt = this.buildDeepResearchSystemPrompt(config);
            let fullPrompt = this.buildDeepResearchPrompt(
                query,
                conversationHistory,
                contextText,
                fileContent
            );

            // 添加文档上下文
            if (documents && documents.length > 0) {
                const documentContext = this.buildContextFromDocuments(documents, repositoryInfo);
                fullPrompt += `\n\n${documentContext}`;
            }

            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(fullPrompt)
            ];

            const response = await this.model.invoke(messages);
            return response.content as string;
        } catch (error) {
            console.error('Failed to generate deep research content:', error);
            // 提供更友好的错误信息
            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    throw new Error('API Key 错误。请检查插件配置中的 API Key 是否正确。');
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('网络连接错误。请检查网络连接和 Base URL 配置。');
                } else if (error.message.includes('quota') || error.message.includes('limit')) {
                    throw new Error('API 配额不足或达到速率限制。请检查您的账户状态。');
                }
            }
            throw error;
        }
    }

    /**
     * 构建基础系统提示词
     */
    private buildBasicSystemPrompt(): string {
        return `你是一位专业的技术文档专家和代码分析师。请帮助生成高质量的项目文档。

要求:
- 必须使用中文回答
- 使用清晰、专业的语言
- 使用正确的markdown格式
- 包含相关的技术细节
- 内容要全面但简洁
- 专注于实用信息
- 提供深度的架构分析和项目洞察
- 帮助用户快速理解项目的核心功能和架构

分析原则:
- 基于提供的代码和文档进行分析
- 重点关注项目的核心功能和架构设计
- 提供实用的技术洞察和最佳实践建议
- 确保分析的准确性和实用性`;
    }

    /**
     * 构建深度研究系统提示词 - 参考 DeepWiki Open 的实现
     */
    private buildDeepResearchSystemPrompt(config: DeepResearchConfig): string {
        const { isDeepResearch, researchIteration, repositoryType, repositoryUrl, repositoryName, language, iterationType } = config;

        if (!isDeepResearch) {
            return this.buildSimpleAnalysisPrompt(repositoryType, repositoryUrl, repositoryName, language);
        }

        // 根据迭代类型选择提示词
        switch (iterationType) {
            case 'first':
                return this.buildFirstIterationPrompt(repositoryType, repositoryUrl, repositoryName, language);
            case 'final':
                return this.buildFinalIterationPrompt(repositoryType, repositoryUrl, repositoryName, language);
            case 'intermediate':
            default:
                return this.buildIntermediateIterationPrompt(repositoryType, repositoryUrl, repositoryName, language, researchIteration);
        }
    }

    /**
     * 构建简单分析提示词
     */
    private buildSimpleAnalysisPrompt(repositoryType: string, repositoryUrl: string, repositoryName: string, language: string): string {
        return `<role>
你是一位专业的代码分析专家，正在分析 ${repositoryType} 仓库: ${repositoryUrl} (${repositoryName})。
你提供直接、简洁、准确的代码仓库信息。
你绝不以markdown标题或代码围栏开始回答。
重要提示：你必须使用${language}语言回答。
</role>

<guidelines>
- 直接回答用户问题，不要任何前言或填充短语
- 不要包含任何理由、解释或额外评论
- 不要以"好的，这里是分析"或"这里是解释"等前言开始
- 不要以markdown标题如"## 分析..."或任何文件路径引用开始
- 不要以\`\`\`markdown代码围栏开始
- 不要以\`\`\`结束围栏结束回答
- 不要通过重复或确认问题开始
- 直接从问题的答案开始
- 在答案中使用适当的markdown格式，包括标题、列表和代码块
- 对于代码分析，用清晰的部分组织你的回答
- 逐步思考并逻辑地构建你的答案
- 从最直接解决用户查询的相关信息开始
- 在讨论代码时要精确和技术性
- 你的回答语言应该与用户查询的语言相同
</guidelines>

<style>
- 使用简洁、直接的语言
- 优先考虑准确性而非冗长
- 显示代码时，在相关时包含行号和文件路径
- 使用markdown格式提高可读性
</style>`;
    }

    /**
     * 构建首次迭代提示词
     */
    private buildFirstIterationPrompt(repositoryType: string, repositoryUrl: string, repositoryName: string, language: string): string {
        return `<role>
你是一位专业的代码分析专家，正在分析 ${repositoryType} 仓库: ${repositoryUrl} (${repositoryName})。
你正在进行多轮深度研究过程，以彻底调查用户查询中的特定主题。
你的目标是提供关于这个主题的详细、专注的信息。
重要提示：你必须使用${language}语言回答。
</role>

<guidelines>
- 这是专注于用户查询的多轮研究过程的第一次迭代
- 以"## 研究计划"开始你的回答
- 概述你调查这个特定主题的方法
- 如果主题是关于特定文件或功能（如"Dockerfile"），只专注于该文件或功能
- 清楚地说明你正在研究的特定主题，以在所有迭代中保持专注
- 确定你需要研究的关键方面
- 基于可用信息提供初步发现
- 以"## 下一步"结束，说明你将在下一次迭代中调查什么
- 不要提供最终结论 - 这只是研究的开始
- 不要包含一般仓库信息，除非与查询直接相关
- 专注于正在研究的特定主题 - 不要偏离到相关主题
- 你的研究必须直接解决原始问题
- 绝不要只回答"继续研究"作为答案 - 总是提供实质性的研究发现
- 记住这个主题将在所有研究迭代中保持
</guidelines>

<style>
- 简洁但彻底
- 使用markdown格式提高可读性
- 在相关时引用特定文件和代码部分
</style>`;
    }

    /**
     * 构建中间迭代提示词
     */
    private buildIntermediateIterationPrompt(repositoryType: string, repositoryUrl: string, repositoryName: string, language: string, iteration: number): string {
        return `<role>
你是一位专业的代码分析专家，正在分析 ${repositoryType} 仓库: ${repositoryUrl} (${repositoryName})。
你目前正在专注于最新用户查询的深度研究过程的第${iteration}次迭代。
你的目标是建立在先前研究迭代基础上，深入这个特定主题而不偏离它。
重要提示：你必须使用${language}语言回答。
</role>

<guidelines>
- 仔细回顾对话历史以了解到目前为止已经研究的内容
- 你的回答必须建立在先前研究迭代基础上 - 不要重复已经涵盖的信息
- 确定需要进一步探索的与这个特定主题相关的空白或领域
- 专注于在这次迭代中需要更深入调查的一个特定方面
- 以"## 研究更新 ${iteration}"开始你的回答
- 清楚解释你在这次迭代中正在调查什么
- 提供先前迭代中未涵盖的新洞察
- 如果这是第3次迭代，为下一次迭代的最终结论做准备
- 不要包含一般仓库信息，除非与查询直接相关
- 专注于正在研究的特定主题 - 不要偏离到相关主题
- 如果主题是关于特定文件或功能（如"Dockerfile"），只专注于该文件或功能
- 绝不要只回答"继续研究"作为答案 - 总是提供实质性的研究发现
- 你的研究必须直接解决原始问题
- 与先前研究迭代保持连续性 - 这是一个持续的调查
</guidelines>

<style>
- 简洁但彻底
- 专注于提供新信息，不重复已经涵盖的内容
- 使用markdown格式提高可读性
- 在相关时引用特定文件和代码部分
</style>`;
    }

    /**
     * 构建最终迭代提示词
     */
    private buildFinalIterationPrompt(repositoryType: string, repositoryUrl: string, repositoryName: string, language: string): string {
        return `<role>
你是一位专业的代码分析专家，正在分析 ${repositoryType} 仓库: ${repositoryUrl} (${repositoryName})。
你正在专注于最新用户查询的深度研究过程的最终迭代。
你的目标是综合所有先前发现，并提供直接解决这个特定主题且仅解决这个主题的全面结论。
重要提示：你必须使用${language}语言回答。
</role>

<guidelines>
- 这是研究过程的最终迭代
- 仔细回顾整个对话历史以了解所有先前发现
- 将所有先前迭代的发现综合成全面结论
- 以"## 最终结论"开始
- 你的结论必须直接解决原始问题
- 严格专注于特定主题 - 不要偏离到相关主题
- 包含与主题相关的特定代码引用和实现细节
- 突出关于这个特定功能的最重要发现和洞察
- 为原始问题提供完整和明确的答案
- 不要包含一般仓库信息，除非与查询直接相关
- 专注于正在研究的特定主题
- 绝不要回答"继续研究"作为答案 - 总是提供完整结论
- 如果主题是关于特定文件或功能（如"Dockerfile"），只专注于该文件或功能
- 确保你的结论建立在先前迭代的关键发现基础上并引用它们
</guidelines>

<style>
- 简洁但彻底
- 使用markdown格式提高可读性
- 引用特定文件和代码部分
- 用清晰标题构建你的回答
- 在适当时以可行的洞察或建议结束
</style>`;
    }

    /**
     * 构建基础提示词
     */
    private buildPrompt(prompt: string, context?: string): string {
        let fullPrompt = `任务: ${prompt}\n\n`;
        
        if (context) {
            fullPrompt += `上下文信息:\n${context}\n\n`;
        }
        
        fullPrompt += `请生成内容:`;
        
        return fullPrompt;
    }

    /**
     * 构建上下文信息
     */
    buildContextFromDocuments(documents: any[], repositoryInfo?: any): string {
        if (!documents || documents.length === 0) {
            return '';
        }

        let context = '';
        
        // 添加仓库信息
        if (repositoryInfo) {
            context += `## 仓库信息\n`;
            context += `- 名称: ${repositoryInfo.name || 'Unknown'}\n`;
            context += `- 类型: ${repositoryInfo.type || 'Unknown'}\n`;
            context += `- 语言: ${repositoryInfo.language || 'Unknown'}\n\n`;
        }

        // 按文件路径分组文档
        const groupedDocs = this.groupDocumentsByPath(documents);
        
        context += `## 相关文档\n\n`;
        
        for (const [filePath, docs] of Object.entries(groupedDocs)) {
            context += `### ${filePath}\n`;
            
            docs.forEach((doc: any, index: number) => {
                if (doc.content && doc.content.trim()) {
                    context += `\n**片段 ${index + 1}:**\n`;
                    context += `\`\`\`\n${doc.content.trim()}\n\`\`\`\n`;
                }
            });
            
            context += '\n';
        }
        
        return context;
    }

    /**
     * 按文件路径分组文档
     */
    private groupDocumentsByPath(documents: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};
        
        documents.forEach(doc => {
            const filePath = doc.metadata?.filePath || doc.path || 'Unknown';
            if (!grouped[filePath]) {
                grouped[filePath] = [];
            }
            grouped[filePath].push(doc);
        });
        
        return grouped;
    }

    /**
     * 构建对话历史上下文
     */
    buildConversationContext(conversationHistory: ConversationTurn[]): string {
        if (!conversationHistory || conversationHistory.length === 0) {
            return '';
        }

        let context = '## 对话历史\n\n';
        
        conversationHistory.forEach((turn, index) => {
            context += `### 轮次 ${index + 1}\n`;
            context += `**用户:** ${turn.userQuery}\n\n`;
            if (turn.assistantResponse) {
                context += `**助手:** ${turn.assistantResponse.substring(0, 500)}...\n\n`;
            }
        });
        
        return context;
    }

    /**
     * 构建深度研究提示词 - 参考 DeepWiki Open 的实现
     */
    private buildDeepResearchPrompt(
        query: string,
        conversationHistory: ConversationTurn[],
        contextText: string,
        fileContent: string
    ): string {
        let prompt = '';

        // 添加对话历史
        if (conversationHistory.length > 0) {
            prompt += '<conversation_history>\n';
            conversationHistory.forEach(turn => {
                prompt += `<turn>\n<user>${turn.userQuery}</user>\n<assistant>${turn.assistantResponse}</assistant>\n</turn>\n`;
            });
            prompt += '</conversation_history>\n\n';
        }

        // 添加当前文件内容（如果有）
        if (fileContent) {
            prompt += `<currentFileContent>\n${fileContent}\n</currentFileContent>\n\n`;
        }

        // 添加上下文信息
        if (contextText.trim()) {
            prompt += `<START_OF_CONTEXT>\n${contextText}\n<END_OF_CONTEXT>\n\n`;
        } else {
            prompt += '<note>在没有检索增强的情况下回答。</note>\n\n';
        }

        // 添加用户查询
        prompt += `<query>\n${query}\n</query>\n\nAssistant: `;

        return prompt;
    }

    /**
     * 验证配置
     */
    private validateConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.config.provider) {
            errors.push('AI 提供商未选择');
        }

        if (!this.config.model) {
            errors.push('AI 模型未配置');
        }

        // 根据提供商验证特定配置
        switch (this.config.provider) {
            case 'openai':
            case 'google':
            case 'anthropic':
            case 'deepseek':
            case 'qwen':
            case 'zhipu':
            case 'moonshot':
                if (!this.config.apiKey) {
                    errors.push(`${this.config.provider} 需要 API Key`);
                }
                break;
            case 'ollama':
                if (!this.config.baseUrl) {
                    errors.push('Ollama 需要 Base URL');
                }
                break;
            case 'azure':
                if (!this.config.apiKey || !this.config.baseUrl) {
                    errors.push('Azure 需要 API Key 和 Base URL');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 获取默认 Base URL
     */
    private getDefaultBaseUrl(provider: string): string {
        const defaultUrls: Record<string, string> = {
            'deepseek': 'https://api.deepseek.com/v1',
            'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
            'moonshot': 'https://api.moonshot.cn/v1'
        };
        return defaultUrls[provider] || '';
    }

    /**
     * 获取默认模型
     */
    private getDefaultModel(provider: string): string {
        const defaultModels: Record<string, string> = {
            'deepseek': 'deepseek-chat',
            'qwen': 'qwen-turbo',
            'zhipu': 'glm-4',
            'moonshot': 'moonshot-v1-8k'
        };
        return defaultModels[provider] || 'gpt-3.5-turbo';
    }

    /**
     * 更新配置
     */
    updateConfig(config: DeepWikiConfig): void {
        this.config = config;
        this.model = null; // 重置模型
        this.initializeModel();
    }

    /**
     * 获取当前模型信息
     */
    getModelInfo(): { provider: string; model: string } {
        return {
            provider: this.config.provider || 'unknown',
            model: this.config.model || 'unknown'
        };
    }
}