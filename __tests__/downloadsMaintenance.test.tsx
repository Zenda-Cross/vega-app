import React from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {useDownloadsMaintenance} from '../src/lib/hooks/useDownloadsMaintenance';
import {syncFromSharedFolder} from '../src/lib/sync/syncService';
import {reconcileCompletedDownloadOutputs} from '../src/lib/downloadReconciliation';
import {beginUIInteraction, endUIInteraction} from '../src/lib/performance/idleWork';

jest.mock('@react-navigation/native', () => {
  const ReactRuntime = require('react');
  const FocusContext = ReactRuntime.createContext(false);
  return {
    FocusContext,
    useFocusEffect: (callback: () => void | (() => void)) => {
      const focused = ReactRuntime.useContext(FocusContext);
      ReactRuntime.useEffect(() => focused ? callback() : undefined, [focused, callback]);
    },
  };
});
jest.mock('../src/lib/sync/syncService', () => ({syncFromSharedFolder: jest.fn()}));
jest.mock('../src/lib/downloadReconciliation', () => ({reconcileCompletedDownloadOutputs: jest.fn()}));

const FocusContext = require('@react-navigation/native').FocusContext;
const sync = syncFromSharedFolder as jest.Mock;
const reconcile = reconcileCompletedDownloadOutputs as jest.Mock;
const Harness = ({revision}: {revision: number}) => {
  useDownloadsMaintenance();
  return <>{revision}</>;
};
const screen = (focused: boolean, revision = 0) => (
  <FocusContext.Provider value={focused}><Harness revision={revision} /></FocusContext.Provider>
);
const flush = async () => {
  for (let index = 0; index < 12; index++) await Promise.resolve();
};
let tree: renderer.ReactTestRenderer;
let testClock = Date.now();
let changeState: (state: AppStateStatus) => void;
beforeEach(() => {
  jest.useFakeTimers();
  testClock += 600000;
  jest.setSystemTime(testClock);
  sync.mockReset().mockResolvedValue(undefined);
  reconcile.mockReset().mockResolvedValue(undefined);
  AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    changeState = callback;
    return {remove: jest.fn()};
  });
});
afterEach(async () => {
  await act(async () => {tree?.unmount(); endUIInteraction('test-downloads-scroll'); await flush();});
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('cancels brief tab visits before starting native maintenance', async () => {
  act(() => {tree = renderer.create(screen(true));});
  act(() => {jest.advanceTimersByTime(120); tree.update(screen(false));});
  await act(async () => {jest.runOnlyPendingTimers(); await flush();});
  expect(sync).not.toHaveBeenCalled();
  expect(reconcile).not.toHaveBeenCalled();
});

it('waits for gestures and rechecks files on focus while throttling shared discovery', async () => {
  beginUIInteraction('test-downloads-scroll');
  act(() => {tree = renderer.create(screen(true));});
  await act(async () => {jest.advanceTimersByTime(1550); await flush();});
  expect(sync).not.toHaveBeenCalled();
  await act(async () => {endUIInteraction('test-downloads-scroll'); jest.runOnlyPendingTimers(); await flush();});
  expect(sync).toHaveBeenCalledTimes(1);
  expect(reconcile).toHaveBeenCalledTimes(1);
  await act(async () => {tree.update(screen(true, 10)); jest.advanceTimersByTime(1000); await flush();});
  expect(sync).toHaveBeenCalledTimes(1);
  act(() => {tree.update(screen(false));});
  act(() => {tree.update(screen(true));});
  await act(async () => {jest.advanceTimersByTime(1550); await flush();});
  expect(sync).toHaveBeenCalledTimes(1);
  expect(reconcile).toHaveBeenCalledTimes(2);
});

it('cancels validation when a running sync finishes after blur', async () => {
  let finishSync!: () => void;
  sync.mockImplementation(() => new Promise<void>(resolve => {finishSync = resolve;}));
  act(() => {tree = renderer.create(screen(true));});
  await act(async () => {jest.advanceTimersByTime(1550); await flush();});
  expect(sync).toHaveBeenCalledTimes(1);
  act(() => {tree.update(screen(false));});
  await act(async () => {finishSync(); await flush();});
  expect(reconcile).toHaveBeenCalledTimes(1);
  expect(reconcile.mock.calls[0][0].aborted).toBe(true);
});

it('rechecks after returning from the file manager without waiting for discovery cooldown', async () => {
  act(() => {tree = renderer.create(screen(true));});
  await act(async () => {jest.advanceTimersByTime(1550); await flush();});
  act(() => {changeState('background'); changeState('active');});
  await act(async () => {jest.advanceTimersByTime(1550); await flush();});
  expect(reconcile).toHaveBeenCalledTimes(2);
  expect(sync).toHaveBeenCalledTimes(1);
});

