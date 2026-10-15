import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {extractImageAccent, getCachedImageAccent} from '../imageAccent';
import {cacheStorage} from '../storage/StorageService';

const cachedImageAccent = (uri?: string) =>
  uri
    ? getCachedImageAccent(`detail-bg-accent-v1:${uri}`) ||
      getCachedImageAccent(`image:${uri}`)
    : undefined;

export function useInfoAccent({
  poster,
  background,
  pageKey,
  enabled,
}: {
  poster?: string;
  background?: string;
  pageKey: string;
  enabled: boolean;
}) {
  const savedKey = `detail-last-accent:${pageKey}`;
  const [accent, setAccent] = useState<string | undefined>(() =>
    enabled
      ? cachedImageAccent(background) ||
        cacheStorage.getString(savedKey) ||
        cachedImageAccent(poster)
      : undefined,
  );
  const [ready, setReady] = useState(
    () => !enabled || !poster || Boolean(accent),
  );

  useEffect(() => {
    if (!enabled) {
      setAccent(undefined);
      setReady(true);
      return;
    }
    const saved =
      cachedImageAccent(background) ||
      cacheStorage.getString(savedKey) ||
      cachedImageAccent(poster);
    if (saved) {
      setAccent(saved);
      setReady(true);
      return;
    }
    if (!poster || Platform.OS !== 'android') {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    // Only read the existing image cache. A miss must not download a poster
    // or delay the page while provider metadata/background artwork arrives.
    const timeout = setTimeout(() => {
      cancelled = true;
      setReady(true);
    }, 200);
    extractImageAccent(poster, `detail-bg-accent-v1:${poster}`, {
      cacheOnly: true,
    }).then(color => {
      if (cancelled) return;
      clearTimeout(timeout);
      if (color) setAccent(color);
      setReady(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // Only seed the opening palette once; late poster results cannot replace
    // the background palette or create another visible color change.
  }, [enabled, pageKey, poster]);

  useEffect(() => {
    if (!enabled || !ready || !background) return;
    let cancelled = false;
    extractImageAccent(background, `detail-bg-accent-v1:${background}`).then(
      color => {
        if (cancelled || !color) return;
        setAccent(color);
        cacheStorage.setString(savedKey, color);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, ready, background, savedKey]);

  return {accent, ready};
}
