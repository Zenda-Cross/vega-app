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
      url = servers[0].link;
    }

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

    const res2 = await fetch(
      `${url.split('?')[0]}/quantum-computer-speed-how-quick-is-it/`,
      {
        method: 'POST',
        body: bodyFormData,
      },
    );
    const html2: any = await res2.text();
    const link = html2.match(/setAttribute\("href",\s*"(.*?)"/)[1];
    // console.log(link);
    const cookie = link.split('=')[1];

    const downloadLink = await axios.get(link, {
      headers: {
        Referer: `${url.split('?')[0]}/quantum-computer-speed-how-quick-is-it/`,
        Cookie: `${cookie}=${wpHttp2}`,
      },
    });

    // console.log(downloadLink.data);

    const ddl = downloadLink.data.match(/content="0;url=(.*?)"/)[1];

    // console.log(ddl);
    // console.log(ddl);
    const driveLink = await isDriveLink(ddl);
    const driveRes = await axios.get(driveLink, {headers});
    const driveHtml = driveRes.data;
    const $drive = cheerio.load(driveHtml);
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
    return [
      {
        server: 'CfWorker',
        link: resumeBotDownloadData.url,
      },
    ];
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
    console.log(`https://${mainUrl}${path}`);
    return `https://${mainUrl}${path}`;
  } else {
    return ddl;
  }
};
