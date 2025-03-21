import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink, Info} from '../types';

export const aedGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    // console.log('url', url);
    const baseUrl = url.split('/').slice(0, 3).join('/');
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const imdbId = '';
    const title = $('.video-details').children().first().text() || '';
    const image = $('.picture').find('img').attr('src') || '';
    const synopsis = $('.post-entry').text() || '';

    // console.log(title, image, synopsis);

    // Links
    const directLinks: EpisodeLink[] = [];

    $('.listing.items.lists')
      ?.children()
      ?.map((i, element) => {
        const episode = $(element)
          .find('.name')
          .text()
          ?.trim()
          ?.match(/Episode \d+/)?.[0];
        const link = $(element).find('a').attr('href');
        if (episode && link) {
          directLinks.push({
            title: episode,
            link: baseUrl + link,
          });
        }
      });

    return {
      title: title?.trim(),
      synopsis: synopsis?.trim(),
      image,
      imdbId,
      type: 'movie',
      linkList: [
        {
          title: title?.trim(),
          directLinks,
        },
      ],
    };
  } catch (err) {
    console.error('AED get info error', err);
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: 'movie',
      linkList: [],
    };
  }
};
