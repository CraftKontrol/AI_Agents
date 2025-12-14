package com.craftkontrol.ckgenericapp.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.apiKeysDataStore: DataStore<Preferences> by preferencesDataStore(name = "api_keys")

@Singleton
class ApiKeysPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.apiKeysDataStore
    
    /**
     * Save an API key with a given name
     */
    suspend fun saveApiKey(keyName: String, keyValue: String) {
        val prefsKey = stringPreferencesKey("api_key_$keyName")
        dataStore.edit { preferences ->
            preferences[prefsKey] = keyValue
        }
    }
    
    /**
     * Get an API key by name
     */
    fun getApiKey(keyName: String): Flow<String?> {
        val prefsKey = stringPreferencesKey("api_key_$keyName")
        return dataStore.data.map { preferences ->
            preferences[prefsKey]
        }
    }
    
    /**
     * Get all API keys as a map
     */
    fun getAllApiKeys(): Flow<Map<String, String>> {
        return dataStore.data.map { preferences ->
            preferences.asMap()
                .filterKeys { it.name.startsWith("api_key_") }
                .mapKeys { it.key.name.removePrefix("api_key_") }
                .mapValues { it.value.toString() }
        }
    }
    
    /**
     * Delete an API key
     */
    suspend fun deleteApiKey(keyName: String) {
        val prefsKey = stringPreferencesKey("api_key_$keyName")
        dataStore.edit { preferences ->
            preferences.remove(prefsKey)
        }
    }
    
    /**
     * Clear all API keys
     */
    suspend fun clearAllApiKeys() {
        dataStore.edit { preferences ->
            val keysToRemove = preferences.asMap().keys
                .filter { it.name.startsWith("api_key_") }
            keysToRemove.forEach { key ->
                preferences.remove(key)
            }
        }
    }
}
