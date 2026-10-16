type VideoSize = {height?: number; width?: number};
type VideoTrack = VideoSize & {selected?: boolean};

export function deduplicateVideoTracks<
  T extends VideoTrack & {bitrate?: number},
>(tracks: T[]): T[] {
  const unique = new Map<string, T>();
  for (const track of tracks) {
    const key = `${track.width}x${track.height}:${track.bitrate}`;
    const previous = unique.get(key);
    // Identical formats can appear in multiple groups. Keep the active copy.
    if (!previous || (track.selected && !previous.selected))
      unique.set(key, track);
  }
  return [...unique.values()];
}

const positiveHeight = (height?: number) =>
  typeof height === 'number' && Number.isFinite(height) && height > 0
    ? Math.round(height)
    : 0;

/** Actual playback wins over source metadata and the user's requested quality. */
export function getPlaybackQuality(
  tracks: VideoTrack[],
  decodedSize: VideoSize | null,
  sourceQuality?: string,
): {height: number; label: string} {
  const active = tracks.find(
    track => track.selected && positiveHeight(track.height),
  );
  const height =
    positiveHeight(active?.height) ||
    positiveHeight(decodedSize?.height) ||
    (tracks.length === 1 ? positiveHeight(tracks[0].height) : 0);
  if (height) return {height, label: `${height}p`};

  // Only use a source's explicit resolution before the decoder has reported one.
  // Labels such as HLS, HD, Local or Auto do not identify a resolution.
  const quality = sourceQuality?.trim() || '';
  const dimensions = quality.match(/\b\d{2,5}\s*[x×]\s*(\d{2,5})\b/i);
  const pixels = quality.match(/^(\d{3,4})p?$/i);
  const k = quality.match(/^(2|4|8)k$/i);
  const fallback = dimensions
    ? Number(dimensions[1])
    : pixels
      ? Number(pixels[1])
      : k
        ? {2: 1440, 4: 2160, 8: 4320}[Number(k[1]) as 2 | 4 | 8]
        : 0;
  return fallback
    ? {height: fallback, label: `${fallback}p`}
    : {height: 0, label: 'Auto'};
}
