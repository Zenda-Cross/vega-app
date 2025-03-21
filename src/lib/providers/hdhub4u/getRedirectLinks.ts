import axios from 'axios';
import {ToastAndroid} from 'react-native';
import {headers} from '../headers';

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

export async function getRedirectLinks(link: string, signal: AbortSignal) {
  try {
    const res = await axios.get(link, {headers, signal});
    const resText = res.data;

    var regex = /ck\('_wp_http_\d+','([^']+)'/g;
    var combinedString = '';

    var match;
    while ((match = regex.exec(resText)) !== null) {
      // console.log(match[1]);
      combinedString += match[1];
    }
    // console.log(decode(combinedString));
    const decodedString = decode(pen(decode(decode(combinedString))));
    // console.log(decodedString);
    const data = JSON.parse(decodedString);
    console.log(data);
    const token = encode(data?.data);
    const blogLink = data?.wp_http1 + '?re=' + token;
    // abort timeout on signal
    let wait = abortableTimeout((Number(data?.total_time) + 3) * 1000, {
      signal,
    });
    ToastAndroid.show(`Wait ${data?.total_time} Sec`, ToastAndroid.SHORT);

    await wait;
    console.log('blogLink', blogLink);

    let vcloudLink = 'Invalid Request';
    while (vcloudLink.includes('Invalid Request')) {
      const blogRes = await axios(blogLink, {headers, signal});
      if (blogRes.data.includes('Invalid Request')) {
        console.log(blogRes.data);
      } else {
        vcloudLink = blogRes.data.match(/var reurl = "([^"]+)"/);
        break;
      }
    }

    // console.log('vcloudLink', vcloudLink?.[1]);
    return blogLink || link;
  } catch (err) {
    console.log('Error in getRedirectLinks', err);
    return link;
  }
}
