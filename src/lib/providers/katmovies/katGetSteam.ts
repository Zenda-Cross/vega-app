import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Stream} from '../types';
import {hubcloudExtracter} from '../hubcloudExtractor';
import {extractKmhdLink} from './katGetEpsodes';
import {gdFlixExtracter} from '../gdflixExtractor';

export async function katGetStream(
  link: string,
  type: string,
  signal: AbortSignal,
) {
  const streamLinks: Stream[] = [];
  console.log('katGetStream', link);
  try {
    if (link.includes('gdflix')) {
      const gdflixRes = await gdFlixExtracter(link, signal);
      return gdflixRes;
    }
    if (link.includes('kmhd')) {
      const hubcloudLink = await extractKmhdLink(link);
      const stereams = await hubcloudExtracter(hubcloudLink, signal);
      return stereams;
    }
    if (link.includes('gdflix')) {
      // resume link
      try {
        const resumeDrive = link.replace('/file', '/zfile');
        //   console.log('resumeDrive', resumeDrive);
        const resumeDriveRes = await axios.get(resumeDrive, {headers});
        const resumeDriveHtml = resumeDriveRes.data;
        const $resumeDrive = cheerio.load(resumeDriveHtml);
        const resumeLink = $resumeDrive('.btn-success').attr('href');
        console.log('resumeLink', resumeLink);
        if (resumeLink) {
          streamLinks.push({
            server: 'ResumeCloud',
            link: resumeLink,
            type: 'mkv',
          });
        }
      } catch (err) {
        console.log('Resume link not found');
      }
      //instant link
      try {
        const driveres = await axios.get(link, {headers, timeout: 10000});
        const $drive = cheerio.load(driveres.data);
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
        console.log('instantLinkData', instantLinkData);
        if (instantLinkData.error === false) {
          const instantLink = instantLinkData.url;
          streamLinks.push({
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
      return streamLinks;
    }
    const stereams = await hubcloudExtracter(link, signal);
    return stereams;
  } catch (error: any) {
    console.log('katgetStream error: ', error);
    return [];
  }
}
