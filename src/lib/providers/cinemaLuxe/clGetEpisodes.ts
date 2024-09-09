import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const clsEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    const res = await axios.get(url, {headers});
    const html = res.data;
    let $ = cheerio.load(html);
    const episodeLinks: EpisodeLink[] = [];

    $('.mb-center.maxbutton-1-center')
      .first()
      .parent()
      .children()
      .map((i, element) => {
        const title = $(element).find('a').text();
        const link = $(element).find('a').attr('href');
        if (title && link && !title.includes('Batch')) {
          episodeLinks.push({
            title: title
              .replace(/\(\d{4}\)/, '')
              .replace('Download', 'Movie')
              .replace('⚡', '')
              .trim(),
            link,
          });
        }
      });

    // console.log(episodeLinks);
    return episodeLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
