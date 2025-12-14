package com.craftkontrol.ckgenericapp.presentation.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.domain.repository.WebAppRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val webAppRepository: WebAppRepository,
    private val preferencesManager: PreferencesManager,
    private val apiKeysPreferences: com.craftkontrol.ckgenericapp.data.local.preferences.ApiKeysPreferences
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    init {
        initializeApp()
        observeData()
    }
    
    private fun initializeApp() {
        viewModelScope.launch {
            try {
                // Initialize default apps if needed
                webAppRepository.initializeDefaultApps()
            } catch (e: Exception) {
                Timber.e(e, "Error initializing apps")
                _uiState.update { it.copy(error = "Failed to initialize apps") }
            }
        }
    }
    
    private fun observeData() {
        viewModelScope.launch {
            combine(
                webAppRepository.getAllEnabledApps(),
                preferencesManager.currentAppId,
                preferencesManager.menuCollapsed
            ) { apps, currentAppId, menuCollapsed ->
                Triple(apps, currentAppId, menuCollapsed)
            }.collect { (apps, currentAppId, menuCollapsed) ->
                val currentApp = if (currentAppId != null) {
                    apps.find { it.id == currentAppId }
                } else {
                    apps.firstOrNull()
                }
                
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        apps = apps,
                        currentApp = currentApp,
                        isMenuCollapsed = menuCollapsed
                    )
                }
                
                // Set current app if not set
                if (currentAppId == null && currentApp != null) {
                    setCurrentApp(currentApp)
                }
            }
        }
    }
    
    fun setCurrentApp(app: WebApp) {
        viewModelScope.launch {
            preferencesManager.setCurrentAppId(app.id)
            webAppRepository.updateLastVisited(app.id, System.currentTimeMillis())
            _uiState.update { it.copy(currentApp = app) }
        }
    }
    
    fun toggleMenu() {
        viewModelScope.launch {
            val newState = !_uiState.value.isMenuCollapsed
            preferencesManager.setMenuCollapsed(newState)
        }
    }
    
    fun updateNavigationState(canGoBack: Boolean, canGoForward: Boolean) {
        _uiState.update {
            it.copy(
                canGoBack = canGoBack,
                canGoForward = canGoForward
            )
        }
    }
    
    fun requestPermissions(permissions: List<String>) {
        _uiState.update {
            it.copy(permissionsNeeded = permissions)
        }
    }
    
    fun clearPermissionRequest() {
        _uiState.update {
            it.copy(permissionsNeeded = emptyList())
        }
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    fun selectApp(appId: String) {
        viewModelScope.launch {
            val app = webAppRepository.getAppById(appId)
            if (app != null) {
                setCurrentApp(app)
            } else {
                Timber.w("App with id $appId not found")
            }
        }
    }
    
    fun createShortcut(app: WebApp) {
        viewModelScope.launch {
            _uiState.update { 
                it.copy(shortcutCreationRequested = app.id) 
            }
        }
    }
    
    fun clearShortcutRequest() {
        _uiState.update { 
            it.copy(shortcutCreationRequested = null) 
        }
    }
    
    fun saveApiKey(keyName: String, keyValue: String) {
        viewModelScope.launch {
            try {
                apiKeysPreferences.saveApiKey(keyName, keyValue)
                Timber.d("API key '$keyName' saved successfully")
            } catch (e: Exception) {
                Timber.e(e, "Error saving API key '$keyName'")
                _uiState.update { it.copy(error = "Failed to save API key") }
            }
        }
    }
    
    fun getApiKey(keyName: String) = apiKeysPreferences.getApiKey(keyName)
    
    fun getAllApiKeys() = apiKeysPreferences.getAllApiKeys()
}
