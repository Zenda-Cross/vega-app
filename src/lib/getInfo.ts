import * as cheerio from 'cheerio';
import axios from 'axios';
import {headers} from './header';
import {MMKV} from '../App';
import {ToastAndroid} from 'react-native';

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
  quality: string;
  movieLinks: string;
  episodesLink: string;
}

export const getInfo = async (link: string): Promise<Info> => {
  try {
    let baseUrl = '';
    if (MMKV.getBool('UseCustomUrl')) {
      baseUrl = MMKV.getString('baseUrl') || '';
    } else {
      const baseUrlRes = await axios.get(
        'https://himanshu8443.github.io/providers/modflix.json',
      );
      baseUrl = baseUrlRes.data.Vega.url;
    }
    const url = `${baseUrl}/${link}`;
    console.log('url', url);
    const response = await axios.get(url, {headers});
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
    // console.log(image);

    // console.log({title, synopsis, image, imdbId, type});
    /// Links
    const hr = infoContainer?.first()?.find('hr');
    const list = hr?.nextUntil('hr');
    const links: Link[] = [];
    list.each((index, element: any) => {
      element = $(element);
      // title
      const title =
        element
          ?.text()
          .match(/^(?:\[?[^\[\{]+)(?=\{[^\}]+\}|\[[^\]]+\]|$)/)?.[0] +
          (element?.text().match(/\d+p\b/)?.[0] || '') || '';

      const quality = element?.text().match(/\d+p\b/)?.[0] || '';
      // console.log(title);
      // movieLinks
      const movieLinks = element
        ?.next()
        .find('.dwd-button')
        .text()
        .toLowerCase()
        .includes('download')
        ? element?.next().find('.dwd-button')?.parent()?.attr('href')
        : '';

      // episode links
      const vcloudLinks = element
        ?.next()
        .find(
          ".btn-outline[style='background:linear-gradient(135deg,#ed0b0b,#f2d152); color: white;']",
        )
        ?.parent()
        ?.attr('href');
      const episodesLink =
        (vcloudLinks
          ? vcloudLinks
          : element
              ?.next()
              .find('.dwd-button')
              .text()
              .toLowerCase()
              .includes('episode')
          ? element?.next().find('.dwd-button')?.parent()?.attr('href')
          : '') ||
        element
          ?.next()
          .find(
            ".btn-outline[style='background:linear-gradient(135deg,#0ebac3,#09d261); color: white;']",
          )
          ?.parent()
          ?.attr('href');
      if (movieLinks || episodesLink) {
        links.push({title, movieLinks, episodesLink, quality});
      }
    });
    // console.log(links);
    return {
      title,
      synopsis,
      image,
      imdbId,
      type,
      linkList: links,
    };
  } catch (error) {
    console.log('getInfo error');
    // console.error(error);
    ToastAndroid.show('No Network', ToastAndroid.SHORT);
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
