import axios from 'axios';

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
    const headers = {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      priority: 'u=1, i',
      'sec-ch-ua':
        '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      origin: 'https://www.vidbinge.com',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    };
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
    const tokenRes = await axios.get('https://ext.8man.me/api/whvxToken', {
      timeout: 4000,
    });
    const tokenJson = tokenRes.data;
    const token = encodeURIComponent(tokenJson?.token);

    const searchRes = await fetch(
      `${atob(
        baseUrl,
      )}/search?query=${searchQuery}&provider=${provider}&token=${token}`,
      {
        headers: headers,
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
        body: null,
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      },
    );
    const searchController = new AbortController();
    setTimeout(() => {
      searchController.abort();
    }, 4000);
    const searchJson = await searchRes.json();
    console.log('whvx res', searchJson);
    console.log(
      'whvx url',
      `${atob(
        baseUrl,
      )}/search?query=${searchQuery}&provider=${provider}&token=${token}`,
    );
    const streamRes = await fetch(
      `${atob(baseUrl)}/source?resourceId=${encodeURIComponent(
        searchJson?.url,
      )}&provider=${provider}`,
      {
        headers: headers,
        signal: searchController.signal,
        referrerPolicy: 'no-referrer',
        body: null,
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      },
    );
    const streamJson = await streamRes.json();
    console.log('whvx', provider, streamJson);

    return streamJson?.stream?.[0] || null;
  } catch (err) {
    console.error('whvx', err);
  }
};
