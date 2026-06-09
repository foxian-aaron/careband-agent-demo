param(
  [int]$Port = 5173
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

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
  Write-Host 'Installing demo dependencies...'
  $env:PATH = "$(Split-Path $NodeExe);$env:PATH"
  & $NodeExe $NpmCli install
}

Write-Host 'Starting CareBand Agent Demo...'
Write-Host "Open: http://127.0.0.1:$Port/#/institution"
& $NodeExe 'node_modules\vite\bin\vite.js' --host 127.0.0.1 --port $Port
