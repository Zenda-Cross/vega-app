import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const ffEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const episodeLinks: EpisodeLink[] = [];

    // if ($.text().includes('🔰')) {
    // }

    $('.dlink.dl').map((i, element) => {
      const title = $(element)
        .find('a')
        .text()
        ?.replace('Download', '')
        ?.trim();
      const link = $(element).find('a').attr('href');

      if (title && link) {
        episodeLinks.push({
          title,
          link,
        });
      }
    });
    // console.log(episodeLinks);
    return episodeLinks;
  } catch (err) {
    console.error('cl episode links', err);
    return [];
  }
};
