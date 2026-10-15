import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {ScrollView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import type {PlayerControlId} from '../src/lib/player/controlLayout';
import PlayerControlBar, {
  PlayerControl,
} from '../src/components/PlayerControlBar';

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('@expo/vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../src/lib/tv/constants', () => ({isTV: false}));

const controls: PlayerControl[] = [
  {
    id: 'speed',
    title: 'Speed',
    label: '1.5x',
    icon: 'speedometer',
    visible: true,
    onPress: jest.fn(),
  },
  {
    id: 'sleep',
    title: 'Sleep',
    label: '25m',
    icon: 'power-sleep',
    visible: true,
    onPress: jest.fn(),
  },
  {
    id: 'cast',
    title: 'Cast',
    label: 'Cast',
    icon: 'cast',
    visible: false,
    onPress: jest.fn(),
  },
];

it('shows only icons on top and preserves status labels on the bottom', () => {
  let tree!: renderer.ReactTestRenderer;
  const props = {
    ids: ['speed', 'sleep', 'cast'] as const,
    controls,
    onEdit: jest.fn(),
    getTVFocusProps: () => ({}),
  };
  act(() => {
    tree = renderer.create(
      <PlayerControlBar {...props} ids={[...props.ids]} top />,
    );
  });
  expect(tree.root.findAllByType(Text)).toHaveLength(0);
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Cast, Cast'}),
  ).toHaveLength(0);
  act(() =>
    tree.update(
      <PlayerControlBar {...props} ids={[...props.ids]} />,
    ),
  );
  expect(
    tree.root.findAllByType(Text).map(node => node.props.children),
  ).toEqual(['1.5x', '25m']);
  const scroll = tree.root.findByType(ScrollView);
  expect(scroll.props.horizontal).toBe(true);
  expect(scroll.props.showsHorizontalScrollIndicator).toBe(false);
  act(() => tree.unmount());
});

it('provides a long-press editor entry without attaching drag gestures during playback', () => {
  const onEdit = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerControlBar
        ids={['speed']}
        controls={controls}
        top
        onEdit={onEdit}
        getTVFocusProps={() => ({})}
      />,
    );
  });
  act(() =>
    tree.root
      .findAllByProps({accessibilityLabel: 'Speed, 1.5x'})[0]
      .props.onLongPress(),
  );
  expect(onEdit).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('uses content-sized controls with even gaps and matching end padding', () => {
  const ids: PlayerControlId[] = ['pip', 'resize', 'episodes', 'sleep', 'cast', 'lock'];
  const items: PlayerControl[] = ids.map(id => ({id, title: id, label: id, icon: 'cast', visible: true, onPress: jest.fn()}));
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<PlayerControlBar ids={ids} controls={items} onEdit={() => {}} getTVFocusProps={() => ({})} />); });
  const buttons = tree.root.findAllByType(TouchableOpacity);
  expect(buttons).toHaveLength(6);
  for (const button of buttons) {
    const style = StyleSheet.flatten(button.props.style);
    expect(style.width).toBeUndefined();
    expect(style.justifyContent).toBeUndefined();
    expect(style.flexShrink).toBe(0);
  }
  const scroll = tree.root.findByType(ScrollView);
  expect(scroll.props.contentContainerStyle).toEqual(expect.objectContaining({justifyContent: 'space-between', columnGap: 20, paddingHorizontal: 12}));
  expect(scroll.props.onScroll).toBeUndefined();
  act(() => tree.update(<PlayerControlBar ids={['sleep']} controls={items} onEdit={() => {}} getTVFocusProps={() => ({})} />));
  expect(tree.root.findByType(ScrollView).props.contentContainerStyle.justifyContent).toBe('center');
  act(() => tree.unmount());
});
