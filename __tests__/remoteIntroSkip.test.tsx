import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {RemoteStatusLine} from '../src/components/remote-player/RemoteStatusLine';
import {useRemoteStore} from '../src/lib/remote/remoteStore';
import Button from '../src/components/ui/Button';
jest.mock('../src/theme/M3PaletteContext', () => ({useM3Colors: () => ({})}));
jest.mock('../src/components/ui/Button', () => 'SkipButton');
jest.mock('../src/components/ui/Text', () => require('react-native').Text);
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');

it('uses the receiver timeline and passes the segment end to the remote seek handler', () => {
  useRemoteStore.getState().resetSession();
  useRemoteStore.getState().setStatus('playing');
  useRemoteStore.getState().setTimeline(100, 400);
  const seek = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {tree = renderer.create(<RemoteStatusLine skipIntervals={[
    {from: 87, to: 174, title: 'Intro'}, {from: 300, to: 350, title: 'Skip outro'},
  ]} onSkipPress={seek} />);});
  expect(tree.root.findByType(Button).props.children).toBe('Skip Intro');
  act(() => {tree.root.findByType(Button).props.onPress();});
  expect(seek).toHaveBeenCalledWith(174);
  act(() => {useRemoteStore.getState().setTimeline(174, 400);});
  expect(tree.root.findAllByType(Button)).toHaveLength(0);
  act(() => {useRemoteStore.getState().setTimeline(320, 400);});
  expect(tree.root.findByType(Button).props.children).toBe('Skip outro');
  act(() => {tree.unmount();});
});
