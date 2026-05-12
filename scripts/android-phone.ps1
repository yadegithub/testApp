$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$deviceId = if ($env:ANDROID_DEVICE_ID) { $env:ANDROID_DEVICE_ID } else { "1868ff967d78" }
$packageId = "io.ionic.starter"
$defaultAdb = "C:\Users\Antar\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$adb = if ($env:ANDROID_HOME) {
    Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
} else {
    $defaultAdb
}
$apk = Join-Path $repoRoot "android\app\build\outputs\apk\debug\app-debug.apk"

function Invoke-Checked {
    param(
        [scriptblock]$Command,
        [string]$Name
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

Push-Location $repoRoot
try {
    Invoke-Checked { npm run build } "npm run build"
    Invoke-Checked { npx cap sync android } "npx cap sync android"

    Push-Location "android"
    try {
        Invoke-Checked { .\gradlew.bat assembleDebug } "Gradle assembleDebug"
    } finally {
        Pop-Location
    }

    Write-Host "Removing any existing $packageId install from $deviceId..."
    & $adb -s $deviceId uninstall $packageId
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Normal uninstall did not remove $packageId; trying user-level uninstall..."
        & $adb -s $deviceId shell pm uninstall --user 0 $packageId
        if ($LASTEXITCODE -ne 0) {
            Write-Host "No removable existing install found; continuing."
        }
    }

    Write-Host "Device storage before install:"
    & $adb -s $deviceId shell df -h /data

    Invoke-Checked { & $adb -s $deviceId install -r -d $apk } "adb install"
    Invoke-Checked { & $adb -s $deviceId shell monkey -p $packageId -c android.intent.category.LAUNCHER 1 } "adb launch"
} finally {
    Pop-Location
}
