import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Info, Link} from '../types';

export const world4uGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const type = $('.entry-content')
      .text()
      .toLocaleLowerCase()
      .includes('movie name')
      ? 'movie'
      : 'series';
    const imdbId = $('.imdb_left').find('a').attr('href')?.split('/')[4] || '';
    const title = $('.entry-content')
      .find('strong:contains("Name")')
      .children()
      .remove()
      .end()
      .text()
      .replace(':', '');
    const synopsis = $('.entry-content')
      .find('p:contains("Synopsis"),p:contains("Plot"),p:contains("Story")')
      .children()
      .remove()
      .end()
      .text();
    const image =
      $('.wp-caption').find('img').attr('data-src') ||
      $('.entry-content').find('img').attr('data-src') ||
      '';

    // Links
    const links: Link[] = [];

    $('.my-button').map((i, element) => {
      const title = $(element).parent().parent().prev().text();
      const episodesLink = $(element).attr('href');
      const quality = title.match(/\b(480p|720p|1080p|2160p)\b/i)?.[0] || '';
      if (episodesLink && title) {
        links.push({
          title,
          episodesLink: type === 'series' ? episodesLink : '',
          directLinks:
            type === 'movie'
              ? [{link: episodesLink, title: 'Movie', type: 'movie'}]
              : [],
          quality: quality,
        });
      }
    });

    // console.log('drive meta', title, synopsis, image, imdbId, type, links);
    // console.log('w4u meta', links, type);
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
