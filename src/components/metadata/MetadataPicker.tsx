import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  TextInput,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';
import AppText from '../ui/Text';
import DropdownField from '../ui/DropdownField';
import {TVFocusable, TVFocusGuide} from '../tv';
import {isTV} from '../../lib/tv/constants';
import {useSafeIsNavFocused} from '../../lib/tv/useTVNavFocusMemory';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {
  cleanFolderQuery,
  type LocalTitle,
  type LocalMetadata,
} from '../../lib/localContent/model';
import {fetchLocalMetadata} from '../../lib/localContent/metadata';
import {
  fetchIMDbSuggestions,
  type IMDbSuggestion,
} from '../../lib/services/imdbSuggestions';

export function ImportAction({
  label,
  onPress,
  primary = false,
  disabled = false,
  preferredFocus = false,
  focusEpoch = 0,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  preferredFocus?: boolean;
  focusEpoch?: number;
}) {
  const colors = useM3Colors();
  const ref = useRef<View>(null);
  const isFocused = useSafeIsNavFocused();
  useEffect(() => {
    if (!isTV || !preferredFocus || !isFocused || disabled) return;
    // Stack and Modal animations can take focus after the initial native request.
    const timers = [60, 350].map(delay =>
      setTimeout(() => {
        const handle = findNodeHandle(ref.current);
        if (handle != null)
          UIManager.dispatchViewManagerCommand(handle, 'requestTVFocus', []);
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [preferredFocus, isFocused, disabled, focusEpoch]);
  return (
    <TVFocusable
      ref={ref}
      hasTVPreferredFocus={isTV && preferredFocus}
      borderRadius={24}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? colors.primary : colors.surfaceContainerHigh,
        opacity: disabled ? 0.45 : 1,
      }}>
      <AppText
        role="labelLarge"
        style={{color: primary ? colors.onPrimary : colors.onSurface}}>
        {label}
      </AppText>
    </TVFocusable>
  );
}

export function MetadataPicker({
  title,
  onChoose,
  onBack,
  options,
}: {
  title: LocalTitle;
  onChoose: (metadata: LocalMetadata) => void;
  onBack: () => void;
  options?: React.ReactNode;
}) {
  const colors = useM3Colors();
  const [mode, setMode] = useState<'search' | 'id'>('search');
  const [focusedField, setFocusedField] = useState<'search' | 'id' | null>(
    null,
  );
  const [query, setQuery] = useState(cleanFolderQuery(title.name));
  const [imdbId, setImdbId] = useState(title.metadata?.imdbId || '');
  const [type, setType] = useState<'movie' | 'series'>(
    title.metadata?.type ||
      (title.episodes.length === 1 && title.episodes[0].episode === undefined
        ? 'movie'
        : 'series'),
  );
  const [suggestions, setSuggestions] = useState<IMDbSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    setSuggestions([]);
    if (mode !== 'search' || query.trim().length < 2) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      fetchIMDbSuggestions(query, controller.signal).then(items => {
        if (!controller.signal.aborted) {
          setSuggestions(items.filter(item => item.imdbId));
          setSearching(false);
        }
      });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mode]);
  const choose = async (id: string, contentType: 'movie' | 'series') => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    try {
      const metadata = await fetchLocalMetadata(
        id.trim(),
        contentType,
        controller.signal,
      );
      if (!controller.signal.aborted) onChoose(metadata);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error ? cause.message : 'Metadata unavailable',
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      request.current = null;
    }
  };
  const fieldStyle = {
    padding: 16,
    borderRadius: 16,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerHigh,
    fontSize: 16,
  };
  return (
    <TVFocusGuide
      autoFocus
      trapFocusLeft
      trapFocusRight
      trapFocusUp
      trapFocusDown
      style={{flex: 1, gap: 16}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <ImportAction label="Back" onPress={onBack} preferredFocus />
        <AppText role="titleLarge" style={{color: colors.onSurface, flex: 1}}>
          Choose movie or series
        </AppText>
      </View>
      {options}
      <View style={{flexDirection: 'row', gap: 8}}>
        <ImportAction
          label="Search titles"
          primary={mode === 'search'}
          onPress={() => {
            setMode('search');
            setError('');
          }}
        />
        <ImportAction
          label="IMDb ID"
          primary={mode === 'id'}
          onPress={() => {
            setMode('id');
            setError('');
          }}
        />
      </View>
      {mode === 'search' ? (
        <>
          <TextInput
            accessibilityLabel="Search movie or series"
            placeholder="Search movie or series"
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            editable={!busy}
            onFocus={() => setFocusedField('search')}
            onBlur={() => setFocusedField(null)}
            style={[
              fieldStyle,
              isTV && {
                borderWidth: 3,
                borderColor:
                  focusedField === 'search' ? colors.primary : 'transparent',
              },
            ]}
            autoCorrect={false}
          />
          {searching && <ActivityIndicator color={colors.primary} />}
          <FlatList
            focusable={false}
            accessible={false}
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={item => item.imdbId!}
            contentContainerStyle={{gap: 8, paddingBottom: 20}}
            ListEmptyComponent={
              !searching ? (
                <AppText style={{color: colors.onSurfaceVariant}}>
                  Search by title, or switch to IMDb ID.
                </AppText>
              ) : null
            }
            renderItem={({item}) => (
              <TVFocusable
                accessibilityRole="button"
                accessibilityLabel={`Choose ${item.title}`}
                disabled={busy}
                onPress={() => {
                  choose(item.imdbId!, item.type === 'tv' ? 'series' : 'movie');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceContainerHigh,
                }}>
                {item.poster ? (
                  <Image
                    source={{uri: item.poster}}
                    style={{width: 48, height: 72, borderRadius: 8}}
                  />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 72,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceContainerHighest,
                    }}
                  />
                )}
                <View style={{flex: 1, gap: 4}}>
                  <AppText role="titleMedium" style={{color: colors.onSurface}}>
                    {item.title}
                  </AppText>
                  <AppText style={{color: colors.onSurfaceVariant}}>
                    {[
                      item.year,
                      item.type === 'tv' ? 'Series' : 'Movie',
                      item.imdbId,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>
              </TVFocusable>
            )}
          />
        </>
      ) : (
        <ScrollView
          focusable={false}
          accessible={false}
          keyboardShouldPersistTaps="handled"
          style={{flex: 1}}
          contentContainerStyle={{gap: 16, paddingBottom: 20}}>
          <AppText style={{color: colors.onSurfaceVariant}}>
            Enter the ID from the title’s IMDb page.
          </AppText>
          <TextInput
            accessibilityLabel="Enter IMDb ID"
            placeholder="tt0944947"
            placeholderTextColor={colors.onSurfaceVariant}
            value={imdbId}
            onChangeText={setImdbId}
            editable={!busy}
            onFocus={() => setFocusedField('id')}
            onBlur={() => setFocusedField(null)}
            style={[
              fieldStyle,
              isTV && {
                borderWidth: 3,
                borderColor:
                  focusedField === 'id' ? colors.primary : 'transparent',
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <DropdownField
            options={['series', 'movie'] as const}
            value={type}
            getKey={v => v}
            getLabel={v => (v === 'series' ? 'Series' : 'Movie')}
            onChange={setType}
            disabled={busy}
          />
          <ImportAction
            label="Use IMDb ID"
            primary
            disabled={busy || !imdbId.trim()}
            onPress={() => {
              choose(imdbId, type);
            }}
          />
        </ScrollView>
      )}
      {busy && (
        <View style={{flexDirection: 'row', gap: 12, padding: 12}}>
          <ActivityIndicator color={colors.primary} />
          <AppText style={{color: colors.onSurface}}>
            Fetching metadata…
          </AppText>
        </View>
      )}
      {!!error && (
        <AppText accessibilityRole="alert" style={{color: colors.error}}>
          {error} You can go back and keep the current metadata.
        </AppText>
      )}
    </TVFocusGuide>
  );
}
