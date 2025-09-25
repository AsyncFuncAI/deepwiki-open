# DeepWiki VS Code 插件安装指南

## 快速安装

### 方法一：从 VSIX 文件安装

1. 确保已生成 `vscode-deepwiki-0.1.0.vsix` 文件：
   ```bash
   npm run package
   ```

2. 在 VS Code 中安装：
   - 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
   - 输入 "Extensions: Install from VSIX..."
   - 选择 `vscode-deepwiki-0.1.0.vsix` 文件
   - 等待安装完成

### 方法二：开发模式安装

1. 克隆或下载项目到本地
2. 在项目目录中运行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VS Code 中按 `F5` 启动调试会话
4. 在新打开的 VS Code 窗口中测试插件

## 验证安装

安装成功后，你应该能看到：

1. **命令面板中的命令**：
   - `DeepWiki: Generate Wiki`
   - `DeepWiki: Open Configuration`
   - `DeepWiki: Clear Cache`

2. **快捷键**：
   - `Ctrl+Shift+W` (Windows/Linux) 或 `Cmd+Shift+W` (Mac) 生成 Wiki

3. **右键菜单**：
   - 在文件资源管理器中右键点击文件夹，应该能看到 "Generate Wiki" 选项

## 首次使用

### 1. 配置 AI 提供商（可选）

如果你想使用 AI 增强功能，需要先配置 AI 提供商：

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "DeepWiki: Open Configuration"
3. 在配置界面中设置：
   - **Provider**: 选择 AI 提供商（openai、google、ollama 等）
   - **Model**: 选择模型（如 gpt-3.5-turbo、gemini-pro 等）
   - **API Key**: 输入你的 API 密钥
   - **Base URL**: 如果使用自定义服务，输入基础 URL

### 2. 生成第一个 Wiki

1. 在 VS Code 中打开一个项目文件夹
2. 按 `Ctrl+Shift+W` 或在命令面板中输入 "Generate Wiki"
3. 等待分析完成（首次可能需要几秒钟）
4. Wiki 将在新的 WebView 标签页中显示

## 配置选项

你可以在 VS Code 设置中配置以下选项：

```json
{
  "deepwiki.provider": "openai",
  "deepwiki.model": "gpt-3.5-turbo",
  "deepwiki.apiKey": "your-api-key-here",
  "deepwiki.baseUrl": "https://api.openai.com/v1",
  "deepwiki.excludedDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".vscode",
    "out"
  ],
  "deepwiki.excludedFiles": [
    "*.log",
    "*.tmp",
    "*.cache",
    "*.lock",
    "*.map",
    ".DS_Store",
    "package-lock.json",
    "yarn.lock"
  ]
}
```

## 故障排除

### 插件无法加载

1. 检查 VS Code 版本是否 >= 1.74.0
2. 重新安装插件
3. 重启 VS Code

### Wiki 生成失败

1. 检查项目文件夹是否有读取权限
2. 查看 VS Code 开发者控制台的错误信息：
   - 按 `Ctrl+Shift+I` 打开开发者工具
   - 查看 Console 标签页的错误信息

### AI 功能不工作

1. 检查 API 密钥是否正确
2. 检查网络连接
3. 验证 API 服务是否可用
4. 查看控制台错误信息

### 缓存问题

如果遇到缓存相关问题：

1. 使用 "DeepWiki: Clear Cache" 命令清除缓存
2. 手动删除项目中的 `.deepwiki` 文件夹
3. 重新生成 Wiki

## 卸载

1. 在 VS Code 扩展面板中找到 DeepWiki
2. 点击卸载按钮
3. 重启 VS Code

## 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的 GitHub Issues
3. 提交新的 Issue 并包含：
   - VS Code 版本
   - 插件版本
   - 错误信息
   - 重现步骤

## 更新

当有新版本可用时：

1. 下载新的 `.vsix` 文件
2. 使用相同的安装方法覆盖安装
3. 重启 VS Code

---

**注意**：首次使用时，插件会创建必要的配置文件和缓存目录。这是正常行为，不会影响你的项目文件。