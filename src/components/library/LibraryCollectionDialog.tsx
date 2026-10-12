import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  LIBRARY_COLORS,
  LIBRARY_EMOJIS,
  LIBRARY_ICON_KEYS,
} from '../../lib/library/libraryIcons';
import {
  DEFAULT_COLLECTION_ID,
  getItemCollectionIds,
  type LibraryCollection,
  type WatchListItem,
} from '../../lib/storage/WatchListStorage';
import {isTV} from '../../lib/tv';
import {useTVFocusBorderColor} from '../../lib/tv/useTVFocusBorderColor';
import useWatchListStore from '../../lib/zustand/watchListStore';
import useLocalContentStore from '../../lib/zustand/localContentStore';
import {localContentId, localLibraryItem} from '../../lib/localContent/library';
import {useM3Colors} from '../../theme/M3PaletteContext';
import {readableOnColor} from '../../theme/seeds';
import {TVFocusable} from '../tv';
import AppText from '../ui/Text';
import LibraryIcon from './LibraryIcon';

interface LibraryCollectionDialogProps {
  visible: boolean;
  onClose: () => void;
  /** Title to save. Opens the category picker for it. */
  item?: WatchListItem;
  /** Category to edit. Without `item` or this, the dialog creates one. */
  collection?: LibraryCollection;
  /** Called with the category after it was created or edited. */
  onSaved?: (collection: LibraryCollection) => void;
}

type View_ = 'pick' | 'edit';
type IconTab = 'icons' | 'emoji';

const NAME_MAX_LENGTH = 40;

/**
 * Save a title to library categories, or create and edit a category with a
 * name, icon (icon or emoji) and color. One modal for both, so creating a
 * category while saving a title does not stack dialogs (TV focus stays here).
 */
const LibraryCollectionDialog = ({
  visible,
  onClose,
  item,
  collection,
  onSaved,
}: LibraryCollectionDialogProps) => {
  const colors = useM3Colors();
  const focusBorderColor = useTVFocusBorderColor();
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const watchList = useWatchListStore(state => state.watchList);
  const localTitles = useLocalContentStore(state => state.titles);
  const collections = useWatchListStore(state => state.collections);
  const setItemCollections = useWatchListStore(
    state => state.setItemCollections,
  );
  const createCollection = useWatchListStore(state => state.createCollection);
  const updateCollection = useWatchListStore(state => state.updateCollection);
  const deleteCollection = useWatchListStore(state => state.deleteCollection);

  const [view, setView] = useState<View_>(item ? 'pick' : 'edit');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('popcorn');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [iconTab, setIconTab] = useState<IconTab>('icons');
  const [nameFocused, setNameFocused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const editing = view === 'edit' && Boolean(collection) && !item;

  // Reset only when the dialog opens or its target changes. Parents build
  // `item` inline, so a new object each render must not reset the form.
  const itemLink = item?.link;
  const collectionId = collection?.id;
  useEffect(() => {
    if (!visible) {
      return;
    }
    setView(item ? 'pick' : 'edit');
    setName(collection?.name || '');
    setIcon(collection?.icon || 'popcorn');
    setColor(collection?.color);
    setIconTab(
      collection?.icon && !LIBRARY_ICON_KEYS.includes(collection.icon)
        ? 'emoji'
        : 'icons',
    );
    setConfirmDelete(false);
  }, [visible, itemLink, collectionId]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const existingIds = useMemo(
    () => new Set(collections.map(c => c.id)),
    [collections],
  );
  const localTitle = localTitles.find(title => title.id === localContentId(item?.link || ''));
  const savedItem = localTitle
    ? localTitle.inLibrary !== false ? localLibraryItem(localTitle) : undefined
    : item ? watchList.find(saved => saved.link === item.link) : undefined;
  const selectedIds = savedItem
    ? getItemCollectionIds(savedItem, existingIds)
    : [];

  const toggleCollection = (id: string) => {
    if (!item) {
      return;
    }
    const next = selectedIds.includes(id)
      ? selectedIds.filter(selected => selected !== id)
      : [...selectedIds, id];
    setItemCollections(savedItem || item, next);
  };

  const openCreate = () => {
    setName('');
    setIcon('popcorn');
    setColor(undefined);
    setIconTab('icons');
    setView('edit');
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    Keyboard.dismiss();
    if (editing && collection) {
      updateCollection(collection.id, {name: trimmed, icon, color});
      onSaved?.({...collection, name: trimmed, icon, color});
      onClose();
      return;
    }
    const created = createCollection({name: trimmed, icon, color});
    onSaved?.(created);
    if (item) {
      // Saving a title: put it in the new category, then show the picker.
      setItemCollections(savedItem || item, [...selectedIds, created.id]);
      setView('pick');
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    if (!collection) {
      return;
    }
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCollection(collection.id);
    onClose();
  };

  const handleBackOrClose = () => {
    if (view === 'edit' && item) {
      setView('pick');
      return;
    }
    onClose();
  };

  const dialogWidth = Math.min(screenWidth - 32, isTV ? 600 : 400);
  const maxDialogHeight = (screenHeight - keyboardHeight) * 0.88;
  const iconCell = isTV ? 52 : 40;
  const gridGap = isTV ? 10 : 6;

  const renderButton = ({
    label,
    onPress,
    primary,
    danger,
    disabled,
    preferredFocus,
  }: {
    label: string;
    onPress: () => void;
    primary?: boolean;
    danger?: boolean;
    disabled?: boolean;
    preferredFocus?: boolean;
  }) => {
    const background = danger
      ? colors.errorContainer
      : primary
        ? colors.primary
        : colors.surfaceContainerHighest;
    const foreground = danger
      ? colors.onErrorContainer
      : primary
        ? readableOnColor(colors.primary)
        : colors.onSurface;
    return (
      <TVFocusable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled}
        hasTVPreferredFocus={preferredFocus}
        registerScreenFocus={false}
        borderRadius={16}
        focusScale={1.05}
        focusBorderColor={focusBorderColor}
        style={{
          alignItems: 'center',
          backgroundColor: background,
          borderRadius: 16,
          flex: 1,
          height: isTV ? 52 : 48,
          justifyContent: 'center',
          opacity: disabled ? 0.45 : 1,
          paddingHorizontal: 12,
        }}>
        <AppText role="labelLargeEmphasized" style={{color: foreground}}>
          {label}
        </AppText>
      </TVFocusable>
    );
  };

  const renderHeader = (title: string, subtitle?: string) => (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
      }}>
      {view === 'edit' && item ? (
        <TVFocusable
          accessibilityRole="button"
          accessibilityLabel="Back to categories"
          onPress={handleBackOrClose}
          registerScreenFocus={false}
          borderRadius={14}
          focusScale={1.1}
          focusBorderColor={focusBorderColor}
          style={{
            alignItems: 'center',
            backgroundColor: colors.surfaceContainerHighest,
            borderRadius: 14,
            height: 40,
            justifyContent: 'center',
            width: 40,
          }}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.onSurfaceVariant}
          />
        </TVFocusable>
      ) : null}
      <View style={{flex: 1}}>
        <AppText role="titleLargeEmphasized" style={{color: colors.onSurface}}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            role="bodyMedium"
            numberOfLines={1}
            style={{color: colors.onSurfaceVariant, marginTop: 2}}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  const renderPicker = () => {
    const rows = collections;
    return (
      <>
        {renderHeader('Save to library', item?.title)}
        <ScrollView
          style={{flexGrow: 0, maxHeight: maxDialogHeight - 200}}
          contentContainerStyle={{gap: 8}}
          showsVerticalScrollIndicator={false}>
          {rows.map((row, index) => {
            const checked = selectedIds.includes(row.id);
            return (
              <TVFocusable
                key={row.id}
                accessibilityRole="checkbox"
                accessibilityState={{checked}}
                accessibilityLabel={row.name}
                onPress={() => toggleCollection(row.id)}
                hasTVPreferredFocus={isTV && index === 0}
                registerScreenFocus={false}
                borderRadius={18}
                focusScale={1.03}
                focusBorderColor={focusBorderColor}
                style={{
                  alignItems: 'center',
                  backgroundColor: checked
                    ? colors.secondaryContainer
                    : colors.surfaceContainerHighest,
                  borderRadius: 18,
                  flexDirection: 'row',
                  gap: 12,
                  minHeight: isTV ? 60 : 56,
                  paddingHorizontal: 12,
                }}>
                <LibraryIcon
                  icon={row.icon}
                  color={row.color}
                  size={isTV ? 20 : 18}
                  tile
                />
                <AppText
                  role="bodyLarge"
                  numberOfLines={1}
                  style={{
                    color: checked
                      ? colors.onSecondaryContainer
                      : colors.onSurface,
                    flex: 1,
                  }}>
                  {row.name}
                </AppText>
                <MaterialCommunityIcons
                  name={
                    checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'
                  }
                  size={24}
                  // On-container color stays readable on the checked row, even
                  // with low-saturation artwork palettes where primary fades.
                  color={
                    checked ? colors.onSecondaryContainer : colors.onSurfaceVariant
                  }
                />
              </TVFocusable>
            );
          })}
          <TVFocusable
            accessibilityRole="button"
            accessibilityLabel="New category"
            onPress={openCreate}
            hasTVPreferredFocus={isTV && rows.length === 0}
            registerScreenFocus={false}
            borderRadius={18}
            focusScale={1.03}
            focusBorderColor={focusBorderColor}
            style={{
              alignItems: 'center',
              borderColor: colors.outlineVariant,
              borderRadius: 18,
              borderStyle: 'dashed',
              borderWidth: 1.5,
              flexDirection: 'row',
              gap: 12,
              minHeight: isTV ? 60 : 56,
              paddingHorizontal: 12,
            }}>
            <View
              style={{
                alignItems: 'center',
                height: isTV ? 36 : 32,
                justifyContent: 'center',
                width: isTV ? 36 : 32,
              }}>
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={colors.primary}
              />
            </View>
            <AppText role="bodyLarge" style={{color: colors.primary}}>
              New category
            </AppText>
          </TVFocusable>
        </ScrollView>
        <View style={{flexDirection: 'row', marginTop: 16}}>
          {renderButton({label: 'Done', onPress: onClose, primary: true})}
        </View>
      </>
    );
  };

  // Where titles only in the deleted category end up (see deleteCollection).
  const watchlist = collections.find(c => c.id === DEFAULT_COLLECTION_ID);
  const deleteNote =
    watchlist && collection?.id !== DEFAULT_COLLECTION_ID
      ? `Titles stay in your library. Titles only in this category move to ${watchlist.name}.`
      : 'Titles stay in your library and show under All.';

  const renderEditor = () => {
    const choices = iconTab === 'icons' ? LIBRARY_ICON_KEYS : LIBRARY_EMOJIS;
    const canSave = name.trim().length > 0;
    return (
      <>
        {renderHeader(editing ? 'Edit category' : 'New category')}
        <View style={{alignItems: 'center', flexDirection: 'row', gap: 12}}>
          <LibraryIcon icon={icon} color={color} size={isTV ? 26 : 24} tile />
          <TextInput
            focusable
            value={name}
            onChangeText={setName}
            maxLength={NAME_MAX_LENGTH}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            onSubmitEditing={handleSave}
            placeholder="Category name"
            placeholderTextColor={colors.onSurfaceVariant}
            selectionColor={colors.primary}
            autoFocus={!isTV && !editing}
            returnKeyType="done"
            style={{
              backgroundColor: colors.surfaceContainerHighest,
              borderColor: nameFocused ? focusBorderColor : colors.outlineVariant,
              borderRadius: 16,
              borderWidth: nameFocused ? 2.5 : 1,
              color: colors.onSurface,
              flex: 1,
              fontSize: 16,
              height: isTV ? 56 : 52,
              paddingHorizontal: 14,
            }}
          />
        </View>

        <View style={{flexDirection: 'row', gap: 8, marginTop: 16}}>
          {(['icons', 'emoji'] as IconTab[]).map(tab => {
            const selected = iconTab === tab;
            return (
              <TVFocusable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{selected}}
                accessibilityLabel={tab === 'icons' ? 'Icons' : 'Emoji'}
                onPress={() => setIconTab(tab)}
                hasTVPreferredFocus={isTV && tab === 'icons'}
                registerScreenFocus={false}
                borderRadius={14}
                focusScale={1.05}
                focusBorderColor={focusBorderColor}
                style={{
                  alignItems: 'center',
                  backgroundColor: selected
                    ? colors.secondaryContainer
                    : colors.surfaceContainerHighest,
                  borderRadius: 14,
                  flex: 1,
                  height: 40,
                  justifyContent: 'center',
                }}>
                <AppText
                  role="labelLargeEmphasized"
                  style={{
                    color: selected
                      ? colors.onSecondaryContainer
                      : colors.onSurfaceVariant,
                  }}>
                  {tab === 'icons' ? 'Icons' : 'Emoji'}
                </AppText>
              </TVFocusable>
            );
          })}
        </View>

        <ScrollView
          style={{
            flexGrow: 0,
            marginTop: 12,
            maxHeight: Math.max(
              iconCell * 2 + gridGap,
              maxDialogHeight - (isTV ? 360 : 330),
            ),
          }}
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: gridGap,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {choices.map(choice => {
            const selected = icon === choice;
            return (
              <TVFocusable
                key={choice}
                accessibilityRole="button"
                accessibilityState={{selected}}
                accessibilityLabel={`Icon ${choice}`}
                onPress={() => setIcon(choice)}
                registerScreenFocus={false}
                borderRadius={12}
                focusScale={1.12}
                focusBorderColor={focusBorderColor}
                style={{
                  alignItems: 'center',
                  backgroundColor: selected
                    ? colors.secondaryContainer
                    : 'transparent',
                  borderColor: selected ? colors.primary : 'transparent',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  height: iconCell,
                  justifyContent: 'center',
                  width: iconCell,
                }}>
                <LibraryIcon
                  icon={choice}
                  size={isTV ? 26 : 22}
                  glyphColor={color || colors.onSurfaceVariant}
                />
              </TVFocusable>
            );
          })}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: isTV ? 10 : 8,
            justifyContent: 'center',
            marginTop: 14,
          }}>
          {[undefined, ...LIBRARY_COLORS].map(swatch => {
            const selected = color === swatch;
            const fill = swatch || colors.primaryContainer;
            return (
              <TVFocusable
                key={swatch || 'default'}
                accessibilityRole="button"
                accessibilityState={{selected}}
                accessibilityLabel={swatch ? `Color ${swatch}` : 'Theme color'}
                onPress={() => setColor(swatch)}
                registerScreenFocus={false}
                borderRadius={14}
                focusScale={1.15}
                focusBorderColor={focusBorderColor}
                style={{
                  alignItems: 'center',
                  backgroundColor: fill,
                  borderColor: selected ? colors.onSurface : 'transparent',
                  borderRadius: 14,
                  borderWidth: 2,
                  height: isTV ? 30 : 26,
                  justifyContent: 'center',
                  width: isTV ? 30 : 26,
                }}>
                {selected ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={
                      swatch ? readableOnColor(swatch) : colors.onPrimaryContainer
                    }
                  />
                ) : null}
              </TVFocusable>
            );
          })}
        </View>

        <View style={{flexDirection: 'row', gap: 10, marginTop: 18}}>
          {editing
            ? renderButton({
                label: confirmDelete ? 'Confirm delete' : 'Delete',
                onPress: handleDelete,
                danger: true,
              })
            : renderButton({label: 'Cancel', onPress: handleBackOrClose})}
          {renderButton({
            label: editing ? 'Save' : 'Create',
            onPress: handleSave,
            primary: true,
            disabled: !canSave,
          })}
        </View>
        {editing && confirmDelete ? (
          <AppText
            role="bodySmall"
            style={{
              color: colors.onSurfaceVariant,
              marginTop: 8,
              textAlign: 'center',
            }}>
            {deleteNote}
          </AppText>
        ) : null}
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleBackOrClose}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.62)',
          flex: 1,
          justifyContent: 'center',
          paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0,
          paddingHorizontal: 16,
        }}>
        <Pressable
          focusable={false}
          accessible={false}
          importantForAccessibility="no"
          style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}}
          onPress={() => {
            if (keyboardHeight > 0) {
              Keyboard.dismiss();
            } else {
              onClose();
            }
          }}
        />
        <View
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            borderColor: colors.outlineVariant,
            borderRadius: 28,
            borderWidth: isTV ? 1 : 0,
            maxHeight: maxDialogHeight,
            padding: isTV ? 28 : 22,
            width: dialogWidth,
          }}>
          {view === 'pick' ? renderPicker() : renderEditor()}
        </View>
      </View>
    </Modal>
  );
};

export default LibraryCollectionDialog;
