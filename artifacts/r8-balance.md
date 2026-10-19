# Current balance · v0.20 · 19 October 2026

The robot should feel almost unbeatable through its decisions, while leaving room to compete. The requested loss goals remain 60% in level two and 65% against the car; the robot goal is now roughly 90%. These guide playtesting. Combat resolves every outcome; no probability selects a winner.

## Encounter rules

- Round one remains gentle. Round two uses 170-unit/s pursuit, 90% reaction chance to eligible threats, a 700 ms dodge cooldown, 750–1150 ms burst rests and a 350 ms initial opening. It takes 65% of incoming base damage, versus 47% before this change. Its health remains 130.
- Goldline's car has 125 HP and takes 85% of incoming damage, versus 140 HP / 60% before. It keeps its low/wide body, dash, hop, rim disc and rear-up attacks. High jabs can miss; low strikes and downward-aimed Shadow reach it.
- Empty car HP starts the protected 2.1-second transformation. Robot reveal refills **INJ to full health**, preserves Shadow charge and Nitro meter (including resources earned by the last car hit), clears the hit combo, reveals the fresh gold life bar and resets the timer to 99. Pause freezes the transition. The robot reserve stays hidden until reveal.
- The robot has **140 HP** and takes **75% of incoming damage**, versus 165 HP / 40% before. Damage reduction is substantially lower. Outgoing damage is 135% of move base, versus 140% before.
- The robot observes attacks with a 120 ms melee reaction delay, recognizes repeated low strikes, guards its rise against a repeated knockdown, uses a reaching jet uppercut against jumps, and closes with a boosted counter against projectiles. It chooses recovery punishes instead of relying entirely on a fixed attack rotation. Shield counters remain guarded during their visible preparation pose, then expose their active/recovery phases normally. Changing attack rhythm and punishing recovery still matter.
- Robot burst rests last 420–720 ms, including a guaranteed first 320 ms opening before it can defend again. Mechanical attacks retain their existing light-hit commitment after 60 ms. Knockdown attacks interrupt outside the shielded counter windup. These pauses and vulnerabilities make the fight competitive without restoring the old health sponge.
- Both phases use a 99-second active clock; expiry loses to the boss. Later rounds repeat Goldline. Restart returns to round one and clears both boss pools, combo and player resources.

## INJ's new tools

Clean consecutive hits within 1.4 seconds deal normal damage, then ×1.1, ×1.2, ×1.3 and onward. Whole-HP rounding occurs before opponent armor. The HUD shows the hit count and latest multiplier. Incoming damage (including chip), an attack being blocked, a melee whiff, timeout, restart or transformation clears the chain. Invalid/invulnerable contacts do not extend it.

Down + forward + Kick slides without spending meter; down + Kick retains the sweep. Each clean hit adds 20 Nitro energy and each unblocked hit taken adds 6, capped at 100. NITRO / Q spends 100 on a fast phase-style forward Nitro Kick from standing, crouching or midair; crouching selects a low strike. Its 60 ms startup, 160 ms active burst at 660 units/s and 260 ms recovery retain 105.6 units of travel. It can miss or be blocked, and uses existing authored sweep/flying-kick art with sharp coil/strike/recoil changes and short echoes/streaks. Reduced motion removes the decoration. The Nitro button appears only at full meter, in a reserved slot above the larger primary strikes; supporting icon-and-label controls stay fixed. The combo graphic has no background panel. Shadow's separate three-hit charge is preserved. Airborne Shadow aims at the opponent when released and does not home afterward.

## Latest scripted checks

`node tests/structure.cjs` passes 24 classic scripts and seven stylesheets. `node tests/browser.cjs` passes **253 Chromium checks**, including direct-file/HTTP production startup, genuine multitouch, smallest-phone control separation, combo arithmetic/reset rules, meter spending, all three Nitro stances, actual NITRO touch / Q input, airborne Shadow, both boss forms, health refill/resource retention, protected transformation, readable reaction delay, repeated-low defense, shield counters, recovery punishment and pauses.

| Encounter | Intended player-loss goal | Scripted opponent wins | INJ wins |
| --- | ---: | ---: | ---: |
| Level two · Dummy | 60% | 56/100 | 44/100 |
| Goldline · car | 65% | 42/100 | 58/100 |
| Goldline · robot | 90% | 82/100 | 18/100 |

| Policy | Dummy wins | Car wins | Robot wins |
| --- | ---: | ---: | ---: |
| idle | 15/15 | 15/15 | 15/15 |
| punch spam | 7/15 | 13/15 | 15/15 |
| mixed attacks | 9/14 | 0/14 | 14/14 |
| Shadow kiting | 0/14 | 0/14 | 10/14 |
| jumping kicks | 0/14 | 0/14 | 14/14 |
| guard/counter | 14/14 | 14/14 | 0/14 |
| crouch/sweep | 11/14 | 0/14 | 14/14 |

The robot's measured scripted result remains below the requested 90% goal; this UI/animation change does not retune its AI. The car is easier than its earlier 65% goal after reducing its health and armor; no human rate is claimed for either form. These seven simple policies run to KO, phase clear or the actual 99-second timer, with a five-minute simulation cap that fails rather than choosing a winner. Each isolated boss test starts with fresh INJ health, now matching the real robot reveal. The policies do not use Nitro or aerial Shadow, and are not adaptive human opponents. Shared seeded randomness also serves effects, so frame/setup cadence changes exact counts. Raw results: [validation.json](validation.json).

## Art, ownership and limits

No source image pixels were edited. The existing sixteen-pose Goldline atlas, INJ/Dummy atlases, walking art and stage plate are preserved. [Current sprite provenance](../assets/r8-generation-v2.md). [Combo / Nitro HUD preview](combo-nitro-phone.png), [Nitro pose preview](nitro-kick-phone.png), [phase sequence](nitro-phase-sequence.png), [interface review](ui-polish-review.md).

Move data/tuning lives in `js/content.js` and `js/r8-content.js`; shared damage, combos and Nitro travel in `js/combat.js`; player dispatch in `js/movement.js`; form rules in `js/encounters.js`; robot decisions in `js/r8.js`; pose selection in `js/fighters.js`. `tests/abilities.cjs` and `tests/r8.cjs` add targeted browser checks to the main runner. The source map and current game guide reflect these boundaries.

Physical-phone ergonomics, Safari behavior and subjective audio listening remain unverified. Chromium emulation and scripted fights do not establish human win rates. Earlier balance reports and the original extraction comparison are historical.
