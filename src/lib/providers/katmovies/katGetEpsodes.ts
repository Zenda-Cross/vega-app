import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {EpisodeLink} from '../types';

export const katEpisodeLinks = async function (
  url: string,
): Promise<EpisodeLink[]> {
  const episodesLink: EpisodeLink[] = [];
  try {
    console.log('katEpisodeLinks', url);
    if (url.includes('/pack')) {
      const epIds = await extractKmhdEpisodes(url);
      epIds.forEach((id, index) => {
        episodesLink.push({
          title: `Episode ${index + 1}`,
          link: url.split('/pack')[0] + '/file/' + id,
        });
      });
    }
    console.log('episodesLink', episodesLink);

    return episodesLink;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export async function extractKmhdLink(katlink: string) {
  console.log('extractKmhd', katlink);
  const res = await axios.get(katlink, {headers});
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
