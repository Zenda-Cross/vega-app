import axios from 'axios';
import * as cheerio from 'cheerio';
import {EpisodeLink} from '../types';

export const vadapavGetEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    const baseUrl = url?.split('/').slice(0, 3).join('/');
    const res = await axios.get(url);
    const html = res.data;
    let $ = cheerio.load(html);
    const episodeLinks: EpisodeLink[] = [];

    $('.file-entry:not(:contains("Parent Directory"))').map((i, element) => {
      const link = $(element).attr('href');
      if (
        link &&
        ($(element).text()?.includes('.mp4') ||
          $(element).text()?.includes('.mkv'))
      ) {
        episodeLinks.push({
          title:
            $(element).text()?.match(/E\d+/)?.[0]?.replace('E', 'Episode ') ||
            i + 1 + '. ' + $(element).text()?.replace('.mkv', ''),
          link: baseUrl + link,
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
