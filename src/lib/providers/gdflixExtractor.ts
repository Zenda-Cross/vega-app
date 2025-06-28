import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from './types';
import {headers} from './headers';

export async function gdFlixExtracter(link: string, signal: AbortSignal) {
  try {
    const streamLinks: Stream[] = [];
    const res = await axios(`${link}`, {headers, signal});
    console.log('gdFlixExtracter', link);
    const data = res.data;
    let $drive = cheerio.load(data);
    // handle if redirected to another link

    if ($drive('body').attr('onload')?.includes('location.replace')) {
      const newLink = $drive('body')
        .attr('onload')
        ?.split("location.replace('")?.[1]
        .split("'")?.[0];

      console.log('newLink', newLink);
      if (newLink) {
        const newRes = await axios.get(newLink, {headers, signal});
        $drive = cheerio.load(newRes.data);
      }
    }

    // try {
    //   const resumeBot = $drive('.fab.fa-artstation').prev().attr('href') || '';
    //   console.log('resumeBot', resumeBot);
    //   const resumeBotRes = await axios.get(resumeBot, {headers});
    //   const resumeBotToken = resumeBotRes.data.match(
    //     /formData\.append\('token', '([a-f0-9]+)'\)/,
    //   )[1];
    //   const resumeBotBody = new FormData();
    //   resumeBotBody.append('token', resumeBotToken);
    //   const resumeBotPath = resumeBotRes.data.match(
    //     /fetch\('\/download\?id=([a-zA-Z0-9\/+]+)'/,
    //   )[1];
    //   const resumeBotBaseUrl = resumeBot.split('/download')[0];
    //   // console.log(
    //   //   'resumeBotPath',
    //   //   resumeBotBaseUrl + '/download?id=' + resumeBotPath,
    //   // );
    //   // console.log('resumeBotBody', resumeBotToken);

    //   const resumeBotDownload = await fetch(
    //     resumeBotBaseUrl + '/download?id=' + resumeBotPath,
    //     {
    //       method: 'POST',
    //       body: resumeBotBody,
    //       headers: {
    //         Referer: resumeBot,
    //         Cookie: 'PHPSESSID=7e9658ce7c805dab5bbcea9046f7f308',
    //       },
    //     },
    //   );
    //   const resumeBotDownloadData = await resumeBotDownload.json();
    //   console.log('resumeBotDownloadData', resumeBotDownloadData.url);
    //   streamLinks.push({
    //     server: 'ResumeBot',
    //     link: resumeBotDownloadData.url,
    //     type: 'mkv',
    //   });
    // } catch (err) {
    //   console.log('ResumeBot link not found', err);
    // }

    // r2
    try {
      const r2Link =
        $drive('..btn.btn-outline-success').attr('href') ||
        $drive('a:contains("CLOUD DOWNLOAD")').attr('href') ||
        '';
      console.log('r2Link', r2Link);
      if (r2Link) {
        streamLinks.push({
          server: 'R2',
          link: r2Link,
          type: 'mkv',
        });
      }
    } catch (err) {
      console.log('R2 link not found', err);
    }

    // pixel drain
    try {
      const pixelDrainLink = $drive('.btn.btn-success').attr('href') || '';
      console.log('pixelDrainLink', pixelDrainLink);
      if (pixelDrainLink) {
        streamLinks.push({
          server: 'PixelDrain',
          link: pixelDrainLink,
          type: 'mkv',
        });
      }
    } catch (err) {
      console.log('PixelDrain link not found', err);
    }
    /// resume cloud
    try {
      const baseUrl = link.split('/').slice(0, 3).join('/');
      const resumeDrive = $drive('.btn-secondary').attr('href') || '';
      console.log('resumeDrive', resumeDrive);
      const hostname = resumeDrive.split('/')[2] || '';
      console.log('hostname', hostname);
      if (resumeDrive.includes('indexbot') || hostname.includes('bot')) {
        const resumeBotRes = await axios.get(resumeDrive, {headers});
        console.log('resumeBotRes', resumeBotRes.data);
        const resumeBotToken = resumeBotRes.data.match(
          /formData\.append\('token', '([a-f0-9]+)'\)/,
        )[1];
        console.log('resumeBotToken', resumeBotToken);
        const resumeBotBody = new FormData();
        resumeBotBody.append('token', resumeBotToken);
        const resumeBotPath = resumeBotRes.data.match(
          /fetch\('\/download\?id=([a-zA-Z0-9\/+]+)'/,
        )[1];
        const resumeBotBaseUrl = resumeDrive.split('/download')[0];
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
              Referer: resumeDrive,
              Cookie: 'PHPSESSID=7e9658ce7c805dab5bbcea9046f7f308',
            },
          },
        );
        const resumeBotDownloadData = await resumeBotDownload.json();
        console.log('resumeBotDownloadData', resumeBotDownloadData.url);
        streamLinks.push({
          server: 'ResumeBot',
          link: resumeBotDownloadData.url,
          type: 'mkv',
        });
      } else {
        const url = baseUrl + resumeDrive;
        const resumeDriveRes = await axios.get(url, {headers});
        const resumeDriveHtml = resumeDriveRes.data;
        const $resumeDrive = cheerio.load(resumeDriveHtml);
        const resumeLink = $resumeDrive('.btn-success').attr('href');
        //   console.log('resumeLink', resumeLink);
        if (resumeLink) {
          streamLinks.push({
            server: 'ResumeCloud',
            link: resumeLink,
            type: 'mkv',
          });
        }
      }
    } catch (err) {
      console.log('Resume link not found', err);
    }

    //instant link
    try {
      const seed = $drive('.btn-danger').attr('href') || '';
      console.log('seed', seed);
      if (!seed.includes('?url=')) {
        const newLinkRes = await axios.head(seed, {headers, signal});
        console.log('newLinkRes', newLinkRes.request?.responseURL);
        const newLink =
          newLinkRes.request?.responseURL?.split('?url=')?.[1] || seed;
        streamLinks.push({server: 'G-Drive', link: newLink, type: 'mkv'});
      } else {
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
          streamLinks.push({
            server: 'Gdrive-Instant',
            link: instantLink,
            type: 'mkv',
          });
        } else {
          console.log('Instant link not found', instantLinkData);
        }
      }
    } catch (err) {
      console.log('Instant link not found', err);
    }
    return streamLinks;
  } catch (error) {
    console.log('gdflix error: ', error);
    return [];
  }
}
