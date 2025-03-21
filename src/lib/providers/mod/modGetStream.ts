import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from './header';
import {modGetEpisodeLinks} from './modGetEpisodesList';

export const modGetStream = async (
  url: string,
  type: string,
): Promise<Stream[]> => {
  try {
    console.log('modGetStream', type, url);
    if (type === 'movie') {
      const servers = await modGetEpisodeLinks(url);
      url = servers[0].link || url;
    }

    let downloadLink = await modExtractor(url);

    // console.log(downloadLink.data);

    const ddl = downloadLink?.data?.match(/content="0;url=(.*?)"/)?.[1] || url;
    // console.log('ddl', url);

    // console.log(ddl);
    // console.log(ddl);
    const servers: Stream[] = [];
    const driveLink = await isDriveLink(ddl);
    const driveRes = await axios.get(driveLink, {headers});
    const driveHtml = driveRes.data;
    const $drive = cheerio.load(driveHtml);

    try {
      const resumeBot = $drive('.btn.btn-light').attr('href') || '';
      const resumeBotRes = await axios.get(resumeBot, {headers});
      const resumeBotToken = resumeBotRes.data.match(
        /formData\.append\('token', '([a-f0-9]+)'\)/,
      )[1];
      const resumeBotBody = new FormData();
      resumeBotBody.append('token', resumeBotToken);
      const resumeBotPath = resumeBotRes.data.match(
        /fetch\('\/download\?id=([a-zA-Z0-9\/+]+)'/,
      )[1];
      const resumeBotBaseUrl = resumeBot.split('/download')[0];
      // console.log(
      //   'resumeBotPath',
      //   resumeBotBaseUrl + '/download?id=' + resumeBotPath,
      // );
      // console.log('resumeBotBody', resumeBotToken);

      const resumeBotDownload = await fetch(
        resumeBotBaseUrl + '/download?id=' + resumeBotPath,
        {
          method: 'POST',
          body: resumeBotBody,
          headers: {
            Referer: resumeBot,
            Cookie: 'PHPSESSID=7e9658ce7c805dab5bbcea9046f7f308',
          },
        },
      );
      const resumeBotDownloadData = await resumeBotDownload.json();
      console.log('resumeBotDownloadData', resumeBotDownloadData.url);
      servers.push({
        server: 'ResumeBot',
        link: resumeBotDownloadData.url,
        type: 'mkv',
      });
    } catch (err) {
      console.log('ResumeBot link not found', err);
    }
    // CF workers type 1
    try {
      const cfWorkersLink = driveLink.replace('/file', '/wfile') + '?type=1';
      const cfWorkersRes = await axios.get(cfWorkersLink, {headers});
      const cfWorkersHtml = cfWorkersRes.data;
      const $cfWorkers = cheerio.load(cfWorkersHtml);
      const cfWorkersStream = $cfWorkers('.btn-success');
      cfWorkersStream.each((i, el) => {
        const link = el.attribs.href;
        if (link) {
          servers.push({
            server: 'Cf Worker 1.' + i,
            link: link,
            type: 'mkv',
          });
        }
      });
    } catch (err) {
      console.log('CF workers link not found', err);
    }

    // CF workers type 2
    try {
      const cfWorkersLink = driveLink.replace('/file', '/wfile') + '?type=2';
      const cfWorkersRes = await axios.get(cfWorkersLink, {headers});
      const cfWorkersHtml = cfWorkersRes.data;
      const $cfWorkers = cheerio.load(cfWorkersHtml);
      const cfWorkersStream = $cfWorkers('.btn-success');
      cfWorkersStream.each((i, el) => {
        const link = el.attribs.href;
        if (link) {
          servers.push({
            server: 'Cf Worker 2.' + i,
            link: link,
            type: 'mkv',
          });
        }
      });
    } catch (err) {
      console.log('CF workers link not found', err);
    }

    // gdrive

    //instant link
    try {
      const seed = $drive('.btn-danger').attr('href') || '';
      const instantToken = seed.split('=')[1];
      //   console.log('InstantToken', instantToken);
      const InstantFromData = new FormData();
      InstantFromData.append('keys', instantToken);
      const videoSeedUrl = seed.split('/').slice(0, 3).join('/') + '/api';
      //   console.log('videoSeedUrl', videoSeedUrl);
      const instantLinkRes = await fetch(videoSeedUrl, {
        method: 'POST',
        body: InstantFromData,
        headers: {
          'x-token': videoSeedUrl,
        },
      });
      const instantLinkData = await instantLinkRes.json();
      //   console.log('instantLinkData', instantLinkData);
      if (instantLinkData.error === false) {
        const instantLink = instantLinkData.url;
        servers.push({
          server: 'Gdrive-Instant',
          link: instantLink,
          type: 'mkv',
        });
      } else {
        console.log('Instant link not found', instantLinkData);
      }
    } catch (err) {
      console.log('Instant link not found', err);
    }
    return servers;
  } catch (err) {
    console.log('getStream error', err);
    return [];
  }
};

const isDriveLink = async (ddl: string) => {
  if (ddl.includes('drive')) {
    const driveLeach = await axios.get(ddl);
    const path = driveLeach.data.match(
      /window\.location\.replace\("([^"]+)"\)/,
    )[1];
    const mainUrl = ddl.split('/')[2];
    console.log(`driveUrl = https://${mainUrl}${path}`);
    return `https://${mainUrl}${path}`;
  } else {
    return ddl;
  }
};

export async function modExtractor(url: string) {
  try {
    const wpHttp = url.split('sid=')[1];
    var bodyFormData0 = new FormData();
    bodyFormData0.append('_wp_http', wpHttp);
    const res = await fetch(url.split('?')[0], {
      method: 'POST',
      body: bodyFormData0,
    });
    const data = await res.text();
    // console.log('', data);
    const html = data;
    const $ = cheerio.load(html);

    // find input with name="_wp_http2"
    const wpHttp2 = $('input').attr('name', '_wp_http2').val();

    // console.log('wpHttp2', wpHttp2);

    // form data
    var bodyFormData = new FormData();
    bodyFormData.append('_wp_http2', wpHttp2);
    const formUrl1 = $('form').attr('action');
    const formUrl = formUrl1 || url.split('?')[0];

    const res2 = await fetch(formUrl, {
      method: 'POST',
      body: bodyFormData,
    });
    const html2: any = await res2.text();
    const link = html2.match(/setAttribute\("href",\s*"(.*?)"/)[1];
    console.log(link);
    const cookie = link.split('=')[1];
    console.log('cookie', cookie);

    const downloadLink = await axios.get(link, {
      headers: {
        Referer: formUrl,
        Cookie: `${cookie}=${wpHttp2}`,
      },
    });
    return downloadLink;
  } catch (err) {
    console.log('modGetStream error', err);
  }
}
