package com.craftkontrol.ckgenericapp.domain.repository

import com.craftkontrol.ckgenericapp.domain.model.WebApp
import kotlinx.coroutines.flow.Flow

interface WebAppRepository {
    fun getAllEnabledApps(): Flow<List<WebApp>>
    fun getAllApps(): Flow<List<WebApp>>
    suspend fun getAppById(id: String): WebApp?
    suspend fun getLastVisitedApp(): WebApp?
    suspend fun insertApp(app: WebApp)
    suspend fun insertApps(apps: List<WebApp>)
    suspend fun updateApp(app: WebApp)
    suspend fun deleteApp(app: WebApp)
    suspend fun updateLastVisited(appId: String, timestamp: Long)
    suspend fun setAppEnabled(appId: String, enabled: Boolean)
    suspend fun initializeDefaultApps()
}
