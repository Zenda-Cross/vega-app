import {Post, ProviderContext} from '../types';

export const ringzGetPosts = async function ({
  filter,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  return posts({filter, signal, providerContext});
};

export const ringzGetPostsSearch = async function ({
  searchQuery,
  page, // providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  if (page > 1) return [];
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
  try {
    const catalog: Post[] = [];
    const promises = [getRingzMovies(), getRingzShows(), getRingzAnime()];
    const responses = await Promise.all(promises);
    responses.map((response: any) => {
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

async function posts({
  filter, // signal,
  // providerContext,
}: {
  filter: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    let response;
    if (filter === 'MOVIES') {
      response = getRingzMovies();
    }
    if (filter === 'SERIES') {
      response = getRingzShows();
    }
    if (filter === 'ANIME') {
      response = getRingzAnime();
    }
    const data = await response;
    const catalog: Post[] = [];
    data.map((element: any) => {
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

export const headers = {
  'cf-access-client-id': '833049b087acf6e787cedfd85d1ccdb8.access',
  'cf-access-client-secret':
    '02db296a961d7513c3102d7785df4113eff036b2d57d060ffcc2ba3ba820c6aa',
};

const BASE_URL = 'https://privatereporz.pages.dev';
export async function getRingzMovies() {
  try {
    const response = await fetch(`${BASE_URL}/test.json`, {
      headers: {
        ...headers,
      },
    });
    const data = await response.json();
    return data.AllMovieDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzShows() {
  try {
    const response = await fetch(`${BASE_URL}/srs.json`, {
      headers: {
        ...headers,
      },
    });
    const data = await response.json();
    return data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzAnime() {
  try {
    const response = await fetch(`${BASE_URL}/anime.json`, {
      headers: {
        ...headers,
      },
    });
    const data = await response.json();
    return data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzAdult() {
  try {
    const response = await fetch(`${BASE_URL}/desihub.json`, {
      headers: {
        ...headers,
      },
    });
    const data = await response.json();
    return data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export const ringzData: {
  getRingzMovies: () => Promise<any>;
  getRingzShows: () => Promise<any>;
  getRingzAnime: () => Promise<any>;
  getRingzAdult: () => Promise<any>;
} = {
  getRingzMovies,
  getRingzShows,
  getRingzAnime,
  getRingzAdult,
};
