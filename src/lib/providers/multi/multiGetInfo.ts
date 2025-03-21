import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './headers';
import {Info, Link} from '../types';

export const multiGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    // console.log('url', url);
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const type = url.includes('tvshows') ? 'series' : 'movie';
    const imdbId = '';
    const title = url.split('/')[4].replace(/-/g, ' ');
    const image = $('.g-item').find('a').attr('href') || '';
    const synopsis = $('.wp-content').find('p').text() || '';

    // console.log(title, image, synopsis);

    // Links
    const links: Link[] = [];

    if (type === 'series') {
      $('#seasons')
        .children()
        .map((i, element) => {
          const title = $(element)
            .find('.title')
            .children()
            .remove()
            .end()
            .text();
          let episodesList: {title: string; link: string}[] = [];
          $(element)
            .find('.episodios')
            .children()
            .map((i, element) => {
              const title =
                'Episode' +
                $(element).find('.numerando').text().trim().split('-')[1];
              const link = $(element).find('a').attr('href');
              if (title && link) {
                episodesList.push({title, link});
              }
            });
          if (title && episodesList.length > 0) {
            links.push({
              title,
              directLinks: episodesList,
            });
          }
        });
    } else {
      links.push({
        title: title,
        directLinks: [{title: title, link: url.slice(0, -1), type: 'movie'}],
      });
    }
    // console.log('multi meta', links);

    return {
      title,
      synopsis,
      image,
      imdbId,
      type,
      linkList: links,
    };
  } catch (err) {
    console.error(err);
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
