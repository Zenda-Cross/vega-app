import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from '../headers';

export const extraGetStream = async (
  url: string,
  type: string,
): Promise<Stream[]> => {
  try {
    console.log('extraGetStream', type, url);
    const res = await axios.get(url, {headers});
    const redirectUrl =
      res.data.match(
        /<META HTTP-EQUIV="refresh" content="0; url=([^"]+)">/i,
      )?.[1] || url;
    console.log('redirectUrl', redirectUrl);
    const res2 = await axios.get(redirectUrl, {headers});
    const data = res2.data;
    // console.log('data', data);
    const $ = cheerio.load(data);
    const streamLinks: Stream[] = [];
    const hubcloudLink = $('.fa-file-download').parent().attr('href');
    console.log('hubcloudLink', hubcloudLink);
    const hubcloudRes = await axios.get(hubcloudLink || '', {headers});
    const hubcloudData = hubcloudRes.data;
    const $$ = cheerio.load(hubcloudData);
    const linkClass = $$('.btn-success.btn-lg.h6,.btn-danger,.btn-secondary');
    for (const element of linkClass) {
      const itm = $(element);
      let link = itm.attr('href') || '';
      if (link?.includes('.dev')) {
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
      if (link?.includes('hubcloud')) {
        const newLinkRes = await axios.head(link, {headers});
        const newLink =
          newLinkRes.request?.responseURL?.split('link=')?.[1] || link;
        streamLinks.push({server: 'hubcloud', link: newLink, type: 'mkv'});
      }
      if (link?.includes('cloudflarestorage')) {
        streamLinks.push({server: 'CfStorage', link: link, type: 'mkv'});
      }
    }
    console.log('streamLinks', streamLinks);
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
