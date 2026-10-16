import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {StyleSheet, Text, View} from 'react-native';
import {Seekbar} from '../src/components/media-console/components/Seekbar';

it.each([
  [1, 1],
  [1, 2],
  [1.2, 1.5],
])(
  'scales track and knob together at player %s and seekbar %s without scaling seek coordinates',
  (controlScale, seekbarScale) => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <Seekbar
          controlScale={controlScale}
          seekbarScale={seekbarScale}
          seekerFillWidth={150}
          seekerPosition={150}
          cachedPosition={200}
          seekColor="#abcdef"
          seekerPanHandlers={{}}
          setSeekerWidth={jest.fn()}
          time={30}
          duration={120}
          showDuration
          showHours={false}
          showTimeRemaining={false}
          toggleTimer={() => {}}
          resetControlTimeout={() => {}}
          seeking
          previewTime={30}
          thumbnailUri={null}
          thumbnailLoading={false}
          snapPosition={120}
        />,
      );
    });
    const size = controlScale * seekbarScale;
    const views = tree.root.findAllByType(View);
    const styles = views.map(
      view => StyleSheet.flatten(view.props.style) || {},
    );
    const knob = styles.find(
      style => style.backgroundColor === '#abcdef' && style.width === 8 * size,
    )!;
    expect(knob.height).toBe(8 * size);
    const handle = styles.find(style => style.marginLeft === -12 * size)!;
    expect(handle.left).toBe(150);
    expect(handle.width).toBe(24 * size);
    const fill = styles.find(
      style => style.backgroundColor === '#abcdef' && style.width === 150,
    )!;
    expect(fill.height).toBe(2 * size);
    expect(
      styles.some(
        style => style.left === 120 - size && style.height === 12 * size,
      ),
    ).toBe(true);
    const container = styles.find(style => style.width === '80%')!;
    expect(container.height).toBe(20 * size);
    expect(container.alignSelf).toBe('center');
    const track = styles.find(style => style.backgroundColor === '#333')!;
    expect(track.top + track.height / 2).toBeCloseTo(container.height / 2);
    expect(knob.top + knob.height / 2).toBeCloseTo(container.height / 2);
    const row = styles.find(style => style.flexDirection === 'row')!;
    expect(row.alignItems).toBe('center');
    expect(tree.root.findAllByType(Text)[0].props.style.fontSize).toBe(
      12 * controlScale,
    );
    act(() => tree.unmount());
  },
);
