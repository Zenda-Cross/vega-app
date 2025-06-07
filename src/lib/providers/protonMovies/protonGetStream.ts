import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from '../headers';
import {decodeHtml} from './protonGetMeta';
import {gofileExtracter} from '../gofileExtracter';
import {generateMessageToken, getOrCreateUID} from './protonGenerateToken';

export const protonGetStream = async (link: string): Promise<Stream[]> => {
  try {
    const streamLinks: Stream[] = [];
    const res = await axios.get(link, {headers});
    const data = res.data;
    // const regex = /\[(?=.*?"<div class")(.*?)\]/g;
    // const htmlArray = data?.match(regex);

    // new code
    const $$ = cheerio.load(data);
    const htmlArray = $$('script:contains("decodeURIComponent")')
      .text()
      .split(' = ')?.[1]
      ?.split('protomovies')?.[0]
      ?.trim()
      ?.slice(0, -1); // remove the last character
    // console.log('protonGetInfo', htmlArray);
    // const html = decodeHtml(JSON.parse(htmlArray[htmlArray.length - 1]));

    const html = decodeHtml(JSON.parse(htmlArray));

    // console.log('protonGetInfo', htmlArray[htmlArray.length - 1]);
    // console.log('all', html);
    const $ = cheerio.load(html);
    const idList = [];
    const id1080 = $('tr:contains("1080p")')
      .find('button:contains("Info")')
      .attr('id')
      ?.split('-')[1];
    if (id1080) {
      idList.push({
        id: id1080,
        quality: '1080p',
      });
    }
    const id720 = $('tr:contains("720p")')
      .find('button:contains("Info")')
      .attr('id')
      ?.split('-')[1];

    if (id720) {
      idList.push({
        id: id720,
        quality: '720p',
      });
    }

    const id480 = $('tr:contains("480p")')
      .find('button:contains("Info")')
      .attr('id')
      ?.split('-')[1];

    if (id480) {
      idList.push({
        id: id480,
        quality: '480p',
      });
    }
    // console.log('idList', idList);

    const baseUrl = link.split('/').slice(0, 3).join('/');

    const secondIdList: {
      quality: string;
      id: string;
    }[] = [];

    await Promise.all(
      idList.slice(0, 2).map(async id => {
        const formData = new URLSearchParams();
        formData.append('downloadid', id.id);
        formData.append('token', 'ok');
        const messageToken = generateMessageToken(baseUrl);
        const uid = getOrCreateUID();

        const idRes = await fetch(`${baseUrl}/ppd.php`, {
          headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
            pragma: 'no-cache',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            cookie:
              'ext_name=ojplmecpdpgccookcobabopnaifgidhf; tgInvite222=true; cf_clearance=3ynJv2B6lHMj3FCOqtfQaL7lTN4KC3xmPRMgcNtddAc-1748787867-1.2.1.1-SEIhLbWR3ehfib5Y3P5pjzj1Qu9wipc52Icv4AmNkztXn2pTXhjKgxXnvTuA2bNscgHuc1juXujAHteqY_vaMmy2C3djMWnJGzjje_XvXZXKht8rwHZt6sviq7KAYvrYZPTrATqENuopzmqmK6dDFS.CAnWHt0VDn8q06iLm5rYj1AXUo3qkV5p1Idx_25elWHYGG8yengBrQV1MYVM9LMdQqv44PXu69FZvNkgv.d6blCKyneJnoLkw4LHAccu.QRPbFwWqqTDyO9YTLRQW9w29bKghD3_JVxkz.qxpg5FbocJ3i6tJJy74SvROpYdpVUOn0fW1YgQ7RxYwhNoHpdTKy8pvmQJGRuSVW1GjO_k',
            Referer: 'https://m3.protonmovies.top/download/',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
          },
          body: `downloadid=${id.id}&msg=${messageToken}&uid=${uid}&token=ok`,
          method: 'POST',
        });
        const idData = await idRes.text();
        secondIdList.push({
          quality: id.quality,
          id: idData,
        });
        console.log('idData', idData);
      }),
    );
    await Promise.all(
      secondIdList.map(async id => {
        const idRes = await axios.post(`${baseUrl}/tmp/${id.id}`);
        if (idRes.data.ppd['gofile.io']) {
          const goRes = await gofileExtracter(
            idRes.data.ppd['gofile.io'].link.split('/').pop(),
          );
          console.log('link', goRes.link);
          if (goRes.link) {
            streamLinks.push({
              link: goRes.link,
              server: 'gofile ' + id.quality,
              type: 'mkv',
              headers: {
                referer: 'https://gofile.io',
                connection: 'keep-alive',
                contentType: 'video/x-matroska',
                cookie: 'accountToken=' + goRes.token,
              },
            });
          }
        }
      }),
    );

    return streamLinks;
  } catch (e) {
    console.log('proton get stream err', e);
    return [];
  }
};
