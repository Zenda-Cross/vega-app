import axios from 'axios';
import * as cheerio from 'cheerio';
import {Stream} from '../types';
import {headers} from '../headers';

export const ridoGetStream = async (data: string): Promise<Stream[]> => {
  try {
    const streamData = JSON.parse(data);
    const streamLinks: Stream[] = [];

    // const path =
    //   streamData?.type === 'movie'
    //     ? `/${streamData?.slug}`
    //     : `/${streamData?.slug}/season-${streamData?.season}/episode-${streamData?.episode}`;
    // const url = streamData?.baseUrl + path;
    // console.log('all', url);
    // const res = await axios.get(url, {headers});
    // const postId = res.data.split('\\"postid\\":\\"')[1].split('\\"')[0];
    // console.log('rido post id', postId);

    const url = streamData?.baseUrl + '/api/' + streamData?.slug;
    console.log('rido url', url);

    const res = await axios.get(url, {headers});
    const iframe = res.data.data?.[0]?.url;

    console.log('rido data', iframe);
    const iframeUrl = iframe.split('src="')[1].split('"')[0];
    console.log('rido iframeUrl', iframeUrl);
    const iframeRes = await axios.get(iframeUrl, {
      headers: {
        ...headers,
        Referer: streamData?.baseUrl,
      },
    });
    const $ = cheerio.load(iframeRes.data);
    const script = $('script:contains("eval")').html();
    if (!script) {
      throw new Error('Unable to find script');
    }
    // console.log('rido script', script);
    const srcUrl = unpackJavaScript(script.trim());
    console.log('rido srcUrl', srcUrl);

    streamLinks.push({
      link: srcUrl,
      server: 'rido',
      type: 'm3u8',
      headers: {
        Referer: iframeUrl,
      },
    });

    return streamLinks;
  } catch (e) {
    console.log('rido get stream err', e);
    return [];
  }
};

function unpackJavaScript(packedCode: string): string {
  const encodedString = packedCode.split('|aHR')[1].split('|')[0];
  const base64Url = 'aHR' + encodedString;
  function addPadding(base64: string) {
    return base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  }

  console.log('rido base64Url', base64Url);
  const unpackedCode = atob(addPadding(base64Url));
  return unpackedCode;
}
