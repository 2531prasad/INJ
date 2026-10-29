# Local progression and Colossus Shield

`localStorage['inj-progress']` holds version 1 of the device-local save:

| Field | Meaning |
| --- | --- |
| `checkpointLevel` | Fresh encounter to resume, 1–5; later giant rounds use 5 |
| `highestLevel` | Highest reached/unlocked encounter, 1–5 |
| `clearedLevels` | Unique completed encounters |
| `wins`, `losses`, `bestCombo` | Lifetime local results |
| `unlocks.colossusBurst` | Persistent earned passive |

`progression.js` owns loading/validation/writes. `state.js` owns the shared `App.progress` object. `initMenus` loads once after every script has registered, resets the saved encounter through `resetRound`, and keeps the profile open/paused. It never restores a partial fight, HP, cooldown, held input or audio playback. Wins checkpoint the next stage; losses checkpoint the same encounter. Goldline resumes from its car, Teddy from normal size, and the Colossus from its enlargement. Normal Restart sets the checkpoint to round one while retaining results and unlocks. Audio keeps its separate `inj-audio` preference record; phone button scale uses the independent `inj-controls` record owned by `controls.js` ([input/UI contract](input.md)).

Writes occur on round reset/result, not every frame. Loading validates types, deduplicates/bounds cleared levels, clamps encounters and sanitizes counters. Corrupt saves recover to defaults. Unknown future versions are left untouched. Blocked/full browser storage cannot stop gameplay; progression then lasts for that session. Saves belong to the same browser/origin; HTTP, hosted and direct-file locations can have separate records. Browser data clearing removes the local save.

Only a player win with the real Colossus at zero HP earns **Colossus Shield**. Entering stage five through `INJ0`, defeating an echo, losing, or defeating a different opponent cannot unlock it. The reward is saved at the KO, before Next Round. Once earned, it is a permanent character ability in every encounter, including earlier levels reached through Restart or the level selector. The existing `unlocks.colossusBurst` save field is retained, so previously earned unlocks still work. Its first victory announces the unlock; later pause menus show its permanent status.

## Passive rules

After unlocking, cumulative actual HP loss equal to **25% of INJ's maximum HP** triggers an automatic defensive burst: **30 damage at 120 maximum HP**, regardless of remaining health or hit count. Guard chip counts by the HP actually lost; invulnerable contacts do not. Waiting, blocking and landing counter-hits never erase charge. Charge caps at the threshold and is consumed at peak growth, with one burst per threshold-crossing damage event and no carried excess. Another full threshold can trigger again after the animation. Lethal damage still loses.

The translucent, noninteractive shield HUD shows charge percentage and a fill bar. At the threshold it displays **SHIELD READY** during the 100 ms growth, then **SHIELD FIRED** for one active second after release before returning to the recharge percentage. It fires automatically; there is no additional action button. Stunned enemies have a **STUN** label and small stars above them. Reduced motion keeps those stars static.

INJ uses the existing knockout/recoil pose, anchored at her current feet. Runtime scale rises from 1× to **2.5× in 0.1 s**, then returns to 1× over **0.3 s**. The temporary hurtbox uses the same scale. The sequence interrupts her hitstun/knockdown, protects her during its 0.4 s, and delays attacks/Blink until it finishes; held movement remains available afterward. It grants no HP, damage, meter or combo hits. No new sprites, recoloring or Doraemon cameo are used.

At peak growth, the attacker that charged the final damage is always pushed away at 290 world units/s and stunned for **one active second**, even at projectile range or during temporary dodge/wakeup protection. Giant hazards retain a reference to their actual caster. Other enemies are affected only when their hurtboxes overlap the vertical burst and lie within 130 world units plus their half-width. Both a nearby boss and echo can be affected. The pulse cancels attacks, dodge/guard/counter actions and temporary invulnerability, leaving a real punish window. All enemy forms use their existing recoil art. `burstStun` is a deliberate exception to the Colossus's ordinary hit poise. Ordinary attacks still cannot stagger it. The stun remains damageable and is not refreshed by normal follow-up hits.

`passive.js` owns damage accumulation, animation timing/scale, pulse, stun and the DOM status. The shared damage path records actual surviving HP loss after guard/armor/KO resolution. The engine steps the passive only in active combat. `controlDummy` dispatches the dedicated stun before any opponent controller, including the giant/echo. Renderers read scale/state and never award unlocks or damage. Pause/hit-stop freeze these clocks. New rounds, retry, Restart and KO clear transient charge/animation/stun while retaining the saved unlock. Goldline transformation and Teddy shrink clear animation/stun but preserve accumulated damage. Partial charge is not saved across reloads. Reduced motion retains the essential size cue without introducing decorative movement.

Verify with `node tests/browser.cjs --suite progression`. This includes actual HTTP/file reloads, earlier-level activation after saved unlock and menu travel, schema/storage failure paths, cheat/echo/loss gating, first-unlock geometry/touch progression, actual HP/chip thresholds, all seven enemy forms, ranged sources, boss hazards/echoes, active-time stun, HUD touch pass-through and a 10% animation replay. Existing long balance simulations explicitly start with the passive locked; they remain opt-in and do not measure human win rates with this reward.
