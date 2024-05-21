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
    const streamLinks: Stream[] = [];
    console.log('dotlink', link);
    if (type === 'movie') {
      // vlink
      const dotlinkRes = await axios(`${link}`, {headers});
      const dotlinkText = dotlinkRes.data;
      // console.log('dotlinkText', dotlinkText);
      const vlink = dotlinkText.match(/<a\s+href="([^"]*cloud\.[^"]*)"/i) || [];
      // console.log('vLink', vlink[1]);
      link = vlink[1];

      // filepress link
      try {
        const $ = cheerio.load(dotlinkText);
        const filepressLink = $(
          '.btn.btn-sm.btn-outline[style="background:linear-gradient(135deg,rgb(252,185,0) 0%,rgb(0,0,0)); color: #fdf8f2;"]',
        )
          .parent()
          .attr('href');
        // console.log('filepressLink', filepressLink);
        const filepressID = filepressLink?.split('/').pop();
        const filepressBaseUrl = filepressLink
          ?.split('/')
          .slice(0, -2)
          .join('/');
        // console.log('filepressID', filepressID);
        // console.log('filepressBaseUrl', filepressBaseUrl);
        const filepressTokenRes = await axios.post(
          filepressBaseUrl + '/api/file/downlaod/',
          {
            id: filepressID,
            method: 'indexDownlaod',
            captchaValue: null,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Referer: filepressBaseUrl,
            },
          },
        );
        // console.log('filepressTokenRes', filepressTokenRes.data);
        if (filepressTokenRes.data?.status) {
          const filepressToken = filepressTokenRes.data?.data;
          const filepressStreamLink = await axios.post(
            filepressBaseUrl + '/api/file/downlaod2/',
            {
              id: filepressToken,
              method: 'indexDownlaod',
              captchaValue: null,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Referer: filepressBaseUrl,
              },
            },
          );
          // console.log('filepressStreamLink', filepressStreamLink.data);
          streamLinks.push({
            server: 'filepress',
            link: filepressStreamLink.data?.data?.[0],
          });
        }
      } catch (error) {
        console.log('filepress error: ');
        // console.error(error);
      }
    }
    const vLinkRes = await axios(`${link}`, {headers});
    const vLinkText = vLinkRes.data;
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [];
    // console.log(vLinkRedirect[1]);
    const getTokenRes = await axios(`${vLinkRedirect[1]}`, {headers});

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
    linkClass.each((index, element) => {
      const itm = $(element);
      const link = itm.attr('href') || '';
      if (link?.includes('.dev')) {
        streamLinks.push({server: 'Cf Worker', link: link});
      }
      if (link?.includes('pixeldrain')) {
        streamLinks.push({server: 'pixeldrain', link: link});
      }
      if (link?.includes('hubcloud')) {
        streamLinks.push({server: 'hubcloud', link: link});
      }
      if (link?.includes('cloudflarestorage')) {
        streamLinks.push({server: 'CfStorage', link: link});
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
