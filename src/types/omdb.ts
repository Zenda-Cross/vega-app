export interface OMDBResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

export interface OMDBResponse {
  Search: OMDBResult[];
  totalResults: string;
  Response: string;
}
