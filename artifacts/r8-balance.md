# Current balance · v0.18 · 19 October 2026

The requested player-loss targets are 60% in level two, 65% against the car form, and 85% against the robot form. These guide attack timing, damage, armor and decisions; no probability selects a winner. Human loss rates remain unmeasured.

## Encounter rules

- Round one remains the gentle Dummy. Round two uses the softer awakened profile: 160-unit/s pursuit, 80% reaction chance to eligible threats, 850 ms dodge cooldown, 820–1220 ms burst rests and a 400 ms initial opening. Incoming damage is 47% of base, versus 40% in the older 85% build; outgoing damage is 115%, versus 125%. One/two-hit bursts and punishable evasions remain.
- Round three introduces Goldline: cute turquoise Audi R8, gold rims, low/wide collision body. Car HP is 140. High jabs can miss; low punches and sweeps connect, and Shadow aims down without an additional input. Dash, thruster hop, rim disc and temporary rear-up strike use separate authored poses.
- Empty car HP starts a protected 2.1-second transformation. Attacks, projectiles and held input clear; pause freezes the transition. Robot HP starts at 165. INJ keeps her remaining HP and charge, including charge earned by the phase-ending hit. Only the current life is visible in the HUD. The robot reserve and phase numbering stay concealed through the empty car bar; the reveal replaces it with a full gold bar and resets the clock to 99 seconds.
- The robot uses piston punches, axle kicks, boosted crosses, jet uppercuts and orbital slams. It can wheel-shield predictable projectiles, sweeps and airborne approaches, then counter. The aerial threat can renew on subsequent leaps.
- Mechanical attacks commit after 60 ms: light hits still deal damage, but cannot repeatedly reset the winding-up attack. Knockdown moves can interrupt. Both forms retain recovery windows.
- Each boss phase has a 99-second active clock; expiry loses to the boss, so the second health pool cannot be bypassed by waiting. Real boss wins require clearing both pools. Later rounds repeat Goldline; Restart clears both forms and returns to round one.

## Latest scripted checks

`node tests/structure.cjs` passes 24 classic scripts and seven stylesheets. `node tests/browser.cjs` passes **211 Chromium checks**, including genuine multitouch, gesture/fullscreen/restart flows, both forms, low-target collisions, one-hit attacks, engine commitment, shield counters, concealed/revealed health, a 12.3-to-99 timer reset, transformation/pause, retained health/charge, timeout, phone resize, hard pose changes and audio-node cleanup.

| Encounter | Intended loss target | Scripted opponent wins / 100 | INJ wins |
| --- | ---: | ---: | ---: |
| Level two · Dummy | 60 | 55 | 45 |
| Goldline · car | 65 | 64 | 36 |
| Goldline · robot | 85 | 86 | 14 |

Each benchmark uses seven simple policies and runs to KO, phase clear or the actual 99-second timer. A five-minute simulation cap fails instead of choosing a winner early. Boss phases start with fresh INJ health for isolated comparison; the real two-phase encounter carries health and is therefore more demanding. The jumping-kick policy now waits until airborne to queue the kick, avoiding the old policy issue where kicking on the ground could prevent the jump. Old benchmark percentages are not directly comparable.

| Policy | Dummy wins | Car wins | Robot wins |
| --- | ---: | ---: | ---: |
| idle | 15/15 | 15/15 | 15/15 |
| punch spam | 8/15 | 15/15 | 15/15 |
| mixed attacks | 8/14 | 11/14 | 14/14 |
| Shadow kiting | 2/14 | 9/14 | 14/14 |
| jumping kicks | 0/14 | 0/14 | 0/14 |
| guard/counter | 14/14 | 14/14 | 14/14 |
| crouch/sweep | 8/14 | 0/14 | 14/14 |

These are regression probes, not calibrated human play. Policies have obvious weaknesses and do not adapt. Shared seeded randomness is also consumed by effects, so frame/setup cadence can change exact counts between runs. Physical phone ergonomics, Safari behavior and subjective audio listening are unverified. Use real playtesting before treating any target percentage as achieved. Raw results: [validation.json](validation.json).

## Art and ownership

The sixteen-pose atlas was generated first with built-in ImageGen, then used to implement the moves. [Current turquoise/cute asset and exact edit prompts](../assets/r8-generation-v2.md); [car preview](r8-car-phone.png), [robot preview](r8-robot-phone.png). Source PNG pixels, INJ/Dummy art and the stage plate are preserved.

Tuning lives in `js/r8-content.js`; form selection/transformation in `js/encounters.js`; car/robot decisions and move physics in `js/r8.js`; atlas rendering and the current-life bar in `js/r8-renderer.js`. Shared combat owns damage. `tests/r8.cjs` owns the boss checks.

The earlier [85% Dummy report](opponent-balance.md) is historical.
