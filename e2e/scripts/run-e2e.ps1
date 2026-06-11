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

function Import-DotEnv {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    return
  }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()

    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf("=")

    if ($separatorIndex -le 0) {
      continue
    }

    $key = $trimmed.Substring(0, $separatorIndex).Trim()
    $value = $trimmed.Substring($separatorIndex + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key, "Process"))) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

function Get-EnvValue {
  param(
    [string]$Name,
    [string]$Fallback = ""
  )

  $value = [Environment]::GetEnvironmentVariable($Name, "Process")

  if (![string]::IsNullOrWhiteSpace($value)) {
    return $value
  }

  if (![string]::IsNullOrWhiteSpace($Fallback)) {
    return $Fallback
  }

  throw "$Name must be set in the environment or .env"
}

function Get-RequiredPath {
  param(
    [string]$Name,
    [string]$Path
  )

  if (!(Test-Path $Path)) {
    throw "$Name was not found at $Path. Run yarn install from the repository root."
  }

  return (Resolve-Path $Path).Path
}

Import-DotEnv -Path (Join-Path $e2eRoot ".env")

function Test-Url {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    $response = $_.Exception.Response

    if ($null -ne $response -and $null -ne $response.StatusCode) {
      $statusCode = [int]$response.StatusCode
      return $statusCode -ge 200 -and $statusCode -lt 500
    }

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

function Invoke-E2ESetupCommand {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string[]]$Arguments
  )

  Write-Host $Name
  $node = (Get-Command node).Source

  Push-Location $WorkingDirectory
  try {
    & $node @Arguments

    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

$startedProcesses = @()

try {
  $tsxCli = Get-RequiredPath `
    -Name "tsx CLI" `
    -Path (Join-Path $repoRoot "node_modules\tsx\dist\cli.mjs")
  $viteCli = Get-RequiredPath `
    -Name "Vite CLI" `
    -Path (Join-Path $repoRoot "node_modules\vite\bin\vite.js")

  $env:DATABASE_URL = Get-EnvValue -Name "DATABASE_URL"

  Invoke-E2ESetupCommand `
    -Name "Applying database migrations..." `
    -WorkingDirectory (Join-Path $repoRoot "http-server") `
    -Arguments @($tsxCli, "src/db/migrate.ts")
  Invoke-E2ESetupCommand `
    -Name "Applying database seed..." `
    -WorkingDirectory (Join-Path $repoRoot "http-server") `
    -Arguments @($tsxCli, "src/db/seed.ts")

  $apiBaseUrl = Get-EnvValue -Name "API_BASE_URL"
  $env:PORT = Get-EnvValue -Name "API_PORT"
  $env:API_CLIENT_BASE_URL = $apiBaseUrl
  $api = Start-E2EServer `
    -Name "api" `
    -WorkingDirectory (Join-Path $repoRoot "http-server") `
    -Arguments @($tsxCli, "src/main.ts") `
    -ReadyUrl "$apiBaseUrl/health-check"

  if ($null -ne $api) {
    $startedProcesses += $api
  }

  $env:VITE_API_BASE_URL = $apiBaseUrl
  $adminBaseUrl = Get-EnvValue -Name "ADMIN_BASE_URL"
  $adminHost = Get-EnvValue -Name "ADMIN_HOST"
  $adminPort = Get-EnvValue -Name "ADMIN_PORT"
  $admin = Start-E2EServer `
    -Name "admin-web-app" `
    -WorkingDirectory (Join-Path $repoRoot "admin-web-app") `
    -Arguments @($viteCli, "--host", $adminHost, "--port", $adminPort, "--strictPort") `
    -ReadyUrl $adminBaseUrl

  if ($null -ne $admin) {
    $startedProcesses += $admin
  }

  $userBaseUrl = Get-EnvValue -Name "USER_BASE_URL"
  $userHost = Get-EnvValue -Name "USER_HOST"
  $userPort = Get-EnvValue -Name "USER_PORT"
  $user = Start-E2EServer `
    -Name "user-portal-webapp" `
    -WorkingDirectory (Join-Path $repoRoot "user-portal-webapp") `
    -Arguments @($viteCli, "--host", $userHost, "--port", $userPort, "--strictPort") `
    -ReadyUrl $userBaseUrl

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
