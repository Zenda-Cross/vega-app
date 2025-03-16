import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Info, Link} from '../types';
export async function getUhdInfo(link: string): Promise<Info> {
  try {
    const url = link;
    const res = await axios.get(url, {headers});
    const html = await res.data;
    const $ = cheerio.load(html);

    const title = $('h2:first').text() || '';
    const image = $('h2').siblings().find('img').attr('src') || '';
    const trailer = $('iframe').attr('src') || '';

    // console.log({ title, image, trailer });

    // Links
    const episodes: Link[] = [];

    // new structure
    $('.mks_separator').each((index, element) => {
      $(element)
        .nextUntil('.mks_separator')
        .each((index, element) => {
          const title = $(element).text();
          const episodesList: {title: string; link: string}[] = [];
          $(element)
            .next('p')
            .find('a')
            .each((index, element) => {
              const title = $(element).text();
              const link = $(element).attr('href');
              if (title && link && !title.toLocaleLowerCase().includes('zip')) {
                episodesList.push({title, link});
                //   console.log({ title, link });
              }
            });
          if (title && episodesList.length > 0) {
            episodes.push({
              title,
              directLinks: episodesList,
            });
          }
        });
    });

    // old structure
    $('hr').each((index, element) => {
      $(element)
        .nextUntil('hr')
        .each((index, element) => {
          const title = $(element).text();
          const episodesList: {title: string; link: string}[] = [];
          $(element)
            .next('p')
            .find('a')
            .each((index, element) => {
              const title = $(element).text();
              const link = $(element).attr('href');
              if (title && link && !title.toLocaleLowerCase().includes('zip')) {
                episodesList.push({title, link});
                //   console.log({ title, link });
              }
            });
          if (title && episodesList.length > 0) {
            episodes.push({
              title,
              directLinks: episodesList,
            });
          }
        });
    });
    // console.log(episodes);
    return {
      title: title.match(/^Download\s+([^(\[]+)/i)
        ? title?.match(/^Download\s+([^(\[]+)/i)?.[1] || ''
        : title.replace('Download', '') || '',
      image,
      imdbId: '',
      synopsis: title,
      type: '',
      linkList: episodes,
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
