import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';
import {AppState} from 'react-native';
import {reconcileCompletedDownloadOutputs} from '../downloadReconciliation';
import {scheduleWhenIdle} from '../performance/idleWork';
import {syncFromSharedFolder} from '../sync/syncService';

let lastDiscoveryAt = 0;
const DISCOVERY_INTERVAL_MS = 5 * 60 * 1000;

export const useDownloadsMaintenance = (): void => {
  useFocusEffect(
    useCallback(() => {
      const schedule = () => scheduleWhenIdle(async signal => {
          await reconcileCompletedDownloadOutputs(signal);
          if (signal.aborted) return;
          if (Date.now() - lastDiscoveryAt < DISCOVERY_INTERVAL_MS) return;
          await syncFromSharedFolder().then(() => {
            lastDiscoveryAt = Date.now();
          }).catch(error =>
            console.warn('[VegaSync] Downloads sync failed:', error),
          );
        }, 1500);
      let cancel = schedule();
      let previousState = AppState.currentState;
      const subscription = AppState.addEventListener('change', state => {
        if (state === previousState) return;
        previousState = state;
        cancel();
        if (state === 'active') cancel = schedule();
      });
      return () => {
        cancel();
        subscription.remove();
      };
    }, []),
  );
};
