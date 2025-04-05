import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Info, Link} from '../types';

export const sbGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    // console.log('url', url);
    const res = await axios.get(url, {headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const type = url.includes('tv') ? 'series' : 'movie';
    const imdbId = '';
    const title = $('.heading-name').text();
    // find only numbers in the string
    const rating =
      $('.btn-imdb')
        .text()
        ?.match(/\d+(\.\d+)?/g)?.[0] || '';
    const image =
      $('.cover_follow').attr('style')?.split('url(')[1]?.split(')')[0] || '';
    const synopsis = $('.description')
      .text()
      ?.replaceAll(/[\n\t]/g, '')
      ?.trim();

    const febID = $('.heading-name').find('a').attr('href')?.split('/')?.pop();
    const baseUrl = url.split('/').slice(0, 3).join('/');
    const indexUrl = `${baseUrl}/index/share_link?id=${febID}&type=${
      type === 'movie' ? '1' : '2'
    }`;
    // console.log('indexUrl', indexUrl);

    const indexRes = await axios.get(indexUrl, {headers});
    const indexData = indexRes.data;
    const febKey = indexData.data.link.split('/').pop();

    const febLink = `https://www.febbox.com/file/file_share_list?share_key=${febKey}&is_html=0`;
    // console.log('sbGetInfo', febLink);
    const febRes = await axios.get(febLink, {headers});
    const febData = febRes.data;
    const fileList = febData.data.file_list;

    const links: Link[] = [];
    fileList.map((file: any) => {
      const fileName = `${file.file_name} (${file.file_size})`;
      const fileId = file.fid;
      links.push({
        title: fileName,
        episodesLink: file.is_dir ? `${febKey}&${fileId}` : `${febKey}&`,
      });
    });

    return {
      title,
      rating,
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
