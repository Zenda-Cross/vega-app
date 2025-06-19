import { OMDBResult, OMDBResponse } from '../types/omdb';

const OMDB_API_KEY = '7755307f';
const BASE_URL = 'https://www.omdbapi.com';

export const searchOMDB = async (query: string): Promise<OMDBResult[]> => {
  if (!query) {
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`,
    );
    const data: OMDBResponse = await response.json();
    return data.Response === 'True' ? data.Search : [];
  } catch (error) {
    console.error('OMDB search error:', error);
    return [];
  }
};
