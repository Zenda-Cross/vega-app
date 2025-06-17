import {Info, Link, ProviderContext} from '../types';

export const multiGetInfo = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const {axios, cheerio} = providerContext;
    const url = link;
    const res = await axios.get(url);
    const data = res.data;
    const $ = cheerio.load(data);
    const type = url.includes('tvshows') ? 'series' : 'movie';
    const imdbId = '';
    const title = url.split('/')[4].replace(/-/g, ' ');
    const image = $('.g-item').find('a').attr('href') || '';
    const synopsis = $('.wp-content').find('p').text() || '';

    // Links
    const links: Link[] = [];

    if (type === 'series') {
      $('#seasons')
        .children()
        .map((i, element) => {
          const title = $(element)
            .find('.title')
            .children()
            .remove()
            .end()
            .text();
          let episodesList: {title: string; link: string}[] = [];
          $(element)
            .find('.episodios')
            .children()
            .map((i, element) => {
              const title =
                'Episode' +
                $(element).find('.numerando').text().trim().split('-')[1];
              const link = $(element).find('a').attr('href');
              if (title && link) {
                episodesList.push({title, link});
              }
            });
          if (title && episodesList.length > 0) {
            links.push({
              title,
              directLinks: episodesList,
            });
          }
        });
    } else {
      links.push({
        title: title,
        directLinks: [{title: title, link: url.slice(0, -1), type: 'movie'}],
      });
    }
    // console.log('multi meta', links);

    return {
      title,
      synopsis,
      image,
      imdbId,
      type,
      linkList: links,
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
