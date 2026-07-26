<#
.SYNOPSIS
Starts LiteLLM and the DeepWiki backend with fixed OpenAI-compatible generation routes.

.DESCRIPTION
Generation still uses DeepWiki's OpenAI provider path. OPENAI_BASE_URL is pointed at
the local LiteLLM proxy, which routes model names to Ark or CRS.

Embedding is independent from generation:
- Default: Volcengine Ark Coding Plan OpenAI-compatible /v1/embeddings.
- Optional: Ollama nomic-embed-text.

Required environment variables:
- llmkey-ark: Ark coding endpoint key.
- crs_oai_key: CRS OpenAI-compatible endpoint key.

Default Ark embedding model:
- doubao-embedding-vision-251215

This script does not write API keys to disk.
#>

param(
    [string]$ArkApiKeyEnv = "llmkey-ark",
    [string]$CrsApiKeyEnv = "crs_oai_key",
    [string]$LiteLlmVenv = (Join-Path $env:LOCALAPPDATA "deepwiki-open\litellm-venv"),
    [int]$LiteLlmPort = 4000,
    [int]$Port = 8002,
    [ValidateSet("ark", "ollama")]
    [string]$EmbeddingProvider = "ark",
    [string]$EmbeddingBaseUrl = "https://ark.cn-beijing.volces.com/api/coding/v3",
    [string]$EmbeddingModel = "doubao-embedding-vision-251215"
)

$ErrorActionPreference = "Stop"

$arkApiKey = [Environment]::GetEnvironmentVariable($ArkApiKeyEnv, "Process")
if ([string]::IsNullOrWhiteSpace($arkApiKey)) {
    $arkApiKey = [Environment]::GetEnvironmentVariable($ArkApiKeyEnv, "User")
}
if ([string]::IsNullOrWhiteSpace($arkApiKey)) {
    $arkApiKey = [Environment]::GetEnvironmentVariable($ArkApiKeyEnv, "Machine")
}

$crsApiKey = [Environment]::GetEnvironmentVariable($CrsApiKeyEnv, "Process")
if ([string]::IsNullOrWhiteSpace($crsApiKey)) {
    $crsApiKey = [Environment]::GetEnvironmentVariable($CrsApiKeyEnv, "User")
}
if ([string]::IsNullOrWhiteSpace($crsApiKey)) {
    $crsApiKey = [Environment]::GetEnvironmentVariable($CrsApiKeyEnv, "Machine")
}

if ([string]::IsNullOrWhiteSpace($arkApiKey)) {
    throw "Environment variable '$ArkApiKeyEnv' is not set."
}
if ([string]::IsNullOrWhiteSpace($crsApiKey)) {
    throw "Environment variable '$CrsApiKeyEnv' is not set."
}

if ($EmbeddingProvider -eq "ollama") {
    try {
        Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 | Out-Null
    } catch {
        throw "Ollama is not available at http://localhost:11434. Start Ollama before DeepWiki, or use -EmbeddingProvider ark."
    }
} else {
    $embeddingTestBody = @{
        model = $EmbeddingModel
        input = @("DeepWiki embedding connectivity test")
    } | ConvertTo-Json -Depth 5
    try {
        Invoke-RestMethod `
            -Uri "$EmbeddingBaseUrl/embeddings" `
            -Method Post `
            -Headers @{ Authorization = "Bearer $arkApiKey" } `
            -ContentType "application/json" `
            -Body $embeddingTestBody `
            -TimeoutSec 30 | Out-Null
    } catch {
        throw "Ark embedding endpoint is not ready at $EmbeddingBaseUrl with model '$EmbeddingModel'. Check '$ArkApiKeyEnv' permissions and model availability. Detail: $($_.Exception.Message)"
    }
}

$env:LITELLM_ARK_API_KEY = $arkApiKey
$env:LITELLM_CRS_API_KEY = $crsApiKey
$env:LITELLM_MASTER_KEY = "sk-deepwiki-local"
$env:OPENAI_API_KEY = $env:LITELLM_MASTER_KEY
$env:OPENAI_BASE_URL = "http://127.0.0.1:$LiteLlmPort/v1"
if ($EmbeddingProvider -eq "ollama") {
    $env:DEEPWIKI_EMBEDDER_TYPE = "ollama"
} else {
    $env:DEEPWIKI_EMBEDDER_TYPE = "openai"
    $env:DEEPWIKI_EMBEDDING_BASE_URL = $EmbeddingBaseUrl
    $env:DEEPWIKI_EMBEDDING_API_KEY = $arkApiKey
    $env:DEEPWIKI_EMBEDDING_MODEL = $EmbeddingModel
}
$env:NODE_ENV = "production"
$env:PORT = $Port

$liteLlmExecutable = Join-Path $LiteLlmVenv "Scripts\litellm.exe"
if (-not (Test-Path -LiteralPath $liteLlmExecutable)) {
    Write-Host "Creating isolated LiteLLM Proxy environment at $LiteLlmVenv ..."
    python -m venv $LiteLlmVenv
    $liteLlmPython = Join-Path $LiteLlmVenv "Scripts\python.exe"
    & $liteLlmPython -m pip install "litellm[proxy]==1.83.10"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install the isolated LiteLLM Proxy environment."
    }
}

$liteLlmConfig = Join-Path $PSScriptRoot "litellm-config.yml"
$liteLlmJob = Start-Job -ScriptBlock {
    param($Executable, $ConfigPath, $ProxyPort)
    & $Executable --config $ConfigPath --port $ProxyPort
} -ArgumentList $liteLlmExecutable, $liteLlmConfig, $LiteLlmPort

try {
    $deadline = (Get-Date).AddSeconds(60)
    do {
        try {
            Invoke-RestMethod -Uri "http://127.0.0.1:$LiteLlmPort/health/liveliness" -TimeoutSec 2 | Out-Null
            break
        } catch {
            if ($liteLlmJob.State -in @("Failed", "Completed", "Stopped")) {
                Receive-Job -Job $liteLlmJob
                throw "LiteLLM stopped before becoming ready."
            }
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)

    if ((Get-Date) -ge $deadline) {
        throw "LiteLLM did not become ready on port $LiteLlmPort."
    }

    Write-Host "Model route: ark-code-latest -> https://ark.cn-beijing.volces.com/api/coding/v3"
    Write-Host "Model route: deepseek-v4-flash-260425 -> https://ark.cn-beijing.volces.com/api/coding/v3"
    Write-Host "Model route: crs -> http://47.101.159.7:39187/v1 (gpt5.5)"
    if ($EmbeddingProvider -eq "ollama") {
        Write-Host "Embedding: Ollama -> nomic-embed-text"
    } else {
        Write-Host "Embedding: Ark -> $EmbeddingBaseUrl ($EmbeddingModel)"
    }
    Write-Host "LiteLLM URL: http://localhost:$LiteLlmPort"
    Write-Host "Backend URL: http://localhost:$Port"
    Write-Host "API keys remain in process memory only."

    poetry -P api run python -m api.main
} finally {
    Stop-Job -Job $liteLlmJob -ErrorAction SilentlyContinue
    Remove-Job -Job $liteLlmJob -Force -ErrorAction SilentlyContinue
}
