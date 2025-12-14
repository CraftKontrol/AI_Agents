# CKGenericApp Build Instructions

## Prerequisites

You need to have **Java JDK 17+** installed to build this Android app.

### Check if Java is installed:

```powershell
java -version
```

### If Java is not installed:

**Option 1: Install via Chocolatey (Recommended for Windows)**
```powershell
choco install openjdk17
```

**Option 2: Manual Installation**
1. Download JDK 17+ from: https://adoptium.net/
2. Install and add to PATH
3. Set JAVA_HOME environment variable

## Building the App

### Using Android Studio (Recommended):

1. Open Android Studio
2. Open the project: `d:\CraftKontrol\AI_Agents\CKGenericApp`
3. Wait for Gradle sync to complete
4. Build > Build Bundle(s) / APK(s) > Build APK(s)

### Using Command Line:

```powershell
cd d:\CraftKontrol\AI_Agents\CKGenericApp

# Build debug APK
.\gradlew.bat assembleDebug

# Build release APK
.\gradlew.bat assembleRelease

# Clean and rebuild
.\gradlew.bat clean assembleDebug

# Install on connected device
.\gradlew.bat installDebug
```

### Output Location:

- **Debug APK**: `app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `app\build\outputs\apk\release\app-release.apk`

## Firebase Setup (Required for Push Notifications)

1. Go to https://console.firebase.google.com/
2. Create a new project or select existing
3. Add Android app with package: `com.craftkontrol.ckgenericapp`
4. Download `google-services.json`
5. Place it in: `d:\CraftKontrol\AI_Agents\CKGenericApp\app\google-services.json`

## First Build Steps

1. **Download Gradle wrapper JAR** (first time only):
   
   The Gradle wrapper will automatically download required files on first run.

2. **Sync dependencies**:
   ```powershell
   .\gradlew.bat --refresh-dependencies
   ```

3. **Build the project**:
   ```powershell
   .\gradlew.bat assembleDebug
   ```

## Troubleshooting

### Error: "JAVA_HOME is not set"

Set the JAVA_HOME environment variable:
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
```

### Error: "SDK location not found"

Create `local.properties` file with:
```
sdk.dir=C:\\Users\\YourUser\\AppData\\Local\\Android\\Sdk
```

### Error: "google-services.json not found"

Either:
1. Add the Firebase configuration file, or
2. Temporarily comment out the Firebase plugin in `app\build.gradle.kts`:
   ```kotlin
   // id("com.google.gms.google-services")
   ```

### Gradle Download Issues

If Gradle wrapper download fails, manually download from:
https://services.gradle.org/distributions/gradle-8.2-bin.zip

Extract to: `C:\Users\YourUser\.gradle\wrapper\dists\`

## Quick Build Script

Save this as `build.ps1` in the project root:

```powershell
# CKGenericApp Build Script
Write-Host "Building CKGenericApp..." -ForegroundColor Green

# Check Java
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Java is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

# Check gradle wrapper
if (-not (Test-Path ".\gradlew.bat")) {
    Write-Host "ERROR: Gradle wrapper not found!" -ForegroundColor Red
    exit 1
}

# Build
Write-Host "Starting build..." -ForegroundColor Cyan
.\gradlew.bat clean assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful!" -ForegroundColor Green
    Write-Host "APK location: app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
} else {
    Write-Host "`nBuild failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
```

Then run:
```powershell
.\build.ps1
```

## Next Steps After Building

1. **Install on device**:
   ```powershell
   adb install app\build\outputs\apk\debug\app-debug.apk
   ```

2. **View logs**:
   ```powershell
   adb logcat | Select-String "CKGenericApp"
   ```

3. **Test the app** on your Android device

For more information, see [README.md](README.md)
