import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from './header';
import {modExtractor} from '../mod/modGetStream';

export const uhdGetStream = async (url: string): Promise<Stream[]> => {
  try {
    let downloadLink = await modExtractor(url);

    // console.log(downloadLink.data);

    const ddl = downloadLink?.data?.match(/content="0;url=(.*?)"/)?.[1] || url;

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
