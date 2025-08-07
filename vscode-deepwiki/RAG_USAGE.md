# DeepWiki RAG 功能使用指南

## 概述

DeepWiki 插件现在支持 RAG（Retrieval-Augmented Generation）功能，允许您与项目文档进行智能对话。

## 功能特性

### 核心功能
- 🔍 **智能文档检索**：基于向量相似度的文档检索
- 💬 **对话式问答**：与项目文档进行自然语言对话
- 📚 **上下文感知**：维护对话历史和上下文
- 🔧 **多 AI 提供商支持**：支持 OpenAI、DeepSeek、Qwen、Google、Zhipu、Moonshot、Ollama、Azure

### 已实现的组件
- ✅ **RAGManager**：核心 RAG 管理器
- ✅ **VectorRetriever**：向量检索器，支持 FAISS 和内存检索
- ✅ **AIModelClient**：多 AI 提供商客户端
- ✅ **ConversationMemory**：会话历史管理
- ✅ **WebView 界面**：RAG 聊天界面

## 使用方法

### 1. 配置 AI 提供商

首先需要配置您的 AI 提供商：

1. 打开 VSCode 设置（`Ctrl/Cmd + ,`）
2. 搜索 "deepwiki"
3. 配置以下设置：
   - `deepwiki.provider`：选择 AI 提供商
   - `deepwiki.model`：选择模型
   - `deepwiki.apiKey`：输入 API 密钥
   - `deepwiki.baseUrl`：（可选）自定义 API 端点

### 2. 生成项目 Wiki

在使用 RAG 功能之前，需要先生成项目的 Wiki：

1. 在项目根目录右键
2. 选择 "DeepWiki: Generate Wiki"
3. 或使用快捷键 `Ctrl/Cmd + Shift + W`

### 3. 启动 RAG 聊天

有两种方式启动 RAG 功能：

#### 方式一：RAG 聊天界面
1. 使用快捷键 `Ctrl/Cmd + Shift + R`
2. 或打开命令面板（`Ctrl/Cmd + Shift + P`）输入 "DeepWiki: Start RAG Chat"
3. 在打开的聊天界面中输入问题

#### 方式二：快速查询
1. 使用快捷键 `Ctrl/Cmd + Shift + Q`
2. 或打开命令面板输入 "DeepWiki: Quick RAG Query"
3. 在输入框中输入问题，直接获得答案

## 支持的 AI 提供商

### OpenAI
```json
{
  "deepwiki.provider": "openai",
  "deepwiki.model": "gpt-4",
  "deepwiki.apiKey": "sk-...",
  "deepwiki.baseUrl": "https://api.openai.com/v1"
}
```

### DeepSeek
```json
{
  "deepwiki.provider": "deepseek",
  "deepwiki.model": "deepseek-chat",
  "deepwiki.apiKey": "sk-...",
  "deepwiki.baseUrl": "https://api.deepseek.com/v1"
}
```

### Qwen
```json
{
  "deepwiki.provider": "qwen",
  "deepwiki.model": "qwen-turbo",
  "deepwiki.apiKey": "sk-...",
  "deepwiki.baseUrl": "https://dashscope.aliyuncs.com/api/v1"
}
```

### 其他提供商
- **Google Gemini**：`provider: "google"`
- **Zhipu GLM**：`provider: "zhipu"`
- **Moonshot**：`provider: "moonshot"`
- **Ollama**：`provider: "ollama"`（需要本地运行）
- **Azure OpenAI**：`provider: "azure"`

## 技术架构

### 核心组件

1. **RAGManager**：
   - 管理整个 RAG 流程
   - 协调文档检索和 AI 生成
   - 维护会话状态

2. **VectorRetriever**：
   - 文档向量化和索引
   - 基于相似度的文档检索
   - 支持多种嵌入模型

3. **AIModelClient**：
   - 统一的 AI 模型接口
   - 支持多种 AI 提供商
   - 自动处理 API 调用和错误

4. **ConversationMemory**：
   - 对话历史管理
   - 上下文维护
   - 会话状态持久化

### 数据流

1. **文档索引**：项目文件 → 文本提取 → 向量化 → 索引存储
2. **查询处理**：用户问题 → 向量检索 → 相关文档 → AI 生成 → 回答
3. **会话管理**：对话历史 → 上下文维护 → 连续对话

## 故障排除

### 常见问题

1. **"未找到 .deepwiki 目录"**
   - 解决方案：先运行 "Generate Wiki" 命令

2. **"API Key is required"**
   - 解决方案：在设置中配置正确的 API 密钥

3. **"Connection failed"**
   - 检查网络连接
   - 验证 API 密钥是否正确
   - 确认 baseUrl 配置（如果使用自定义端点）

### 调试模式

1. 打开 VSCode 开发者工具（`Help > Toggle Developer Tools`）
2. 查看控制台输出获取详细错误信息
3. 检查 RAG 相关的日志信息

## 开发信息

### 项目结构
```
src/
├── core/
│   ├── RAGManager.ts          # RAG 核心管理器
│   ├── VectorRetriever.ts     # 向量检索器
│   ├── AIModelClient.ts       # AI 模型客户端
│   └── ...
├── types/
│   └── index.ts               # 类型定义
├── config/
│   └── ConfigManager.ts       # 配置管理
└── extension.ts               # 扩展入口
```

### 扩展开发

如需扩展 RAG 功能，可以：

1. 添加新的 AI 提供商支持
2. 实现新的向量检索算法
3. 增强对话上下文管理
4. 优化文档索引策略

---

**注意**：RAG 功能需要有效的 AI API 密钥才能正常工作。请确保您已正确配置相应的 AI 提供商设置。