import {EpisodeLink, ProviderContext} from '../types';

export const clsEpisodeLinks = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  try {
    if (!url.includes('luxelinks') || url.includes('luxecinema')) {
      const res = await providerContext.axios.get(url, {
        headers: providerContext.commonHeaders,
      });
      const data = res.data;
      const encodedLink = data.match(/"link":"([^"]+)"/)?.[1];
      if (encodedLink) {
        url = encodedLink ? atob(encodedLink) : url;
      } else {
        const redirectUrlRes = await fetch(
          'https://ext.8man.me/api/cinemaluxe',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({url}),
          },
        );
        const redirectUrl = await redirectUrlRes.json();
        url = redirectUrl?.redirectUrl || url;
      }
    }
    const res = await providerContext.axios.get(url, {
      headers: providerContext.commonHeaders,
    });
    const html = res.data;
    let $ = providerContext.cheerio.load(html);
    const episodeLinks: EpisodeLink[] = [];
    if (url.includes('luxedrive')) {
      episodeLinks.push({
        title: 'Movie',
        link: url,
      });
      return episodeLinks;
    }
    $('a.maxbutton-4,a.maxbutton,.maxbutton-hubcloud,.ep-simple-button').map(
      (i, element) => {
        const title = $(element).text()?.trim();
        const link = $(element).attr('href');
        if (
          title &&
          link &&
          !title.includes('Batch') &&
          !title.toLowerCase().includes('zip')
        ) {
          episodeLinks.push({
            title: title
              .replace(/\(\d{4}\)/, '')
              .replace('Download', 'Movie')
              .replace('⚡', '')
              .trim(),
            link,
          });
        }
      },
    );
    return episodeLinks;
  } catch (err) {
    console.error('cl episode links', err);
    return [];
  }
};
