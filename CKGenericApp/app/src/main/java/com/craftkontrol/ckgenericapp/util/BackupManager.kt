package com.craftkontrol.ckgenericapp.util

import android.content.Context
import android.os.Environment
import timber.log.Timber
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

/**
 * Manager for manual backup and restore of app data
 * Provides additional persistence beyond Android's automatic backup
 */
object BackupManager {
    
    private const val BACKUP_FOLDER = "CKGenericApp_Backups"
    
    /**
     * Export all app data to external storage
     * Includes: databases, shared preferences, WebView data
     */
    fun exportData(context: Context): Result<File> {
        return try {
            // Create backup directory in PUBLIC Documents folder (survives uninstall)
            val documentsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS)
            val backupDir = File(documentsDir, BACKUP_FOLDER)
            
            if (!backupDir.exists()) {
                backupDir.mkdirs()
            }
            
            Timber.i("Backup directory: ${backupDir.absolutePath}")
            
            // Create timestamped backup file
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val backupFile = File(backupDir, "ckgenericapp_backup_$timestamp.zip")
            
            // Create zip file with all data
            ZipOutputStream(FileOutputStream(backupFile)).use { zipOut ->
                // Backup databases
                val dbDir = File(context.applicationInfo.dataDir, "databases")
                if (dbDir.exists()) {
                    addDirectoryToZip(zipOut, dbDir, "databases")
                }
                
                // Backup shared preferences (DataStore)
                val prefsDir = File(context.applicationInfo.dataDir, "shared_prefs")
                if (prefsDir.exists()) {
                    addDirectoryToZip(zipOut, prefsDir, "shared_prefs")
                }
                
                // Backup DataStore files (both root and subdirectory)
                val filesDir = context.filesDir
                var datastoreFileCount = 0
                
                if (filesDir.exists()) {
                    // Check root filesDir
                    filesDir.listFiles()?.forEach { file ->
                        if (file.isFile && file.name.endsWith(".preferences_pb")) {
                            addFileToZip(zipOut, file, "datastore/${file.name}")
                            datastoreFileCount++
                            Timber.i("Backed up DataStore from root: ${file.name}")
                        }
                    }
                    
                    // Check datastore subdirectory
                    val datastoreSubdir = File(filesDir, "datastore")
                    if (datastoreSubdir.exists() && datastoreSubdir.isDirectory) {
                        datastoreSubdir.listFiles()?.forEach { file ->
                            if (file.isFile && file.name.endsWith(".preferences_pb")) {
                                addFileToZip(zipOut, file, "datastore/${file.name}")
                                datastoreFileCount++
                                Timber.i("Backed up DataStore from subdirectory: ${file.name}")
                            }
                        }
                    }
                }
                
                Timber.i("Total DataStore files backed up: $datastoreFileCount")
                
                // Backup WebView data
                val webViewDataDir = context.getDir("webview_data", Context.MODE_PRIVATE)
                if (webViewDataDir.exists()) {
                    addDirectoryToZip(zipOut, webViewDataDir, "webview_data")
                }
                
                // Backup app_webview directory (default WebView storage)
                val appWebViewDir = File(context.applicationInfo.dataDir, "app_webview")
                if (appWebViewDir.exists()) {
                    addDirectoryToZip(zipOut, appWebViewDir, "app_webview")
                }
                
                // Backup WebView cache
                val webViewCacheDir = context.getDir("webview_cache", Context.MODE_PRIVATE)
                if (webViewCacheDir.exists()) {
                    addDirectoryToZip(zipOut, webViewCacheDir, "webview_cache")
                }
            }
            
            Timber.i("Data exported successfully to: ${backupFile.absolutePath}")
            Result.success(backupFile)
            
        } catch (e: Exception) {
            Timber.e(e, "Error exporting data")
            Result.failure(e)
        }
    }
    
    /**
     * Import app data from a backup file
     * Restores: databases, shared preferences, WebView data
     */
    fun importData(context: Context, backupFile: File): Result<Unit> {
        return try {
            if (!backupFile.exists()) {
                return Result.failure(Exception("Backup file not found"))
            }
            
            // Clear existing data (optional - can be configurable)
            // clearAllData(context)
            
            // Extract zip file
            var restoredFileCount = 0
            var datastoreFileCount = 0
            
            ZipInputStream(FileInputStream(backupFile)).use { zipIn ->
                var entry: ZipEntry? = zipIn.nextEntry
                
                while (entry != null) {
                    val entryName = entry.name
                    
                    // Determine correct restore path based on entry type
                    val outputFile = when {
                        // DataStore files - try both locations
                        entryName.startsWith("datastore/") -> {
                            val fileName = entryName.substringAfter("datastore/")
                            
                            // First try to restore to filesDir root (most common)
                            val rootFile = File(context.filesDir, fileName)
                            
                            // Also restore to datastore subdirectory (some devices use this)
                            val subdirFile = File(context.filesDir, "datastore/$fileName")
                            subdirFile.parentFile?.mkdirs()
                            
                            Timber.i("Restoring DataStore: $fileName")
                            Timber.i("  → Root: ${rootFile.absolutePath}")
                            Timber.i("  → Subdir: ${subdirFile.absolutePath}")
                            
                            datastoreFileCount++
                            
                            // We'll restore to root first, then copy to subdir
                            rootFile
                        }
                        // Everything else goes to dataDir
                        else -> {
                            Timber.d("Restoring: $entryName")
                            File(context.applicationInfo.dataDir, entryName)
                        }
                    }
                    
                    if (entry.isDirectory) {
                        outputFile.mkdirs()
                    } else {
                        // Ensure parent directory exists
                        outputFile.parentFile?.mkdirs()
                        
                        // Write file
                        val buffer = ByteArray(4096)
                        FileOutputStream(outputFile).use { fileOut ->
                            var count: Int
                            while (zipIn.read(buffer).also { count = it } != -1) {
                                fileOut.write(buffer, 0, count)
                            }
                        }
                        
                        restoredFileCount++
                        
                        // If it's a DataStore file, also copy to datastore subdirectory
                        if (entryName.startsWith("datastore/")) {
                            val fileName = entryName.substringAfter("datastore/")
                            val subdirFile = File(context.filesDir, "datastore/$fileName")
                            subdirFile.parentFile?.mkdirs()
                            
                            try {
                                outputFile.copyTo(subdirFile, overwrite = true)
                                Timber.i("✓ DataStore copied to subdirectory: ${subdirFile.name}")
                            } catch (e: Exception) {
                                Timber.w(e, "Could not copy to subdirectory (may not be needed)")
                            }
                        }
                        
                        Timber.i("✓ Restored: $entryName → ${outputFile.absolutePath} (${outputFile.length()} bytes)")
                    }
                    
                    zipIn.closeEntry()
                    entry = zipIn.nextEntry
                }
            }
            
            Timber.i("Import summary: $restoredFileCount files restored, including $datastoreFileCount DataStore files")
            
            Timber.i("Data imported successfully from: ${backupFile.absolutePath}")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Timber.e(e, "Error importing data")
            Result.failure(e)
        }
    }
    
    /**
     * List all available backup files
     */
    fun listBackups(context: Context): List<File> {
        val documentsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS)
        val backupDir = File(documentsDir, BACKUP_FOLDER)
        
        if (!backupDir.exists()) {
            return emptyList()
        }
        
        return backupDir.listFiles()
            ?.filter { it.name.endsWith(".zip") }
            ?.sortedByDescending { it.lastModified() }
            ?: emptyList()
    }
    
    /**
     * Delete a backup file
     */
    fun deleteBackup(backupFile: File): Boolean {
        return try {
            backupFile.delete()
        } catch (e: Exception) {
            Timber.e(e, "Error deleting backup")
            false
        }
    }
    
    /**
     * Clear all app data (use with caution)
     */
    private fun clearAllData(context: Context) {
        try {
            // Clear databases
            context.databaseList().forEach { dbName ->
                context.deleteDatabase(dbName)
            }
            
            // Clear shared preferences
            val prefsDir = File(context.applicationInfo.dataDir, "shared_prefs")
            prefsDir.listFiles()?.forEach { it.delete() }
            
            // Clear files
            context.filesDir.listFiles()?.forEach { it.deleteRecursively() }
            
            Timber.d("All app data cleared")
        } catch (e: Exception) {
            Timber.e(e, "Error clearing app data")
        }
    }
    
    /**
     * Add a directory and its contents to a zip file
     */
    private fun addDirectoryToZip(
        zipOut: ZipOutputStream,
        directory: File,
        zipPath: String
    ) {
        directory.listFiles()?.forEach { file ->
            val entryPath = "$zipPath/${file.name}"
            
            if (file.isDirectory) {
                addDirectoryToZip(zipOut, file, entryPath)
            } else {
                addFileToZip(zipOut, file, entryPath)
            }
        }
    }
    
    /**
     * Add a single file to a zip file
     */
    private fun addFileToZip(
        zipOut: ZipOutputStream,
        file: File,
        zipPath: String
    ) {
        try {
            FileInputStream(file).use { fileIn ->
                val zipEntry = ZipEntry(zipPath)
                zipOut.putNextEntry(zipEntry)
                fileIn.copyTo(zipOut)
                zipOut.closeEntry()
            }
        } catch (e: Exception) {
            Timber.e(e, "Error adding file to zip: ${file.name}")
        }
    }
}
