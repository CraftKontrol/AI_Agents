package com.craftkontrol.ckgenericapp.data.mapper

import com.craftkontrol.ckgenericapp.data.local.entity.WebAppEntity
import com.craftkontrol.ckgenericapp.domain.model.WebApp

fun WebAppEntity.toDomain(): WebApp {
    return WebApp(
        id = id,
        name = name,
        url = url,
        icon = icon,
        description = description,
        order = order,
        isEnabled = isEnabled,
        requiresLocation = requiresLocation,
        requiresCamera = requiresCamera,
        requiresMicrophone = requiresMicrophone,
        supportsNotifications = supportsNotifications,
        lastVisited = lastVisited
    )
}

fun WebApp.toEntity(): WebAppEntity {
    return WebAppEntity(
        id = id,
        name = name,
        url = url,
        icon = icon,
        description = description,
        order = order,
        isEnabled = isEnabled,
        requiresLocation = requiresLocation,
        requiresCamera = requiresCamera,
        requiresMicrophone = requiresMicrophone,
        supportsNotifications = supportsNotifications,
        lastVisited = lastVisited
    )
}
