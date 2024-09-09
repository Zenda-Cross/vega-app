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
    const res = await axios.get(link);
    const data = res.data;
    const dlLink = atob(data.match(/"link":"([^"]+)"/)[1]);
    const res2 = await axios.get(dlLink, {signal});
    const data2 = res2.data;
    const newLink = data2.match(/location\.replace\('([^']+)'/)?.[1] || dlLink;
    console.log('newLink', newLink);
    if (newLink.includes('gdflix')) {
      const sreams = await gdFlixExtracter(newLink, signal);
      return sreams;
    }
    const hubCloudLinks = await hubcloudExtracter(newLink, signal);
    return hubCloudLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};
