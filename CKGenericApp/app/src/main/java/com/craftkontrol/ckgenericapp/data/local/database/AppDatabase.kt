package com.craftkontrol.ckgenericapp.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.craftkontrol.ckgenericapp.data.local.dao.WebAppDao
import com.craftkontrol.ckgenericapp.data.local.entity.WebAppEntity

@Database(
    entities = [WebAppEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun webAppDao(): WebAppDao
}
