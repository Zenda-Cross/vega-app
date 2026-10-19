import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {cancelAnimation, withTiming} from 'react-native-reanimated';
import {AnimatedTabIcon} from '../src/components/navigation/AnimatedTabIcon';
import {FilledTabIcon, OutlineTabIcon} from '../src/components/navigation/AnimatedTabIconParts';

jest.mock('react-native-svg', () => ({
  __esModule: true, default: 'Svg', G: 'G', Path: 'Path', Circle: 'Circle',
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {createAnimatedComponent: (component: unknown) => component},
  useSharedValue: (value: number) => require('react').useRef({value}).current,
  useAnimatedProps: (callback: () => unknown) => callback(),
  // Leave animation pending so blur is tested before it finishes.
  withTiming: jest.fn(() => 0),
  cancelAnimation: jest.fn(),
  Easing: {cubic: (value: number) => value, inOut: (fn: unknown) => fn},
  Extrapolation: {CLAMP: 'clamp'},
  interpolate: (value: number, [start, end]: number[], [from, to]: number[]) =>
    from + Math.max(0, Math.min(1, (value - start) / (end - start))) * (to - from),
}));

it('draws on activation and keeps icons visible on initial focus and interrupted TV focus', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<AnimatedTabIcon name="home" active color="#fff" />); });
  expect(tree.root.findByType(OutlineTabIcon).props.progress.value).toBe(1);
  expect(withTiming).not.toHaveBeenCalled();

  act(() => { tree.update(<AnimatedTabIcon name="home" active={false} color="#fff" />); });
  expect(tree.root.findAllByType(OutlineTabIcon)).toHaveLength(0);
  expect(tree.root.findAllByType(FilledTabIcon)).toHaveLength(1);

  act(() => { tree.update(<AnimatedTabIcon name="home" active color="#fff" />); });
  expect(withTiming).toHaveBeenCalledWith(1, expect.objectContaining({duration: 650}));
  expect(tree.root.findByType(OutlineTabIcon).props.progress.value).toBe(0);
  expect(tree.root.findAllByType(FilledTabIcon)).toHaveLength(1);

  act(() => { tree.update(<AnimatedTabIcon name="home" active={false} color="#fff" />); });
  expect(tree.root.findAllByType(OutlineTabIcon)).toHaveLength(0);
  expect(tree.root.findAllByType(FilledTabIcon)).toHaveLength(1);
  act(() => { tree.unmount(); });
  expect(cancelAnimation).toHaveBeenCalled();
});
