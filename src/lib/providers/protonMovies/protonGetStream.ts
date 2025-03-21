import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from '../headers';
import {decodeHtml} from './protonGetMeta';
import {gofileExtracter} from '../gofileExtracter';

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
    console.log('idList', idList);

    const baseUrl = link.split('/').slice(0, 3).join('/');

    const secondIdList: {
      quality: string;
      id: string;
    }[] = [];

    await Promise.all(
      idList.slice(0, 2).map(async id => {
        const formData = new FormData();
        formData.append('downloadid', id.id);
        formData.append('token', 'ok');

        const idRes = await axios.post(`${baseUrl}/ppd.php`, formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
            Referer: link,
          },
        });
        const idData = idRes.data;
        secondIdList.push({
          quality: id.quality,
          id: idData,
        });
        // console.log('idData', idData);
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
