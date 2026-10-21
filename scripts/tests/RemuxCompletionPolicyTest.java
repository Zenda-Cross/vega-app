import com.vega.RemuxCompletionPolicy;
public class RemuxCompletionPolicyTest {
  static void check(boolean v) { if (!v) throw new AssertionError(); }
  public static void main(String[] args) {
    RemuxCompletionPolicy p = RemuxCompletionPolicy.INSTANCE;
    check(!p.endedEarly(true,1630413.0,1630000.0)); // recovered tail probe
    check(!p.endedEarly(false,1630413.0,0.0)); // no EOF warning
    check(p.endedEarly(true,1630413.0,60000.0)); // actually truncated
    check(p.endedEarly(true,1630413.0,0.0));
    check(!p.endedEarly(true,0.0,60000.0)); // unknown source duration
    check(!p.endedEarly(true,1630413.0,null));
    check(!p.endedEarly(true,1630413.0,Double.NaN));
    check(!p.endedEarly(true,60000.0,57000.0)); // normal mux rounding
    check(!p.endedEarly(true,60000.0,65000.0));
    check(p.endedEarly(true,60000.0,50000.0));
    System.out.println("Remux completion checks passed");
  }
}
