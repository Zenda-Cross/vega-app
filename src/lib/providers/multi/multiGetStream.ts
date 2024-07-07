import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from './headers';

export const multiGetStream = async (
  url: string,
  type: string,
): Promise<Stream[]> => {
  try {
    const res = await axios.get(url, {headers});
    const html = res.data;
    const $ = cheerio.load(html);
    const streamLinks: Stream[] = [];
    const postId = $('#player-option-1').attr('data-post');
    const nume = $('#player-option-1').attr('data-nume');
    const typeValue = $('#player-option-1').attr('data-type');

    const baseUrl = url.split('/').slice(0, 3).join('/');
    console.log('baseUrl', baseUrl);

    const formData = new FormData();
    formData.append('action', 'doo_player_ajax');
    formData.append('post', postId);
    formData.append('nume', nume);
    formData.append('type', typeValue);

    console.log('formData', formData);

    const playerRes = await fetch(`${baseUrl}/wp-admin/admin-ajax.php`, {
      headers: headers,
      body: formData,
      method: 'POST',
    });
    const playerData = await playerRes.json();
    console.log('playerData', playerData);
    const ifameUrl =
      playerData?.embed_url?.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i)?.[1] ||
      playerData?.embed_url;
    console.log('ifameUrl', ifameUrl);
    const iframeRes = await axios.get(ifameUrl, {headers});
    const iframeData = iframeRes.data;
    const streamUrl = iframeData?.match(/file:\s*"([^"]+\.m3u8[^"]*)"/)?.[1];
    const subtitles: {
      lang: string;
      url: string;
    }[] = [];
    const subtitleMatch = iframeData?.match(/https:\/\/[^\s"]+\.vtt/g);
    // console.log('subtitleMatch', subtitleMatch);
    if (subtitleMatch?.length > 0) {
      subtitleMatch.forEach((sub: any) => {
        const lang = sub.match(/_([a-zA-Z]{3})\.vtt$/)[1];
        subtitles.push({lang: lang, url: sub});
      });
    }
    // console.log('streamUrl', subtitles);
    if (streamUrl) {
      streamLinks.push({
        server: 'Multi',
        link: streamUrl,
        type: 'm3u8',
        subtitles: subtitles,
      });
    }

    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
