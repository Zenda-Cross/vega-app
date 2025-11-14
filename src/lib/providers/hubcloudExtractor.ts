import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from './types';
import {headers} from './headers';

const decode = function (value: string) {
  if (value === undefined) {
    return '';
  }
  return atob(value.toString());
};

export async function hubcloudExtracter(link: string, signal: AbortSignal) {
  try {
    console.log('hubcloudExtracter', link);
    const baseUrl = link.split('/').slice(0, 3).join('/');
    const streamLinks: Stream[] = [];
    const vLinkRes = await axios(`${link}`, {headers, signal});
    const vLinkText = vLinkRes.data;
    const $vLink = cheerio.load(vLinkText);
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [];
    let vcloudLink =
      decode(vLinkRedirect[1]?.split('r=')?.[1]) ||
      vLinkRedirect[1] ||
      $vLink('.fa-file-download.fa-lg').parent().attr('href') ||
      link;
    console.log('vcloudLink', vcloudLink);
    if (vcloudLink?.startsWith('/')) {
      vcloudLink = `${baseUrl}${vcloudLink}`;
      console.log('New vcloudLink', vcloudLink);
    }
    const vcloudRes = await fetch(vcloudLink, {
      headers,
      signal,
      redirect: 'follow',
    });
    const $ = cheerio.load(await vcloudRes.text());
    // console.log('vcloudRes', $.text());

    const linkClass = $('.btn-success.btn-lg.h6,.btn-danger,.btn-secondary');
    for (const element of linkClass) {
      const itm = $(element);
      let link = itm.attr('href') || '';

      switch (true) {
        case link?.includes('.dev') && !link?.includes('/?id='):
          streamLinks.push({server: 'Cf Worker', link: link, type: 'mkv'});
          break;

        case link?.includes('pixeld'):
          if (!link?.includes('api')) {
            const token = link.split('/').pop();
            const baseUrl = link.split('/').slice(0, -2).join('/');
            link = `${baseUrl}/api/file/${token}?download`;
          }
          streamLinks.push({server: 'Pixeldrain', link: link, type: 'mkv'});
          break;

        case link?.includes('hubcloud') || link?.includes('/?id='):
          try {
            const newLinkRes = await axios.get(link, {
              headers,
              signal,
              maxRedirects: 0,
              validateStatus: status => status < 400,
            });
            // response content is html
            if (newLinkRes.headers['content-type']?.includes('text/html')) {
              const $page = cheerio.load(newLinkRes.data);
              const directLink = $page('a#vd').attr('href');
              if (directLink) {
                streamLinks.push({
                  server: 'hubcloud',
                  link: directLink,
                  type: 'mkv',
                });
                break;
              }
            }

            let newLink = newLinkRes.headers.location || link;
            if (newLink.includes('googleusercontent')) {
              newLink = newLink.split('?link=')[1];
            } else {
              const newLinkRes2 = await axios.head(newLink, {
                headers,
                signal,
                maxRedirects: 0,
                validateStatus: status => status < 400,
              });

              newLink =
                newLinkRes2.headers.location?.split('?link=')[1] || newLink;
            }

            streamLinks.push({
              server: 'hubcloud',
              link: newLink,
              type: 'mkv',
            });
          } catch (error) {
            console.log('hubcloudExtracter error in hubcloud link: ', error);
          }
          break;

        case link?.includes('cloudflarestorage'):
          streamLinks.push({server: 'CfStorage', link: link, type: 'mkv'});
          break;

        case link?.includes('fastdl') || link?.includes('fls.'):
          streamLinks.push({server: 'FastDl', link: link, type: 'mkv'});
          break;

        case link.includes('hubcdn') && !link.includes('/?id='):
          streamLinks.push({
            server: 'HubCdn',
            link: link,
            type: 'mkv',
          });
          break;

        default:
          if (link?.includes('.mkv')) {
            const serverName =
              link
                .match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i)?.[1]
                ?.replace(/\./g, ' ') || 'Unknown';
            streamLinks.push({server: serverName, link: link, type: 'mkv'});
          }
          break;
      }
    }

    console.log('streamLinks', streamLinks);
    return streamLinks;
  } catch (error) {
    console.log('hubcloudExtracter error: ', error);
    return [];
  }
}
