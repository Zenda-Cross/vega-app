import com.vega.HdrPlaybackPolicy;
public class HdrPlaybackPolicyTest {
  static void check(boolean v) { if (!v) throw new AssertionError(); }
  public static void main(String[] args) {
    HdrPlaybackPolicy p = HdrPlaybackPolicy.INSTANCE;
    check(p.dolbyDecoderActive(true,true,"c2.dolby.decoder.hevc",true,true));
    check(p.dolbyDecoderActive(true,true,"OMX.DOLBY.decoder",true,true));
    check(!p.dolbyDecoderActive(false,true,"c2.dolby.decoder.hevc",true,true));
    check(!p.dolbyDecoderActive(true,false,"c2.dolby.decoder.hevc",true,true));
    check(!p.dolbyDecoderActive(true,true,"c2.qti.hevc.decoder",true,true));
    check(!p.dolbyDecoderActive(true,true,"c2.dolby.decoder.hevc",false,true));
    check(!p.dolbyDecoderActive(true,true,"c2.dolby.decoder.hevc",true,false));
    // PQ/HLG output does not depend on headroom or hardware decoding.
    check(p.hasHdrEvidence(6,6,true,true,false,null));
    check(p.hasHdrEvidence(7,7,true,true,false,null));
    check(p.hasHdrEvidence(6,3,true,true,false,null));
    check(p.hasHdrEvidence(null,6,true,true,false,2.25));
    check(!p.hasHdrEvidence(null,6,true,true,false,1.0));
    check(p.hasHdrEvidence(null,7,true,true,false,2.25));
    check(!p.hasHdrEvidence(3,6,true,true,false,null)); // tone mapped SDR
    check(!p.hasHdrEvidence(null,6,false,true,false,null)); // source alone
    check(!p.hasHdrEvidence(6,6,true,false,false,null)); // SDR display
    check(!p.hasHdrEvidence(null,null,true,true,false,null));
    check(!p.hasHdrEvidence(3,3,true,true,false,null));
    check(p.hasHdrEvidence(3,null,true,true,true,null)); // vendor Dolby
    check(!p.hasHdrEvidence(3,null,false,true,true,null));
    check(p.sameTrack("video/av01","video/av01",1920,1920,1080,1080));
    check(!p.sameTrack("video/av01","video/hevc",1920,1920,1080,1080));
    check(!p.sameTrack("video/av01","video/av01",1920,1280,1080,720));
    check(!p.hasHdrEvidence(3,6,true,true,false,2.25));
    check(!p.hasHdrEvidence(null,3,true,true,false,2.25));
    check(!p.hasHdrEvidence(null,6,false,true,false,2.25));
    System.out.println("HDR policy checks passed");
  }
}
