param(
  [int]$Port = 5173,
  [int]$BackendPort = 3001
)

$ErrorActionPreference = 'Stop'
$StartScript = Join-Path $PSScriptRoot 'start-demo.ps1'
& $StartScript -Port $Port -BackendPort $BackendPort
