import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const extraGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const meta = {
      title:
        data
          .match(/Name:<\/strong>\s*([^<]+)<br>/)?.[1]
          ?.replace('&nbsp;', '') ||
        $('.entry-content').find('li:contains("Name")').text().split(':')[1] ||
        '',
      synopsis: $('em:contains("Keyword")').parent().next().text(),
      image: $('.entry-content').find('img').attr('data-lazy-src') || '',

      imdbId:
        $('.entry-content').find('ul').find('a').attr('href')?.split('/')[4] ||
        '',
      type: $('.entry-content').text().toLocaleLowerCase().includes('season')
        ? 'series'
        : 'movie',
    };
    // console.log('meta', meta);
    const links: Link[] = [];

    $('.maxbutton-8-center').map((i, element) => {
      const seriesTitle = $(element).prev().text();
      const link = $(element).find('a').attr('href');

      if (link) {
        links.push({
          title: seriesTitle,
          episodesLink: link.includes('hub') ? '' : link,
          directLinks: link.includes('hub')
            ? [{link: link, title: 'Movie', type: 'movie'}]
            : [],
          quality: seriesTitle?.match(/\d+p\b/)?.[0] || '',
        });
      }
    });
    // console.log('extra links', links);
    return {...meta, linkList: links};
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
