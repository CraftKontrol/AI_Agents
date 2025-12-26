package com.craftkontrol.ckgenericapp.presentation.localization

import android.content.Context
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import timber.log.Timber

/**
 * Wrapper composable that applies locale and provides language context to the app
 */
@Composable
fun LocalizedApp(
    localizationManager: LocalizationManager,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val currentLanguage = localizationManager.getCurrentLanguageFlow().collectAsState(
        initial = localizationManager.getCurrentLanguageSync()
    ).value
    
    // Apply locale when language changes
    LaunchedEffect(currentLanguage) {
        Timber.d("Applying locale: ${currentLanguage.code}")
        // Locale will be applied via Android's Configuration system
        // The change is reactive through stringResource() calls
    }
    
    Surface(
        modifier = modifier
    ) {
        content()
    }
}
