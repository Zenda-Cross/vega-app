import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';

export interface EpisodeLink {
  title: string;
  link: string;
}

export const getEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  console.log('getEpisodeLinks', url);
  try {
    const res = await axios.get(url, {headers});
    const $ = cheerio.load(res.data);
    const container = $('.entry-content');
    $('.unili-content').remove();
    const episodes: EpisodeLink[] = [];
    container.find('h4').each((index, element) => {
      const el = $(element);
      const title = el.text().replaceAll('-', '').replaceAll(':', '');
      const link = el
        .next('p')
        .find(
          '.btn-outline[style="background:linear-gradient(135deg,#ed0b0b,#f2d152); color: white;"]',
        )
        .parent()
        .attr('href');
      if (title && link) {
        episodes.push({title, link});
      }
    });
    // console.log(episodes);
    return episodes;
  } catch (err) {
    console.log('getEpisodeLinks error: ');
    // console.error(err);
    return [];
  }
};
