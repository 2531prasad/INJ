# Local save and Colossus Burst · v0.28 · 29 October 2026

The versioned `inj-progress` local save retains fresh-stage checkpoints, reached/cleared stages, lifetime results, best combo and the earned Colossus Burst. Reload remains behind the paused profile. A genuine zero-HP Colossus win saves the unlock immediately; restart retains it. Corrupt/malformed/blocked/future storage and HTTP/direct-file reload paths are covered. [Contract](../docs/progression.md).

The defensive passive triggers after three consecutive unblocked hits with a two-second maximum gap between hits. A block or clean counter-hit resets the chain. INJ scales to 1.6× in 0.1 seconds and back over 0.3 seconds using the existing recoil/KO pose. At peak, nearby enemies are pushed away and stunned for one active second. This earned effect can interrupt even the giant; ordinary attack poise remains. No new sprites, health, damage, meter or combo hits are added. A lethal third hit still loses.

## Validation

`node tests/browser.cjs --suite progression,combat,giant,menus --artifacts` passed structure (32 classic scripts / seven stylesheets) and **258 focused Chromium checks in 41.13 seconds**. Coverage includes real save/reload (HTTP and direct file), checkpoints/results, actual unlock vs cheat/echo/loss cases, corrupt/malformed/unavailable/future storage, one-second stun across all seven enemy forms, both nearby boss/echo targets, chain resets, distance/protection/lethal-hit rules, pause/hit-stop/reset/transform behavior, existing inputs/touch/abilities/victory/boss/menu checks, and a 10% burst replay. [Recorded results](validation-quick.json).

No exhaustive suite, long fight simulations, offline audio renders or human balance estimates were run. Legacy simulations explicitly start with the passive locked, preserving their baseline. The rerendered unrelated ability/menu previews were restored; only the new burst/unlock captures belong to this update. Existing authored image assets are unchanged.

## Interface review

Full review scope: first-unlock victory notice, persistent pause-menu status and essential burst/recoil motion. Existing plain CSS, Canvas renderer and authored atlases; no second styling system, new icon library or animation asset. Selected frames and phone layouts were inspected directly.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Compact unlocked victory variant at 320/844 px, pause status using existing Chakra/gold text | Clear; hierarchy stays within the arena and Next Round remains readable |
| Surfaces | Existing victory/pause panels, parent-arena bounds and actual Next Round tap | Clear; no extra buttons or HUD panels; 44 px Next Round retained |
| Animations | 41-step 10% replay, peak/return captures, anchored root, old pose 10, matching hurtbox scale, timed AI stun | Clear; semantic 0.1 s growth / 0.3 s shrink, no new decorative motion or sprite crossfades |
| Icons | Text-only reward/status; existing seven combat actions unchanged | Clear within scope; no new icons needed |
| Performance | Event-only JSON writes, single runtime actor pulse/scale, bounded two-target query, existing cached art | Clear by source inspection; no per-frame storage/image loading; no new FPS benchmark claimed |

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `styles/dialogue.css:353`, `tests/progression.cjs:59` | Added unlock text pushed Next Round below the clipped 320 px arena; viewport-only checks missed it | Compact spacing/type only for the unlocked variant, geometry checked against the arena, and real Next Round tap | Preserve minimum hit area and reachable progression |
| MEDIUM | `js/fighters.js:211`, `js/passive.js:39` | No visible earned defensive reaction or shared expansion scale | Foot-anchored runtime growth, existing recoil art and the same hurtbox scale | Visible motion matches the actual ability state |
| LOW | `js/menus.js:218`, `js/progression.js:77`, `index.html:151` | No persistent reward feedback | One-time victory announcement and quiet saved-passive line in pause | Clear unlock state without moving the phone action deck |

| Location | Considered | Rejected because |
| --- | --- | --- |
| Passive activation | New sprite atlas or Doraemon transformation scene | User requested existing art and a fast automatic response |
| HUD | Another charge bar / action button | The ability is passive; seven existing controls retain familiar positions and the menu stays compact |
| Saving | Mid-fight actor snapshots or frame-by-frame writes | Fresh encounter checkpoints are predictable and avoid restoring transient attacks/input |

Visual evidence: [normal/recoil](burst-replay-0.png), [1.6× peak](burst-replay-10.png), [shrinking](burst-replay-25.png), [returned size](burst-replay-40.png), [320 px unlock](burst-unlock-320.png), [landscape unlock](burst-unlock-844.png), [saved pause status](burst-pause-unlocked.png). Essential growth remains under reduced motion; no optional motes, flashes or camera movement were added.

**Approve** — no actionable findings remain in this scope. Not verified: physical iPhone/Safari/storage policies, subjective audio/feel, multi-tab synchronization and human difficulty with the earned passive.
