import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const katEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  console.log('episode url', url);
  const episodesLink: EpisodeLink[] = [];
  try {
    console.log('katEpisodeLinks', url);
    if (url.includes('gdflix')) {
      const baseUrl = url.split('/pack')?.[0];
      const res = await axios.get(url, {headers});
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
      const epIds = await extractKmhdEpisodes(url);
      epIds?.forEach((id, index) => {
        episodesLink.push({
          title: `Episode ${index + 1}`,
          link: url.split('/pack')[0] + '/file/' + id,
        });
      });
    }
    console.log('episodesLink', episodesLink);
    const res = await axios.get(url, {
      headers: {
        ...headers,
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
    console.log('episodesLink', episodesLink);

    return episodesLink;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export async function extractKmhdLink(katlink: string) {
  console.log('extractKmhd', katlink);
  const res = await axios.get(katlink, {
    headers: {
      ...headers,
      Cookie:
        '_ga_GNR438JY8N=GS1.1.1722240350.5.0.1722240350.0.0.0; _ga=GA1.1.372196696.1722150754; unlocked=true',
    },
  });
  const data = res.data;
  const hubDriveRes = data.match(/hubdrive_res:\s*"([^"]+)"/)[1];
  const hubDriveLink = data.match(
    /hubdrive_res\s*:\s*{[^}]*?link\s*:\s*"([^"]+)"/,
  )[1];
  console.log('hubDriveLink', hubDriveLink + hubDriveRes);
  return hubDriveLink + hubDriveRes;
}

async function extractKmhdEpisodes(katlink: string) {
  const res = await axios.get(katlink, {headers});
  const data = res.data;
  const ids = data.match(/[\w]+_[a-f0-9]{8}/g);
  console.log('ids', ids);
  return ids;
}
