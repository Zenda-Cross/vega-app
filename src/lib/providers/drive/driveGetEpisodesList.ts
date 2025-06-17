import {EpisodeLink, ProviderContext} from '../types';

export const driveGetEpisodeLinks = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  try {
    const {axios, cheerio} = providerContext;
    const res = await axios.get(url);
    const html = res.data;
    let $ = cheerio.load(html);

    const episodeLinks: EpisodeLink[] = [];
    $('a:contains("HubCloud")').map((i, element) => {
      const title = $(element).parent().prev().text();
      const link = $(element).attr('href');
      if (link && (title.includes('Ep') || title.includes('Download'))) {
        episodeLinks.push({
          title: title.includes('Download') ? 'Play' : title,
          link,
        });
      }
    });

    // console.log(episodeLinks);
    return episodeLinks;
  } catch (err) {
    console.error(err);
    return [
      {
        title: 'Server 1',
        link: url,
      },
    ];
  }
};
