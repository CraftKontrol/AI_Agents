package com.craftkontrol.ckgenericapp.presentation.main

import com.craftkontrol.ckgenericapp.domain.model.WebApp

data class MainUiState(
    val isLoading: Boolean = true,
    val apps: List<WebApp> = emptyList(),
    val currentApp: WebApp? = null,
    val isMenuCollapsed: Boolean = false,
    val canGoBack: Boolean = false,
    val canGoForward: Boolean = false,
    val error: String? = null,
    val permissionsNeeded: List<String> = emptyList(),
    val shortcutCreationRequested: String? = null,
    val welcomeCardHidden: Boolean = false
)
