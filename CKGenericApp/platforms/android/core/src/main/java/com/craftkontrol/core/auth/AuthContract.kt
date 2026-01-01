package com.craftkontrol.core.auth

import android.content.Context
import android.net.Uri
import android.provider.BaseColumns

/** Contract for accessing shared auth/session data exposed by the main app. */
object AuthContract {
    const val AUTHORITY = "com.craftkontrol.ckgenericapp.auth"
    const val PATH_TOKEN = "token"
    val CONTENT_URI: Uri = Uri.parse("content://$AUTHORITY/$PATH_TOKEN")

    object Columns : BaseColumns {
        const val TOKEN = "token"
    }

    /**
        * Fetch the shared auth token from the main app's provider.
        * Caller must have com.craftkontrol.ckgenericapp.permission.ACCESS_AUTH and be signature-signed.
        */
    fun getToken(context: Context): String? {
        return try {
            context.contentResolver.query(CONTENT_URI, arrayOf(Columns.TOKEN), null, null, null)
                ?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val idx = cursor.getColumnIndexOrThrow(Columns.TOKEN)
                        cursor.getString(idx)
                    } else null
                }
        } catch (_: Exception) {
            null
        }
    }
}
