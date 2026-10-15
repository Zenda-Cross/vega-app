import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {
  SLEEP_TIMER_OFF,
  SLEEP_TIMER_OPTIONS,
  formatSleepRemaining,
  getSleepMinutesLeft,
  getSleepOptionLabel,
  isSleepDeadlineReached,
  shouldStopAtEpisodeEnd,
  startSleepTimer,
} from '../src/lib/player/sleepTimer';
import {useSleepTimer} from '../src/lib/hooks/useSleepTimer';

const NOW = 1_700_000_000_000;
const MINUTE = 60_000;

describe('sleep timer logic', () => {
  it('offers Off, 15, 30, 45, 60 minutes and end of episode', () => {
    expect(SLEEP_TIMER_OPTIONS.map(getSleepOptionLabel)).toEqual([
      'Off',
      '15 minutes',
      '30 minutes',
      '45 minutes',
      '60 minutes',
      'End of episode',
    ]);
  });

  it('sets a deadline for minute options', () => {
    expect(startSleepTimer(30, NOW)).toEqual({
      option: 30,
      deadline: NOW + 30 * MINUTE,
    });
  });

  it('reaches the deadline only once the time has passed', () => {
    const state = startSleepTimer(15, NOW);
    expect(isSleepDeadlineReached(state, NOW + 15 * MINUTE - 1)).toBe(false);
    expect(isSleepDeadlineReached(state, NOW + 15 * MINUTE)).toBe(true);
    expect(isSleepDeadlineReached(state, NOW + 20 * MINUTE)).toBe(true);
  });

  it('never fires when off', () => {
    const state = startSleepTimer('off', NOW);
    expect(state).toEqual(SLEEP_TIMER_OFF);
    expect(isSleepDeadlineReached(state, NOW + 1000 * MINUTE)).toBe(false);
    expect(shouldStopAtEpisodeEnd(state)).toBe(false);
    expect(getSleepMinutesLeft(state, NOW)).toBeNull();
  });

  it('stops at the episode end without a deadline', () => {
    const state = startSleepTimer('episode', NOW);
    expect(state.deadline).toBeNull();
    expect(isSleepDeadlineReached(state, NOW + 1000 * MINUTE)).toBe(false);
    expect(shouldStopAtEpisodeEnd(state)).toBe(true);
    expect(shouldStopAtEpisodeEnd(startSleepTimer(60, NOW))).toBe(false);
  });

  it('rounds remaining minutes up', () => {
    const state = startSleepTimer(45, NOW);
    expect(getSleepMinutesLeft(state, NOW)).toBe(45);
    expect(getSleepMinutesLeft(state, NOW + 30_000)).toBe(45);
    expect(getSleepMinutesLeft(state, NOW + MINUTE)).toBe(44);
    expect(getSleepMinutesLeft(state, NOW + 50 * MINUTE)).toBe(0);
    expect(formatSleepRemaining(12)).toBe('12 min left');
    expect(formatSleepRemaining(1)).toBe('Less than 1 min left');
    expect(formatSleepRemaining(null)).toBe('');
  });
});

describe('useSleepTimer', () => {
  let hook: ReturnType<typeof useSleepTimer>;
  const onExpire = jest.fn();

  const Probe = () => {
    hook = useSleepTimer(onExpire);
    return null;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    onExpire.mockClear();
    act(() => {
      renderer.create(<Probe />);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pauses once the deadline is reached on a progress check', () => {
    act(() => hook.selectSleepOption(15));
    expect(hook.sleepMinutesLeft).toBe(15);

    jest.setSystemTime(NOW + 10 * MINUTE);
    act(() => hook.checkSleepTimer());
    expect(onExpire).not.toHaveBeenCalled();
    expect(hook.sleepMinutesLeft).toBe(5);

    jest.setSystemTime(NOW + 15 * MINUTE);
    act(() => hook.checkSleepTimer());
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledWith('deadline');
    expect(hook.sleepTimer).toEqual(SLEEP_TIMER_OFF);

    act(() => hook.checkSleepTimer());
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('does nothing when off', () => {
    act(() => hook.selectSleepOption(30));
    act(() => hook.selectSleepOption('off'));
    jest.setSystemTime(NOW + 120 * MINUTE);
    act(() => hook.checkSleepTimer());
    let consumed = true;
    act(() => {
      consumed = hook.consumeEpisodeEnd();
    });
    expect(consumed).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('adjusts the existing deadline by exactly five minutes, preserving elapsed seconds', () => {
    act(() => hook.selectSleepOption(15));
    jest.setSystemTime(NOW + 90_000);
    act(() => hook.adjustSleepMinutes(5));
    expect(hook.sleepTimer.deadline).toBe(NOW + 20 * MINUTE);
    expect(hook.sleepMinutesLeft).toBe(19);
    act(() => hook.adjustSleepMinutes(-5));
    expect(hook.sleepTimer.deadline).toBe(NOW + 15 * MINUTE);
  });

  it('starts from off, handles rapid adjustments, and turns off at zero', () => {
    act(() => {
      hook.adjustSleepMinutes(5);
      hook.adjustSleepMinutes(5);
    });
    expect(hook.sleepMinutesLeft).toBe(10);
    act(() => hook.adjustSleepMinutes(-15));
    expect(hook.sleepTimer).toEqual(SLEEP_TIMER_OFF);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('caps the timer at two hours and switches from episode mode to a minute timer', () => {
    act(() => hook.selectSleepOption('episode'));
    act(() => hook.adjustSleepMinutes(5));
    expect(hook.sleepMinutesLeft).toBe(5);
    expect(hook.consumeEpisodeEnd()).toBe(false);
    act(() => hook.selectSleepOption(120));
    act(() => hook.adjustSleepMinutes(5));
    expect(hook.sleepMinutesLeft).toBe(120);
  });

  it('consumes the episode end so auto next is skipped', () => {
    act(() => hook.selectSleepOption('episode'));
    jest.setSystemTime(NOW + 120 * MINUTE);
    act(() => hook.checkSleepTimer());
    expect(onExpire).not.toHaveBeenCalled();

    let consumed = false;
    act(() => {
      consumed = hook.consumeEpisodeEnd();
    });
    expect(consumed).toBe(true);
    expect(onExpire).toHaveBeenCalledWith('episode');
    expect(hook.sleepTimer).toEqual(SLEEP_TIMER_OFF);

    act(() => {
      consumed = hook.consumeEpisodeEnd();
    });
    expect(consumed).toBe(false);
  });

  it('lets a minute timer run past an episode end', () => {
    act(() => hook.selectSleepOption(60));
    let consumed = true;
    act(() => {
      consumed = hook.consumeEpisodeEnd();
    });
    expect(consumed).toBe(false);
    expect(hook.sleepTimer.option).toBe(60);
  });
});
