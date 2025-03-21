import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {ToastAndroid} from 'react-native';
import {Stream} from '../types';
import {hubcloudExtracter} from '../hubcloudExtractor';

const encode = function (value: string) {
  return btoa(value.toString());
};
const decode = function (value: string) {
  if (value === undefined) {
    return '';
  }
  return atob(value.toString());
};
const pen = function (value: string) {
  return value.replace(/[a-zA-Z]/g, function (_0x1a470e: any) {
    return String.fromCharCode(
      (_0x1a470e <= 'Z' ? 90 : 122) >=
        (_0x1a470e = _0x1a470e.charCodeAt(0) + 13)
        ? _0x1a470e
        : _0x1a470e - 26,
    );
  });
};

const abortableTimeout = (ms, {signal} = {}) => {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      return reject(new Error('Aborted'));
    }

    const timer = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      });
    }
  });
};

export async function vegaGetStream(
  link: string,
  type: string,
  signal: AbortSignal,
) {
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
            type: 'mkv',
          });
        }
      } catch (error) {
        console.log('filepress error: ');
        // console.error(error);
      }
    }

    // console.log(vLinkRedirect[1]);

    // console.log(domains[2]);

    /////////////////////////////
    // const domains = vLinkText.match(/url\.replace\('([^']+)','([^']+)'\);/) || [
    //   '',
    //   '',
    // ];
    // const vLinkRedirectRes = await fetch(
    //   '
    //     vLinkRedirect[1].replace(domains[1], domains[2]),
    //   {
    //     headers: headers,
    //     signal: signal,
    //   },
    // );
    // const vLinkRedirectText = await vLinkRedirectRes.text();

    // var regex = /ck\('_wp_http_\d+','([^']+)'/g;
    // var combinedString = '';

    // var match;
    // while ((match = regex.exec(vLinkRedirectText)) !== null) {
    //   // console.log(match[1]);
    //   combinedString += match[1];
    // }
    // // console.log(decode(combinedString));
    // const decodedString = decode(pen(decode(decode(combinedString))));
    // // console.log(decodedString);
    // const data = JSON.parse(decodedString);
    // console.log(data);
    // const token = encode(data?.data);
    // const blogLink = data?.wp_http1 + '?re=' + token;
    // // abort timeout on signal
    // let wait = abortableTimeout((Number(data?.total_time) + 2) * 1000, {
    //   signal,
    // });
    // ToastAndroid.show(`Wait ${data?.total_time} Sec`, ToastAndroid.SHORT);

    // await wait;
    // console.log('blogLink', blogLink);
    // let vcloudLink = 'Invalid Request';
    // while (vcloudLink.includes('Invalid Request')) {
    //   const blogRes = await axios(blogLink, {headers, signal});
    //   if (blogRes.data.includes('Invalid Request')) {
    //     console.log(blogRes.data);
    //   } else {
    //     vcloudLink = blogRes.data.match(/var reurl = "([^"]+)"/);
    //     break;
    //   }
    //   console.log('vcloudLink', vcloudLink);
    // }

    // console.log('vcloudLink', vcloudLink?.[1]);
    /////////////////////////////

    /////////////////////////////
    // const vcloudRes = await axios(
    //   'vcloudLink?.[1],
    //   {headers, signal},
    // );
    /////////////////////////////

    return await hubcloudExtracter(link, signal);
  } catch (error: any) {
    console.log('getStream error: ', error);
    if (error.message.includes('Aborted')) {
      // ToastAndroid.show('Request Aborted', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show(
        `Error getting stream links ${error.message}`,
        ToastAndroid.SHORT,
      );
    }
    return [];
  }
}
