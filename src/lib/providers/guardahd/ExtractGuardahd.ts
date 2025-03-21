import * as cheerio from 'cheerio';
import {superVideoExtractor} from '../superVideoExtractor';
import axios from 'axios';

export async function ExtractGuardahd({
  imdb,
  type,
  season,
  episode,
}: {
  imdb: string;
  type: string;
  season: string;
  episode: string;
}) {
  try {
    const baseUrl = 'https://guardahd.stream';
    const path = '/set-movie-a/' + imdb;
    const url = baseUrl + path;

    console.log('url:', url);
    const res = await axios.get(url, {timeout: 4000});
    const html = res.data;
    const $ = cheerio.load(html);
    const superVideoUrl = $('li:contains("supervideo")').attr('data-link');
    console.log('superVideoUrl:', superVideoUrl);

    if (!superVideoUrl) {
      return null;
    }
    const controller2 = new AbortController();
    const signal2 = controller2.signal;
    setTimeout(() => controller2.abort(), 4000);
    const res2 = await fetch('https:' + superVideoUrl, {signal: signal2});
    const data = await res2.text();
    //   console.log('mostraguarda data:', data);
    const streamUrl = await superVideoExtractor(data);
    return streamUrl;
  } catch (err) {
    console.error('Error in GetMostraguardaStram:', err);
  }
}
