import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {autoEmbedDramaAndAnimePosts} from '../autoEmbedAnime/aeaGetPosts';

export const dramacoolGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('dc');
  const url = `${baseUrl + filter}?page=${page}`;

  return await autoEmbedDramaAndAnimePosts(baseUrl, url, signal);
};

export const dramacoolGetSearchPosts = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  if (page > 1) {
    return [];
  }
  const baseUrl = await getBaseUrl('dc');
  const url = `${baseUrl}/search.html?keyword=${searchQuery}`;

  return await autoEmbedDramaAndAnimePosts(baseUrl, url, signal);
};