import {MmmkvCache} from '../Mmkv';

// 12 hours
const expireTime = 43200000;

export const getBaseUrl = async (providerValue: string) => {
  try {
    let baseUrl = '';
    if (
      MmmkvCache.getString('CacheBaseUrl' + providerValue) &&
      MmmkvCache.getInt('baseUrlTime' + providerValue) &&
      Date.now() - MmmkvCache.getInt('baseUrlTime' + providerValue) < expireTime
    ) {
      baseUrl = MmmkvCache.getString('CacheBaseUrl' + providerValue);
    } else {
      const baseUrlRes = await fetch(
        'https://himanshu8443.github.io/providers/modflix.json',
      );
      const baseUrlData = await baseUrlRes.json();
      baseUrl = baseUrlData[providerValue].url;
      MmmkvCache.setString('CacheBaseUrl' + providerValue, baseUrl);
      MmmkvCache.setInt('baseUrlTime' + providerValue, Date.now());
    }
    return baseUrl;
  } catch (error) {
    console.error(`Error fetching baseUrl: ${providerValue}`, error);
  }
};
