# DeepWiki 部署指南

## 新功能概览

本次更新包含了以下重要功能：

### 1. 邮箱验证系统
- 启动时需要输入 `@srp.one` 域名的邮箱地址
- 邮箱验证信息保存在本地存储中
- 提供了优雅的用户界面

### 2. 全局对话功能
- 支持跨多个仓库的智能对话
- 可以选择特定项目进行询问
- 支持多轮对话历史记录
- 访问路径：`/global-chat`

### 3. 组织仓库管理
- 自动获取GitHub组织下的所有仓库
- 支持批量生成Wiki
- 一键生成功能
- GitHub Token预填充支持
- 访问路径：`/organization-repos`

### 4. 深度搜索默认开启
- Ask组件现在默认开启深度搜索模式
- 提供更准确的代码分析结果

### 5. 持久化存储
- 支持Cloud Run持久化存储
- 使用Cloud Storage作为后端存储
- 防止重新部署时丢失Wiki缓存

## 本地开发设置

### 环境变量配置

创建 `.env` 文件：

```bash
# 必需的API密钥
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_API_KEY=AIza-your-google-api-key

# 可选的API密钥
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key
GITHUB_TOKEN=ghp_your-github-personal-access-token

# 认证配置（可选）
DEEPWIKI_AUTH_MODE=false
DEEPWIKI_AUTH_CODE=your-auth-code

# GitHub Token预填充（用于组织仓库功能）
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-github-token
```

### 启动开发环境

```bash
# 安装依赖
npm install
cd api && pip install -r requirements.txt && cd ..

# 启动前端（终端1）
npm run dev

# 启动后端（终端2）
cd api && python main.py
```

## Cloud Run部署

### 准备工作

1. 安装Google Cloud CLI
2. 设置项目和认证：

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 环境变量设置

```bash
export PROJECT_ID="your-google-cloud-project-id"
export OPENAI_API_KEY="sk-your-openai-api-key"
export GOOGLE_API_KEY="AIza-your-google-api-key"
export GITHUB_TOKEN="ghp_your-github-token"  # 可选
export OPENROUTER_API_KEY="sk-or-your-openrouter-key"  # 可选
```

### 持久化部署

使用新的持久化部署脚本：

```bash
# 使用持久化存储部署
./deploy-persistent.sh
```

此脚本会：
1. 创建Cloud Storage存储桶用于持久化
2. 配置生命周期规则（30天自动删除旧文件）
3. 部署带有持久化存储的Cloud Run服务
4. 自动配置环境变量

### 传统部署（无持久化）

如果不需要持久化存储：

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

## 功能使用指南

### 1. 邮箱验证

首次访问网站时，系统会要求输入邮箱：
- 必须是 `@srp.one` 域名结尾
- 验证后信息会保存在浏览器本地存储
- 清除浏览器数据后需要重新验证

### 2. 全局对话

访问 `/global-chat` 页面：
1. 选择要查询的项目（从已处理的项目列表中）
2. 输入问题进行跨项目对话
3. 支持多轮对话，会自动保存对话历史
4. 可以创建多个对话会话

### 3. 组织仓库管理

访问 `/organization-repos` 页面：
1. 输入GitHub Personal Access Token
2. 选择要管理的组织
3. 浏览组织下的所有仓库
4. 批量选择或单独生成Wiki

#### GitHub Token权限要求

需要具有以下权限的Personal Access Token：
- `repo` - 访问仓库
- `read:org` - 读取组织信息
- `read:user` - 读取用户信息

### 4. 持久化存储

#### Cloud Run环境

持久化存储自动配置：
- Wiki缓存保存在Cloud Storage中
- 重新部署不会丢失已生成的Wiki
- 自动清理30天以上的旧文件

#### 本地环境

Wiki缓存保存在：
- Linux/Mac: `~/.adalflow/wikicache/`
- Windows: `%USERPROFILE%/.adalflow/wikicache/`

#### Docker环境

使用Docker Volume：

```bash
docker run -d \
  -p 3000:3000 \
  -p 8001:8001 \
  -v deepwiki-cache:/app/data \
  -e OPENAI_API_KEY=your-key \
  -e GOOGLE_API_KEY=your-key \
  deepwiki:latest
```

## 故障排除

### 常见问题

1. **邮箱验证失败**
   - 确保邮箱以 `@srp.one` 结尾
   - 清除浏览器缓存重试

2. **GitHub Token无效**
   - 检查Token权限设置
   - 确保Token未过期
   - 重新生成Token并更新

3. **全局对话无响应**
   - 检查选择的项目是否已正确生成Wiki
   - 确认WebSocket连接正常
   - 查看浏览器控制台错误信息

4. **持久化存储问题**
   - 检查Cloud Storage存储桶权限
   - 确认环境变量 `WIKI_CACHE_PATH` 设置正确
   - 查看服务日志：`gcloud run services logs read deepwiki-persistent --region=us-central1`

### 日志查看

#### Cloud Run日志
```bash
gcloud run services logs read deepwiki-persistent --region=us-central1 --follow
```

#### 本地日志
检查终端输出和浏览器控制台。

## 管理命令

### Cloud Run管理

```bash
# 查看服务状态
gcloud run services describe deepwiki-persistent --region=us-central1

# 删除服务
gcloud run services delete deepwiki-persistent --region=us-central1

# 查看存储桶内容
gsutil ls -la gs://deepwiki-cache-${PROJECT_ID}

# 手动清理存储桶
gsutil rm -r gs://deepwiki-cache-${PROJECT_ID}/*
```

### 本地缓存管理

```bash
# 查看缓存目录
ls -la ~/.adalflow/wikicache/

# 清理所有缓存
rm -rf ~/.adalflow/wikicache/*
```

## 安全考虑

1. **API密钥安全**
   - 使用环境变量而非硬编码
   - 定期轮换API密钥
   - 使用最小权限原则

2. **GitHub Token安全**
   - 设置适当的权限范围
   - 定期检查Token使用情况
   - 及时吊销不需要的Token

3. **邮箱验证**
   - 验证信息仅存储在本地浏览器
   - 不会发送到服务器
   - 可以随时清除

## 性能优化

1. **缓存策略**
   - Wiki内容自动缓存
   - 避免重复生成相同内容
   - 定期清理过期缓存

2. **并发控制**
   - Cloud Run配置合理的并发数
   - 避免同时处理过多请求
   - 使用队列处理批量操作

3. **资源监控**
   - 监控内存和CPU使用率
   - 根据负载调整实例数量
   - 优化代码性能

## 贡献指南

如果您想要贡献代码或报告问题：
1. 先在本地环境测试所有功能
2. 确保新功能包含适当的错误处理
3. 更新相关文档
4. 提交Pull Request

---

更多技术详细信息请参考源代码注释和各组件的具体实现。 