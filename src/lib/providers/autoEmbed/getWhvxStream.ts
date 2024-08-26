export const getWhvxStream = async (
  imdbId: string,
  tmdbId: string,
  season: string,
  episode: string,
  title: string,
  type: string,
  year: string,
  provider: string,
  baseUrl: string,
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
        releaseYear: year
          ? year?.split('–')?.length > 0
            ? year?.split('–')[0]
            : year
          : '',
      }),
    );
    console.log('searchQuery', {
      title: title,
      imdbId: imdbId,
      tmdbId: tmdbId,
      type: type === 'series' ? 'show' : 'movie',
      releaseYear: year
        ? year?.split('–')?.length > 0
          ? year?.split('–')[0]
          : year
        : '',
      season: season,
      episode: episode,
    });
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 4000);
    const searchRes = await fetch(
      `${atob(baseUrl)}/search?query=${searchQuery}&provider=${provider}`,
      {
        headers: {
          'if-none-match': 'W/"d4-7mcv5HTZs5ogd/iJwPMEZ/NGCw0"',
          origin: atob('aHR0cHM6Ly93d3cudmlkYmluZ2UuY29t'),
        },
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
        body: null,

        method: 'GET',
      },
    );
    const searchJson = await searchRes.json();
    console.log('whvx', provider, searchQuery);
    const streamRes = await fetch(
      `${atob(baseUrl)}/source?resourceId=${encodeURIComponent(
        searchJson?.url,
      )}&provider=${provider}`,
      {
        headers: {
          'if-none-match': 'W/"d4-7mcv5HTZs5ogd/iJwPMEZ/NGCw0"',
          origin: atob('aHR0cHM6Ly93d3cudmlkYmluZ2UuY29t'),
        },
        referrerPolicy: 'no-referrer',
        body: null,

        method: 'GET',
      },
    );
    const streamJson = await streamRes.json();
    console.log('whvx', provider, streamJson);

    return streamJson?.stream?.[0] || null;
  } catch (err) {
    console.error('whvx', err);
  }
};
