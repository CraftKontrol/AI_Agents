package com.craftkontrol.ckgenericapp.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.craftkontrol.ckgenericapp.presentation.devicetest.DeviceTestScreen
import com.craftkontrol.ckgenericapp.presentation.main.MainScreen
import com.craftkontrol.ckgenericapp.presentation.settings.SettingsScreen

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Main.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Main.route) {
            MainScreen(
                onNavigateToDeviceTest = {
                    navController.navigate(Screen.DeviceTest.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }
        
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.DeviceTest.route) {
            DeviceTestScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
