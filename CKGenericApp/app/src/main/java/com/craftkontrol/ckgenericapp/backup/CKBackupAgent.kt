package com.craftkontrol.ckgenericapp.backup

import android.app.backup.BackupAgent
import android.app.backup.BackupDataInput
import android.app.backup.BackupDataOutput
import android.app.backup.FullBackupDataOutput
import android.os.ParcelFileDescriptor
import timber.log.Timber
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

/**
 * Custom BackupAgent for CKGenericApp
 * Ensures proper backup and restore of all app data across reinstalls
 */
class CKBackupAgent : BackupAgent() {

    companion object {
        private const val TAG = "CKBackupAgent"
        
        // Backup keys
        private const val KEY_DATASTORE_PREFS = "datastore_preferences"
        private const val KEY_ROOM_DB = "room_database"
        private const val KEY_WEBVIEW_DATA = "webview_data"
    }

    /**
     * Key-value backup implementation (legacy support)
     * We primarily use full backup, but this is required by BackupAgent
     */
    override fun onBackup(
        oldState: ParcelFileDescriptor,
        data: BackupDataOutput,
        newState: ParcelFileDescriptor
    ) {
        Timber.d("onBackup called (key-value mode)")
        // We use full backup instead, so this is a no-op
    }

    /**
     * Full backup implementation
     * Called when Android performs automatic backup
     */
    override fun onFullBackup(data: FullBackupDataOutput) {
        try {
            Timber.d("Starting full backup...")
            
            // Backup DataStore preferences
            backupDataStoreFiles(data)
            
            // Backup Room databases
            backupDatabases(data)
            
            // Backup WebView data (localStorage, IndexedDB, cookies)
            backupWebViewData(data)
            
            // Backup shared preferences
            backupSharedPreferences(data)
            
            Timber.i("Full backup completed successfully")
            
        } catch (e: Exception) {
            Timber.e(e, "Error during full backup")
            throw e
        }
    }

    /**
     * Restore implementation
     * Called when Android restores backup after reinstall
     */
    override fun onRestore(
        data: BackupDataInput,
        appVersionCode: Int,
        newState: ParcelFileDescriptor
    ) {
        try {
            Timber.d("Starting restore from backup...")
            
            while (data.readNextHeader()) {
                val key = data.key
                val dataSize = data.dataSize
                
                when (key) {
                    KEY_DATASTORE_PREFS -> restoreDataStore(data, dataSize)
                    KEY_ROOM_DB -> restoreDatabase(data, dataSize)
                    KEY_WEBVIEW_DATA -> restoreWebViewData(data, dataSize)
                    else -> {
                        // Skip unknown keys
                        data.skipEntityData()
                    }
                }
            }
            
            Timber.i("Restore completed successfully")
            
        } catch (e: Exception) {
            Timber.e(e, "Error during restore")
        }
    }

    /**
     * Backup DataStore preference files
     */
    private fun backupDataStoreFiles(data: FullBackupDataOutput) {
        try {
            val filesDir = filesDir
            
            // Backup DataStore files in root files directory
            filesDir.listFiles()?.forEach { file ->
                if (file.isFile && file.name.endsWith(".preferences_pb")) {
                    Timber.d("Backing up DataStore file: ${file.name}")
                    fullBackupFile(file, data)
                }
            }
            
            // Backup DataStore files in datastore subdirectory (if exists)
            val datastoreDir = File(filesDir, "datastore")
            if (datastoreDir.exists() && datastoreDir.isDirectory) {
                datastoreDir.listFiles()?.forEach { file ->
                    if (file.isFile && file.name.endsWith(".preferences_pb")) {
                        Timber.d("Backing up DataStore file from subdirectory: ${file.name}")
                        fullBackupFile(file, data)
                    }
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Error backing up DataStore files")
        }
    }

    /**
     * Backup Room databases
     */
    private fun backupDatabases(data: FullBackupDataOutput) {
        try {
            val dbDir = File(applicationInfo.dataDir, "databases")
            if (dbDir.exists()) {
                dbDir.listFiles()?.forEach { file ->
                    if (!file.name.endsWith("-journal") && !file.name.endsWith("-wal")) {
                        Timber.d("Backing up database: ${file.name}")
                        fullBackupFile(file, data)
                    }
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Error backing up databases")
        }
    }

    /**
     * Backup WebView data directories
     */
    private fun backupWebViewData(data: FullBackupDataOutput) {
        try {
            // WebView app_webview directory (contains localStorage, IndexedDB, cookies)
            val appWebViewDir = File(applicationInfo.dataDir, "app_webview")
            if (appWebViewDir.exists()) {
                Timber.d("Backing up WebView data...")
                backupDirectoryRecursive(appWebViewDir, data)
            }
            
            // WebView custom directories
            val webViewDataDir = getDir("webview_data", MODE_PRIVATE)
            if (webViewDataDir.exists()) {
                Timber.d("Backing up custom WebView data...")
                backupDirectoryRecursive(webViewDataDir, data)
            }
            
        } catch (e: Exception) {
            Timber.e(e, "Error backing up WebView data")
        }
    }

    /**
     * Backup shared preferences
     */
    private fun backupSharedPreferences(data: FullBackupDataOutput) {
        try {
            val prefsDir = File(applicationInfo.dataDir, "shared_prefs")
            if (prefsDir.exists()) {
                prefsDir.listFiles()?.forEach { file ->
                    Timber.d("Backing up shared pref: ${file.name}")
                    fullBackupFile(file, data)
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Error backing up shared preferences")
        }
    }

    /**
     * Recursively backup a directory
     */
    private fun backupDirectoryRecursive(directory: File, data: FullBackupDataOutput) {
        directory.listFiles()?.forEach { file ->
            if (file.isDirectory) {
                backupDirectoryRecursive(file, data)
            } else {
                try {
                    fullBackupFile(file, data)
                } catch (e: Exception) {
                    Timber.w(e, "Failed to backup file: ${file.absolutePath}")
                }
            }
        }
    }

    /**
     * Restore DataStore preferences
     */
    private fun restoreDataStore(data: BackupDataInput, dataSize: Int) {
        try {
            val buffer = ByteArray(dataSize)
            data.readEntityData(buffer, 0, dataSize)
            
            // Write to DataStore file
            val fileName = data.key.substringAfterLast("/")
            val outputFile = File(filesDir, fileName)
            outputFile.parentFile?.mkdirs()
            
            FileOutputStream(outputFile).use { out ->
                out.write(buffer)
            }
            
            Timber.d("Restored DataStore: $fileName")
            
        } catch (e: Exception) {
            Timber.e(e, "Error restoring DataStore")
        }
    }

    /**
     * Restore Room database
     */
    private fun restoreDatabase(data: BackupDataInput, dataSize: Int) {
        try {
            val buffer = ByteArray(dataSize)
            data.readEntityData(buffer, 0, dataSize)
            
            val dbName = data.key.substringAfterLast("/")
            val dbFile = getDatabasePath(dbName)
            dbFile.parentFile?.mkdirs()
            
            FileOutputStream(dbFile).use { out ->
                out.write(buffer)
            }
            
            Timber.d("Restored database: $dbName")
            
        } catch (e: Exception) {
            Timber.e(e, "Error restoring database")
        }
    }

    /**
     * Restore WebView data
     */
    private fun restoreWebViewData(data: BackupDataInput, dataSize: Int) {
        try {
            val buffer = ByteArray(dataSize)
            data.readEntityData(buffer, 0, dataSize)
            
            val relativePath = data.key.substringAfter("app_webview/")
            val outputFile = File(File(applicationInfo.dataDir, "app_webview"), relativePath)
            outputFile.parentFile?.mkdirs()
            
            FileOutputStream(outputFile).use { out ->
                out.write(buffer)
            }
            
            Timber.d("Restored WebView data: $relativePath")
            
        } catch (e: Exception) {
            Timber.e(e, "Error restoring WebView data")
        }
    }
}
