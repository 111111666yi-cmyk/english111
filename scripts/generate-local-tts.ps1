param(
  [string]$VoiceName = "",
  [int]$Rate = 0,
  [string]$OutputDir = "audio-import"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$targetRoot = Join-Path $root $OutputDir

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Slugify {
  param([string]$Value)
  $slug = $Value.ToLowerInvariant()
  $slug = [Regex]::Replace($slug, "[^a-z0-9]+", "-")
  $slug = [Regex]::Replace($slug, "^-+|-+$", "")
  return $slug
}

function New-TtsFile {
  param(
    [System.Speech.Synthesis.SpeechSynthesizer]$Synth,
    [string]$Text,
    [string]$OutputPath
  )

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return
  }

  $Synth.SetOutputToWaveFile($OutputPath)
  $Synth.Speak($Text)
  $Synth.SetOutputToNull()
}

function Read-JsonFile {
  param([string]$RelativePath)
  $absolutePath = Join-Path $root $RelativePath
  $raw = [System.IO.File]::ReadAllText($absolutePath, [System.Text.Encoding]::UTF8)
  $raw = $raw.TrimStart([char]0xFEFF)
  return $raw | ConvertFrom-Json
}

$wordsDir = Join-Path $targetRoot "words"
$sentencesDir = Join-Path $targetRoot "sentences"
$passagesDir = Join-Path $targetRoot "passages"
$expressionsDir = Join-Path $targetRoot "expressions"

Ensure-Directory $targetRoot
Ensure-Directory $wordsDir
Ensure-Directory $sentencesDir
Ensure-Directory $passagesDir
Ensure-Directory $expressionsDir

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $Rate

if (-not [string]::IsNullOrWhiteSpace($VoiceName)) {
  $synth.SelectVoice($VoiceName)
}

$words = Read-JsonFile "src/data/words.json"
$sentences = Read-JsonFile "src/data/sentences.json"
$passages = Read-JsonFile "src/data/passages.json"
$expressions = Read-JsonFile "src/data/expressions.json"

foreach ($word in $words) {
  $fileName = "$(Slugify $word.word).wav"
  $text = if ($word.pronunciationText) { [string]$word.pronunciationText } else { [string]$word.word }
  New-TtsFile -Synth $synth -Text $text -OutputPath (Join-Path $wordsDir $fileName)
}

foreach ($sentence in $sentences) {
  New-TtsFile -Synth $synth -Text ([string]$sentence.sentenceEn) -OutputPath (Join-Path $sentencesDir "$($sentence.id).wav")

  if ($sentence.keywords) {
    foreach ($keyword in $sentence.keywords) {
      $keywordPath = Join-Path $sentencesDir "$($sentence.id)--keyword--$(Slugify ([string]$keyword)).wav"
      New-TtsFile -Synth $synth -Text ([string]$keyword) -OutputPath $keywordPath
    }
  }
}

foreach ($passage in $passages) {
  $joinedPassage = ($passage.contentEn -join " ")
  New-TtsFile -Synth $synth -Text $joinedPassage -OutputPath (Join-Path $passagesDir "$($passage.id).wav")

  if ($passage.contentEn) {
    for ($index = 0; $index -lt $passage.contentEn.Count; $index++) {
      $paragraphPath = Join-Path $passagesDir "$($passage.id)-p$($index + 1).wav"
      New-TtsFile -Synth $synth -Text ([string]$passage.contentEn[$index]) -OutputPath $paragraphPath
    }
  }
}

foreach ($expression in $expressions) {
  New-TtsFile -Synth $synth -Text ([string]$expression.basic) -OutputPath (Join-Path $expressionsDir "$($expression.id)-basic.wav")
  New-TtsFile -Synth $synth -Text ([string]$expression.advanced) -OutputPath (Join-Path $expressionsDir "$($expression.id)-advanced.wav")
}

$synth.Dispose()

Write-Host "Local TTS generation complete."
Write-Host "Output directory: $targetRoot"
