package com.craftkontrol.ckgenericapp.presentation.shortcut

import android.app.ActivityManager
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.craftkontrol.ckgenericapp.R
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.presentation.theme.CKGenericAppTheme
import com.craftkontrol.ckgenericapp.service.SensorMonitoringService
import com.craftkontrol.ckgenericapp.util.ShortcutHelper
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
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the app ID from the intent
        currentAppId = intent?.getStringExtra(EXTRA_APP_ID)
        
        Timber.d("ShortcutActivity onCreate with appId: $currentAppId")
        
        // Set task description to differentiate tasks in recents
        currentAppId?.let { appId ->
            try {
                setTaskDescription(ActivityManager.TaskDescription(appId))
            } catch (e: Exception) {
                Timber.e(e, "Failed to set task description")
            }
        }
        
        renderContent()

        sensorMonitoringService.startSensors()
        startSensorEventDispatcher()
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        
        // Check if same app or different
        val newAppId = intent.getStringExtra(EXTRA_APP_ID)
        Timber.d("ShortcutActivity onNewIntent with appId: $newAppId (current: $currentAppId)")

        // With standard launch mode, each app gets its own instance
        // This should only be called if explicitly routing to an existing instance
        if (newAppId != null && newAppId != currentAppId) {
            currentAppId = newAppId
            renderContent() // Re-render with new app
        } else {
            Timber.d("Same app reopened - keeping existing WebView state")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        sensorMonitoringService.stopSensors()
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
                val loadedApp = app!!

                LaunchedEffect(loadedApp.id) {
                    try {
                        val iconBitmap = ShortcutHelper.getAppIconBitmap(activity, loadedApp)
                        activity.setTaskDescription(
                            ActivityManager.TaskDescription(loadedApp.name, iconBitmap)
                        )
                    } catch (e: Exception) {
                        Timber.w(e, "Failed to set task description for ${loadedApp.id}")
                    }
                }

                StandaloneWebView(
                    app = loadedApp,
                    apiKeys = apiKeys,
                    activity = activity,
                    permissionLauncher = permissionLauncher,
                    onWebViewCreated = { webView -> 
                        activity.currentWebView = webView
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
        val uri = request.url
        val context = view?.context ?: return false
        
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

        // Open HTTP/HTTPS links in external browser if they're to a different domain
        if (url.startsWith("http://") || url.startsWith("https://")) {
            val currentUrl = view?.url
            val appBaseUrl = app.url
            val currentDomain = currentUrl?.let { android.net.Uri.parse(it).host }
            val appDomain = android.net.Uri.parse(appBaseUrl).host
            val targetDomain = uri?.host
            
            // If navigating to a different domain than the app's base domain, open in external browser
            if (targetDomain != null && appDomain != null && targetDomain != appDomain) {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    Timber.d("Opening external link in browser: $url (app domain: $appDomain, target: $targetDomain)")
                    return true
                } catch (e: Exception) {
                    Timber.e(e, "Failed to open external link: $url")
                    return false
                }
            }
        }
        
        // Allow same-domain navigation within WebView
        return false
    }
    
    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
        super.onPageStarted(view, url, favicon)
        Timber.d("Page loading started: $url")
    }
    
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        Timber.d("Page loading finished: $url (forced fresh reload)")
        
        // Inject API keys into JavaScript (also when empty for diagnostics)
        if (view != null) {
            val sanitizedApiKeys = apiKeys.filterKeys { key ->
                key != "ckserver_token_sync" && key != "ckserver_token_log"
            }

            val keysJson = sanitizedApiKeys.entries.joinToString(",") { (key, value) ->
                "\"$key\": \"${value.replace("\"", "\\\"")}\""
            }

            Timber.i("Injecting API keys into ${app.name}: count=${sanitizedApiKeys.size}, tavily=${sanitizedApiKeys["tavily"]?.length ?: 0} chars")

            val jsCode = """
                (function() {
                    if (!window.CKGenericApp) {
                        window.CKGenericApp = {};
                    }
                    window.CKGenericApp.apiKeys = { $keysJson };
                    window.CKGenericApp.getApiKey = function(keyName) {
                        return window.CKGenericApp.apiKeys[keyName] || null;
                    };
                    const ckServer = {
                        baseUrl: window.CKGenericApp.apiKeys['ckserver_base'] || '',
                        userId: window.CKGenericApp.apiKeys['ckserver_user'] || ''
                    };
                    window.CKGenericApp.ckServer = ckServer;

                    const nativeCKAndroid = window.CKAndroid;
                    const mergedCKAndroid = (nativeCKAndroid && typeof nativeCKAndroid === 'object')
                        ? nativeCKAndroid
                        : {};

                    mergedCKAndroid.apiKeys = window.CKGenericApp.apiKeys;
                    mergedCKAndroid.getApiKey = function(keyName) {
                        return window.CKGenericApp.apiKeys[keyName] || null;
                    };
                    mergedCKAndroid.ckServer = ckServer;

                    // Preserve the original injected object to keep @JavascriptInterface methods callable
                    window.CKAndroid = mergedCKAndroid;

                    if (!window.CKDesktop) {
                        window.CKDesktop = {};
                    }
                    window.CKDesktop.apiKeys = window.CKGenericApp.apiKeys;
                    window.CKDesktop.getApiKey = window.CKGenericApp.getApiKey;
                    window.CKDesktop.ckServer = ckServer;
                    console.error('CKGenericApp: API keys injected (' + Object.keys(window.CKGenericApp.apiKeys).length + ' keys)');
                    console.error('CKGenericApp: Tavily key present:', !!window.CKGenericApp.apiKeys['tavily']);
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

