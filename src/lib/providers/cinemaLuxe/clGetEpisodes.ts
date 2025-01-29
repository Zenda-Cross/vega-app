import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const clsEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    console.log('clsEpisodeLinks', url);
    // if (!url.includes('luxelinks')) {
    //   const res = await axios.get(url, {headers});
    //   const data = res.data;
    //   const encodedLink = data.match(/"link":"([^"]+)"/)[1];
    //   url = encodedLink ? atob(encodedLink) : url;
    // }
    const res = await axios.get(url, {headers});
    const html = res.data;
    let $ = cheerio.load(html);
    const episodeLinks: EpisodeLink[] = [];
    if (url.includes('luxedrive')) {
      episodeLinks.push({
        title: 'Movie',
        link: url,
      });
      return episodeLinks;
    }

    $('a.maxbutton-4,.maxbutton-hubcloud').map((i, element) => {
      console.log('element', $(element).text());
      const title = $(element).text();
      const link = $(element).attr('href');
      if (
        title &&
        link &&
        !title.includes('Batch') &&
        !title.toLowerCase().includes('zip')
      ) {
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
    console.error('cl episode links', err);
    return [];
  }
};
