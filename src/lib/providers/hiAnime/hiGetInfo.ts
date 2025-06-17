import {Info, Link, ProviderContext} from '../types';

export const hiGetInfo = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const {getBaseUrl, axios} = providerContext;
    const baseUrl = await getBaseUrl('consumet');
    const url = `${baseUrl}/anime/zoro/info?id=` + link;
    const res = await axios.get(url);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description,
      image: data.image,
      tags: [
        data?.type,
        data?.subOrDub === 'both' ? 'Sub And Dub' : data?.subOrDub,
      ],
      imdbId: '',
      type: data.episodes.length > 0 ? 'series' : 'movie',
    };
    const linkList: Link[] = [];
    const subLinks: Link['directLinks'] = [];
    data.episodes.forEach((episode: any) => {
      if (!episode?.isSubbed) {
        return;
      }
      const title =
        'Episode ' + episode.number + (episode?.isFiller ? ' (Filler)' : '');
      const link = episode.id + '$sub';
      if (link && title) {
        subLinks.push({
          title,
          link,
        });
      }
    });
    linkList.push({
      title: meta.title + ' (Sub)',
      directLinks: subLinks,
    });
    if (data?.subOrDub === 'both') {
      const dubLinks: Link['directLinks'] = [];
      data.episodes.forEach((episode: any) => {
        if (!episode?.isDubbed) {
          return;
        }
        const title =
          'Episode ' + episode.number + (episode?.isFiller ? ' (Filler)' : '');
        const link = episode.id + '$dub';
        if (link && title) {
          dubLinks.push({
            title,
            link,
          });
        }
      });
      linkList.push({
        title: meta.title + ' (Dub)',
        directLinks: dubLinks,
      });
    }
    return {
      ...meta,
      linkList: linkList,
    };
  } catch (err) {
    console.error(err);
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: 'movie',
      linkList: [],
    };
  }
};
