package com.craftkontrol.ckgenericapp.presentation.shortcut

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.domain.repository.WebAppRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class ShortcutViewModel @Inject constructor(
    private val webAppRepository: WebAppRepository,
    private val apiKeysPreferences: com.craftkontrol.ckgenericapp.data.local.preferences.ApiKeysPreferences
) : ViewModel() {
    
    private val _app = MutableStateFlow<WebApp?>(null)
    val app: StateFlow<WebApp?> = _app.asStateFlow()
    
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _apiKeys = MutableStateFlow<Map<String, String>>(emptyMap())
    val apiKeys: StateFlow<Map<String, String>> = _apiKeys.asStateFlow()
    
    fun loadApp(appId: String) {
        viewModelScope.launch {
            try {
                Timber.d("Loading app with ID: $appId")
                _isLoading.value = true
                
                // Initialize apps if needed
                webAppRepository.initializeDefaultApps()
                
                // Get the specific app
                val loadedApp = webAppRepository.getAppById(appId)
                
                if (loadedApp != null) {
                    Timber.d("App loaded: ${loadedApp.name} - ${loadedApp.url}")
                    _app.value = loadedApp
                } else {
                    Timber.e("App not found for ID: $appId")
                }
                
                // Load API keys (one-time read)
                val keys = apiKeysPreferences.getAllApiKeys().first()
                _apiKeys.value = keys
                Timber.d("Loaded ${keys.size} API keys")
                
                _isLoading.value = false
            } catch (e: Exception) {
                Timber.e(e, "Error loading app")
                _isLoading.value = false
            }
        }
    }
    
    fun getApiKey(keyName: String): String? {
        return _apiKeys.value[keyName]
    }
}
