/** System volume stays capped at 100%; only the local player gets extra gain. */
export const getPlayerVolumeLevels = (value: number, maximum: number) => {
  const level =
    Math.round(
      Math.max(0, Math.min(maximum, Number.isFinite(value) ? value : 0)) * 100,
    ) / 100;
  return {level, system: Math.min(1, level), boost: Math.max(1, level)};
};
