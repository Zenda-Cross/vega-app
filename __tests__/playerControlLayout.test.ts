import {
  defaultPlayerControlLayout,
  getTopControlLimit,
  movePlayerControl,
  normalizePlayerControlLayout,
  PLAYER_CONTROL_IDS,
} from '../src/lib/player/controlLayout';

it('moves controls between bars and reorders them without duplicates or mutating the saved layout', () => {
  const original = defaultPlayerControlLayout();
  const moved = movePlayerControl(original, 'speed', 'top', 1);
  expect(moved.top).toEqual(['sleep', 'speed', 'lock', 'cast']);
  expect(moved.bottom).not.toContain('speed');
  expect(original).toEqual(defaultPlayerControlLayout());
  const reordered = movePlayerControl(moved, 'speed', 'top', 3);
  expect(reordered.top).toEqual(['sleep', 'lock', 'cast', 'speed']);
  const bottom = movePlayerControl(reordered, 'lock', 'bottom', 0);
  expect(bottom.bottom[0]).toBe('lock');
  expect([...bottom.top, ...bottom.bottom].sort()).toEqual(
    [...PLAYER_CONTROL_IDS].sort(),
  );
});

it('allows five top controls and rejects a sixth while allowing reordering within a full bar', () => {
  const four = movePlayerControl(
    defaultPlayerControlLayout(),
    'speed',
    'top',
    0,
  );
  const full = movePlayerControl(four, 'audio', 'top', 0);
  expect(full.top).toHaveLength(5);
  expect(movePlayerControl(full, 'subtitle', 'top', 0)).toBe(full);
  expect(movePlayerControl(full, 'sleep', 'top', 3).top).toHaveLength(5);
});

it('repairs corrupt, duplicate, unknown and oversized saved layouts without losing valid controls', () => {
  const repaired = normalizePlayerControlLayout({
    top: ['sleep', 'sleep', 'invalid', 'audio', 'speed', 'pip', 'server', 'resize'],
    bottom: ['server', 'cast', 'cast'],
  });
  expect(repaired.top).toEqual(['sleep', 'audio', 'speed', 'pip', 'server']);
  expect(repaired.bottom).toContain('resize');
  expect([...repaired.top, ...repaired.bottom].sort()).toEqual(
    [...PLAYER_CONTROL_IDS].sort(),
  );
  expect(normalizePlayerControlLayout(null)).toEqual(
    defaultPlayerControlLayout(),
  );
});

it('reduces top capacity on narrow screens and moves overflow to the bottom', () => {
  expect(getTopControlLimit(800)).toBe(5);
  expect(getTopControlLimit(360)).toBeLessThan(5);
  const fitted = normalizePlayerControlLayout(defaultPlayerControlLayout(), 1);
  expect(fitted.top).toEqual(['sleep']);
  expect(fitted.bottom).toEqual(expect.arrayContaining(['lock', 'cast']));
  expect([...fitted.top, ...fitted.bottom]).toHaveLength(
    PLAYER_CONTROL_IDS.length,
  );
});
