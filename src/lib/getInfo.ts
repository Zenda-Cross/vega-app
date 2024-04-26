import * as cheerio from 'cheerio';
import fetcher from './fetcher';

export interface Info {
  title: string;
  image: string;
  synopsis: string;
  imdbId: string;
  type: string;
}

export const getInfo = async (link: string): Promise<Info> => {
  try {
    const url = `https://vegamovies.ph/${link}`;
    const response = await fetcher(url);
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
    return {
      title,
      synopsis,
      image,
      imdbId,
      type,
    };
  } catch (error) {
    console.error('getInfo error');
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: '',
    };
  }
};
