param(
  [int]$Port = 5173,
  [int]$BackendPort = 3001
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$BundledNode = 'C:\Users\zba18\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$NodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($NodeCommand) {
  $NodeExe = $NodeCommand.Source
} elseif (Test-Path $BundledNode) {
  $NodeExe = $BundledNode
} else {
  throw 'Node.js was not found. Install Node.js or confirm the Codex bundled Node path exists.'
}

$NpmCli = Join-Path $ProjectRoot '.tools\npm\package\bin\npm-cli.js'

if (-not (Test-Path $NpmCli)) {
  $NpmToolDir = Join-Path $ProjectRoot '.tools\npm'
  New-Item -ItemType Directory -Force -Path $NpmToolDir | Out-Null
  $NpmTarball = Join-Path $NpmToolDir 'npm.tgz'

  if (-not (Test-Path $NpmTarball)) {
    Write-Host 'Downloading local npm CLI...'
    Invoke-WebRequest -Uri 'https://registry.npmjs.org/npm/-/npm-10.9.2.tgz' -OutFile $NpmTarball
  }

  Write-Host 'Extracting local npm CLI...'
  tar -xzf $NpmTarball -C $NpmToolDir
}

$env:PATH = "$(Split-Path $NodeExe);$env:PATH"

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
  Write-Host 'Installing frontend dependencies...'
  & $NodeExe $NpmCli install
}

$BackendRoot = Join-Path $ProjectRoot 'backend'
if (-not (Test-Path (Join-Path $BackendRoot 'node_modules'))) {
  Write-Host 'Installing backend dependencies...'
  Push-Location $BackendRoot
  & $NodeExe $NpmCli install
  Pop-Location
}

$env:PORT = "$BackendPort"
$env:FRONTEND_PORT = "$Port"
$env:CORS_ORIGIN = "http://localhost:$Port"
$env:VITE_API_BASE_URL = "http://localhost:$BackendPort"

Write-Host 'Starting CareBand Agent Demo v0.2...'
Write-Host "Frontend: http://127.0.0.1:$Port/#/institution"
Write-Host "Backend:  http://127.0.0.1:$BackendPort/api/health"
& $NodeExe 'scripts\start-v02.mjs'
