type Links = {
  lang: string;
  url: string;
};
export async function multiExtractor(url: string): Promise<Links[]> {
  try {
    // console.log('multiExtractorUrl', url);
    const links: Links[] = [];

    const res = await fetch(url);
    const html = await res.text();

    const regex = /"title":\s*"([^"]+)",\s*"file":\s*"([^"]+)"/g;

    let match;
    while ((match = regex.exec(html))) {
      const [, lang, url] = match;
      links.push({lang, url});
    }
    console.log('multiExtractor', links);
    return links;
  } catch (err) {
    console.error('multiExtractor', err);
    return [];
  }
}
