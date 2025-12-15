package com.craftkontrol.ckgenericapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.os.LocaleList
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.presentation.localization.AppLanguage
import com.craftkontrol.ckgenericapp.presentation.navigation.AppNavGraph
import com.craftkontrol.ckgenericapp.presentation.theme.CKGenericAppTheme
import com.craftkontrol.ckgenericapp.service.MonitoringService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import timber.log.Timber
import java.util.Locale
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var preferencesManager: PreferencesManager
    
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        permissions.entries.forEach {
            Timber.d("Permission ${it.key} granted: ${it.value}")
        }
        
        // Start monitoring service if notification permission granted
        if (permissions[Manifest.permission.POST_NOTIFICATIONS] == true ||
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            startMonitoringService()
        }
    }
    
    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(updateBaseContextLocale(newBase))
    }
    
    private fun updateBaseContextLocale(context: Context): Context {
        // Get saved language from preferences
        val languageCode = runBlocking {
            try {
                val prefsManager = (context.applicationContext as CKGenericApplication).preferencesManager
                prefsManager.currentLanguage.first()
            } catch (e: Exception) {
                Timber.e(e, "Error getting saved language, using system default")
                null
            }
        }
        
        val language = if (languageCode != null) {
            AppLanguage.fromCode(languageCode) ?: AppLanguage.ENGLISH
        } else {
            // Detect system language
            val systemLocale = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                context.resources.configuration.locales[0]
            } else {
                @Suppress("DEPRECATION")
                context.resources.configuration.locale
            }
            when (systemLocale.language) {
                "fr" -> AppLanguage.FRENCH
                "it" -> AppLanguage.ITALIAN
                else -> AppLanguage.ENGLISH
            }
        }
        
        val locale = when (language) {
            AppLanguage.FRENCH -> Locale("fr")
            AppLanguage.ITALIAN -> Locale("it")
            AppLanguage.ENGLISH -> Locale("en")
        }
        
        Timber.d("MainActivity attachBaseContext: Applying locale ${locale.language}")
        Locale.setDefault(locale)
        
        val configuration = Configuration(context.resources.configuration)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLocale(locale)
            val localeList = LocaleList(locale)
            LocaleList.setDefault(localeList)
            configuration.setLocales(localeList)
            return context.createConfigurationContext(configuration)
        } else {
            @Suppress("DEPRECATION")
            configuration.locale = locale
            @Suppress("DEPRECATION")
            context.resources.updateConfiguration(configuration, context.resources.displayMetrics)
            return context
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Timber.d("MainActivity created")
        
        // Request necessary permissions
        requestPermissions()
        
        setContent {
            CKGenericAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavGraph()
                }
            }
        }
    }
    
    private fun requestPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        
        // Camera
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }
        
        // Microphone
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
            != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
        }
        
        // Location
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        
        // Notifications (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        } else {
            startMonitoringService()
        }
    }
    
    private fun startMonitoringService() {
        MonitoringService.start(this)
    }
    
    override fun onBackPressed() {
        // Handle back button - let WebView handle it first
        super.onBackPressed()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Timber.d("MainActivity destroyed")
    }
}
