package com.craftkontrol.ckgenericapp.provider

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.content.UriMatcher
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import com.craftkontrol.core.auth.AuthContract
import timber.log.Timber

/**
 * Signature-protected provider that exposes a shared auth token to sibling CraftKontrol apps.
 * Currently returns a placeholder token; wire into real session storage when available.
 */
class AuthProvider : ContentProvider() {

    private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
        addURI(AuthContract.AUTHORITY, AuthContract.PATH_TOKEN, TOKEN)
    }

    override fun onCreate(): Boolean = true

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        return when (uriMatcher.match(uri)) {
            TOKEN -> {
                val columns = arrayOf(AuthContract.Columns.TOKEN)
                val cursor = MatrixCursor(columns, 1)
                val token = readToken(context)
                cursor.addRow(arrayOf<Any?>(token))
                cursor
            }
            else -> null
        }
    }

    override fun getType(uri: Uri): String? = null

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?
    ): Int = 0

    private fun readToken(context: Context?): String? {
        // TODO: Hook into real auth/session storage. Placeholder for now.
        return try {
            val prefs = context?.getSharedPreferences("ck_shared_auth", Context.MODE_PRIVATE)
            prefs?.getString("auth_token", null)
        } catch (e: Exception) {
            Timber.w(e, "Failed to read shared auth token")
            null
        }
    }

    private companion object {
        private const val TOKEN = 1
    }
}
