import React from 'react';
import renderer, {act} from 'react-test-renderer';
import LocalVideoThumbnail from '../src/components/local-content/LocalVideoThumbnail';
import {getDownloadedVideoThumbnail} from '../src/lib/downloadThumbnailCache';

jest.mock('../src/components/EpisodeThumbnail', () => 'EpisodeThumbnail');
jest.mock('../src/theme/M3PaletteContext', () => ({useM3Colors: () => ({primary: '#123456'})}));
jest.mock('../src/lib/downloadThumbnailCache', () => ({getDownloadedVideoThumbnail: jest.fn(async () => 'file:///frame.jpg')}));
const extract = getDownloadedVideoThumbnail as jest.Mock;
beforeEach(() => jest.clearAllMocks());

it('prefers metadata artwork and extracts a local frame only if it fails', async () => {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<LocalVideoThumbnail uri="content://video" image="https://episodes/1.jpg" />);});
  const thumbnail = () => tree.root.findByType('EpisodeThumbnail' as any);
  expect(thumbnail().props.uri).toBe('https://episodes/1.jpg');
  expect(extract).not.toHaveBeenCalled();
  await act(async () => {thumbnail().props.onError();});
  expect(extract).toHaveBeenCalledWith('content://video');
  expect(thumbnail().props.uri).toBe('file:///frame.jpg');
  act(() => tree.unmount());
});

it('uses the local frame when metadata has no thumbnail', async () => {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<LocalVideoThumbnail uri="content://video" />);});
  expect(extract).toHaveBeenCalledWith('content://video');
  expect(tree.root.findByType('EpisodeThumbnail' as any).props.uri).toBe('file:///frame.jpg');
  act(() => tree.unmount());
});
