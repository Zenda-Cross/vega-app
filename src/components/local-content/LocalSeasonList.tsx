import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {BackHandler, FlatList, ScrollView, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
import {
  getEpisodeLabel,
  naturalCompare,
  type LocalTitle,
} from '../../lib/localContent/model';
import {localContentLink} from '../../lib/localContent/library';
import {useM3Colors} from '../../theme/M3PaletteContext';
import LocalVideoThumbnail from './LocalVideoThumbnail';
import {TVFocusable} from '../tv';
import AppText from '../ui/Text';
import DropdownField from '../ui/DropdownField';
import ManagedEpisodeRow from '../ManagedEpisodeRow';
import {useScreenOverlay} from '../ScreenOverlayHost';
import ManagedEpisodeSelectionBar from '../ManagedEpisodeSelectionBar';
import {deleteLocalEpisodes} from '../../lib/localContent/delete';
import {showAppDialog} from '../../lib/zustand/appDialogStore';
import MaterialDialogSurface from '../ui/MaterialDialogSurface';
import LocalResumeCard from './LocalResumeCard';

export default function LocalSeasonList({
  title,
  onEditMetadata,
}: {
  title: LocalTitle;
  onEditMetadata: () => void;
}) {
  const setOverlay = useScreenOverlay();
  const colors = useM3Colors();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (!selecting) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setSelecting(false);
        setSelected(new Set());
        return true;
      });
      return () => sub.remove();
    }, [selecting]),
  );
  const toggleSelected = (uri: string) =>
    setSelected(current => {
      const next = new Set(current);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  const confirmDelete = (uris: string[]) => {
    if (!uris.length || deleting) return;
    showAppDialog({
      title:
        uris.length === 1 ? 'Delete video?' : `Delete ${uris.length} videos?`,
      message: 'Permanently delete the selected video files from this device?',
      variant: 'warning',
      actions: [
        {label: 'Cancel'},
        {
          label: 'Delete',
          variant: 'destructive',
          onPress: () => {
            setDeleting(true);
            deleteLocalEpisodes(uris)
              .then(() => {
                setSelected(new Set());
                setSelecting(false);
              })
              .catch(error =>
                showAppDialog({
                  title: 'Could not delete all files',
                  message:
                    error instanceof Error ? error.message : String(error),
                  actions: [{label: 'OK'}],
                }),
              )
              .finally(() => setDeleting(false));
          },
        },
      ],
    });
  };
  const [season, setSeason] = useState('');
  const [details, setDetails] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const seasons = useMemo(
    () => [...new Set(title.episodes.map(e => e.folder))].sort(naturalCompare),
    [title.episodes],
  );
  const activeSeason = seasons.includes(season) ? season : seasons[0];
  const episodes = useMemo(
    () => title.episodes.filter(e => e.folder === activeSeason),
    [title.episodes, activeSeason],
  );
  const selectionMenu = useMemo(
    () =>
      selecting ? (
        <ManagedEpisodeSelectionBar
          count={selected.size}
          busy={deleting}
          allSelected={
            episodes.length > 0 &&
            episodes.every(episode => selected.has(episode.uri))
          }
          onDone={() => {
            setSelecting(false);
            setSelected(new Set());
          }}
          onSelectAll={() =>
            setSelected(current => {
              const next = new Set(current);
              const all = episodes.every(episode => next.has(episode.uri));
              for (const episode of episodes) {
                if (all) next.delete(episode.uri);
                else next.add(episode.uri);
              }
              return next;
            })
          }
          onInvertSelection={() =>
            setSelected(current => {
              const next = new Set(current);
              for (const episode of episodes) {
                if (next.has(episode.uri)) next.delete(episode.uri);
                else next.add(episode.uri);
              }
              return next;
            })
          }
          onDelete={() => confirmDelete([...selected])}
        />
      ) : null,
    [selecting, selected, deleting, episodes],
  );
  useEffect(() => {
    if (!setOverlay) return;
    setOverlay(selectionMenu);
    return () => setOverlay(null);
  }, [setOverlay, selectionMenu]);
  return (
    <View style={{gap: 18}}>
      <LocalResumeCard title={title} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <AppText role="titleLarge" style={{color: colors.onSurface}}>
          On this device
        </AppText>
        <TVFocusable
          accessibilityRole="button"
          accessibilityLabel="Edit metadata"
          onPress={onEditMetadata}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.surfaceContainerHigh,
            borderRadius: 20,
          }}>
          <AppText style={{color: colors.primary}}>Edit metadata</AppText>
        </TVFocusable>
      </View>
      <DropdownField
        showFullOptionLabels
        options={seasons}
        value={activeSeason}
        getKey={s => s}
        getLabel={s => s}
        onChange={setSeason}
        placeholder="Select season"
      />
      {!setOverlay && selectionMenu}
      <FlatList
        scrollEnabled={false}
        data={episodes}
        keyExtractor={episode => episode.uri}
        ListEmptyComponent={
          <AppText style={{color: colors.onSurfaceVariant}}>
            No video files. Pull down to rescan the folder.
          </AppText>
        }
        renderItem={({item, index}) => {
          const metadata = title.metadata?.videos?.find(
            video =>
              video.season === item.season && video.episode === item.episode,
          );
          return (
            <ManagedEpisodeRow
              title={getEpisodeLabel(item, title)}
              thumbnail={
                <LocalVideoThumbnail
                  uri={item.uri}
                  image={metadata?.thumbnail}
                />
              }
              description={metadata?.overview}
              selecting={selecting}
              selected={selected.has(item.uri)}
              busy={deleting}
              onLongPress={() => {
                setSelecting(true);
                toggleSelected(item.uri);
              }}
              onDelete={() => confirmDelete([item.uri])}
              onShowDetails={
                metadata?.overview
                  ? () =>
                      setDetails({
                        title: getEpisodeLabel(item, title),
                        description: metadata.overview!,
                      })
                  : undefined
              }
              onPress={() =>
                selecting
                  ? toggleSelected(item.uri)
                  : navigation.navigate('Player', {
                      localContent: true,
                      linkIndex: index,
                      episodeList: episodes.map(episode => ({
                        id: episode.uri,
                        link: episode.uri,
                        title: getEpisodeLabel(episode, title),
                      })),
                      primaryTitle: title.metadata?.title || title.name,
                      secondaryTitle: activeSeason,
                      type:
                        title.metadata?.type ||
                        (title.episodes.length === 1 ? 'movie' : 'series'),
                      providerValue: 'local',
                      infoUrl: localContentLink(title.id),
                      poster: {
                        poster: title.metadata?.poster,
                        background: title.metadata?.background,
                        logo: title.metadata?.logo,
                      },
                    })
              }
            />
          );
        }}
      />
      <MaterialDialogSurface
        visible={details !== null}
        onDismiss={() => setDetails(null)}>
        <AppText
          role="titleLarge"
          style={{color: colors.onSurface, marginBottom: 12}}>
          {details?.title}
        </AppText>
        <ScrollView style={{maxHeight: 300}}>
          <AppText
            role="bodyMedium"
            style={{color: colors.onSurfaceVariant, lineHeight: 22}}>
            {details?.description}
          </AppText>
        </ScrollView>
        <TVFocusable
          accessibilityRole="button"
          accessibilityLabel="Close episode details"
          onPress={() => setDetails(null)}
          style={{alignSelf: 'flex-end', padding: 12, marginTop: 12}}>
          <AppText style={{color: colors.primary}}>Close</AppText>
        </TVFocusable>
      </MaterialDialogSurface>
    </View>
  );
}
