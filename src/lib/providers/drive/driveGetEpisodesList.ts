import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {EpisodeLink} from '../types';

export const driveGetEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    const res = await axios.get(url, {headers});
    const html = res.data;
    let $ = cheerio.load(html);

    const episodeLinks: EpisodeLink[] = [];
    $('a:contains("HubCloud")').map((i, element) => {
      const title = $(element).parent().prev().text();
      const link = $(element).attr('href');
      if (link && (title.includes('Ep') || title.includes('Download'))) {
        episodeLinks.push({
          title: title.includes('Download') ? 'Play' : title,
          link,
        });
      }
    });

    // console.log(episodeLinks);
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
