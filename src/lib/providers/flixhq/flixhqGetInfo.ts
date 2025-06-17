import {Info, Link, ProviderContext} from '../types';

export const flixhqGetInfo = async function ({
  link: id,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const {axios, getBaseUrl} = providerContext;
    const baseUrl = await getBaseUrl('consumet');
    const url = `${baseUrl}/movies/flixhq/info?id=` + id;
    const res = await axios.get(url);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description.replace(/<[^>]*>?/gm, '').trim(),
      image: data.cover,
      cast: data.casts,
      rating: data.rating,
      tags: [data?.type, data?.duration, data.releaseDate.split('-')[0]],
      imdbId: '',
      type: data.episodes.length > 1 ? 'series' : 'movie',
    };

    const links: Link['directLinks'] = [];
    data.episodes.forEach((episode: any) => {
      const title = episode?.number
        ? 'Season-' + episode?.season + ' Ep-' + episode.number
        : episode.title;
      const link = episode.id + '*' + data.id;
      if (link && title) {
        links.push({
          title,
          link,
        });
      }
    });

    return {
      ...meta,
      linkList: [
        {
          title: meta.title,
          directLinks: links,
        },
      ],
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
