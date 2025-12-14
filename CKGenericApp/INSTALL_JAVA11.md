# Java 11+ Installation Required

## Current Status
Your system currently has **Java 8** (1.8.0_471) which is incompatible with Android Gradle Plugin 8.x.

## Quick Fix: Download Java 17 (Recommended)

### Option 1: Eclipse Temurin (Recommended - Free, Open Source)
1. **Download**: https://adoptium.net/temurin/releases/?version=17
2. Select:
   - Version: **17 - LTS**
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK**
   - Click **`.msi` installer**
3. **Install**:
   - Run the downloaded `.msi` file
   - ✅ **IMPORTANT**: Check "Set JAVA_HOME variable" during installation
   - ✅ Check "Add to PATH"
4. **Verify** in PowerShell:
   ```powershell
   java -version
   ```
   Should show: `openjdk version "17.0.x"`

### Option 2: Oracle JDK 17
1. **Download**: https://www.oracle.com/java/technologies/downloads/#java17
2. Select Windows x64 Installer
3. Install and set JAVA_HOME

### Option 3: Microsoft Build of OpenJDK
1. **Download**: https://learn.microsoft.com/en-us/java/openjdk/download
2. Select JDK 17 Windows x64 MSI
3. Install

## After Installation

### Verify Java 17 is Active
```powershell
java -version
```
Should show version 17 or higher, not 1.8.x

### If Java 8 is Still Active
Set JAVA_HOME manually:
```powershell
# Find your Java 17 installation (example path)
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"

# Set for current session
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

# Verify
java -version
```

### Build the APK
```powershell
cd "D:\CraftKontrol\AI_Agents\CKGenericApp"
.\gradlew.bat clean assembleDebug
```

## Alternative: Configure Gradle to Use Specific Java

If you have Java 17 installed but it's not in PATH, edit `gradle.properties`:

```properties
# gradle.properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.x-hotspot
```

Replace path with your actual Java 17 installation path.

---

**Need Help?** Let me know once Java 17 is installed and I'll complete the build!
