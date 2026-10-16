import React, {memo, useCallback, useMemo} from 'react';
import {FlatList, ScrollView, Text, View} from 'react-native';
import type {Stream} from '../lib/providers/types';
import {isTV} from '../lib/tv/constants';
import PlayerMenuRow from './PlayerMenuRow';

type Item = {
  key: string;
  title: string;
  detail?: string;
  quality?: string;
  tags?: string[];
  icon: React.ComponentProps<typeof PlayerMenuRow>['icon'];
  stream?: Stream;
  qualityIndex?: number;
};

type RowProps = {
  item: Item;
  selected: boolean;
  accentColor: string;
  preferredRef?: React.RefObject<View | null>;
  onSelect: (item: Item) => void;
  onTVFocus: () => void;
};

// Rows keep their handlers and native views when another selection or a
// playback update rerenders the menu. Only changed selections need to repaint.
const SourceRow = memo(
  ({
    item,
    selected,
    accentColor,
    preferredRef,
    onSelect,
    onTVFocus,
  }: RowProps) => {
    const onPress = useCallback(() => onSelect(item), [item, onSelect]);
    return (
      <PlayerMenuRow
        ref={preferredRef}
        title={item.title}
        detail={item.detail}
        quality={item.quality}
        tags={item.tags}
        icon={item.icon}
        selected={selected}
        hasTVPreferredFocus={Boolean(preferredRef)}
        accentColor={accentColor}
        onTVFocus={onTVFocus}
        onPress={onPress}
      />
    );
  },
);

const itemKey = (item: Item) => item.key;
const columnStyle = {flex: 1};
const columnContent = {paddingHorizontal: 4, paddingBottom: 8};

type ColumnProps = {
  items: Item[];
  selectedKey: string;
  preferredKey?: string;
  title: string;
  message?: string;
  footer?: React.ReactElement;
  accentColor: string;
  preferredRef?: React.RefObject<View | null>;
  onSelect: (item: Item) => void;
  onTVFocus: () => void;
};

const MenuColumn = memo(
  ({
    items,
    selectedKey,
    preferredKey,
    title,
    message,
    footer,
    accentColor,
    preferredRef,
    onSelect,
    onTVFocus,
  }: ColumnProps) => {
    const focusKey = preferredKey ?? selectedKey;
    const renderItem = useCallback(
      ({item}: {item: Item}) => (
        <SourceRow
          item={item}
          selected={item.key === selectedKey}
          accentColor={accentColor}
          preferredRef={item.key === focusKey ? preferredRef : undefined}
          onSelect={onSelect}
          onTVFocus={onTVFocus}
        />
      ),
      [selectedKey, focusKey, accentColor, preferredRef, onSelect, onTVFocus],
    );
    const header = (
      <>
        <Text className="mb-2 text-center text-white text-lg font-extrabold">
          {title}
        </Text>
        {message ? (
          <Text className="mb-2 text-center text-xs text-white/70">
            {message}
          </Text>
        ) : null}
      </>
    );

    // Keep native D-pad traversal and the preferred row's ref available on TV.
    // Phones only mount a small visible window, even with hundreds of sources.
    return isTV ? (
      <ScrollView style={columnStyle} contentContainerStyle={columnContent}>
        {header}
        {items.map(item => (
          <React.Fragment key={item.key}>{renderItem({item})}</React.Fragment>
        ))}
        {footer}
      </ScrollView>
    ) : (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={itemKey}
        extraData={selectedKey}
        style={columnStyle}
        contentContainerStyle={columnContent}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        updateCellsBatchingPeriod={16}
      />
    );
  },
);

type Props = {
  streams: Stream[];
  selectedUrl: string;
  isLocal: boolean;
  videoTracks: any[];
  selectedQualityIndex: number;
  activeResolution?: string;
  videoLoaded: boolean;
  loading: boolean;
  accentColor: string;
  preferredRef: React.RefObject<View | null>;
  getQualityIcon: (height?: number | string) => Item['icon'];
  onSelectStream: (stream: Stream) => void;
  onSelectQuality: (index: number) => void;
  onSelectLocal: () => unknown;
  onTVFocus: () => void;
};

const PlayerSourceMenu = memo(
  ({
    streams,
    selectedUrl,
    isLocal,
    videoTracks,
    selectedQualityIndex,
    activeResolution,
    videoLoaded,
    loading,
    accentColor,
    preferredRef,
    getQualityIcon,
    onSelectStream,
    onSelectQuality,
    onSelectLocal,
    onTVFocus,
  }: Props) => {
    const servers = useMemo(
      () =>
        streams.map((stream, index): Item => {
          const rawTags = Array.isArray(stream.tags)
            ? stream.tags
            : typeof stream.tag === 'string'
              ? [stream.tag]
              : [];
          const tags = rawTags
            .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
            .filter(
              tag =>
                tag &&
                tag.toLowerCase() !== stream.quality?.trim().toLowerCase(),
            );
          return {
            key: `${index}:${stream.link}`,
            title: stream.server || `Server ${index + 1}`,
            quality: stream.quality,
            tags: tags.length ? tags : undefined,
            icon: 'dns',
            stream,
          };
        }),
      [streams],
    );
    const qualities = useMemo(() => {
      const items: Item[] = videoTracks.map((track, index) => {
        const bitrate = track.bitrate
          ? track.bitrate >= 1000000
            ? `${(track.bitrate / 1000000).toFixed(1)} Mbps`
            : `${Math.round(track.bitrate / 1000)} kbps`
          : undefined;
        return {
          key: String(index),
          title: track.height
            ? `${track.height}p`
            : track.width
              ? `${track.width}p`
              : 'Standard',
          detail: [
            bitrate,
            track.width && track.height && `${track.width}x${track.height}`,
            track.codecs,
          ]
            .filter(Boolean)
            .join(' · '),
          icon: getQualityIcon(track.height),
          qualityIndex: index,
        };
      });
      if (videoTracks.length > 1)
        items.unshift({
          key: '1000',
          title: 'Auto',
          detail: selectedQualityIndex === 1000 && activeResolution ? `Adaptive bitrate · ${activeResolution}` : 'Adaptive bitrate',
          icon: 'video-settings',
          qualityIndex: 1000,
        });
      return items;
    }, [videoTracks, getQualityIcon, selectedQualityIndex, activeResolution]);
    const selectServer = useCallback(
      (item: Item) => {
        if (item.stream) onSelectStream(item.stream);
      },
      [onSelectStream],
    );
    const selectQuality = useCallback(
      (item: Item) => {
        if (item.qualityIndex !== undefined) onSelectQuality(item.qualityIndex);
      },
      [onSelectQuality],
    );
    const local = useMemo(
      () => (
        <View className="mt-1 border-t border-white/10 pt-1">
          <PlayerMenuRow
            title="Local video"
            detail="Choose a file from this device"
            selected={isLocal}
            accentColor={accentColor}
            icon="folder-open"
            onPress={onSelectLocal}
            onTVFocus={onTVFocus}
          />
        </View>
      ),
      [isLocal, accentColor, onSelectLocal, onTVFocus],
    );
    const selectedServerKey = useMemo(
      () => servers.find(item => item.stream?.link === selectedUrl)?.key || '',
      [servers, selectedUrl],
    );
    const preferredServerKey = selectedServerKey || servers[0]?.key || '';

    return (
      <View className="flex-row w-full h-full p-1 px-4">
        <MenuColumn
          items={servers}
          selectedKey={selectedServerKey}
          preferredKey={preferredServerKey}
          title="Server"
          message={loading ? 'Loading online servers...' : undefined}
          footer={local}
          accentColor={accentColor}
          preferredRef={preferredRef}
          onSelect={selectServer}
          onTVFocus={onTVFocus}
        />
        <View
          style={{
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            marginHorizontal: 4,
          }}
        />
        <MenuColumn
          items={qualities}
          selectedKey={String(selectedQualityIndex)}
          title="Quality"
          message={
            videoTracks.length === 0
              ? videoLoaded
                ? 'No quality options reported for this stream'
                : 'Loading video tracks...'
              : videoTracks.length === 1
                ? 'This stream has a single quality'
                : undefined
          }
          accentColor={accentColor}
          onSelect={selectQuality}
          onTVFocus={onTVFocus}
        />
      </View>
    );
  },
);

export default PlayerSourceMenu;
