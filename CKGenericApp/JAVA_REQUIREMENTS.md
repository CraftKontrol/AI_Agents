# ⚠️ CKGenericApp - Build Requirements

## 🚨 Current Issue: Java Version Incompatibility

Your system has **Java 8**, but this Android project requires **Java 11 or higher**.

```
Current Java: 1.8.0_441
Required: Java 11+ (JDK 17 recommended)
```

## 📥 Solution: Install JDK 17

### Option 1: Install via Chocolatey (Recommended)

```powershell
# Install JDK 17
choco install microsoft-openjdk17

# Or install Temurin (Eclipse Adoptium)
choco install temurin17
```

### Option 2: Manual Installation

1. Download JDK 17 from: **https://adoptium.net/temurin/releases/**
2. Choose:
   - Version: **17 - LTS**
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK** (.msi installer)

3. Install to: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x\`

4. Set environment variable:
```powershell
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot', 'User')
```

5. Add to PATH:
```powershell
$env:Path += ";C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\bin"
```

6. Restart PowerShell and verify:
```powershell
java -version
# Should show: openjdk version "17.x.x"
```

## 🔄 After Installing JDK 17

### Rebuild the app:

```powershell
cd D:\CraftKontrol\AI_Agents\CKGenericApp

# Clean previous build
.\gradlew.bat clean

# Build debug APK
.\gradlew.bat assembleDebug
```

### Expected output:
```
BUILD SUCCESSFUL in Xs
```

### APK Location:
```
app\build\outputs\apk\debug\app-debug.apk
```

## 🎯 Quick Install & Build Script

Save this as `setup-and-build.ps1`:

```powershell
# CKGenericApp Setup and Build Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CKGenericApp Setup & Build" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Java version
Write-Host "Checking Java version..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-String "version" | ForEach-Object { $_ -replace '.*"([^"]+)".*','$1' }
Write-Host "Current Java: $javaVersion" -ForegroundColor Cyan

if ($javaVersion -match "^1\.8") {
    Write-Host "`n❌ Java 8 detected. Java 11+ required." -ForegroundColor Red
    Write-Host "Install JDK 17 from: https://adoptium.net/" -ForegroundColor Yellow
    Write-Host "Or run: choco install temurin17" -ForegroundColor Cyan
    exit 1
}

# Check Chocolatey
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "`nℹ️  Chocolatey not installed" -ForegroundColor Yellow
    Write-Host "Install from: https://chocolatey.org/install" -ForegroundColor Cyan
}

Write-Host "`n✅ Java version compatible!" -ForegroundColor Green

# Navigate to project
Set-Location "D:\CraftKontrol\AI_Agents\CKGenericApp"

# Build
Write-Host "`nStarting build..." -ForegroundColor Yellow
.\gradlew.bat clean assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nAPK Location:" -ForegroundColor Cyan
    Write-Host "app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Connect Android device via USB" -ForegroundColor White
    Write-Host "2. Enable USB Debugging on device" -ForegroundColor White
    Write-Host "3. Run: adb install app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "Check errors above" -ForegroundColor Yellow
}
```

Run with:
```powershell
.\setup-and-build.ps1
```

## 🏗️ Alternative: Use Android Studio

If you prefer a GUI:

1. **Install Android Studio**: https://developer.android.com/studio
2. **Open project**: `D:\CraftKontrol\AI_Agents\CKGenericApp`
3. Android Studio will:
   - Download required SDK components
   - Use bundled JDK (Java 17)
   - Sync Gradle automatically
4. **Build**: Build menu > Build Bundle(s) / APK(s) > Build APK(s)

Android Studio handles all Java version issues automatically!

## 📝 Project Status

✅ Code complete - All Kotlin files created
✅ Dependencies configured
✅ Manifest with permissions
✅ UI components (Jetpack Compose)
✅ WebView integration
✅ Background services
✅ Room database
✅ Firebase setup (placeholder)
❌ **Build blocked** - Requires Java 11+

## 🔧 Technical Details

### Why Java 11+ is Required:

- **Android Gradle Plugin 8.x** requires Java 11 minimum
- **Kotlin 2.0** works best with Java 11+
- **Modern Android development** requires Java 11+

### Current Configuration:

```kotlin
// build.gradle.kts
compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlinOptions {
    jvmTarget = "17"
}
```

### Dependencies:

- Android Gradle Plugin: 8.1.4
- Kotlin: 1.9.20
- Compose BOM: 2024.01.00
- Hilt: 2.48
- Room: 2.6.1
- Firebase BOM: 32.7.0

## ✅ Checklist

Before building:

- [ ] Java 11+ installed (`java -version`)
- [ ] JAVA_HOME set correctly
- [ ] Android SDK installed (optional, can be downloaded by Gradle)
- [ ] Internet connection (for dependencies)
- [ ] 2GB+ free disk space
- [ ] 30 minutes for first build

## 📞 Need Help?

1. **Java Installation Issues**: https://adoptium.net/installation/
2. **Android Build Issues**: https://developer.android.com/build
3. **Gradle Issues**: https://docs.gradle.org/

## 🎯 Summary

**Problem**: Java 8 installed, project needs Java 11+

**Solution**: Install JDK 17 from https://adoptium.net/

**After Install**: Run `.\gradlew.bat assembleDebug`

**Result**: APK in `app\build\outputs\apk\debug\`

---

© 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals
