package com.craftkontrol.ckgenericapp.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.craftkontrol.ckgenericapp.data.local.entity.WebAppEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface WebAppDao {
    
    @Query("SELECT * FROM web_apps WHERE isEnabled = 1 ORDER BY `order` ASC")
    fun getAllEnabledApps(): Flow<List<WebAppEntity>>
    
    @Query("SELECT * FROM web_apps ORDER BY `order` ASC")
    fun getAllApps(): Flow<List<WebAppEntity>>
    
    @Query("SELECT * FROM web_apps WHERE id = :id")
    suspend fun getAppById(id: String): WebAppEntity?
    
    @Query("SELECT * FROM web_apps WHERE isEnabled = 1 ORDER BY lastVisited DESC LIMIT 1")
    suspend fun getLastVisitedApp(): WebAppEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApp(app: WebAppEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApps(apps: List<WebAppEntity>)
    
    @Update
    suspend fun updateApp(app: WebAppEntity)
    
    @Delete
    suspend fun deleteApp(app: WebAppEntity)
    
    @Query("UPDATE web_apps SET lastVisited = :timestamp WHERE id = :appId")
    suspend fun updateLastVisited(appId: String, timestamp: Long)
    
    @Query("UPDATE web_apps SET isEnabled = :enabled WHERE id = :appId")
    suspend fun setAppEnabled(appId: String, enabled: Boolean)
}
