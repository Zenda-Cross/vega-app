import {EpisodeLink, Info, Link, ProviderContext} from '../types';

export const ridoGetInfo = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const {getBaseUrl, axios} = providerContext;
    const res = await axios.get(link);
    const data = res.data;
    const meta = {
      title: '',
      synopsis: '',
      image: '',
      imdbId: data?.meta?.imdb_id || '',
      type: data?.meta?.type || 'movie',
    };
    const baseUrl = await getBaseUrl('ridomovies');
    let slug = '';
    try {
      const res2 = await axios.get(
        baseUrl + '/core/api/search?q=' + meta.imdbId,
      );
      const data2 = res2.data;
      slug = data2?.data?.items[0]?.fullSlug;
      if (!slug || meta?.type === 'series') {
        return {
          title: '',
          synopsis: '',
          image: '',
          imdbId: data?.meta?.imdb_id || '',
          type: meta?.type || 'movie',
          linkList: [],
        };
      }
    } catch (err) {
      return {
        title: '',
        synopsis: '',
        image: '',
        imdbId: meta?.imdbId || '',
        type: meta?.type || 'movie',
        linkList: [],
      };
    }
    const links: Link[] = [];
    let directLinks: EpisodeLink[] = [];
    let season = new Map();
    if (meta.type === 'series') {
      data?.meta?.videos?.map((video: any) => {
        if (video?.season <= 0) return;
        if (!season.has(video?.season)) {
          season.set(video?.season, []);
        }
        season.get(video?.season).push({
          title: 'Episode ' + video?.episode,
          link: '',
        });
      });
      for (const [seasonNum, episodes] of season.entries()) {
        links.push({
          title: 'Season ' + seasonNum,
          directLinks: episodes,
        });
      }
    } else {
      directLinks.push({title: 'Movie', link: link});
      links.push({title: 'Movie', directLinks: directLinks});
    }
    return {
      ...meta,
      linkList: links,
    };
  } catch (err) {
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
