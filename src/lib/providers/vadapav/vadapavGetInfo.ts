import axios from 'axios';
import * as cheerio from 'cheerio';
import {EpisodeLink, Info, Link} from '../types';

export const vadapavGetInfo = async function (link: string): Promise<Info> {
  try {
    const baseUrl = link?.split('/').slice(0, 3).join('/');
    const url = link;
    const res = await axios.get(url);
    const data = res.data;
    const $ = cheerio.load(data);
    const title =
      $('.directory')
        .children()
        .first()
        .text()
        .trim()
        ?.split('/')
        .pop()
        ?.trim() || '';
    console.log('title', title);
    const links: Link[] = [];

    $('.directory-entry:not(:contains("Parent Directory"))').map(
      (i, element) => {
        const link = $(element).attr('href');
        if (link) {
          links.push({
            episodesLink: baseUrl + link,
            title: $(element).text(),
          });
        }
      },
    );
    const directLinks: EpisodeLink[] = [];
    $('.file-entry:not(:contains("Parent Directory"))').map((i, element) => {
      const link = $(element).attr('href');
      if (
        link &&
        ($(element).text()?.includes('.mp4') ||
          $(element).text()?.includes('.mkv'))
      ) {
        directLinks.push({
          title: i + 1 + '. ' + $(element).text(),
          link: baseUrl + link,
        });
      }
    });

    if (directLinks.length > 0) {
      links.push({
        title: title + ' DL',
        directLinks: directLinks,
      });
    }

    return {
      title: title,
      synopsis: '',
      image: '',
      imdbId: '',
      type: '',
      linkList: links,
    };
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
