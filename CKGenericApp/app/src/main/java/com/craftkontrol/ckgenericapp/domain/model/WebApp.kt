package com.craftkontrol.ckgenericapp.domain.model

data class WebApp(
    val id: String,
    val name: String,
    val url: String,
    val icon: String? = null,
    val description: String? = null,
    val order: Int = 0,
    val isEnabled: Boolean = true,
    val requiresLocation: Boolean = false,
    val requiresCamera: Boolean = false,
    val requiresMicrophone: Boolean = false,
    val supportsNotifications: Boolean = true,
    val lastVisited: Long = 0
)
