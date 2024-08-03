import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from './types';
import {headers} from './headers';

const decode = function (value: string) {
  if (value === undefined) {
    return '';
  }
  return atob(value.toString());
};

export async function hubcloudExtracter(link: string, signal: AbortSignal) {
  try {
    console.log('hubcloudExtracter', link);
    const streamLinks: Stream[] = [];
    const vLinkRes = await axios(`${link}`, {headers, signal});
    const vLinkText = vLinkRes.data;
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [];
    const vcloudLink =
      decode(vLinkRedirect[1]?.split('r=')?.[1]) || vLinkRedirect[1] || link;
    console.log('vcloudLink', vcloudLink);

    const vcloudRes = await fetch(vcloudLink, {
      headers,
      signal,
      redirect: 'follow',
    });
    const $ = cheerio.load(await vcloudRes.text());

    const linkClass = $('.btn-success.btn-lg.h6,.btn-danger,.btn-secondary');
    for (const element of linkClass) {
      const itm = $(element);
      let link = itm.attr('href') || '';
      if (link?.includes('.dev') && !link?.includes('/?id=')) {
        streamLinks.push({server: 'Cf Worker', link: link, type: 'mkv'});
      }
      if (link?.includes('pixel')) {
        if (!link?.includes('api')) {
          const token = link.split('/').pop();
          const baseUrl = link.split('/').slice(0, -2).join('/');
          link = `${baseUrl}/api/file/${token}?download`;
        }
        streamLinks.push({server: 'pixeldrain', link: link, type: 'mkv'});
      }
      if (link?.includes('hubcloud') || link?.includes('/?id=')) {
        const newLinkRes = await axios.head(link, {headers, signal});
        const newLink =
          newLinkRes.request?.responseURL?.split('link=')?.[1] || link;
        streamLinks.push({server: 'hubcloud', link: newLink, type: 'mkv'});
      }
      if (link?.includes('cloudflarestorage')) {
        streamLinks.push({server: 'CfStorage', link: link, type: 'mkv'});
      }
    }
    return streamLinks;
  } catch (error) {
    console.log('hubcloudExtracter error: ', error);
    return [];
  }
}
