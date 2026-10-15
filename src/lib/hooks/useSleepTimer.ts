import {useCallback, useRef, useState} from 'react';
import {
  SLEEP_TIMER_OFF,
  SleepTimerOption,
  SleepTimerState,
  getSleepMinutesLeft,
  isSleepDeadlineReached,
  shouldStopAtEpisodeEnd,
  startSleepTimer,
  adjustSleepTimer,
} from '../player/sleepTimer';

export type SleepTimerReason = 'deadline' | 'episode';

/**
 * Sleep timer for one player session. It has no interval of its own: the
 * player calls checkSleepTimer from its progress callback and
 * consumeEpisodeEnd when a video ends.
 */
export const useSleepTimer = (onExpire: (reason: SleepTimerReason) => void) => {
  const [sleepTimer, setSleepTimer] =
    useState<SleepTimerState>(SLEEP_TIMER_OFF);
  const [sleepMinutesLeft, setSleepMinutesLeft] = useState<number | null>(null);
  const timerRef = useRef<SleepTimerState>(SLEEP_TIMER_OFF);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const applySleepTimer = useCallback((next: SleepTimerState) => {
    timerRef.current = next;
    setSleepTimer(next);
    setSleepMinutesLeft(getSleepMinutesLeft(next, Date.now()));
  }, []);

  const selectSleepOption = useCallback(
    (option: SleepTimerOption) =>
      applySleepTimer(startSleepTimer(option, Date.now())),
    [applySleepTimer],
  );

  const checkSleepTimer = useCallback(() => {
    const state = timerRef.current;
    if (state.deadline === null) return;
    const now = Date.now();
    if (isSleepDeadlineReached(state, now)) {
      applySleepTimer(SLEEP_TIMER_OFF);
      onExpireRef.current('deadline');
      return;
    }
    setSleepMinutesLeft(getSleepMinutesLeft(state, now));
  }, [applySleepTimer]);

  const adjustSleepMinutes = useCallback(
    (delta: number) => applySleepTimer(adjustSleepTimer(timerRef.current, delta, Date.now())),
    [applySleepTimer],
  );

  /** Returns true when the timer stops playback here instead of auto next. */
  const consumeEpisodeEnd = useCallback(() => {
    if (!shouldStopAtEpisodeEnd(timerRef.current)) return false;
    applySleepTimer(SLEEP_TIMER_OFF);
    onExpireRef.current('episode');
    return true;
  }, [applySleepTimer]);

  return {
    sleepTimer,
    sleepMinutesLeft,
    selectSleepOption,
    adjustSleepMinutes,
    checkSleepTimer,
    consumeEpisodeEnd,
  };
};
