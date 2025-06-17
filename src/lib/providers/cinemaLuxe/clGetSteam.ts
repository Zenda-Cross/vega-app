import {Stream, ProviderContext} from '../types';

export const clGetStream = async ({
  link,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> => {
  try {
    let newLink = link;
    if (link.includes('luxedrive')) {
      const res = await providerContext.axios.get(link);
      const $ = providerContext.cheerio.load(res.data);
      const hubcloudLink = $('a.btn.hubcloud').attr('href');
      if (hubcloudLink) {
        newLink = hubcloudLink;
      } else {
        const gdFlixLink = $('a.btn.gdflix').attr('href');
        if (gdFlixLink) {
          newLink = gdFlixLink;
        }
      }
    }
    if (newLink.includes('gdflix')) {
      const sreams = await providerContext.extractors.gdFlixExtracter(
        newLink,
        signal,
      );
      return sreams;
    }
    const res2 = await providerContext.axios.get(newLink, {signal});
    const data2 = res2.data;
    const hcLink = data2.match(/location\.replace\('([^']+)'/)?.[1] || newLink;
    const hubCloudLinks = await providerContext.extractors.hubcloudExtracter(
      hcLink.includes('https://hubcloud') ? hcLink : newLink,
      signal,
    );
    return hubCloudLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
