# Historical v0.15 awakened dummy balance · 19 October 2026

This records the earlier 85% build. See [current v0.17 balance](r8-balance.md) for the 60% level-two target and Goldline encounter. The metrics below belong to that older build; `validation.json` now records the latest run.

Round two onward now targets a difficult, evasive encounter with roughly 85% dummy victories, replacing the previous near-certain defeat tuning. That percentage is design intent, not a measured human win rate. Round one remains the original warmup.

## Encounter rhythm

- One- or two-hit bursts, followed by 650–1050 ms of rest. The first 320 ms cannot be cancelled into an evasion; later in the pause it can dodge a new threat. Landing at the end of an aerial burst also starts this pause.
- Neutral decisions can feint with a back-step. Projectile evasions hop toward the thrower; blocked corner retreats can switch sides. A dodge lasts 180 ms, with a 680 ms cooldown and only 100 ms protection (150 ms against a projectile), then 280–460 ms of rest with a 240 ms guaranteed opening.
- Ground pursuit falls from 310 to 185 world units/s. Active strikes commit rather than instantly escaping or chasing at full speed. Startup is at least 70 ms and recovery at least 180 ms.
- Damage falls from 160% to 125% of base. Incoming damage rises from 30% to 40%; knockback and hitstun have more effect. Landing a hit interrupts its burst. Its later evasions prevent indefinite jab locking while preserving initial punish windows.
- Health and winners are never overridden. Restart still returns to the gentle first round.

## Validation

`node tests/browser.cjs`: **168 checks passed** in Chrome. New checks cover committed strikes, vulnerable dodge recovery, punishable rests, no attacks during those rests, and a recovery pause after landing an aerial strike. Existing phone, gesture, fullscreen, restart, animation, audio and combat checks also pass.

The current benchmark ran **100 fights** across seven scripted policies. Each fight runs until KO or the actual 99-second round clock expires; hit-stop can extend simulated wall time. A five-minute cap fails the benchmark rather than choosing a winner early. Results: **88 dummy wins / 12 INJ wins**.

| Scripted policy | Fights | Dummy wins | INJ wins |
| --- | ---: | ---: | ---: |
| idle | 15 | 15 | 0 |
| punch spam | 15 | 11 | 4 |
| mixed attacks | 14 | 13 | 1 |
| Shadow kiting | 14 | 9 | 5 |
| jumping kicks | 14 | 14 | 0 |
| guard/counter | 14 | 14 | 0 |
| crouch/sweep | 14 | 12 | 2 |

The run recorded 7,387 evasion starts and 1,817 attack starts. The rest-window state was active for 50.1% of simulated frames; this includes airborne, hit-stop and reaction frames and does not mean the dummy stood idle for half of each fight. Raw results are in [validation.json](validation.json).

Scripted policies and simulation randomness affect these results. They establish regression evidence and real win opportunities, not an 85% loss probability for the intended player. Physical-phone playtesting and human difficulty calibration remain unverified.
