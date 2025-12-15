package com.craftkontrol.ckgenericapp.presentation.localization

import android.content.Context
import android.os.Build
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import timber.log.Timber
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

enum class AppLanguage(val code: String, val displayName: String) {
    FRENCH("fr", "Français"),
    ENGLISH("en", "English"),
    ITALIAN("it", "Italiano");

    companion object {
        fun fromCode(code: String?): AppLanguage {
            return values().find { it.code == code } ?: ENGLISH
        }
    }
}

@Singleton
class LocalizationManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val preferencesManager: com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
) {

    /**
     * Détecte automatiquement la langue du système
     */
    fun detectSystemLanguage(): AppLanguage {
        val systemLanguage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            context.resources.configuration.locales[0]
        } else {
            @Suppress("DEPRECATION")
            context.resources.configuration.locale
        }

        return when (systemLanguage.language) {
            "fr" -> AppLanguage.FRENCH
            "it" -> AppLanguage.ITALIAN
            else -> AppLanguage.ENGLISH
        }
    }

    /**
     * Obtient la langue sauvegardée, ou détecte la langue du système si aucune n'est sauvegardée
     */
    fun getCurrentLanguageFlow(): Flow<AppLanguage> {
        return preferencesManager.currentLanguage.map { savedLanguageCode ->
            if (savedLanguageCode.isNullOrEmpty()) {
                detectSystemLanguage()
            } else {
                AppLanguage.fromCode(savedLanguageCode)
            }
        }
    }

    /**
     * Change la langue de l'application
     */
    suspend fun setLanguage(language: AppLanguage) {
        Timber.d("LocalizationManager.setLanguage - START: ${language.code}")
        try {
            // Apply locale change immediately
            Timber.d("Applying locale via LocaleHelper...")
            LocaleHelper.setAppLocale(context, language)
            Timber.d("Locale applied, now saving to preferences...")
            // Save preference
            preferencesManager.setCurrentLanguage(language.code)
            Timber.d("LocalizationManager.setLanguage - COMPLETE: ${language.code}")
        } catch (e: Exception) {
            Timber.e(e, "Error in setLanguage")
            throw e
        }
    }

    /**
     * Obtient toutes les langues disponibles
     */
    fun getAvailableLanguages(): List<AppLanguage> {
        return AppLanguage.values().toList()
    }

    /**
     * Obtient le code de la langue courante de manière synchrone (pour initialisation)
     */
    fun getCurrentLanguageSync(): AppLanguage {
        return detectSystemLanguage()
    }
}
