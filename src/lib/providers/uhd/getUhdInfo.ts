import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Info, Link} from '../types';
import {uhdGetBaseurl} from './uhdGetBaseurl';
export default async function getUhdInfo(slug: string): Promise<Info> {
  try {
    const baseUrl = await uhdGetBaseurl();
    const url = baseUrl + slug;
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
              episodesLink: '',
              movieLinks: '',
              quality: '',
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
              episodesLink: '',
              movieLinks: '',
              quality: '',
              directLinks: episodesList,
            });
          }
        });
    });
    // console.log(episodes);
    return {
      title: title.replace('Download', '').trim(),
      image,
      imdbId: '',
      synopsis: '',
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
