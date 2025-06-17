import {Stream, ProviderContext} from '../types';

export const driveGetStream = async function ({
  link: url,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const headers = providerContext.commonHeaders;
  try {
    if (type === 'movie') {
      const res = await providerContext.axios.get(url, {headers});
      const html = res.data;
      const $ = providerContext.cheerio.load(html);
      const link = $('a:contains("HubCloud")').attr('href');
      url = link || url;
    }
    const res = await providerContext.axios.get(url, {headers});
    let redirectUrl = res.data.match(
      /<meta\s+http-equiv="refresh"\s+content="[^"]*?;\s*url=([^"]+)"\s*\/?>/i,
    )?.[1];
    if (url.includes('/archives/')) {
      redirectUrl = res.data.match(
        /<a\s+[^>]*href="(https:\/\/hubcloud\.[^\/]+\/[^"]+)"/i,
      )?.[1];
    }
    if (!redirectUrl) {
      return await providerContext.extractors.hubcloudExtracter(url, signal);
    }
    const res2 = await providerContext.axios.get(redirectUrl, {headers});
    const data = res2.data;
    const $ = providerContext.cheerio.load(data);
    const hubcloudLink = $('.fa-file-download').parent().attr('href');
    return await providerContext.extractors.hubcloudExtracter(
      hubcloudLink?.includes('https://hubcloud') ? hubcloudLink : redirectUrl,
      signal,
    );
  } catch (err) {
    console.error('Movies Drive err', err);
    return [];
  }
};
