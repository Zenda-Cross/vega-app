/** Choices shown in the player's Sleep tab. Numbers are minutes. */
export type SleepTimerOption = 'off' | number | 'episode';
export const MAX_SLEEP_MINUTES = 120;

export const SLEEP_TIMER_OPTIONS: SleepTimerOption[] = [
  'off',
  15,
  30,
  45,
  60,
  'episode',
];

export interface SleepTimerState {
  option: SleepTimerOption;
  /** Epoch ms when playback should pause; null unless a minute option is set. */
  deadline: number | null;
}

export const SLEEP_TIMER_OFF: SleepTimerState = {option: 'off', deadline: null};

export function startSleepTimer(
  option: SleepTimerOption,
  now: number,
): SleepTimerState {
  if (typeof option === 'number') {
    if (!Number.isFinite(option) || option <= 0) return SLEEP_TIMER_OFF;
    const minutes = Math.min(option, MAX_SLEEP_MINUTES);
    return {option: minutes, deadline: now + minutes * 60_000};
  }
  return {option, deadline: null};
}

/** Shift the actual deadline without rounding away elapsed seconds. */
export function adjustSleepTimer(state: SleepTimerState, deltaMinutes: number, now: number): SleepTimerState {
  if (!Number.isFinite(deltaMinutes)) return state;
  const remaining = Math.max(0, (state.deadline ?? now) - now);
  const duration = Math.min(MAX_SLEEP_MINUTES * 60_000, remaining + deltaMinutes * 60_000);
  if (duration <= 0) return SLEEP_TIMER_OFF;
  return {option: Math.ceil(duration / 60_000), deadline: now + duration};
}

/** True once a minute based timer has run out. */
export function isSleepDeadlineReached(
  state: SleepTimerState,
  now: number,
): boolean {
  return state.deadline !== null && now >= state.deadline;
}

/** "End of episode" stops at the end and must not roll into the next one. */
export function shouldStopAtEpisodeEnd(state: SleepTimerState): boolean {
  return state.option === 'episode';
}

/** Whole minutes left, rounded up, or null when no deadline is running. */
export function getSleepMinutesLeft(
  state: SleepTimerState,
  now: number,
): number | null {
  if (state.deadline === null) {
    return null;
  }
  return Math.max(0, Math.ceil((state.deadline - now) / 60_000));
}

export function getSleepOptionLabel(option: SleepTimerOption): string {
  if (option === 'off') {
    return 'Off';
  }
  if (option === 'episode') {
    return 'End of episode';
  }
  return `${option} minutes`;
}

/** Remaining time text for the active menu row, e.g. "12 min left". */
export function formatSleepRemaining(minutesLeft: number | null): string {
  if (minutesLeft === null) {
    return '';
  }
  return minutesLeft <= 1 ? 'Less than 1 min left' : `${minutesLeft} min left`;
}
