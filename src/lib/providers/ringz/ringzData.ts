import axios from 'axios';

export const headers = {
  'cf-access-client-id': '833049b087acf6e787cedfd85d1ccdb8.access',
  'cf-access-client-secret':
    '02db296a961d7513c3102d7785df4113eff036b2d57d060ffcc2ba3ba820c6aa',
};

const BASE_URL = 'https://privatereporz.pages.dev';
export async function getRingzMovies() {
  try {
    const response = await axios.get(`${BASE_URL}/test.json`, {
      timeout: 4000,
      headers: {
        ...headers,
      },
    });
    return response.data.AllMovieDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzShows() {
  try {
    const response = await axios.get(`${BASE_URL}/srs.json`, {
      timeout: 4000,
      headers: {
        ...headers,
      },
    });
    return response.data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzAnime() {
  try {
    const response = await axios.get(`${BASE_URL}/anime.json`, {
      timeout: 4000,
      headers: {
        ...headers,
      },
    });
    return response.data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzAdult() {
  try {
    const response = await axios.get(`${BASE_URL}/desihub.json`, {
      timeout: 4000,
      headers: {
        ...headers,
      },
    });
    return response.data.webSeriesDataList;
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
