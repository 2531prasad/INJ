# Green Nitro and victory scene review

20 October 2026 · full review · make-interfaces-feel-better

Scope: Nitro sprite color/motion, the player-win scene, its touch/keyboard continuation, and pause/restart boundaries. The implementation uses the existing classic JavaScript, Canvas and ordered plain CSS. Original PNGs and frame metadata are unchanged. Review covers Chromium emulation, including reduced motion; physical iPhone/Safari and subjective speaker listening remain unverified.

## Coverage

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Victory headline, round/opponent labels, actual health/best-combo values at 320, 390, 667 and 844 px | Clear hierarchy and tabular values; no clipping in tested sizes |
| Surfaces | Win-stage dimming, hero/defeated poses, Next Round target, menu separation, hover/focus/press states | Scene fits the arena; Next Round is at least 44 px and does not overlap the quiet menu |
| Animations | Green kick and victory reveal sampled at 10% speed; reduced-motion scene and sprite | Green runtime color remains; reduced motion removes flames, echoes, confetti and animated close-up |
| Icons | Existing combat icons retained; Next Round arrow and label inspected | No icon-only continuation or new icon system |
| Performance | One cached runtime recolor, short-lived echoes, deterministic directional ribbons and 16 victory flecks | No per-frame image recoloring or pixel reads; no GPU/frame-rate profiling performed |

## Resolved findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `js/fighters.js:22`, `js/fighters.js:133`, `js/renderer.js` | Nitro kept INJ's ordinary palette with pale motion streaks | An alpha-preserving runtime green atlas supplies the body and phase silhouettes; directional flame ribbons and stronger brief echoes describe active travel | A static color cue plus restrained motion communicates the requested blazing attack clearly |
| MEDIUM | `js/rounds.js:25`, `js/state.js` | Wins automatically reset after a KO countdown | A 1.1-second KO beat enters a dedicated player-paced victory state with an actual result snapshot | The result has time to register before progression |
| MEDIUM | `js/renderer.js`, `index.html:139`, `styles/dialogue.css:289` | No foreground win composition | Authored victory pose, subtle uniform close-up, dimmed arena/defeated opponent, gold flecks and a responsive result panel | Visual hierarchy establishes a distinct celebration while preserving the artwork |
| MEDIUM | `js/engine.js`, `js/controls.js:282`, `js/menus.js:187` | Win progression had no independent input/lifecycle boundary | Combat stops; focus goes to Next Round; touch or Enter/Space advances once; pause freezes the scene and restart clears it | Controls remain predictable and do not carry held fight inputs into continuation |
| LOW | `js/combat.js:211`, `js/rounds.js:16`, `styles/dialogue.css` | No durable best-chain result | Best combo and actual remaining health are snapshotted, displayed with tabular numerals and cleared on the next round | Result numbers communicate earned performance without fabricated scores |
| LOW | `audio.js:208` | The existing KO cue was the only win sound | A short synthesized victory arpeggio/chord plays once when the scene opens | A distinct, bounded celebration cue completes the scene while retaining audio preferences/lifecycle |

## Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Nitro art | Permanently recolor the source PNG | Green belongs to the attack state; original art and alpha provenance must remain intact |
| Victory progression | Automatically dismiss the scene after a timer | The player should have time to see the celebration and result |
| Blaze effect | Full-screen flashes or hand/floor halos | Directional ribbons preserve the fight's visual readability and the project's existing no-halo brief |

## Verification

- `node tests/structure.cjs`: 24 classic scripts and seven stylesheets pass syntax, links and startup-order checks.
- `node tests/browser.cjs`: **276 Chromium checks** pass, including unmodified HTTP/direct-file startup, all Nitro stances, movement plus ability touch capture, wins/losses, both boss forms and audio voice cleanup.
- New color checks verify a strongly green rendered sprite, exact alpha in the sampled native cached frame, original opaque-color restoration after the attack, and retained green color under reduced motion. Native alpha is checked separately because PNG and Canvas sources can use different scaled edge filters.
- A separate direct-file check rendered green Nitro without runtime errors, opened/paused the victory scene through the menu, and used Space on Next Round to enter round two exactly once.
- New victory checks verify the KO beat, authored pose, actual result snapshot, one fanfare, hidden fight controls, frozen battle/timer, player-paced continuation, pause/restart, exactly-once progression, car transformation, robot victory and unchanged MiMi loss flow.
- Responsive checks at 320×568, 390×844, 667×375 and 844×390 verify scene/text fit, a continuation target of at least 44 px, and no overlap with the quiet menu.
- Manual scripted Chromium review advanced 40 ms of animation per 400 ms of wall time for 10% playback. Next Round hover/focus used rgba(88, 64, 42, 0.9); its slowed pressed transform reached matrix(0.96, 0, 0, 0.96, 0, 0). Reduced-motion framing was also inspected.
- [Green Nitro](nitro-green-blaze.png), [Nitro sequence](nitro-green-sequence.png), [320 px victory](victory-320.png), [844 px victory](victory-844.png), [victory sequence](victory-sequence.png), [reduced motion](victory-reduced-motion.png).

Verdict: **Approve for the inspected Chromium scope.** No actionable findings remain in that scope. Physical-phone ergonomics, Safari behavior and subjective audio listening remain unverified.
