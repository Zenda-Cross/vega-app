import axios from 'axios';

export interface IMDbSuggestion {
  imdbId?: string;
  poster?: string;
  title: string;
  type: 'movie' | 'tv';
  year?: number;
}

export const fetchIMDbSuggestions = async (
  query: string,
  signal?: AbortSignal,
): Promise<IMDbSuggestion[]> => {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) {
    return [];
  }

  const firstChar = /^[a-z0-9]/.test(clean) ? clean.charAt(0) : 'x';
  const url = `https://v3.sg.media-imdb.com/suggestion/titles/${encodeURIComponent(
    firstChar,
  )}/${encodeURIComponent(clean)}.json`;

  try {
    const response = await axios.get<{
      d?: Array<{id?: string; i?: {imageUrl?: string}; l?: string; q?: string; qid?: string; y?: number}>;
    }>(url, {
      signal,
      timeout: 5000,
    });

    const items = response.data?.d;
    if (!Array.isArray(items)) {
      return [];
    }

    const suggestions: IMDbSuggestion[] = [];
    const seenTitles = new Set<string>();

    for (const item of items) {
      const title = item?.l?.trim();
      if (!title) continue;

      const normalizedTitle = item.id || title.toLowerCase();
      if (seenTitles.has(normalizedTitle)) continue;
      seenTitles.add(normalizedTitle);

      const q = String(item?.q || '').toLowerCase();
      const qid = String(item?.qid || '').toLowerCase();
      const isTv =
        qid.startsWith('tv') ||
        qid.includes('series') ||
        q.includes('tv') ||
        q.includes('series') ||
        q.includes('episode');

      suggestions.push({
        imdbId: /^tt\d+$/.test(item.id || '') ? item.id : undefined,
        poster: typeof item.i?.imageUrl === 'string' ? item.i.imageUrl : undefined,
        title,
        type: isTv ? 'tv' : 'movie',
        year: item?.y,
      });
    }

    return suggestions;
  } catch (error) {
    if (axios.isCancel(error)) {
      return [];
    }
    console.warn('Error fetching IMDb suggestions:', error);
    return [];
  }
};
