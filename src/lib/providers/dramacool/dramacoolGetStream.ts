import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from '../headers';
import {getQualityLinks} from '../../m3u8Parcer';
import {superVideoExtractor} from '../superVideoExtractor';

export const dramacoolGetStream = async (
  url: string,
  type: string,
  signal: AbortSignal,
): Promise<Stream[]> => {
  try {
    console.log('dramacool', url);
    // const baseUrl = url.split('/').slice(0, 3).join('/');
    const res = await fetch(url, {signal});
    const html = await res.text();
    const $ = cheerio.load(html);
    const stream: Stream[] = [];
    const iframeUrl1 = $('iframe').attr('src') || '';
    console.log('iframeUrl1', 'https:' + iframeUrl1);
    const iframeUr2 = !iframeUrl1?.startsWith('https')
      ? `https:${iframeUrl1}`
      : iframeUrl1;

    const iframe1Res = await fetch(iframeUr2, {signal});
    const iframe1Html = await iframe1Res.text();
    const $1 = cheerio.load(iframe1Html);

    try {
      const vidhideUrl =
        $1('.linkserver[data-provider="vidhide"]').attr('data-video') || '';
      console.log('iframeUrl2', vidhideUrl);

      const vidhideRes = await axios.get(vidhideUrl, {headers, signal});
      const iframeUrl2Html = vidhideRes.data;
      const links = await superVideoExtractor(iframeUrl2Html);
      console.log('links', links?.replace(/&i=\d+,'\.4&/, '&i=0.4&'));
      const qualityLinks = await getQualityLinks(
        links?.replace(/&i=\d+,'\.4&/, '&i=0.4&'),
      );
      qualityLinks.forEach(qualityLink => {
        stream.push({
          link: qualityLink.url,
          type: 'm3u8',
          server: 'VidHide ' + qualityLink.quality,
        });
      });
    } catch (err) {
      console.log('vidhide error', err);
    }
    try {
      const streamwishUrl =
        $1('.linkserver[data-provider="streamwish"]').attr('data-video') || '';
      console.log('streamwishUrl', streamwishUrl);
      const streamwishRes = await axios.get(streamwishUrl, {headers, signal});
      const streamwishHtml = streamwishRes.data;
      const streamwishLinks = await superVideoExtractor(streamwishHtml);
      console.log(
        'streamwishLinks',
        streamwishLinks?.replace(/&i=\d+,'\.4&/, '&i=0.4&'),
      );
      const streamwishQualityLinks = await getQualityLinks(
        streamwishLinks?.replace(/&i=\d+,'\.4&/, '&i=0.4&'),
      );
      streamwishQualityLinks.forEach(qualityLink => {
        stream.push({
          link: qualityLink.url,
          type: 'm3u8',
          server: 'StreamWish ' + qualityLink.quality,
        });
      });
    } catch (err) {
      console.log('streamwish error', err);
    }
    console.log('stream', stream);
    return stream;
  } catch (err: any) {
    console.error('AED get stream error', err);
    return [];
  }
};
