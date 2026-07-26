<#
.SYNOPSIS
One-click launcher for DeepWiki frontend, backend, LiteLLM, and local embedding configuration.

.DESCRIPTION
This script starts the complete local stack:
- Frontend: Next.js on port 3000.
- Backend: FastAPI/Uvicorn on port 8002.
- Generation proxy: LiteLLM on port 4000.
- Embedding provider: Volcengine Ark by default, or Ollama when selected.

Generation models shown under the OpenAI provider are routed by LiteLLM:
- ark-code-latest -> Volcengine Ark coding endpoint.
- deepseek-v4-flash-260425 -> Volcengine Ark coding endpoint.
- crs -> CRS OpenAI-compatible endpoint, actual model gpt5.5.

Embedding models are used for repository indexing and retrieval, not for wiki text generation:
- Default Ark embedding model: doubao-embedding-vision-251215.
- Optional Ollama model: nomic-embed-text.

Required environment variables:
- llmkey-ark
- crs_oai_key
#>

param(
    [string]$ArkApiKeyEnv = "llmkey-ark",
    [string]$CrsApiKeyEnv = "crs_oai_key",
    [string]$LiteLlmVenv = (Join-Path $env:LOCALAPPDATA "deepwiki-open\litellm-venv"),
    [int]$LiteLlmPort = 4000,
    [int]$BackendPort = 8002,
    [int]$FrontendPort = 3000,
    [ValidateSet("ark", "ollama")]
    [string]$EmbeddingProvider = "ark",
    [string]$EmbeddingBaseUrl = "https://ark.cn-beijing.volces.com/api/coding/v3",
    [string]$EmbeddingModel = "doubao-embedding-vision-251215",
    [switch]$NoKill
)

$ErrorActionPreference = "Stop"

function Stop-ListenersOnPort {
    param([int]$Port)

    for ($attempt = 0; $attempt -lt 8; $attempt++) {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if (-not $listeners) {
            return
        }

        $processIds = $listeners |
            Select-Object -ExpandProperty OwningProcess |
            Sort-Object -Unique

        foreach ($processId in $processIds) {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping PID $processId on port $Port ($($process.ProcessName)) ..."
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }

        Start-Sleep -Milliseconds 800
    }

    $remaining = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($remaining) {
        $owners = ($remaining | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique) -join ", "
        throw "Port $Port is still occupied by PID(s): $owners"
    }
}

function Wait-HttpOk {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 3 -UseBasicParsing
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    throw "Timed out waiting for $Url"
}

$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) {
    $root = (Get-Location).Path
}

$backendScript = Join-Path $root "run-fixed-openai.ps1"
if (-not (Test-Path -LiteralPath $backendScript)) {
    throw "Backend launcher not found: $backendScript"
}

$logsDir = Join-Path $root "logs"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$backendOutLog = Join-Path $logsDir "fixed-openai-backend.out.log"
$backendErrLog = Join-Path $logsDir "fixed-openai-backend.err.log"
$frontendOutLog = Join-Path $logsDir "frontend.out.log"
$frontendErrLog = Join-Path $logsDir "frontend.err.log"

if (-not $NoKill) {
    Stop-ListenersOnPort -Port $FrontendPort
    Stop-ListenersOnPort -Port $LiteLlmPort
    Stop-ListenersOnPort -Port $BackendPort
}

$backendArgs = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $backendScript,
    "-ArkApiKeyEnv",
    $ArkApiKeyEnv,
    "-CrsApiKeyEnv",
    $CrsApiKeyEnv,
    "-LiteLlmVenv",
    $LiteLlmVenv,
    "-LiteLlmPort",
    $LiteLlmPort,
    "-Port",
    $BackendPort,
    "-EmbeddingProvider",
    $EmbeddingProvider,
    "-EmbeddingBaseUrl",
    $EmbeddingBaseUrl,
    "-EmbeddingModel",
    $EmbeddingModel
)

Write-Host "Starting LiteLLM and DeepWiki backend ..."
$backendProcess = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList $backendArgs `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendOutLog `
    -RedirectStandardError $backendErrLog `
    -PassThru

try {
    Wait-HttpOk -Url "http://127.0.0.1:$LiteLlmPort/health/liveliness" -TimeoutSeconds 90
    Wait-HttpOk -Url "http://127.0.0.1:$BackendPort/health" -TimeoutSeconds 90
} catch {
    Write-Host "Backend stdout log: $backendOutLog"
    Write-Host "Backend stderr log: $backendErrLog"
    throw
}

$backendUrl = "http://localhost:$BackendPort"
$frontendCommand = "set `"SERVER_BASE_URL=$backendUrl`" && set `"NEXT_PUBLIC_SERVER_BASE_URL=$backendUrl`" && npx next dev --port $FrontendPort"

Write-Host "Starting DeepWiki frontend ..."
$frontendProcess = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList @("/c", $frontendCommand) `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendOutLog `
    -RedirectStandardError $frontendErrLog `
    -PassThru

try {
    Wait-HttpOk -Url "http://127.0.0.1:$FrontendPort" -TimeoutSeconds 90
    $modelsConfig = Invoke-RestMethod -Uri "http://127.0.0.1:$FrontendPort/api/models/config" -TimeoutSec 10
    $openaiProvider = $modelsConfig.providers | Where-Object { $_.id -eq "openai" } | Select-Object -First 1
    $openaiModelIds = @($openaiProvider.models | Select-Object -ExpandProperty id)

    foreach ($requiredModel in @("ark-code-latest", "deepseek-v4-flash-260425", "crs")) {
        if ($openaiModelIds -notcontains $requiredModel) {
            throw "Frontend model config is missing $requiredModel. OpenAI models: $($openaiModelIds -join ', ')"
        }
    }
} catch {
    Write-Host "Frontend stdout log: $frontendOutLog"
    Write-Host "Frontend stderr log: $frontendErrLog"
    throw
}

Write-Host ""
Write-Host "DeepWiki is ready."
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Backend:  http://localhost:$BackendPort"
Write-Host "LiteLLM:  http://localhost:$LiteLlmPort"
if ($EmbeddingProvider -eq "ollama") {
    Write-Host "Embedding: Ollama / nomic-embed-text"
} else {
    Write-Host "Embedding: Ark / $EmbeddingModel at $EmbeddingBaseUrl"
}
Write-Host "Backend PID:  $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "Logs:"
Write-Host "  $backendOutLog"
Write-Host "  $backendErrLog"
Write-Host "  $frontendOutLog"
Write-Host "  $frontendErrLog"
