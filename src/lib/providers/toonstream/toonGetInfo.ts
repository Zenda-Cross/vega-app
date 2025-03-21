import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const toonGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    // console.log('url', url);
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const type = url.includes('tvshows') ? 'series' : 'movie';
    const imdbId = '';
    const title = $('.entry-title').first().text() || '';
    const image = $('.post-thumbnail.alg-ss')
      .find('img')
      .attr('data-src')
      ?.includes('https')
      ? $('.post-thumbnail.alg-ss').find('img').attr('data-src')
      : 'https:' + $('.post-thumbnail.alg-ss').find('img').attr('data-src');
    const synopsis = $('.description').find('p').first().text() || '';
    const tags = $('.genres')
      .find('a')
      .slice(0, 2)
      .map((i, element) => {
        return $(element).text();
      })
      .get();
    const rating = Math.floor(Number($('.num').text())).toString();
    const cast = $('.loadactor')
      .find('a')
      .map((i, element) => {
        return $(element).text();
      })
      .get();

    // console.log(title, image, synopsis);

    // Links
    const links: Link[] = [];
    const seasons = $('.aa-cnt.sub-menu').children();
    seasons.map((i, element) => {
      const title = $(element).find('a').text();
      const data = JSON.stringify({
        season: $(element).find('a').attr('data-season'),
        postid: $(element).find('a').attr('data-post'),
      });
      links.push({
        title,
        episodesLink: data,
      });
    });

    return {
      title,
      tags,
      synopsis,
      image,
      imdbId,
      cast,
      rating,
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
