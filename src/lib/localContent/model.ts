export interface LocalEntry {
  uri: string;
  name: string;
  directory: boolean;
}

export interface LocalEpisode {
  uri: string;
  name: string;
  folder: string;
  season?: number;
  episode?: number;
}

export interface LocalMetadata {
  imdbId: string;
  type: 'movie' | 'series';
  title: string;
  poster?: string;
  background?: string;
  description?: string;
  logo?: string;
  genres?: string[];
  rating?: string;
  runtime?: string;
  year?: string;
  videos?: {
    season: number;
    episode: number;
    title?: string;
    overview?: string;
    thumbnail?: string;
  }[];
}

export interface LocalTitle {
  playback?: import('./playback').LocalPlayback;
  continueWatchingHidden?: boolean;
  id: string;
  rootUri: string;
  folderUri: string;
  name: string;
  episodes: LocalEpisode[];
  rootFilesOnly?: boolean;
  metadata?: LocalMetadata;
  useMetadataTitles: boolean;
  collections?: string[];
  inLibrary?: boolean;
}

export const isVideoFile = (name: string) =>
  /\.(mkv|mp4|m4v|avi|mov|webm|ts|m2ts|mpeg|mpg|3gp|wmv|flv)$/i.test(name);

export function parseEpisodeName(
  name: string,
  folder = '',
): {season?: number; episode?: number} {
  const explicit =
    name.match(/(?:^|[^a-z0-9])s(\d{1,3})[ ._-]*e(\d{1,4})(?!\d)/i) ||
    name.match(/(?:^|[^a-z0-9])(\d{1,3})x(\d{1,4})(?!\d)/i);
  if (explicit)
    return {season: Number(explicit[1]), episode: Number(explicit[2])};
  const seasonMatch = folder.match(
    /(?:^|[/ ._-])(?:season[ ._-]*|s)(\d{1,3})(?!\d)/i,
  );
  const episodeMatch =
    name.match(/(?:^|[^a-z0-9])(?:episode|ep|e)[ ._-]*(\d{1,4})(?!\d)/i) ||
    name.match(/^(\d{1,3})(?:[ ._-]|\.[a-z]+$)/i);
  return {
    season: seasonMatch ? Number(seasonMatch[1]) : undefined,
    episode: episodeMatch ? Number(episodeMatch[1]) : undefined,
  };
}

export const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'});

export async function scanEpisodes(
  uri: string,
  list: (uri: string) => Promise<LocalEntry[]>,
  signal?: AbortSignal,
  recursive = true,
): Promise<LocalEpisode[]> {
  const episodes: LocalEpisode[] = [];
  const visited = new Set<string>();
  const pending = [{uri, folder: ''}];
  while (pending.length) {
    if (signal?.aborted) throw new Error('Import cancelled');
    const current = pending.shift()!;
    if (visited.has(current.uri)) continue;
    visited.add(current.uri);
    const entries = await list(current.uri);
    for (const entry of entries) {
      if (entry.directory) {
        if (!recursive) continue;
        pending.push({
          uri: entry.uri,
          folder: [current.folder, entry.name].filter(Boolean).join('/'),
        });
      } else if (isVideoFile(entry.name)) {
        episodes.push({
          uri: entry.uri,
          name: entry.name,
          folder: current.folder || 'Default',
          ...parseEpisodeName(entry.name, current.folder),
        });
      }
    }
  }
  return episodes.sort(
    (a, b) =>
      naturalCompare(a.folder, b.folder) || naturalCompare(a.name, b.name),
  );
}

export async function prepareLocalImport(
  root: {uri: string; name: string},
  bulk: boolean,
  list: (uri: string) => Promise<LocalEntry[]>,
  existing: LocalTitle[],
  signal?: AbortSignal,
  onProgress?: (name: string) => void,
): Promise<LocalTitle[]> {
  const entries = bulk ? await list(root.uri) : [];
  const folders = bulk
    ? entries
        .filter(e => e.directory)
        .sort((a, b) => naturalCompare(a.name, b.name))
    : [root];
  const titles: LocalTitle[] = [];
  if (bulk && entries.some(e => !e.directory && isVideoFile(e.name))) {
    const episodes = entries
      .filter(e => !e.directory && isVideoFile(e.name))
      .map(e => ({
        uri: e.uri,
        name: e.name,
        folder: 'Default',
        ...parseEpisodeName(e.name),
      }))
      .sort((a, b) => naturalCompare(a.name, b.name));
    const previous = existing.find(t => t.folderUri === root.uri);
    titles.push({
      id: root.uri,
      rootUri: root.uri,
      folderUri: root.uri,
      name: root.name,
      episodes,
      rootFilesOnly: true,
      metadata: previous?.metadata,
      collections: previous?.collections,
      useMetadataTitles: previous?.useMetadataTitles ?? true,
    });
  }
  for (const folder of folders) {
    if (signal?.aborted) throw new Error('Import cancelled');
    onProgress?.(folder.name);
    const episodes = await scanEpisodes(folder.uri, list, signal);
    if (!episodes.length) continue;
    const previous = existing.find(t => t.folderUri === folder.uri);
    titles.push({
      id: folder.uri,
      rootUri: root.uri,
      folderUri: folder.uri,
      name: folder.name,
      episodes,
      metadata: previous?.metadata,
      collections: previous?.collections,
      useMetadataTitles: previous?.useMetadataTitles ?? true,
    });
  }
  return titles;
}

export function getEpisodeLabel(
  episode: LocalEpisode,
  title: LocalTitle,
): string {
  if (!title.useMetadataTitles) return episode.name;
  if (title.metadata?.type === 'movie' && title.metadata.title.trim()) {
    return 'Movie';
  }
  if (episode.season === undefined || episode.episode === undefined)
    return episode.name;
  const matched = title.metadata?.videos?.find(
    v => v.season === episode.season && v.episode === episode.episode,
  );
  return matched?.title
    ? `S${episode.season} E${episode.episode} · ${matched.title}`
    : episode.name;
}

export const cleanFolderQuery = (name: string) =>
  name
    .replace(/[._]/g, ' ')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\b(?:19|20)\d{2}\b.*$/, '')
    .trim();
