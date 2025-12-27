package com.craftkontrol.ckgenericapp.presentation.shortcut

import com.craftkontrol.ckgenericapp.R
import android.app.PendingIntent
import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.widget.FrameLayout
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.browser.customtabs.CustomTabsIntent
import com.craftkontrol.ckgenericapp.webview.OAuthHelper.isGoogleOAuthUrl
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.presentation.main.MainViewModel
import com.craftkontrol.ckgenericapp.presentation.theme.CKGenericAppTheme
import com.craftkontrol.ckgenericapp.service.SensorMonitoringService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

/**
 * Activity launched from home screen shortcuts
 * Opens directly to a specific web app
 * Each app runs in its own separate task instance (standard launch mode)
 * Multiple instances can run in parallel
 */
@AndroidEntryPoint
class ShortcutActivity : ComponentActivity() {
    
    @Inject lateinit var sensorMonitoringService: SensorMonitoringService
    private var currentAppId: String? = null
    var pendingWebViewPermissionRequest: android.webkit.PermissionRequest? = null
    var currentWebView: WebView? = null
    private var forceReload = false
    var oauthCallbackData: String? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the app ID from the intent
        currentAppId = intent?.getStringExtra(EXTRA_APP_ID)
        
        Timber.d("ShortcutActivity onCreate with appId: $currentAppId")
        
        // Set task description to differentiate tasks in recents
        currentAppId?.let { appId ->
            try {
                setTaskDescription(android.app.ActivityManager.TaskDescription(appId))
            } catch (e: Exception) {
                Timber.e(e, "Failed to set task description")
            }
        }
        
        renderContent()

        // Handle OAuth callback if activity opened via deep link from Custom Tab
        handleOAuthCallback(intent)

        sensorMonitoringService.startSensors()
        startSensorEventDispatcher()
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        
        // Check if same app or different
        val newAppId = intent.getStringExtra(EXTRA_APP_ID)
        Timber.d("ShortcutActivity onNewIntent with appId: $newAppId (current: $currentAppId)")
        
        // Handle OAuth callback if intent contains callback data
        handleOAuthCallback(intent)
        
        // With singleTask launch mode, return to existing instance
        // This should only be called if explicitly routing to an existing instance
        if (newAppId != null && newAppId != currentAppId) {
            currentAppId = newAppId
            forceReload = true
            renderContent() // Re-render with new app
        } else {
            // Same app reopened - force reload with cache clearing
            Timber.d("Same app reopened - forcing fresh reload")
            currentWebView?.let { webView ->
                com.craftkontrol.ckgenericapp.webview.WebViewConfigurator.clearWebViewCache(webView)
                val headers = mapOf(
                    "Cache-Control" to "no-cache, no-store, must-revalidate",
                    "Pragma" to "no-cache",
                    "Expires" to "0"
                )
                webView.loadUrl(webView.url ?: "", headers)
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        // Force reload when app comes to foreground
        if (forceReload) {
            Timber.d("onResume with forceReload flag - forcing fresh reload")
            currentWebView?.let { webView ->
                com.craftkontrol.ckgenericapp.webview.WebViewConfigurator.clearWebViewCache(webView)
                val headers = mapOf(
                    "Cache-Control" to "no-cache, no-store, must-revalidate",
                    "Pragma" to "no-cache",
                    "Expires" to "0"
                )
                webView.loadUrl(webView.url ?: "", headers)
            }
            forceReload = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        sensorMonitoringService.stopSensors()
    }

    private fun handleOAuthCallback(intent: Intent?) {
        val action = intent?.action
        val data = intent?.data
        
        Timber.d("=== OAuth Callback Debug ===")
        Timber.d("Intent action: $action")
        Timber.d("Intent data: $data")
        Timber.d("Intent data scheme: ${data?.scheme}")
        Timber.d("Intent data host: ${data?.host}")
        Timber.d("Intent data path: ${data?.path}")
        
        if (data == null) {
            Timber.d("No data in intent, skipping OAuth callback")
            return
        }
        
        // Check if this is Memory Board Helper OAuth callback URL
        if (data.scheme == "https" && data.host == "craftkontrol.github.io" && 
            data.path?.startsWith("/AI_Agents/MemoryBoardHelper") == true) {
            Timber.d("✓ Received OAuth callback from Custom Tab: $data")
            
            // Extract OAuth parameters from URL (query or fragment)
            val params = mutableMapOf<String, String>()
            
            // Check query parameters first (for code flow)
            data.queryParameterNames.forEach { key ->
                data.getQueryParameter(key)?.let { value ->
                    params[key] = value
                }
            }
            
            // Check fragment (for token flow)
            data.fragment?.let { fragment ->
                fragment.split("&").forEach { pair ->
                    val parts = pair.split("=", limit = 2)
                    if (parts.size == 2) {
                        params[parts[0]] = parts[1]
                    }
                }
            }
            
            // Store OAuth data as JSON
            val paramsJson = params.entries.joinToString(",") { (key, value) ->
                "\"$key\":\"${value.replace("\"", "\\\\\"")}\""
            }
            oauthCallbackData = "{$paramsJson}"
            
            Timber.d("Extracted OAuth params: $oauthCallbackData")
            dispatchOAuthCallbackToWebView()
        }
    }

    fun dispatchOAuthCallbackToWebView() {
        val callbackJson = oauthCallbackData
        val webView = currentWebView
        
        Timber.d("=== Dispatch OAuth to WebView ===")
        Timber.d("Callback data: $callbackJson")
        Timber.d("WebView exists: ${webView != null}")
        Timber.d("WebView URL: ${webView?.url}")
        
        if (callbackJson == null) {
            Timber.d("No callback data to dispatch")
            return
        }
        if (webView == null) {
            Timber.d("No WebView available")
            return
        }
        
        val js = """
            (function() {
                // Notify WebView that OAuth callback was received with parsed params
                const params = $callbackJson;
                const event = new CustomEvent('ckoauth_callback', { 
                    detail: params
                });
                window.dispatchEvent(event);
                console.log('CKGenericApp: OAuth callback dispatched from Custom Tab', params);
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(js, null)
        oauthCallbackData = null
    }

    private fun startSensorEventDispatcher() {
        lifecycleScope.launch {
            sensorMonitoringService.accelerometerData.collect { data ->
                data?.let {
                    val js = """
                        window.dispatchEvent(new CustomEvent('ckgenericapp_accelerometer', {
                            detail: {x: ${it.x}, y: ${it.y}, z: ${it.z}, timestamp: ${it.timestamp}}
                        }));
                    """.trimIndent()
                    currentWebView?.evaluateJavascript(js, null)
                }
            }
        }

        lifecycleScope.launch {
            sensorMonitoringService.gyroscopeData.collect { data ->
                data?.let {
                    val js = """
                        window.dispatchEvent(new CustomEvent('ckgenericapp_gyroscope', {
                            detail: {x: ${it.x}, y: ${it.y}, z: ${it.z}, timestamp: ${it.timestamp}}
                        }));
                    """.trimIndent()
                    currentWebView?.evaluateJavascript(js, null)
                }
            }
        }
    }
    
    private fun renderContent() {
        setContent {
            CKGenericAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (currentAppId != null) {
                        ShortcutScreen(
                            appId = currentAppId!!,
                            activity = this@ShortcutActivity,
                            onExit = { finish() }
                        )
                    } else {
                        // No app ID provided, show error
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = stringResource(R.string.error_no_app),
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }
        }
    }
    
    companion object {
        const val EXTRA_APP_ID = "extra_app_id"
    }
}

@Composable
private fun ShortcutScreen(
    appId: String,
    activity: ShortcutActivity,
    onExit: () -> Unit,
    viewModel: ShortcutViewModel = viewModel()
) {
    val app by viewModel.app.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val apiKeys by viewModel.apiKeys.collectAsStateWithLifecycle()
    
    // Permission launcher setup
    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        Timber.d("Permission result from Composable: $permissions")
        
        val allGranted = permissions.values.all { it }
        
        activity.pendingWebViewPermissionRequest?.let { request ->
            if (allGranted) {
                Timber.d("Runtime permissions granted, granting WebView request")
                request.grant(request.resources)
            } else {
                Timber.d("Runtime permissions denied, denying WebView request")
                request.deny()
            }
            activity.pendingWebViewPermissionRequest = null
        }
    }
    
    // Load the specific app directly from repository
    LaunchedEffect(appId) {
        Timber.d("ShortcutScreen: Loading app with ID: $appId")
        viewModel.loadApp(appId)
    }
    
    // Standalone WebView without CKGenericApp interface
    Box(modifier = Modifier.fillMaxSize()) {
        when {
            isLoading -> {
                // Loading state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = stringResource(R.string.loading_app),
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "App ID: $appId",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            app != null -> {
                StandaloneWebView(
                    app = app!!,
                    apiKeys = apiKeys,
                    activity = activity,
                    permissionLauncher = permissionLauncher,
                    onWebViewCreated = { webView -> 
                        activity.currentWebView = webView
                        // If OAuth callback arrived before WebView ready, dispatch it now
                        if (activity.oauthCallbackData != null) {
                            activity.dispatchOAuthCallbackToWebView()
                        }
                    }
                )
            }
            else -> {
                // Error state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = stringResource(R.string.app_not_found),
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "ID: $appId",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StandaloneWebView(
    app: WebApp,
    apiKeys: Map<String, String>,
    activity: ShortcutActivity,
    permissionLauncher: androidx.activity.compose.ManagedActivityResultLauncher<Array<String>, Map<String, Boolean>>,
    onWebViewCreated: (WebView) -> Unit
) {
    val context = LocalContext.current
    
    AndroidView(
        factory = { ctx ->
            // Create SwipeRefreshLayout container
            SwipeRefreshLayout(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                
                // Create WebView
                val webView = WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    
                    // Configure WebView with JavaScript interface
                    val alarmScheduler = com.craftkontrol.ckgenericapp.util.AlarmScheduler(ctx)
                
                    val jsInterface = com.craftkontrol.ckgenericapp.webview.WebViewJavaScriptInterface(
                        context = ctx,
                        onNotification = { title, message ->
                            Timber.d("Notification from ${app.name}: $title - $message")
                            // Send to monitoring service
                        },
                        apiKeysPreferences = null, // Not needed as we inject via JavaScript
                        onScheduleAlarm = { alarmId, title, timestamp, taskType ->
                            Timber.i("Scheduling alarm from ${app.name}: $alarmId - $title at $timestamp")
                            alarmScheduler.scheduleAlarm(alarmId, title, timestamp, taskType)
                        },
                        onCancelAlarm = { alarmId ->
                            Timber.i("Cancelling alarm from ${app.name}: $alarmId")
                            alarmScheduler.cancelAlarm(alarmId)
                        },
                        sensorMonitoringService = activity.sensorMonitoringService
                    )
                    
                    com.craftkontrol.ckgenericapp.webview.WebViewConfigurator.configure(
                        this, 
                        ctx, 
                        jsInterface
                    )
                    
                    // Custom WebViewClient that injects API keys after page load
                    webViewClient = ApiKeyInjectingWebViewClient(app, apiKeys)
                    
                    webChromeClient = com.craftkontrol.ckgenericapp.webview.CKWebChromeClient(
                        activity = ctx as android.app.Activity,
                        onPermissionRequest = { permissions, request ->
                            Timber.d("Permission request callback: ${permissions.joinToString()}")
                            activity.pendingWebViewPermissionRequest = request
                            permissionLauncher.launch(permissions)
                        }
                    )
                    
                    // Clear cache before loading to ensure fresh content
                    com.craftkontrol.ckgenericapp.webview.WebViewConfigurator.clearWebViewCache(this)
                    
                    onWebViewCreated(this)
                    
                    // Load URL with cache bypass headers
                    val headers = mapOf(
                        "Cache-Control" to "no-cache, no-store, must-revalidate",
                        "Pragma" to "no-cache",
                        "Expires" to "0"
                    )
                    loadUrl(app.url, headers)
                    
                    // Store reference in activity
                    activity.currentWebView = this
                }
                
                // Add WebView to SwipeRefreshLayout
                addView(webView)
                
                // Only enable pull-to-refresh when WebView is scrolled to the top
                // This prevents interference with modal scrolling
                val swipeRefreshLayout = this
                webView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
                    // Enable pull-to-refresh only when at the top (scrollY == 0)
                    swipeRefreshLayout.isEnabled = (scrollY == 0)
                }
                
                // Set up pull-to-refresh listener
                setOnRefreshListener {
                    Timber.d("Pull-to-refresh triggered for ${app.name}")
                    
                    // Clear cache before reloading
                    com.craftkontrol.ckgenericapp.webview.WebViewConfigurator.clearWebViewCache(webView)
                    
                    // Reload with no-cache headers
                    val headers = mapOf(
                        "Cache-Control" to "no-cache, no-store, must-revalidate",
                        "Pragma" to "no-cache",
                        "Expires" to "0"
                    )
                    webView.loadUrl(webView.url ?: app.url, headers)
                    
                    // Stop refreshing after a short delay
                    webView.postDelayed({
                        isRefreshing = false
                    }, 1000)
                }
                
                // Customize colors
                setColorSchemeColors(
                    0xFF4A9EFF.toInt(), // Primary color
                    0xFF2196F3.toInt(), // Blue
                    0xFF00BCD4.toInt()  // Cyan
                )
                setProgressBackgroundColorSchemeColor(0xFF2A2A2A.toInt())
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

/**
 * Custom WebViewClient that injects API keys into JavaScript after page load
 */
private class ApiKeyInjectingWebViewClient(
    private val app: WebApp,
    private val apiKeys: Map<String, String>
) : android.webkit.WebViewClient() {
    
    override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false
        val context = view?.context ?: return false
        
        Timber.d("=== ApiKeyInjectingWebViewClient shouldOverrideUrlLoading ===")
        Timber.d("URL: $url")
        Timber.d("isMainFrame: ${request.isForMainFrame}")
        Timber.d("hasGesture: ${request.hasGesture()}")
        
        // Handle special URL schemes (tel:, mailto:, sms:, etc.)
        if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url))
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
        
        // Keep OAuth/new-window flows (target="_blank" or window.open) inside the same
        // WebView so session state + injected API keys stay available during Google Drive auth.
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
        Timber.d("Page loading finished: $url (forced fresh reload)")
        
        // Inject API keys into JavaScript
        if (apiKeys.isNotEmpty() && view != null) {
            val keysJson = apiKeys.entries.joinToString(",") { (key, value) ->
                "\"$key\": \"${value.replace("\"", "\\\"")}\""
            }
            
            val jsCode = """
                (function() {
                    if (!window.CKGenericApp) {
                        window.CKGenericApp = {};
                    }
                    window.CKGenericApp.apiKeys = { $keysJson };
                    window.CKGenericApp.getApiKey = function(keyName) {
                        return window.CKGenericApp.apiKeys[keyName] || null;
                    };
                    console.log('CKGenericApp: API keys injected (' + Object.keys(window.CKGenericApp.apiKeys).length + ' keys)');
                    console.log('CKGenericApp: About to dispatch event...');
                    
                    // Dispatch custom event to notify page that API keys are available
                    try {
                        const event = new CustomEvent('ckgenericapp_keys_ready', { 
                            detail: { keys: Object.keys(window.CKGenericApp.apiKeys) } 
                        });
                        window.dispatchEvent(event);
                        console.log('CKGenericApp: Event dispatched successfully');
                    } catch (e) {
                        console.error('CKGenericApp: Error dispatching event:', e);
                    }
                })();
            """.trimIndent()
            
            view.evaluateJavascript(jsCode) { result ->
                Timber.d("API keys injected into WebView for ${app.name}: ${apiKeys.keys}")
            }
        }
    }
    
    override fun onReceivedError(
        view: WebView?,
        request: android.webkit.WebResourceRequest?,
        error: android.webkit.WebResourceError?
    ) {
        super.onReceivedError(view, request, error)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            Timber.e("WebView error: ${error?.description}")
        }
    }
}

private fun isGoogleOAuthUrl(url: String): Boolean {
    return url.contains("accounts.google.com/o/oauth2", ignoreCase = true) ||
        url.contains("accounts.google.com/signin/oauth", ignoreCase = true) ||
        url.contains("oauth2.googleapis.com", ignoreCase = true)
}

private fun launchInCustomTab(context: android.content.Context, url: String) {
    try {
        // Create intent to return to this activity after OAuth
        val returnIntent = Intent(context, context.javaClass).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            returnIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val customTabsIntent = CustomTabsIntent.Builder()
            .setStartAnimations(context, android.R.anim.fade_in, android.R.anim.fade_out)
            .setExitAnimations(context, android.R.anim.fade_in, android.R.anim.fade_out)
            .build()
        
        customTabsIntent.intent.putExtra(Intent.EXTRA_REFERRER, 
            android.net.Uri.parse("android-app://${context.packageName}"))
        
        customTabsIntent.launchUrl(context, android.net.Uri.parse(url))
        Timber.d("Custom Tab launched for OAuth with return intent")
    } catch (e: Exception) {
        Timber.e(e, "Failed to open Custom Tab for OAuth, falling back to browser")
        try {
            val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (ex: Exception) {
            Timber.e(ex, "Failed to open browser for OAuth")
        }
    }
}
