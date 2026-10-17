import com.vega.Mp4MediaProbe;
import com.vega.RemoteMetadataCache;
import com.vega.RemoteSourceFailures;
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/** Pure native delivery helpers, exercised without Android/player mocks. */
public class RemoteDeliverySafetyTest {
  private static void check(boolean value) { if (!value) throw new AssertionError(); }
  private static byte[] box(String type, byte[] payload) throws Exception {
    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    DataOutputStream out = new DataOutputStream(bytes);
    out.writeInt(payload.length + 8); out.writeBytes(type); out.write(payload); return bytes.toByteArray();
  }
  public static void main(String[] args) throws Exception {
    Mp4MediaProbe probe = new Mp4MediaProbe();
    for (String type : new String[] {"ftyp", "moov", "moof"}) {
      byte[] data = box(type, new byte[12]);
      for (byte b : data) probe.accept(new byte[] {b}, 1);
    }
    check(!probe.getHasMedia()); // Header-only MP4 must never count as a playable result.
    byte[] empty = box("mdat", new byte[0]); probe.accept(empty, empty.length);
    check(!probe.getHasMedia());
    byte[] data = box("mdat", new byte[10]);
    for (int i = 0; i < 8; i++) probe.accept(new byte[] {data[i]}, 1);
    check(!probe.getHasMedia());
    probe.accept(new byte[] {data[8]}, 1);
    check(probe.getHasMedia());
    Mp4MediaProbe invalid = new Mp4MediaProbe();
    byte[] bad = {0,0,0,2,109,100,97,116,1}; invalid.accept(bad, bad.length);
    check(!invalid.getHasMedia());
    // Extended-size and open-ended mdat boxes.
    for (boolean extended : new boolean[] {true, false}) {
      Mp4MediaProbe p = new Mp4MediaProbe();
      ByteArrayOutputStream bytes = new ByteArrayOutputStream(); DataOutputStream out = new DataOutputStream(bytes);
      out.writeInt(extended ? 1 : 0); out.writeBytes("mdat"); if (extended) out.writeLong(17); out.writeByte(1);
      byte[] b = bytes.toByteArray(); p.accept(b, b.length); check(p.getHasMedia());
    }
    AtomicLong clock = new AtomicLong(1000);
    AtomicInteger reads = new AtomicInteger();
    RemoteMetadataCache<Integer> cache = new RemoteMetadataCache<>(2, 1000L, 100L, clock::get);
    check(cache.get("a", () -> reads.incrementAndGet()) == 1);
    check(cache.get("a", () -> reads.incrementAndGet()) == 1);
    clock.addAndGet(1001);
    check(cache.get("a", () -> reads.incrementAndGet()) == 2);
    for (int i = 0; i < 2; i++) {
      try { cache.get("bad", () -> { reads.incrementAndGet(); throw new IllegalStateException("denied"); }); throw new AssertionError(); }
      catch (IllegalStateException expected) { check(expected.getMessage().equals("denied")); }
    }
    check(reads.get() == 3);
    clock.addAndGet(101);
    check(cache.get("bad", () -> reads.incrementAndGet()) == 4);
    cache.clear(); check(cache.get("a", () -> reads.incrementAndGet()) == 5);
    // Two subtitle formats / two seeks share one in-flight metadata load.
    CountDownLatch started = new CountDownLatch(1), release = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(2);
    AtomicInteger shared = new AtomicInteger();
    Future<Integer> one = pool.submit(() -> cache.get("shared", () -> {
      shared.incrementAndGet(); started.countDown();
      try { release.await(); } catch (InterruptedException e) { throw new RuntimeException(e); }
      return 42;
    }));
    check(started.await(2, TimeUnit.SECONDS));
    Future<Integer> two = pool.submit(() -> cache.get("shared", () -> {shared.incrementAndGet(); return -1;}));
    release.countDown(); check(one.get() == 42 && two.get() == 42 && shared.get() == 1); pool.shutdownNow();
    // Failed/no-index reads expire, including null metadata results.
    RemoteMetadataCache<Integer> missing = new RemoteMetadataCache<>(2, 1000L, 100L, clock::get);
    AtomicInteger misses = new AtomicInteger();
    check(missing.get("null", () -> {misses.incrementAndGet(); return null;}) == null);
    check(missing.get("null", () -> {misses.incrementAndGet(); return 10;}) == null);
    check(misses.get() == 1); clock.addAndGet(101);
    check(missing.get("null", () -> 10) == 10);
    RemoteSourceFailures policy = RemoteSourceFailures.INSTANCE;
    long now = 1445412478000L;
    check(policy.retryDelayMs("7", now) == 7000L);
    check(policy.retryDelayMs("Wed, 21 Oct 2015 07:28:00 GMT", now) == 2000L);
    check(policy.retryDelayMs("invalid", now) == 30000L);
    policy.record("https://limited.test/a", 429, "60");
    try {policy.check("https://limited.test/b"); throw new AssertionError();}
    catch (Exception e) {check(e instanceof RemoteSourceFailures.Denied); RemoteSourceFailures.Denied d = (RemoteSourceFailures.Denied)e; check(d.getStatus() == 429 && d.getRetrySeconds() > 0);}
    policy.check("https://other.test/a");
    policy.record("https://denied.test/a", 403, null);
    try {policy.check("https://denied.test/a"); throw new AssertionError();}
    catch (Exception e) {check(e instanceof RemoteSourceFailures.Denied && ((RemoteSourceFailures.Denied)e).getStatus() == 403);}
    policy.check("https://denied.test/b");
    for (String file : args) {
      Mp4MediaProbe p = new Mp4MediaProbe(); byte[] b = Files.readAllBytes(Path.of(file));
      for (int at = 0; at < b.length; at += 7) {
        byte[] chunk = java.util.Arrays.copyOfRange(b, at, Math.min(b.length, at + 7)); p.accept(chunk, chunk.length);
      }
      check(p.getHasMedia());
    }
    System.out.println("Delivery safety passed: empty/fragmented MP4, metadata reuse/failure expiry/concurrency, rate-limit scope and Retry-After");
  }
}
