package com.craftkontrol.ckgenericapp.webview

import android.content.Context
import android.net.Uri
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

object OAuthHelper {
    // Google-recommended custom scheme redirect for installed apps
    private const val REDIRECT_URI = "com.googleusercontent.apps.102458138422-k90lf1qi27mrc522ltn4noihq9hjh1c9:/oauthredirect"

    private const val PREF_NAME = "ckoauth_prefs"
    private const val KEY_STATE = "state"
    private const val KEY_VERIFIER = "verifier"

    private val secureRandom = SecureRandom()

    fun isGoogleOAuthUrl(url: String): Boolean {
        return url.contains("accounts.google.com/o/oauth2", ignoreCase = true) ||
            url.contains("accounts.google.com/signin/oauth", ignoreCase = true) ||
            url.contains("oauth2.googleapis.com", ignoreCase = true)
    }

    fun rewriteOAuthUrl(originalUrl: String, context: Context): String {
        val state = generateState()
        val verifier = generateCodeVerifier()
        val challenge = codeChallenge(verifier)
        storeState(context, state, verifier)

        val uri = Uri.parse(originalUrl)
        val builder = uri.buildUpon()
            .clearQuery()

        // Preserve existing query params except the ones we override
        val params = uri.queryParameterNames
        params.forEach { key ->
            if (key !in setOf("redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "scope")) {
                builder.appendQueryParameter(key, uri.getQueryParameter(key))
            }
        }

        builder.appendQueryParameter("response_type", "code")
        builder.appendQueryParameter("redirect_uri", REDIRECT_URI)
        builder.appendQueryParameter("code_challenge_method", "S256")
        builder.appendQueryParameter("code_challenge", challenge)
        builder.appendQueryParameter("state", state)

        // Optional: keep scope from original URL
        uri.getQueryParameter("scope")?.let { builder.appendQueryParameter("scope", it) }

        return builder.build().toString()
    }

    fun getStoredState(context: Context): Pair<String?, String?> {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val state = prefs.getString(KEY_STATE, null)
        val verifier = prefs.getString(KEY_VERIFIER, null)
        return state to verifier
    }

    fun clearState(context: Context) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }

    private fun storeState(context: Context, state: String, verifier: String) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_STATE, state)
            .putString(KEY_VERIFIER, verifier)
            .apply()
    }

    private fun generateState(): String = randomBase64Url(16)
    private fun generateCodeVerifier(): String = randomBase64Url(32)

    private fun codeChallenge(verifier: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(verifier.toByteArray(Charsets.US_ASCII))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest)
    }

    private fun randomBase64Url(byteLength: Int): String {
        val bytes = ByteArray(byteLength)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
}
