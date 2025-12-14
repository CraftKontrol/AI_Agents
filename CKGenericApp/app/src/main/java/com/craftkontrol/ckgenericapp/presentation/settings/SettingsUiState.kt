package com.craftkontrol.ckgenericapp.presentation.settings

data class SettingsUiState(
    val monitoringEnabled: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val fullscreenMode: Boolean = false,
    val darkMode: Boolean = false
)
