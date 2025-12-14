package com.craftkontrol.ckgenericapp.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferencesManager: PreferencesManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()
    
    init {
        observePreferences()
    }
    
    private fun observePreferences() {
        viewModelScope.launch {
            combine(
                preferencesManager.monitoringEnabled,
                preferencesManager.notificationsEnabled,
                preferencesManager.fullscreenMode,
                preferencesManager.darkMode
            ) { monitoring, notifications, fullscreen, darkMode ->
                SettingsUiState(
                    monitoringEnabled = monitoring,
                    notificationsEnabled = notifications,
                    fullscreenMode = fullscreen,
                    darkMode = darkMode
                )
            }.collect { state ->
                _uiState.value = state
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
}
