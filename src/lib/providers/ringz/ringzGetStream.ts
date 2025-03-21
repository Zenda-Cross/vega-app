import {Stream} from '../types';

export const ringzGetStream = async (data: string): Promise<Stream[]> => {
  const streamLinks: Stream[] = [];
  const dataJson = JSON.parse(data);
  streamLinks.push({
    link: dataJson.url,
    server: dataJson.server,
    type: 'mkv',
  });
  return streamLinks;
};
