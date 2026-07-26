param(
    [string]$LogsDir = (Join-Path $PSScriptRoot "logs"),
    [int]$Tail = 120
)

$ErrorActionPreference = "Stop"

$backendOutLog = Join-Path $LogsDir "fixed-openai-backend.out.log"
$backendErrLog = Join-Path $LogsDir "fixed-openai-backend.err.log"
$frontendOutLog = Join-Path $LogsDir "frontend.out.log"

Write-Host "DeepWiki progress watcher"
Write-Host "Logs: $LogsDir"
Write-Host ""

Write-Host "Recent frontend activity:"
if (Test-Path -LiteralPath $frontendOutLog) {
    Get-Content -LiteralPath $frontendOutLog -Tail $Tail |
        Select-String -Pattern "GET /local|GET /api/wiki_cache|Compiled|Error|WebSocket|wiki" |
        ForEach-Object { $_.Line }
} else {
    Write-Host "  Missing $frontendOutLog"
}

Write-Host ""
Write-Host "Recent backend HTTP activity:"
if (Test-Path -LiteralPath $backendOutLog) {
    Get-Content -LiteralPath $backendOutLog -Tail $Tail |
        Select-String -Pattern "local_repo/structure|wiki_cache|models/config|health|WebSocket|POST|GET|Error" |
        ForEach-Object { $_.Line }
} else {
    Write-Host "  Missing $backendOutLog"
}

Write-Host ""
Write-Host "Recent backend processing activity:"
if (Test-Path -LiteralPath $backendErrLog) {
    Select-String -Path $backendErrLog -Pattern "Preparing repo|Repo paths|Loading existing database|Creating new database|Starting split and embedding|OpenAI-compatible embedding call|Finished split and embedding|Total documents|Total transformed documents|Retriever prepared|Error|Traceback|Exception" |
        Select-Object -Last $Tail |
        ForEach-Object { $_.Line }
} else {
    Write-Host "  Missing $backendErrLog"
}

Write-Host ""
Write-Host "Tip: run this command again after a few seconds to see whether counts or new log lines changed."
