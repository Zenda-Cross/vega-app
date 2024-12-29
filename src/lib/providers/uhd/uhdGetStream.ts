import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from './header';

export const uhdGetStream = async (url: string): Promise<Stream[]> => {
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

    const ddl = downloadLink.data.match(/content="0;url=(.*?)"/)?.[1] || url;

    console.log('ddl', ddl);
    // console.log(ddl);
    const driveLink = await isDriveLink(ddl);
    const ServerLinks: Stream[] = [];

    const driveRes = await axios.get(driveLink, {headers});
    const driveHtml = driveRes.data;
    const $drive = cheerio.load(driveHtml);
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
        ServerLinks.push({
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

    // resume link
    try {
      const resumeDrive = driveLink.replace('/file', '/zfile');
      //   console.log('resumeDrive', resumeDrive);
      const resumeDriveRes = await axios.get(resumeDrive, {headers});
      const resumeDriveHtml = resumeDriveRes.data;
      const $resumeDrive = cheerio.load(resumeDriveHtml);
      const resumeLink = $resumeDrive('.btn-success').attr('href');
      //   console.log('resumeLink', resumeLink);
      if (resumeLink) {
        ServerLinks.push({
          server: 'ResumeCloud',
          link: resumeLink,
          type: 'mkv',
        });
      }
    } catch (err) {
      console.log('Resume link not found');
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
          ServerLinks.push({
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
          ServerLinks.push({
            server: 'Cf Worker 2.' + i,
            link: link,
            type: 'mkv',
          });
        }
      });
    } catch (err) {
      console.log('CF workers link not found', err);
    }

    console.log('ServerLinks', ServerLinks);
    return ServerLinks;
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
