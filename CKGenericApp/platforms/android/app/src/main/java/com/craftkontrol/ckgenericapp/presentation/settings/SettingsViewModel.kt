package com.craftkontrol.ckgenericapp.presentation.settings

import android.content.Context
import android.webkit.CookieManager
import android.webkit.WebStorage
import android.webkit.WebView
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.craftkontrol.ckgenericapp.R
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.presentation.localization.AppLanguage
import com.craftkontrol.ckgenericapp.presentation.localization.LocalizationManager
import com.craftkontrol.ckgenericapp.util.BackupManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferencesManager: PreferencesManager,
    private val localizationManager: LocalizationManager,
    private val apiKeysPreferences: com.craftkontrol.ckgenericapp.data.local.preferences.ApiKeysPreferences
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()
    
    init {
        observePreferences()
    }
    
    private fun observePreferences() {
        viewModelScope.launch {
            try {
                combine(
                    preferencesManager.monitoringEnabled,
                    preferencesManager.notificationsEnabled,
                    preferencesManager.fullscreenMode,
                    preferencesManager.darkMode,
                    localizationManager.getCurrentLanguageFlow()
                ) { monitoring, notifications, fullscreen, darkMode, language ->
                    SettingsUiState(
                        monitoringEnabled = monitoring,
                        notificationsEnabled = notifications,
                        fullscreenMode = fullscreen,
                        darkMode = darkMode,
                        currentLanguage = language,
                        availableLanguages = localizationManager.getAvailableLanguages()
                    )
                }.collect { state ->
                    _uiState.value = state
                }
            } catch (e: Exception) {
                _uiState.value = SettingsUiState()
                Timber.e(e, "Error observing preferences")
            }
        }
    }
    
    fun setMonitoringEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setMonitoringEnabled(enabled)
        }
    }
    
    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setNotificationsEnabled(enabled)
        }
    }
    
    fun setFullscreenMode(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setFullscreenMode(enabled)
        }
    }
    
    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setDarkMode(enabled)
        }
    }
    
    fun setLanguage(context: android.content.Context, language: AppLanguage) {
        Timber.d("SettingsViewModel.setLanguage called: ${language.code}")
        viewModelScope.launch {
            try {
                // Apply locale directly with activity context
                com.craftkontrol.ckgenericapp.presentation.localization.LocaleHelper.setAppLocale(context, language)
                // Save preference
                preferencesManager.setCurrentLanguage(language.code)
                Timber.d("Language change completed successfully")
            } catch (e: Exception) {
                Timber.e(e, "Error changing language")
            }
        }
    }
    
    /**
     * Clear all WebView cache, cookies, and storage
     */
    fun clearCache(context: Context) {
        viewModelScope.launch {
            try {
                Timber.d("Clearing WebView cache...")
                
                // Clear WebView cache
                WebView(context).apply {
                    clearCache(true)
                    clearHistory()
                    clearFormData()
                }
                
                // Clear cookies
                CookieManager.getInstance().apply {
                    removeAllCookies(null)
                    flush()
                }
                
                // Clear WebStorage (localStorage, sessionStorage, IndexedDB)
                WebStorage.getInstance().deleteAllData()
                
                Timber.d("WebView cache cleared successfully")
                Toast.makeText(
                    context,
                    context.getString(R.string.cache_cleared),
                    Toast.LENGTH_SHORT
                ).show()
            } catch (e: Exception) {
                Timber.e(e, "Error clearing cache")
                Toast.makeText(
                    context,
                    context.getString(R.string.cache_clear_failed),
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
    
    /**
     * Export all app data to external storage
     */
    fun exportData(context: Context) {
        viewModelScope.launch {
            try {
                // Check storage permission first
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                    if (!android.os.Environment.isExternalStorageManager()) {
                        Toast.makeText(
                            context,
                            "Storage permission required. Please enable in Settings → Permissions → Files and media → Allow management of all files",
                            Toast.LENGTH_LONG
                        ).show()
                        Timber.w("Export failed: MANAGE_EXTERNAL_STORAGE permission not granted")
                        return@launch
                    }
                }
                
                Timber.d("⏳ Preparing export: ensuring all data is written to disk...")
                Toast.makeText(context, "Preparing export... (3 seconds)", Toast.LENGTH_SHORT).show()
                
                // Force BOTH DataStores to flush ALL current values
                // This triggers DataStore to write everything to disk
                
                // 1. Flush settings DataStore
                preferencesManager.setMonitoringEnabled(_uiState.value.monitoringEnabled)
                preferencesManager.setNotificationsEnabled(_uiState.value.notificationsEnabled)
                preferencesManager.setFullscreenMode(_uiState.value.fullscreenMode)
                preferencesManager.setDarkMode(_uiState.value.darkMode)
                
                // Current language must be set to force language preference to disk
                val currentLang = _uiState.value.currentLanguage
                if (currentLang.code.isNotEmpty()) {
                    preferencesManager.setCurrentLanguage(currentLang.code)
                }
                
                Timber.d("🔄 Flushed settings DataStore: monitoring=${_uiState.value.monitoringEnabled}, lang=${currentLang.code}")
                
                // Wait for settings to be written
                kotlinx.coroutines.delay(500)
                
                // 2. Flush API keys DataStore by reading and re-saving all keys
                val currentApiKeys = apiKeysPreferences.getAllApiKeys().first()
                Timber.d("🔄 Found ${currentApiKeys.size} API keys to flush")
                currentApiKeys.forEach { (keyName, keyValue) ->
                    apiKeysPreferences.saveApiKey(keyName, keyValue)
                    Timber.d("  ✓ Flushed API key: $keyName")
                }
                
                Timber.d("✓ All API keys DataStore flushed")
                
                // Longer delay to absolutely ensure file system sync completes
                kotlinx.coroutines.delay(3000)
                
                Timber.d("✓ Data flushed, starting export...")
                
                val result = BackupManager.exportData(context)
                result.onSuccess { backupFile ->
                    Toast.makeText(
                        context,
                        "Data exported to: ${backupFile.name}",
                        Toast.LENGTH_LONG
                    ).show()
                    Timber.i("Data exported successfully: ${backupFile.absolutePath}")
                }
                result.onFailure { exception ->
                    Toast.makeText(
                        context,
                        "Export failed: ${exception.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    Timber.e(exception, "Export failed")
                }
            } catch (e: Exception) {
                Toast.makeText(
                    context,
                    "Export error: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
                Timber.e(e, "Export error")
            }
        }
    }
    
    /**
     * Import app data from latest backup
     */
    fun importData(context: Context) {
        viewModelScope.launch {
            try {
                // Check storage permission first
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                    if (!android.os.Environment.isExternalStorageManager()) {
                        Toast.makeText(
                            context,
                            "Storage permission required. Please enable in Settings → Permissions → Files and media → Allow management of all files",
                            Toast.LENGTH_LONG
                        ).show()
                        Timber.w("Import failed: MANAGE_EXTERNAL_STORAGE permission not granted")
                        return@launch
                    }
                }
                
                Timber.d("Looking for backup files...")
                val backups = BackupManager.listBackups(context)
                Timber.d("Found ${backups.size} backup file(s)")
                
                // Log all backup files with their timestamps
                backups.forEachIndexed { index, file ->
                    val date = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
                        .format(java.util.Date(file.lastModified()))
                    Timber.d("  [$index] ${file.name} - Modified: $date")
                }
                
                val latestBackup = backups.firstOrNull()
                
                if (latestBackup == null) {
                    Toast.makeText(
                        context,
                        "No backup files found",
                        Toast.LENGTH_LONG
                    ).show()
                    return@launch
                }
                
                Timber.i("📦 Importing from: ${latestBackup.name}")
                
                val result = BackupManager.importData(context, latestBackup)
                result.onSuccess {
                    Timber.i("✓ Data imported successfully from: ${latestBackup.name}")
                    Timber.w("🔄 App will restart in 2 seconds to apply changes...")
                    
                    Toast.makeText(
                        context,
                        "✅ Data restored from ${latestBackup.name}! Restarting...",
                        Toast.LENGTH_LONG
                    ).show()
                    
                    // Delay then restart the app
                    viewModelScope.launch {
                        kotlinx.coroutines.delay(2000)
                        
                        // Kill the app process to force complete restart
                        // This ensures DataStore loads the restored files from disk
                        android.os.Process.killProcess(android.os.Process.myPid())
                    }
                }
                result.onFailure { exception ->
                    Toast.makeText(
                        context,
                        "Import failed: ${exception.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    Timber.e(exception, "Import failed")
                }
            } catch (e: Exception) {
                Toast.makeText(
                    context,
                    "Import error: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
                Timber.e(e, "Import error")
            }
        }
    }
}
