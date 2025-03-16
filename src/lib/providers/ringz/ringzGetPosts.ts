import {ringzData} from './ringzData';
import {Post} from '../types';

export const ringzGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  // console.log(url);

  return posts(filter, signal);
};

export const ringzGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  // providerValue: string,
  // signal: AbortSignal,
): Promise<Post[]> {
  if (page > 1) return [];

  try {
    const catalog: Post[] = [];
    const promises = [
      ringzData.getRingzMovies(),
      ringzData.getRingzShows(),
      ringzData.getRingzAnime(),
    ];
    const responses = await Promise.all(promises);
    responses.map(response => {
      const searchResults = searchData(response, searchQuery);
      searchResults.map((element: any) => {
        const title = element?.kn || element?.mn;
        const link = JSON.stringify(element);
        const image = element?.IV;
        if (title && link) {
          catalog.push({
            title: title,
            link: link,
            image: image,
          });
        }
      });
    });
    return catalog;
  } catch (err) {
    console.error('ringz error ', err);
    return [];
  }
};

async function posts(filter: string, signal: AbortSignal): Promise<Post[]> {
  try {
    let response;
    if (filter === 'MOVIES') {
      response = await ringzData.getRingzMovies();
    }
    if (filter === 'SERIES') {
      response = await ringzData.getRingzShows();
    }
    if (filter === 'ANIME') {
      response = await ringzData.getRingzAnime();
    }
    const catalog: Post[] = [];
    response.map((element: any) => {
      const title = element?.kn || element?.mn;
      const link = JSON.stringify(element);
      const image = element?.IV;
      if (title && link) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error('ringz error ', err);
    return [];
  }
}

function searchData(data: any, query: string) {
  // Convert query to lowercase for case-insensitive search
  const searchQuery = query.toLowerCase();

  // Filter movies based on movie name (mn)
  return data.filter((movie: any) => {
    // Convert movie name to lowercase and check if it includes the search query
    const movieName = movie.mn.toLowerCase();
    return movieName.includes(searchQuery);
  });
}
