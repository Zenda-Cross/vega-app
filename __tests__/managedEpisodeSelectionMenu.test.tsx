import React from 'react';
import renderer, {act} from 'react-test-renderer';
import ManagedEpisodeSelectionBar from '../src/components/ManagedEpisodeSelectionBar';
import {DownloadsSelectionBottomBar} from '../src/screens/downloads/components/DownloadsSelectionBottomBar';

jest.mock('../src/components/tv', () => ({TVFocusable: 'TVFocusable'}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'Icon');
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/components/ui/Text', () => 'Text');
jest.mock('../src/theme/M3PaletteContext', () => ({useM3Colors: () => ({})}));
jest.mock('../src/lib/tv', () => ({isTV: true}));
jest.mock('../src/lib/tv/useTVFocusBorderColor', () => ({useTVFocusBorderColor: () => '#ffffff'}));

it('uses the Downloads floating menu and connects all selection actions', () => {
  const onDone = jest.fn(); const onSelectAll = jest.fn(); const onInvertSelection = jest.fn(); const onDelete = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {tree = renderer.create(<ManagedEpisodeSelectionBar count={2} busy={false} allSelected onDone={onDone} onSelectAll={onSelectAll} onInvertSelection={onInvertSelection} onDelete={onDelete} />);});
  expect(tree.root.findByType(DownloadsSelectionBottomBar).props.isAllSelected).toBe(true);
  for (const label of ['Exit selection', 'Select all', 'Invert selection', 'Delete selected downloads']) act(() => tree.root.findByProps({accessibilityLabel: label}).props.onPress());
  for (const action of [onDone, onSelectAll, onInvertSelection, onDelete]) expect(action).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});
it('disables deletion with no selection and blocks all actions while deleting', () => {
  const props = {onDone: jest.fn(), onSelectAll: jest.fn(), onInvertSelection: jest.fn(), onDelete: jest.fn(), allSelected: false};
  let tree!: renderer.ReactTestRenderer;
  act(() => {tree = renderer.create(<ManagedEpisodeSelectionBar {...props} count={0} busy={false} />);});
  expect(tree.root.findByProps({accessibilityLabel: 'Delete selected downloads'}).props.disabled).toBe(true);
  act(() => tree.update(<ManagedEpisodeSelectionBar {...props} count={2} busy />));
  for (const label of ['Exit selection', 'Select all', 'Invert selection', 'Delete selected downloads']) expect(tree.root.findByProps({accessibilityLabel: label}).props.disabled).toBe(true);
  act(() => tree.unmount());
});
