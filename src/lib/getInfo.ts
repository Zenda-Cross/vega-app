import * as cheerio from 'cheerio';
import axios from 'axios';

export interface Info {
  title: string;
  image: string;
  synopsis: string;
  imdbId: string;
  type: string;
  linkList?: Link[];
}

export interface Link {
  title: string;
  movieLinks: string;
  episodeLinks: string;
}

export const getInfo = async (link: string): Promise<Info> => {
  try {
    const url = `https://vegamovies.ph/${link}`;
    const response = await axios(url);
    const $ = cheerio.load(response.data);
    const infoContainer = $('.entry-content');
    const heading = infoContainer?.find('h3');
    const imdbId =
      heading?.next('p')?.find('a')?.[0]?.attribs?.href?.match(/tt\d+/g)?.[0] ||
      infoContainer.text().match(/tt\d+/g)?.[0] ||
      '';
    // console.log(imdbId)

    const type = heading?.next('p')?.text()?.includes('Series Name')
      ? 'series'
      : 'movie';
    //   console.log(type);
    // title
    const titleRegex =
      type === 'series' ? /Series Name: (.+)/ : /Movie Name: (.+)/;
    const title = heading?.next('p')?.text()?.match(titleRegex)?.[1] || '';
    //   console.log(title);

    // synopsis
    const synopsis =
      infoContainer?.find('p')?.next('h3,h4')?.next('p')?.[0]?.children?.[0]
        ?.data || '';
    //   console.log(synopsis);

    // image
    const image =
      infoContainer?.find('img[data-lazy-src]')?.attr('data-lazy-src') || '';
    //   console.log(image);

    console.log({title, synopsis, image, imdbId, type});
    /// Links
    const hr = infoContainer?.first()?.find('hr');
    const list = hr?.nextUntil('hr');
    const links: Link[] = [];
    list.each((index, element: any) => {
      element = $(element);
      const title = element?.text() || '';
      // console.log(title);
      // movieLinks
      const movieLinks = element
        ?.next()
        .find('.dwd-button')
        ?.parent()
        ?.attr('href');

      // episode links
      const episodeLinks = element
        ?.next()
        .find(
          ".btn-outline[style='background:linear-gradient(135deg,#0ebac3,#09d261); color: white;']",
        )
        ?.parent()
        ?.attr('href');
      if (movieLinks || episodeLinks) {
        links.push({title, movieLinks, episodeLinks});
      }
    });
    console.log(links);
    return {
      title,
      synopsis,
      image,
      imdbId,
      type,
      linkList: links,
    };
  } catch (error) {
    console.error('getInfo error');
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
