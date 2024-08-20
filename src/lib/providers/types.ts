import {TextTracks, TextTrackType} from 'react-native-video';

// getPosts
export interface Post {
  title: string;
  link: string;
  image: string;
  provider?: string;
}

// getStream
export interface Stream {
  server: string;
  link: string;
  type: string;
  quality?: '360' | '480' | '720' | '1080' | '2160';
  subtitles?: TextTracks;
  headers?: any;
}

// getInfo
export interface Info {
  title: string;
  image: string;
  synopsis: string;
  imdbId: string;
  type: string;
  tags?: string[];
  cast?: string[];
  rating?: string;
  linkList: Link[];
}

export interface Link {
  title: string;
  quality: string;
  movieLinks: string;
  episodesLink: string;
  directLinks?: {
    title: string;
    link: string;
  }[];
}

// getEpisodeLinks
export interface EpisodeLink {
  title: string;
  link: string;
}

// catalog
export interface Catalog {
  title: string;
  filter: string;
}
