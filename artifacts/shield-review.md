# Colossus Shield · v0.33

The permanent Colossus reward now fires after cumulative actual damage equal to 25% of INJ's maximum HP (30 at 120 HP), replacing the three-hit/time-window condition. Guard chip counts; counters and gaps retain charge. The earned version-1 save flag is unchanged, so old unlocks apply on every level after Restart, menu level selection and reload.

At the 100 ms peak of the existing 2.5× enlargement, the triggering attacker is knocked back and stunned for one active second, including ranged attackers and temporarily protected enemies. Nearby other enemies can also be affected. Giant hazard source clones retain the actual caster. Attacks/guard/dodge/counters are cancelled and invulnerability is cleared to leave an opening. Normal giant hit poise is unchanged. The 300 ms shrink, no healing/damage and no lethal rescue rules remain.

The translucent shield badge shows percentage/fill, READY during growth and FIRED for one active second after release. Enemies show STUN and small stars, static under reduced motion. At compact portrait sizes, the badge stacks its icon and label to stay clear of the skill buttons. It never intercepts touches.

## Validation

`node tests/browser.cjs --suite progression,combat,giant,menus --artifacts` passed structure plus **287 checks in 33.66 s**. The runner covered untouched HTTP/file startup, real save/reload and earlier-level menu travel, actual damage/chip thresholds, custom maximum HP, all seven enemy forms, ranged sources, boss hazards/echoes, one-second engine-driven stun, pause/hit-stop, phase charge retention, input/abilities/victory/menus and boss targeting. [Runner record](validation-quick.json).

Visual review caught a compact-phone badge overlap. After the spacing fix, the same `tests/passive.cjs` was run through `tests/harness.cjs`: **58 assertions passed, zero browser errors**, including native touch pass-through and skill-button exclusion at 320/844 px. The test fixture also resumes the actual menu before freezing simulation, so previews show combat rather than an obscuring pause panel. No production test hooks were added.

| Ready | Fired / stun |
| --- | --- |
| [320 px](shield-ready-320.png) | [320 px](shield-stun-320.png) |
| [844 px](shield-ready-844.png) | [844 px](shield-stun-844.png) |

The 10% animation replay preserves foot/root anchors and matching sprite/hurtbox scale. Previously earned unlocks retain the existing storage key; only transient charge resets on a new encounter/reload. Goldline transformation and Teddy shrink preserve partial charge.

No fight simulations, audio renders or exhaustive suite were run. Chromium emulation does not establish physical iPhone/Safari behavior or human balance. Source sprites and stage assets are unchanged.
