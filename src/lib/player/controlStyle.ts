export type PlayerControlStyle = {
  labels: 'full' | 'short' | 'hidden';
  alignment: 'distributed' | 'center' | 'left' | 'right';
  backgroundOpacity: number;
  seekbarScale: number;
  scale: number;
};
export const defaultPlayerControlStyle = (): PlayerControlStyle => ({
  labels: 'full',
  alignment: 'distributed',
  backgroundOpacity: 0,
  seekbarScale: 1,
  scale: 1,
});
export function normalizePlayerControlStyle(
  value: unknown,
): PlayerControlStyle {
  const defaults = defaultPlayerControlStyle();
  if (!value || typeof value !== 'object') return defaults;
  const saved = value as Partial<PlayerControlStyle>;
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n)
      ? Math.max(min, Math.min(max, n))
      : fallback;
  return {
    labels: ['full', 'short', 'hidden'].includes(saved.labels ?? '')
      ? saved.labels!
      : defaults.labels,
    alignment: ['distributed', 'center', 'left', 'right'].includes(
      saved.alignment ?? '',
    )
      ? saved.alignment!
      : defaults.alignment,
    backgroundOpacity: clamp(saved.backgroundOpacity, 0, 1, 0),
    seekbarScale: clamp(saved.seekbarScale, 0.75, 2, 1),
    scale: clamp(saved.scale, 0.75, 1.4, 1),
  };
}
