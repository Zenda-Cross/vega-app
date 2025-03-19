import {TMDBResult} from '../types/tmdb';

const TMDB_API_KEY = '5a209f099efaba1cd26a904e09b90829';
const BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBResponse {
  results: TMDBResult[];
  page: number;
  total_pages: number;
  total_results: number;
}

export const searchTMDB = async (query: string): Promise<TMDBResult[]> => {
  if (!query) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query,
      )}`,
    );
    const data: TMDBResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB search error:', error);
    return [];
  }
};
