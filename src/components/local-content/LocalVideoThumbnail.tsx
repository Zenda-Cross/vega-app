import React, {useEffect, useState} from 'react';
import EpisodeThumbnail from '../EpisodeThumbnail';
import {getDownloadedVideoThumbnail} from '../../lib/downloadThumbnailCache';
import {useM3Colors} from '../../theme/M3PaletteContext';

export default function LocalVideoThumbnail({
  uri,
  image,
}: {
  uri: string;
  image?: string;
}) {
  const colors = useM3Colors();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const remoteImage = image?.trim();
  const useRemote =
    !!remoteImage &&
    /^https?:\/\//i.test(remoteImage) &&
    failedImage !== remoteImage;
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setThumbnail(null);
    if (useRemote) return;
    getDownloadedVideoThumbnail(uri)
      .then(result => {
        if (active) setThumbnail(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [uri, useRemote]);

  return (
    <EpisodeThumbnail
      uri={useRemote ? remoteImage : thumbnail || undefined}
      onError={useRemote ? () => setFailedImage(remoteImage!) : undefined}
      accentColor={colors.primary}
    />
  );
}
