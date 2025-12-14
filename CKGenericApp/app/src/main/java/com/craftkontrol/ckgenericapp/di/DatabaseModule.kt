package com.craftkontrol.ckgenericapp.di

import android.content.Context
import androidx.room.Room
import com.craftkontrol.ckgenericapp.data.local.dao.WebAppDao
import com.craftkontrol.ckgenericapp.data.local.database.AppDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "ck_generic_app_database"
        ).build()
    }
    
    @Provides
    fun provideWebAppDao(database: AppDatabase): WebAppDao {
        return database.webAppDao()
    }
}
