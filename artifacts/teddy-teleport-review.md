# Teddy / Blink interface review · 22 October 2026

Full mode. Scope: Blue Velvet normal/tiny art, Doraemon's ray sequence, INJ Blink, phone controls/readiness, opponent HUD and reduced motion. Plain HTML, existing CSS cascade, classic JavaScript and Canvas; no UI framework or production dependency added. Physical-device ergonomics and subjective audio are outside this browser review.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Phone labels, numbered cooldown, desktop HUD, move tells, shrink captions; 320/390/844 px previews | Static labels accompany color/motion; cooldown uses tabular numbers |
| Surfaces | Seven action targets, primary/support hierarchy, quiet menu, joystick and pause/victory states | Separate targets ≥44 px, including Nitro-ready layout; 320 px primary strikes remain 48 px |
| Animations | Sixteen teddy poses, four cameo poses, three-pulse punches, spin, anchored shrink, complete Blink disappearance and return | Hard pose changes; both staged sequences replayed at 10% simulation speed and checked at discrete phases |
| Icons | New Blink portals/arrow plus existing six inline SVGs | Shared outline/currentColor treatment; no new icon library |
| Performance | Atlas loading, cached images, Canvas draw paths, cooldown DOM writes, reduced-motion branches | No bitmap processing per frame or CSS transition-all; label changes only on displayed-second changes |

## Changes reviewed

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| High | `styles/responsive.css`, `styles/immersive.css`, `index.html` | Six actions left no safe dedicated space for another ability and the menu | Fixed lower-left Blink slot, shared deck/menu sizing, 2 px menu gaps and a slightly narrower portrait stick zone | Minimum hit areas must stay separate, including on 320 px phones |
| Medium | `js/teleport.js`, `js/controls.js`, `js/renderer.js` | No teleport readiness/cooldown feedback | Portals icon, BLINK label, numbered seconds, muted cooling surface and aria-disabled label; desktop E cue | State needs static feedback, not color or animation alone; tabular numbers prevent shifts |
| Medium | `js/fighters.js`, `js/teleport.js`, `js/opponent.js` | No disappearance/reappearance or invisible-target perception rule | Crisp contracting/expanding sprite window, staggered line fragments, full hidden interval, rear landing and delayed enemy reacquisition | Animation communicates relocation without dissolving between authored poses; enemies do not track an invisible body |
| Medium | `js/teddy-renderer.js`, `assets/teddy-frames.js` | No teddy/cameo art or shrink choreography | Anchored 110%-height plush, distinct hard poses, arrival/aim/fire/farewell, continuous scale to 34%, tiny punch alternation and spinning body | Pose clarity, consistent roots and staged sequencing make attacks and transformation readable |
| Medium | `js/teddy-renderer.js`, `js/teleport.js` | New effects needed reduced-motion behavior | No decorative spin, entrance scaling or Blink fragments; shrink and disappearance retain necessary gameplay cues | Motion restraint preserves the ability's meaning without decorative movement |

## Considered and rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Touch deck | Add a third full row of controls | It would cover the HUD on the smallest 18:9 portrait arena; the fixed lower-row slot keeps existing supporting actions stable |
| Blink sprite | Dissolve between two sprite poses | Existing art uses hard pose changes; clipping gives a clear disappearance without a sprite crossfade |
| Nitro slot | Always show Nitro alongside Blink | The requested contract shows Nitro only at full meter; its reserved slot already prevents reflow |
| Source sprites | Recolor or shrink source PNG pixels | Runtime scaling and clipping preserve the original INJ art and share one teddy atlas between both forms |

## Verification and verdict

- `node tests/structure.cjs`: 28 classic scripts / seven stylesheets pass syntax, resource links, startup order and production-hook checks.
- `node tests/browser.cjs`: **341 Chromium checks pass**. New checks cover actual rendered sprite height/foot anchors, threshold/delay, health/resource retention, all eight attack hit/recovery windows, three separate punches, complete disappearance, all five opponent forms at both arena walls, real simultaneous touch/E input, numbered cooldown, pause/restart/victory, reduced-motion branches and 10% speed animation replay.
- Visually inspected `teddy-normal-320.png`, `teddy-normal-844.png`, `teddy-shrink-2.png`, `teddy-shrink-4.png` and `teleport-phase-3.png`. The generated source PNGs were inspected before alpha bounds were extracted; existing sprite/arena PNGs are unchanged.
- Full fights: 21/100 scripted INJ wins against the revised robot; 29/40 against Blue Velvet. These are scripted outcomes, not human win-rate estimates.
- Not verified: physical iPhone/Safari touch ergonomics, Home Screen interruptions and subjective speaker/headphone listening.

**Approve within the inspected Chromium scope.** No actionable interface-polish findings remain there; the physical-device and listening checks above remain unverified.
