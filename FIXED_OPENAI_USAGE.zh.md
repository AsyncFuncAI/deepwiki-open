# DeepWiki 一键启动与模型配置说明

本工程当前采用“生成模型走 OpenAI-compatible 路径，Embedding 默认走火山方舟”的配置。

关键点：页面里的 `OpenAI` 只是协议入口，不代表真实供应商一定是 OpenAI。后端请求本机 LiteLLM，LiteLLM 再按模型名转发到 Ark 或 CRS。

## 当前架构

```text
浏览器
  -> Frontend http://localhost:3000
  -> Backend  http://localhost:8002
  -> LiteLLM  http://127.0.0.1:4000/v1
      -> Ark / CRS 生成模型

Backend
  -> Ark https://ark.cn-beijing.volces.com/api/coding/v3/embeddings
      -> 火山 embedding 模型
```

## 依赖内容

目标机器需要具备：

1. Windows PowerShell。
2. Python，并且能执行 `python -m venv`。
3. Poetry，本项目后端用：

```powershell
poetry -P api run python -m api.main
```

4. Node.js / npm，前端用：

```powershell
npx next dev --port 3000
```

5. 可访问火山方舟 Ark Coding endpoint，默认用于 embedding。
6. 可选：Ollama，只在你指定 `-EmbeddingProvider ollama` 时需要。
7. 环境变量：

```text
llmkey-ark
crs_oai_key
```

脚本会读取这些环境变量，不会把 Key 写入配置文件。

## 默认端口

| 组件 | 地址 | 作用 |
| --- | --- | --- |
| Frontend | `http://localhost:3000` | 页面 |
| Backend | `http://localhost:8002` | DeepWiki API / WebSocket |
| LiteLLM | `http://localhost:4000` | 生成模型代理 |
| Ark Embedding | `https://ark.cn-beijing.volces.com/api/coding/v3` | Embedding API |

## OpenAI 下拉模型的作用

页面选择 `OpenAI` provider 后，可以选择以下模型。这些模型用于：

- 生成 Wiki 页面内容。
- 生成 Ask 回答。
- 生成 Mermaid 图、解释、总结等文本。

它们不负责 embedding。

| 页面选择 | 实际供应商/地址 | Key 环境变量 | 实际模型 |
| --- | --- | --- | --- |
| `ark-code-latest` | `https://ark.cn-beijing.volces.com/api/coding/v3` | `llmkey-ark` | `ark-code-latest` |
| `deepseek-v4-flash-260425` | `https://ark.cn-beijing.volces.com/api/coding/v3` | `llmkey-ark` | `deepseek-v4-flash-260425` |
| `crs` | `http://47.101.159.7:39187/v1` | `crs_oai_key` | `gpt5.5` |

配置位置：

```text
api/config/generator.json
litellm-config.yml
```

启动脚本会设置：

```text
OPENAI_BASE_URL=http://127.0.0.1:4000/v1
OPENAI_API_KEY=sk-deepwiki-local
```

这里的 `OPENAI_API_KEY` 是本地 LiteLLM master key，不是真实 OpenAI Key。

## 火山 Ark Embedding 模型的作用

火山 Ark 默认只用于 embedding，也就是：

- 读取本地仓库后，把代码/文档切成 chunk。
- 给 chunk 生成向量。
- Ask / 检索时用向量找相关代码片段。

它不负责生成最终 Wiki 文本；生成仍走页面 `OpenAI` 下拉模型和 LiteLLM。

当前默认 embedding 模型：

```text
doubao-embedding-vision-251215
```

本机已用 `llmkey-ark` 实测该模型可通过火山 `https://ark.cn-beijing.volces.com/api/coding/v3/embeddings` 返回 2048 维向量。

当前实测情况：

| 模型 | `/api/coding/v3` 结果 |
| --- | --- |
| `doubao-embedding-vision-251215` | 可用，2048 维 |
| `doubao-embedding-vision` | 可用，2048 维 |
| `doubao-embedding-text-240515` | `UnsupportedModel` |
| `doubao-embedding-large-text-250515` | `UnsupportedModel` |

所以当前默认选用实测可用的 `doubao-embedding-vision-251215`。

配置位置：

```text
api/config/embedder.json
```

相关环境变量由启动脚本设置：

```text
DEEPWIKI_EMBEDDER_TYPE=openai
DEEPWIKI_EMBEDDING_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
DEEPWIKI_EMBEDDING_API_KEY=<从 llmkey-ark 读取>
DEEPWIKI_EMBEDDING_MODEL=doubao-embedding-vision-251215
```

## Ollama 模型的作用

Ollama 是可选 embedding 回退方案。只有启动时指定下面参数才会用：

```powershell
.\start-fixed-openai-full.ps1 -EmbeddingProvider ollama
```

Ollama 当前使用：

```text
nomic-embed-text
```

它也只用于 embedding / 检索，不负责 Wiki 文本生成。

如果使用 Ollama，需要提前启动 Ollama 服务：

```text
http://localhost:11434
```

配置位置仍是：

```text
api/config/embedder.json
```

## 一键启动

默认使用火山 Ark embedding：

```powershell
cd D:\src\deepwiki-open
.\start-fixed-openai-full.ps1
```

脚本会自动：

1. 清理 `3000`、`4000`、`8002` 上的旧监听进程。
2. 检查 Ark / CRS 环境变量。
3. 检查火山 Ark embedding 是否可调用。
4. 启动 LiteLLM。
5. 启动 DeepWiki 后端。
6. 启动 Next.js 前端。
7. 验证页面 OpenAI 模型列表包含 `ark-code-latest`、`deepseek-v4-flash-260425`、`crs`。

打开：

```text
http://127.0.0.1:3000
```

如果浏览器无法打开 `localhost`，优先使用 `127.0.0.1`。

## 常用启动参数

指定火山 embedding 模型：

```powershell
.\start-fixed-openai-full.ps1 -EmbeddingModel doubao-embedding-vision-251215
```

指定火山 embedding 地址：

```powershell
.\start-fixed-openai-full.ps1 -EmbeddingBaseUrl https://ark.cn-beijing.volces.com/api/coding/v3
```

切换到 Ollama：

```powershell
.\start-fixed-openai-full.ps1 -EmbeddingProvider ollama
```

不清理旧端口进程：

```powershell
.\start-fixed-openai-full.ps1 -NoKill
```

只启动 LiteLLM + 后端：

```powershell
.\run-fixed-openai.ps1
```

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `start-fixed-openai-full.ps1` | 一键启动前端、后端、LiteLLM，并设置火山/Ollama embedding |
| `run-fixed-openai.ps1` | 启动 LiteLLM + DeepWiki 后端 |
| `litellm-config.yml` | Ark / CRS 固定模型路由 |
| `api/config/generator.json` | 页面 OpenAI provider 的模型列表 |
| `api/config/embedder.json` | 火山 Ark / Ollama embedding 配置 |
| `src/utils/websocketClient.ts` | 前端 WebSocket 后端地址处理 |
| `package.json` | 前端启动命令，当前关闭 Turbopack |

## 快速自检

检查火山 Ark embedding：

```powershell
$key = [Environment]::GetEnvironmentVariable('llmkey-ark','User')
$body = @{ model='doubao-embedding-vision-251215'; input=@('test') } | ConvertTo-Json
Invoke-RestMethod https://ark.cn-beijing.volces.com/api/coding/v3/embeddings `
  -Method Post `
  -Headers @{ Authorization = "Bearer $key" } `
  -ContentType 'application/json' `
  -Body $body
```

检查 LiteLLM：

```powershell
Invoke-WebRequest http://127.0.0.1:4000/health/liveliness
```

检查后端：

```powershell
Invoke-WebRequest http://127.0.0.1:8002/health
```

检查前端：

```powershell
Invoke-WebRequest http://127.0.0.1:3000
```

## 查看仓库处理进度

选择本地目录后，DeepWiki 会先加载目录结构。真正开始生成 Wiki 时，前端会建立 WebSocket，请求后端准备 retriever、切分文件、生成 embedding，然后再生成 Wiki 结构和各页面内容。

如果页面看起来没反应，先运行：

```powershell
.\watch-deepwiki-progress.ps1
```

重点看这些日志：

| 日志 | 含义 |
| --- | --- |
| `GET /local_repo/structure` | 只是读取本地目录结构，还没开始生成 |
| `GET /api/wiki_cache` | 检查是否已有缓存 |
| `Creating new database` | 开始为仓库建立向量库 |
| `Starting split and embedding` | 开始切分文件并调用 embedding |
| `OpenAI-compatible embedding call` | 正在调用火山 Ark embedding |
| `Finished split and embedding` | embedding 完成 |
| `Total transformed documents` | 向量化后的 chunk 数 |
| `Retriever prepared` | 检索器准备完成，后续会进入生成 |

如果只看到 `GET /local_repo/structure`，说明当前只是打开了仓库页面或加载目录，还没有触发生成请求。通常需要确认页面上已经选择 provider/model，并点击或触发生成 Wiki。

如果日志长时间停在 `OpenAI-compatible embedding call`，通常表示火山 embedding 正在处理；大仓库会比较慢。可以通过 `watch-deepwiki-progress.ps1` 查看批次推进。
