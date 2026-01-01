pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "CKGenericApp"

include(":app")
include(":core")
include(":app_ai_search")
include(":app_memory_board")
include(":app_meteo")
include(":app_news")
include(":app_astral_compute")
include(":app_local_food")
