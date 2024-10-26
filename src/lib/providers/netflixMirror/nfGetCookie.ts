import axios from 'axios';
import {getBaseUrl} from '../getBaseUrl';

export async function nfGetCookie() {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const res = await axios.head(baseUrl + '/home', {withCredentials: false});
    const cookie = res.headers['set-cookie'];
    // console.log('nfCookie', cookie);
    // get addhash value from cookie
    const addhash = cookie?.[0].split(';')[0].split('=')[1];
    // console.log('addhash', addhash);
    const addRes = await axios.get(baseUrl + '/v.php?hash=' + addhash);
    const form = new FormData();
    form.append('verify', addhash);
    const res2 = await fetch(baseUrl + '/verify2.php', {
      method: 'POST',
      body: form,
      credentials: 'omit',
    });
    const cookie2 = await res2.headers.get('set-cookie');
    // console.log('nfCookie2', cookie2.split(';')[0]);
    return cookie2?.split(';')[0] + ';' || '';
  } catch (err) {
    console.error('nf error ', err);
    return '';
  }
}
