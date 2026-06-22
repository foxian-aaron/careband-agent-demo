param(
  [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'
$StartScript = Join-Path $PSScriptRoot 'start-demo.ps1'
& $StartScript -Port $Port
