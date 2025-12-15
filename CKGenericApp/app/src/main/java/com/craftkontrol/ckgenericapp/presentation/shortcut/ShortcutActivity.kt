package com.craftkontrol.ckgenericapp.presentation.shortcut

import com.craftkontrol.ckgenericapp.R
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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.presentation.main.MainViewModel
import com.craftkontrol.ckgenericapp.presentation.theme.CKGenericAppTheme
import dagger.hilt.android.AndroidEntryPoint
import timber.log.Timber

/**
 * Activity launched from home screen shortcuts
 * Opens directly to a specific web app
 * Each app type has its own instance (singleTask per app)
 */
@AndroidEntryPoint
class ShortcutActivity : ComponentActivity() {
    
    private var currentAppId: String? = null
    var pendingWebViewPermissionRequest: android.webkit.PermissionRequest? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the app ID from the intent
        currentAppId = intent?.getStringExtra(EXTRA_APP_ID)
        
        Timber.d("ShortcutActivity onCreate with appId: $currentAppId")
        
        renderContent()
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        
        // Check if same app or different
        val newAppId = intent.getStringExtra(EXTRA_APP_ID)
        Timber.d("ShortcutActivity onNewIntent with appId: $newAppId (current: $currentAppId)")
        
        // Standard launch mode allows multiple instances, onNewIntent shouldn't be called
        // unless explicitly using singleTop or similar
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
    var webView: WebView? by remember { mutableStateOf(null) }
    
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
                    onWebViewCreated = { webView = it }
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
            WebView(ctx).apply {
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
                    }
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
                
                onWebViewCreated(this)
                loadUrl(app.url)
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
