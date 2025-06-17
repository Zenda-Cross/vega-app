import {Stream, ProviderContext, TextTracks, TextTrackType} from '../types';

export const multiGetStream = async function ({
  link: url,
  providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const {axios, cheerio} = providerContext;
  const headers = {
    'sec-ch-ua':
      '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    Referer: 'https://multimovies.online/',
    'Sec-Fetch-User': '?1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  };

  try {
    const res = await axios.get(url, {headers});
    const html = res.data;
    const $ = cheerio.load(html);
    const streamLinks: Stream[] = [];
    const postId = $('#player-option-1').attr('data-post');
    const nume = $('#player-option-1').attr('data-nume');
    const typeValue = $('#player-option-1').attr('data-type');

    const baseUrl = url.split('/').slice(0, 3).join('/');
    console.log('baseUrl', baseUrl);

    const formData = new FormData();
    formData.append('action', 'doo_player_ajax');
    formData.append('post', postId);
    formData.append('nume', nume);
    formData.append('type', typeValue);

    console.log('formData', formData);

    const playerRes = await fetch(`${baseUrl}/wp-admin/admin-ajax.php`, {
      headers: headers,
      body: formData,
      method: 'POST',
    });
    const playerData = await playerRes.json();
    console.log('playerData', playerData);
    let ifameUrl =
      playerData?.embed_url?.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i)?.[1] ||
      playerData?.embed_url;
    console.log('ifameUrl', ifameUrl);
    if (!ifameUrl.includes('multimovies')) {
      let playerBaseUrl = ifameUrl.split('/').slice(0, 3).join('/');
      const newPlayerBaseUrl = await axios.head(playerBaseUrl, {headers});
      if (newPlayerBaseUrl) {
        playerBaseUrl = newPlayerBaseUrl.request?.responseURL
          ?.split('/')
          .slice(0, 3)
          .join('/');
      }
      const playerId = ifameUrl.split('/').pop();
      const NewformData = new FormData();
      NewformData.append('sid', playerId);
      console.log(
        'NewformData',
        playerBaseUrl + '/embedhelper.php',
        NewformData,
      );
      const playerRes = await fetch(`${playerBaseUrl}/embedhelper.php`, {
        headers: headers,
        body: NewformData,
        method: 'POST',
      });
      const playerData = await playerRes.json();
      // console.log('playerData', playerData);
      const siteUrl = playerData?.siteUrls?.smwh;
      const siteId =
        JSON.parse(atob(playerData?.mresult))?.smwh ||
        playerData?.mresult?.smwh;
      const newIframeUrl = siteUrl + siteId;
      console.log('newIframeUrl', newIframeUrl);
      if (newIframeUrl) {
        ifameUrl = newIframeUrl;
      }
    }
    const iframeRes = await axios.get(ifameUrl, {
      headers: {
        ...headers,
        Referer: url,
      },
    });
    const iframeData = iframeRes.data;

    // Step 1: Extract the function parameters and the encoded string
    var functionRegex =
      /eval\(function\((.*?)\)\{.*?return p\}.*?\('(.*?)'\.split/;
    var match = functionRegex.exec(iframeData);
    let p = '';
    if (match) {
      // var params = match[1].split(',').map(param => param.trim());
      var encodedString = match[2];

      // console.log('Parameters:', params);
      // console.log('Encoded String:', encodedString.split("',36,")[0], '🔥🔥');

      p = encodedString.split("',36,")?.[0].trim();
      let a = 36;
      let c = encodedString.split("',36,")[1].slice(2).split('|').length;
      let k = encodedString.split("',36,")[1].slice(2).split('|');

      while (c--) {
        if (k[c]) {
          var regex = new RegExp('\\b' + c.toString(a) + '\\b', 'g');
          p = p.replace(regex, k[c]);
        }
      }

      // console.log('Decoded String:', p);
    } else {
      console.log('No match found');
    }

    const streamUrl = p?.match(/https?:\/\/[^"]+?\.m3u8[^"]*/)?.[0];
    const subtitles: TextTracks = [];
    const subtitleMatch = p?.match(/https:\/\/[^\s"]+\.vtt/g);
    // console.log('subtitleMatch', subtitleMatch);
    // console.log('streamUrl', streamUrl);
    if (subtitleMatch?.length) {
      subtitleMatch.forEach((sub: any) => {
        const lang = sub.match(/_([a-zA-Z]{3})\.vtt$/)[1];
        subtitles.push({
          language: lang,
          uri: sub,
          type: TextTrackType.VTT,
          title: lang,
        });
      });
    }
    console.log('streamUrl', streamUrl);
    console.log('newUrl', streamUrl?.replace(/&i=\d+,'\.4&/, '&i=0.4&'));
    if (streamUrl) {
      streamLinks.push({
        server: 'Multi',
        link: streamUrl.replace(/&i=\d+,'\.4&/, '&i=0.4&'),
        type: 'm3u8',
        subtitles: subtitles,
      });
    }

    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
