import {Stream, ProviderContext} from '../types';
import * as cheerio from 'cheerio';

export const sbGetStream = async function ({
  link: id,
  // type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const {axios} = providerContext;
    const stream: Stream[] = [];
    const [, epId] = id.split('&');
    const url = `https://febbox.vercel.app/api/video-quality?fid=${epId}`;
    const res = await axios.get(url, {signal});
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
    return [];
  }
};
