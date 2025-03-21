import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';
export async function pwGetInfo(link: string): Promise<Info> {
  try {
    const url = link;
    const baseUrl = link.split('/').slice(0, 3).join('/');
    const res = await axios.get(url, {headers});
    const html = await res.data;
    const $ = cheerio.load(html);

    const imdbId =
      $('.movie_info')
        .find('a[href*="imdb.com/title/tt"]:not([href*="imdb.com/title/tt/"])')
        .attr('href')
        ?.split('/')[4] || '';

    const type = $('.show_season').html() ? 'series' : 'movie';
    console.log('pwGetInfo', imdbId, type);
    // Links
    const linkList: Link[] = [];

    // tv series
    $('.show_season').each((i, element) => {
      const seasonTitle = 'Season ' + $(element).attr('data-id');
      const episodes: Link['directLinks'] = [];
      $(element)
        .children()
        .each((i, element2) => {
          const episodeTitle = $(element2)
            .find('a')
            .children()
            .remove()
            .end()
            .text()
            .trim()
            .replace('E', 'Epiosode ');
          const episodeLink = baseUrl + $(element2).find('a').attr('href');
          if (episodeTitle && episodeLink) {
            episodes.push({
              title: episodeTitle,
              link: episodeLink,
            });
          }
        });
      linkList.push({
        title: seasonTitle,
        directLinks: episodes,
      });
    });

    if (type === 'movie') {
      linkList.push({
        title: 'Movie',
        directLinks: [
          {
            link: link,
            title: 'Movie',
            type: 'movie',
          },
        ],
      });
    }
    return {
      title: '',
      image: '',
      imdbId: imdbId,
      synopsis: '',
      type: type,
      linkList: linkList,
    };
  } catch (error) {
    console.error(error);
    return {
      title: '',
      image: '',
      imdbId: '',
      synopsis: '',
      linkList: [],
      type: 'uhd',
    };
  }
}
