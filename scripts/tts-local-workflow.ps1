param(
  [string]$VoiceName = "",
  [int]$Rate = 0,
  [string]$OutputDir = "audio-import"
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

& (Join-Path $PSScriptRoot "generate-local-tts.ps1") -VoiceName $VoiceName -Rate $Rate -OutputDir $OutputDir

Push-Location $root
try {
  npm run sync:audio -- --source-dir $OutputDir
} finally {
  Pop-Location
}
