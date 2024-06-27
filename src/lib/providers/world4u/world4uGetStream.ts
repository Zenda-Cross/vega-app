import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from './header';

export const world4uGetStream = async (
  url: string,
  type: string,
): Promise<Stream[]> => {
  try {
    if (type === 'movie') {
      const linkRes = await axios.get(url, {headers});
      const linkData = linkRes.data;
      const $ = cheerio.load(linkData);
      url = $('strong:contains("INSTANT")').parent().attr('href') || url;
    }

    // fastilinks
    if (url.includes('fastilinks')) {
      const fastilinksRes = await axios.get(url, {headers});
      const fastilinksData = fastilinksRes.data;
      const $$ = cheerio.load(fastilinksData);
      const fastilinksKey = $$(
        'input[name="_csrf_token_645a83a41868941e4692aa31e7235f2"]',
      ).attr('value');
      // console.log('fastilinksKey', fastilinksKey);
      const fastilinksFormData = new FormData();
      fastilinksFormData.append(
        '_csrf_token_645a83a41868941e4692aa31e7235f2',
        fastilinksKey,
      );
      const fastilinksRes2 = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: fastilinksFormData,
      });
      const fastilinksHtml = await fastilinksRes2.text();
      const $$$ = cheerio.load(fastilinksHtml);
      const fastilinksLink = $$$('a:contains("wlinkfast")').attr('href');
      console.log('fastilinksLink', fastilinksLink);
      url = fastilinksLink || url;
    }

    const res = await axios.get(url, {headers});
    console.log('world4uGetStream', type, url);
    const html = res.data;
    const key = html.match(/formData\.append\('key',\s*'(\d+)'\);/)?.[1] || '';
    console.log('key', key);
    const streamLinks: Stream[] = [];
    const formData = new FormData();
    formData.append('key', key);
    const streamRes = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    const data = await streamRes.json();
    const requireRepairRes = await axios.head(data.download);
    const contentType = requireRepairRes.headers['content-type'];
    console.log('contentType', contentType);
    if (contentType && contentType.includes('video')) {
      streamLinks.push({
        server: 'Mediafire',
        link: data.download,
        type: 'mkv',
      });
      return streamLinks;
    } else {
      const repairRes = await axios.get(data.download, {
        headers: {
          Referer: url,
        },
      });
      const repairHtml = repairRes.data;
      const $ = cheerio.load(repairHtml);
      const repairLink = $('#continue-btn').attr('href');
      console.log('repairLink', 'https://www.mediafire.com' + repairLink);
      const repairRequireRepairRes = await axios.get(
        'https://www.mediafire.com' + repairLink,
      );
      const $$ = cheerio.load(repairRequireRepairRes.data);
      const repairDownloadLink = $$('.input.popsok').attr('href');
      console.log('repairDownloadLink', repairDownloadLink);
      if (repairDownloadLink) {
        streamLinks.push({
          server: 'Mediafire',
          link: repairDownloadLink,
          type: 'mkv',
        });
      }
    }

    return streamLinks;
  } catch (err) {
    console.log(err);
    return [];
  }
};
