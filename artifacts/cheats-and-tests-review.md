# Pause cheats and consolidated checks · v0.26

Type **INJ0** in the pause menu to reveal the five-level selector. **Start level** resets the encounter through normal round initialization. Goldline starts as the car; Colossus plays its enlargement. Unlock is session-only. Fresh health/resources, boss pools, victory UI, input and effects reset on stage selection; normal Restart remains level one.

## Test workflow

The default `node tests/browser.cjs --artifacts` run passed **61 checks in 10.56 seconds**, including structure, production HTTP/file startup and every level via the menu, native text/select keys, phone layouts, and multi-enemy/Blink regressions. Preview capture was enabled for this inspection; it is off by default.

`node tests/browser.cjs --all` passed **300 functional checks in 18.92 seconds**. All nine modules ran once in fresh contexts using one browser. This included shared combat/touch abilities/victory, giant flow/poise/hazards, Teddy/shrink/Blink, Goldline and backdrop selection. Two stale boss-HP fixture expectations were updated to derive damage/transition expectations from current tuning. Gameplay tuning was unchanged.

These timings describe this local machine and these coverage levels. The exhaustive suite, fight simulations, offline audio renders and slow reveal replay were **not run**. They remain opt-in with `--full`; the earlier exhaustive report is unchanged. [Latest functional results](validation-quick.json), [commands and coverage](../docs/testing.md).

## Interface review

Full review scope: new cheat input, status, native level selector/start action and containing pause dialog. Existing classic JavaScript, Canvas game and plain CSS; no added framework or animation. Physical phone/browser keyboards were not inspected.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | 16 px editable controls, 13 px labels/action text; 320/390/844 px captures and live status feedback | Clear; readable native editing without the small-input Safari zoom trigger |
| Surfaces | Viewport-framed pause panel, native fields, structural divider, 44 px hit targets, scrolling and horizontal bounds | Clear; portrait panel no longer confined to the short arena |
| Animations | Locked, invalid-code, unlocked, focus, active and resumed states through real browser interactions | Clear; immediate state feedback, no new animation to replay |
| Icons | No new icons; existing pause actions remain text buttons | Clear within scope; fighter/control icons unchanged |
| Performance | Input listener, private unlock flag, normal round reset, functional-run timing | Clear; no polling, network request or dependency added for cheats |

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `js/controls.js:232` | Dialog trap considered only buttons; global shortcuts also received editable-field keys | Visible enabled inputs/selects join the focus loop; editing bypasses combat/mute handlers while Escape resumes | Native keyboard behavior and a complete focus trap keep entry usable |
| MEDIUM | `styles/layout.css:66` | Arena-sized pause area would make added fields scroll inside a very short portrait canvas | Viewport overlay with a bounded scrollable panel | All controls stay reachable on phones |
| LOW | `styles/layout.css:138`, `index.html:166` | No code entry, unlock feedback or stage controls | Accessible-name 16 px input with placeholder, live status, hidden native selector, separate 44 px Start action | Clear state feedback and minimum hit areas; selecting does not unexpectedly navigate |

| Location | Considered | Rejected because |
| --- | --- | --- |
| Level selection | Start immediately on dropdown change | A separate action lets keyboard/touch users browse without resetting the fight |
| Unlock feedback | Animated expansion or celebration | Instant field/status changes communicate this repeatable utility action without motion |

Verification: real typing, Enter, Tab/Shift+Tab, native selector arrows, Escape, all five stage starts, close/reopen, restart and reload; fresh resources and cleared boss pools; 320/390/844 geometry and selected screenshots. [320 px](cheat-menu-320.png), [390 px](cheat-menu-390.png), [landscape](cheat-menu-844.png) were visually inspected. **Approve**: no actionable findings remain in this scope. Not verified: physical iPhone/Safari/onscreen-keyboard behavior, full-suite/balance/audio results.

## Compact-menu follow-up

Removed the visible Cheat code label while preserving its accessible name. Reduced panel padding (10→8 px), grid gaps (6→4 px), cheat-section spacing (12→6 px), heading/label/status spacing and selector-row gap. All touch targets stay at least 44 px. The 320 px updated capture was visually inspected; geometry also passes at 390/844 px. `node tests/browser.cjs --suite menus --artifacts` passed structure and 40 focused checks in 10.47 seconds. Full suite skipped.

Quick review: typography and surfaces clear; no new animation or icons, performance unchanged. Considered shrinking the buttons further, rejected to preserve touch targets. Approve; physical iPhone/Safari keyboard behavior remains unverified.
