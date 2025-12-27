package com.craftkontrol.ckgenericapp.backup

import android.app.backup.BackupManager
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import timber.log.Timber
import java.util.Date

// Singleton DataStore at the top level (file scope)
private val Context.backupDataStore: DataStore<Preferences> by preferencesDataStore("backup_metadata")

/**
 * Helper for managing automatic backups
 * Ensures data persistence across app reinstalls
 */
class BackupHelper(private val context: Context) {

    private val dataStore: DataStore<Preferences> = context.applicationContext.backupDataStore
    
    companion object {
        private val LAST_BACKUP_TIME = stringPreferencesKey("last_backup_time")
        private val BACKUP_ENABLED = booleanPreferencesKey("backup_enabled")
        private val FIRST_LAUNCH_AFTER_INSTALL = booleanPreferencesKey("first_launch_after_install")
        
        private const val BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000L // 24 hours
    }

    /**
     * Request immediate backup to Google Drive
     * Call this when critical data changes
     */
    fun requestBackup() {
        try {
            val backupManager = BackupManager(context)
            backupManager.dataChanged()
            Timber.i("Backup requested successfully")
        } catch (e: Exception) {
            Timber.e(e, "Error requesting backup")
        }
    }

    /**
     * Request backup if enough time has passed since last backup
     */
    suspend fun requestBackupIfNeeded() {
        try {
            val lastBackupTime = getLastBackupTime()
            val currentTime = System.currentTimeMillis()
            
            if (lastBackupTime == null || (currentTime - lastBackupTime) > BACKUP_INTERVAL_MS) {
                requestBackup()
                saveLastBackupTime(currentTime)
                Timber.i("Automatic backup triggered")
            } else {
                Timber.d("Backup not needed yet (last backup: ${Date(lastBackupTime)})")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error checking backup status")
        }
    }

    /**
     * Check if this is the first launch after installation
     * Returns true if app was recently installed/reinstalled
     */
    suspend fun isFirstLaunchAfterInstall(): Boolean {
        return try {
            dataStore.data.map { prefs ->
                prefs[FIRST_LAUNCH_AFTER_INSTALL] ?: true
            }.first()
        } catch (e: Exception) {
            Timber.e(e, "Error checking first launch status")
            true
        }
    }

    /**
     * Mark that first launch is complete
     */
    suspend fun markFirstLaunchComplete() {
        try {
            dataStore.edit { prefs ->
                prefs[FIRST_LAUNCH_AFTER_INSTALL] = false
            }
            Timber.d("First launch marked as complete")
        } catch (e: Exception) {
            Timber.e(e, "Error marking first launch complete")
        }
    }

    /**
     * Enable automatic backups
     */
    suspend fun enableBackup() {
        try {
            dataStore.edit { prefs ->
                prefs[BACKUP_ENABLED] = true
            }
            requestBackup()
            Timber.i("Automatic backup enabled")
        } catch (e: Exception) {
            Timber.e(e, "Error enabling backup")
        }
    }

    /**
     * Disable automatic backups
     */
    suspend fun disableBackup() {
        try {
            dataStore.edit { prefs ->
                prefs[BACKUP_ENABLED] = false
            }
            Timber.i("Automatic backup disabled")
        } catch (e: Exception) {
            Timber.e(e, "Error disabling backup")
        }
    }

    /**
     * Check if backup is enabled
     */
    suspend fun isBackupEnabled(): Boolean {
        return try {
            dataStore.data.map { prefs ->
                prefs[BACKUP_ENABLED] ?: true // Enabled by default
            }.first()
        } catch (e: Exception) {
            Timber.e(e, "Error checking backup status")
            true
        }
    }

    /**
     * Get last backup timestamp
     */
    private suspend fun getLastBackupTime(): Long? {
        return try {
            dataStore.data.map { prefs ->
                prefs[LAST_BACKUP_TIME]?.toLongOrNull()
            }.first()
        } catch (e: Exception) {
            Timber.e(e, "Error getting last backup time")
            null
        }
    }

    /**
     * Save last backup timestamp
     */
    private suspend fun saveLastBackupTime(timestamp: Long) {
        try {
            dataStore.edit { prefs ->
                prefs[LAST_BACKUP_TIME] = timestamp.toString()
            }
        } catch (e: Exception) {
            Timber.e(e, "Error saving backup time")
        }
    }

    /**
     * Force immediate backup (useful before critical operations)
     */
    suspend fun forceBackupNow() {
        try {
            requestBackup()
            saveLastBackupTime(System.currentTimeMillis())
            Timber.i("Forced backup completed")
        } catch (e: Exception) {
            Timber.e(e, "Error during forced backup")
        }
    }

    /**
     * Reset backup metadata (for testing)
     */
    suspend fun resetBackupMetadata() {
        try {
            dataStore.edit { it.clear() }
            Timber.d("Backup metadata reset")
        } catch (e: Exception) {
            Timber.e(e, "Error resetting backup metadata")
        }
    }

    /**
     * Log backup status for debugging
     */
    suspend fun logBackupStatus() {
        try {
            val enabled = isBackupEnabled()
            val lastBackup = getLastBackupTime()
            val isFirstLaunch = isFirstLaunchAfterInstall()
            
            Timber.d("=== Backup Status ===")
            Timber.d("Enabled: $enabled")
            Timber.d("Last backup: ${if (lastBackup != null) Date(lastBackup) else "Never"}")
            Timber.d("First launch: $isFirstLaunch")
            Timber.d("====================")
        } catch (e: Exception) {
            Timber.e(e, "Error logging backup status")
        }
    }
}
