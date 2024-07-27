import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {ToastAndroid} from 'react-native';
import {Stream} from '../types';
import {hubcloudExtracter} from '../vega/getStream';
import {getRedirectLinks} from './getRedirectLinks';

export async function hdhub4uGetStream(
  link: string,
  type: string,
  signal: AbortSignal,
) {
  const streamLinks: Stream[] = [];
  let hubdriveLink = '';

  if (link.includes('hubdrive')) {
    const hubdriveRes = await axios.get(link, {headers, signal});
    const hubdriveText = hubdriveRes.data;
    const $ = cheerio.load(hubdriveText);
    hubdriveLink =
      $('.btn.btn-primary.btn-user.btn-success1.m-1').attr('href') || link;
  } else {
    if (link.includes('hdhub4u')) {
      link = 'https://max.offerboom.top/?id=' + link.split('id=')[1];
    }
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
    ) || [];
  // console.log('hubcloudLink', hubcloudLink[1]);
  try {
    return await hubcloudExtracter(hubcloudLink[1], streamLinks, signal);
  } catch (error: any) {
    console.log('getStream error: ', error);
    if (error.message.includes('Aborted')) {
      // ToastAndroid.show('Request Aborted', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show(
        `Error getting stream links ${error.message}`,
        ToastAndroid.SHORT,
      );
    }
    return [];
  }
}
