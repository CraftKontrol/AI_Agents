package com.craftkontrol.ckgenericapp.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.presentation.localization.AppLanguage
import com.craftkontrol.ckgenericapp.presentation.localization.LocalizationManager
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
}
