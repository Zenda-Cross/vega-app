import {Stream} from '../types';
import {headers} from './header';
import * as cheerio from 'cheerio';

export const tokyoGetStream = async (link: string): Promise<Stream[]> => {
  try {
    const url = link;
    console.log('url', url);
    const res = await fetch(url, {headers});
    const data = await res.text();
    const $ = cheerio.load(data);
    const streamLinks: Stream[] = [];
    $('.c_h1,.c_h2').map((i, element) => {
      $(element).find('span').remove();
      const title = $(element).find('a').text() || '';
      const link = $(element).find('a').attr('href') || '';
      if (title && link.includes('media')) {
        streamLinks.push({
          server: title,
          link,
          type: link.split('.').pop() || 'mkv',
        });
      }
    });
    console.log('streamLinks', streamLinks);
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
