# Local progression and Colossus Burst

`localStorage['inj-progress']` holds version 1 of the device-local save:

| Field | Meaning |
| --- | --- |
| `checkpointLevel` | Fresh encounter to resume, 1–5; later giant rounds use 5 |
| `highestLevel` | Highest reached/unlocked encounter, 1–5 |
| `clearedLevels` | Unique completed encounters |
| `wins`, `losses`, `bestCombo` | Lifetime local results |
| `unlocks.colossusBurst` | Persistent earned passive |

`progression.js` owns loading/validation/writes. `state.js` owns the shared `App.progress` object. `initMenus` loads once after every script has registered, resets the saved encounter through `resetRound`, and keeps the profile open/paused. It never restores a partial fight, HP, cooldown, held input or audio playback. Wins checkpoint the next stage; losses checkpoint the same encounter. Goldline resumes from its car, Teddy from normal size, and the Colossus from its enlargement. Normal Restart sets the checkpoint to round one while retaining results and unlocks. Audio keeps its existing separate `inj-audio` preference record.

Writes occur on round reset/result, not every frame. Loading validates types, deduplicates/bounds cleared levels, clamps encounters and sanitizes counters. Corrupt saves recover to defaults. Unknown future versions are left untouched. Blocked/full browser storage cannot stop gameplay; progression then lasts for that session. Saves belong to the same browser/origin; HTTP, hosted and direct-file locations can have separate records. Browser data clearing removes the local save.

Only a player win with the real Colossus at zero HP earns **Colossus Burst**. Entering stage five through `INJ0`, defeating an echo, losing, or defeating a different opponent cannot unlock it. The reward is saved at the KO, before Next Round. Its first victory announces the unlock; later pause menus show the saved passive status.

## Passive rules

After unlocking, three consecutive unblocked hits trigger an automatic defensive burst. Each hit must be within two active fight seconds of the previous hit. Blocking, landing an unblocked counter-hit or allowing the window to expire clears the count. Invalid/invulnerable contacts do not count. A lethal third hit still loses.

INJ uses the existing knockout/recoil pose, anchored at her current feet. Runtime scale rises from 1× to **1.6× in 0.1 s**, then returns to 1× over **0.3 s**. The temporary hurtbox uses the same scale. The sequence interrupts her hitstun/knockdown, protects her during its 0.4 s, and delays attacks/Blink until it finishes; held movement remains available afterward. It grants no HP, damage, meter or combo hits. No new sprites, recoloring or Doraemon cameo are used.

At peak growth, enemies whose hurtboxes overlap the vertical burst and lie within 130 world units plus their half-width are pushed away at 290 world units/s and stunned for **one active second**. Both a nearby boss and echo can be affected; distant or invulnerable enemies are not. All enemy forms use their existing recoil art. `burstStun` is a deliberate exception to the Colossus's ordinary hit poise. Ordinary attacks still cannot stagger it. The stun remains damageable and is not refreshed by normal follow-up hits.

`passive.js` owns chain counting, animation timing/scale, pulse and stun. The shared damage path records only eligible hits after damage/KO resolution; player clean hits and blocks clear the incoming chain. The engine steps the passive only in active combat. `controlDummy` dispatches the dedicated stun before any opponent controller, including the giant/echo. Renderers read scale/state and never award unlocks or damage. Pause/hit-stop freeze these clocks; restart, KO, transformation and shrink clear transient burst state while retaining the unlock. Reduced motion retains the essential size cue without introducing decorative movement.

Verify with `node tests/browser.cjs --suite progression`. This includes actual HTTP/file reloads, schema/storage failure paths, cheat/echo/loss gating, first-unlock geometry/touch progression, timing, all seven enemy forms and a 10% animation replay. Existing long balance simulations explicitly start with the passive locked; they remain opt-in and do not measure human win rates with this new reward.
