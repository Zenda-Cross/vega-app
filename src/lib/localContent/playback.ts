import {getEpisodeLabel, naturalCompare, type LocalTitle} from './model';
import {localContentInfo, localContentLink} from './library';

export interface LocalPlayback {
  episodeUri: string;
  position: number;
  duration: number;
  updatedAt: number;
}

export function createLocalPlayback(title: LocalTitle, episodeUri: string, position: number, duration: number): LocalPlayback | undefined {
  if (!title.episodes.some(episode => episode.uri === episodeUri) ||
      !Number.isFinite(position) || position < 0 || !Number.isFinite(duration) || duration <= 0) return;
  return {episodeUri, position: Math.min(position, duration), duration, updatedAt: Date.now()};
}

export function getLocalResume(title: LocalTitle, readProgress: (uri: string) => {position: number; duration: number} | undefined = () => undefined) {
  const episodes = [...title.episodes].sort((a, b) => naturalCompare(a.folder, b.folder) || naturalCompare(a.name, b.name));
  if (!episodes.length) return null;
  const movie = title.metadata?.type === 'movie' || (!title.metadata && episodes.length === 1 && episodes[0].episode === undefined);
  const saved = title.playback;
  let index = episodes.findIndex(episode => episode.uri === saved?.episodeUri);
  // Progress saved before local history existed can still supply a resume point.
  if (index < 0) for (let i = episodes.length - 1; i >= 0; i--) {
    const progress = readProgress(episodes[i].uri);
    if (progress && progress.position > 0 && progress.duration > 0) { index = i; break; }
  }
  let mode: 'resume' | 'next' | 'start' = index < 0 ? 'start' : 'resume';
  if (index < 0) index = 0;
  const progressFor = (i: number) => saved?.episodeUri === episodes[i].uri ? saved : readProgress(episodes[i].uri);
  let progress = progressFor(index);
  if (progress && progress.duration > 0 && progress.position / progress.duration > 0.85) {
    if (movie) return null;
    let next = index + 1;
    while (next < episodes.length) {
      const watched = progressFor(next);
      if (!watched || watched.duration <= 0 || watched.position / watched.duration <= 0.85) break;
      next++;
    }
    if (next >= episodes.length) return null;
    index = next;
    progress = progressFor(index);
    mode = progress && progress.position > 0 ? 'resume' : 'next';
  }
  const episode = episodes[index];
  return {
    episode,
    mode,
    title: getEpisodeLabel(episode, title),
    seasonTitle: movie ? undefined : episode.folder,
    progress: progress && progress.duration > 0 ? progress.position / progress.duration : undefined,
    remainingSeconds: progress && progress.duration > 0 ? Math.max(0, progress.duration - progress.position) : undefined,
    position: progress?.position || 0,
    duration: progress?.duration || 0,
  };
}

export function getLocalPlayerParams(title: LocalTitle, uri: string) {
  const episode = title.episodes.find(item => item.uri === uri);
  if (!episode) return null;
  const episodes = title.episodes.filter(item => item.folder === episode.folder);
  return {
    localContent: true,
    providerValue: 'local',
    infoUrl: localContentLink(title.id),
    primaryTitle: title.metadata?.title || title.name,
    secondaryTitle: episode.folder,
    type: localContentInfo(title).type || 'series',
    linkIndex: episodes.findIndex(item => item.uri === uri),
    episodeList: episodes.map(item => ({id: item.uri, link: item.uri, localFile: true, title: getEpisodeLabel(item, title)})),
    poster: {poster: title.metadata?.poster, background: title.metadata?.background, logo: title.metadata?.logo},
  };
}

export function getLocalContinueWatching(title: LocalTitle, readProgress: Parameters<typeof getLocalResume>[1]) {
  if (title.continueWatchingHidden) return null;
  const target = getLocalResume(title, readProgress);
  if (!target || (!title.playback && !(target.position > 0 && target.duration > 0))) return null;
  // Old cached progress has no reliable playback timestamp; keep it after
  // titles with known recency rather than inventing a last-played time.
  return {...target, updatedAt: title.playback?.updatedAt || 0};
}
