# Velvet Colossus · v0.24 · 23 October 2026

Round five is Teddy's standalone giant boss battle. Blue Velvet's victory still waits for Next Round; the next stage starts with fresh health, Doraemon's enlargement and a pullback into the Kingdom of Giants. Teddy ends at twice its base height with 1,200 HP. INJ keeps her actual size and appears smaller through the camera. Boss attacks cannot be interrupted by flinching, but still take full damage. This fight has no timer.

The v0.25 quick update raises HP to 1,200 and fixes nearest-enemy targeting, protected-echo interception and per-enemy combo scaling. The screenshots, full-suite results and scripted balance counts below are from v0.24 (480 HP). Only the focused targeting runner and structure check were rerun for v0.25.

## Play and previews

| Beat | What to read | Preview |
| --- | --- | --- |
| Doraemon returns | Teddy starts at ordinary size | [Arrival](giant-reveal-8.png) |
| Enlarge ray / camera pullback | Teddy grows as the outer giant statues and kingdom are revealed | [Enlarging](giant-reveal-26.png), [wide arena](giant-reveal-35.png) |
| Kingdom Breaker | Raised hands track briefly, then facing locks. Block or Blink behind after the lock | [Windup](giant-smash-1100.png), [impact](giant-impact.png), [recovery](giant-recovery.png) |
| Royal Footfall | Jump or guard the ground waves | Static floor cues and moving waves in-game |
| Falling Ovation | Move off the three gold floor markers | Markers stay fixed; stars do not home |
| Royal Recess | Teddy folds its arms and summons one awakened Dummy echo. Defeat it or outlast its short visit | [Summon break](giant-summon.png) |
| Boss victory | Combat stops; Next Round advances when ready | [Victory](giant-victory.png) |
| Phone layout | Existing seven actions/menu/joystick keep their positions | [320 px](giant-smash-320.png), [390 px](giant-smash-390.png), [landscape](giant-smash-844.png) |

Kingdom Breaker has a 1.15-second windup, locks facing after 550 ms, then a short active strike and 1.4-second recovery. A clean hit deals 20 HP; guard takes 4. Jumping alone does not bypass the hands. An early completed Blink can be reacquired before the lock; a later Blink genuinely gets behind the committed attack. All player attacks, including charged Shadow, Nitro and sweeps, damage the boss without changing its action/clock or adding hit-stop.

The echo has 40 HP, awakened decisions, normal flinching/knockdown and a ten-second maximum visit. Only one can exist. Killing it never completes the boss; its attacks can cause a real INJ loss. Boss KO/restart/retry clears all hazards and echoes. Losing retries this stage's enlargement.

The music is an original 88 BPM synthesized boss arrangement with slower drums, low pulse, choir fifths and music-box notes. [24-second music preview](boss-score-preview.wav). Normal stages keep the original 112 BPM score. No external samples, downloads, music assets or autoplay were added.

## Full interface-polish review

Scope: the new boss HUD, reveal, authored poses, attack/summon tells, reduced-motion behavior and boss victory. The project remains plain HTML/CSS/classic JavaScript with Canvas rendering; existing CSS, fonts, SVG controls and input layout are reused. Review follows the `make-interfaces-feel-better` skill; new bitmaps use built-in ImageGen. No separate design framework or styling system was introduced.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | `js/giant-renderer.js:160`; boss title, right-aligned HP, stage label, compact resources, windup/impact/recovery copy; phone screenshots and victory layout | Clear; existing monospace/Chakra type system, fixed HP position, balanced hierarchy |
| Surfaces | Full-width framed/segmented boss bar, delayed damage trail, static diamond ends; 320/390/844/1100 layouts | Clear; boss health is visually distinct without adding another control surface |
| Animations | `giantCamera`, ray/cameo, four authored smash/recess frames, echo materialization, pause/resize/restart, reduced motion; 10% scripted replay and selected-state captures | Clear; grounded roots, continuous scale/camera, hard pose swaps and safe recovery cues |
| Icons | Existing seven SVG action buttons and quiet menu in boss screenshots / complete touch suite | Clear; unchanged icon set, fixed targets, no duplicate boss action deck |
| Performance | Cached stage bake, preloaded atlases, simple camera transforms, one echo, finite hazards, audio voice cleanup | Clear; no per-frame image loading, layout measurement or added library |

### Applied findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `js/giant-renderer.js:160` | Ordinary opponent half-bar and round clock did not communicate a standalone boss | A gold-framed full-width boss bar, actual HP, delayed damage, stage title and no timer | Clear hierarchy and meaningful encounter identity |
| MEDIUM | `js/giant-renderer.js:6`, `:49` | A fixed camera could not show Teddy growing beyond the normal fighter height | A protected enlargement with coordinated 1→0.6 pullback; INJ's model stays unchanged | Object continuity makes the size change and wider world readable |
| MEDIUM | `js/giant-renderer.js:90`, `:160` | No boss-specific tell separated tracking, locked facing, active impact and recovery | Static directional floor marks, explicit lock/guard/Blink hints and accurate per-move follow-up text | Feedback must communicate the actual safe timing, not merely decoration |
| LOW | `js/giant-renderer.js:286` | No authored giant smash or relaxed summon silhouette | Separate overhead/impact/kneeling/folded-arm poses, with the echo materializing on a ground sigil | Readable poses and staged entrance make the boss's action legible |
| LOW | `js/giant-renderer.js:6`, `:49`, `:286` | New camera/ray/echo effects required a reduced-motion path | Stable final wide camera, no ray motes or echo scaling, retained static size/tell cues | Motion restraint while preserving gameplay information |

### Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Phone controls | A separate boss control layout | The same guard/Blink actions already solve the fight; moving buttons would break two-thumb familiarity |
| Smash warning | Repeated full-screen flashes/pulses | A locked floor strip and short text cue communicate danger with less repeated visual interruption |
| Boss scene | Persistent cinematic letterboxing | It would consume valuable phone arena height; the background, camera, HUD and music already establish the new stage |
| Health bar | A generated raster HUD frame | The established Canvas primitives produce a crisp responsive frame and inspectable HP trail without another image asset |

### Verification and verdict

`node tests/structure.cjs` and `node tests/browser.cjs` pass. The suite includes untouched HTTP/direct-file boss startup; all four attacks; five attack types damaging without stagger; early/timed/corner Blink; real guard chip and jumpable waves; fixed star markers; independent melee/projectile echo targeting, KO/expiry/loss; no-timer combat with normal combo/cooldown expiry; protected/pauseable enlargement; mid-reveal resize; four viewport layouts and boss victories; and the 10% enlargement replay. Selected arrival, beam, wide, windup, impact, recovery, summon and victory captures were visually inspected. The slow replay validates every sampled scale/camera/root; it is scripted Chromium inspection, not a claim of physical-phone playtesting.

The 30 seeded full fights include idle, reckless pressure and prepared guard/Blink/punish policies. Prepared players win reliably; idle players lose. Current exact counts are in [validation.json](validation.json) and [balance notes](r8-balance.md). These simple policies do not establish human difficulty or a human win rate.

The full boss music preview renders finite, audible samples without clipped samples or silent arrangement bars; its instrument/note sequence differs from the normal score. This is a signal check, not subjective listening approval.

**Approve — no actionable interface-polish findings remain.** Not verified: physical iPhone/Safari/Home Screen behavior, human difficulty/ergonomics, and subjective speaker/headphone listening.

## Source art

New project assets: [Kingdom plate](../assets/stage-giants-v1.png) and [four-pose boss atlas](../assets/teddy-giant-poses-v1.png). [Exact built-in ImageGen prompts, source paths and hashes](../assets/giant-generation.md). Existing fighter atlases and stage plates are unchanged. The alpha inspector adds only new metadata; previous Teddy/cameo/walking metadata is semantically identical.
