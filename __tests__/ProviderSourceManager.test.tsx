import React from 'react';
import renderer, {act} from 'react-test-renderer';
import ProviderSourceManager from '../src/screens/settings/components/ProviderSourceManager';
import {AddSourceModal} from '../src/screens/settings/components/AddSourceModal';
import {TVFocusable} from '../src/components/tv';

jest.mock('../src/lib/storage/extensionStorage', () => ({extensionStorage: {
  getProviderSources: () => [{author: 'existing', isDefault: true}],
}}));
jest.mock('../src/lib/utils/helpers', () => ({createProviderSource: jest.fn()}));
jest.mock('../src/lib/storage/sourceTokenStorage', () => ({normalizeSourceToken: jest.fn(), sourceTokenStorage: {}}));
jest.mock('../src/lib/services/sourceIntent', () => ({clearPendingSourceToken: jest.fn(), getPendingSourceToken: jest.fn()}));
jest.mock('../src/theme/M3PaletteContext', () => ({useM3Colors: () => ({})}));
jest.mock('../src/components/AppDialog', () => 'AppDialog');
jest.mock('../src/components/ui/Text', () => 'Text');
jest.mock('../src/components/tv', () => ({TVFocusable: 'TVFocusable'}));
jest.mock('../src/lib/tv/constants', () => ({isTV: true}));
jest.mock('@expo/vector-icons', () => ({MaterialIcons: 'Icon', MaterialCommunityIcons: 'Icon'}));
jest.mock('../src/screens/settings/components/AddSourceModal', () => ({AddSourceModal: 'AddSourceModal'}));
jest.mock('../src/screens/settings/components/SourcePickerModal', () => ({SourcePickerModal: 'SourcePickerModal'}));

it('creates a fresh add dialog for every TV plus activation', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<ProviderSourceManager visible primary="#fff" onSourceChanged={jest.fn()} />); });
  const open = () => act(() => tree.root.findAllByType(TVFocusable).find(node => node.props.accessibilityLabel === 'Add provider source')!.props.onPress());
  expect(tree.root.findAllByType(AddSourceModal)).toHaveLength(0);
  open();
  expect(tree.root.findByType(AddSourceModal).props.visible).toBe(true);
  act(() => tree.root.findByType(AddSourceModal).props.onClose());
  expect(tree.root.findAllByType(AddSourceModal)).toHaveLength(0);
  open();
  expect(tree.root.findByType(AddSourceModal).props.visible).toBe(true);
  act(() => tree.unmount());
});
