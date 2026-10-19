import com.vega.SubtitleReadBatch;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.LockSupport;
import kotlin.Unit;

/** Exercises the native scheduler without Android or network mocks. */
public class SubtitleReadBatchTest {
  private static void check(boolean ok) { if (!ok) throw new AssertionError(); }
  private static List<Integer> items(int count) {
    List<Integer> result = new ArrayList<>();
    for (int i = 0; i < count; i++) result.add(i);
    return result;
  }
  public static void main(String[] args) throws Exception {
    AtomicInteger active = new AtomicInteger(), peak = new AtomicInteger();
    CountDownLatch eightReaders = new CountDownLatch(8);
    ExecutorService callers = Executors.newFixedThreadPool(2);
    Callable<List<Integer>> batch = () -> SubtitleReadBatch.INSTANCE.read(items(64),
      () -> Unit.INSTANCE, value -> {
        int running = active.incrementAndGet();
        peak.accumulateAndGet(running, Math::max);
        eightReaders.countDown();
        try {
          check(eightReaders.await(2, TimeUnit.SECONDS));
          Thread.sleep(20 + (value % 5));
          return value * 2;
        } catch (InterruptedException e) { throw new CancellationException(); }
        finally { active.decrementAndGet(); }
      });
    try {
      Future<List<Integer>> a = callers.submit(batch), b = callers.submit(batch);
      for (List<Integer> result : Arrays.asList(a.get(5, TimeUnit.SECONDS), b.get(5, TimeUnit.SECONDS))) {
        check(result.size() == 64);
        for (int i = 0; i < 64; i++) check(result.get(i) == i * 2);
      }
      check(peak.get() >= 8 && peak.get() <= SubtitleReadBatch.MAX_PARALLELISM);
      AtomicBoolean canceled = new AtomicBoolean();
      AtomicInteger started = new AtomicInteger();
      CountDownLatch wave = new CountDownLatch(8);
      RuntimeException sourceFailure = new RuntimeException("source timeout");
      long begin = System.nanoTime();
      try {
        SubtitleReadBatch.INSTANCE.read(items(2000), () -> { canceled.set(true); return Unit.INSTANCE; }, value -> {
          started.incrementAndGet();
          wave.countDown();
          if (value == 0) {
            try { check(wave.await(2, TimeUnit.SECONDS)); }
            catch (InterruptedException e) { throw new CancellationException(); }
            throw sourceFailure;
          }
          while (!canceled.get() && !Thread.currentThread().isInterrupted()) LockSupport.parkNanos(1_000_000);
          return value;
        });
        throw new AssertionError("Failure swallowed");
      } catch (RuntimeException failure) { check(failure == sourceFailure); }
      check(canceled.get() && started.get() < 2000);
      check(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - begin) < 2500);
      // A failed batch must release permits for the next selection.
      check(callers.submit(() -> SubtitleReadBatch.INSTANCE.read(items(64), () -> Unit.INSTANCE, v -> v))
        .get(3, TimeUnit.SECONDS).size() == 64);
      check(SubtitleReadBatch.INSTANCE.read(Collections.emptyList(), () -> Unit.INSTANCE, v -> v).isEmpty());
      System.out.println("Subtitle reads passed: original concurrency, global cap, ordered results, immediate failure, cancellation, permit recovery");
    } finally { callers.shutdownNow(); }
  }
}
