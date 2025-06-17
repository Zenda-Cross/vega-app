import {Stream, ProviderContext} from '../types';

export const ffGetStream = async function ({
  link,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const res = await providerContext.axios.get(link, {signal});
    const data = res.data;
    const $ = providerContext.cheerio.load(data);
    const streams: Stream[] = [];
    const elements = $('.button2,.button1,.button3,.button4,.button').toArray();
    const promises = elements.map(async element => {
      const title = $(element).text();
      let link = $(element).attr('href');
      if (title.includes('GDFLIX') && link) {
        const gdLinks = await providerContext.extractors.gdFlixExtracter(
          link,
          signal,
        );
        streams.push(...gdLinks);
      }
      const alreadyAdded = streams.find(s => s.link === link);
      if (
        title &&
        link &&
        !title.includes('Watch') &&
        !title.includes('Login') &&
        !title.includes('GoFile') &&
        !alreadyAdded
      ) {
        streams.push({
          server: title,
          link: link,
          type: 'mkv',
        });
      }
    });
    await Promise.all(promises);
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};
