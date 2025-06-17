import {Stream, ProviderContext} from '../types';

async function extractKmhdLink(
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
export async function katGetStream({
  link,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const {axios, cheerio, extractors} = providerContext;
  const {hubcloudExtracter, gdFlixExtracter} = extractors;
  const streamLinks: Stream[] = [];
  console.log('katGetStream', link);
  try {
    if (link.includes('gdflix')) {
      return await gdFlixExtracter(link, signal);
    }
    if (link.includes('kmhd')) {
      const hubcloudLink = await extractKmhdLink(link, providerContext);
      return await hubcloudExtracter(hubcloudLink, signal);
    }
    if (link.includes('gdflix')) {
      // resume link
      try {
        const resumeDrive = link.replace('/file', '/zfile');
        //   console.log('resumeDrive', resumeDrive);
        const resumeDriveRes = await axios.get(resumeDrive);
        const resumeDriveHtml = resumeDriveRes.data;
        const $resumeDrive = cheerio.load(resumeDriveHtml);
        const resumeLink = $resumeDrive('.btn-success').attr('href');
        console.log('resumeLink', resumeLink);
        if (resumeLink) {
          streamLinks.push({
            server: 'ResumeCloud',
            link: resumeLink,
            type: 'mkv',
          });
        }
      } catch (err) {
        console.log('Resume link not found');
      }
      //instant link
      try {
        const driveres = await axios.get(link, {timeout: 10000});
        const $drive = cheerio.load(driveres.data);
        const seed = $drive('.btn-danger').attr('href') || '';
        const instantToken = seed.split('=')[1];
        //   console.log('InstantToken', instantToken);
        const InstantFromData = new FormData();
        InstantFromData.append('keys', instantToken);
        const videoSeedUrl = seed.split('/').slice(0, 3).join('/') + '/api';
        //   console.log('videoSeedUrl', videoSeedUrl);
        const instantLinkRes = await fetch(videoSeedUrl, {
          method: 'POST',
          body: InstantFromData,
          headers: {
            'x-token': videoSeedUrl,
          },
        });
        const instantLinkData = await instantLinkRes.json();
        console.log('instantLinkData', instantLinkData);
        if (instantLinkData.error === false) {
          const instantLink = instantLinkData.url;
          streamLinks.push({
            server: 'Gdrive-Instant',
            link: instantLink,
            type: 'mkv',
          });
        } else {
          console.log('Instant link not found', instantLinkData);
        }
      } catch (err) {
        console.log('Instant link not found', err);
      }
      return streamLinks;
    }
    const stereams = await hubcloudExtracter(link, signal);
    return stereams;
  } catch (error: any) {
    console.log('katgetStream error: ', error);
    return [];
  }
}
