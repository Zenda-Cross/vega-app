import axios from 'axios';
import * as cheerio from 'cheerio';
import {EpisodeLink} from '../types';

export const toonGetEpisodeLinks = async function (
  data: string,
): Promise<EpisodeLink[]> {
  try {
    const seasonData = JSON.parse(data);
    const url = `https://toonstream.co/wp-admin/admin-ajax.php`;
    const formData = new FormData();
    formData.append('action', 'action_select_season');
    formData.append('season', seasonData.season);
    formData.append('post', seasonData.postid);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const episodeLinks: EpisodeLink[] = [];
    $('.post').map((i, element) => {
      const title =
        'Episode' + $(element).find('.num-epi').text().split('x')[1];
      const link = $(element).find('a').attr('href');
      if (title && link) {
        episodeLinks.push({
          title: title,
          link: link,
        });
      }
    });
    console.log('toonstream episodeLinks', episodeLinks);
    return episodeLinks;
  } catch (err) {
    console.error('Error in toonGetEpisodeLinks:', err);
    return [];
  }
};
