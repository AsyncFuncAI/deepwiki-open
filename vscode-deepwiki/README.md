# DeepWiki VS Code Extension

一个强大的 VS Code 插件，用于自动生成项目的 Wiki 文档。

## 功能特性

- 🚀 **一键生成 Wiki**：使用快捷键 `Ctrl+Shift+W` 快速生成项目 Wiki
- 📊 **项目分析**：自动分析项目结构、文件类型和代码统计
- 🎨 **美观展示**：在 WebView 中以美观的格式展示 Wiki 内容
- 💾 **智能缓存**：缓存生成的 Wiki，提高后续访问速度
- ⚙️ **灵活配置**：支持多种 AI 提供商（OpenAI、Google、Ollama 等）
- 📁 **文件过滤**：可配置排除特定目录和文件

## 安装

1. 下载 `vscode-deepwiki-0.1.0.vsix` 文件
2. 在 VS Code 中按 `Ctrl+Shift+P` 打开命令面板
3. 输入 "Extensions: Install from VSIX..."
4. 选择下载的 `.vsix` 文件进行安装

## 使用方法

### 快速开始

1. 打开一个项目文件夹
2. 按 `Ctrl+Shift+W` 或在命令面板中输入 "Generate Wiki"
3. 等待分析完成，Wiki 将在新的 WebView 中显示

### 配置 AI 提供商

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "DeepWiki: Open Configuration"
3. 在配置界面中设置：
   - AI 提供商（OpenAI、Google、Ollama 等）
   - 模型名称
   - API 密钥
   - 基础 URL（如果需要）

### 可用命令

- `DeepWiki: Generate Wiki` - 生成项目 Wiki
- `DeepWiki: Open Configuration` - 打开配置界面
- `DeepWiki: Clear Cache` - 清除缓存

## 配置选项

插件支持以下配置选项：

```json
{
  "deepwiki.provider": "openai",
  "deepwiki.model": "gpt-3.5-turbo",
  "deepwiki.apiKey": "your-api-key",
  "deepwiki.baseUrl": "https://api.openai.com/v1",
  "deepwiki.excludedDirs": ["node_modules", ".git", "dist"],
  "deepwiki.excludedFiles": ["*.log", "*.tmp", "package-lock.json"]
}
```

## 支持的 AI 提供商

- **OpenAI**：GPT-3.5、GPT-4 等模型
- **Google**：Gemini 系列模型
- **Ollama**：本地部署的开源模型
- **自定义**：支持兼容 OpenAI API 的其他服务

## 生成的 Wiki 内容

生成的 Wiki 包含以下部分：

1. **项目概览**：项目基本信息和统计
2. **架构说明**：项目架构模式和主要目录
3. **文件结构**：完整的项目文件树
4. **代码分析**：按文件类型分组的代码分析
5. **依赖说明**：项目依赖和包管理文件
6. **设置说明**：项目设置和安装指南
7. **使用说明**：基于 README 的使用指南

## 缓存机制

- Wiki 数据会自动缓存到项目的 `.deepwiki` 目录
- 缓存有效期为 7 天
- 可以手动清除缓存或设置自动清理

## 开发

### 构建项目

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听文件变化
npm run watch

# 打包插件
npm run package
```

### 调试

1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试会话
3. 在新的 VS Code 窗口中测试插件功能

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v0.1.0

- 初始版本发布
- 支持基础的 Wiki 生成功能
- 支持多种 AI 提供商配置
- 实现缓存机制
- 添加配置界面