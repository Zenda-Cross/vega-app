package com.brentvatne.exoplayer;

import android.net.Uri;
import androidx.media3.common.ParserException;
import androidx.media3.exoplayer.hls.playlist.*;
import androidx.media3.exoplayer.upstream.ParsingLoadable;
import java.io.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public final class SafeHlsPlaylistParserFactoryTest {
    static void check(boolean v) { if (!v) throw new AssertionError(); }
    static final Uri ROOT = Uri.parse("https://example.test/master.m3u8?token=secret");
    static HlsMultivariantPlaylist master(String variant, String audio, String subtitle) {
        return new HlsMultivariantPlaylist(ROOT.toString(), Collections.emptyList(),
            Collections.singletonList(new HlsMultivariantPlaylist.Variant(Uri.parse(variant), null, null, null, null, null)),
            Collections.emptyList(), rendition(audio), rendition(subtitle), Collections.emptyList(),
            null, null, false, Collections.emptyMap(), Collections.emptyList());
    }
    static List<HlsMultivariantPlaylist.Rendition> rendition(String url) {
        return url == null ? Collections.emptyList() : Collections.singletonList(
            new HlsMultivariantPlaylist.Rendition(Uri.parse(url), null, "group", "track"));
    }
    static void rejected(Uri root, HlsPlaylist result, boolean called) throws Exception {
        AtomicInteger calls = new AtomicInteger();
        ParsingLoadable.Parser<HlsPlaylist> parser = SafeHlsPlaylistParserFactory.guarded((u, input) -> {
            calls.incrementAndGet(); return result;
        });
        try { parser.parse(root, new ByteArrayInputStream(new byte[0])); throw new AssertionError("accepted opaque URI"); }
        catch (ParserException e) { check(!e.getMessage().contains("secret")); }
        check(calls.get() == (called ? 1 : 0));
    }
    public static void main(String[] args) throws Exception {
        for (String root : new String[]{"data:application/vnd.apple.mpegurl,secret", "https:secret", "urn:secret", "blob:secret"})
            rejected(Uri.parse(root), HlsMultivariantPlaylist.EMPTY, false);
        for (String variant : new String[]{"https://example.test/v.m3u8", "file:///cache/v.m3u8", "content://provider/v", "relative.m3u8"}) {
            HlsPlaylist expected = master(variant, null, null);
            check(SafeHlsPlaylistParserFactory.guarded((u, input) -> expected)
                .parse(ROOT, new ByteArrayInputStream(new byte[0])) == expected);
        }
        rejected(ROOT, master("data:text/plain,secret", null, null), true);
        rejected(ROOT, master("https://example.test/v.m3u8", "urn:secret", null), true);
        rejected(ROOT, master("https://example.test/v.m3u8", null, "blob:secret"), true);
        IOException failure = new IOException("network failure");
        try { SafeHlsPlaylistParserFactory.guarded((u, input) -> { throw failure; })
            .parse(ROOT, new ByteArrayInputStream(new byte[0])); throw new AssertionError(); }
        catch (IOException e) { check(e == failure); }
        System.out.println("HLS URI guards passed (Android Uri + Media3 models)");
    }
}
