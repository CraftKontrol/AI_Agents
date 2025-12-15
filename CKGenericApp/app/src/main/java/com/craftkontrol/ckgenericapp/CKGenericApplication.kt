package com.craftkontrol.ckgenericapp

import android.app.Application
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.presentation.localization.LocaleHelper
import com.craftkontrol.ckgenericapp.presentation.localization.LocalizationManager
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltAndroidApp
class CKGenericApplication : Application() {
    
    @Inject
    lateinit var localizationManager: LocalizationManager
    
    @Inject
    lateinit var preferencesManager: PreferencesManager
    
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Timber for logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        
        Timber.d("CKGenericApplication created")
        
        // Initialize app locale
        initializeLocale()
    }
    
    private fun initializeLocale() {
        applicationScope.launch(Dispatchers.Default) {
            try {
                // Get the first saved language value
                val language = localizationManager.getCurrentLanguageFlow().first()
                LocaleHelper.applyLocale(this@CKGenericApplication, language)
                Timber.d("App locale initialized: ${language.code}")
            } catch (e: Exception) {
                Timber.e(e, "Error initializing locale")
                // Fallback to system locale detection
                val fallbackLanguage = localizationManager.detectSystemLanguage()
                LocaleHelper.applyLocale(this@CKGenericApplication, fallbackLanguage)
            }
        }
    }
}
