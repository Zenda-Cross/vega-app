import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {ToastAndroid} from 'react-native';

export interface Stream {
  server: string;
  link: string;
}
export async function getStream(link: string, type: string) {
  try {
    console.log('dotlink', link);
    if (type === 'movie') {
      const dotlinkRes = await axios(
        `https://dev--silver-alpaca-ee97ba.netlify.app/?destination=${link}`,
        {headers},
      );
      const dotlinkText = dotlinkRes.data;
      // console.log('dotlinkText', dotlinkText);
      const vlink = dotlinkText.match(/<a\s+href="([^"]*cloud\.[^"]*)"/i) || [];
      // console.log('vLink', vlink[1]);
      link = vlink[1];
    }
    const vLinkRes = await axios(
      `https://dev--silver-alpaca-ee97ba.netlify.app/?destination=${link}`,
      {headers},
    );
    const vLinkText = vLinkRes.data;
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [
      '',
      '',
    ];
    // console.log(vLinkRedirect[1]);
    const getTokenRes = await axios(
      `https://dev--silver-alpaca-ee97ba.netlify.app/?destination=${vLinkRedirect[1]}`,
      {headers},
    );

    const getTokenText = getTokenRes.data;
    const getToken = getTokenText.match(/[\?&]r=([^&;]*)/);
    // console.log(getToken?.[1]);
    const blogLink = `https://bloggingvector.shop/re/${getToken?.[1]}?_=631252793`;
    const blogRes = await axios(blogLink, {headers});
    // console.log(blogRes.data);
    // console.log('blogLink', blogLink);
    const vcloudLink = blogRes.data.match(/var reurl = "([^"]+)"/);
    // console.log('vcloudLink', vcloudLink[1]);
    const vcloudRes = await axios(vcloudLink?.[1], {headers});
    const $ = cheerio.load(vcloudRes.data);

    const linkClass = $('.btn-success.btn-lg.h6,.btn-danger,.btn-secondary');
    const streamLinks: Stream[] = [];
    linkClass.each((index, element) => {
      const itm = $(element);
      const link = itm.attr('href') || '';
      if (link?.includes('.dev')) {
        streamLinks.push({server: 'cloudfareWorker', link: link});
      }
      if (link?.includes('pixeldrain')) {
        streamLinks.push({server: 'pixeldrain', link: link});
      }
      if (link?.includes('hubcloud')) {
        streamLinks.push({server: 'hubcloud', link: link});
      }
      if (link?.includes('cloudflarestorage')) {
        streamLinks.push({server: 'cloudflareStorage', link: link});
      }
    });

    console.log('streamLinks', streamLinks);
    return streamLinks;
  } catch (error) {
    console.log('getStream error: ');
    // console.error(error);
    ToastAndroid.show('Error getting stream links', ToastAndroid.SHORT);
    return [];
  }
}
