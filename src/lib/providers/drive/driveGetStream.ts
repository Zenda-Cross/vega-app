import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from './header';
import {hubcloudExtracter} from '../hubcloudExtractor';

export const driveGetStream = async (
  url: string,
  type: string,
  signal: AbortSignal,
): Promise<Stream[]> => {
  try {
    if (type === 'movie') {
      const res = await axios.get(url, {headers});
      const html = res.data;
      const $ = cheerio.load(html);
      const link = $('a:contains("HubCloud")').attr('href');
      url = link || url;
    }
    console.log('driveGetStream', type, url);
    const res = await axios.get(url, {headers});
    const redirectUrl = res.data.match(
      /<meta\s+http-equiv="refresh"\s+content="[^"]*?;\s*url=([^"]+)"\s*\/?>/i,
    )[1];
    console.log('redirectUrl', redirectUrl);
    const res2 = await axios.get(redirectUrl, {headers});
    const data = res2.data;
    // console.log('data', data);
    const $ = cheerio.load(data);
    const hubcloudLink = $('.fa-file-download').parent().attr('href');
    console.log('hubcloudLink', hubcloudLink);

    return await hubcloudExtracter(hubcloudLink!, signal);
  } catch (err) {
    console.error(err);
    return [];
  }
};
