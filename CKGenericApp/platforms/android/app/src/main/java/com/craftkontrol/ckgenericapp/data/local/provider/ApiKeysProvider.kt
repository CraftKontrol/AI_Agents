package com.craftkontrol.ckgenericapp.data.local.provider

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import com.craftkontrol.ckgenericapp.data.local.preferences.ApiKeysPreferences
import timber.log.Timber

class ApiKeysProvider : ContentProvider() {
    companion object {
        const val AUTHORITY = "com.craftkontrol.ckgenericapp.apikeys"
        private const val PATH_KEYS = "keys"
        private const val PATH_KEY = "keys/*"
        private const val CODE_KEYS = 1
        private const val CODE_KEY = 2
        private const val TAG = "ApiKeysProvider"
    }

    private val matcher = UriMatcher(UriMatcher.NO_MATCH).apply {
        addURI(AUTHORITY, PATH_KEYS, CODE_KEYS)
        addURI(AUTHORITY, PATH_KEY, CODE_KEY)
    }

    override fun onCreate(): Boolean {
        Log.i(TAG, "ApiKeysProvider onCreate")
        Timber.i("ApiKeysProvider onCreate")
        return true
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        Log.i(TAG, "Query called for URI: $uri")
        Timber.i("Query called for URI: $uri")
        
        val context = context
        if (context == null) {
            Log.e(TAG, "Context is null in query()")
            Timber.e("Context is null in query()")
            return null
        }
        
        val matchCode = matcher.match(uri)
        Log.i(TAG, "URI match code: $matchCode (CODE_KEYS=$CODE_KEYS, CODE_KEY=$CODE_KEY)")
        
        val prefs = ApiKeysPreferences(context)
        return when (matchCode) {
            CODE_KEYS -> {
                Log.i(TAG, "Querying all API keys")
                Timber.i("Querying all API keys")
                val cursor = MatrixCursor(arrayOf("key", "value"))
                val map = runBlocking { 
                    prefs.getAllApiKeys().firstOrNull() ?: emptyMap()
                }
                Log.i(TAG, "Retrieved ${map.size} API keys from preferences")
                Timber.i("Retrieved ${map.size} API keys from preferences")
                map.forEach { (k, v) -> 
                    cursor.addRow(arrayOf(k, v))
                    Log.d(TAG, "Added API key: $k (length: ${v.length})")
                }
                Log.i(TAG, "Returning cursor with ${cursor.count} rows")
                cursor
            }
            CODE_KEY -> {
                val keyName = uri.lastPathSegment
                Log.i(TAG, "Querying specific key: $keyName")
                Timber.i("Querying specific key: $keyName")
                if (keyName == null) {
                    Log.e(TAG, "Key name is null")
                    return null
                }
                val cursor = MatrixCursor(arrayOf("key", "value"))
                val value = runBlocking { prefs.getApiKey(keyName).firstOrNull() }
                if (value != null) {
                    cursor.addRow(arrayOf(keyName, value))
                    Log.i(TAG, "Found key $keyName with value length: ${value.length}")
                } else {
                    Log.w(TAG, "Key $keyName not found")
                }
                cursor
            }
            else -> {
                Log.e(TAG, "No match for URI: $uri")
                Timber.e("No match for URI: $uri")
                null
            }
        }
    }

    override fun getType(uri: Uri): String? = when (matcher.match(uri)) {
        CODE_KEYS -> "vnd.android.cursor.dir/vnd.ckgenericapp.apikey"
        CODE_KEY -> "vnd.android.cursor.item/vnd.ckgenericapp.apikey"
        else -> null
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int = 0
}
