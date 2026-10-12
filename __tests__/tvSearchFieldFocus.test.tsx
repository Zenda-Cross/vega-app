import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Pressable, UIManager} from 'react-native';
import SearchField, {type SearchFieldRef} from '../src/components/ui/SearchField';
import {__resetTVFocusTracking, useTVNavFocusMemory} from '../src/lib/tv/useTVNavFocusMemory';

jest.mock('../src/lib/tv', () => ({isTV: true}));
jest.mock('../src/lib/tv/constants', () => ({isTV: true}));
jest.mock('@react-navigation/native', () => ({useIsFocused: () => true}));
jest.mock('nativewind/jsx-runtime', () => require('react/jsx-runtime'));
jest.mock('../src/theme/M3PaletteContext', () => ({useM3Colors: () => ({}), useM3HostTheme: () => ({})}));
jest.mock('../src/lib/tv/useTVFocusBorderColor', () => ({useTVFocusBorderColor: () => '#fff'}));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('@expo/ui/jetpack-compose', () => ({useNativeState: () => ({})}));
jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({fillMaxWidth: () => ({})}));
jest.mock('react-native', () => ({
  Pressable: 'Pressable', View: 'View', Text: 'Text', TextInput: 'TextInput',
  findNodeHandle: (node: any) => node?.handle ?? null,
  UIManager: {dispatchViewManagerCommand: jest.fn()},
  Keyboard: {dismiss: jest.fn()},
}));

it('registers restored search-field focus so removing Clear all cannot rescue to the rail', () => {
  jest.useFakeTimers();
  __resetTVFocusTracking();
  const dispatch = UIManager.dispatchViewManagerCommand as jest.Mock;
  dispatch.mockClear();
  const field = React.createRef<SearchFieldRef>();
  let rail!: ReturnType<typeof useTVNavFocusMemory>;
  let clear!: ReturnType<typeof useTVNavFocusMemory>;
  const TrackedControl = ({handle}: {handle: number}) => {
    const ref = React.useRef({handle});
    const memory = useTVNavFocusMemory({ref, isNavFocused: true, hasTVPreferredFocus: false});
    if (handle === 1) rail = memory;
    else clear = memory;
    return null;
  };
  const Screen = ({showClear}: {showClear: boolean}) => (
    <>
      <TrackedControl handle={1} />
      <SearchField ref={field} value="inception" onChangeText={jest.fn()} onSubmit={jest.fn()} />
      {showClear ? <TrackedControl handle={2} /> : null}
    </>
  );
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<Screen showClear />, {createNodeMock: () => ({handle: 42})}); });
  act(() => { rail.onFocus(); rail.onBlur(); clear.onFocus(); });
  act(() => tree.update(<Screen showClear={false} />));
  act(() => field.current?.focus());
  expect(dispatch).toHaveBeenCalledWith(42, 'requestTVFocus', []);
  const pressable = tree.root.findByType(Pressable);
  expect(pressable.props.hasTVPreferredFocus).toBe(true);
  act(() => pressable.props.onFocus());
  dispatch.mockClear();
  act(() => jest.advanceTimersByTime(400));
  expect(dispatch).not.toHaveBeenCalled();
  act(() => tree.unmount());
  jest.clearAllTimers();
  jest.useRealTimers();
});
