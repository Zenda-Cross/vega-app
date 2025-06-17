import {EpisodeLink, ProviderContext} from '../types';

export const katEpisodeLinks = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const {axios, cheerio} = providerContext;
  const episodesLink: EpisodeLink[] = [];
  try {
    if (url.includes('gdflix')) {
      const baseUrl = url.split('/pack')?.[0];
      const res = await axios.get(url);
      const data = res.data;
      const $ = cheerio.load(data);
      const links = $('.list-group-item');
      links?.map((i, link) => {
        episodesLink.push({
          title: $(link).text() || '',
          link: baseUrl + $(link).find('a').attr('href') || '',
        });
      });
      if (episodesLink.length > 0) {
        return episodesLink;
      }
    }
    if (url.includes('/pack')) {
      const epIds = await extractKmhdEpisodes(url, providerContext);
      epIds?.forEach((id: string, index: number) => {
        episodesLink.push({
          title: `Episode ${index + 1}`,
          link: url.split('/pack')[0] + '/file/' + id,
        });
      });
    }
    const res = await axios.get(url, {
      headers: {
        Cookie:
          '_ga_GNR438JY8N=GS1.1.1722240350.5.0.1722240350.0.0.0; _ga=GA1.1.372196696.1722150754; unlocked=true',
      },
    });
    const episodeData = res.data;
    const $ = cheerio.load(episodeData);
    const links = $('.autohyperlink');
    links?.map((i, link) => {
      episodesLink.push({
        title: $(link).parent().children().remove().end().text() || '',
        link: $(link).attr('href') || '',
      });
    });

    return episodesLink;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export async function extractKmhdLink(
  katlink: string,
  providerContext: ProviderContext,
) {
  const {axios} = providerContext;
  const res = await axios.get(katlink);
  const data = res.data;
  const hubDriveRes = data.match(/hubdrive_res:\s*"([^"]+)"/)[1];
  const hubDriveLink = data.match(
    /hubdrive_res\s*:\s*{[^}]*?link\s*:\s*"([^"]+)"/,
  )[1];
  return hubDriveLink + hubDriveRes;
}

async function extractKmhdEpisodes(
  katlink: string,
  providerContext: ProviderContext,
) {
  const {axios} = providerContext;
  const res = await axios.get(katlink);
  const data = res.data;
  const ids = data.match(/[\w]+_[a-f0-9]{8}/g);
  return ids;
}
