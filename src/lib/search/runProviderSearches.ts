import {registerWafOperation} from '../services/wafSession';
import {useWafStore} from '../zustand/wafStore';

export type ProviderSearchOutcome<T> = {posts: T[]} | {error: string};

/**
 * Searches providers a few at a time. The sandbox runs two invokes at once and
 * fails any invoke that waits 60 s in its queue, so starting every installed
 * provider together made the tail of the queue time out without running.
 *
 * Each search has its own deadline, held while a captcha dialog is open so the
 * user has time to solve it. Once `signal` aborts nothing new starts and no
 * outcome is reported.
 */
export const runProviderSearches = async <P, T>({
  providers,
  concurrency = 2,
  timeoutMs = 25_000,
  signal,
  search,
  onSettled,
}: {
  providers: P[];
  concurrency?: number;
  timeoutMs?: number;
  signal: AbortSignal;
  search: (provider: P, signal: AbortSignal) => Promise<T[]>;
  onSettled: (provider: P, outcome: ProviderSearchOutcome<T>) => void;
}): Promise<void> => {
  // Registered up front, as the sandbox did when every search was queued at
  // once, so dismissing a captcha also covers searches not started yet.
  const jobs = providers.map(provider => {
    const controller = new AbortController();
    return {
      provider,
      controller,
      release: registerWafOperation(controller.signal),
    };
  });
  const queue = [...jobs];

  const run = async ({provider, controller}: (typeof jobs)[number]) => {
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    const expire = () => {
      if (useWafStore.getState().requests.length === 0) {
        timedOut = true;
        controller.abort();
        return;
      }
      // Restart the clock once the captcha dialog closes.
      unsubscribe = useWafStore.subscribe(state => {
        if (state.requests.length > 0) return;
        unsubscribe?.();
        timer = setTimeout(expire, timeoutMs);
      });
    };
    const stop = () => controller.abort();
    signal.addEventListener('abort', stop);
    timer = setTimeout(expire, timeoutMs);
    // Free the slot on abort even if the search ignores its signal.
    const aborted = new Promise<never>((_, reject) =>
      controller.signal.addEventListener('abort', () =>
        reject(new Error('Aborted')),
      ),
    );
    const outcome = await Promise.race([
      search(provider, controller.signal),
      aborted,
    ]).then(
      (posts): ProviderSearchOutcome<T> => ({posts}),
      (error: any): ProviderSearchOutcome<T> => ({
        error: timedOut ? 'Timed out' : error?.message || 'Failed to search',
      }),
    );
    clearTimeout(timer);
    unsubscribe?.();
    signal.removeEventListener('abort', stop);
    if (!signal.aborted) onSettled(provider, outcome);
  };

  const next = async (): Promise<void> => {
    const job = queue.shift();
    if (!job || signal.aborted) return;
    await run(job);
    return next();
  };

  try {
    await Promise.all(Array.from({length: concurrency}, next));
  } finally {
    jobs.forEach(job => job.release());
  }
};
