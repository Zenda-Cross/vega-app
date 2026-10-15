import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Slider} from '@expo/ui/jetpack-compose';
import PlayerSpeedControl from '../src/components/PlayerSpeedControl';
import {TVFocusable} from '../src/components/tv';

jest.mock('@expo/ui/jetpack-compose', () => ({Host: 'Host', Slider: 'Slider'}));
jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({
  fillMaxWidth: () => ({}),
}));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/lib/tv', () => ({isTV: false}));
jest.mock('../src/lib/storage/StorageService', () => ({mainStorage: {}}));
jest.mock('../src/lib/downloadLocation', () => ({}));
jest.mock('../src/components/tv', () => {
  const ReactModule = require('react');
  return {
    TVFocusable: ReactModule.forwardRef((props: object, ref: unknown) =>
      ReactModule.createElement('Button', {...props, ref}),
    ),
  };
});
jest.mock('../src/lib/storage', () => {
  const storage = jest.requireActual('../src/lib/storage/SettingsStorage');
  return {
    PLAYBACK_SPEEDS: storage.PLAYBACK_SPEEDS,
    PLAYBACK_SPEED_MIN: storage.PLAYBACK_SPEED_MIN,
    PLAYBACK_SPEED_MAX: storage.PLAYBACK_SPEED_MAX,
    PLAYBACK_SPEED_STEP: storage.PLAYBACK_SPEED_STEP,
  };
});

it('previews slider steps locally and commits the latest value on release', () => {
  const onChange = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerSpeedControl
        value={1}
        accentColor="#ffffff"
        onChange={onChange}
        onTVFocus={() => {}}
      />,
    );
  });
  act(() => tree.root.findByType(Slider).props.onValueChange(1.347));
  expect(tree.root.findByType(Slider).props.value).toBe(1.35);
  expect(onChange).not.toHaveBeenCalled();
  act(() => tree.root.findByType(Slider).props.onValueChangeFinished());
  expect(onChange).toHaveBeenCalledWith(1.35);
  act(() => tree.unmount());
});

it('clamps adjustments and applies presets without dismissing the control', () => {
  const onChange = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerSpeedControl
        value={2}
        accentColor="#ffffff"
        onChange={onChange}
        onTVFocus={() => {}}
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
  press('Increase playback speed');
  expect(onChange).toHaveBeenLastCalledWith(2);
  press('0.25x');
  press('Decrease playback speed');
  expect(onChange).toHaveBeenLastCalledWith(0.25);
  expect(tree.root.findByType(Slider).props.value).toBe(0.25);
  act(() => tree.unmount());
});
