package com.craftkontrol.ckgenericapp.webview

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.webkit.*
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import timber.log.Timber

class CKWebViewClient : WebViewClient() {
    
    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        // Allow all URLs to load in the WebView
        return false
    }
    
    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
        super.onPageStarted(view, url, favicon)
        Timber.d("Page loading started: $url")
    }
    
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        Timber.d("Page loading finished: $url")
    }
    
    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
    ) {
        super.onReceivedError(view, request, error)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Timber.e("WebView error: ${error?.description}")
        }
    }
}

class CKWebChromeClient(
    private val activity: Activity,
    private val onPermissionRequest: (Array<String>) -> Unit
) : WebChromeClient() {
    
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    
    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        super.onProgressChanged(view, newProgress)
        // Can be used to update a progress bar
    }
    
    override fun onPermissionRequest(request: PermissionRequest?) {
        request?.let {
            val permissions = mutableListOf<String>()
            
            it.resources.forEach { resource ->
                when (resource) {
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                        permissions.add(Manifest.permission.CAMERA)
                    }
                    PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                        permissions.add(Manifest.permission.RECORD_AUDIO)
                    }
                    PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID -> {
                        // Handle protected media
                    }
                }
            }
            
            // Check if permissions are granted
            val allGranted = permissions.all { permission ->
                ContextCompat.checkSelfPermission(activity, permission) == 
                    PackageManager.PERMISSION_GRANTED
            }
            
            if (allGranted) {
                it.grant(it.resources)
            } else {
                onPermissionRequest(permissions.toTypedArray())
                // Grant after user grants permission
                activity.runOnUiThread {
                    val stillAllGranted = permissions.all { permission ->
                        ContextCompat.checkSelfPermission(activity, permission) == 
                            PackageManager.PERMISSION_GRANTED
                    }
                    if (stillAllGranted) {
                        it.grant(it.resources)
                    } else {
                        it.deny()
                    }
                }
            }
        }
    }
    
    override fun onGeolocationPermissionsShowPrompt(
        origin: String?,
        callback: GeolocationPermissions.Callback?
    ) {
        val hasPermission = ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        if (hasPermission) {
            callback?.invoke(origin, true, false)
        } else {
            onPermissionRequest(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION))
            callback?.invoke(origin, false, false)
        }
    }
    
    override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
    ): Boolean {
        this.filePathCallback = filePathCallback
        // Handle file chooser - would need to be implemented in Activity
        return true
    }
    
    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        consoleMessage?.let {
            Timber.d("Console [${it.messageLevel()}]: ${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
        }
        return true
    }
}

class WebViewJavaScriptInterface(
    private val context: Context,
    private val onNotification: (String, String) -> Unit,
    private val apiKeysPreferences: com.craftkontrol.ckgenericapp.data.local.preferences.ApiKeysPreferences? = null,
    private val onScheduleAlarm: ((String, String, Long, String) -> Unit)? = null,
    private val onCancelAlarm: ((String) -> Unit)? = null
) {
    
    @JavascriptInterface
    fun postMessage(message: String) {
        Timber.d("Received message from WebView: $message")
        // Handle messages from web app
    }
    
    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        Timber.d("Notification request: $title - $message")
        onNotification(title, message)
    }
    
    @JavascriptInterface
    fun scheduleAlarm(alarmId: String, title: String, timestamp: Long, taskType: String = "general") {
        Timber.d("Alarm scheduling request: id=$alarmId, title=$title, time=$timestamp, type=$taskType")
        onScheduleAlarm?.invoke(alarmId, title, timestamp, taskType)
    }
    
    @JavascriptInterface
    fun cancelAlarm(alarmId: String) {
        Timber.d("Alarm cancellation request: $alarmId")
        onCancelAlarm?.invoke(alarmId)
    }
    
    @JavascriptInterface
    fun getAppVersion(): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName
        } catch (e: Exception) {
            "1.0.0"
        }
    }
    
    @JavascriptInterface
    fun getApiKey(keyName: String): String? {
        if (apiKeysPreferences == null) {
            Timber.w("ApiKeysPreferences not available in WebView")
            return null
        }
        
        return try {
            // Note: This is synchronous access which is not ideal for production
            // For production, consider using a callback mechanism or CompletableFuture
            // For now, we'll need to handle this differently in ShortcutActivity
            Timber.d("API key request for: $keyName")
            null // Will be handled via callback mechanism in ShortcutActivity
        } catch (e: Exception) {
            Timber.e(e, "Error getting API key: $keyName")
            null
        }
    }
    
    @JavascriptInterface
    fun hasApiKey(keyName: String): Boolean {
        return apiKeysPreferences != null
    }
}
