import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {hubcloudExtracter} from '../hubcloudExtractor';
import {getRedirectLinks} from './getRedirectLinks';
import {decodeString} from './decoder';

export async function hdhub4uGetStream(
  link: string,
  type: string,
  signal: AbortSignal,
) {
  let hubdriveLink = '';

  if (link.includes('hubdrive')) {
    const hubdriveRes = await axios.get(link, {headers, signal});
    const hubdriveText = hubdriveRes.data;
    const $ = cheerio.load(hubdriveText);
    hubdriveLink =
      $('.btn.btn-primary.btn-user.btn-success1.m-1').attr('href') || link;
  } else {
    const res = await axios.get(link, {headers, signal});
    const text = res.data;
    const encryptedString = text.split("s('o','")?.[1]?.split("',180")?.[0];
    console.log('encryptedString', encryptedString);
    const decodedString: any = decodeString(encryptedString);
    console.log('decodedString', decodedString);
    link = atob(decodedString?.o);
    console.log('new link', link);

    const redirectLink = await getRedirectLinks(link, signal);
    console.log('redirectLink', redirectLink);

    const redirectLinkRes = await axios.get(redirectLink, {headers, signal});
    const redirectLinkText = redirectLinkRes.data;
    const $ = cheerio.load(redirectLinkText);
    hubdriveLink =
      $('h3:contains("1080p")').find('a').attr('href') ||
      redirectLinkText.match(
        /href="(https:\/\/hubcloud\.[^\/]+\/drive\/[^"]+)"/,
      )[1];
    if (hubdriveLink.includes('hubdrive')) {
      const hubdriveRes = await axios.get(hubdriveLink, {headers, signal});
      const hubdriveText = hubdriveRes.data;
      const $$ = cheerio.load(hubdriveText);
      hubdriveLink =
        $$('.btn.btn-primary.btn-user.btn-success1.m-1').attr('href') ||
        hubdriveLink;
    }
    console.log('hubdriveLink', hubdriveLink);
  }
  const hubdriveLinkRes = await axios.get(hubdriveLink, {headers, signal});
  const hubcloudText = hubdriveLinkRes.data;
  const hubcloudLink =
    hubcloudText.match(
      /<META HTTP-EQUIV="refresh" content="0; url=([^"]+)">/i,
    )?.[1] || hubdriveLink;
  // console.log('hubcloudLink', hubcloudLink[1]);
  try {
    return await hubcloudExtracter(hubcloudLink, signal);
  } catch (error: any) {
    console.log('hd hub 4 getStream error: ', error);
    return [];
  }
}
