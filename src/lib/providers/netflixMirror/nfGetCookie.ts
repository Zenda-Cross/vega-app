import axios from 'axios';
import {getBaseUrl} from '../getBaseUrl';
import * as cheerio from 'cheerio';

export async function nfGetCookie() {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const res = await axios.get(baseUrl + '/home', {withCredentials: false});
    const $ = cheerio.load(res.data);
    // console.log('nf cookie html', res.data);
    const addhash = $('body').attr('data-addhash');
    console.log('nf addhash', addhash);
    try {
      const addRes = await fetch(
        baseUrl + '/v.php?hash=' + addhash + '&t=' + Math.random(),
        {
          credentials: 'omit',
        },
      );
    } catch (err) {
      console.log('nf addhash error ', err);
    }
    try {
      const addRes = await fetch(
        'https://userverify.netmirror.app/verify?vhf=' +
          addhash +
          '&t=' +
          Math.random(),
        {
          credentials: 'omit',
        },
      );
    } catch (err) {
      console.log('nf addhash error ', err);
    }
    const form = new FormData();
    form.append('verify', addhash);
    const res2 = await fetch(baseUrl + '/verify2.php', {
      method: 'POST',
      body: form,
      credentials: 'omit',
    });
    const cookie2 = res2.headers.get('set-cookie');
    console.log('nfCookie2', cookie2);
    return cookie2?.split(';')[0] + ';' || '';
  } catch (err) {
    console.error('nf cookie error: ', err);
    return '';
  }
}
