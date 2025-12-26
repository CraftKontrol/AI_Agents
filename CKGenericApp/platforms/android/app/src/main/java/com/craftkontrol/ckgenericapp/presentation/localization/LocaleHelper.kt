package com.craftkontrol.ckgenericapp.presentation.localization

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.content.res.Resources
import android.os.Build
import android.os.LocaleList
import timber.log.Timber
import java.util.Locale

object LocaleHelper {
    
    /**
     * Définit la locale de l'application et recrée l'activité
     */
    fun setAppLocale(context: Context, language: AppLanguage) {
        Timber.d("LocaleHelper.setAppLocale - START: ${language.code}")
        
        val locale = when (language) {
            AppLanguage.FRENCH -> Locale("fr")
            AppLanguage.ITALIAN -> Locale("it")
            AppLanguage.ENGLISH -> Locale("en")
        }
        
        Timber.d("Setting default locale to: ${locale.language}")
        Locale.setDefault(locale)
        
        // Update configuration
        val resources = context.resources
        val configuration = Configuration(resources.configuration)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLocale(locale)
            val localeList = LocaleList(locale)
            LocaleList.setDefault(localeList)
            configuration.setLocales(localeList)
        } else {
            @Suppress("DEPRECATION")
            configuration.locale = locale
        }
        
        @Suppress("DEPRECATION")
        resources.updateConfiguration(configuration, resources.displayMetrics)
        
        Timber.d("Configuration updated, searching for activity to recreate...")
        // Recreate activity if available
        val activity = getActivity(context)
        if (activity != null) {
            Timber.d("Activity found: ${activity.javaClass.simpleName}, calling recreate()")
            activity.recreate()
        } else {
            Timber.w("No activity found in context chain - cannot recreate!")
        }
        
        Timber.d("LocaleHelper.setAppLocale - COMPLETE")
    }
    
    /**
     * Applique la locale sans recréer l'activité (pour l'initialisation)
     */
    fun applyLocale(context: Context, language: AppLanguage) {
        val locale = when (language) {
            AppLanguage.FRENCH -> Locale("fr")
            AppLanguage.ITALIAN -> Locale("it")
            AppLanguage.ENGLISH -> Locale("en")
        }
        
        Locale.setDefault(locale)
        
        val resources = context.resources
        val configuration = Configuration(resources.configuration)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLocale(locale)
            val localeList = LocaleList(locale)
            LocaleList.setDefault(localeList)
            configuration.setLocales(localeList)
        } else {
            @Suppress("DEPRECATION")
            configuration.locale = locale
        }
        
        @Suppress("DEPRECATION")
        resources.updateConfiguration(configuration, resources.displayMetrics)
    }
    
    /**
     * Obtient l'activité depuis le contexte
     */
    private fun getActivity(context: Context): Activity? {
        return when (context) {
            is Activity -> context
            is ContextWrapper -> getActivity(context.baseContext)
            else -> null
        }
    }
}
