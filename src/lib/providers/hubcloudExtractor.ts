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
    const baseUrl = link.split('/').slice(0, 3).join('/');
    const streamLinks: Stream[] = [];
    const vLinkRes = await axios(`${link}`, {headers, signal});
    const vLinkText = vLinkRes.data;
    const $vLink = cheerio.load(vLinkText);
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [];
    let vcloudLink =
      decode(vLinkRedirect[1]?.split('r=')?.[1]) ||
      vLinkRedirect[1] ||
      $vLink('.fa-file-download.fa-lg').parent().attr('href') ||
      link;
    console.log('vcloudLink', vcloudLink);
    if (vcloudLink?.startsWith('/')) {
      vcloudLink = `${baseUrl}${vcloudLink}`;
      console.log('New vcloudLink', vcloudLink);
    }
    const vcloudRes = await fetch(vcloudLink, {
      headers,
      signal,
      redirect: 'follow',
    });
    const $ = cheerio.load(await vcloudRes.text());
    // console.log('vcloudRes', $.text());

    const linkClass = $('.btn-success.btn-lg.h6,.btn-danger,.btn-secondary');
    for (const element of linkClass) {
      const itm = $(element);
      let link = itm.attr('href') || '';
      if (link?.includes('.dev') && !link?.includes('/?id=')) {
        streamLinks.push({server: 'Cf Worker', link: link, type: 'mkv'});
      }
      if (link?.includes('pixeld')) {
        if (!link?.includes('api')) {
          const token = link.split('/').pop();
          const baseUrl = link.split('/').slice(0, -2).join('/');
          link = `${baseUrl}/api/file/${token}?download`;
        }
        streamLinks.push({server: 'Pixeldrain', link: link, type: 'mkv'});
      }
      if (link?.includes('hubcloud') || link?.includes('/?id=')) {
        try {
          const newLinkRes = await axios.head(link, {headers, signal});
          const newLink =
            newLinkRes.request?.responseURL?.split('link=')?.[1] || link;
          streamLinks.push({server: 'hubcloud', link: newLink, type: 'mkv'});
        } catch (error) {
          console.log('hubcloudExtracter error in hubcloud link: ', error);
        }
      }
      if (link?.includes('cloudflarestorage')) {
        streamLinks.push({server: 'CfStorage', link: link, type: 'mkv'});
      }
      if (link?.includes('fastdl')) {
        streamLinks.push({server: 'FastDl', link: link, type: 'mkv'});
      }
      if (link.includes('hubcdn')) {
        streamLinks.push({
          server: 'HubCdn',
          link: link,
          type: 'mkv',
        });
      }
    }
    console.log('streamLinks', streamLinks);
    return streamLinks;
  } catch (error) {
    console.log('hubcloudExtracter error: ', error);
    return [];
  }
}
