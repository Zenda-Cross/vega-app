type Links = {
  lang: string;
  url: string;
};
export async function stableExtractor(url: string): Promise<Links[]> {
  try {
    // console.log('stableExtractorUrl', url);
    const links: Links[] = [];

    const res = await fetch(url);
    const html = await res.text();
    // console.log('stableExtractorHtml', html);

    const regex = /file:\s*"([^"]+)"/;
    const match = regex.exec(html);
    if (match) {
      const [, url] = match;
      links.push({lang: '', url});
    }
    // console.log('stableExtractor', links);
    return links;
  } catch (err) {
    console.error('stableExtractor', err);
    return [];
  }
}
