import axios from 'axios';
import {headers} from './header';

export const modGetBaseurl = async (providerValue: string): Promise<string> => {
  try {
    const res = await axios('https://modflix.xyz/?type=hollywood', {headers});
    const data = res.data;
    const url = data.match(
      /<meta\s+http-equiv="refresh"\s+content="[^"]*?;\s*url=([^"]+)"\s*\/?>/i,
    )[1];
    return url;
  } catch (err) {
    console.error(err);
    return 'https://modflix.xyz/';
  }
};
