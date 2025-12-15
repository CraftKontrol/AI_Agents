package com.craftkontrol.ckgenericapp.di

import android.content.Context
import com.craftkontrol.ckgenericapp.data.local.preferences.PreferencesManager
import com.craftkontrol.ckgenericapp.presentation.localization.LocalizationManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object LocalizationModule {
    
    @Provides
    @Singleton
    fun provideLocalizationManager(
        @ApplicationContext context: Context,
        preferencesManager: PreferencesManager
    ): LocalizationManager {
        return LocalizationManager(context, preferencesManager)
    }
}
