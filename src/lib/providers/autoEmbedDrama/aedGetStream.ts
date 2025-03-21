import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from '../headers';
import {stableExtractor} from '../autoEmbed/stableExtractor';
import {getQualityLinks} from '../../m3u8Parcer';

export const aedGetStream = async (
  url: string,
  type: string,
  signal: AbortSignal,
): Promise<Stream[]> => {
  try {
    // console.log('aedGetStream', url);
    const baseUrl = url.split('/').slice(0, 3).join('/');
    const res = await axios.get(url, {headers, signal});
    const html = res.data;
    const $ = cheerio.load(html);
    const stream: Stream[] = [];
    const iframeUrl1 = $('iframe').attr('src') || '';
    console.log('iframeUrl1', baseUrl + iframeUrl1);
    const iframe1Res = await axios.get(baseUrl + iframeUrl1, {headers, signal});
    const iframe1Html = iframe1Res.data;
    const $1 = cheerio.load(iframe1Html);

    const iframeUrl2 = atob($1('button.btn.active').attr('data-server') || '');
    console.log('iframeUrl2', iframeUrl2);

    const links = await stableExtractor(iframeUrl2);
    const qualityLinks = await getQualityLinks(links[0].url);
    qualityLinks.forEach(qualityLink => {
      stream.push({
        link: qualityLink.url,
        type: 'm3u8',
        server: 'AE-' + qualityLink.quality,
      });
    });
    console.log('stream', stream);
    return stream;
  } catch (err) {
    console.error('AED get stream error', err);
    return [];
  }
};
