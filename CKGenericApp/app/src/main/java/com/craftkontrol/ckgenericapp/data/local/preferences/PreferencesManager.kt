package com.craftkontrol.ckgenericapp.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("settings")

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore
    
    companion object {
        private val CURRENT_APP_ID = stringPreferencesKey("current_app_id")
        private val MONITORING_ENABLED = booleanPreferencesKey("monitoring_enabled")
        private val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        private val FULLSCREEN_MODE = booleanPreferencesKey("fullscreen_mode")
        private val MENU_COLLAPSED = booleanPreferencesKey("menu_collapsed")
        private val DARK_MODE = booleanPreferencesKey("dark_mode")
        private val WELCOME_CARD_HIDDEN = booleanPreferencesKey("welcome_card_hidden")
        private val CURRENT_LANGUAGE = stringPreferencesKey("current_language")
    }
    
    val currentAppId: Flow<String?> = dataStore.data
        .map { preferences -> preferences[CURRENT_APP_ID] }
    
    val monitoringEnabled: Flow<Boolean> = dataStore.data
        .map { preferences -> preferences[MONITORING_ENABLED] ?: true }
    
    val notificationsEnabled: Flow<Boolean> = dataStore.data
        .map { preferences -> preferences[NOTIFICATIONS_ENABLED] ?: true }
    
    val fullscreenMode: Flow<Boolean> = dataStore.data
        .map { preferences -> preferences[FULLSCREEN_MODE] ?: false }
    
    val menuCollapsed: Flow<Boolean> = dataStore.data
        .map { preferences -> preferences[MENU_COLLAPSED] ?: false }
    
    val darkMode: Flow<Boolean> = dataStore.data
        .map { preferences -> preferences[DARK_MODE] ?: false }
    
    val welcomeCardHidden: Flow<Boolean> = dataStore.data
        .map { preferences -> preferences[WELCOME_CARD_HIDDEN] ?: false }
    
    val currentLanguage: Flow<String?> = dataStore.data
        .map { preferences -> preferences[CURRENT_LANGUAGE] }
    
    suspend fun setCurrentAppId(appId: String) {
        dataStore.edit { preferences ->
            preferences[CURRENT_APP_ID] = appId
        }
    }
    
    suspend fun setMonitoringEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[MONITORING_ENABLED] = enabled
        }
    }
    
    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[NOTIFICATIONS_ENABLED] = enabled
        }
    }
    
    suspend fun setFullscreenMode(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[FULLSCREEN_MODE] = enabled
        }
    }
    
    suspend fun setMenuCollapsed(collapsed: Boolean) {
        dataStore.edit { preferences ->
            preferences[MENU_COLLAPSED] = collapsed
        }
    }
    
    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[DARK_MODE] = enabled
        }
    }
    
    suspend fun setWelcomeCardHidden(hidden: Boolean) {
        dataStore.edit { preferences ->
            preferences[WELCOME_CARD_HIDDEN] = hidden
        }
    }
    
    suspend fun setCurrentLanguage(languageCode: String) {
        dataStore.edit { preferences ->
            preferences[CURRENT_LANGUAGE] = languageCode
        }
    }
}
