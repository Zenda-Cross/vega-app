import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {GestureDetector} from 'react-native-gesture-handler';
import {TVFocusable} from '../src/components/tv';
import PlayerControlEditor from '../src/components/PlayerControlEditor';
import {PlayerControl} from '../src/components/PlayerControlBar';
import {
  defaultPlayerControlLayout,
  PLAYER_CONTROL_IDS,
} from '../src/lib/player/controlLayout';

let mockIsTV = false;
jest.mock('../src/lib/tv/constants', () => ({
  get isTV() {
    return mockIsTV;
  },
}));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('@expo/vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../src/components/tv', () => {
  const ReactModule = require('react');
  return {
    TVFocusGuide: 'FocusGuide',
    TVFocusable: ReactModule.forwardRef((props: object, ref: unknown) =>
      ReactModule.createElement('FocusButton', {...props, ref}),
    ),
  };
});
jest.mock('react-native-reanimated', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    default: {View: require('react-native').View},
    runOnJS: (fn: unknown) => fn,
    useAnimatedStyle: (fn: () => object) => fn(),
    useSharedValue: (initial: unknown) =>
      ReactModule.useRef({
        value: initial,
        get() {
          return this.value;
        },
        set(value: unknown) {
          this.value = value;
        },
      }).current,
  };
});
jest.mock('react-native-gesture-handler', () => {
  const builder = () => ({
    start: undefined,
    update: undefined,
    end: undefined,
    finalize: undefined,
    activateAfterLongPress() {
      return this;
    },
    onStart(fn: unknown) {
      this.start = fn;
      return this;
    },
    onUpdate(fn: unknown) {
      this.update = fn;
      return this;
    },
    onEnd(fn: unknown) {
      this.end = fn;
      return this;
    },
    onFinalize(fn: unknown) {
      this.finalize = fn;
      return this;
    },
  });
  return {
    GestureHandlerRootView: 'GestureRoot',
    GestureDetector: 'GestureDetector',
    Gesture: {
      Pan: builder,
      Tap: builder,
      Exclusive: (pan: unknown, tap: unknown) => ({pan, tap}),
    },
  };
});

const controls: PlayerControl[] = PLAYER_CONTROL_IDS.map(id => ({
  id,
  title: id,
  label: id,
  icon: 'cast',
  visible: true,
  onPress: jest.fn(),
}));
const makeEditor = () => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const onHaptic = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerControlEditor
        layout={defaultPlayerControlLayout()}
        controls={controls}
        color="#ffffff"
        onSave={onSave}
        onClose={onClose}
        onHaptic={onHaptic}
      />,
    );
  });
  const press = (label: string) =>
    act(() => {
      tree.root
        .findAllByType(TVFocusable)
        .find(node => node.props.accessibilityLabel === label)!
        .props.onPress();
    });
  return {tree, press, onSave, onClose, onHaptic};
};

beforeEach(() => {
  mockIsTV = false;
});

it('keeps eye toggles in the preview until Save and keeps hidden controls available to restore', () => {
  const {tree, press, onSave, onClose} = makeEditor();
  act(() => tree.root.findAllByProps({accessibilityLabel: 'Move audio'})[0].props.onAccessibilityTap());
  press('Hide control');
  expect(onSave).not.toHaveBeenCalled();
  press('Save');
  expect(onSave.mock.calls[0][1]).toEqual(['audio']);
  expect(onSave.mock.calls[0][0].bottom).toContain('audio');
  onSave.mockClear();
  press('Show control');
  press('Cancel');
  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('keeps a drag alive across selection updates and applies a cross-bar drop only on Save', () => {
  const {tree, press, onSave, onHaptic} = makeEditor();
  const pan = () =>
    tree.root
      .findAllByType(GestureDetector)
      .find(
        node =>
          node.findAllByProps({accessibilityLabel: 'Move audio'}).length > 0,
      )!.props.gesture.pan;
  const gesture = pan();
  act(() => gesture.start({x: 10, y: 10, absoluteX: 10, absoluteY: 114}));
  expect(onHaptic).toHaveBeenCalledTimes(1);
  expect(pan()).toBe(gesture);
  act(() => gesture.update({translationX: 150, translationY: -74}));
  expect(onHaptic).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
  act(() => gesture.end({absoluteX: 160, absoluteY: 40}));
  expect(onHaptic).toHaveBeenCalledTimes(2);
  press('To top');
  expect(onHaptic).toHaveBeenCalledTimes(2);
  expect(onSave).not.toHaveBeenCalled();
  press('Save');
  const saved = onSave.mock.calls[0][0];
  expect(saved.top).toEqual(['sleep', 'lock', 'cast', 'audio']);
  expect(saved.bottom).not.toContain('audio');
  act(() => tree.unmount());
});

it('supports TV moves, rejects an overflowing top bar, and cancels without saving', () => {
  mockIsTV = true;
  const {tree, press, onSave, onClose} = makeEditor();
  press('Move speed');
  press('To top');
  press('Move audio');
  press('To top');
  press('Move subtitle');
  press('To top');
  press('Save');
  expect(onSave.mock.calls[0][0].top).toEqual([
    'sleep',
    'lock',
    'cast',
    'speed',
    'audio',
  ]);
  onSave.mockClear();
  press('To bottom');
  press('Cancel');
  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});
