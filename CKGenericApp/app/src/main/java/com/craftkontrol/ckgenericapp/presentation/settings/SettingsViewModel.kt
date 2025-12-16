package com.craftkontrol.ckgenericapp.presentation.settings

import android.content.Context
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.presentation.localization.AppLanguage
import com.craftkontrol.ckgenericapp.presentation.localization.LocalizationManager
import com.craftkontrol.ckgenericapp.util.BackupManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferencesManager: PreferencesManager,
    private val localizationManager: LocalizationManager
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
                val latestBackup = backups.firstOrNull()
                
                if (latestBackup == null) {
                    Toast.makeText(
                        context,
                        "No backup files found",
                        Toast.LENGTH_LONG
                    ).show()
                    return@launch
                }
                
                val result = BackupManager.importData(context, latestBackup)
                result.onSuccess {
                    Toast.makeText(
                        context,
                        "✅ Data restored! IMPORTANT: Close the app completely (Recent Apps → Swipe) and reopen it!",
                        Toast.LENGTH_LONG
                    ).show()
                    Timber.i("Data imported successfully from: ${latestBackup.absolutePath}")
                    Timber.w("IMPORTANT: User must RESTART the app for changes to take effect!")
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
