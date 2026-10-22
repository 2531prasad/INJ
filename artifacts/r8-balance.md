# Current balance · v0.24 · 23 October 2026

The robot target is now roughly **20% INJ wins / 80% player losses**. Every result comes from combat; no probability selects the winner. The other existing loss goals remain 60% for awakened Dummy and 65% for the car. Blue Velvet has no requested win-rate target.

## Goldline changes

- The car remains 125 HP. Clearing it starts its separate protected transformation, refills INJ health at robot reveal, preserves Shadow, Nitro and Blink cooldown, and reveals a fresh robot bar and 99-second clock.
- The robot stays at **140 HP**, takes **85% of incoming base damage** (previously 75%), and deals **130% of move base** (previously 135%). Its burst rests last **480–780 ms**, including a guaranteed initial 320 ms opening before defense resumes.
- Repeated-low recognition, anti-air, committed engine attacks, shields and recovery punishes remain. Ground shield beats vary from 160–300 ms. After a stagger, the robot waits an additional 10–65 ms before its next offensive decision. Timing variation makes exchanges competitive without increasing its health.
- Both phases must be cleared within their active 99-second clocks. Car clears do not open victory. Robot wins open the player-paced victory scene; Next Round advances to Blue Velvet. Restart clears both pools and returns to round one.

## Latest scripted results

`node tests/structure.cjs` passes **30 classic scripts / seven stylesheets**. `node tests/browser.cjs` passes **441 Chromium checks**.

| Encounter | Intended player-loss goal | Opponent wins | INJ wins |
| --- | ---: | ---: | ---: |
| Awakened Dummy | 60% | 51/100 | 49/100 |
| Goldline car | 65% | 39/100 | 61/100 |
| Goldline robot | 80% | 79/100 | 21/100 |
| Blue Velvet, full encounter | Unspecified | 11/40 | 29/40 |
| Velvet Colossus, full boss | Moderate | 10/30 | 20/30 |

| Basic policy | Car wins | Robot wins |
| --- | ---: | ---: |
| idle | 15/15 | 15/15 |
| punch spam | 10/15 | 15/15 |
| mixed attacks | 0/14 | 14/14 |
| Shadow kiting | 0/14 | 4/14 |
| jumping kicks | 0/14 | 14/14 |
| guard/counter | 14/14 | 3/14 |
| crouch/sweep | 0/14 | 14/14 |

The awakened Dummy benchmark now seeds each trial independently at **1993 + trial**, so newly added previews/tests cannot shift its random stream. Boss preview tests restore the normal 450-unit portrait arena before legacy balance checks.

The isolated R8 benchmarks use a fresh INJ life for each form and seven simple policies, without Blink, Nitro or aerial Shadow. Each trial has its own fixed random seed (8000 + trial, plus 1000 for robot), so other tests do not change the robot result. Outcomes run to real KO/phase clear/timeout; exceeding the five-minute simulation cap fails the test. The robot result is **21 INJ wins / 79 robot wins**, close to the requested 20/80. The car remains easier than its original goal. These policies do not measure human win rates or establish balance for every ability.

## Blue Velvet and Blink

Blue Velvet has one 140 HP pool with no armor multiplier. Its neutral sprite is 123.2 world units tall, 10% taller than INJ. At ≤67% HP it samples one 0.45–1.5-second delay, then Doraemon arrives and fires the shrink ray. The protected 2.35-second scene preserves remaining HP, INJ resources, fight time and cooldown. It ends at 34% of normal height, without a new life. Tiny attacks use quick low punching chains, early leaping punches, anti-air and spinning slams. The AI learns low patterns even while hurt/down, physically hops over sweeps, mixes slide guards/counters, escapes corners and can hop during punch recovery after recognizing crouched follow-ups. Pursuit is faster and pauses are shorter, retaining a 220 ms initial tiny opening. High/aerial attacks and Shadow can hit the hop. Health, damage and armor values are unchanged. The shrink scene clears interrupted defensive actions while preserving learned low pressure.

The forty full Teddy fights produced 30 shrink events, 205 tiny attacks, 20 Blinks and 20 Nitro kicks. Their four policies include idle, low pressure, Shadow kiting plus Blink, and mixed attacks plus Nitro/Blink. Thirty encounters reached the shrink scene; no scripted winner selection was used. A separate twenty-fight tiny-phase benchmark starts Teddy at 93 HP against full-health INJ: ten repeated crouched-Kick policies and ten repeated forward+crouched-Kick slide policies. Those policies win **0/20** trials, with 149 physical dodges and 17 guards. The full encounter still allows varied strategies to win; these fixed policies are regression checks, not human balance estimates.

BLINK / E is available standing, crouching or airborne while free to act. The 460 ms disappearance/reappearance relocates at 190 ms and creates rear space at a wall without damage. Enemies keep their last seen facing during Blink. Its ten-second cooldown starts on activation, advances in active fight time, freezes in pause/hit-stop/cutscenes, survives transformations, and resets each round/restart. Phone controls keep a visible numbered cooldown in a fixed slot; Nitro still appears only when ready.

## Velvet Colossus

Round five is a standalone 480 HP boss after Blue Velvet's player-paced victory. A protected 4.8-second Doraemon enlargement grows Teddy to 2× base height while the camera pulls back to 0.6. INJ keeps her world model and starts at full health. This stage has no round timer; combo, Blink and AI clocks still run. The boss takes full damage without flinch, knockback, canceled attacks or attacker-induced hit-stop.

Kingdom Breaker winds up for 1.15 seconds, tracks only until 550 ms, then locks facing. Guard takes 4 chip instead of 20 damage, and timed rear Blink avoids the committed strike. Its 1.4-second recovery plus subsequent rest creates a long opening. Royal Footfall sends jumpable/guardable ground waves. Falling Ovation places fixed star markers to move away from. Royal Recess retreats for at most 850 ms, calls one awakened 40 HP echo, and rests for up to seven seconds; echo defeat shortens the break. The echo uses awakened AI and normal flinch/knockdown, expires after ten active seconds, can be hit independently, never completes the boss on KO, and can cause a real INJ loss. Boss KO/retry/restart clears its fields. A loss retries the enlargement, rather than going back to round four.

The thirty seeded boss fights (17000 + trial) produce **20 INJ wins / 10 boss wins**: idle 0/10 INJ wins, reckless pressure 10/10, and prepared guard/Blink/punish 10/10. They exercise 31 summons, 50 smashes and 10 Blinks. This deliberately forgiving result supports the brief's moderate boss rather than the Goldline difficulty target; it does not establish human balance. [Boss visuals, behavior and review](giant-review.md).

The original 88 BPM boss arrangement has an offline [music preview](boss-score-preview.wav), with finite audible samples, no clipping and no silent arrangement bars. It uses different note/instrument patterns from the normal 112 BPM arcade score. Speaker/headphone listening remains unverified.

## Art and verification boundary

Teddy sprites and exact built-in ImageGen prompts are recorded in [teddy-generation.md](../assets/teddy-generation.md); the first four opponent-themed plates have [separate stage provenance](../assets/stage-generation.md). The new [giant plate and smash/recess poses](../assets/giant-generation.md) have separate prompts/hashes; existing source artwork remains unchanged. Boss behavior and presentation live in the two cohesive `giant.js` / `giant-renderer.js` modules, with shared combat, round flow, camera bounds and audio integration; the current [architecture guide](../docs/architecture.md) describes their APIs and dependencies.

[Stage/defense review](stages-and-defense-review.md), [normal teddy](teddy-normal-844.png), [shrink ray](teddy-shrink-2.png), [tiny form](teddy-shrink-4.png), [teleport reappearance](teleport-phase-3.png), [interface review](teddy-teleport-review.md), [raw validation](validation.json).

Losses now retry the current level; robot losses restart the car and tiny Teddy losses restart full-size Teddy. Only victory confirmation advances.

The suite checks untouched HTTP/file startup, same-level KO/timeout retries, no-timer boss combat/retry, five distinct stage images and fallback/late-load handling, learned low-pressure physics, real Chromium multitouch, all opponent forms at both walls, actual sprite-height/anchor pixels, eight move hit/recovery windows, three real barrage hits, cooldown/phase retention, player-paced victory, reduced-motion decoration, and ten-percent-speed staged animation replay. Chrome emulation does not establish physical iPhone/Safari behavior. Subjective speaker/headphone listening remains unverified. Earlier reports are historical.
