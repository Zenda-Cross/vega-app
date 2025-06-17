import {Post, ProviderContext} from '../types';

export const protonGetPosts = async function ({
  filter,
  page,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const {getBaseUrl, axios, cheerio} = providerContext;
  const baseUrl = await getBaseUrl('protonMovies');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts({url, baseUrl, signal, axios, cheerio});
};

export const protonGetPostsSearch = async function ({
  searchQuery,
  page,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const {getBaseUrl, axios, cheerio} = providerContext;
  const baseUrl = await getBaseUrl('protonMovies');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;
  return posts({url, baseUrl, signal, axios, cheerio});
};

async function posts({
  url,
  baseUrl,
  signal,
  axios,
  cheerio,
}: {
  url: string;
  baseUrl: string;
  signal: AbortSignal;
  axios: ProviderContext['axios'];
  cheerio: ProviderContext['cheerio'];
}): Promise<Post[]> {
  function decodeHtml(encodedArray: string[]): string {
    // Join array elements into a single string
    const joined = encodedArray.join('');

    // Replace escaped quotes
    const unescaped = joined.replace(/\\"/g, '"').replace(/\\'/g, "'");

    // Remove remaining escape characters
    const cleaned = unescaped
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r');

    // Convert literal string representations back to characters
    const decoded = cleaned
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    return decoded;
  }
  try {
    const res = await axios.get(url, {
      headers: {
        referer: baseUrl,
      },
      signal,
    });
    const data = res.data;
    const regex = /\[(?=.*?"<div class")(.*?)\]/g;
    const htmlArray = data?.match(regex);
    const html = decodeHtml(JSON.parse(htmlArray[htmlArray.length - 1]));
    const $ = cheerio.load(html);
    const catalog: Post[] = [];
    $('.col.mb-4').map((i, element) => {
      const title = $(element).find('h5').text();
      const link = $(element).find('h5').find('a').attr('href');
      const image =
        $(element).find('img').attr('data-src') ||
        $(element).find('img').attr('src') ||
        '';
      if (title && link && image) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error('protonGetPosts error ', err);
    return [];
  }
}
