import {cacheStorageService} from '../storage';

// 1 hour
const expireTime = 60 * 60 * 1000;

export const getBaseUrl = async (providerValue: string) => {
  try {
    let baseUrl = '';
    const cacheKey = 'CacheBaseUrl' + providerValue;
    const timeKey = 'baseUrlTime' + providerValue;

    const cachedUrl = cacheStorageService.getString(cacheKey);
    const cachedTime = cacheStorageService.getObject<number>(timeKey);

    if (cachedUrl && cachedTime && Date.now() - cachedTime < expireTime) {
      baseUrl = cachedUrl;
    } else {
      const baseUrlRes = await fetch(
        'https://himanshu8443.github.io/providers/modflix.json',
      );
      const baseUrlData = await baseUrlRes.json();
      baseUrl = baseUrlData[providerValue].url;
      cacheStorageService.setString(cacheKey, baseUrl);
      cacheStorageService.setObject(timeKey, Date.now());
    }
    return baseUrl;
  } catch (error) {
    console.error(`Error fetching baseUrl: ${providerValue}`, error);
    return '';
  }
};
