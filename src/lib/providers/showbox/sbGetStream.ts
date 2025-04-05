import axios from 'axios';
import {Stream} from '../types';
import * as cheerio from 'cheerio';

export const sbGetStream = async (
  id: string,
  type: string,
  signal: AbortSignal,
): Promise<Stream[]> => {
  try {
    const stream: Stream[] = [];
    const [, epId] = id.split('&');
    const url = `https://febbox.vercel.app/api/video-quality?fid=${epId}`;
    console.log('sbGetStream url', url);
    const res = await axios.get(url, {
      signal,
    });
    const data = res.data;
    const $ = cheerio.load(data.html);
    $('.file_quality').each((i, el) => {
      const server =
        $(el).find('p.name').text() +
        ' - ' +
        $(el).find('p.size').text() +
        ' - ' +
        $(el).find('p.speed').text();
      const link = $(el).attr('data-url');
      if (link) {
        stream.push({
          server: server,
          type: 'mkv',
          link: link,
        });
      }
    });

    return stream;
  } catch (err) {
    console.log('getStream error', err);
    return [];
  }
};
