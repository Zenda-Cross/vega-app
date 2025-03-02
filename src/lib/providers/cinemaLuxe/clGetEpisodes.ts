import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const clsEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  try {
    console.log('clsEpisodeLinks', url);
    if (!url.includes('luxelinks') || url.includes('luxecinema')) {
      const res = await axios.get(url, {headers});
      const data = res.data;
      // console.log('data', data);
      const encodedLink = data.match(/"link":"([^"]+)"/)?.[1];
      console.log('encodedLink', encodedLink);
      if (encodedLink) {
        url = encodedLink ? atob(encodedLink) : url;
      } else {
        const redirectUrlRes = await fetch(
          'https://ext.8man.me/api/cinemaluxe',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({url}),
          },
        );
        const redirectUrl = await redirectUrlRes.json();
        console.log('redirectUrl', redirectUrl);
        url = redirectUrl?.redirectUrl || url;
      }
    }
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

    $('a.maxbutton-4,a.maxbutton,.maxbutton-hubcloud').map((i, element) => {
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
