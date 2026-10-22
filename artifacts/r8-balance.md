# Current balance · v0.22 · 22 October 2026

The robot target is now roughly **20% INJ wins / 80% player losses**. Every result comes from combat; no probability selects the winner. The other existing loss goals remain 60% for awakened Dummy and 65% for the car. Blue Velvet has no requested win-rate target.

## Goldline changes

- The car remains 125 HP. Clearing it starts its separate protected transformation, refills INJ health at robot reveal, preserves Shadow, Nitro and Blink cooldown, and reveals a fresh robot bar and 99-second clock.
- The robot stays at **140 HP**, takes **85% of incoming base damage** (previously 75%), and deals **130% of move base** (previously 135%). Its burst rests last **480–780 ms**, including a guaranteed initial 320 ms opening before defense resumes.
- Repeated-low recognition, anti-air, committed engine attacks, shields and recovery punishes remain. Ground shield beats vary from 160–300 ms. After a stagger, the robot waits an additional 10–65 ms before its next offensive decision. Timing variation makes exchanges competitive without increasing its health.
- Both phases must be cleared within their active 99-second clocks. Car clears do not open victory. Robot wins open the player-paced victory scene; Next Round advances to Blue Velvet. Restart clears both pools and returns to round one.

## Latest scripted results

`node tests/structure.cjs` passes **28 classic scripts / seven stylesheets**. `node tests/browser.cjs` passes **345 Chromium checks**.

| Encounter | Intended player-loss goal | Opponent wins | INJ wins |
| --- | ---: | ---: | ---: |
| Awakened Dummy | 60% | 52/100 | 48/100 |
| Goldline car | 65% | 39/100 | 61/100 |
| Goldline robot | 80% | 79/100 | 21/100 |
| Blue Velvet, full encounter | Unspecified | 11/40 | 29/40 |

| Basic policy | Car wins | Robot wins |
| --- | ---: | ---: |
| idle | 15/15 | 15/15 |
| punch spam | 10/15 | 15/15 |
| mixed attacks | 0/14 | 14/14 |
| Shadow kiting | 0/14 | 4/14 |
| jumping kicks | 0/14 | 14/14 |
| guard/counter | 14/14 | 3/14 |
| crouch/sweep | 0/14 | 14/14 |

The isolated R8 benchmarks use a fresh INJ life for each form and seven simple policies, without Blink, Nitro or aerial Shadow. Each trial has its own fixed random seed (8000 + trial, plus 1000 for robot), so other tests do not change the robot result. Outcomes run to real KO/phase clear/timeout; exceeding the five-minute simulation cap fails the test. The robot result is **21 INJ wins / 79 robot wins**, close to the requested 20/80. The car remains easier than its original goal. These policies do not measure human win rates or establish balance for every ability.

## Blue Velvet and Blink

Blue Velvet has one 140 HP pool with no armor multiplier. Its neutral sprite is 123.2 world units tall, 10% taller than INJ. At ≤67% HP it samples one 0.45–1.5-second delay, then Doraemon arrives and fires the shrink ray. The protected 2.35-second scene preserves remaining HP, INJ resources, fight time and cooldown. It ends at 34% of normal height, without a new life. Tiny attacks use quick low punching chains, leaping punches, anti-air and spinning slams, with reaction-delayed defense and punishable pauses.

The forty full Teddy fights produced 30 shrink events, 74 tiny attacks, 8 Blinks and 20 Nitro kicks. Their four policies include idle, low pressure, Shadow kiting plus Blink, and mixed attacks plus Nitro/Blink. Thirty encounters reached the shrink scene; no scripted winner selection was used.

BLINK / E is available standing, crouching or airborne while free to act. The 460 ms disappearance/reappearance relocates at 190 ms and creates rear space at a wall without damage. Enemies keep their last seen facing during Blink. Its ten-second cooldown starts on activation, advances in active fight time, freezes in pause/hit-stop/cutscenes, survives transformations, and resets each round/restart. Phone controls keep a visible numbered cooldown in a fixed slot; Nitro still appears only when ready.

## Art and verification boundary

New assets and exact built-in ImageGen prompts are recorded in [teddy-generation.md](../assets/teddy-generation.md). Existing source artwork is unchanged. New modules are `js/teddy.js`, `js/teddy-renderer.js` and `js/teleport.js`; the current [architecture guide](../docs/architecture.md) describes their APIs and dependencies.

[Normal teddy](teddy-normal-844.png), [shrink ray](teddy-shrink-2.png), [tiny form](teddy-shrink-4.png), [teleport reappearance](teleport-phase-3.png), [interface review](teddy-teleport-review.md), [raw validation](validation.json).

The suite checks untouched HTTP/file startup, real Chromium multitouch, all opponent forms at both walls, actual sprite-height/anchor pixels, eight move hit/recovery windows, three real barrage hits, cooldown/phase retention, player-paced victory, reduced-motion decoration, and ten-percent-speed staged animation replay. Chrome emulation does not establish physical iPhone/Safari behavior. Subjective speaker/headphone listening remains unverified. Earlier reports are historical.
