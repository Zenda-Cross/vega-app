import React, {useMemo, useState} from 'react';
import {FlatList, ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
import {
  getEpisodeLabel,
  naturalCompare,
  type LocalTitle,
} from '../../lib/localContent/model';
import {localContentLink} from '../../lib/localContent/library';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {LEGACY_TERTIARY_BACKGROUND} from '../../theme/seeds';
import LocalVideoThumbnail from './LocalVideoThumbnail';
import {TVFocusable} from '../tv';
import AppText from '../ui/Text';
import DropdownField from '../ui/DropdownField';
import EpisodeRowContent from '../EpisodeRowContent';
import MaterialDialogSurface from '../ui/MaterialDialogSurface';

export default function LocalSeasonList({
  title,
  onEditMetadata,
}: {
  title: LocalTitle;
  onEditMetadata: () => void;
}) {
  const colors = useM3Colors();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const episodes = title.episodes.filter(e => e.folder === activeSeason);
  return (
    <View style={{gap: 18}}>
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
            <TVFocusable
              accessibilityRole="button"
              accessibilityLabel={getEpisodeLabel(item, title)}
              onLongPress={
                metadata?.overview
                  ? () =>
                      setDetails({
                        title: getEpisodeLabel(item, title),
                        description: metadata.overview!,
                      })
                  : undefined
              }
              onPress={() =>
                navigation.navigate('Player', {
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
              focusScale={1}
              borderRadius={14}
              focusedStyle={{backgroundColor: '#262626'}}
              style={{
                width: '100%',
                marginVertical: 6,
                minHeight: 76,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                borderRadius: 14,
                backgroundColor: LEGACY_TERTIARY_BACKGROUND,
              }}>
              <EpisodeRowContent
                thumbnail={
                  <LocalVideoThumbnail
                    uri={item.uri}
                    image={metadata?.thumbnail}
                  />
                }
                title={getEpisodeLabel(item, title)}
                description={metadata?.overview}
                onShowDetails={
                  metadata?.overview
                    ? () =>
                        setDetails({
                          title: getEpisodeLabel(item, title),
                          description: metadata.overview!,
                        })
                    : undefined
                }
                accentColor={colors.primary}
                textColor="#F5F0EF"
                mutedTextColor="#D4CBC9"
              />
            </TVFocusable>
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
