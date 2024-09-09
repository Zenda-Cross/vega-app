import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const clGetInfo = async function (link: string): Promise<Info> {
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
    const synopsis = $('.wp-content').text().trim();
    const tags = $('.sgeneros')
      .children()
      .map((i, element) => $(element).text())
      .get()
      .slice(3);
    const rating = Number($('#repimdb').find('strong').text())
      .toFixed(1)
      .toString();

    // console.log(title, image, synopsis);

    // Links
    const links: Link[] = [];

    $('.mb-center.maxbutton-5-center').map((i, element) => {
      const title = $(element)
        .prev()
        .text()
        .replace('⬇Download', '')
        .replace('⬇ Download', '')
        .trim();
      const link = $(element).find('a').attr('href');
      if (title && link) {
        links.push({
          title,
          episodesLink: link,
          quality: title?.match(/\d+P\b/)?.[0].replace('P', 'p') || '',
        });
      }
    });

    return {
      title,
      tags,
      rating,
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
