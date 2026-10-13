# Vega mobile performance audit

## Visual changes — implemented; awaiting user device check

Phone tabs now use the navigator's native-driven 150ms fade with normal native detachment. Movie/series poster cards use native TouchableOpacity feedback (activeOpacity 0.65) on phones; TV retains its Pressable focus behavior. No per-poster mount animations or retained inactive tab roots are introduced. TypeScript and changed-file ESLint pass. At the user's subsequent request, the release APK was built successfully in 2m16s (repeat Android lint tasks skipped), installed with adb install -r preserving app data, and restarted for manual checking. No automated device interaction or performance capture was performed; visual/device verification is left to the user.

## Downloads title-entry validation — implemented in source

The grid renders saved download metadata without whole-library existence reconciliation on focus. Opening a title or changing season schedules only that season's saved file IDs after navigation/gestures settle. Cached title/artwork appear immediately; up to three static skeleton rows replace episode controls until validation finishes. Checks retain the four-request concurrency limit, record-identity protection, and cancellation on blur/season changes; native calls already in flight cannot be stopped, but their results are discarded after cancellation. Playback still checks file existence before opening Player.

Shared-folder discovery remains idle work after a 1.5s focus delay, at most once per five minutes following a successful discovery in this process. Brief visits cancel before starting; discovery already running cannot be cancelled. No ADB/device measurements or installation for this update; improved frame rates are not claimed. Validation: TypeScript and changed-file ESLint pass; 23 tests pass across scoped reconciliation, native-check bounds/stale-result protection, title/season cancellation, and throttled discovery. Startup crash-recovery reconciliation is unchanged and can still check persisted completed outputs. Provider Manager remains the next performance task.

## Provider Manager — phone list optimization applied in source

Code inspection found that Extensions rendered every provider card eagerly in a ScrollView, including images, metadata and action controls. Each rendered card also logged to the console and searched installed/update arrays. Phones now use FlatList with three initial cards, two per subsequent batch, windowSize 5 and 32ms batching. Source-author plus provider-value keys preserve identity. TV keeps the existing ScrollView and attached focus targets. Memoized Set/Map lookups replace repeated per-card array searches, and render logging is removed. Refresh, empty state and provider actions retain their existing flow.

TypeScript and changed-file ESLint pass. Subsequent authorized device check: release built successfully in 4m02s (repeat Android lint tasks skipped), installed with data preserved and restarted on the connected Poco. With 34 providers, entry renders the first visible cards, six short fast swipes reach later providers and return, re-entry succeeds, and VMovies settings opens and dismisses without changing settings. Recent logcat shows no matching fatal/JS exception. Android gfxinfo across entry, scrolls and navigation records 1,304 frames, 3 deadline-missed/janky frames (0.23%), p95 17ms and p99 38ms; legacy jank is 24 frames (1.84%) and the histogram contains frames in the 77ms bucket. These aggregate timings are not scroll-only FPS, proof of 120Hz smoothness, or a matched before/after improvement. Battery temperature is 35.9–36.0°C. Evidence: provider-manager-build.log, provider-manager-entry/scrolled/reentry/modal/final.xml and provider-manager-gfx.txt. Device left on Provider Manager with settings dismissed. Downloads changes are included in this APK but were not device-tested in this focused run. Remaining possible costs include initialization/update checks, source loading, mounted modal content and rerenders of visible cards during status updates. These are follow-up candidates rather than confirmed device bottlenecks.

## Info and Player — targeted rendering changes in source

Info's palette-ready skeleton is intentional and remains unchanged, as requested by the user, to avoid a visible color change. Its accent request now invalidates on effect cleanup so an obsolete result cannot update the page after leaving. No claim is made that its intentional loading wait is a performance bug.

Player previously subscribed to the entire continue-watching list and every local-file association. It now selects only the current title's continue-watching record and the active episode's local-file association. Unrelated history or local-file updates no longer trigger Player renders through those subscriptions. Current-title progress and external sync remain reactive; playback, resume checks, skip timing and persistence are unchanged. Existing tests for progress persistence, playback speed, control visibility, synced history and content-info caching pass (13 tests). TypeScript and changed-file ESLint also pass. At the user's request, the release built successfully in 2m12s (repeat Android lint tasks skipped), installed with app data preserved, and restarted. Device rendering gains for Info/Player have not been measured.

## Episode skeleton layout — updated in source

Season loading now uses full-width 76px rounded episode rows with an 88x56 thumbnail, title/description placeholders and an action slot, replacing the old 85%-width 48px bars. Downloads validation uses its own matching 64px row, 80x45 thumbnail and separate delete-action placeholder. Both share a small static component with three rows and no animation loops, touch targets or metadata loading. Info's palette-ready skeleton timing remains unchanged. TypeScript passes; changed-file lint has no errors (two existing dot-notation warnings). At the user's request, release built successfully in 2m03s (repeat Android lint tasks skipped), installed with app data preserved, and restarted. Awaiting user visual verification.

## TV navigation rail missing icons — fixed in source

The supplied screenshot shows blank Library/Downloads glyphs while rail pills and labels remain visible. The TV icon implementation faded away the filled glyph and deferred an outline-drawing animation through the idle queue, allowing a blank glyph state during navigation/focus work. Icons now always render their filled SVG shape; active/focused color, pill and focus scaling remain controlled by the rail. This removes the icon opacity/dash animations and idle jobs; phone glyph rendering is unchanged. Awaiting user visual verification; not rebuilt or installed for this fix.

TV smoke testing of the preceding x86 release: VMovies and MoviesDrive installed and provider switching worked; MultiStream installation twice returned Network Error. A delayed install error modal appearing after leaving Provider Manager became unresponsive; restart cleared it. Emulator WebView auto-update separately killed Vega once, with no app crash indicated. Movie playback/resume worked after a delay, Hindi-to-Turkish audio and English subtitle selection worked, and speed changed to 1.25x then restored to 1x. Info D-pad Down remained on Back and failed to reach offscreen controls; pointer scrolling allowed playback testing. Search query entry and Preferences entry worked, but search results and settings changes were not verified. User will handle further testing. Evidence saved under performance-captures/tv-*; these are not a full TV pass.

## Download falsely reported missing — access-error handling fixed in source

The user's screenshot shows a downloaded movie listed as missing; its actual saved URI and device permission state have not been inspected, so the exact device cause is unconfirmed. Code inspection found a definite false-negative path: native SAF size errors immediately returned false, and metadata/local access errors were also treated as absence. A failed/unknown size now falls back to metadata; if existence checking throws, reconciliation preserves the record and playback shows an access error instead of marking it missing. Explicit nonexistence still marks missing. A scoped Recheck action lets already-missing records return to completed when the saved file becomes accessible; it does not delete the movie. Moved files or revoked folder access still require restoring access/path separately. TypeScript/changed-file lint and 37 destination/reconciliation tests pass. At the user's request, the ARM mobile release built in 2m24s (repeat Android lint skipped), installed on the phone with data preserved, and restarted. Exact file recovery remains awaiting the user's Recheck test.

## Downloads file-check loading appearance — updated in source

Downloads title/season validation now shows thumbnail/text/action skeleton blocks using the existing shared native shimmer. Empty outlined containers and the red delete placeholder are removed during loading. Season skeletons and Info palette timing remain unchanged. TypeScript and changed-file ESLint pass. Mobile release built in 2m13s (repeat Android lint skipped), installed on the phone with data preserved, and restarted at the user's request. Awaiting user visual check.

## Slow downloaded-title file checks — queue delay fixed in source

Opening a downloaded title queued validation behind serialized background jobs, including shared-folder discovery that can continue after Downloads loses focus. This can delay visible skeleton completion even before the selected files begin checking. Title validation now uses a separate user-visible lane with priority admission; it still waits for navigation/gesture completion, bounds native checks to four, and cancels stale results. One background and one user-visible job can wait on native I/O concurrently. Existing background jobs remain serialized. TypeScript, changed-file lint and 46 relevant tests pass. Mobile release built successfully in 2m01s (repeat Android lint skipped), installed on the phone with data preserved, and restarted at the user's request. Device timing for this change remains unmeasured. Also corrected local-path access rejection handling so it remains unknown rather than false, matching the prior SAF fix.

## Selected poster corner overflow — fixed in source

Selected phone poster cards now clip content to their rounded selection surface, inset title/subtitle text, and reserve extra bottom padding so text stays clear of curved corners. Poster images/fallbacks fill the bordered container's inner width instead of using a fixed width that ignored its selection border. Normal unselected layout and TV focus overflow remain unchanged. Awaiting user visual verification; not installed.

## Agreed remaining tasks

Provider scrolling and drawer closing are fast enough for the user. Further tuning is parked; the applied fixes remain. The drawer end hitch is the lowest priority.

1. **Downloads validation on title entry — recommended next:** show the grid from saved metadata, then validate only the opened movie or selected season. Show cached title/artwork immediately and skeleton episode rows while checks run; bound checks and cancel on leaving. Preserve playback existence checks. Shared-folder discovery remains a separate refresh/occasional idle task. Implemented in source; awaiting release build and user device verification. See the Downloads update below.
2. **Provider Manager lag — first fix applied; awaiting user verification:** phone cards are windowed and per-card lookups indexed. Broader cold settings entry work remains paused; the first pass improves the measured entry maximum from 137.19ms to 87.25ms. Compose controls and other settings pages still need work; full-sequence jank remains. Resume only when requested.
3. **Warm tab switching — revisit with a touch-safe approach:** custom native retention is disabled because inactive Screen roots intercepted Home/drawer touches. The current release uses normal native detachment. Earlier retention speed measurements are historical; current warm-tab attachment cost needs a fresh capture before choosing another fix.
4. **Hero image quality — visual verification:** check that reduced phone background decoding remains acceptable once artwork finishes loading. Foreground posters remain sharp; TV decoding is unchanged.
5. **Drawer end-of-close hitch — accepted, parked last:** the first 500ms of three closing slides have maximum UI callbacks of 13.74/9.32/6.71ms, with none over 16.67ms. A 36–40ms reactivation frame remains after the slide. The user accepts the current speed. Native retention remains disabled to address the reproduced touch blocker; revisit the end hitch only if it becomes bothersome.

## Drawer dismissal and blocked-touch regression (applied, installed, verified)

**Touch failure reproduced:** the user's open drawer exposed an accessible full-screen Close drawer button, but tapping x1000/y1300 left Select Provider open. Restart restored it temporarily. After tab returns, Home scrolling still worked while hamburger taps failed. Retained inactive native Screen roots remained above Home; adding pointerEvents or display:none did not make retention safe on this device. The final release disables custom RetainedTabScene in App and uses the navigator's normal native detach policy. This sacrifices the previously measured retention benefit; do not describe those warm-tab numbers as current-release performance. The unused adapter and its tests were subsequently removed during commit cleanup; the normal native detach policy remains in use.

**Close-slide fix:** Home drawer callbacks are stable. patches/react-native-drawer-layout+4.2.1.patch, covering source and packaged JS, remembers the spring destination and ignores duplicate requests without velocity, preserving gesture settling with velocity. For overlay/gesture closes, the library already drives the spring; Home acknowledges the request without immediately changing controlled open. finishDrawerTransition commits open=false and reactivates Hero after closing finishes. Explicit close/provider-selection callbacks can still change controlled open to initiate the spring. This avoids Home/control rebuilding during the visible closing slide.

**Measured result:** actual close releases occur at 0.982s, 5.662s and 10.317s. Maximum UI callbacks within their first 500ms are 13.74ms, 9.32ms and 6.71ms; no callbacks exceed 16.67ms in these windows (58/59/60 callbacks). Previously immediate close frames were about 39ms, and early attempts still reached 36–45ms. **Remaining cost:** reactivation frames last 36.28/39.76/38.86ms at 1.701/6.379/11.040s, about 0.72s after release. Presentation gaps of 50–58ms coincide with that end work. The change moves costly reactivation after the slide rather than eliminating it; 120Hz perfection and end-of-close responsiveness are not claimed. Gesture/tap close now share this delayed final-state policy.

**Rejected experiments:** adding pointerEvents to native retained Screens was insufficient; changing hidden Screen style to display:none also left inactive content visible above Home. Both are bypassed by disabling retention. Hardware-layer caching of drawer/Home and disabling clipping did not improve close frames (43.31/45.11/36.75ms), so those library changes were removed. An intermediate deferred-Hero build missed the closing reset and disabled reopening; it was corrected, and its sparse vega-drawer-final trace is INVALID performance evidence. The real Home lifecycle test now verifies controls remain paused during closing, restore at transition completion, and allow reopening.

**Verification/install:** final release builds in 2m15s and installs with data retained, followed by force-stop/restart. The final JS-only builds skip repeat Android lint tasks; earlier full Android release/lint checks passed, and final TypeScript/changed-file ESLint pass. Home lifecycle test passes; five adapter tests pass but that adapter is disabled. Final device checks verify opening before capture, three outside-tap closes, reopening afterward, a full tab cycle followed by working Home hamburger/background close, Home scrolling and swipe closing. Vega is left on Home with drawer closed. APK SHA256: 3214194ad4a10b00e5400f25188475af490cdab2955727e0b50396de0ed6acf8. No display/thermal settings changed.

Evidence: drawer-overlay-before/tapped.xml; drawer-visible-* (failed visibility experiment); drawer-final-* (native-detachment touch checks, not the invalid timing trace); vega-drawer-deferred.perfetto-trace, drawer-deferred-summary.csv, drawer-slide-window.sql/csv; drawer-deferred-ready/reopened/tab-return-open/home-scroll/swipe-closed/final-home.xml. The captures are non-interleaved device experiments and do not prove long-session freedom from every touch issue.

## Task 3 — provider-change poster teardown (fixes applied; further tuning parked)

Settings work is paused at the user's request. Provider scrolling is now accepted as fast enough; the investigation and intermediate measurements below are retained as historical evidence.

**Confirmed app cost:** EonMovies → VMovies → EonMovies with immediate 80ms flicks reproduces a 67.13ms UI callback. Its mount removes 318 views and deletes 319; 157 layout instructions take 23.49ms, with total mount 46.20ms. A warmed control reaches 66.78ms and a 42.05ms maximum mount batch. This is separate from the fixed TV accessibility query and warm-tab reattachment.

**Rejected experiment:** retaining horizontal lists and identifying poster slots by index reduces creation but concentrates synchronous state/text updates. First and warm captures reach 109.46ms and 79.04ms respectively, worse than the control tails. The slot identity and card-reset changes were removed. Provider/item keys and provider-specific offset restoration remain intact; slot reuse is not an applied fix.

**Installed candidate:** phone horizontal poster lists now use windowSize=3 and maxToRenderPerBatch=4, versus 5 and 8. TV retains 5 and 8. This bounds overscan and later creation batches while preserving original identity and navigation. The release builds successfully in 2m27s and is installed with app data retained. Six tests pass across poster identity/navigation, provider-specific offset restoration, progressive loading and query cancellation; TypeScript and changed-file lint pass.

**No measured improvement established:** the first window-only capture reaches 111.99ms maximum UI callback and 75.41ms maximum mount. It is therefore not evidence that provider-change lag is fixed. Later captures run at about 60Hz, whereas the original control runs at about 120Hz; their missed-deadline counts are not comparable. The installed smaller window is a candidate requiring a cool-device, same-refresh before/after comparison.

**Device-side finding:** Poco's display service explicitly reports PRIORITY_THERMAL_LIMIT_REFRESH_RATE capped at 60Hz. Battery temperature is 43.4°C while AC charging, although Android's generic thermal status reports 0. The thermal vote prevents the 120Hz preference from taking effect. This establishes a device limit during these later tests, not that Vega caused the heat or that thermal throttling explains the original app stalls. Thermal protection was left enabled; temporary display preferences were restored.

**Cooled-device verification:** with charging off and starting battery temperature 38.9°C, two repeat captures confirm approximately 120Hz UI cadence (1,746 and 1,737 callbacks over 15s). The installed window-only candidate reaches maximum UI callbacks of 60.48ms and 56.96ms, maximum mount batches of 41.60ms and 37.37ms, and p95 callbacks of 5.53ms and 5.85ms. Both record 27 missed app deadlines (799 and 769 app frames). Qualifying moving intervals deliver 111.7 and 111.5 FPS over only 2.37/2.31 seconds, with longest presentation gaps 58.33/58.53ms. Those intervals are a limited sample, not whole-session FPS. The first worst frame still has 154 layout instructions taking 21.87ms, UPDATE_STATE taking 10.79ms, and 213 removals/214 deletions. Thus cooling restores high cadence but does not eliminate the app's provider-change hitch. Results are directionally better than the earlier 66.78–67.13ms controls, but these are not a fresh interleaved A/B and do not establish a causal improvement percentage. Evidence: provider-cooled[-repeat]-summary.csv, provider-cooled[-repeat]-cadence.csv, provider-cooled-attribution.csv and corresponding traces. No additional code changes during this verification.

**Rejected measured-layout/two-poster experiment:** installed and tested at approximately 120Hz, starting at 40.8°C without charging. First/warm captures reach 64.67/66.28ms maximum UI callbacks, p95 10.63/12.15ms, and 94/108 missed app deadlines out of 884/802 frames. Qualifying moving intervals deliver 103.7/103.1 FPS over 4.00/3.98s, versus about 112 FPS in the previous shorter moving samples. The first worst frame combines a 22.06ms mount with 18.88ms queued pre-mount execution, including 14 text and 35 view creations. Smaller individual mount batches did not improve overall behavior. Precomputed getItemLayout, reduced initial count and two-poster batches were removed. These remain non-interleaved device experiments with different cache/process/hero states. Evidence: provider-layout-after/warm summaries, cadence CSVs and traces.

**Replacement candidate:** Home phone vertical drawDistance is reduced from 400dp to 250dp, retaining an offscreen buffer while reducing complete rows eligible for rebuilding. TV remains 800dp. Horizontal lists retain four-poster batches and windowSize=3, with original provider keys and offset restoration. Explicitly scoped rows keep the narrow global-provider selector to avoid intermediate old-data updates. Release builds successfully in 3m22s and is installed with data retained. Six tests, TypeScript and changed-file lint pass. First/warm captures at approximately 120Hz reach 68.76/74.42ms maximum UI callback, p95 6.71/6.91ms, maximum mount 44.66/36.32ms and 40/43 missed app deadlines out of 883/841 frames. Sampled moving intervals deliver 106.6/107.0 FPS over 3.88/3.69s, with longest gaps about 75ms. This is better than the rejected layout experiment but does not establish improvement over the original window-only release; provider-change stalls remain unresolved. The latest worst frame combines mount 36.32ms, forced pre-mount execution 14.48ms and traversal/draw 15.82ms, including 153 layout instructions and 77 state updates. Native source confirms dispatchMountItems drains queued pre-mount creation before normal mounting; a smaller mount batch alone therefore does not bound total callback cost. Do not reorder native mounting blindly: creation/order correctness matters. Next investigate staged incoming catalog-row commits at the React level. Later rows are reachable and populated after fast flings (provider-buffer-scroll.xml); this snapshot does not prove absence of transient blanks during motion. Evidence: provider-buffer-after/warm summaries, cadence CSVs, warm-attribution CSV and corresponding traces. Vega left on EonMovies Home; no display/thermal settings modified in this verification.

**Staged incoming catalog rows (applied, installed and measured):** useStagedHomeRows keeps all catalog keys in the vertical list but admits one additional phone poster row every 32ms, with the first catalog row immediately ready. Deferred Slider rows retain their title/See all action and use one static 243dp placeholder instead of animated skeletons or native poster/text trees. Viewable row indices take priority after fast movement. Provider scope includes author, source URL, value and version; changing it invalidates the reveal set synchronously and effect cleanup cancels the prior timer. Home blur cancels the timer while retaining its progress; returning resumes. TV bypasses staging. Nine tests pass across reveal ordering, viewability priority, rapid provider change, blur, progressive data, TV bypass, navigation/offset restoration and query cancellation/loading. TypeScript and changed-file lint pass. The 32ms spacing is a scheduling target, not a guarantee of separate native presentation frames. Placeholder height approximates ordinary portrait rows; unusual landscape/tall aspect ratios can change height on reveal and need visual testing. This does not eliminate synchronous deletion of old provider views or stage Hero updates. Normal release builds in 3m24s and installs with app data retained. Two approximately 120Hz captures give maximum mount batches 24.92/25.01ms, compared with 44.66/36.32ms in the preceding buffer-only captures. Maximum UI callbacks are 57.35/51.23ms versus 68.76/74.42ms; longest qualifying moving presentation gaps are 33.60/33.44ms versus about 75ms. Moving samples deliver 108.8/110.3 FPS over 3.84/3.70s. However p95 callbacks are 6.83/7.65ms and missed app deadlines 54/924 and 50/888, versus buffer-only 40/883 and 43/841: smaller large hitches do not establish an overall deadline/jank improvement. Total mount work increases to 660/828ms from 513/531ms, consistent with more separate commits. These are two non-interleaved before/after captures, not a controlled statistical benchmark. The first worst frame includes 22.97ms mounting plus a 25.62ms syncAndDrawFrame/postAndWait wait; mount staging has reduced one bottleneck, while rendering/scheduling stalls remain. Battery ends at 41.2°C, charging off. XML and screenshot confirm populated Web Series/Netflix rows after fast flings, not absence of every transient placeholder. Evidence: provider-staged-after/warm summary and cadence CSVs, after-attribution CSV, corresponding traces, provider-staged-scroll.xml/png. No peak-smoothness claim.

**Hero background texture upload (applied and measured):** RenderThread attribution of the staged-after worst frame identifies Texture upload 1920x1080 at 2.188s taking 22.45ms, nested in syncFrameState 25.46ms; the UI thread's postAndWait is 25.60ms. A nearby 375x563 poster upload takes 2.10ms. This proves a large texture upload accounts for the drawing wait; identifying that texture as the hero background is supported by the landscape dimensions and the response to a background-only decode change, rather than a URI-labelled native trace. The warm pre-change capture already has a smaller 1280x720 upload at 7.83ms, so cache/artwork differences materially affect the comparison.

Phone Hero background Image now passes resizeMultiplier=0.5 with resizeMethod=resize. Native ReactImageManager/ReactImageView source confirms the prop scales requested decode width/height; the TV fork's TypeScript declaration omits the supported prop, so it is supplied through an object spread. The foreground poster and TV multiplier stay 1. A tall cover crop can keep a full landscape bitmap to fill the crop height; reducing requested decode dimensions limits the upload at the cost of softer background artwork. Fresco distinguishes software resize/downsampling from canvas scaling and recommends appropriately sized images: https://frescolib.org/docs/resizing.html . This is not a global image downsample policy or disabling artwork/effects.

TypeScript and Hero lint pass; normal release builds in 4m7s and installs with data retained. Two approximately 120Hz provider/flick captures give maximum UI callbacks 38.65/37.05ms (zero over 50ms), maximum mount batches 22.30/21.16ms, and 37/952 and 30/863 missed app deadlines. Prior staged-only captures have maximum UI 57.35/51.23ms and 54/924 and 50/888 missed deadlines. The first new landscape upload is 1120x630 at 4.66ms; postAndWait maxima are 5.70/8.06ms and syncFrameState 5.50/4.02ms. Moving samples deliver 113.8/112.0 FPS over 3.70/3.64s, with maximum gaps 33.46/33.42ms. This supports reduced upload stalls but remains a non-interleaved release comparison with varying artwork/cache state; it does not prove every old/new hero texture is identical or that all jank is resolved. Battery ends at 40.9°C, charging off. Home screenshots retain layout but show hero metadata/artwork loading at capture time; artwork softness needs further visual review and is not claimed fully verified.

Evidence: provider-render-after.csv with render overlap; provider-texture-before/after/warm.csv and provider-texture-summary.sql; provider-artwork-after/warm summary/cadence CSVs and corresponding traces; provider-artwork-home[-final].png. Remaining provider frames still exceed an 8.33ms budget, and drawer-only dismissal is a separately confirmed outstanding issue.

**Next work:** isolate incoming provider text/layout batches and reduce their per-frame work, then repeat on a cooled device at the same active refresh rate. The captures also contain drawer animation, hero changes and scrolling, so aggregate jank is not exclusively provider selection. Process/cache and hero-image choices differ between installs.

Evidence: provider-next-before-attribution.csv, provider-next-before-summary.csv, provider-next-warm-control-summary.csv, provider-slots-warm-summary.csv, provider-window-only-first-summary.csv and their corresponding traces in performance-captures. Settings remain paused; Downloads title-entry validation and drawer tap-close jitter remain outstanding.

## Task 2 — cold Preferences rendering (first pass applied and installed)

The latest installed control reproduces a 137.19ms first-entry UI callback and a 223.76ms maximum across first entry, down/up flicks, Back and re-entry. An initial whole-section FlatList experiment did not help enough: first entry remained 132.46ms and missed app deadlines rose from 22/779 to 39/688 in one pair. It is rejected as the final solution.

Attribution in settings-window-after-attribution.csv shows the remaining frame creates five switches, six Compose dropdown items and five Compose text views; INSERT consumes 35.73ms, layout 22.79ms, and Compose recomposition 19.61ms (nested durations are not additive). Whole sections and a broad render window still permit a costly offscreen Playback batch.

The replacement uses phone-only row windowing for direct SettingsSection children, preserving section headings, card backgrounds, rounded first/last edges and dividers. Six initial list items and two-item later batches restrict cold native creation; the final window covers three viewports to allow momentum scrolling to continue while later cells fill in. Component sections retain their own layout. TV keeps its continuous ScrollView for directional focus. Metadata's editable draft is held by Preferences so section recycling does not discard it. A dedicated real-FlatList test verifies deferred mounting and splitting a 20-row section; a remount test verifies the draft, and slider tests cover final-value commits. Six targeted tests pass, including the continuous TV focus-tree check; TypeScript and changed-file lint pass. Jest now transforms the installed @react-native-tvos/virtualized-lists package, needed to test the actual FlatList rather than a list mock. The final normal release builds successfully in 2m8s and is installed with data retained. APK SHA256: 0c895943feecbc5f799581e6d45a415666efa38f123447603f9d93e6ba332075.

**Window tradeoff:** a one-viewport row window reduced first entry to 74.71ms and maximum mount to 12.90ms, but fast flick travel was limited while rows filled in. That version is not the final choice. A three-viewport buffer with two-row batches reaches the Quality controls after five additional 100ms flicks; the tight window took many more. XML evidence in settings-buffer-scroll.xml confirms Downloads, connection controls, and Excluded Qualities are reachable. Screenshots verify the initial card/header appearance. No settings were deliberately toggled.

| Latest control versus final buffered rows | Before | After |
| --- | ---: | ---: |
| Maximum UI callback in first-entry 0.8–4s window | 137.19ms | 87.25ms (36% shorter) |
| Maximum UI callback across the full sequence | 223.76ms | 111.12ms |
| p95 UI callback across the full sequence | 7.52ms | 8.24ms |
| Maximum mount batch | 67.70ms | 56.82ms |
| UI callbacks over 50ms | 9 | 10 |
| App Deadline Missed / app frames | 22/779 | 30/685 |

**Limits:** this is a single release pair with identical requested taps/flicks, different process/cache states, and list scrolling behavior that changed. UI callback durations are not display FPS or tap latency. The cold-entry and worst-burst reductions are useful, but the p95 and missed-deadline results do not establish an overall jank improvement. Compose measurement across the complete sequence remains substantial (608.30ms inclusive versus 569.20ms); this pass bounds initial row creation rather than making those controls cheaper.

**Remaining Task 2 work:** cold Preferences is still above a frame budget, and scrolling/re-entry still has native Compose creation/recomposition plus INSERT/layout bursts. The final worst frame at 4.156s contains a 49.72ms mount, 30.39ms INSERT, 13.37ms layout and 18.23ms Compose recomposition (nested durations overlap). Buffering/Downloads are still component-sized cells. Replace or split those remaining phone control hosts and measure their visible-entry cost; other settings pages, including Subtitle Style, have not been converted by this pass. This task is not claimed fully resolved.

Evidence: vega-settings-window-before.perfetto-trace and vega-settings-buffer-final.perfetto-trace; settings-window-before-summary.csv, settings-buffer-final-summary.csv and settings-buffer-final-attribution.csv. The initial after-capture stayed on Home and is discarded; the whole-section experiment and tight-window experiment are retained separately so they are not mistaken for final results. Stay-awake was restored to 0.

## Task 1 — warm-tab native retention (historical; reverted after touch regression)

**Current status:** custom native retention is disabled in the installed release because inactive native Screen roots blocked Home/drawer touches. The measurements below document the earlier experiment, not the current default-detachment build. A touch-safe retention approach is deferred.

**Confirmed cause:** the repeated warm diagnostic control reproduces a 125.18ms UI frame. Two RNSScreen prop updates consume 79.27ms, including a single 76.67ms activation. Activating the Home fragment reattaches 91 Fresco image views (40.84ms nested inside screen activation). Ordinary RCTView updates consume only 3.23ms in that frame. The prior TV accessibility query guard remains effective; this is a separate native fragment/image attachment cost.

**Rejected first experiment:** disabling native detachment and wrapping scenes with React Freeze removes the expensive RNSScreen operation, but the fallback uses display:none and Suspense also hides ordinary View hosts. A repeated warm capture still reaches 102.37ms, now dominated by REMOVE/INSERT (34.34ms/30.40ms) and layout. It does not meet the smoothness target and is being replaced rather than declared complete.

**Applied:** retain Android phone tab fragments with native activity state 1, keep native-screen freezing, and hide inactive screens outside the viewport with opacity zero and accessibility exclusion. Nested native-stack screens retain their original behavior. TV and iOS keep their existing path. The native Screen host already excludes Suspense display changes, avoiding the fallback's geometry collapse. Native state and image controllers are retained. Device checks confirm Settings touch routing, nested Providers page restoration after a tab round trip, Android Back returning to Settings, and identical Home visible text/bounds before and after a tab switch. These are phone checks, not TV/iOS verification.

Diagnostic tracing adds manager-name-only Vega:Props labels and Vega:ImageAttach spans under the existing optional native tracing build flag. No URLs or prop contents are logged. Evidence: tab-traced-warm-attribution.csv, tab-retained-warm-attribution.csv and their corresponding traces in performance-captures. Cold/mixed first runs are excluded from the warm comparison. **Repeated warm diagnostic comparison:** the worst UI callback falls from 125.18ms to 21.19ms (83% shorter); the slow frame's mount batch falls from 84.33ms to 13.16ms. All 30 RNSScreen update calls total 16.04ms, maximum 1.48ms, versus 452.13ms / 76.67ms before. The warm capture has no ImageAttach spans. Home momentum presents at 118.3 FPS over 3.55 qualifying seconds. These are one matched-sequence pair after warmup, not a statistical guarantee. Some deadlines are still missed (32/567 app frames), so this does not claim perfect 120Hz navigation. Cold first mounts remain separate; the initial partial capture includes a 150.72ms frame and is not used for the warm improvement.

**Memory:** warm snapshots show PSS 426,805KB control versus 449,886KB retained; swap PSS 92,182KB versus 28,640KB. Paging/process states differ, so the 23MB PSS rise alone does not establish retained-memory overhead or a leak. Retention intentionally keeps visited native tab trees alive, and long-session/older-device memory testing remains appropriate. The change preserves lazy first visits and inactive native freezing.

**Checks:** 12 targeted tests pass across tab retention, Downloads maintenance and idle scheduling; TypeScript and changed-file lint pass. **Normal release verification:** with optional native tracing disabled, the repeated 16-tap sequence plus two Home flicks records maximum UI callback 17.23ms, p95 5.42ms, maximum mount batch 6.78ms, and zero UI callbacks over 50ms. Home presents at 117.5 FPS over 4.469 qualifying seconds. App Deadline Missed remains 28/704; this change targets the large synchronous stall rather than every deadline miss. Evidence: vega-tab-native-normal-warm.perfetto-trace, tab-native-normal-warm-summary.csv and tab-native-normal-warm-presentation.csv. The later rebuild changes only the inactive screen offset from width to max(width,height), to cover rotation while frozen; final installation succeeded with data retained. Final APK: android/app/build/outputs/apk/release/vega-v5.0.2.apk, 57,641,237 bytes, built 2026-10-09 18:17:30; SHA256 742fd1b578f7d4aecf39ca0be2376744b516369d538ccf88c4a3320ea98783f0. DEX inspection confirms the optional Props/ImageAttach diagnostic labels are absent. Phone stay-awake was restored to its original value 0.

**Final APK repeat:** maximum UI callback 26.24ms, p95 5.02ms, maximum mount 9.55ms; no callbacks over 50ms. 27/623 app frames miss deadlines. Evidence: vega-tab-native-final-repeat.perfetto-trace and tab-native-final-repeat-summary.csv. The first post-install pass is retained too: it contains a 130.26ms frame with 101.02ms traversal and large text/layout updates (52 state / 276 layout instructions), despite short nominal pre-visits. Therefore tab visits alone are not sufficient warmup; initial/catch-up content drawing remains slow and is not declared fixed. Its attribution is in tab-native-final-first-attribution.csv. The final repeat demonstrates removal of the recurring warm fragment-activation stall, not elimination of cold rendering costs.

## Next fix — cheaper settings cards and bounded Downloads maintenance

**Applied:** `Surface.tsx` now draws its Material color, rounded corners and optional outline with a React Native View. The former phone path created a Compose Host, native Surface and RNHostView solely around RN children. Removing that boundary also removes repeated cross-framework content measurement from settings sections. Theme colors, caller padding, the phone's 28dp corners and TV's existing 24dp corners remain. Actual Compose sliders, search fields and dropdowns remain; this change does not claim to eliminate every settings mount cost.

**Applied:** Downloads maintenance is now separate from TV focus restoration. A stable focus callback queues one job after a 300ms settling delay through `scheduleWhenIdle`; brief visits cancel before work starts. Group counts, progress and focus-node updates no longer restart scans while the screen remains focused. Sync finishes before reconciliation begins, and blur aborts subsequent reconciliation. A sync already executing is shared with other screens and is allowed to finish; native file calls already in flight also finish, but aborted checks cannot update records or launch further calls. Phone layout callbacks no longer look up TV node handles or update the TV focus store.

**New code finding, fixed:** completed-output reconciliation previously used `Promise.all` over the entire download library, launching every existence check together. It now runs at most four checks concurrently per invocation, checks completed/missing records only, and rejects stale results if a record was deleted or replaced while the check was pending. This bounds native/content-provider traffic; a measured contribution to the prior rapid-tab stall has not been established. Startup's separate full recovery path is unchanged.

**Release comparison:** `vega-next-before.perfetto-trace` and `vega-next-after.perfetto-trace` repeat first Preferences entry, a down/up scroll, Back and re-entry with the same coordinates and delays. Both releases include the native TV query guard. The final APK was built successfully in 3m7s and installed with data retained at **2026-10-09 17:11:09**. Screenshots confirm the settings card shape/layout and Preferences controls remain intact; no settings were deliberately toggled. The reproducible summary query is `performance-captures/settings-mount-summary.sql`; results are in `next-before-summary.csv` and `next-after-summary.csv`.

| Measurement across the ~15s captures | Before | After |
| --- | ---: | ---: |
| Compose owner measurement slices | 4,238 | 445 |
| Compose owner measurement, inclusive time | 1,783.4ms | 519.5ms (**71% less**) |
| Compose owner drawing, inclusive time | 411.7ms | 41.0ms |
| App Deadline Missed frames / app frames | 35 / 754 | 11 / 739 |
| First entry's maximum UI frame | 176.2ms | 153.3ms |
| p95 UI callback duration across the capture | 7.93ms | 5.71ms |

These inclusive slice durations can nest and are not additive CPU time; UI callback duration is not presented FPS. This is one before/after pair, with different process/JIT/cache states, rather than a repeated statistical benchmark. The reduction in Compose boundary calls is consistent with the implemented removal. It does **not** establish a device-wide percentage improvement or isolate the runtime cost of Downloads scans. **Cold entry remains slow:** the after trace still has a 153.3ms frame and a 61.9ms mount batch. Eager page mounting and remaining Compose sliders/dropdowns/search fields need follow-up attribution and visible-content batching.

**Rapid-tab verification on the installed release:** after returning from Preferences and visiting each root tab, `vega-next-tabs.perfetto-trace` records 16 tab taps with 120ms requested spacing plus command overhead, then two Home momentum flicks. Warm switching still produces a **125.8ms UI frame** and an **82.4ms mount batch**, with 34 App Deadline Missed frames out of 686 across the combined capture. Those are frame/mount durations, not measured tap-to-navigation latency. Subsequent Home movement presents at **117.9 FPS** over 4.44 qualifying seconds, so the native scrolling fix remains effective. The remaining warm-tab commit batches are the next navigation bottleneck to attribute; the Downloads scheduling change alone is not claimed to solve them. `next-tabs-summary.csv` and `next-tabs-presentation.csv` contain results. The original screen-awake setting was restored to 0 after testing, and Vega was left on Home.

**Validation:** four targeted Jest suites / **26 tests pass**, including focus cancellation, waiting for interaction holds, rerender deduplication, blur during running sync/reconciliation, bounded checks and stale-record protection. TypeScript and lint for the changed production files pass. The initial Jest invocation also scanned a pre-existing `.kilo` worktree; the final invocation uses exact test paths and excludes that worktree. Physical TV hardware remains untested.

## Hardest bottleneck fixed — native TV accessibility queries on phone scroll commits

**The caller is now identified and the fix is applied to the actual packaged native dependency.** In a control release with the guard disabled and targeted native tracing enabled, visiting Preferences, rapidly switching tabs, then returning to loaded Home reproduced **25.5 FPS** momentum scrolling. `Vega:ScrollFabricState` wrapped the ReactScrollViewHelper Fabric state-update call; **26,481 TV accessibility query sections** were direct children of that section. Across the trace, **27,066 calls** to ReactViewManager's `AccessibilityManager.getEnabledAccessibilityServiceList` occupied **5,501.9ms**. Their nested synchronous Binder transactions occupied **4,255.6ms**. This establishes the method behind the recurring service traffic rather than inferring it from Binder transaction code alone.

The native TV implementation queries enabled accessibility services in `manageFocusGuideAccessibilityDelegate` before checking whether a ReactViewGroup is a TV focus guide. Fabric scroll-state updates can reach that method repeatedly for ordinary phone views. The fix returns before the service query when a view is **neither a TV focus guide nor carrying an existing TV TalkBack delegate**. Actual guide setup and existing-delegate cleanup still execute the original method. This is a narrow guard, not an accessibility-service cache, service disablement, or removal of general React Native accessibility handling.

The app consumes a prebuilt `io.github.react-native-tvos:react-android:0.86.3-0` AAR, so a node_modules Kotlin edit would be ineffective. The [Expo config plugin](plugins/with-native-scroll-performance.js), registered in app.config.js, injects the [native build hook](native-src/android/gradle/with-native-scroll-performance.gradle) into generated app/build.gradle. It uses Android's supported [ASM dependency instrumentation API](https://developer.android.com/reference/tools/gradle-api/8.12/com/android/build/api/variant/Instrumentation), before D8/R8, with `InstrumentationScope.ALL`. This survives prebuild and patches the bytecode actually packaged in both phone and TV builds. The hook fails with a review message if the targeted method disappears or changes its descriptor. The original Maven artifact/cache is untouched.

**Controlled result on the connected Poco, active display 120Hz:** both runs visited Preferences, used the same rapid tab sequence, returned to Home, and received the same four 80ms flicks separated by three seconds. App data was retained through `adb install -r`. The final release has the guard enabled and diagnostic labels disabled.

| Metric | Guard disabled, traced control | Guard enabled, normal release |
| --- | --- | --- |
| Delivered cadence while scrolling | **25.5 FPS** | **117.3 FPS** |
| Median presented-frame interval | 41.76ms | 8.35ms |
| p95 presented-frame interval | 50.24ms | 8.50ms |
| Mean native scroll callback | ~18.4ms | **0.701ms** |
| Maximum native scroll callback | 40.3ms | 3.82ms |
| App Deadline Missed frames, full trace | 186 / 245 | 20 / 992 |

FPS uses matched SurfaceFlinger presentation endpoints during active scrolling; stopped-list gaps are excluded using recent native scroll activity. The traces contain ~7.88 and ~8.15 seconds of qualifying moving intervals, respectively. The control includes diagnostic labels, which add overhead, but the prior uninstrumented bad-state trace also showed ~33 FPS and expensive callbacks. The results establish the fix for this reproduction, not a universal 117 FPS guarantee or a solution to every cold mount/navigation stall. Buffer Stuffing remains prevalent in the final trace and indicates residual queue latency even with near-120Hz cadence.

All three freshly built APKs (traced guard, traced control, normal final) have the **same Hermes bundle SHA256**, `42d663c8323466bde9b6b4b690dcea4de5f4960eeaa5929cfef9b916351a3ab9`; the control/final difference is the native guard/tracing configuration. This avoids attributing the result to different JavaScript bundles. Fresh restart-only baselines initially delivered ~117–118 FPS too; those were not treated as proof of the guard. Opening Preferences before the control/final runs made the slowdown reproducible. The conditions that amplify ordinary prop transactions deserve further study, but redundant service queries within them are now removed.

Validation and delivery:

- `:app:assembleRelease` **passes** with default guard enabled and tracing disabled. The final APK was installed successfully, remains non-debuggable, and reports last update **2026-10-09 16:46:27**.
- `:app:verifyVegaNativeAccessibilityGuard` executes the **actual bytecode visitor** against JVM fixtures: all **8 scenarios pass**, covering ordinary views, real guides, existing delegates and the guard-disabled control. Physical TV/TalkBack interaction was not tested; their original native path is retained.
- Config-plugin generation was applied twice and verified idempotent, with exactly one generated block. JavaScript syntax and changed-file whitespace checks pass.
- APK inspection confirms diagnostic `Vega:*` labels are absent from the normal final release. Their opt-in build flag is `-PvegaNativeScrollTracing=true`; `-PvegaNativeAccessibilityGuard=false` is for control experiments only. Normal builds require neither flag.
- The release artifact is `android/app/build/outputs/apk/release/vega-v5.0.2.apk`. No submission, publishing or commit was performed.

Evidence: control native call attribution (local artifact removed during cleanup), control presentation results (local artifact removed during cleanup), final presentation results (local artifact removed during cleanup), final native callback/CPU results (local artifact removed during cleanup), [JVM guard verification task](scripts/verify-native-scroll-guard.gradle), and complete `vega-native-control.perfetto-trace` / `vega-native-final.perfetto-trace` captures.

`EXPO_TV=0` alone does not remove this native implementation: package.json selects react-native-tvos for phone builds too. The measured fix preserves that dependency and guards unnecessary ordinary-view work. Cold provider row mounting and expensive remaining Compose controls are separate follow-up items. The newer section above addresses settings Surface hosts and Downloads focus maintenance; the native guard alone did not fix those costs.

## Loaded Home: flick, release and momentum — sustained ~33 FPS

Tested the Home page the user had already opened, without switching provider, reloading, clearing caches or reinstalling. Injected four short 80ms vertical flicks, alternating direction, with three seconds between gestures to allow momentum after release. Native `topMomentumScrollBegin` events and continued scroll callbacks confirm this exercised inertial scrolling rather than only finger-held dragging. The screenshot before testing showed populated Continue Watching and the Home header; catalog rows still recycle as they enter the viewport even when their data has loaded.

**This reproduces a sustained frame-rate problem, separate from cold provider/tab mounting.** The device reported active 120Hz mode, an 8.33ms SurfaceFlinger period, and no display frame-rate overrides. Joining Vega's display-frame tokens to SurfaceFlinger's ActualTimeline presentation endpoints gave:

| Capture | Mean presented interval | Median | p95 | Mean delivered cadence |
| --- | --- | --- | --- | --- |
| Binder tracing enabled | 28.90ms | 33.39ms | 33.45ms | 34.6 FPS |
| Repeat without Binder tracing | 30.07ms | 33.38ms | 41.72ms | 33.3 FPS |

These use the 0.85–14.8-second interval of each ~15-second trace, covering the flicks and their momentum periods. They describe this scrolling run, not a universal FPS cap. The repeat confirms the low cadence persists without recording individual Binder transactions. App ActualTimeline endpoints measure GPU/post completion; the FPS calculation uses matched **SurfaceFlinger** endpoints instead, following the [FrameTimeline documentation](https://perfetto.dev/docs/data-sources/frametimeline). The earlier preliminary `home-momentum-cadence.csv` uses app endpoints; use `home-momentum*-presentation.csv` for presentation results.

**The dominant cost is native scroll processing, not new content mounts.** In the lighter trace, 903 positive-duration main-thread `ReactScrollView.onScrollChanged` callbacks occupied **12,447ms**, averaging **13.8ms**, maximum **22.7ms**. There were nearly two callbacks per rendered app frame. Native mount dispatch totaled only **27.6ms**, maximum **0.4ms**. Main-thread CPU was **8,088ms**, JS **1,024ms**, RenderThread **2,483ms** across ~14.91 seconds. FrameTimeline marked **446 of 466 app frames** with App Deadline Missed. The callbacks dominate draw/traversal slices because scroll processing runs inside those traversals; these overlapping durations must not be summed.

The Binder-enabled run identifies the mechanism more tightly: **67,248 synchronous Binder calls were direct children of native scroll callbacks**, occupying **8,198ms** of UI-thread wall time. All targeted the same system_server Binder node 10734, transaction code `0x06`, as the rapid-tab UPDATE_PROPS calls. JS scroll-event emission accounted for only **23.4ms** across 940 events. Native mount dispatch totaled **40.7ms** in this run. The persistent system-service round trips are the priority bottleneck for fully loaded momentum scrolling.

At this earlier capture stage, the ReactViewManager TV delegate method was only a candidate. `ReactScrollView.onScrollChanged` wraps the Android superclass call, clipping, Fabric state updates and event handling. **The later instrumented control above now attributes the query to the TV delegate method during Fabric state updates and verifies the native guard.** Link to Windows accessibility remained enabled throughout; its independent contribution was not tested by disabling it.

Next verification should instrument the native scroll segments and service-query call sites in the **actually consumed React Android artifact**, eliminate repeated synchronous queries where semantics allow, then rerun this same momentum test. Success means substantially shorter scroll callbacks and presentation intervals close to the requested refresh cadence, not merely fewer JS rerenders or lower aggregate legacy jank counters. The earlier warm-fling result had short callbacks and does not characterize this latest reproducible device state.

Evidence: Binder-enabled thread/slice analysis (local artifact removed during cleanup), scroll Binder details and momentum events (local artifact removed during cleanup), lighter repeat analysis (local artifact removed during cleanup), presentation cadence (local artifact removed during cleanup), lighter presentation cadence (local artifact removed during cleanup), and reproducible cadence SQL (local artifact removed during cleanup). Both complete local traces are in performance-captures. No application code changed in this investigation.

## Rapid random tab switching — connected release capture

Reproduced using ADB taps across Home, Search, Library, Downloads and Settings on the same installed release. Two ~15-second captures retained the full requested interval. The first issued 20 taps, and the repeat issued 15 taps with a 120ms pause between commands; Android command execution adds overhead, so this is not a measured 120ms end-to-end tap cadence. Screens had already been visited before the repeat. No reload, cache clearing or app installation occurred between these runs.

**The native UI thread accumulates view-prop update batches during rapid switching.** The first run's worst frame lasted **344.1ms**, with **341.7ms** inside mount dispatch. The repeat, with Binder tracing enabled, recorded a **1,010.2ms** frame at ~4.26 seconds. Within that frame, **68 repeated batches of 73 prop-update instructions** occupied **1,004.6ms**; **4,970 synchronous Binder transactions** nested inside the frame occupied **681.9ms**. Nested durations overlap and must not be added together. This directly explains a mechanism for tabs appearing to catch up after taps: the UI thread cannot display the next state while draining this work. Exact tap-to-route latency and each batch's originating React component were not instrumented.

Across the repeat, **17,638 Binder transactions were direct children of native UPDATE_PROPS batches**, totaling **2,561ms** of UI-thread wall time. They all targeted system_server PID 2847, Binder node 10734, transaction code `0x06`. This strengthens the earlier native dependency finding considerably: it is recurring view-update work, not just cold image creation. `react-native-tvos` calls `manageFocusGuideAccessibilityDelegate` after every ReactViewGroup transaction, querying enabled accessibility services before checking whether it is a TV focus guide. That method is a strong source candidate; transaction code alone does not prove its interface. Existing system Binder statistics aggregate Vega under an overflow entry, so they do not provide method attribution.

The repeat recorded **227 app FrameTimeline frames**, **49 with App Deadline Missed**, including 21 also marked Buffer Stuffing. Another 108 had Buffer Stuffing alone. Over ~14.93 seconds, app main-thread CPU totaled **4,985ms**, JS **3,649ms**, and RenderThread **1,087ms**. The first trace also contained a **144.5ms continuous JS CPU run**. JS and native work both contribute; a low-cost static tab icon or disabling transitions does not resolve these long native batches. Binder tracing adds overhead, and the two tap sequences differ, so the 344ms-versus-1,010ms maxima are reproductions, not a performance comparison.

Follow-up priorities:

1. **Fix the native phone-view accessibility query through an effective React Android build.** Guard ordinary non-focus-guide views with no existing TV accessibility delegate before querying services. Preserve delegate cleanup and actual TalkBack/focus-guide behavior. Rebuild or replace the consumed React Android AAR, then repeat this trace and verify the UPDATE_PROPS Binder count falls. Editing unused node_modules Kotlin is insufficient.
2. **Identify why the same 73 prop instructions keep being committed.** Audit tab focus/thaw updates and unchanged props across previously visited screens. `freezeOnBlur` and detaching are enabled, and phone tab animation is already `none`; changing these settings without a controlled experiment is not an established fix. Obtain React/Hermes attribution before choosing memoization or screen-lifetime changes. Tab mount dispatch itself is draining multiple commits in one frame.
3. **Downloads focus scheduling omission — now fixed in the next pass above.** Its previous effect immediately started `syncFromSharedFolder` and `reconcileCompletedDownloadOutputs`, and group counts/focus-node handles could restart both while focused. The new stable, delayed, cancellable maintenance hook separates those jobs from TV focus restoration and bounds reconciliation requests. The original trace did not isolate Downloads maintenance's share of the one-second stall; this remains a code-confirmed scheduling issue rather than a quantified attribution.

Evidence: initial tab analysis (local artifact removed during cleanup), repeat analysis (local artifact removed during cleanup), Binder attribution within prop updates (local artifact removed during cleanup), long-frame breakdown (local artifact removed during cleanup), and `vega-rapid-tabs*.perfetto-trace` in performance-captures. This investigation adds diagnostics only; no new application fix or device improvement is claimed.

## Fast movement after provider change — trace diagnosis

The user confirmed this installed release includes the performance fixes. Extracted APK bundle markers independently confirm the new shared-accent cache, bounded sandbox queue, idle scheduler, catalog query and horizontal interaction keys are present. This validates those JavaScript changes, not every native patch or the later cancellation follow-up.

**Remaining bottleneck: creating and updating native views while the new provider's content arrives.** In the first eight seconds of the provider-selection/immediate-fling trace, a main-thread frame lasted **48.3ms**. Within that frame, pre-mount work took **15.6ms**, actual mount work **14.9ms**, and drawing/traversal another **9ms**. A separate pre-mount burst reached **30.6ms**. The warm-fling trace's worst main-thread frame over its first eight seconds was **17.9ms**. These are native frame work durations, not FPS estimates; the two runs differ in incoming content/cache state.

SurfaceFlinger FrameTimeline recorded **499 app frames** during those first eight seconds after selection: **94 had App Deadline Missed**, including 84 also marked Buffer Stuffing; another 254 had Buffer Stuffing alone. This is distinct from OEM `gfxinfo` aggregate counters. Main-thread CPU consumed **2,877ms**, JS **1,739ms**, and RenderThread **2,127ms** during that eight-second window. The stalls cluster around new content/view work rather than a uniformly slow scroll callback: native vertical scroll callbacks across the full capture averaged ~0.57ms, with a 5.3ms maximum.

Concrete paths to optimize next:

1. **Cold row replacement still mounts large subtrees.** Home assigns different recycle types to loading and loaded rows, while Slider swaps a skeleton subtree for a nested FlatList. Each newly loaded row initially mounts several poster wrappers, images, text and press handlers. The shared shimmer loop reduces animation-loop count but does not remove those native view creation costs. Test keeping the outer row recycle type stable and reducing/coalescing incoming mount bursts during flings. Do not simply delay all content indefinitely or shrink windows until lists show blanks.
2. **Repeated row normalization/reconstruction adds JS work.** Every category publication runs `normalizeHomePosts` across all categories and Home reconstructs all row objects. Slider then deduplicates its posts again. Preserve unchanged row/post references and normalize only changed categories. The trace establishes JS pressure; exact function costs need Hermes sampling rather than inference from thread CPU totals.
3. **Native TV code still runs for ordinary phone views.** Installed `react-native-tvos` ReactViewManager calls `manageFocusGuideAccessibilityDelegate` after every view-prop transaction; that method queries enabled accessibility services before checking whether the view is a TV focus guide. A safe upstream guard would skip ordinary views without an existing focus-guide delegate while preserving TalkBack setup/cleanup. The first mixed trace also showed 4,015 synchronous system-server Binder calls inside 56 scroll callbacks. Matching the precise Binder service requires further attribution; this source mechanism is confirmed, but it is not proven to explain all those calls. Patching node_modules Kotlin alone would not fix an APK consuming a prebuilt React Android AAR.
4. **Cold Compose controls cause a separate, larger navigation stall.** After ~12.6 seconds, this capture included new Expo Compose TextField/Surface/Dropdown views, outside the initial Home-only interval. One TextField creation took **73.6ms**, mount batches reached **228.5ms**, and a UI frame reached **277.7ms**. Treat this as confirmation of the eager-control/navigation finding, not as a Home-scroll measurement. Mount controls in smaller visible batches and avoid constructing offscreen form sections during the transition.

A background `decodeBitmap` slice took **478ms**; it ran on a dispatcher thread. Its caller and image were not identified, so this is not yet attributable to palette extraction or a 478ms UI pause. Concurrent GC similarly does not mean the UI was paused for the entire GC slice.

Evidence: provider initial-window SQL results (local artifact removed during cleanup), provider full trace analysis (local artifact removed during cleanup), warm scroll analysis (local artifact removed during cleanup), and the corresponding local Perfetto traces. Analysis used the [official Perfetto trace processor](https://perfetto.dev/docs/reference/trace-processor-cli).

Capture limitations: the first 32MiB trace retained only ~6.8 seconds; one retry contained no app because it had been closed and the phone was dozing; the next Home capture had no scrolling. These were rejected as controlled fast-scroll evidence. The subsequent ADB fling/provider captures retained ~15 seconds each. Later navigation is explicitly separated above. No new optimization is claimed to have improved this measured release yet.

## Connected release-build capture — 2026-10-09

ADB detected Poco device `23122PCD1I` (`garnet`), Android 16 / API 36. Installed `com.vega` is version 5.0.2, versionCode 200, without the DEBUGGABLE package flag. This confirms a non-debuggable installed build; it does not prove that this APK contains the workspace fixes. Display information reports a 120Hz mode, with 60/90Hz also supported.

After resetting graphics counters and requesting reproduction of Home/drawer/provider/tab/settings interactions, the fresh window recorded **2,752 frames, 228 deadline-missed janky frames (8.28%), p50 16ms, p90 73ms, p95 93ms, and p99 200ms**. GPU p95 was **9ms**. Android also counted 222 slow-UI-thread frames and 141 slow-draw-command frames. These graphics metrics are not equivalent to JS frame durations; the legacy jank percentage uses different accounting and is not the headline metric here.

A simultaneous thread snapshot showed substantial activity on both `mqt_v_js` (~69% of one CPU) and the app main thread (~55%). Memory snapshot: total PSS ~580MiB, RSS ~657MiB, swap PSS ~72MiB. This identifies CPU/UI responsiveness and memory retention as investigation targets; a snapshot does not establish sustained utilization or a leak. GPU timing alone does not explain the long frame tail.

Captured a 30-second Perfetto trace with scheduling, frequency, idle, graphics/view, window/activity and Binder events. Raw artifacts are in performance-captures (local artifact removed during cleanup): baseline/reproduction graphics and memory, thread CPU, and `vega-performance.perfetto-trace`. The graphics counter window extends slightly beyond the trace. No controlled baseline-versus-fixed comparison or JS function attribution has yet been performed. The original audit's “no device attached” statements below describe its earlier collection date/stage.

## Focused second review — 2026-10-09

Found and corrected three missed edge cases in the first implementation:

- Progressive home results were written with a fresh timestamp. TanStack Query retains those manual writes on cancellation, so returning within 60 seconds could leave unfinished rows stuck without refetching. Partial writes now stay stale; only completed loads get the normal freshness timestamp. A real QueryClient mount/cancel/remount test reproduced the failure before the fix and passes afterward.
- Resuming an incomplete cached row incorrectly cleared its loading state merely because the row existed. Pending placeholders now retain their loading state until their category finishes.
- The sandbox timeout handler settled a request while admission was still enabled, which could start a queued invocation immediately before reloading the host. Admission now closes before settling. A staggered timeout test reproduced the unwanted third invocation and verifies that it no longer starts.

Validation for this follow-up: **5 focused suites / 15 tests pass**, and **TypeScript passes**. Earlier full-suite/build results below belong to the first implementation. This was a focused follow-up, not an exhaustive re-audit or an on-device performance measurement.

## Fixes applied — 2026-10-09

The findings below describe the **audit baseline before these changes**. Original line numbers and probes are retained as historical evidence; the application code has now changed. This section records the implementation and outstanding work. Device frame-time improvements remain unmeasured.

| Finding | Status | Resulting behavior |
| --- | --- | --- |
| F1 | Fixed | Provider modules are parsed/indexed once per storage revision. Updates, removal, raw restores and resets invalidate the index; author/default-source selection remains isolated. |
| F2 | Fixed for phones | Home uses structural recycle types and a bounded pool. Horizontal lists have provider/category identities and bounded saved offsets so recycled rows cannot inherit another category's scroll position. TV retains focus-sensitive row identities. |
| F3 | Fixed | Catalog consumers share one scoped query. Two category jobs run at a time and publish independently. Cached rows remain visible while refreshing; warm home data has a 60-second stale window. |
| F4 | Fixed | Abort reaches provider entry points, sandbox admission, host RPC, limiter waiters, Axios and Android OkHttp. Cancelled queued work never starts; late replies, redirects and cookies are ignored. Native HTTP uses a fixed four-thread executor and bounded response bodies. |
| F5 | Burst reduced | Sandbox admits two active invokes, removes cancelled queued frames and preserves host reload recovery on timeout. Fresh worker isolation and the existing transport remain. |
| F6 | Animation burst fixed; list tuning applied | Repeated poster entry animations are removed. Phone Library/Continue Watching lists have smaller initial/batch/window budgets and stable keys. Nested horizontal lists remain virtualized. |
| F7 | Fixed for phones | Phone touch controls bypass TV focus subscriptions, shared values, animated styles and animated-wrapper construction. Phone tab icons render directly; focus is checked at press time. TV keeps its own implementation. |
| F8 | Fixed for audited components | Shared values use compiler-compatible get/set APIs. Provider rows/list, Hero, Preferences, focus guides and mobile touch controls produce CompileSuccess; Home, Slider and the tab bar pass compiler checks too. |
| F9 | Scheduling fixed | Cancellable serial idle work replaces the obsolete InteractionManager assumption. Native navigation/drawer transitions, vertical/horizontal drags, momentum and app background state hold new background jobs. Already-running native work is not claimed to stop automatically when gestures begin. |
| F10 | Animation overlap reduced | Phone tabs have no shift transition or icon worklets. Settings section/header/screen entry and layout animations are removed. Provider selection updates the store after the drawer closes. |
| F11 | Persistence and Surface hosts fixed; eager layout remains | Slider writes are deduplicated and committed on release/background/unmount. Settings cards now use RN Views, with 71% less inclusive Compose measurement in the captured flow. Preferences still has a 153.3ms cold-entry frame; remaining controls and eager page mounting need follow-up. |
| F12 | Redundant work and bitmap cost reduced | Hero rotation/background prefetch pause when hidden, unfocused, backgrounded or drawer/search-active. Palette extraction waits for loaded visible Hero artwork and shares a bounded persistent cache. Palette jobs run serially when idle; Android samples and scales artwork to bounded thumbnails instead of analyzing full posters. Download start uses cached/fallback colors immediately. |
| F13 | Partial | Focus/periodic SAF sync waits for idle, and notification subscriptions skip unchanged download records. Incremental manifest reconciliation and separating volatile progress from durable history remain trace-driven follow-up work. |
| F14 | Deferred experiment | Experimental native commit flags remain unchanged pending release traces and touch/focus compatibility testing. |

### Verification after implementation

- **TypeScript:** `tsc --noEmit` passes.
- **ESLint:** changed TypeScript application/test files have zero errors. Four test warnings concern rejection assertions attached before cancellation and awaited afterward, to prevent unhandled-rejection races.
- **Jest:** 77 root suites / 497 tests pass, excluding the unrelated nested `.kilo` worktree. Five failing suites were also reproduced in that existing checkout: `imdbSuggestions` (outdated expectations), `downloadId` (filename expectation), `IconButton` (missing native MMKV mock), `DownloadBottomSheet` (untransformed navigation ESM), and `App` (unmapped CSS).
- New tests cover warm module reads/invalidation, progressive loading, queued/active cancellation, late RPC/native replies, timeout recovery, serial idle admission, phone controls without TV worklets, and stepped slider commit semantics. Existing provider security/redirect/cookie, backup/reset, TV focus, hero stale-time and download lifecycle tests pass.
- Production-style Android Babel transforms with the installed Expo React Compiler produce **CompileSuccess** for Home, Hero, Slider, provider rows/list, TV/phone focus controls, Preferences and the tab bar.
- Android `:app:compileDebugKotlin` and `:react-native-image-colors:compileDebugKotlin` pass. Generated ProviderHttpModule matches tracked native-src. The image-colors patch preserves existing Java 17/User-Agent/network-timeout compatibility fixes and adds bounded thumbnail decoding, including scaled SVG rendering.
- Whitespace checks pass for application/test/native sources with Windows CRLF handling. The generated patch retains unified-diff context whitespace.

### Release verification still required

Native HTTP/image-color changes require a **new Android APK**; an OTA JavaScript update alone cannot include them. No APK was published or installed, and no device was connected for frame profiling. Debug compilation establishes build compatibility, not release smoothness.

Test a release APK on the Poco and Pixel using the repeatable flows later in this report: cold/warm Home, vertical/horizontal flings, drawer/provider selection, rapid tabs, Preferences/Subtitles sliders, then active downloads and SAF sync. Compare frame-duration percentiles, missed frames, JS long tasks, memory/GC and request counts against the baseline. Use that evidence to prioritize the remaining F11/F13/F14 work.

---

Date: 2026-10-09  
Code baseline: HEAD **96a3078**, with the existing local changes included in the review.  
Scope: Android home scrolling, opening the provider drawer, selecting providers, changing tabs, and opening settings pages. Reports cover the owner's Poco and another user's Pixel; exact models, Android versions, refresh rates, and installed build modes are unknown.

## Assessment

There are several concrete sources of avoidable work remaining after the previous optimizations. The strongest findings are **repeated synchronous parsing of the entire provider code cache**, **home rows configured so FlashList cannot recycle across catalogs**, and **provider requests that fan out without an invocation limit and are not fully cancelled**. These can combine with poster mount animations, phone components allocating TV focus machinery, and eager settings content to consume the frame budget during ordinary interactions.

A lightweight product can still have expensive frames. A provider selection currently changes the screen, parses stored code repeatedly, creates several sandbox workers, transfers large strings, waits for all categories, and then mounts content while the drawer is closing. Improving individual components cannot fully address that scheduling pattern.

The Pixel report makes it especially inappropriate to attribute this solely to an old phone. A faster device can mask some costs, but a Pixel may also have a higher refresh rate and therefore a smaller frame interval. At 60/90/120 Hz the nominal intervals are approximately 16.67/11.11/8.33 ms; the app cannot spend that whole interval on its JavaScript because native work and rendering also need time. These are budgeting considerations, not measurements from either reported phone. React Native distinguishes JavaScript responsiveness from native scrolling/animation performance, and recommends evaluating production performance in release builds. [React Native 0.86 performance guidance](https://reactnative.dev/docs/0.86/performance)

**This audit establishes code mechanisms and reproduces several of them in isolated probes. It does not establish on-device frame times or the percentage of lag attributable to each finding.** No Android device was attached when checked with ADB. The user's release-versus-development build question remains unanswered. Those limits affect the ranking of device impact, not the existence of the confirmed unnecessary work.

## Evidence and review method

- Traced source paths from the reported interactions into navigation, lists, storage, provider execution, image colors, settings controls, downloads, and sync.
- Inspected installed dependency implementations rather than assuming behavior from old React Native/Reanimated advice.
- Ran isolated probes against transpiled repository code or the installed FlashList implementation with controlled mocks. These verify call counts, cancellation behavior, and retention; they are not phone benchmarks.
- Ran production-style Babel transformations with the installed Expo preset and React Compiler diagnostics for key components.
- Checked repository status before writing this report. Existing tests, season components, native download changes, and quick-download files were left untouched. The original audit changed documentation only. Subsequent authorized application changes are described above.

Installed versions observed: React **19.2.3**, React Native aliased to **react-native-tvos 0.86.3-0**, Expo **57.0.10**, Reanimated **4.5.1**, Worklets **0.10.1**, FlashList **2.0.2**, bottom tabs **7.10.1**, Gesture Handler **2.32.0**, and expo-blur **57.0.2**. Hermes and the New Architecture are enabled in app/native configuration; React Compiler is enabled in the Expo experiment configuration. This does not prove which configuration was used for an already-distributed APK.

Evidence labels below:

- **Confirmed:** the mechanism is present in the current source/installed implementation.
- **Probe verified:** an isolated execution reproduced it.
- **Trace required:** its magnitude or importance on the reported phones still needs measurement.

Priorities mean implementation order, not measured severity: **P0** fixes the largest structural multiplication; **P1** removes repeated interaction/mount work; **P2** addresses conditional workloads or controlled native experiments.

## Priority map

| ID | Priority | Finding | Reported flows most affected | Evidence |
| --- | --- | --- | --- | --- |
| F1 | P0 | Full provider code store parsed for each module lookup | Provider switch; cold home; metadata | Probe verified |
| F2 | P0 | Unique FlashList types prevent cross-catalog recycling | Home scrolling; navigation after scrolling | Probe verified |
| F3 | P0 | All catalogs start together; home waits for the slowest; catalog fetched twice | Provider switch; cold home | Fan-out/barrier probe verified; duplicate confirmed |
| F4 | P0 | Cancellation stops workers but not their host HTTP/RPC work | Rapid provider switches; navigating away | Late RPC injection probe verified |
| F5 | P1 | Fresh workers and large string transport amplify provider bursts | Provider switch; background prefetch | Worker count probe verified; device cost unmeasured |
| F6 | P1 | Mobile posters animate every new mount; nested lists still have mount costs | Home/Library scrolling | Confirmed; trace required |
| F7 | P1 | Phone controls allocate TV focus hooks and Reanimated values/styles | Tabs; settings; card-heavy screens | Confirmed; trace required |
| F8 | P1 | Provider rows, Hero, Preferences, and TV focus guide are skipped by React Compiler | Drawer selection/reordering; home; preferences | Compiler diagnostics verified |
| F9 | P1 | Installed InteractionManager no longer waits for interactions | Tabs; hero prefetch; competing work | Installed implementation confirmed |
| F10 | P1 | Navigation overlaps layered settings and SVG animations | Tab changes; first settings visit | Confirmed; trace required |
| F11 | P1 | Settings eagerly mount controls and persist slider ticks | Preferences/subtitles; slider interaction | Confirmed; Compose impact requires trace |
| F12 | P1 | Hero background work and palette extraction are not fully visibility/budget gated | Home scrolling; drawer; cold artwork | Confirmed; trace required |
| F13 | P2 | SAF sync and download subscriptions add whole-history work | Tab focus with SAF; active downloads | Confirmed and conditional |
| F14 | P2 | Native animation commit paths warrant a version-specific A/B test | Drawer and animated scrolling | Shipped defaults inspected; runtime/benefit unverified |

## F1 — Every provider operation can parse all installed provider code

**Locations:** [extensionStorage.ts](src/lib/storage/extensionStorage.ts), lines 316–323; [StorageService.ts](src/lib/storage/StorageService.ts), lines 70–89; [ExtensionManager.ts](src/lib/services/ExtensionManager.ts), lines 469–490; [ProviderManager.ts](src/lib/services/ProviderManager.ts), lines 69–104.

The normal module lookup reads **providerModules** through **mainStorage.getArray**, which calls **getObject**, reads a string synchronously, and runs **JSON.parse**. Only afterwards does it filter for the requested provider and choose the module. The normal ExtensionManager path forwards to that storage lookup; its in-memory test-module cache does not cover ordinary installed providers.

Therefore a posts request for one category can deserialize the source code for every installed provider. Repeat that across categories and hero metadata and the cost is multiplied. MMKV makes storage access fast; it does not make JavaScript deserialization asynchronous or selective. Declaring the surrounding provider method async does not move its synchronous prefix to another thread.

**Probe:** a synthetic ASCII fixture with 30 providers, six module strings per provider, occupied **3,605,331 serialized bytes**. Twelve calls to the actual storage class's module lookup produced **12 full-store parses**, processing **43,263,972 serialized bytes** in total. Storage was mocked to reproduce the repository's JSON parse semantics. This is evidence of amplification, not a claim that real users have a 3.6 MB cache or that this takes a particular number of milliseconds on Hermes.

Provider state adds another source of copying: **getProviderState** JSON-stringifies/parses state before operations, and **saveProviderState** serializes and parses returned state. It is limited to 256 KB, which is useful, but the limit still permits meaningful repeated allocation. Preserve isolation when addressing this; do not remove defensive copying without analyzing mutable state ownership.

**Recommended change:** provide a versioned in-memory module index, loaded once per cache generation, and/or store each provider's code under its own scoped key. Lookup should touch the requested provider, not deserialize unrelated code. Include author/source, provider identity, and version in the design. Explicitly invalidate on install, update, removal, restore, source changes, test-mode changes, and cache clearing. Retain security checks and test-mode freshness behavior.

**Verification:** instrument serialized store size and parse count, without logging provider source. Warm operations should perform zero full-store parses. Check that an update immediately replaces the executing version and that providers with the same value from different authors cannot share code accidentally. Measure the first-load parse separately from warm navigation.

## F2 — Home's recycling type is a unique row identity

**Locations:** [Home.tsx](src/screens/home/Home.tsx), lines 45–53, 170–186, and 265–270; installed FlashList **src/recyclerview/RenderStackManager.ts**, lines 34–36, 178–198, and 235–240.

Home uses **row.key** for both **keyExtractor** and **getItemType**. The comment explicitly uses one type per catalog to retain horizontal scroll position and TV focus. That applies on phones too. A stable item identity and a recycling type serve different purposes: a type identifies interchangeable component structures. Unique types mean a catalog row cannot reuse a different catalog's row tree.

The installed recycler keeps separate pools per type. Its default pool limit is effectively unbounded (**Number.MAX_SAFE_INTEGER**). Previously visited rows can remain in the render stack/pool while they are still in the dataset. Thus initial virtualization avoids building every row at first, but traversing the page can accumulate the very row trees it was intended to avoid retaining.

**Probe against installed FlashList:** visit 20 synthetic rows, engaging two at a time. With a unique type for every row, the final render stack retained **20 keys**. With a shared structural type, it retained **2**. This counts retained row slots, not a measurement of actual React/native view count or memory. Each real retained row owns a horizontal list and its mounted cells, so its downstream cost is considerably more than an empty row slot.

**Recommended change:** on mobile, use structural types such as **catalog** and **loading**, then preserve horizontal offsets explicitly by provider + catalog/filter identity. Reset item-specific state when a recycled row represents another catalog. Decide TV behavior separately rather than preserving all TV constraints on phones. An explicit recycle pool cap is useful as a secondary memory bound, but it does not restore cross-type reuse by itself.

FlashList describes recycling as reuse of a mounted component for another item, and warns about item-specific state. That is the constraint to address when retaining offsets/focus. [FlashList recycling guidance](https://shopify.github.io/flash-list/docs/recycling/)

**Verification:** compare retained row/card counts and memory before and after repeated full-page traversal, then return to the top. Test horizontal positions independently per provider, reorder/filter changes, and TV D-pad focus. Verify that recycled poster state and navigation targets match the new item.

## F3 — Provider selection launches a burst, then publishes the whole home at once

**Locations:** [getHomepagedata.ts](src/lib/getHomepagedata.ts), lines 19–31 and 59–98; [Home.tsx](src/screens/home/Home.tsx), lines 145–166 and 170–186; [useHomePageData.ts](src/lib/hooks/useHomePageData.ts), lines 22–63; [ProviderDrawer.tsx](src/components/ProviderDrawer.tsx), lines 167–175; [Settings.tsx](src/screens/settings/Settings.tsx), lines 169–180.

The home fetch maps every catalog to a posts promise immediately, then awaits **Promise.allSettled** before returning any rows. Partial failure handling is good, but it is not progressive delivery. A single slow category delays all successful categories from this query. Completion then replaces loading rows with content rows and delivers a relatively large reconciliation/mount batch.

**Probe:** with eight mocked categories and manually controlled promises, all **eight getPosts calls** started before any completed. After seven completed, home data was still unpublished. It was published only after the eighth settled.

Home also independently invokes **getCatalog** to discover the skeleton layout while the home query invokes it for data. On an uncached provider switch this gives two catalog executions for the same purpose. The skeleton effect uses only a local cancelled flag; it does not cancel the underlying operation.

The home query sets **staleTime: 0**, **refetchOnMount: 'always'**, and **refetchOnReconnect: 'always'**. Cached content can display quickly, but eligible mounts/reconnections still trigger background work. Initial disk-cache loading parses JSON synchronously, and the data effect synchronously stringifies the full home data back to storage. An effect runs after rendering; it still occupies the JavaScript thread. Already-mounted tab focus is not automatically a mount, so this finding does not imply a refetch on every warm tab press.

On phone selection, the drawer calls **setProvider(item)** and immediately closes. Settings does a similar provider change followed by navigation. Work starts at the same time the interaction needs a clean visual transition.

**Recommended change:** share one scoped catalog query/cache for both layout and content. Give first-visible categories priority and publish them independently; schedule the remaining categories through a bounded provider invocation queue. A concurrency of two is a reasonable experimental starting point, not a universal optimal number. Reassess stale policy with a product-appropriate freshness interval and explicit refresh. Coalesce/delay home cache serialization away from transitions, avoiding obsolete provider writes.

Show immediate selection feedback and a cheap content shell/cached rows. Where desirable, commit a pending selection after the real drawer transition completes. Do not replace this with arbitrary fixed sleeps: gestures can be interrupted, and cached content should not wait unnecessarily. Cancellation and ordering are required whichever transition sequence is chosen.

**Verification:** record selection-to-drawer-response time, selection-to-first-useful-row time, maximum simultaneous invokes, and the largest JS tasks. Inject one slow category: fast categories should still become usable. Rapidly select A → B → C and verify C owns the displayed data/cache writes.

## F4 — Cancelling an invocation does not cancel its host RPC/HTTP work

**Locations:** [sandboxBridge.ts](src/lib/sandbox/sandboxBridge.ts), lines 167–193 and 240–264; [providerFetch.ts](src/lib/sandbox/providerFetch.ts), lines 111–119 and 147–172; [rateLimiter.ts](src/lib/sandbox/rateLimiter.ts), around line 154; [getHomepagedata.ts](src/lib/getHomepagedata.ts), lines 19–21; [useHomePageData.ts](src/lib/hooks/useHomePageData.ts), lines 147–193 and 312–346.

Invocation abort terminates the worker and settles the pending invocation. However, **handleProviderRpc** receives no invocation cancellation signal. Once host work is started, its promise completion still calls **post(rpc-result)** without checking whether the invocation is pending. Native fetch and rate-limiter acquisition are not tied to that invocation's cancellation.

The sandbox document ignores a response for a missing worker, which protects result routing, but it cannot recover the already-spent native HTTP, rate-limit queue, JSON serialization, and injection work. With rapid provider switching, discarded providers can continue competing with the chosen provider.

**Probe:** invoke through the actual bridge, begin a deferred fake fetch RPC, abort the invocation, then resolve the fetch. The injector received **one further rpc-result after abort**. This demonstrates late work; it does not measure network bytes or duration on a phone.

The initial home catalog request omits the query signal. Hero metadata query/prefetch paths likewise do not forward a query cancellation signal to their provider call. Hero prefetch cleanup prevents subsequent loop iterations, but does not stop a request already underway.

**Recommended change:** propagate an invocation cancellation token through RPC dispatch, limiter acquisition, and native HTTP. Remove cancelled queued jobs, cancel the associated native OkHttp call where supported, and check liveness after awaits before processing or posting large results. Forward query signals for catalog and metadata as well as posts. Preserve host validation, redirect/size limits, and cookies. Cancellation should be a non-retryable outcome, not an empty successful response that later repopulates data.

**Verification:** obsolete invocations must produce no subsequent expensive payload injection, no outstanding limiter slots, and no result/state/cache changes for the selected provider. Include abort before acquiring a slot, abort during native fetch, timeout, reconnect, and navigating away.

## F5 — The sandbox is off the RN JS runtime, but its scheduling and transport still matter

**Locations:** [sandboxDocument.ts](src/lib/sandbox/runtime/sandboxDocument.ts), lines 49–89 and 95–150; [sandboxWorker.ts](src/lib/sandbox/runtime/sandboxWorker.ts), lines 260–286 and 384–398; [sandboxBridge.ts](src/lib/sandbox/sandboxBridge.ts), lines 80–84 and 256–264; [providerFetch.ts](src/lib/sandbox/providerFetch.ts), lines 147–172; [rateLimiter.ts](src/lib/sandbox/rateLimiter.ts), lines 35–41.

A fresh worker/realm is created for each invocation and terminated afterwards. One never-used worker is prewarmed. The next warm worker is created as the current one is taken, so an eight-category burst can allocate eight executing workers plus one warm worker. Provider code is sent with each invoke and compiled with **new Function** in the worker. State/results also undergo JSON cloning.

**Probe using the actual document dispatcher with mock Worker objects:** eight invokes spawned **nine workers** including the replacement warm worker. Cancelling the eight invoked tokens terminated eight; one unused warm worker remained. This is intentional fresh-realm isolation, but demonstrates why unrestricted concurrency is expensive.

Host-to-sandbox posting JSON-stringifies the message, scans for line separators, then JSON-stringifies the frame for safe script injection. On Android the normal provider HTTP path is already native; do not blame the slower fallback JavaScript base64 encoder as if it handles every Android request. Native HTTP still returns a base64 body that travels through host serialization/injection and worker decoding. Large HTML and module strings therefore create transport/allocation costs even when scraping is off the RN runtime.

HTTP limits (12 per host, 48 total in the inspected limiter) are not a provider worker or CPU budget. They do not prevent many workers from being created or parsing simultaneously. The generated sandbox runtime TypeScript file is about 449 KB; that file size is not a measurement of per-worker compiled bytes, bridge traffic, or memory.

**Recommended change:** bound and prioritize invocations, keep one safe unused warm worker, and avoid launching decorative metadata/background categories during gestures. If transport remains large in traces, consider a trusted document-side code cache keyed by author/provider/version/content identity while continuing to give each invocation a fresh execution realm. Optimize HTTP payload transport only with size/timing evidence and equivalent security guarantees.

**Do not pool workers after they have executed arbitrary provider code, run providers inside Hermes, or remove the hidden sandbox to obtain an apparent speedup.** Those choices would change the isolation model. First remove repeated host parsing and unwanted concurrency.

**Verification:** capture active/queued workers, invoke payload lengths, HTTP body lengths, host serialization duration, worker startup duration, and parsing CPU. Compare visible-content priority against bulk background loading; retain timeout and runaway-loop protection.

## F6 — Poster mounts animate during scrolling; nested list budgets remain relevant

**Locations:** [MediaPosterCard.tsx](src/components/MediaPosterCard.tsx), lines 76 and 168–175; [Slider.tsx](src/components/Slider.tsx), lines 190–209; [ContinueWatching.tsx](src/components/ContinueWatching.tsx), lines 325–346; [Library.tsx](src/screens/Library.tsx), lines 645–690.

Mobile poster cards use **FadeInDown.duration(280)** for new mounts. Memoization/compiler caching can avoid some updates but cannot eliminate initial cell mounts, native layout, image setup, or entering animations. While scrolling brings in additional cells, their animations run alongside list layout and image delivery. Cells mounted in an offscreen buffer can animate before becoming visible, still spending resources.

Catalog horizontal FlatLists already use a reduced **windowSize: 5**, batch size eight, and an initial count based on the screen width. That is an existing improvement. They still explicitly keep **removeClippedSubviews: false** and lack an exact item-layout shortcut. Continue Watching has a separate horizontal FlatList without those tighter initial/window settings, and its cards request image accents. Library also has its own list settings and keys combining the media link with its array index, so moving an item changes its key and causes an unnecessary remount.

The most urgent list issue is F2. Tuning nested windows while retaining a separate row tree per visited catalog will not solve that structural problem.

**Recommended change:** omit mobile per-cell entering animations during ordinary list population, or limit them to a small initial reveal. Set intentional viewport budgets for Continue Watching and other lists. Use stable media identities for Library keys. For mixed-width poster cards, calculate exact prefix offsets including separators if using **getItemLayout**; a guessed uniform width would cause incorrect scrolling. Alternatively evaluate measured horizontal FlashList after correcting row recycling. Preserve TV focus and card accessibility.

**Verification:** A/B-test entering animations independently from recycling. Measure mounts, memory, blank areas, and missed frames during horizontal and vertical flings. Avoid shrinking windows so far that a fast fling exposes empty content. FlatList's configuration involves a responsiveness/memory/blank-area tradeoff. [React Native FlatList configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration)

## F7 — Phone controls execute TV hooks before choosing their mobile branch

**Locations:** [TVFocusable.tsx](src/components/tv/TVFocusable.tsx), lines 87–114 and 159–174; [useTVNavFocusMemory.ts](src/lib/tv/useTVNavFocusMemory.ts), lines 58–63; [useTVFocusBorderColor.ts](src/lib/tv/useTVFocusBorderColor.ts), lines 41–42; [MediaPosterCard.tsx](src/components/MediaPosterCard.tsx), lines 107–125; [SettingsRow.tsx](src/components/ui/SettingsRow.tsx), around line 38; [Settings.tsx](src/screens/settings/Settings.tsx), lines 36–53.

**TVFocusable** allocates navigation-focus handling, TV focus-color store subscriptions, focus memory, shared values, and animated styles before returning a normal **TouchableOpacity** on phones. Its mobile early return is too late to avoid that hook machinery. Every mounted control pays some setup cost even when it never uses a focus ring.

Poster cards and settings rows also call the navigation focus hook on phones. That is an explicit subscription per instance; focus changes can propagate through many mounted cells despite React.memo. Settings provider items compute native node handles from layout without a phone guard. Several hero/control handle paths similarly exist for TV behavior but execute on phones.

This is not evidence that phone controls continuously animate. Unchanging worklets may remain idle. Nor are TV remote listeners indiscriminately registered: the inspected remote hook correctly guards them on non-TV devices. The issue is unnecessary initial setup, subscription count, and transition-triggered work.

**Recommended change:** choose separate **MobileFocusable** and **TVFocusableImpl** components before running their respective hooks. Keep the TV implementation intact. Lift screen-level focus decisions where possible instead of subscribing every poster solely to disable TV focus. Preserve any mobile tap correctness that currently depends on focus; removing a guard blindly could enable hidden/outgoing screens to receive presses.

**Verification:** count navigation-focus subscriptions, shared values/animated mapper registrations, native handle updates, and component renders on first and warm tab changes. Test mobile press routing and TV focus restoration, including modals, disabled buttons, and outgoing screens.

## F8 — React Compiler skips important drawer, home, and settings components

**Locations:** [ReorderableProviderList.tsx](src/components/ReorderableProviderList.tsx), lines 38–108 and 134–239; [TVFocusable.tsx](src/components/tv/TVFocusable.tsx), around lines 247–265; [Hero.tsx](src/components/Hero.tsx), lines 221 and 287–316; [Preference.tsx](src/screens/settings/Preference.tsx), lines 27 and 281–300.

The production-style compiler probe successfully compiled Home, Slider, MediaPosterCard, ProviderDrawer, the main TVFocusable, Settings, SubtitleSettings, SettingsSliderRow, the tab bar/icons, Continue Watching, and Library. Therefore a blanket diagnosis that the app has no memoization would be wrong.

However, both **ReorderableProviderList** and **ProviderRow** produced compiler errors about modifying values considered immutable, tied to shared-value **.value** writes. **TVFocusGuide** produced an error about accessing refs during render. These components are skipped by the automatic optimization. ReorderableProviderList and ProviderRow also lack explicit React.memo protection. An outer compiled ProviderDrawer does not make a skipped child automatically memoized when its props change.

The main **Hero** component also produced immutability errors for **dragX** writes in its swipe handlers. Its manual memo wrapper still helps unchanged props, but cannot suppress its own focus/rotation/color/handle state changes. **Preferences** was skipped because its inline telemetry handler uses logical value blocks inside try/catch (the first reported construct is at line 286). That handler is infrequently used, but the unsupported construct prevents the whole component from receiving the automatic transform. This is an optimization coverage gap, not proof that either component dominates frame time.

The drawer is mounted even while closed on mobile. It subscribes to the whole content store and eagerly maps installed providers in a ScrollView. Each provider row sets up pan and tap gestures, a shared value, and animated styles. Provider selection, installed-list updates, and local drag state can reconcile the skipped list/row components and recreate gestures. The cost grows with installed provider count; with a very small list its impact may be minor. The successful outer compiler transform caches the list JSX when its inputs are unchanged, so opening an otherwise unchanged drawer alone is not established as a full row rerender. Warm drawer animation also needs the native-path investigation in F14.

**Recommended change:** make shared-value access compatible with the compiler using Reanimated's **get()/set()** APIs, then re-run compiler diagnostics. Reanimated explicitly documents this requirement for React Compiler. [Reanimated shared-value compiler guidance](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/)

Give skipped rows explicit memoization and stable selection/drop/layout callbacks as a fallback. Use narrow content-store selectors rather than **state => state**. Split the mobile plain-view focus guide from the TV implementation; resolve TV destinations through lifecycle/events instead of reading refs in render. Consider virtualization for a long provider list, accounting for drag behavior rather than removing reorder functionality.

Apply compiler-compatible shared-value access to Hero's swipe handlers too. Move the guarded Firebase side effects to a helper outside the Preferences component, preserving opt-in behavior and error handling, then verify the component compiles. Fixing compiler coverage supplements the mount/visibility changes; it does not remove native image/layout costs.

**Verification:** no compiler skips in these components, unchanged provider rows do not render during drawer visibility changes, and selection updates only the relevant row state. Drag reorder, cancellation, long press/tap exclusivity, installed-provider updates mid-drag, and selected-state persistence must still work. Compiler success alone is not a frame-rate measurement.

## F9 — The installed InteractionManager is a stub

**Locations:** installed React Native **Libraries/Interaction/InteractionManager.js**, lines 87–109; [AnimatedTabIcon.tsx](src/components/navigation/AnimatedTabIcon.tsx), lines 45–55; [useHomePageData.ts](src/lib/hooks/useHomePageData.ts), lines 312–346.

In this installed React Native version, **runAfterInteractions** schedules through **setImmediate**. It does not track touch/animation completion. Consequently code that looks deferred until the UI is idle is not protected from a drawer gesture, tab transition, or scrolling.

The tab icon schedules a 700 ms draw animation with this API, so it starts at the transition rather than reliably after it. Hero prefetch adds a one-second timer, but that is only a delay. Once its sequential loop has started, further requests can begin during later gestures; its paused state is not part of the prefetch effect's gating.

**Recommended change:** use actual navigation/drawer transition completion, app/screen visibility, touch/drag/momentum state, and a cancellable low-priority queue. Budget small JavaScript chunks with **requestIdleCallback** where supported, but do not assume that JS idle means native rendering is idle. Prioritize input and visible rows over metadata, storage serialization, updates, and palette extraction.

**Verification:** background work remains paused during a sustained gesture, resumes after the actual end, and stops on provider/screen changes. Exercise interrupted transitions and repeated gestures longer than the current one-second timer.

## F10 — Settings and tab transitions stack decorative animations

**Locations:** [App.tsx](src/App.tsx), lines 220–225 and 422–443; [Settings.tsx](src/screens/settings/Settings.tsx), lines 138–151 and 313–478; [AnimatedTabIcon.tsx](src/components/navigation/AnimatedTabIcon.tsx), lines 35–75; [AnimatedTabIconParts.tsx](src/components/navigation/AnimatedTabIconParts.tsx), around lines 30 and 72.

Tabs use **animation: 'shift'**. The installed bottom-tab view uses the native driver for that animation, and the outgoing screen remains transitioning until it becomes inactive/frozen. Freeze/detach are helpful, but are not a guarantee that only one scene is active during a transition. First visits also lazily mount the destination screen.

Settings adds a screen-level spring entering animation, a separate heading entrance, and delayed section entrances/layout springs. Section delays extend to 400 ms. This work overlaps the tab/stack transition and control creation, so one navigation action can involve several independently animated layers. These entrances primarily affect mounts, not every subsequent focus of an already-mounted settings screen.

The custom tab icons keep filled and outline SVG groups mounted and animate group opacity plus path/circle stroke offsets. Across the five icon definitions there are 14 outline animated path/circle components and ten animated groups. These counts describe allocated components, not 24 animations continuously running. On a switch, the active icon draw runs for 700 ms alongside scene changes.

**Recommended change:** retain a simple navigation transition, remove delayed section/layout entrances during settings mount, and compare static tab icons or a single inexpensive opacity change. A/B-test the tab scene transition separately to identify whether it contributes. Native stack navigation is already present; replacing it is not the first fix. Shortening animation duration can change feel, but does not reduce synchronous mount work by itself.

**Verification:** compare cold and warm tab changes with icons/section entrances independently disabled. Trace UI/render-thread work and React commits, not only JS FPS. Ensure reduced-motion behavior and touch hit areas remain correct.

## F11 — Settings eagerly mount content, and slider ticks persist immediately

**Locations:** [Preference.tsx](src/screens/settings/Preference.tsx), line 141 onward; [SubtitleSettings.tsx](src/screens/settings/SubtitleSettings.tsx), line 244 onward and lines 421–557; [SettingsSliderRow.tsx](src/components/ui/SettingsSliderRow.tsx), lines 71–89 and 210–230; [BufferPreference.tsx](src/screens/settings/components/BufferPreference.tsx), lines 42–70; [DownloadConcurrencyPreference.tsx](src/screens/settings/components/DownloadConcurrencyPreference.tsx), lines 42–58; [downloadManager.ts](src/lib/downloadManager.ts), lines 596–598; [Extensions.tsx](src/screens/settings/Extensions.tsx), lines 165–206 and 710–746.

Preferences uses a ScrollView for roughly 19 switch rows depending on conditions, plus several slider/control sections. Subtitle settings likewise mounts the whole page. On phones each SettingsSliderRow creates an **@expo/ui Jetpack Compose Host** with vertical match-content measurement. Subtitle settings can create five slider hosts; Preferences includes two buffer hosts and concurrency/connections controls. The ordinary switch rows use React Native switches, so this is not a claim that every settings row embeds Compose.

These hosts add native composition/measurement boundaries to an already eager page mount. Their actual contribution requires a trace; there is no basis to declare Compose universally slow. Long extension/provider lists also map all entries in ScrollViews. The Extensions screen loads/publishes provider arrays on mount, which can wake the drawer's whole-store subscription.

During slider changes, SettingsSliderRow rounds to a step and suppresses repeated haptics, but **always calls onValueChange**, even when the rounded value has not changed. Buffer/subtitle handlers write settings on each callback; subtitle handlers also update screen-level state. Download concurrency similarly always persists and calls the queue scheduler. An end-of-interaction callback exists, but these callers do not use it for committing persistent changes.

**Recommended change:** return early for unchanged effective values, maintain a local draft while dragging, and commit storage/queue changes on finish. If live preview is needed, isolate the preview and throttle its updates independently. Specify how interruption/backgrounding saves a draft and how immediate TV button increments commit. Prefer virtualization for genuinely long provider/extension/preference lists; measure before replacing a small static settings page. Reduce first-frame content to what must be visible where native host mounting proves expensive.

The compiler successfully compiled SubtitleSettings and SettingsSliderRow, so this report does not assume every child native subtree is rebuilt on each parent render. Preferences itself is skipped (F8), and its many non-lazy useState initializer expressions read settings again when the component renders; use lazy initialization for mount-only reads. The synchronous writes and scheduler calls still occur regardless of memoization.

**Verification:** holding/dragging within one quantized step should produce no redundant writes or queue scheduling. A complete drag should have a bounded preview update rate and one committed setting change where appropriate. Compare first-frame mount cost and final-state correctness when leaving the page mid-gesture.

## F12 — Hero visibility and image palette work need a shared budget

**Locations:** [Hero.tsx](src/components/Hero.tsx), lines 78–109, 277–281, 445–453, and 491–551; [useHomePageData.ts](src/lib/hooks/useHomePageData.ts), lines 301–346; [imageAccent.ts](src/lib/imageAccent.ts), lines 100–150 and 164–174; [ContinueWatching.tsx](src/components/ContinueWatching.tsx), around line 47; installed image-colors Android **ImageColorsModule.kt**, lines 39, 47–65, 107–108, and 142–189.

Hero rotation pauses for search, loss of screen focus, and backgrounding. It does **not** pause because the drawer is open or the user has scrolled the hero offscreen. Rotation can therefore replace artwork and run fades while attention is elsewhere. Metadata prefetch is gated by first-query completion, but not by that paused state. The first/active metadata queries share a React Query key when they represent the same item, so do not count them as guaranteed duplicate network requests.

Hero artwork includes a blurred image (**blurRadius: 18** in the poster path), gradient, sharp artwork, and animated image/title replacements. This is separate from expo-blur: the installed expo-blur default is **blurMethod: 'none'** on Android, and the poster tag BlurViews do not request live blur. Therefore live Android BlurView rendering should not be blamed as a confirmed poster-list bottleneck. Extra view layering and the hero's real image blur remain candidates for tracing.

Hero starts native color extraction after image load using **hero-accent-v2** cache keys. Other cards use the shared image-accent service with different keys and persistent MMKV caching. The same URI can therefore be processed separately. Native image-colors runs on **Dispatchers.IO**, not the Android main thread, but opens a separate URLConnection and decodes a bitmap independently of the React Native image cache path. Remote images use fixed **inSampleSize: 2**; local/content images have no corresponding decode downsampling here. Average-color calculation allocates an integer buffer proportional to image height, and palette generation follows.

**pixelSpacing: 8** reduces average-color sampling work; it does not bound downloaded bytes or bitmap decoding dimensions. Several cold extractions can compete for CPU/memory and issue extra image downloads while scrolling. The shared service's 3.5-second Promise.race stops waiting for a result; it does not cancel the native extraction. Its URI promise cache also has no explicit size bound.

**Recommended change:** pause rotation/prefetch when the hero is not viewable or a drawer/overlay interaction obscures it. Share one scoped persistent extraction service for hero/cards, with distinct final color mixing if desired. Process only a small decoded thumbnail (for example around 64 px, to be evaluated for color quality), limit extractions to one low-priority job at a time, and use the theme fallback while busy. Bound the in-memory cache and clear timeout resources when completed. Cancellation must exist natively to stop native work; a JavaScript timeout is insufficient.

**Verification:** test warm and cold image/color caches separately. Count extractions and bytes for the same URI across surfaces; hero offscreen/drawer-open periods should cause no decorative rotation work. Trace native decode/CPU/memory during flings, and test local download artwork as well as remote images. If image blur is expensive, compare a pre-sized/pre-blurred asset or simpler hero background without changing all poster behavior.

## F13 — Background sync and downloads can add conditional contention

**Locations:** [Home.tsx](src/screens/home/Home.tsx), lines 105–110; [Library.tsx](src/screens/Library.tsx), lines 180–185; [App.tsx](src/App.tsx), lines 494–542; [syncService.ts](src/lib/sync/syncService.ts), lines 223–235 and 613–694; [downloadsStore.ts](src/lib/zustand/downloadsStore.ts), lines 293–361, 400–423, and 559–560; [downloadManager.ts](src/lib/downloadManager.ts), lines 142–148 and 318–329.

Home/Library focus requests shared-folder sync, alongside the app's initialization/foreground/30-second paths. With a SAF shared folder configured, sync reads manifests, resolves remote paths, merges state, applies storage/state updates, and publishes a manifest. Building a manifest advances revision and writes storage. There is no inexpensive revision/dirty check that universally skips unchanged work before these operations.

This is **conditional**: runSharedFolderSync returns early without a SAF download location, and an in-flight request is already deduplicated. It cannot explain every idle user's lag by itself. Continue-watching history merging and download-change subscription scanning are registered separately and still have local-state work.

Download progress is already throttled, and persistence is coalesced to about one second for progress-only changes. Remaining work includes copying the downloads map, building a status signature over all records, checking completed/removal state, and serializing the persisted download history at checkpoints. Each active download also registers a whole-store notification subscriber; one record update wakes all such subscribers, although notification sending itself is throttled. With A active downloads, frequent updates can cause roughly A-by-A callback checking in addition to history-size-dependent work.

**Recommended change:** separate volatile progress from durable metadata/history, checkpoint changed records rather than serializing all history where the storage design permits, and use a single notification coordinator or record selectors. Retain process-death recovery, foreground flushes, and completion/error persistence. For SAF, defer focus sync until the navigation transition is clear and add dirty/revision checks before unnecessary writes/publications. Scope subscriptions to the work they need, while preserving local playback history even without SAF.

**Verification:** compare no downloads/SAF disabled, active downloads, large completed history, and SAF enabled. Record JS event rate, serialized bytes, sync publications, and store renders. Do not rank this above F1–F4 unless the device trace shows the user actually has these workloads active.

## F14 — Native commit-path experiments must match the installed versions

**Locations:** installed Reanimated **src/featureFlags/staticFlags.json**, lines 3–12; installed React Native **ReactCommon/react/featureflags/ReactNativeFeatureFlagsDefaults.h**, around lines 302–303; [MainApplication.kt](android/app/src/main/java/com/vega/MainApplication.kt), lines 46–50; installed drawer-layout **src/views/Drawer.native.tsx**, around lines 347–354 and 384–387.

Inspected Reanimated defaults already set **USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS: true**. Advising the app to enable that flag would not fix a missing default. **ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS** and **DISABLE_COMMIT_PAUSING_MECHANISM** are false in the inspected defaults, and the RN default for **preventShadowTreeCommitExhaustion** is false. Repository configuration inspection did not establish a custom override; the flags in a distributed binary still need runtime/build verification.

A controlled test of the Android non-layout UI-props fast path may help animated components after structural work is reduced. The current drawer implementation also deliberately changes zIndex during animation to force commit behavior, so the outcome cannot be assumed from transforms alone.

Reanimated documents touch-routing tradeoffs for the synchronous props path, particularly transformed React Native Pressables. Disabling commit pausing is documented as safe only with the corresponding RN exhaustion-prevention flag, which may require building RN from source. Use a native rebuild and matched, persisted configuration; do not enable an entire experimental RN release level to obtain one flag. [Reanimated feature-flag requirements and limitations](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)

**Recommended change:** keep this as an independently benchmarked native experiment. First verify actual build flags, then test one configuration at a time on both phone classes with the TV fork and navigation/gesture versions in use. Do not disable the New Architecture or change frameworks as a speculative first response.

**Verification:** compare commit duration and deadline misses in a release APK, plus press routing during/after transforms, drawer drags, layout/entering animations, and TV focus. A faster artificial animation benchmark is not evidence of an equivalent app-wide gain.

## Existing improvements that should be preserved

The previous work addressed real problems. This review found the following useful measures already present:

- Navigator objects are at module scope; native screens/freeze and inactive-screen detachment are enabled.
- Home uses a vertical FlashList; row callbacks and important card/row components have memoization/compiler support. Its initial virtualization is useful despite F2.
- Hero metadata has a ten-minute stale window and sequential prefetch. The remaining issue is scheduling/visibility/cancellation, not a blanket absence of caching.
- Skeleton shimmer shares a loop rather than starting one independent loop per skeleton item.
- Ordinary poster images use resize behavior; the separate palette decoder is the path with weaker size bounds.
- Provider HTTP has a native Android fast path. The bridge already removed an older extra base64 framing pass.
- App foreground sync has one shared app-state listener/timer, and in-flight shared-folder sync is deduplicated.
- Download progress and storage/notifications have rate limits; they should not regress to writes per native byte-progress event.
- Logging is batched and detailed logging is gated. Normal release logging is not established as the leading cause here; detailed diagnostic logging should be off for baseline frame tests.
- Theme palette computation is memoized around its actual inputs. Image card accents are not automatically global theme changes.

Home's onScroll calls two boolean setters at a 16 ms event throttle, but their values usually stay unchanged and React can bail out. That is not adequate evidence of a render on every scroll event. Similarly, native navigation and Reanimated do not mean all animation frames are driven by JavaScript. The costs need to be attributed to the appropriate thread.

## Isolated diagnostic results

These probes used the installed TypeScript transpiler and Node's VM to execute actual modules with controlled storage/provider/worker mocks. VM/Node timing is deliberately omitted: it does not model Hermes, Android WebView, native rendering, or either phone.

| Probe | Controlled setup | Observed result | What it establishes |
| --- | --- | --- | --- |
| Provider module lookup | 30 synthetic providers × 6 code strings; 12 lookups; storage performs the same JSON parse as StorageService | 12 full-store parses; 3,605,331 bytes per parse; 43,263,972 total bytes processed | Work grows with all stored code and invocation count |
| Home request barrier | Eight categories; posts calls manually resolved one by one | Eight requests start immediately; no home result after seven complete | Unbounded category fan-out and aggregate publication barrier |
| Aborted RPC | Deferred RPC through SandboxBridge, followed by abort and RPC resolution | One injected rpc-result after abort | Host completion work outlives the invoking worker |
| FlashList recycling | Installed RenderStackManager; 20 stable rows; two engaged per step | Unique types retain 20 keys; shared type retains 2 | Unique row types prevent cross-row reuse and retain visited slots |
| Sandbox worker lifecycle | Actual document dispatcher; eight invokes; mock Worker/timeout; cancel all tokens | Nine spawned, eight terminated | One worker per invoke plus one unused prewarmed replacement |

Compiler probes used **babel-preset-expo**, **jsxImportSource: nativewind**, the Reanimated plugin, production mode, and a Metro-style Android/Hermes caller with **supportsReactCompiler: true**. That flag is essential: a caller without compiler support would not model the intended Expo transform. This validates local transform behavior, not the transform used to build a particular user's APK.

| Components tested | Result |
| --- | --- |
| Home; Slider and its item/separator; MediaPosterCard; ProviderDrawer | CompileSuccess |
| Main TVFocusable; Settings provider item/AnimatedSection/Settings | CompileSuccess |
| SubtitleSettings; SettingsSliderRow | CompileSuccess |
| AnimatedTabIcon and icon parts; StreamingTabBar; ContinueWatching; Library; SettingsRow; DownloadConcurrencyPreference | CompileSuccess |
| ReorderableProviderList; ProviderRow | CompileError: modification of immutable values; skipped |
| TVFocusGuide | CompileError: ref access during render; skipped |
| Main Hero | CompileError: dragX modification after passing it to hooks; skipped |
| Preferences | CompileError: logical value blocks within try/catch in inline telemetry handler; skipped |

To reproduce the structural checks, load/transpile the named module in isolation, supply mocks at the module's storage/provider/RPC boundary, and assert the counts above. For the FlashList check, call RenderStackManager.sync with stable row IDs, two engaged indices at a time, and alternate unique-versus-shared type functions. For the cancellation check, allow an RPC to enter its host promise before aborting. Aborting before dispatch would miss the bug.

## Recommended implementation sequence

1. **Establish a release-device baseline and add lightweight counters.** Separate cold mounts, warm navigation, cache loading, and provider network waiting. Capture frames before changing several variables.
2. **Remove structural amplification:** versioned provider code lookup (F1), mobile structural row recycling with offset preservation (F2), shared catalog/progressive home delivery and bounded invocation scheduling (F3/F5), end-to-end cancellation (F4).
3. **Make phone mount paths cheaper:** split mobile/TV implementations (F7), fix skipped drawer/Hero/Preferences compilation and stabilize row props (F8), remove per-poster entries and layered settings entrances (F6/F10).
4. **Keep secondary work out of interactions:** replace stub-based deferral with lifecycle/gesture-aware scheduling (F9), pause invisible hero work and share bounded palette extraction (F12), commit settings changes intentionally (F11).
5. **Address demonstrated conditional costs:** large histories/active downloads/SAF sync (F13), then controlled native commit-path tests (F14).

Make each batch independently measurable. Adding more React.memo, decreasing every animation duration, increasing request concurrency, or changing list libraries without correcting the workload boundaries would leave several confirmed causes in place.

## Device profiling and acceptance plan

### Build and environment

Use a production release APK with Hermes and the intended minification/configuration. Record APK version/hash, exact model, Android version, refresh rate, power mode, thermal condition, provider count/module-store byte size, home row count, download-history count, and whether SAF sync/downloads/detailed logging are active. Test the reported Poco and Pixel first; also retain a representative older midrange phone as the lower bound. Do not compare a developer build against another app's release build.

Use Android System Tracing/Perfetto for scheduling and rendering evidence, with FrameTimeline where the OS supports it. Android's on-device tracing guide explains collection. [Android system trace collection](https://developer.android.com/topic/performance/tracing/on-device)

### Reproduction matrix

| Scenario | Cold case | Warm case | Required stress variant |
| --- | --- | --- | --- |
| Home vertical scroll | Cold data/images/colors | Fully cached, then repeat traversal | Many categories; fling to bottom/top several times |
| Horizontal catalog scroll | New row/cards | Repeat same row | Mixed poster widths and long rows |
| Drawer open/close | First open | Ten repetitions | Small versus large installed-provider list; drag reorder |
| Provider selection | Uncached provider | Cached provider | A → B → C rapidly; one slow/failing category; offline cached content |
| Tabs | First visit to each tab | Round trips after all are mounted | Switch while home is loading and after a long home scroll |
| Settings | First Preferences/Subtitles/Extensions mount | Reopen after mounting | Quantized slider drag, interrupted drag, large extensions list |
| Background contention | SAF disabled, no downloads | Same workload repeated | SAF enabled; active downloads; large completed history |

Use identical content and gestures before/after. Run at least ten repetitions of short interactions and several sustained scrolling passes; report distributions and worst bursts instead of one convenient average. Keep refresh rate fixed for an A/B comparison, then test the device's normal adaptive/high-refresh mode separately.

### Measurements that resolve the remaining uncertainty

- **Frame deadlines:** actual frame interval, missed-deadline/jank count, p50/p95/p99 frame duration, worst consecutive missed frames; distinguish app/rendering delay from compositor/display behavior.
- **Input and content latency:** touch/selection to visible feedback, drawer settling, first useful category, and all categories. A network wait is different from a frozen transition.
- **RN JavaScript:** long tasks, module-store parse duration/count, home/cache serialization duration, React render/commit spans, cancellation leftovers, and GC/allocation bursts. Correlate JS profiling with the system trace rather than inferring JS cause from a single FPS number.
- **Native/UI/render:** layout/measure/commit time, Reanimated/SVG work, image decode/upload, Compose host mount/measure, WebView/worker CPU and native color extraction.
- **Retained state:** row/card instance counts after traversal, JS/native heap growth, worker count, cache sizes, and progress/history serialization bytes.

Useful supplementary ADB commands, to run with the actual installed package ID and connected device:

~~~text
adb devices -l
adb shell dumpsys gfxinfo com.vega reset
# Perform one defined interaction sequence.
adb shell dumpsys gfxinfo com.vega framestats
adb shell dumpsys meminfo com.vega
~~~

The package ID must be checked for the tested variant. These commands are examples, not results collected in this audit. gfxinfo is supplementary; it does not attribute Hermes/WebView/native-worker work and should not replace FrameTimeline/system tracing.

Add temporary counters/spans around module lookup, bridge encoding, invokes/RPCs, category publication, palette jobs, sync, and durable writes. Aggregate counters; avoid per-frame logs or logging source/HTML payloads, which can distort the measurement and expose unnecessary data.

### Proposed engineering targets

These are suggested targets for controlled release tests, not claims that the current app meets them or universal platform requirements:

- Warm taps produce visible feedback by the next available frame; local cached navigation/content feedback is ordinarily within 100 ms.
- Ordinary scrolling and warm transitions aim for less than 1% missed app frame deadlines over repeatable runs, with no repeated bursts of several missed frames. Inspect tails even if the average meets this target.
- Synchronous application work is split into small chunks; start with a roughly 4 ms discretionary JS chunk budget when evaluating 120 Hz, and tighten according to trace evidence. Parsing a large cache must not be repeated in an interaction.
- Warm provider operations perform zero full-store code parses; category execution has a documented concurrency bound; cancellation removes obsolete jobs and late large response injections.
- After full home traversal, retained rows/cards stay bounded by the intended render/recycle policy rather than growing with every category visited.
- Offscreen/obscured hero content produces no decorative rotation or new palette work. Slider callbacks do not repeatedly persist an unchanged step.

Compare the resulting traces with a simple comparable app on the same device, refresh rate, and thermal condition. Match interaction type and content complexity before calling the gap closed. The route to peak smoothness here is to bound and schedule the existing work, then use frame evidence to eliminate the remaining bottleneck.

## TV external-player server dialog focus — fixed in source

The reported dialog had no preferred server/Cancel target, a focusable full-screen backdrop, and no dialog focus guide. Its TV surface now requests native focus in Modal.onShow (after the dialog window is available), uses autoFocus to enter its controls, and traps all four D-pad directions within the dialog. The backdrop remains pointer-dismissable but cannot take remote/accessibility focus. Server rows prefer the first server; Cancel is preferred when the list is empty. The server ScrollView itself is not a focus target, and modal controls do not overwrite the navigation rail's saved screen target. Phone dialogs are unchanged. The shared TV surface fix also applies to other MaterialDialogSurface callers; a separate previously observed delayed dialog owned by an inactive navigation screen is not addressed by this change.

Validation: TypeScript passes; changed-file ESLint has no errors (two existing SeasonList dot-notation warnings). All 17 tests pass across dialog focus-entry/containment and dismissal contracts, SeasonList selection, and TV navigation focus memory. These verify JavaScript behavior, not actual native D-pad navigation. Not rebuilt or installed; awaiting the user's TV check of first-server focus, navigation through all servers and Cancel, Back dismissal, and reopening the dialog.

Installation update: At the user's request, the updated TV release built successfully in 2m28s and the mobile release in 2m32s (repeat Android lint tasks skipped). Both installed successfully with adb install -r, preserving app data, and Vega was restarted on emulator-5554 and the connected Poco (172.29.222.119:5555). Both include the poster corner fix and TV dialog focus changes. Native TV navigation and phone visual verification remain with the user; no automated interaction tests were performed during this installation.


## Commit cleanup

At the user's request, local diagnostic captures, traces, screenshots, UI dumps, build logs, analysis outputs and copied APKs were removed (432 files, about 2.8 GiB). Historical measurements above remain recorded, but the named capture artifacts are no longer present locally. The disabled retained-tab experiment and its test file were removed; App continues using the same normal native detach policy. Source fixes, relevant tests, native build hooks, patches, the native guard verification script and this report remain. performance-captures is now ignored to prevent future diagnostic output from entering a commit. Installed apps and ignored local dependencies/build caches were retained.


## Portrait hero background blur — updated in source

Portrait-style hero backgrounds on phones now use a subtle native Image blurRadius of 6. The foreground poster remains sharp; landscape backgrounds and the existing TV blur radius of 18 remain unchanged. The phone background keeps its bounded decode size (resizeMultiplier 0.5); no live backdrop blur or new animation is added. Awaiting the user's visual check; not rebuilt or installed for this update.



## UHDMovies download-link investigation — connected phone logs

The user enabled detailed logging and reproduced the issue on the connected Poco running release 5.0.2/code 200. For Batman: Caped Crusader, UHD metadata returned HTTP 200. Stream extraction reached en.thenaukriadda.in, with HTTP 200 responses (about 179 KB followed by several 1 KB responses), but getStream uhd returned zero streams in 7208 ms; the repeat returned zero in 3488 ms. No final file-server resolution appears in these attempts, so the observed failure is shortlink/link extraction before download transfer, not downloaded-file validation. HTTP 200 alone does not prove the returned page is the expected destination.

Code comparison found a concrete compatibility difference: the mobile sandbox flattens Set-Cookie into a string, while the PC sandbox preserves raw cookie headers as an array. The local UHD shortlink bypass calls headers['set-cookie'].map(...), so a present cookie header of the mobile shape throws; the provider can catch that failure and continue to an empty result. A Node/AxiosHeaders reproduction confirms the string shape throws map is not a function and the PC array shape works. This is a confirmed code incompatibility and a plausible contributor; existing phone logs do not expose provider-worker console messages or response bodies, so it is not established as the exact cause of these two requests. Provider module/version parity, intermediate page content and cookie availability remain to be verified. No source fix or new installation was performed during this log check.



## UHDMovies mobile cookie compatibility — fixed and installed

The mobile worker now preserves the original response-header pairs before the browser Headers object combines them. Injected axios exposes Set-Cookie as an array of individual cookie lines, with the x-set-cookie alias as the same array; it avoids duplicating canonical cookies through their alias and does not split Expires dates on commas. This matches the response shape UHD's bypass expects and the PC preserves. The real bundled-worker regression test invokes injected axios and the provider's cookie .map() pattern, covering multiple cookies, Expires commas, alias-only headers, no-cookie responses and normal response fields. Provider worker console messages now reach the existing app logger, bounded to 32 messages per invocation and 2000 characters per message; warnings keep their warning level. Previously these worker messages stayed in WebView, obscuring caught extractor failures.

Validation: 26 targeted tests pass; TypeScript and changed-source lint pass. Runtime bundle regenerated. ARM release built in 3m15s (repeat Android lint tasks skipped) and installed successfully on the Poco, preserving data and restarting Vega. Installed version verified as 5.0.3/code 201. User requested to retry the same UHD download for device verification; the cookie incompatibility is fixed, but a successful live UHD resolution has not yet been established.



## UHD resolution confirmed after provider reinstall

The user reports downloads work after reinstalling UHDMovies. Git history verifies the resolver update (74ca8dd) changed UHD metadata/stream sources and compiled files but left the provider manifest at version 1.8 before and after. The app detects provider updates only when the available manifest version is newer; it otherwise runs saved installed modules. Reinstall downloads modules afresh with a timestamp query and no-cache request headers. This establishes a missed provider version bump as the update-detection defect; there is no captured evidence that the CDN returned stale files. The cookie compatibility correction remains a valid independent fix, but must not be credited as resolving this incident. Future provider code/bundle changes require a manifest version bump so existing installations receive the new files.



## UHD version-bump verification — source mismatch and stale CDN observed

The connected phone logs show UHD updated successfully and runs the newer thenaukriadda resolver; two attempts returned one stream (7220 ms and 41217 ms). Codeberg's live manifest currently reports UHD 1.9, and its fetched stream.js SHA-256 exactly matches commit d18688a (14fd6cb5c8ba8c864e73aabe62bf1777b1512b34bfaec2e421d1e9fa36a932e9). git ls-remote independently verifies Codeberg main points to d18688a, whereas GitHub main points to 685700f (UHD 2.0). GitHub raw reports UHD 2.0, while jsDelivr @main reports 1.8 during the same check. Therefore the active Codeberg source is genuinely behind GitHub, not merely serving stale content for its own current branch; jsDelivr separately shows stale manifest caching. The phone is running updated resolver behavior from the Codeberg release, but the latest 2.0 bundle is not available from that source until its branch is updated. Installed module bytes cannot be directly hash-verified through release run-as; no stronger claim of byte-identical installed files is made. No provider/source changes or pushes performed during this read-only check.



Codeberg recheck after the user's push: main now matches latest commit 685700f. Published manifest reports UHD 2.0; manifest.json, dist/uhd/stream.js and dist/uhd/meta.js each match that commit exactly by SHA-256. Latest phone logs show UHD updated successfully, but two subsequent extraction attempts returned zero streams (7876 ms and 6415 ms). The remote files are current; those failed attempts require a separate extractor/request investigation, and are not evidence of stale Codeberg files. Installed private module bytes have not been directly read.



## 2026-10-10 — Play Console 16 KB warning: ByeDPI

- Confirmed the flagged `native-src/android/jniLibs/arm64-v8a/libciadpi.so` was a GCC 11.2.1 prebuilt executable, not a JNI library. LOAD alignment was already 64 KB, but GNU_RELRO ended at `0x33000`; its remainder modulo `0x4000` is `0x3000`. This fails the Android 16 KB RELRO boundary check despite passing LOAD-only checks.
- Rebuilt the same reported ByeDPI version 17.3 from unmodified official upstream tag v0.17.3, commit `7efde1b1296eaaa187b70e951894dde17527489c`, using NDK r27b and both `-Wl,-z,max-page-size=16384` and `-Wl,-z,common-page-size=16384`. Preserved executable PIE behavior and RELRO protection; now uses Android Bionic and `/system/bin/linker64` instead of the old musl prebuilt.
- New LOAD segments align to `0x4000`; GNU_RELRO ends at `0x18000`, exactly 16 KB aligned. Binary size: 146,408 → 64,360 bytes. SHA256: `f8dcba110fccd247074e6e7ff154775f4bb12ba185ef76a87ddeba663aa9f4f0`.
- Added `scripts/build-byedpi.ps1` with pinned source/clean-checkout verification and LOAD/RELRO checks before replacing the tracked and generated Android binaries. Added provenance, rebuild instructions and upstream MIT license in `native-src/android/BYEDPI.md`.
- Source audit: no PAGE_SIZE or hardcoded 4096-page assumptions in the upstream C/header files; anonymous mmap uses a null address and zero offset.
- Physical phone verification: rebuilt executable reports 17.3; SOCKS5 handshake and HTTP transfer with Vega default `--split 1 --disorder 1 --auto=torst` arguments passed. Temporary proxy stopped and ADB test forwards removed. Phone page size is 4096: this is a functionality check, not a 16 KB runtime test.
- Android guidance: https://developer.android.com/guide/practices/page-sizes . The app NDK setting alone cannot fix an already compiled bundled binary. New Play upload and a real 16 KB runtime check remain required to confirm the console warning clears.
- Release validation: `assembleRelease` passed (2m43s). `android/app/build/outputs/apk/release/vega-v5.0.3.apk` contains the corrected binary byte-for-byte; SDK 36 zipalign `-c -P 16 4` passed. Legacy native-library compression/extraction preserved. No app version bump, installation or Play upload performed for this fix.


## 2026-10-10 — Enable R8 optimization and resource shrinking

- Confirmed the prior effective release configuration used `proguard-android.txt`, whose merged R8 configuration contained `-dontoptimize`. Minification/obfuscation was enabled, but optimization was not. Resource shrinking defaulted to false because the supported Expo property was absent; the existing nested buildVariants fields did not enable it.
- `app.config.js` now uses supported `enableMinifyInReleaseBuilds: true` and `enableShrinkResourcesInReleaseBuilds: true`. `with-android-release-gradle.js` persistently replaces the default rules file with `proguard-android-optimize.txt`. `with-jvm-args.js` enables `android.r8.optimizedResourceShrinking=true`, supported by the current AGP 8.12.0. No AGP migration needed for this change.
- `with-android-notification-icons.js` generates a resource keep XML for `ic_notification` and `ic_download_*`, because Notifee receives their names from JavaScript. Existing native/JNI keep rules are preserved. Debug minification remains disabled.
- Android prebuild completed and generated all three effective settings correctly. Changed JavaScript config/plugins pass Node syntax checks; git whitespace check passed. Release build and artifact verification follow below.
- Benefits are native Java/Kotlin optimization and smaller packaged resources; this is not a measured FPS improvement or a fix for JavaScript/render scheduling.
- Release validation completed: first build stopped on a Windows lock of the Expo core generated classes.jar; restarting the Gradle daemon resolved it. Retry `assembleRelease` passed (11m37s after clean native regeneration). Merged `configuration.txt` includes `proguard-android-optimize.txt` and contains no standalone `-dontoptimize`; `convertShrunkResourcesToBinaryRelease` and `optimizeReleaseResources` completed and resource/removed-code reports were generated.
- APK verification: all five dynamically named notification icons are present; corrected ByeDPI executable matches tracked source byte-for-byte; SDK 36 zipalign `-c -P 16 4` passes. APK size: 57,597,277 → 53,930,204 bytes, 3,667,073 bytes (~6.4%) smaller. This size difference is not an FPS benchmark.
- Installed the optimized 5.0.3/201 release on connected Poco via `adb install -r`, preserving data. Android reported successful cold launch of MainActivity; process stayed alive through follow-up checks and its AndroidRuntime log contained no crash. This is a startup smoke check, not full playback/download/TV or 16 KB runtime coverage. App version unchanged; no Play upload.


## 2026-10-10 — R8 optimization rollback after info-page regression

**The preceding R8/resource shrinking experiment is rolled back.** Startup-only verification did not catch this info-page failure. Device logs for process 24289 show Compose NullPointerException followed by ReactHost destruction. `Provider sandbox was torn down` is a secondary consequence of destroying the React tree, not a provider-site failure.

Deobfuscated top frame: `expo.modules.kotlin.records.ReflectionRecordConversionStrategy.convertFromMap`, `RecordTypeConverter.kt:117`, the `property.javaField!!` reflection lookup. This identifies an Expo Kotlin record/reflection compatibility regression after optimization; the exact field/optimizer transformation has not been established. Existing consumer keep rules did not prevent it.

Per user preference, reverted all four R8/resource-shrinker configuration/plugin edits and regenerated project settings to the previous minification-only configuration. Kept the independent 16 KB ByeDPI binary fix. No sandbox lifecycle workaround or speculative broad keep rules added. Rebuild/installation verification follows.
- Rollback release build passed (5m17s). Verified merged R8 rules restore `-dontoptimize`, both resource-shrinker flags are absent, and packaged ByeDPI bytes still match the fixed source. Installed 5.0.3/201 on Poco with data preserved; Android cold launch returned success. APK is 57,548,508 bytes. Removed staged copies of the reverted configuration edits; staged native fix/build script preserved.
- Info-page retest could not be completed: device went to sleep during the build and is now on the lock screen. User should unlock and retry an info page; do not count the startup check as validation of the previously failing path.

## 2026-10-11 — Optional local-player volume boost

- Added a persisted **Player Preferences → Volume boost** switch, enabled by default on Android. Disabling it caps the volume gesture at 100%, including when returning to an existing player.
- Volume swipes now reach 200%. Up to 100% they control system volume; above 100% system volume stays capped and an Android `LoudnessEnhancer` attached to the player's own audio session adds gain. At 200% the requested gain is approximately +6 dB; actual loudness depends on the source and device. Boosted percentages use an amber indicator.
- Quantized gesture updates to whole percentages and avoid repeated writes of unchanged system volume. Hardware volume reductions reset amplification to normal. Brightness, external players and casting retain their existing behavior.
- Native effects are released on mute, return to normal volume, audio-session replacement and player release. Ordinary ExoPlayer volume stays within 0–1. Effect creation failures cap the UI at 100% and show a short unavailable message rather than failing playback. The native changes are persisted in the existing react-native-video patch, preserving earlier playback fixes.
- Validation: four volume mapping tests pass; TypeScript passes; targeted ESLint reports zero errors and ten pre-existing VideoPlayer warnings. Final Android release build passed (4m22s), including native recompilation and the final JavaScript bundle. APK: `android/app/build/outputs/apk/release/vega-v5.0.3.apk`. No ADB device is connected, so audible boost, hardware buttons, route changes and device-specific effect support remain untested. Passthrough/offloaded audio may bypass Android effects.
- Previous R8 optimization rollback remains in place; this feature does not change shrinking or optimization settings.

## 2026-10-11 — External subtitle retention, selection and style refresh

- Found a subtitle lifecycle bug in `useStream`: any changed provider response rebuilt `externalSubs` from provider/download entries, deleting manually picked and OpenSubtitles entries. Preserve user-added entries across refreshes for the current episode, replace managed entries normally, and clear imports on episode changes. Regression tests cover refresh retention and episode isolation.
- Player subtitle style was read inside a memo without a settings revision dependency. Returning from subtitle preferences did not explicitly refresh it. Read a stable style snapshot on player focus and update only when values changed, avoiding progress-driven settings reads.
- Native selection could arrive before the refreshed text groups existed. Replay the stored selection on track changes, retain the existing override when the requested track is temporarily absent, and explicitly enable the matched text renderer. Compare parameters before applying them to avoid a selection/event loop.
- Fixed native selection reporting to use the mapped renderer index instead of the text track-type constant. Retain external subtitle format IDs, and seed the custom overlay from current player cues when attaching/reapplying style so it does not depend exclusively on a future cue event.
- Found silent load handling: subtitle open/read failures became empty content/end-of-input, leaving a menu entry without rendered text. HTTP open failures now get at most two bounded retries for IO errors, 408, 429 and 5xx responses. Close failed upstream requests, honor interruption during backoff, and emit a failure notice filtered/deduplicated for the active player's subtitle URIs. Permanent failures still do not intentionally stop video playback. Mid-read failures are reported; they are not retried automatically.
- Validation: TypeScript passes; targeted ESLint has zero errors and ten existing VideoPlayer warnings. All nine downloaded-stream regression tests pass, including the two new tests. Verified the packaged-source map matches the final Player source and earlier unrelated native patch sections remain unchanged. Android release build passed (5m02s); APK: `android/app/build/outputs/apk/release/vega-v5.0.3.apk`. This build has not been installed during the subtitle investigation.
- Phone connected during this work, but captured logs contained no subtitle failure and the requested reproduction has not been supplied. These are verified code defects and targeted fixes; the user's exact failure after a style change has not yet been reproduced on-device.

## 2026-10-11 — Volume boost revision after no audible improvement

- Confirmed the phone's installed APK contains the original native boost implementation. During the user's live reproduction, AudioFlinger reports Vega audio session 8297 actively playing six-channel, 48 kHz PCM with the AOSP Loudness Enhancer enabled and controlled by Vega. This rules out a missing native implementation or an unattached/disabled effect during that capture. It does not establish the effect's actual acoustic gain; no audio recording was taken. The effect's displayed configuration is stereo while the source track is six-channel.
- Replaced the session-level LoudnessEnhancer implementation with a per-player Media3 PCM audio processor. A requested 200% multiplies every interleaved channel's samples by two before output; 150% uses 1.5. Samples saturate at the signed 16-bit limits instead of wrapping. No platform audio-effect support/session bookkeeping is needed.
- Keep the processor configured through volume changes, so enabling gain needs no seek or audio-sink recreation. Reuse its output buffer; use a bulk copy at unity gain. Gain is read on the audio thread from volatile state. Mute and player release restore unity gain; normal system/ExoPlayer volume remains capped at 100%. The existing preference switch still disables boosting.
- Media3 converts decoded PCM to 16-bit before the custom processor; float output stays disabled, consistent with the existing renderer default. Encoded TV passthrough/offload bypasses PCM processors and has not been converted into a forced decoding path. This change targets decoded local playback, including the phone's captured multichannel stream.
- Added standalone native DSP checks for six-channel doubling, 150%, positive/negative saturation, unity/disabled identity and silence. All pass. Four JS volume tests and TypeScript pass; targeted ESLint has zero errors and ten existing warnings. Android release build passed (5m15s), including the native endpoint diagnostic. Installed 5.0.3/201 on Poco with `adb install -r`, preserving data, and launched MainActivity successfully. This APK also includes the preceding subtitle fixes. A minimal native diagnostic logs transitions to 100%/200% when PCM actually passes through the processor, enabling device verification without per-frame logging.
- This revision supersedes the original LoudnessEnhancer details in the earlier volume-boost section. Audible improvement on the phone still needs confirmation after installation.

## 2026-10-11 — Playback regression in the PCM boost revision

- User reproduction after installing the PCM revision failed with “video could not be played”. Device logs identify `IllegalArgumentException: The source buffer is this buffer` in `PcmVolumeGain.process`, called from `VolumeBoostAudioProcessor.queueInput`. This is a regression introduced by the new processor, not a provider failure.
- The pipeline can pass a consumed output buffer back as empty input. Calling `replaceOutputBuffer` first clears the same reusable buffer, making it nonempty again; unity gain then attempts to copy the buffer into itself. Return immediately for empty input before touching the reusable output. This also prevents replaying stale audio at boosted gain.
- Added a lifecycle regression check using Media3 1.8.0's actual `BaseAudioProcessor`, covering drained output passed as input, unrelated empty input and repeated buffer reuse. Removing the guard reproduces the exact device exception; with the guard all checks pass. Existing DSP checks also pass. The earlier DSP-only checks missed this buffer lifecycle failure.
- Corrected Android release build passed (4m59s). Installed 5.0.3/201 on Poco with `adb install -r`, preserving data. Device cold launch passed. During the subsequent live retest, process 13653 logs `VegaVolumeBoost: PCM gain=2.0 channels=6` at 14:47:01, confirming six-channel decoded audio reaches the active 200% processor. The same session then logs unity gain at 14:47:20 and 200% again at 14:47:37, verifying live gain changes on six-channel PCM without a processor rebuild. No self-buffer exception, ExoPlayer playback error or fatal exception appears in the captured new-process logs. Audible loudness confirmation remains pending; do not infer it from a native diagnostic alone.

## 2026-10-12 — TV search history removal

- Both individual remove buttons and Clear all were gated behind `!isTV`; TV users had no history deletion control. Added a separate remote-focusable close button beside each TV history row and exposed the existing TV-aware Clear all button. Existing callbacks persist deletions through Search's MMKV history storage.
- Explicitly connect right/left navigation between the search row and its remove button; connect vertical navigation and the header action. Remove buttons have visible focus borders and descriptive accessibility labels. Removing an entry restores focus to the next surviving row or previous row when deleting the last visible entry. Clearing history or deleting its final entry returns focus to the search field before Search unmounts the history component.
- Memoize the TV history slice: previously a new array on every render retriggered an effect that set node-handle state, potentially causing repeated rerenders. Keep row keys independent of index to preserve surviving controls during deletion, and stabilize row-ref callbacks.
- Validation: final targeted ESLint and TypeScript checks pass; diff whitespace check passes. No TV build/install or remote-device test performed for this change.

## 2026-10-12 — Torrent status overlapping player title

- The torrent download/speed label was an independently positioned top-center overlay. Long player titles occupied the same area, causing the reported overlap.
- Move the status into the player title block as a separate line below the title and episode; allow the block to grow instead of fixing its height. Keep one-line truncation for each label. Remove the independent overlay, so status follows the header's existing control visibility animation. Pass status separately from the memoized playback props to preserve the source/config object during torrent-stat updates.
- Targeted ESLint, TypeScript and whitespace checks pass. No build/install or device visual verification performed.

## 2026-10-12 — Library labels near the bottom navigation bar

- User reports cropped names with more than nine Library entries. The supplied screenshot shows third-row labels reaching the bottom navigation bar; long labels also use explicit single-line ellipsis. Asked which symptom is intended; no clarification received during implementation. Treat bottom-row clipping as the working assumption.
- Give the Library FlatList explicit `flex: 1` and `minHeight: 0`, constraining its viewport to the space below the header/collection chips. Retain the existing bottom content padding and unclipped card rendering. This addresses ambiguous intrinsic list sizing as collections grow; the original failure has not been reproduced locally, so the layout change is not yet a confirmed device fix.
- Targeted ESLint, TypeScript and whitespace checks pass. No build/install or device scrolling verification performed. Single-line title ellipsis remains unchanged pending clarification.

## 2026-10-12 — TV search history APK verification

- Started Television_1080p (emulator-5554), installed the user's already-built release APK (5.0.3) with data retained, and verified the new removal controls in the live UI.
- D-pad Down → Right focused Remove Batman; Select removed the only existing entry and restored focus to the search field. With two test entries present, Select on Remove inception deleted only that entry and moved focus to the surviving atrix row. Up then focused Clear all; Select removed the remaining history. UI hierarchy snapshots captured under performance-captures/tv-search-*.xml.
- Cold-restarted Vega and reopened Search: zero history entries remained, confirming persistent deletion.
- Minor focus discrepancy: Clear all in the nonempty-query/multiple-entry test returned focus to the Search navigation item, not the search field. History removal itself works. No code changes or rebuild made during this APK verification.

## 2026-10-12 — Restore TV focus after clearing history

- Earlier wording “sometimes” referred to one observed failure, not a measured intermittent rate. The old history component requested field focus before removing the focused Clear all control and unmounting itself. Native focus reassignment during deletion could override that request.
- Search now owns restoration for Clear all and final-entry deletion. Mark restoration pending with the state update, clear the stale first-history focus target, and request focus on the field's live native handle in the next animation frame after the history update commits. The owning Search screen remains mounted; no cached child field tag or unmount-time request is used. Surviving-row focus restoration stays in SearchHistory.
- Targeted ESLint, TypeScript and whitespace checks pass. Release build and emulator verification are pending.

- First post-commit-only APK passed single-entry checks but failed the two-entry Clear all test starting from rail focus. Native XML still showed Search rail focus; this attempted fix was insufficient.
- Additional cause found in shared TV focus memory: Clear all uses a tracked TVFocusable. Unmounting it schedules a 120 ms rescue; SearchField previously did not register its native focus with that tracker, so the rescue saw no replacement and could focus a recently visited rail item. Register SearchField's focus/blur through the existing focus-memory hook. Also correct its TV imperative focus method: Pressable refs do not supply the assumed TextInput `.focus()` method; request native focus and preferred focus until onFocus confirms arrival. Final build/retest pending.

- Final validation: two focus regression suites pass (11 tests), including the actual SearchField claiming focus while Clear all's delayed rescue is pending. Targeted ESLint, final TypeScript and whitespace checks pass. Final release build passed (2m22s), installed on Television_1080p with data preserved. Live D-pad test cleared two history entries with a nonempty query after visiting the rail; native XML confirms the search field remains focused after a two-second wait. Final-entry deletion also restores and retains field focus. Captures: performance-captures/tv-focus-tracked-clear-after.xml and tv-focus-tracked-remove-after.xml. Emulator remains open; phone not reinstalled for this TV fix.
