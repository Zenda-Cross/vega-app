import axios from 'axios';
import {MmmkvCache} from '../../Mmkv';
import {ToastAndroid} from 'react-native';

interface ApiResponse {
  success: boolean;
  cookie: string;
  expiresAt: string;
  remainingTime: string;
}

export async function nfGetCookie(): Promise<string> {
  try {
    const response = await axios.get<ApiResponse>(
      'https://netmirror.8man.me/api/cookie',
    );
    if (response.data?.cookie) {
      return response.data.cookie?.replace('Asu', 'Ani');
    }
    throw new Error('Cookie not found in API response');
  } catch (error) {
    console.error('Failed to fetch cookie:', error);
    ToastAndroid.show('Failed to fetch cookie', ToastAndroid.SHORT);
    return '';
  }
}
