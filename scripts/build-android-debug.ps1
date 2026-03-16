$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } elseif ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$localJdk = Join-Path $projectRoot ".tools\jdk-21.0.10+7"
$fallbackJbr = "C:\Program Files\JetBrains\PyCharm 2024.1.7\jbr"
$javaHome = if ($env:JAVA_HOME) {
  $env:JAVA_HOME
} elseif (Test-Path $localJdk) {
  $localJdk
} else {
  $fallbackJbr
}
$gradleWrapper = Join-Path $projectRoot "android\gradlew.bat"

if (-not (Test-Path $sdkRoot)) {
  throw "Android SDK not found. Expected at: $sdkRoot"
}

if (-not (Test-Path $javaHome)) {
  throw "JAVA_HOME not found. Expected at: $javaHome"
}

if (-not (Test-Path (Join-Path $javaHome "bin\jlink.exe"))) {
  throw "JAVA_HOME is incomplete. Missing jlink.exe at: $(Join-Path $javaHome 'bin\jlink.exe')"
}

if (-not (Test-Path $gradleWrapper)) {
  throw "Android project is missing. Run 'npm run android:add' first."
}

$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$sdkRoot\platform-tools;$env:Path"

Push-Location $projectRoot
try {
  $outDir = Join-Path $projectRoot "out"
  if (Test-Path $outDir) {
    cmd /c "rmdir /s /q `"$outDir`"" | Out-Null
    Start-Sleep -Milliseconds 300
    if (Test-Path $outDir) {
      Remove-Item -LiteralPath $outDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $outDir) {
      throw "Failed to clean output directory: $outDir"
    }
  }

  npm run build:content
  npm run build
  npx cap sync android

  Push-Location (Join-Path $projectRoot "android")
  try {
    & .\gradlew.bat assembleDebug
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}
