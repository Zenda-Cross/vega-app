import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';

export async function getStream(link: string, type: string) {
  try {
    console.log('dotlink', link);
    if (type === 'movie') {
      const dotlinkRes = await axios(
        `https://cors.smashystream.workers.dev/?destination=${link}`,
        {headers},
      );
      const dotlinkText = dotlinkRes.data;
      // console.log('dotlinkText', dotlinkText);
      const vlink = dotlinkText.match(/<a\s+href="([^"]*cloud\.[^"]*)"/i) || [];
      // console.log('vLink', vlink[1]);
      link = vlink[1];
    }
    const vLinkRes = await axios(
      `https://cors.smashystream.workers.dev/?destination=${link}`,
      {headers},
    );
    const vLinkText = vLinkRes.data;
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [
      '',
      '',
    ];
    // console.log(vLinkRedirect[1]);
    const getTokenRes = await axios(
      `https://cors.smashystream.workers.dev/?destination=${vLinkRedirect[1]}`,
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

    const linkClass = $('.btn-success.btn-lg.h6,.btn-danger');
    const streamLinks: string[] = [];
    linkClass.each((index, element) => {
      const itm = $(element);
      const link = itm.attr('href') || '';
      if (
        link?.includes('workers.dev') ||
        link?.includes('pixeldrain') ||
        link?.includes('hubcloud')
      ) {
        streamLinks.push(link);
      }
    });

    console.log('streamLinks', streamLinks);
    return streamLinks;
  } catch (error) {
    console.log('getStream error: ');
    // console.error(error);
    return [];
  }
}
