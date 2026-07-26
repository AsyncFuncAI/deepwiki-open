# DeepWiki 固定 OpenAI 路由 + 火山 Ark Embedding 迁移包说明

本包用于把另一个 `deepwiki-open` 工程配置成相同模式。

## 模式说明

- 页面仍选择 `OpenAI` provider。
- OpenAI provider 下拉里的模型用于生成内容。
- 生成请求先到本机 LiteLLM，再转发到 Ark 或 CRS。
- Embedding 默认走火山 Ark Coding endpoint。
- Ollama 只作为可选 embedding 回退。

## 目标机器依赖

目标机器需要：

1. Windows PowerShell。
2. Python，可执行 `python -m venv`。
3. Poetry，可执行 `poetry -P api run python -m api.main`。
4. Node.js / npm，可执行 `npx next dev`。
5. 可访问火山方舟 Ark Coding endpoint。
6. 可选 Ollama，只在 `-EmbeddingProvider ollama` 时需要。
7. 环境变量：

```text
llmkey-ark
crs_oai_key
```

不要把真实 Key 写进配置文件。脚本只读取环境变量。

## 默认端口

```text
Frontend:  http://localhost:3000
Backend:   http://localhost:8002
LiteLLM:   http://localhost:4000
Ollama:    http://localhost:11434
```

## 生成模型

这些模型显示在页面 `OpenAI` provider 下，用于 Wiki 生成、Ask 回答、总结和图表生成。

| 页面模型 | 实际地址 | Key 环境变量 | 实际模型 |
| --- | --- | --- | --- |
| `ark-code-latest` | `https://ark.cn-beijing.volces.com/api/coding/v3` | `llmkey-ark` | `ark-code-latest` |
| `deepseek-v4-flash-260425` | `https://ark.cn-beijing.volces.com/api/coding/v3` | `llmkey-ark` | `deepseek-v4-flash-260425` |
| `crs` | `http://47.101.159.7:39187/v1` | `crs_oai_key` | `gpt5.5` |

## Embedding 模型

Embedding 用于仓库索引和检索，不用于生成最终文本。

默认火山 Ark 模型：

```text
doubao-embedding-vision-251215
```

本机已用 `llmkey-ark` 实测该模型可通过：

```text
https://ark.cn-beijing.volces.com/api/coding/v3/embeddings
```

返回 2048 维向量。

可选 Ollama 模型：

```text
nomic-embed-text
```

## 使用方法

1. 把压缩包解到目标 `deepwiki-open` 工程根目录，覆盖同名文件。
2. 设置环境变量 `llmkey-ark` 和 `crs_oai_key`。
3. 启动：

```powershell
.\start-fixed-openai-full.ps1
```

如果要指定另一个火山 embedding 模型：

```powershell
.\start-fixed-openai-full.ps1 -EmbeddingModel <模型id>
```

如果要临时切回 Ollama：

```powershell
.\start-fixed-openai-full.ps1 -EmbeddingProvider ollama
```

## 覆盖文件说明

- `run-fixed-openai.ps1`：启动 LiteLLM + 后端；读取 Key；设置生成和 embedding 环境变量。
- `start-fixed-openai-full.ps1`：完整一键启动前端、后端、LiteLLM。
- `litellm-config.yml`：固定 Ark / CRS 模型路由。
- `api/config/generator.json`：OpenAI 下拉模型列表。
- `api/config/embedder.json`：火山 Ark / Ollama embedding 配置。
- `FIXED_OPENAI_USAGE.zh.md`：完整使用说明。
- `watch-deepwiki-progress.ps1`：查看本地仓库处理、embedding 和生成进度。
- `src/utils/websocketClient.ts` 和相关页面：修正前端 WebSocket 后端地址。
- `package.json`：关闭 Turbopack，避免旧 chunk 导致 WebSocket 地址不更新。

## 快速验证

```powershell
$key = [Environment]::GetEnvironmentVariable('llmkey-ark','User')
$body = @{ model='doubao-embedding-vision-251215'; input=@('test') } | ConvertTo-Json
Invoke-RestMethod https://ark.cn-beijing.volces.com/api/coding/v3/embeddings `
  -Method Post `
  -Headers @{ Authorization = "Bearer $key" } `
  -ContentType 'application/json' `
  -Body $body

Invoke-WebRequest http://127.0.0.1:4000/health/liveliness
Invoke-WebRequest http://127.0.0.1:8002/health
Invoke-WebRequest http://127.0.0.1:3000
```
