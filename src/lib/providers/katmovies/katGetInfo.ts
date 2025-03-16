import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const katGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const container = $('.yQ8hqd.ksSzJd.LoQAYe').html()
      ? $('.yQ8hqd.ksSzJd.LoQAYe')
      : $('.FxvUNb');
    const imdbId =
      container
        .find('a[href*="imdb.com/title/tt"]:not([href*="imdb.com/title/tt/"])')
        .attr('href')
        ?.split('/')[4] || '';
    const title = container
      .find('li:contains("Name")')
      .children()
      .remove()
      .end()
      .text();
    const type = $('.yQ8hqd.ksSzJd.LoQAYe').html() ? 'series' : 'movie';
    const synopsis = container.find('li:contains("Stars")').text();
    const image =
      $('h4:contains("SCREENSHOTS")').next().find('img').attr('src') || '';

    console.log('katGetInfo', title, synopsis, image, imdbId, type);

    // Links
    const links: Link[] = [];
    const directLink: Link['directLinks'] = [];

    // direct links
    $('.entry-content')
      .find('p:contains("Episode")')
      .each((i, element) => {
        const dlLink =
          $(element)
            .nextAll('h3,h2')
            .first()
            .find('a:contains("1080"),a:contains("720"),a:contains("480")')
            .attr('href') || '';
        const dlTitle = $(element).find('span').text();

        if (link.trim().length > 0 && dlTitle.includes('Episode ')) {
          directLink.push({
            title: dlTitle,
            link: dlLink,
          });
        }
      });

    if (directLink.length > 0) {
      links.push({
        quality: '',
        title: title,
        directLinks: directLink,
      });
    }

    $('.entry-content')
      .find('pre')
      .nextUntil('div')
      .filter('h2')
      .each((i, element) => {
        const link = $(element).find('a').attr('href');
        const quality =
          $(element)
            .text()
            .match(/\b(480p|720p|1080p|2160p)\b/i)?.[0] || '';
        const title = $(element).text();
        if (link && title.includes('')) {
          links.push({
            quality,
            title,
            episodesLink: link,
          });
        }
      });

    if (links.length === 0 && type === 'movie') {
      $('.entry-content')
        .find('h2:contains("DOWNLOAD"),h3:contains("DOWNLOAD")')
        .nextUntil('pre,div')
        .filter('h2')
        .each((i, element) => {
          const link = $(element).find('a').attr('href');
          const quality =
            $(element)
              .text()
              .match(/\b(480p|720p|1080p|2160p)\b/i)?.[0] || '';
          const title = $(element).text();
          if (link && !title.includes('Online')) {
            links.push({
              quality,
              title,
              directLinks: [{link, title, type: 'movie'}],
            });
          }
        });
    }

    // console.log('drive meta', title, synopsis, image, imdbId, type, links);
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
