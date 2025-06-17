import {Info, Link, ProviderContext} from '../types';

const headers = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Cache-Control': 'no-store',
  'Accept-Language': 'en-US,en;q=0.9',
  DNT: '1',
  'sec-ch-ua':
    '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  Cookie:
    '_lscache_vary=62abf8b96599676eb8ec211cffaeb8ff; ext_name=ojplmecpdpgccookcobabopnaifgidhf; cf_clearance=n4Y1XTKZ5TfIMBNQuAXzerwKpx0U35KoOm3imfT0GpU-1732097818-1.2.1.1-ZeAnEu.8D9TSZHYDoj7vwo1A1rpdKl304ZpaBn_QbAQOr211JFAb7.JRQU3EL2eIy1Dfl8HhYvH7_259.22lUz8gbchHcQ8hvfuQXMtFMCbqDBLzjNUZa9stuk.39l28IcPhH9Z2szsf3SGtNI1sAfo66Djt7sOReLK3lHw9UkJp7BdGqt6a2X9qAc8EsAI3lE480Tmt0fkHv14Oc30LSbPB_WwFmiqAki2W.Gv9hV7TN_QBFESleTDlXd.6KGflfd4.KwWF7rpSRo_cgoc9ALLLIafpxHVbe7_g5r7zvpml_Pj8fEL75fw.1GBuy16bciHBuB8s_kahuJYUnhtQFFgfTQl8_Gn6KeovBWx.PJ7nFv5sklHUfAyBVq3t30xKe8ZDydsQ_G.yipfj_In5GmmWcXGb6E4.bioDOwW_sKLtxwdTQt7Nu.RkILX_mKvXNpyLqflIVj8G7X5E8I.unw',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
};

export const vegaGetInfo = async ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> => {
  try {
    const {axios, cheerio} = providerContext;
    const url = link;
    console.log('url', url);
    const baseUrl = url.split('/').slice(0, 3).join('/');
    const response = await axios.get(url, {
      headers: {
        ...headers,
        Referer: baseUrl,
      },
    });
    const $ = cheerio.load(response.data);
    const infoContainer = $('.entry-content,.post-inner');
    const heading = infoContainer?.find('h3');
    const imdbId =
      heading?.next('p')?.find('a')?.[0]?.attribs?.href?.match(/tt\d+/g)?.[0] ||
      infoContainer.text().match(/tt\d+/g)?.[0] ||
      '';
    // console.log(imdbId)

    const type = heading?.next('p')?.text()?.includes('Series Name')
      ? 'series'
      : 'movie';
    //   console.log(type);
    // title
    const titleRegex = /Name: (.+)/;
    const title = heading?.next('p')?.text()?.match(titleRegex)?.[1] || '';
    //   console.log(title);

    // synopsis
    const synopsisNode = infoContainer?.find('p')?.next('h3,h4')?.next('p')?.[0]
      ?.children?.[0];
    const synopsis =
      synopsisNode && 'data' in synopsisNode ? synopsisNode.data : '';
    //   console.log(synopsis);

    // image
    let image =
      infoContainer?.find('img[data-lazy-src]')?.attr('data-lazy-src') || '';
    if (image.startsWith('//')) {
      image = 'https:' + image;
    }
    // console.log(image);

    // console.log({title, synopsis, image, imdbId, type});
    /// Links
    const hr = infoContainer?.first()?.find('hr');
    const list = hr?.nextUntil('hr');
    const links: Link[] = [];
    list.each((index, element: any) => {
      element = $(element);
      // title
      const title = element?.text() || '';

      const quality = element?.text().match(/\d+p\b/)?.[0] || '';
      // console.log(title);
      // movieLinks
      const movieLinks = element
        ?.next()
        .find('.dwd-button')
        .text()
        .toLowerCase()
        .includes('download')
        ? element?.next().find('.dwd-button')?.parent()?.attr('href')
        : '';

      // episode links
      const vcloudLinks = element
        ?.next()
        .find(
          ".btn-outline[style='background:linear-gradient(135deg,#ed0b0b,#f2d152); color: white;'],.btn-outline[style='background:linear-gradient(135deg,#ed0b0b,#f2d152); color: #fdf8f2;']",
        )
        ?.parent()
        ?.attr('href');
      console.log(title);
      const episodesLink =
        (vcloudLinks
          ? vcloudLinks
          : element
              ?.next()
              .find('.dwd-button')
              .text()
              .toLowerCase()
              .includes('episode')
          ? element?.next().find('.dwd-button')?.parent()?.attr('href')
          : '') ||
        element
          ?.next()
          .find(
            ".btn-outline[style='background:linear-gradient(135deg,#0ebac3,#09d261); color: white;']",
          )
          ?.parent()
          ?.attr('href');
      if (movieLinks || episodesLink) {
        links.push({
          title,
          directLinks: movieLinks
            ? [{title: 'Movie', link: movieLinks, type: 'movie'}]
            : [],
          episodesLink,
          quality,
        });
      }
    });
    // console.log(links);
    return {
      title,
      synopsis,
      image,
      imdbId,
      type,
      linkList: links,
    };
  } catch (error) {
    console.log('getInfo error');
    console.error(error);
    // ToastAndroid.show('No response', ToastAndroid.SHORT);
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: '',
      linkList: [],
    };
  }
};
