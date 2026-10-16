export const PLAYER_CONTROL_IDS = [
  'sleep',
  'lock',
  'cast',
  'audio',
  'subtitle',
  'speed',
  'pip',
  'server',
  'resize',
  'episodes',
  'next',
  'settings',
  'decoder',
] as const;
export type PlayerControlId = (typeof PLAYER_CONTROL_IDS)[number];
export type PlayerControlBar = 'top' | 'bottom' | 'more';
export type PlayerControlLayout = Record<PlayerControlBar, PlayerControlId[]>;
export const MAX_TOP_CONTROLS = 5;

export const defaultPlayerControlLayout = (): PlayerControlLayout => ({
  top: ['sleep', 'lock', 'cast', 'decoder'],
  bottom: [
    'audio',
    'subtitle',
    'speed',
    'pip',
    'server',
    'resize',
    'episodes',
    'next',
    'settings',
  ],
  more: [],
});

export const getTopControlLimit = (width: number) =>
  Math.max(1, Math.min(MAX_TOP_CONTROLS, Math.floor((width * 0.45 - 20) / 48)));

export function normalizePlayerControlLayout(
  value: unknown,
  limit = MAX_TOP_CONTROLS,
): PlayerControlLayout {
  const defaults = defaultPlayerControlLayout();
  const candidate =
    value && typeof value === 'object'
      ? (value as Partial<PlayerControlLayout>)
      : defaults;
  const result: PlayerControlLayout = {top: [], bottom: [], more: []};
  const seen = new Set<PlayerControlId>();
  const append = (id: unknown, bar: PlayerControlBar) => {
    if (
      !PLAYER_CONTROL_IDS.includes(id as PlayerControlId) ||
      seen.has(id as PlayerControlId)
    )
      return;
    seen.add(id as PlayerControlId);
    result[bar === 'top' && result.top.length >= limit ? 'bottom' : bar].push(
      id as PlayerControlId,
    );
  };
  for (const bar of ['top', 'bottom', 'more'] as const) {
    for (const id of Array.isArray(candidate[bar])
      ? candidate[bar]!
      : defaults[bar])
      append(id, bar);
  }
  for (const bar of ['top', 'bottom', 'more'] as const)
    for (const id of defaults[bar]) append(id, bar);
  return pinSettingsControl(result);
}

export function movePlayerControl(
  layout: PlayerControlLayout,
  id: PlayerControlId,
  bar: PlayerControlBar,
  index: number,
  limit = MAX_TOP_CONTROLS,
): PlayerControlLayout {
  if (!PLAYER_CONTROL_IDS.includes(id) || (id === 'settings' && bar === 'more'))
    return layout;
  if (bar === 'top' && !layout.top.includes(id) && layout.top.length >= limit)
    return layout;
  const result = {
    top: layout.top.filter(item => item !== id),
    bottom: layout.bottom.filter(item => item !== id),
    more: layout.more.filter(item => item !== id),
  };
  result[bar].splice(Math.max(0, Math.min(result[bar].length, index)), 0, id);
  return pinSettingsControl(result);
}

/** The menu launcher always occupies the final slot of its chosen row. */
function pinSettingsControl(layout: PlayerControlLayout): PlayerControlLayout {
  const bar = layout.top.includes('settings') ? 'top' : 'bottom';
  layout.top = layout.top.filter(id => id !== 'settings');
  layout.bottom = layout.bottom.filter(id => id !== 'settings');
  layout.more = layout.more.filter(id => id !== 'settings');
  layout[bar].push('settings');
  return layout;
}
