# Encounter stages and low-kick defense · v0.23 · 23 October 2026

Losses now retry the same level after MiMi. Both Fight Again and Skip use the retry path; winning and confirming Next Round is the progression path. KO and timeout retries are checked for all four encounters, including robot → car and tiny Teddy → full-size Teddy resets.

## Stage review

| Opponent | Environment | Desktop | Phone |
| --- | --- | --- | --- |
| Dummy | Cedar Courtyard: warm cedar, training equipment, mountain dawn | [Preview](stage-1-desktop.png) | [Preview](stage-1-phone.png) |
| Awakened Dummy | Storm Sanctum: guardian reliefs, lightning, a distant bridge duel | [Preview](stage-2-desktop.png) | [Preview](stage-2-phone.png) |
| Goldline car / robot | Goldline Foundry: turquoise power, gold machinery, neon city | [Preview](stage-3-desktop.png) | [Preview](stage-3-phone.png) |
| Blue Velvet, both sizes | Toybox Opera: blue velvet, music-box gears, theatrical night sky | [Preview](stage-4-desktop.png) | [Preview](stage-4-phone.png) |

All eight captures were visually inspected. The backgrounds have a clear foreground lane, grounded fighter feet, readable central silhouettes and no baked-in opponents/UI. The phone layout retains the fixed control deck. The foundry persists across Goldline's transformation and the theatre persists through shrinking and later Teddy rounds. Only the sanctum carries the cosmetic distant duel. The four source plates are unchanged 1672×941 PNG outputs; [exact prompts/hashes](../assets/stage-generation.md).

## Teddy defense

The previous controller only sometimes blocked: its dodge fields were never used. It also forgot attacks seen while knocked down and returned to a long idle wakeup, making repeated sweeps especially effective.

The new controller recognizes two low strikes within a four-second memory window, including attacks seen while hurt/down. It physically hops over sweeps, mixes hops and brief guarded counters against slides, guards out of repeated crouch-punch pressure, and hops across an attacker when cornered. Leaping attacks begin rising during their windup. After a punching burst, recognized crouch pressure can trigger a recovery hop; the attack recovery still runs. Pursuit is faster and burst rests are shorter, retaining a 220 ms initial opening in tiny form. A hop has no added invulnerability, and a high kick demonstrably hits the airborne hurtbox. HP remains 140, damage/armor rules remain shared, and the same source sprites supply the new poses. Varied high attacks reduce the low read; the memory expires if pressure stops.

The focused real-engine benchmark starts tiny Teddy at 93 remaining HP against a fresh INJ life. Ten trials repeatedly press crouched Kick, and ten repeatedly press forward + crouched Kick (slide). Seeds are 7200–7219, at 60 simulation steps/second. The complete forty-fight benchmark separately exercises full-size combat, random shrink, tiny combat, Blink and Nitro. These fixed policies demonstrate the exploit response; they do not estimate human win rates. Current counts and outcomes are in [validation.json](validation.json) and [balance notes](r8-balance.md).

## Verification boundary

`node tests/structure.cjs` and `node tests/browser.cjs` cover classic-script startup, untouched HTTP/direct-file launching, actual local stage images, distinct baked pixels, late-load/fallback behavior, responsive geometry, genuine Chromium multitouch, KO/timeout retries, victory-only progression, low-memory/wakeup/corner physics, interrupt cleanup during shrinking, and real mixed-policy combat. Existing Goldline health/refill and balance checks remain in the suite. Physical iPhone/Safari behavior and subjective audio remain unverified.
