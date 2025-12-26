package com.craftkontrol.ckgenericapp.presentation.settings

import com.craftkontrol.ckgenericapp.presentation.localization.AppLanguage

data class SettingsUiState(
    val monitoringEnabled: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val fullscreenMode: Boolean = false,
    val darkMode: Boolean = false,
    val currentLanguage: AppLanguage = AppLanguage.ENGLISH,
    val availableLanguages: List<AppLanguage> = AppLanguage.values().toList()
)
