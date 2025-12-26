package com.craftkontrol.ckgenericapp.di

import com.craftkontrol.ckgenericapp.data.repository.WebAppRepositoryImpl
import com.craftkontrol.ckgenericapp.domain.repository.WebAppRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    
    @Binds
    @Singleton
    abstract fun bindWebAppRepository(
        webAppRepositoryImpl: WebAppRepositoryImpl
    ): WebAppRepository
}
