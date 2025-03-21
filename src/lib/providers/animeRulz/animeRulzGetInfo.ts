import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const animeRulzGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    console.log('az url', url);
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const meta = {
      title: $('h2.leading-tight').text().trim(),
      synopsis: $('[data-synopsis]').text().trim(),
      image: $('.w-max.h-auto.rounded-sm.shadow-sm').attr('src') || '',
      imdbId: '',
      type: $('.thecontent').text().toLocaleLowerCase().includes('season')
        ? 'series'
        : 'movie',
      tags: $('.font-normal.leading-6')
        .map((i, elem) => $(elem).text().trim())
        .slice(0, 2)
        .get(),
    };
    // console.log('rz meta', meta);
    const links: Link[] = [];
    const episodes: Link['directLinks'] = [];

    // replace non
    const totalEpisodes = Number(
      $('a:contains("Ep ")').text().replace(/\D/g, ''),
    );
    const episodeLink = $('a:contains("Ep ")').attr('href') || '';
    console.log('total episodes', totalEpisodes);
    for (let i = 1; i <= totalEpisodes; i++) {
      const episode = {
        title: `Episode ${i}`,
        link: `${
          episodeLink.replace(totalEpisodes.toString(), i.toString()) || ''
        }`,
      };
      episodes.push(episode);
    }
    links.push({title: meta.title, directLinks: episodes});
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
