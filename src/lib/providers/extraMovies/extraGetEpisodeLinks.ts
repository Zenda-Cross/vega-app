import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const extraGetEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    console.log('url', url);

    const res = await axios.get(url, {headers});
    const html = res.data;
    let $ = cheerio.load(html);
    const episodeLinks: EpisodeLink[] = [];
    // if (url.includes('filepress')) {
    //   episodeLinks.push({
    //     title: 'Play',
    //     link: url,
    //   });
    // }
    $('.mb-center.maxbutton-2-center').map((i, element) => {
      const seriesTitle = $(element)
        .parent()
        .prev()
        .text()
        .replace('-:', '')
        .replace(':-', '')
        .trim();
      const episodesLink = $(element).find('a').attr('href');
      console.log('seriesTitle', seriesTitle);
      if (episodesLink?.includes('hub') && seriesTitle) {
        episodeLinks.push({
          title: seriesTitle.trim(),
          link: episodesLink || '',
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
