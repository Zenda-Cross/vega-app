export const getWhvxStream = async (
  imdbId: string,
  tmdbId: string,
  season: string,
  episode: string,
  title: string,
  type: string,
  provider: string,
) => {
  try {
    const searchQuery = encodeURIComponent(
      JSON.stringify({
        title: title,
        imdbId: imdbId,
        tmdbId: tmdbId,
        type: type === 'series' ? 'show' : 'movie',
        season: season || '',
        episode: episode || '',
      }),
    );
    console.log('searchQuery', {
      title: title,
      imdbId: imdbId,
      tmdbId: tmdbId,
      type: type === 'series' ? 'show' : 'movie',
      season: season,
      episode: episode,
    });
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 5000);
    const searchRes = await fetch(
      `https://api.whvx.net/search?query=${searchQuery}&provider=${provider}`,
      {
        headers: {
          'if-none-match': 'W/"d4-7mcv5HTZs5ogd/iJwPMEZ/NGCw0"',
          origin: 'https://www.vidbinge.com',
        },
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
        body: null,

        method: 'GET',
      },
    );
    const searchJson = await searchRes.json();
    console.log('whvx', provider, searchJson);
    const streamRes = await fetch(
      `https://api.whvx.net/source?resourceId=${encodeURIComponent(
        searchJson?.url,
      )}&provider=${provider}`,
      {
        headers: {
          'if-none-match': 'W/"d4-7mcv5HTZs5ogd/iJwPMEZ/NGCw0"',
          origin: 'https://www.vidbinge.com',
        },
        referrerPolicy: 'no-referrer',
        body: null,

        method: 'GET',
      },
    );
    const streamJson = await streamRes.json();
    console.log('whvx', provider, streamJson);

    return streamJson?.stream?.[0];
  } catch (err) {
    console.error('whvx', err);
  }
};
