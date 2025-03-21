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
    // console.log('res', res);
    let redirectUrl = res.data.match(
      /<meta\s+http-equiv="refresh"\s+content="[^"]*?;\s*url=([^"]+)"\s*\/?>/i,
    )?.[1];
    if (url.includes('/archives/')) {
      redirectUrl = res.data.match(
        /<a\s+[^>]*href="(https:\/\/hubcloud\.[^\/]+\/[^"]+)"/i,
      )?.[1];
    }
    console.log('redirectUrl', redirectUrl);
    if (!redirectUrl) {
      return await hubcloudExtracter(url, signal);
    }
    const res2 = await axios.get(redirectUrl, {headers});
    const data = res2.data;
    // console.log('data', data);
    const $ = cheerio.load(data);
    const hubcloudLink = $('.fa-file-download').parent().attr('href');
    console.log('hubcloudLink', hubcloudLink);

    return await hubcloudExtracter(
      hubcloudLink?.includes('https://hubcloud') ? hubcloudLink : redirectUrl,
      signal,
    );
  } catch (err) {
    console.error('Movies Drive err', err);
    return [];
  }
};
