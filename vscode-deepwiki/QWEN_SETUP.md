# Qwen (Dashscope) 配置指南

本文档介绍如何在 VSCode DeepWiki 插件中配置和使用 Qwen (Dashscope) AI 提供商。

## 前提条件

1. 拥有阿里云账号
2. 开通 DashScope 服务
3. 获取 API Key 和工作空间 ID（可选）

## 配置步骤

### 1. 获取 API 凭证

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 进入 [DashScope 控制台](https://dashscope.console.aliyun.com/)
3. 在 API-KEY 管理页面创建新的 API Key
4. 记录下 API Key 和工作空间 ID（如果有）

### 2. 在 VSCode 中配置

#### 方法一：通过设置界面

1. 打开 VSCode 设置（`Ctrl/Cmd + ,`）
2. 搜索 "deepwiki"
3. 配置以下选项：
   - **Provider**: 选择 `qwen`
   - **Model**: 输入模型名称（如 `qwen-turbo`, `qwen-plus`, `qwen-max`）
   - **API Key**: 输入您的 DashScope API Key
   - **Base URL**: 保持默认值或输入自定义端点
   - **Workspace ID**: 输入工作空间 ID（可选）

#### 方法二：通过配置文件

在 VSCode 的 `settings.json` 中添加：

```json
{
  "deepwiki.provider": "qwen",
  "deepwiki.model": "qwen-turbo",
  "deepwiki.apiKey": "your-dashscope-api-key",
  "deepwiki.baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "deepwiki.workspaceId": "your-workspace-id"
}
```

### 3. 支持的模型

- `qwen-turbo`: 快速响应，适合日常使用
- `qwen-plus`: 平衡性能和质量
- `qwen-max`: 最高质量，适合复杂任务
- `qwen-long`: 支持长文本处理

### 4. 验证配置

1. 打开命令面板（`Ctrl/Cmd + Shift + P`）
2. 运行 "DeepWiki: Generate Wiki" 命令
3. 如果配置正确，插件将使用 Qwen 模型生成文档

## 故障排除

### 常见错误

1. **"Unsupported AI provider: qwen"**
   - 确保插件已更新到最新版本
   - 重新加载 VSCode 窗口

2. **API 调用失败**
   - 检查 API Key 是否正确
   - 确认账户余额充足
   - 验证网络连接

3. **工作空间权限错误**
   - 确保 API Key 有访问指定工作空间的权限
   - 检查工作空间 ID 是否正确

### 调试技巧

1. 打开 VSCode 开发者工具（`Help > Toggle Developer Tools`）
2. 查看控制台输出中的错误信息
3. 检查网络请求是否成功发送

## 性能优化

1. **选择合适的模型**：根据任务复杂度选择模型
2. **调整参数**：适当调整 temperature 和 max_tokens
3. **批量处理**：对于大型项目，考虑分批处理

## 安全注意事项

1. **保护 API Key**：不要在代码中硬编码 API Key
2. **使用环境变量**：在生产环境中使用环境变量存储敏感信息
3. **定期轮换**：定期更新 API Key

## 支持和反馈

如果遇到问题或有改进建议，请：

1. 检查插件日志
2. 查看 [DashScope 官方文档](https://help.aliyun.com/zh/dashscope/)
3. 提交 Issue 到项目仓库

---

**注意**：使用 Qwen 服务可能产生费用，请根据阿里云的计费标准合理使用。