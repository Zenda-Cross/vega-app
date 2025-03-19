export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv' | 'person';
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
}
