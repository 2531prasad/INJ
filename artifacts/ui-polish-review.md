# Phone controls and Nitro phase animation review

19 October 2026 · full review · make-interfaces-feel-better

Scope: the floating combat controls, Nitro readiness/animation and combo multiplier. Implementation remains classic JavaScript, Canvas and the existing ordered plain-CSS cascade. Source sprite images are unchanged. This review covers Chromium emulation, not physical-phone ergonomics or Safari.

## Coverage

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Icon labels and transparent combo text at 320, 390 and 844 px; normal and charged Shadow labels | Larger readable action hierarchy; labels remain present alongside icons |
| Surfaces | Empty/full Nitro states, primary/secondary shape hierarchy, pressed and focused states; all touch rectangles and quiet menu | Fixed targets of at least 44 px; no overlap; only the existing inset highlight on focus |
| Animations | Normal playback, coil/strike/recoil sampled at 10% playback speed, button press/release slowed to 10%, reduced-motion context | Sharp sprite changes, bounded travel/echo lifetimes, 0.96 press scale; reduced motion removes trails/echoes and CSS transitions |
| Icons | All six inline SVGs and their visible labels; charged Shadow update | Consistent currentColor/stroke treatment; updating the label preserves its icon |
| Performance | Fixed button positions across readiness changes, explicit CSS transition properties, active-time travel integration, short-lived echoes | No target movement or new framework/dependency; no GPU profiling performed |

## Resolved findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `index.html`, `styles/responsive.css` | Six similar text-only boxes offered little primary/secondary distinction | Larger round Punch/Kick buttons below smaller Shadow/Upper/Guard controls, with consistent icons and persistent labels | Visual hierarchy and optical alignment make the most-used actions easier to identify |
| MEDIUM | `js/controls.js`, `styles/responsive.css` | Unavailable Nitro occupied a visible disabled-looking button | Nitro is hidden below full meter and appears in a reserved slot; spending it hides it immediately without moving any other target | Contextual availability reduces clutter while preserving thumb positions |
| LOW | `styles/immersive.css` | The menu was offset to accommodate a filled bottom-left control slot | The new dock leaves the bottom gap free, allowing the quiet menu to return to the center | Optical alignment and separated hit areas |
| LOW | `js/renderer.js` | Combo text sat on an opaque rectangular panel | Hit count and multiplier render directly over the arena, retaining text shadow only | Requested transparent surface keeps more of the stage visible |
| MEDIUM | `js/content.js`, `js/fighters.js`, `js/combat.js` | Nitro used a longer attack cadence and generic held kick pose | 60 ms coil/startup, 160 ms forward burst, 260 ms recovery; sharp coil/strike/recoil poses, brief shadow echoes and directional streaks | The requested phase-style kick reads as a quick committed burst; decoration respects reduced motion |
| MEDIUM | `js/combat.js` | Travel charged a whole update step when it crossed into the active window | Travel integrates only the elapsed active interval, retaining 105.6 units at different step sizes | Faster animation remains consistent across frame timing |
| LOW | `js/controls.js` | Shadow readiness replaced the entire button text | Only the label span changes when charged | Icon identity survives every readiness update |

## Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Nitro control | Reflow the remaining controls when Nitro hides | Moving targets would disrupt learned thumb placement |
| Nitro readiness | Pulse or repeatedly animate the ready button | The visible gold/violet control and label already communicate readiness; repeated motion would distract from combat |
| Fighter art | Generate a new raster atlas for this animation | Authored poses plus movement and short echoes express the requested burst while preserving the source artwork |

## Verification

- `node tests/structure.cjs`: passed 24 classic scripts and seven stylesheets, including syntax, links and startup order.
- `node tests/browser.cjs`: passed **253 Chromium checks**. Added coverage includes Nitro hidden below full meter, icon retention, phase timing/poses, consistent burst distance, reduced-motion echoes, transparent combo pixels, fixed/separated ready/hidden layouts at 320×568, 390×844, 667×375 and 844×390, and actual touch/Q activation.
- Genuine simultaneous Chromium contacts confirm that hiding Nitro preserves the joystick thumb, releases capture without stuck input, and permits a refilled Nitro to be tapped again.
- Scripted visual inspection used a temporary local HTTP server. Button transitions were slowed with playbackRate 0.1; observed pressed transform was matrix(0.96, 0, 0, 0.96, 0, 0). Canvas combat was advanced by 40 ms per 400 ms of wall time for 10% playback. A reduced-motion context reported reduced=true and CSS transition duration 0s.
- [320 px ready](controls-320-ready.png), [390 px empty](controls-390-empty.png), [390 px ready](controls-390-ready.png), [844 px ready](controls-844-ready.png), [phase sequence](nitro-phase-sequence.png).

Verdict: **Approve for the inspected Chromium scope.** No actionable interface-polish findings remain in that scope. Physical iPhone/Safari behavior, hands-on thumb reach and subjective animation preference remain unverified.
