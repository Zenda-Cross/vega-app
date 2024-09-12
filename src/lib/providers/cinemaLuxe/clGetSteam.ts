import axios from 'axios';
import {Stream} from '../types';
import {hubcloudExtracter} from '../hubcloudExtractor';
import {gdFlixExtracter} from '../gdflixExtractor';

export const clGetStream = async (
  link: string,
  type: string,
  signal: AbortSignal,
): Promise<Stream[]> => {
  try {
    let newLink = link;
    if (!link.includes('hubcloud') && !link.includes('gdflix')) {
      console.log('link', link);
      const res = await axios.get(link);
      const data = res.data;
      const encodedLink = data.match(/"link":"([^"]+)"/)[1];
      newLink = encodedLink ? atob(encodedLink) : link;
    }
    console.log('newLink', newLink);
    if (newLink.includes('gdflix')) {
      const sreams = await gdFlixExtracter(newLink, signal);
      return sreams;
    }
    const res2 = await axios.get(newLink, {signal});
    const data2 = res2.data;
    newLink = data2.match(/location\.replace\('([^']+)'/)?.[1] || newLink;
    const hubCloudLinks = await hubcloudExtracter(newLink, signal);
    return hubCloudLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
