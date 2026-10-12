import React, {useEffect, useState} from 'react';
import EpisodeThumbnail from '../EpisodeThumbnail';
import {getDownloadedVideoThumbnail} from '../../lib/downloadThumbnailCache';
import {useM3Colors} from '../../theme/M3PaletteContext';

export default function LocalVideoThumbnail({uri}: {uri: string}) {
  const colors = useM3Colors();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setThumbnail(null);
    getDownloadedVideoThumbnail(uri)
      .then(result => {
        if (active) setThumbnail(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [uri]);

  return (
    <EpisodeThumbnail
      uri={thumbnail || undefined}
      accentColor={colors.primary}
    />
  );
}
