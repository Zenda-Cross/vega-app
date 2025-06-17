import {Stream, ProviderContext} from '../types';

function LALLJLutmoZpvvbikjaWM(str: string): ArrayBuffer {
  var buf = new ArrayBuffer(str.length * 2);
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function getOrCreateUID() {
  const uid =
    'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  return uid;
}

export const protonGetStream = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const {axios, cheerio, commonHeaders: headers, extractors} = providerContext;
  const {gofileExtracter} = extractors;
  function generateMessageToken(baseUrlL: string): string {
    const hostname = baseUrlL?.replace(/https?:\/\//, '').split('/')[0];
    console.log('generateMessageToken hostname', hostname);
    const NsmxUftCNibQ = `[hostname=${hostname}][agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0][tmz=India Standard Time][userTimezoneOffset=-330][{"url":"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js","type":"script","duration":253.30000000074506},{"url":"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback","type":"script","duration":397.19999999925494},{"url":"https://adoto.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js","type":"img","duration":225.90000000223517},{"url":"https://code.jquery.com/jquery-3.3.1.slim.min.js","type":"script","duration":65.30000000074506},{"url":"https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015","type":"script","duration":225.89999999850988},{"url":"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js","type":"script","duration":253.30000000074506},{"url":"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback","type":"script","duration":397.19999999925494},{"url":"https://adoto.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js","type":"img","duration":225.90000000223517},{"url":"https://code.jquery.com/jquery-3.3.1.slim.min.js","type":"script","duration":65.30000000074506},{"url":"https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015","type":"script","duration":225.89999999850988},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/new/normal/auto/","type":"iframe","duration":2050.300000000745},{"url":"https://new19.gdtot.dad/favicon.ico","type":"img","duration":1003.6999999992549},{"url":"https://vikingfile.com/assets/favicon-64375c377b5df8304acbdad4f4430694.ico","type":"img","duration":183.19999999925494},{"url":"https://gofile.io/dist/img/favicon32.png","type":"img","duration":19177.199999999255},{"url":"https://pub.clickadu.com/assets/scripts/supported-browsers.js","type":"fetch","duration":18.799999997019768},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1612.5999999977648},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1154.0999999977648},{"url":"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js","type":"script","duration":253.30000000074506},{"url":"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback","type":"script","duration":397.19999999925494},{"url":"https://adoto.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js","type":"img","duration":225.90000000223517},{"url":"https://code.jquery.com/jquery-3.3.1.slim.min.js","type":"script","duration":65.30000000074506},{"url":"https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015","type":"script","duration":225.89999999850988},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/new/normal/auto/","type":"iframe","duration":2050.300000000745},{"url":"https://new19.gdtot.dad/favicon.ico","type":"img","duration":1003.6999999992549},{"url":"https://vikingfile.com/assets/favicon-64375c377b5df8304acbdad4f4430694.ico","type":"img","duration":183.19999999925494},{"url":"https://gofile.io/dist/img/favicon32.png","type":"img","duration":19177.199999999255},{"url":"https://pub.clickadu.com/assets/scripts/supported-browsers.js","type":"fetch","duration":18.799999997019768},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1612.5999999977648},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1154.0999999977648},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":986}][{"elements":{"div":70,"span":68,"img":4,"iframe":0,"script":28,"link":20,"p":5,"a":213,"ul":28,"li":208,"button":9,"input":5},"hidden":{"div":13,"span":60,"img":1,"iframe":0,"script":28,"link":20,"p":0,"a":186,"ul":22,"li":184,"button":6,"input":2},"errors":{"network":0,"js":0},"eventListeners":0}]`;

    var jRpeP = LALLJLutmoZpvvbikjaWM(NsmxUftCNibQ);
    var jzKEwqEAcWFMNwHZnCCqJQ = new Uint8Array(jRpeP);
    var kyMXQUxoFYuZIBlKvlHa = jzKEwqEAcWFMNwHZnCCqJQ.toString();
    var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/2/g, '004');
    var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/3/g, '005');
    var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/7/g, '007');
    var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/,0,0,0/g, '');

    return kyMXQUxoFYuZIBlKvlHa;
  }
  function decodeHtml(encodedArray: string[]): string {
    // Join array elements into a single string
    const joined = encodedArray.join('');

    // Replace escaped quotes
    const unescaped = joined.replace(/\\"/g, '"').replace(/\\'/g, "'");

    // Remove remaining escape characters
    const cleaned = unescaped
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r');

    // Convert literal string representations back to characters
    const decoded = cleaned
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    return decoded;
  }
  try {
    const streamLinks: Stream[] = [];
    const res = await axios.get(link, {headers});
    const data = res.data;
    // const regex = /\[(?=.*?"<div class")(.*?)\]/g;
    // const htmlArray = data?.match(regex);

    // new code
    const $$ = cheerio.load(data);
    const htmlArray = $$('script:contains("decodeURIComponent")')
      .text()
      .split(' = ')?.[1]
      ?.split('protomovies')?.[0]
      ?.trim()
      ?.slice(0, -1); // remove the last character
    // console.log('protonGetInfo', htmlArray);
    // const html = decodeHtml(JSON.parse(htmlArray[htmlArray.length - 1]));

    const html = decodeHtml(JSON.parse(htmlArray));

    // console.log('protonGetInfo', htmlArray[htmlArray.length - 1]);
    // console.log('all', html);
    const $ = cheerio.load(html);
    const idList = [];
    const id1080 = $('tr:contains("1080p")')
      .find('button:contains("Info")')
      .attr('id')
      ?.split('-')[1];
    if (id1080) {
      idList.push({
        id: id1080,
        quality: '1080p',
      });
    }
    const id720 = $('tr:contains("720p")')
      .find('button:contains("Info")')
      .attr('id')
      ?.split('-')[1];

    if (id720) {
      idList.push({
        id: id720,
        quality: '720p',
      });
    }

    const id480 = $('tr:contains("480p")')
      .find('button:contains("Info")')
      .attr('id')
      ?.split('-')[1];

    if (id480) {
      idList.push({
        id: id480,
        quality: '480p',
      });
    }
    // console.log('idList', idList);

    const baseUrl = link.split('/').slice(0, 3).join('/');

    const secondIdList: {
      quality: string;
      id: string;
    }[] = [];

    await Promise.all(
      idList.slice(0, 2).map(async id => {
        const formData = new URLSearchParams();
        formData.append('downloadid', id.id);
        formData.append('token', 'ok');
        const messageToken = generateMessageToken(baseUrl);
        const uid = getOrCreateUID();

        const idRes = await fetch(`${baseUrl}/ppd.php`, {
          headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
            pragma: 'no-cache',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            cookie:
              'ext_name=ojplmecpdpgccookcobabopnaifgidhf; tgInvite222=true; cf_clearance=3ynJv2B6lHMj3FCOqtfQaL7lTN4KC3xmPRMgcNtddAc-1748787867-1.2.1.1-SEIhLbWR3ehfib5Y3P5pjzj1Qu9wipc52Icv4AmNkztXn2pTXhjKgxXnvTuA2bNscgHuc1juXujAHteqY_vaMmy2C3djMWnJGzjje_XvXZXKht8rwHZt6sviq7KAYvrYZPTrATqENuopzmqmK6dDFS.CAnWHt0VDn8q06iLm5rYj1AXUo3qkV5p1Idx_25elWHYGG8yengBrQV1MYVM9LMdQqv44PXu69FZvNkgv.d6blCKyneJnoLkw4LHAccu.QRPbFwWqqTDyO9YTLRQW9w29bKghD3_JVxkz.qxpg5FbocJ3i6tJJy74SvROpYdpVUOn0fW1YgQ7RxYwhNoHpdTKy8pvmQJGRuSVW1GjO_k',
            Referer: 'https://m3.protonmovies.top/download/',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
          },
          body: `downloadid=${id.id}&msg=${messageToken}&uid=${uid}&token=ok`,
          method: 'POST',
        });
        const idData = await idRes.text();
        secondIdList.push({
          quality: id.quality,
          id: idData,
        });
        console.log('idData', idData);
      }),
    );
    await Promise.all(
      secondIdList.map(async id => {
        const idRes = await axios.post(`${baseUrl}/tmp/${id.id}`);
        if (idRes.data.ppd['gofile.io']) {
          const goRes = await gofileExtracter(
            idRes.data.ppd['gofile.io'].link.split('/').pop(),
          );
          console.log('link', goRes.link);
          if (goRes.link) {
            streamLinks.push({
              link: goRes.link,
              server: 'gofile ' + id.quality,
              type: 'mkv',
              headers: {
                referer: 'https://gofile.io',
                connection: 'keep-alive',
                contentType: 'video/x-matroska',
                cookie: 'accountToken=' + goRes.token,
              },
            });
          }
        }
      }),
    );

    return streamLinks;
  } catch (e) {
    console.log('proton get stream err', e);
    return [];
  }
};
