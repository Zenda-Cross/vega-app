import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Info, Link} from '../types';

export const driveGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const type = $('.left-wrapper')
      .text()
      .toLocaleLowerCase()
      .includes('movie name')
      ? 'movie'
      : 'series';
    const imdbId = $('a:contains("IMDb")').attr('href')?.split('/')[4] || '';
    const title =
      $('.left-wrapper').find('strong:contains("Name")').next().text() ||
      $('.left-wrapper')
        .find('strong:contains("Name"),h5:contains("Name")')
        .find('span:first')
        .text();
    const synopsis =
      $('.left-wrapper')
        .find(
          'h2:contains("Storyline"),h3:contains("Storyline"),h5:contains("Storyline"),h4:contains("Storyline"),h4:contains("STORYLINE")',
        )
        .next()
        .text() ||
      $('.ipc-html-content-inner-div').text() ||
      '';
    const image =
      $('img.entered.lazyloaded,img.entered,img.litespeed-loaded').attr(
        'src',
      ) ||
      $('img.aligncenter').attr('src') ||
      '';

    // Links
    const links: Link[] = [];

    $(
      'a:contains("1080")a:not(:contains("Zip")),a:contains("720")a:not(:contains("Zip")),a:contains("480")a:not(:contains("Zip")),a:contains("2160")a:not(:contains("Zip")),a:contains("4k")a:not(:contains("Zip"))',
    ).map((i, element) => {
      const title = $(element).parent('h5').prev().text();
      const episodesLink = $(element).attr('href');
      const quality = title.match(/\b(480p|720p|1080p|2160p)\b/i)?.[0] || '';
      if (episodesLink && title) {
        links.push({
          title,
          episodesLink: type === 'series' ? episodesLink : '',
          directLinks:
            type === 'movie'
              ? [{title: 'Movie', link: episodesLink, type: 'movie'}]
              : [],
          quality: quality,
        });
      }
    });

    // console.log('drive meta', title, synopsis, image, imdbId, type, links);
    console.log('drive meta', links, type);
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
