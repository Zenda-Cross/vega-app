// getPosts
export interface Post {
  title: string;
  link: string;
  image: string;
}

// getStream
export interface Stream {
  server: string;
  link: string;
}

// getInfo
export interface Info {
  title: string;
  image: string;
  synopsis: string;
  imdbId: string;
  type: string;
  linkList: Link[];
}

export interface Link {
  title: string;
  quality: string;
  movieLinks: string;
  episodesLink: string;
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
