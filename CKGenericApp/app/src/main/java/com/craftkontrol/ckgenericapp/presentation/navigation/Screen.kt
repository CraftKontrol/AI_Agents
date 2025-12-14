package com.craftkontrol.ckgenericapp.presentation.navigation

sealed class Screen(val route: String) {
    object Main : Screen("main")
    object Settings : Screen("settings")
}
