import axios from 'axios';

export async function getRingzMovies() {
  try {
    const response = await axios.get(
      'https://ksnvbhsbvujcadgbvui.pages.dev/test.json',
      {
        timeout: 4000,
      },
    );
    return response.data.AllMovieDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzShows() {
  try {
    const response = await axios.get(
      'https://ksnvbhsbvujcadgbvui.pages.dev/srs.json',
      {
        timeout: 4000,
      },
    );
    return response.data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzAnime() {
  try {
    const response = await axios.get(
      'https://ksnvbhsbvujcadgbvui.pages.dev/anime.json',
      {
        timeout: 4000,
      },
    );
    return response.data.webSeriesDataList;
  } catch (error) {
    console.error(error);
  }
}

export async function getRingzAdult() {
  try {
    const response = await axios.get(
      'https://ksnvbhsbvujcadgbvui.pages.dev/desihub.json',
      {
        timeout: 4000,
      },
    );
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
