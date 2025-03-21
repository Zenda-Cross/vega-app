import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {EpisodeLink} from '../types';

export const world4uGetEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    const res = await axios.get(url, {headers});
    const html = res.data;
    let $ = cheerio.load(html);

    const episodeLinks: EpisodeLink[] = [];
    $(
      'strong:contains("Episode"),strong:contains("1080"),strong:contains("720"),strong:contains("480")',
    ).map((i, element) => {
      const title = $(element).text();
      const link = $(element)
        .parent()
        .parent()
        .next('h4')
        .find('a')
        .attr('href');
      if (link && !title.includes('zip')) {
        episodeLinks.push({
          title: title,
          link,
        });
      }
    });

    console.log('w4u eplinks', episodeLinks);
    return episodeLinks;
  } catch (err) {
    console.error(err);
    return [
      {
        title: 'Server 1',
        link: url,
      },
    ];
  }
};
