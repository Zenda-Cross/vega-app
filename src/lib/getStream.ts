import axios from 'axios';
import * as cheerio from 'cheerio';

export async function getStream(dotlink: string) {
  try {
    // console.log('dotlink', dotlink);
    const dotlinkRes = await axios(dotlink);
    const dotlinkText = dotlinkRes.data;
    // console.log('dotlinkText', dotlinkText);
    const vLink =
      dotlinkText.match(/<a\s+href="([^"]*v-cloud\.bio[^"]*)"/i) || [];
    // console.log('vLink', vLink[1]);
    const vLinkRes = await axios(vLink[1]);
    const vLinkText = vLinkRes.data;
    const vLinkRedirect = vLinkText.match(/var\s+url\s*=\s*'([^']+)';/) || [
      '',
      '',
    ];
    // console.log(vLinkRedirect);
    const getTokenRes = await axios(vLinkRedirect[1]);

    const getTokenText = getTokenRes.data;
    const getToken = getTokenText.match(/[\?&]r=([^&;]*)/);
    // console.log(getToken?.[1]);
    const blogLink = `https://bloggingvector.shop/re/${getToken?.[1]}?_=631252793`;
    const blogRes = await axios(blogLink);
    // console.log(blogRes.data);
    const vcloudLink = blogRes.data.match(
      /https:\/\/v-cloud\.bio\/\w+\?token=([a-zA-Z0-9_-]+)/,
    );
    // console.log('vcloudLink', vcloudLink?.[0]);
    const vcloudRes = await axios(vcloudLink?.[0]);
    const $ = cheerio.load(vcloudRes.data);

    const linkClass = $('.btn-success.btn-lg.h6');
    const streamLinks: string[] = [];
    linkClass.each((index, element) => {
      const itm = $(element);
      const link = itm.attr('href') || '';
      if (link?.includes('workers.dev')) {
        streamLinks.push(link);
      }
    });

    // console.log(streamLinks);
    return streamLinks[0];
  } catch (error) {
    console.error(error);
    return '';
  }
}
