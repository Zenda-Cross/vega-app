import axios from 'axios';
import {Stream} from '../types';

export const dcGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const episodeId = id.split('*')[0];
    const mediaId = id.split('*')[1];
    const url = `https://consumet8.vercel.app/movies/dramacool/watch?episodeId=${episodeId}&mediaId=${mediaId}`;
    console.log('dcStreamurl', url);
    const res = await axios.get(url);
    const data = res.data;
    const streamLinks: Stream[] = [];

    if (data && data.sources && data.sources.length > 0) {
      // for (const stream of data.sources) {
      const qualityLinks = await getQualityLinks(data.sources[0].url);
      qualityLinks.forEach(qualityLink => {
        streamLinks.push({
          link: qualityLink.url,
          type: 'm3u8',
          server: 'Vipdra-' + qualityLink.quality,
        });
      });
      // }
    }
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

async function fetchM3U8(url: string) {
  try {
    const response = await axios(url, {
      timeout: 10000,
    });

    const data = await response.data;
    return data;
  } catch (error) {
    console.log('Failed to fetch the M3U8 file:', error);
  }
}

function parseM3U8(data: string) {
  const lines = data.split('\n');
  const qualityLinks: {quality: string; url: string}[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const quality = line.match(/RESOLUTION=\d+x(\d+)/);
      const nextLine = lines[index + 1];
      if (quality && nextLine && !nextLine.startsWith('#')) {
        qualityLinks.push({
          quality: quality[1] + 'p',
          url: nextLine,
        });
      }
    }
  });

  return qualityLinks;
}

async function getQualityLinks(url: string) {
  const m3u8Content = await fetchM3U8(url);
  if (m3u8Content) {
    const qualityLinks = parseM3U8(m3u8Content);
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const fullQualityLinks = qualityLinks.map(link => ({
      quality: link.quality,
      url: baseUrl + link.url,
    }));
    console.log('Quality Links:', fullQualityLinks);
    return fullQualityLinks;
  }
  return [];
}
