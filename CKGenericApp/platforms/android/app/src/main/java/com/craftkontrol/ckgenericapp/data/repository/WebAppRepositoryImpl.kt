package com.craftkontrol.ckgenericapp.data.repository

import com.craftkontrol.ckgenericapp.data.local.dao.WebAppDao
import com.craftkontrol.ckgenericapp.data.mapper.toDomain
import com.craftkontrol.ckgenericapp.data.mapper.toEntity
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.domain.repository.WebAppRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class WebAppRepositoryImpl @Inject constructor(
    private val webAppDao: WebAppDao
) : WebAppRepository {
    
    override fun getAllEnabledApps(): Flow<List<WebApp>> {
        return webAppDao.getAllEnabledApps().map { entities ->
            entities.map { it.toDomain() }
        }
    }
    
    override fun getAllApps(): Flow<List<WebApp>> {
        return webAppDao.getAllApps().map { entities ->
            entities.map { it.toDomain() }
        }
    }
    
    override suspend fun getAppById(id: String): WebApp? {
        return webAppDao.getAppById(id)?.toDomain()
    }
    
    override suspend fun getLastVisitedApp(): WebApp? {
        return webAppDao.getLastVisitedApp()?.toDomain()
    }
    
    override suspend fun insertApp(app: WebApp) {
        webAppDao.insertApp(app.toEntity())
    }
    
    override suspend fun insertApps(apps: List<WebApp>) {
        webAppDao.insertApps(apps.map { it.toEntity() })
    }
    
    override suspend fun updateApp(app: WebApp) {
        webAppDao.updateApp(app.toEntity())
    }
    
    override suspend fun deleteApp(app: WebApp) {
        webAppDao.deleteApp(app.toEntity())
    }
    
    override suspend fun updateLastVisited(appId: String, timestamp: Long) {
        webAppDao.updateLastVisited(appId, timestamp)
    }
    
    override suspend fun setAppEnabled(appId: String, enabled: Boolean) {
        webAppDao.setAppEnabled(appId, enabled)
    }
    
    override suspend fun initializeDefaultApps() {
        // Check if apps already exist
        val existingApps = webAppDao.getAllApps().first()
        
        if (existingApps.isEmpty()) {
            val defaultApps = listOf(
                WebApp(
                    id = "ai_search",
                    name = "AI Search Aggregator",
                    url = "https://craftkontrol.github.io/AI_Agents/AiSearchAgregator/",
                    description = "Search across multiple AI platforms",
                    order = 1,
                    icon = "ic_ai_search",
                    supportsNotifications = true
                ),
                WebApp(
                    id = "astral_compute",
                    name = "Astral Compute",
                    url = "https://craftkontrol.github.io/AI_Agents/AstralCompute/",
                    description = "Advanced computation tools",
                    order = 2,
                    icon = "ic_astral_compute",
                    supportsNotifications = true
                ),
                WebApp(
                    id = "local_food",
                    name = "Local Food Products",
                    url = "https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/",
                    description = "Find local food sources",
                    order = 3,
                    icon = "ic_local_food",
                    requiresLocation = true,
                    supportsNotifications = true
                ),
                WebApp(
                    id = "memory_board",
                    name = "Memory Board Helper",
                    url = "https://craftkontrol.github.io/AI_Agents/MemoryBoardHelper/",
                    description = "Task and memory management",
                    order = 4,
                    icon = "ic_memory_board",
                    supportsNotifications = true
                ),
                WebApp(
                    id = "meteo",
                    name = "Meteo Aggregator",
                    url = "https://craftkontrol.github.io/AI_Agents/MeteoAgregator/",
                    description = "Weather information aggregator",
                    order = 5,
                    icon = "ic_meteo",
                    requiresLocation = true,
                    supportsNotifications = true
                ),
                WebApp(
                    id = "news",
                    name = "News Aggregator",
                    url = "https://craftkontrol.github.io/AI_Agents/NewsAgregator/",
                    description = "Latest news from multiple sources",
                    order = 6,
                    icon = "ic_news",
                    supportsNotifications = true
                )
            )
            
            insertApps(defaultApps)
        }
    }
}
