import {Info, Link} from '../types';
export async function ringzGetInfo(data: string): Promise<Info> {
  try {
    const dataJson = JSON.parse(data);
    const title = dataJson?.kn || dataJson?.mn;
    const image = dataJson?.IH || dataJson?.IV;
    const tags = dataJson?.gn
      .split(',')
      .slice(0, 3)
      .map((tag: string) => tag.trim());
    const type = dataJson?.cg === 'webSeries' ? 'series' : 'movie';
    const linkList: Link[] = [];
    console.log('tags', tags);
    if (dataJson?.cg === 'webSeries') {
      ['1', '2', '3', '4']?.forEach(item => {
        const directLinks: Link['directLinks'] = [];
        // console.log(dataJson?.['eServer' + item]);
        if (
          typeof dataJson?.['eServer' + item] === 'object' &&
          Object?.keys(dataJson?.['eServer' + item])?.length > 0
        ) {
          Object.keys(dataJson?.['eServer' + item]).forEach(key => {
            directLinks.push({
              title: 'Episode ' + key,
              link: JSON.stringify({
                url: dataJson?.['eServer' + item][key],
                server: 'Server ' + item,
              }),
            });
          });
          linkList.push({
            title: dataJson?.pn + ' (Server ' + item + ')',
            directLinks,
          });
        }
      });
    } else {
      console.log('Movie', dataJson.s1);
      const directLinks: Link['directLinks'] = [];
      ['1', '2', '3', '4']?.forEach(item => {
        if (dataJson?.['s' + item]) {
          directLinks.push({
            title: 'Server ' + item + ' (HD)',
            link: JSON.stringify({
              url: dataJson?.s1,
              server: 'Server ' + item,
            }),
          });
        }

        if (dataJson?.['4s' + item]) {
          directLinks.push({
            title: 'Server ' + item + ' (480p)',
            link: JSON.stringify({
              url: dataJson?.['4s' + item],
              server: 'Server ' + item,
            }),
          });
        }
      });

      linkList.push({
        title: dataJson?.mn,
        directLinks,
      });
    }

    return {
      image,
      imdbId: '',
      synopsis: dataJson?.mn,
      title,
      type,
      linkList,
      tags,
    };
  } catch (error) {
    console.error(error);
    return {
      title: '',
      image: '',
      imdbId: '',
      synopsis: '',
      linkList: [],
      type: 'uhd',
    };
  }
}
