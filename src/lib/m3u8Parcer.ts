import axios from 'axios';

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

export async function getQualityLinks(url: string) {
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
