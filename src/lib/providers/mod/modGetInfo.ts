import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Info, Link} from '../types';

export const modGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const meta = {
      title: $('.imdbwp__title').text(),
      synopsis: $('.imdbwp__teaser').text(),
      image: $('.imdbwp__thumb').find('img').attr('src') || '',
      imdbId: $('.imdbwp__link').attr('href')?.split('/')[4] || '',
      type: $('.thecontent').text().toLocaleLowerCase().includes('season')
        ? 'series'
        : 'movie',
    };
    const links: Link[] = [];

    $('h3,h4').map((i, element) => {
      const seriesTitle = $(element).text();
      // const batchZipLink = $(element)
      //   .next("p")
      //   .find(".maxbutton-batch-zip,.maxbutton-zip-download")
      //   .attr("href");
      const episodesLink = $(element)
        .next('p')
        .find(
          '.maxbutton-episode-links,.maxbutton-g-drive,.maxbutton-af-download',
        )
        .attr('href');
      const movieLink = $(element)
        .next('p')
        .find('.maxbutton-download-links')
        .attr('href');

      if (
        movieLink ||
        (episodesLink && episodesLink !== 'javascript:void(0);')
      ) {
        links.push({
          title: seriesTitle.replace('Download ', '').trim() || 'Download',
          episodesLink: episodesLink || '',
          directLinks: movieLink
            ? [{link: movieLink, title: 'Movie', type: 'movie'}]
            : [],
          quality: seriesTitle?.match(/\d+p\b/)?.[0] || '',
        });
      }
    });
    // console.log('mod meta', links);
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
