package com.vega.shared.repositories

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.tencent.mmkv.MMKV
import com.vega.shared.models.MediaCategory
import com.vega.shared.models.MediaInfo

/**
 * Implementation of CacheManager using MMKV for storage
 */
class MmkvCacheManager(private val mmkv: MMKV) : CacheManager {
    private val gson = Gson()
    
    override fun getHomePageData(provider: String): List<MediaCategory>? {
        val json = mmkv.getString(HOME_DATA_PREFIX + provider, null) ?: return null
        val type = object : TypeToken<List<MediaCategory>>() {}.type
        return gson.fromJson(json, type)
    }
    
    override fun saveHomePageData(provider: String, data: List<MediaCategory>) {
        val json = gson.toJson(data)
        mmkv.putString(HOME_DATA_PREFIX + provider, json)
    }
    
    override fun getMediaInfo(link: String): MediaInfo? {
        val json = mmkv.getString(MEDIA_INFO_PREFIX + link, null) ?: return null
        return gson.fromJson(json, MediaInfo::class.java)
    }
    
    override fun saveMediaInfo(link: String, info: MediaInfo) {
        val json = gson.toJson(info)
        mmkv.putString(MEDIA_INFO_PREFIX + link, json)
    }
    
    override fun clearCache() {
        mmkv.clearAll()
    }
    
    companion object {
        private const val HOME_DATA_PREFIX = "home_data_"
        private const val MEDIA_INFO_PREFIX = "media_info_"
    }
} 