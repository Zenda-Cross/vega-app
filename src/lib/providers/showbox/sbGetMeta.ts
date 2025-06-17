import {Info, Link, ProviderContext} from '../types';

export const sbGetInfo = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const {axios, cheerio} = providerContext;
    const url = link;
    const res = await axios.get(url);
    const data = res.data;
    const $ = cheerio.load(data);
    const type = url.includes('tv') ? 'series' : 'movie';
    const imdbId = '';
    const title = $('.heading-name').text();
    const rating =
      $('.btn-imdb')
        .text()
        ?.match(/\d+(\.\d+)?/g)?.[0] || '';
    const image =
      $('.cover_follow').attr('style')?.split('url(')[1]?.split(')')[0] || '';
    const synopsis = $('.description')
      .text()
      ?.replaceAll(/[\n\t]/g, '')
      ?.trim();
    const febID = $('.heading-name').find('a').attr('href')?.split('/')?.pop();
    const baseUrl = url.split('/').slice(0, 3).join('/');
    const indexUrl = `${baseUrl}/index/share_link?id=${febID}&type=${
      type === 'movie' ? '1' : '2'
    }`;
    const indexRes = await axios.get(indexUrl);
    const indexData = indexRes.data;
    const febKey = indexData.data.link.split('/').pop();
    const febLink = `https://www.febbox.com/file/file_share_list?share_key=${febKey}&is_html=0`;
    const febRes = await axios.get(febLink);
    const febData = febRes.data;
    const fileList = febData?.data?.file_list;
    const links: Link[] = [];
    if (fileList) {
      fileList.map((file: any) => {
        const fileName = `${file.file_name} (${file.file_size})`;
        const fileId = file.fid;
        links.push({
          title: fileName,
          episodesLink: file.is_dir ? `${febKey}&${fileId}` : `${febKey}&`,
        });
      });
    }
    return {
      title,
      rating,
      synopsis,
      image,
      imdbId,
      type,
      linkList: links,
    };
  } catch (err) {
    return {
      title: '',
      rating: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: '',
      linkList: [],
    };
  }
};
