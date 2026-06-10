param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PlaywrightArgs
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$e2eRoot = Resolve-Path (Join-Path $scriptRoot "..")
$repoRoot = Resolve-Path (Join-Path $e2eRoot "..")
$logRoot = Join-Path $repoRoot ".tmp\e2e"

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

$env:TEMP = Join-Path $repoRoot ".tmp"
$env:TMP = Join-Path $repoRoot ".tmp"

function Test-Url {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Wait-Url {
  param(
    [string]$Name,
    [string]$Url
  )

  $deadline = (Get-Date).AddSeconds(60)

  while ((Get-Date) -lt $deadline) {
    if (Test-Url -Url $Url) {
      return
    }

    Start-Sleep -Milliseconds 500
  }

  throw "$Name did not become ready at $Url"
}

function Start-E2EServer {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string[]]$Arguments,
    [string]$ReadyUrl
  )

  if (Test-Url -Url $ReadyUrl) {
    Write-Host "$Name already running at $ReadyUrl"
    return $null
  }

  $node = (Get-Command node).Source
  $stdout = Join-Path $logRoot "$Name.out.log"
  $stderr = Join-Path $logRoot "$Name.err.log"

  Write-Host "Starting $Name..."
  $process = Start-Process `
    -FilePath $node `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden `
    -PassThru

  Wait-Url -Name $Name -Url $ReadyUrl
  return $process
}

$startedProcesses = @()

try {
  $apiBaseUrl = "http://127.0.0.1:3020"
  $env:PORT = "3020"
  $env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/erp"
  $api = Start-E2EServer `
    -Name "api" `
    -WorkingDirectory (Join-Path $repoRoot "http-server") `
    -Arguments @("node_modules/tsx/dist/cli.mjs", "src/main.ts") `
    -ReadyUrl "$apiBaseUrl/health-check"

  if ($null -ne $api) {
    $startedProcesses += $api
  }

  $env:VITE_API_BASE_URL = $apiBaseUrl
  $admin = Start-E2EServer `
    -Name "admin-web-app" `
    -WorkingDirectory (Join-Path $repoRoot "admin-web-app") `
    -Arguments @("node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5180", "--strictPort") `
    -ReadyUrl "http://127.0.0.1:5180"

  if ($null -ne $admin) {
    $startedProcesses += $admin
  }

  $user = Start-E2EServer `
    -Name "user-portal-webapp" `
    -WorkingDirectory (Join-Path $repoRoot "user-portal-webapp") `
    -Arguments @("node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5181", "--strictPort") `
    -ReadyUrl "http://127.0.0.1:5181"

  if ($null -ne $user) {
    $startedProcesses += $user
  }

  $playwright = Join-Path $e2eRoot "node_modules\.bin\playwright.cmd"
  & $playwright test @PlaywrightArgs
  exit $LASTEXITCODE
} finally {
  foreach ($process in $startedProcesses) {
    if ($null -ne $process -and !$process.HasExited) {
      Stop-Process -Id $process.Id -Force
    }
  }
}
