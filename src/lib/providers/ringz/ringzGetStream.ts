import {Stream, ProviderContext} from '../types';

export const ringzGetStream = async function ({
  link: data,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const streamLinks: Stream[] = [];
  const dataJson = JSON.parse(data);
  streamLinks.push({
    link: dataJson.url,
    server: dataJson.server,
    type: 'mkv',
  });
  return streamLinks;
};
