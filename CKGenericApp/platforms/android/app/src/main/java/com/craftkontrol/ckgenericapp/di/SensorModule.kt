package com.craftkontrol.ckgenericapp.di

import android.content.Context
import com.craftkontrol.ckgenericapp.service.SensorMonitoringService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SensorModule {
    
    @Provides
    @Singleton
    fun provideSensorMonitoringService(
        @ApplicationContext context: Context
    ): SensorMonitoringService {
        return SensorMonitoringService(context)
    }
}
