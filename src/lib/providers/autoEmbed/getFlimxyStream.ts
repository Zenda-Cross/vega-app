export const getFlimxyStream = async (
  imdbId: string,
  season: string,
  episode: string,
  type: string,
) => {
  try {
    const baseUrl = atob('aHR0cHM6Ly9maWxteHkud2FmZmxlaGFja2VyLmlvLw==');
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 4000);
    const filter =
      type === 'movie'
        ? `search?id=${imdbId}`
        : `search?id=${imdbId}&s=${season}&e=${episode}`;
    const url = `${baseUrl}${filter}`;
    console.log('flimxy url', url);
    const res = await fetch(url, {signal: controller.signal});
    const data = await res.json();
    return data?.stream?.[0];
  } catch (e) {
    console.log('getFlimxyStream error', e);
  }
};
