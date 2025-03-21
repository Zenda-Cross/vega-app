import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const ffGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    // console.log('url', url);
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const type = url.includes('tvshows') ? 'series' : 'movie';
    const imdbId = '';
    const title = $('.fname:contains("Name")').find('.colora').text().trim();
    const image = $('.ss').find('img').attr('src') || '';
    const synopsis = $('.fname:contains("Description")')
      .find('.colorg')
      .text()
      .trim();
    const tags =
      $('.fname:contains("Genre")').find('.colorb').text().split(',') || [];
    const rating = '';

    // console.log(title, image, synopsis);

    // Links
    const links: Link[] = [];

    const downloadLink = $('.dlbtn').find('a').attr('href');
    if (downloadLink) {
      links.push({
        title: title,
        episodesLink: downloadLink,
      });
    }

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
