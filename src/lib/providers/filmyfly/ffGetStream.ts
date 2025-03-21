import axios from 'axios';
import {Stream} from '../types';

import * as cheerio from 'cheerio';
import {gdFlixExtracter} from '../gdflixExtractor';

export const ffGetStream = async (
  link: string,
  type: string,
  signal: AbortSignal,
): Promise<Stream[]> => {
  try {
    const res = await axios.get(link, {signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const streams: Stream[] = [];

    // Collect all elements
    const elements = $('.button2,.button1,.button3,.button4,.button').toArray();

    // Create an array of promises for processing each element
    const promises = elements.map(async element => {
      const title = $(element).text();
      let link = $(element).attr('href');

      if (title.includes('GDFLIX') && link) {
        const gdLinks = await gdFlixExtracter(link, signal);
        console.log('gdLinks', gdLinks);
        streams.push(...gdLinks);
      }

      const alreadyAdded = streams.find(s => s.link === link);
      if (
        title &&
        link &&
        !title.includes('Watch') &&
        !title.includes('Login') &&
        !title.includes('GoFile') &&
        !alreadyAdded
      ) {
        streams.push({
          server: title,
          link: link,
          type: 'mkv',
        });
      }
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};
