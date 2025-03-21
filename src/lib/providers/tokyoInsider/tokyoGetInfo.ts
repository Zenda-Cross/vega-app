import {Info} from '../types';
import {headers} from './header';
import * as cheerio from 'cheerio';

export const tokyoGetInfo = async (link: string): Promise<Info> => {
  try {
    const url = link;
    console.log('infourl', url);
    const res = await fetch(url, {headers});
    const data = await res.text();
    const $ = cheerio.load(data);
    const meta = {
      title: $('.c_h2:contains("Title(s):")')
        .text()
        .replace('Title(s):', '')
        .trim()
        .split('\n')[0],
      synopsis: $('.c_h2b:contains("Summary:"),.c_h2:contains("Summary:")')
        .text()
        .replace('Summary:', '')
        .trim(),
      image: $('.a_img').attr('src') || '',
      imdbId: '',
      type: 'series',
    };
    // console.log('meta', meta);
    const episodesList: {title: string; link: string}[] = [];
    $('.episode').map((i, element) => {
      const link =
        'https://www.tokyoinsider.com' + $(element).find('a').attr('href') ||
        $('.download-link').attr('href');
      let title =
        $(element).find('a').find('em').text() +
        ' ' +
        $(element).find('a').find('strong').text();
      if (!title.trim()) {
        title = $('.download-link').text();
      }

      console.log('link', link, 'title', title);
      if (link && title.trim()) {
        episodesList.push({title, link});
      }
    });
    console.log('episodesList', episodesList);

    return {
      ...meta,
      linkList: [
        {
          title: meta.title,
          directLinks: episodesList,
        },
      ],
    };
  } catch (err) {
    console.error(err);
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: '',
      linkList: [],
    };
  }
};
