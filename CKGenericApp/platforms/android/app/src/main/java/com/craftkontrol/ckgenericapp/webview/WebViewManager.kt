package com.craftkontrol.ckgenericapp.webview

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.webkit.*
import androidx.browser.customtabs.CustomTabsIntent
import com.craftkontrol.ckgenericapp.webview.OAuthHelper.isGoogleOAuthUrl
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.craftkontrol.ckgenericapp.service.SensorMonitoringService
import timber.log.Timber

class CKWebViewClient(private val context: Context) : WebViewClient() {
    
    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false
        
        Timber.d("=== shouldOverrideUrlLoading ===")
        Timber.d("URL: $url")
        Timber.d("isMainFrame: ${request.isForMainFrame}")
        Timber.d("hasGesture: ${request.hasGesture()}")
        
        // Handle special URL schemes (tel:, mailto:, sms:, etc.)
        if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                Timber.d("Opening special URL scheme: $url")
                return true
            } catch (e: Exception) {
                Timber.e(e, "Failed to open URL scheme: $url")
                return false
            }
        }

        // Enforce Google OAuth in a secure browser (Custom Tab) - keep original HTTPS redirect for WEB client
        if (isGoogleOAuthUrl(url)) {
            Timber.d("Opening Google OAuth in Custom Tab (original URL, HTTPS redirect): $url")
            launchInCustomTab(context, url)
            return true
        }
        
        // For OAuth/new-window flows (target="_blank" or window.open) keep navigation inside
        // the current WebView so session/API keys remain available. Only special schemes above
        // are allowed to leave the WebView.
        val isMainFrame = request.isForMainFrame
        val hasGesture = request.hasGesture()
        if ((!isMainFrame || hasGesture) && view != null) {
            Timber.d("Handling new-window request inside WebView: $url")
            view.loadUrl(url)
            return true
        }
        
        // Allow same-page navigation within WebView
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

private fun launchInCustomTab(context: Context, url: String) {
    try {
        val customTabsIntent = CustomTabsIntent.Builder().build()
        customTabsIntent.launchUrl(context, Uri.parse(url))
    } catch (e: Exception) {
        Timber.e(e, "Failed to open Custom Tab for OAuth, falling back to browser")
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (ex: Exception) {
            Timber.e(ex, "Failed to open browser for OAuth")
        }
    }
}

class CKWebChromeClient(
    private val activity: Activity,
    private val onPermissionRequest: (Array<String>, PermissionRequest) -> Unit
) : WebChromeClient() {
    
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    
    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        super.onProgressChanged(view, newProgress)
        // Can be used to update a progress bar
    }
    
    override fun onPermissionRequest(request: PermissionRequest?) {
        request?.let {
            Timber.d("WebView permission request: ${it.resources.joinToString()}")
            
            val permissions = mutableListOf<String>()
            
            it.resources.forEach { resource ->
                when (resource) {
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                        Timber.d("Requesting CAMERA permission")
                        permissions.add(Manifest.permission.CAMERA)
                    }
                    PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                        Timber.d("Requesting RECORD_AUDIO permission")
                        permissions.add(Manifest.permission.RECORD_AUDIO)
                    }
                    PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID -> {
                        Timber.d("Requesting PROTECTED_MEDIA_ID permission")
                        // Handle protected media
                    }
                }
            }
            
            // Check if permissions are already granted
            val allGranted = permissions.all { permission ->
                ContextCompat.checkSelfPermission(activity, permission) == 
                    PackageManager.PERMISSION_GRANTED
            }
            
            if (allGranted) {
                Timber.d("All permissions already granted, granting WebView request")
                it.grant(it.resources)
            } else {
                Timber.d("Permissions not granted, requesting runtime permissions")
                // Pass the PermissionRequest to the callback so it can be granted later
                onPermissionRequest(permissions.toTypedArray(), it)
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
            Timber.d("Geolocation permission not granted")
            // For geolocation, we can't use PermissionRequest, just deny callback
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
    private val onCancelAlarm: ((String) -> Unit)? = null,
    private val sensorMonitoringService: SensorMonitoringService? = null
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
    fun startSensors() {
        Timber.d("JavaScript called startSensors()")
        sensorMonitoringService?.startSensors()
    }

    @JavascriptInterface
    fun stopSensors() {
        Timber.d("JavaScript called stopSensors()")
        sensorMonitoringService?.stopSensors()
    }

    @JavascriptInterface
    fun getAccelerometer(): String {
        val data = sensorMonitoringService?.accelerometerData?.value
        return if (data != null) {
            """{"x":${data.x},"y":${data.y},"z":${data.z},"timestamp":${data.timestamp}}"""
        } else {
            """{"error":"No accelerometer data available"}"""
        }
    }

    @JavascriptInterface
    fun getGyroscope(): String {
        val data = sensorMonitoringService?.gyroscopeData?.value
        return if (data != null) {
            """{"x":${data.x},"y":${data.y},"z":${data.z},"timestamp":${data.timestamp}}"""
        } else {
            """{"error":"No gyroscope data available"}"""
        }
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
    
    @JavascriptInterface
    fun saveActivityData(trackingEnabled: Boolean, todaySteps: Int) {
        try {
            val activityPrefs = context.getSharedPreferences("memoryboardhelper_activity", Context.MODE_PRIVATE)
            activityPrefs.edit().apply {
                putBoolean("tracking_enabled", trackingEnabled)
                putInt("today_steps", todaySteps)
                putLong("last_update", System.currentTimeMillis())
                apply()
            }
            Timber.d("Activity data saved: tracking=$trackingEnabled, steps=$todaySteps")
        } catch (e: Exception) {
            Timber.e(e, "Error saving activity data")
        }
    }
    
    @JavascriptInterface
    fun getActivityData(): String {
        return try {
            val activityPrefs = context.getSharedPreferences("memoryboardhelper_activity", Context.MODE_PRIVATE)
            val trackingEnabled = activityPrefs.getBoolean("tracking_enabled", false)
            val todaySteps = activityPrefs.getInt("today_steps", 0)
            val lastUpdate = activityPrefs.getLong("last_update", 0)
            
            """{"trackingEnabled":$trackingEnabled,"todaySteps":$todaySteps,"lastUpdate":$lastUpdate}"""
        } catch (e: Exception) {
            Timber.e(e, "Error getting activity data")
            """{"error":"${e.message}"}"""
        }
    }
    
    @JavascriptInterface
    fun makeCall(phoneNumber: String) {
        try {
            Timber.d("Making phone call to: $phoneNumber")
            val intent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:$phoneNumber")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Timber.e(e, "Error making phone call to: $phoneNumber")
        }
    }
}
