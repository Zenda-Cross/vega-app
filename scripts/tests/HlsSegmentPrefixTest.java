import com.vega.HlsSegmentPrefix;
import java.io.*;
import java.nio.file.*;
import java.util.Arrays;

/** Run against the compiled native helper; optional args are captured HD-1/HD-2 segments. */
public class HlsSegmentPrefixTest {
  private static final HlsSegmentPrefix helper = HlsSegmentPrefix.INSTANCE;
  private static void check(boolean value) { if (!value) throw new AssertionError(); }
  private static byte[] concat(byte[] a, byte[] b) throws Exception {
    ByteArrayOutputStream out = new ByteArrayOutputStream(); out.write(a); out.write(b); return out.toByteArray();
  }
  private static void unchanged(byte[] data) throws Exception {
    HlsSegmentPrefix.Result result = helper.open(new ByteArrayInputStream(data));
    check(result.getSkipped() == 0);
    try (InputStream stream = result.getStream()) { check(Arrays.equals(data, stream.readAllBytes())); }
  }
  public static void main(String[] args) throws Exception {
    byte[] png = {(byte)137,80,78,71,13,10,26,10,0,1,2,3};
    byte[] ts = new byte[188 * 7];
    for (int i = 0; i < 7; i++) {ts[i * 188] = 71; ts[i * 188 + 3] = 16;}
    byte[] wrapped = concat(png, ts);
    HlsSegmentPrefix.Result result = helper.open(new ByteArrayInputStream(wrapped) {
      public synchronized int read(byte[] b, int off, int len) { return super.read(b, off, Math.min(3, len)); }
    });
    check(result.getSkipped() == png.length);
    check(Arrays.equals(ts, result.getStream().readAllBytes()));
    unchanged(ts); unchanged(png); unchanged(new byte[0]); unchanged(new byte[] {1,2,3});
    unchanged(concat(new byte[] {1,2,3}, ts)); // Never strip arbitrary non-image prefixes.
    byte[] fake = ts.clone(); fake[188 * 3 + 3] = 0;
    unchanged(concat(png, Arrays.copyOf(fake, 188 * 5)));
    unchanged(concat(new byte[64], new byte[] {0,0,0,24,102,116,121,112}));
    check(helper.upstreamRange("bytes=0-", 252).equals("bytes=0-"));
    check(helper.upstreamRange("bytes=1000-1999", 252).equals("bytes=1252-2251"));
    check(helper.upstreamRange("bytes=-500", 252).equals("bytes=-500"));
    check(helper.downstreamContentRange("bytes 0-435095/435096", 252).equals("bytes 0-434843/434844"));
    check(helper.downstreamContentRange("bytes 1252-2251/435096", 252).equals("bytes 1000-1999/434844"));
    for (String file : args) {
      byte[] data = Files.readAllBytes(Path.of(file));
      HlsSegmentPrefix.Result actual = helper.open(new ByteArrayInputStream(data));
      byte[] clean = actual.getStream().readAllBytes();
      check(clean[0] == 71 && clean[188] == 71 && clean[376] == 71);
      check(Arrays.equals(clean, Arrays.copyOfRange(data, actual.getSkipped(), data.length)));
      Files.write(Path.of(file + ".clean.bin"), clean);
      System.out.println(Path.of(file).getFileName() + ": stripped " + actual.getSkipped() + " bytes; video packets preserved");
    }
    System.out.println("HLS segment tests passed: wrapped TS, short reads, normal TS, PNG, truncated, fMP4, false positives and ranges");
  }
}
