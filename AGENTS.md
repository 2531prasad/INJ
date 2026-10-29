# Working on INJ

Read [inj.md](inj.md) for current behavior, then [docs/architecture.md](docs/architecture.md) to find the owning file. Read only the relevant subsystem and its dependencies; the historical design archive is not the implementation contract.

## Source conventions

- Plain HTML, CSS and classic JavaScript. Keep direct `file://` opening and static hosting working. There is no build step, module fetcher or production package dependency.
- `index.html` owns markup and the ordered `defer` script / stylesheet links. `js/main.js` starts the systems once, after registration.
- Each JavaScript file has a private IIFE scope and exports its shared API with `Object.assign(App, …)`. `App` is `window.INJ`. Use `App.method()` for cross-file calls; do not introduce implicit globals or copy shared state.
- Shared actor/game objects live in `js/state.js`. Read dynamic width from `App.world.width` and frame time from `App.clock.last`; do not cache those numbers across resizes or resumes. `H` remains 225.
- Keep initialization in `initControls`, `initMenus`, `initDisplay` and `startEngine`. Function registration must finish before listeners, observers and the animation loop start.
- The CSS cascade order in `index.html` is intentional. Later responsive/immersive rules override earlier base styles. Preserve the order when editing or extracting rules.
- Use two-space indentation and the formatting settings in `.editorconfig` / `.prettierrc.json`. Formatting does not require adding a build system.

## Find the right file

| Change | Start here |
| --- | --- |
| Opponent decisions, dodges, pauses, difficulty | `js/opponent.js` for Dummy, `js/r8.js` for Goldline, `js/teddy.js` for Blue Velvet, `js/giant.js` for the Colossus; tuning in `js/r8-content.js`, damage in `js/combat.js` |
| Attack damage, hitboxes, timing, combo scaling | `js/content.js`, `js/r8-content.js`, `js/teddy.js`, `js/combat.js` |
| Joystick, jump wedge, keyboard, Nitro input, input buffering | `js/controls.js`; physics in `js/movement.js` |
| Local save / checkpoints / permanent unlocks | `js/progression.js`; shared `progress` in `js/state.js`, startup in `initMenus` |
| Colossus Burst passive / size pulse / enemy stun | `js/passive.js`; hooks in combat, opponent dispatch and fighter rendering |
| Opponent selection / two-form health / transformation | `js/encounters.js`, `js/rounds.js` |
| Blink / teleport cooldown and visual slices | `js/teleport.js`; input in `js/controls.js`, pose clipping in `js/fighters.js` |
| Colossus boss / giant intro / summons / wider world | `js/giant.js`, `js/giant-renderer.js`; `fightWidth` in `js/encounters.js`, shared damage in `js/combat.js` |
| Teddy shrinking / Doraemon cameo | `js/teddy.js` for flow, `js/teddy-renderer.js` for art; alpha anchors in `assets/teddy-frames.js` |
| Restart / rounds / victory / loss dialogue | `js/menus.js`, `js/rounds.js`; dialogue lines in `js/content.js` |
| Fullscreen, iPhone app mode, gestures, aspect ratio | `js/display.js`, `styles/immersive.css` |
| Fighter pose / walking art | `js/fighters.js`, `js/r8-renderer.js`, `js/teddy-renderer.js`, `assets/*-frames.js` |
| Encounter backgrounds / distant duel / HUD | `js/arena.js`, `js/renderer.js`; plate sources in `assets/stage-generation.md` |
| Music and effects | `audio.js` |
| Menu and phone layout / saved button scale | `index.html`, `styles/layout.css`, `styles/responsive.css`; fitting/settings in `js/controls.js` |

## Preserve unless the user changes the brief

Phone first; independent two-thumb input; joystick jump wedge from 10:30–1:30; dynamic 18:9 default without stretching fighters; instant attack starts; held directions remain independent of the 220 ms active-time command buffer; one pending action plus jump, modifier snapshots, neutral opposite directions, jump-before-attack and immediate post-recovery movement; grounded attack commitment and ordinary aerial steering; round MOBA-style thumb arc with largest lower-right Punch, adjacent Kick and fixed supporting actions; saved 85–125% button scale that auto-fits while keeping ≥44 px targets; show Nitro only at full meter without shifting other buttons; transparent combo multiplier background; no sprite crossfades; no hand/focus halos; one quiet three-dot menu. Round one is gentle; round two uses evasions, short bursts and punishable pauses, targeting roughly 60% losses. Round three is the two-health Goldline encounter: car ~65%, robot ~80% loss targets. These are playtesting goals, never winner-selection probabilities. Keep the robot reserve and phase numbering hidden until transformation, then reveal a fresh gold health bar and reset the timer to 99. Refill INJ health at robot reveal; preserve Shadow charge and Nitro meter across transformation and clear both boss pools on restart. Goldline is cute turquoise with gold rims but retains fierce attacks. Round four is Blue Velvet: 110% of INJ height, 140 HP, one random Doraemon assist after losing 33% HP; shrink to 34% height without refilling HP. Tiny form is faster and uses three-hit punching bursts with punishable pauses. Blink / E teleports behind the opponent with a 10-second active-fight cooldown; protect the disappearance/reappearance, preserve cooldown across cutscenes and reset it on round/restart. Keep all seven phone actions and the quiet menu separate at 320 px. Losses retry the same level after MiMi; only victory advances. A robot loss retries the Goldline car, and a tiny Teddy loss retries full-size Teddy. Restart returns to round one. Each encounter keeps its own background: Cedar Courtyard, Storm Sanctum, Goldline Foundry, Toybox Opera for round four, and Kingdom of Giants for round five onward. Transform/shrink retain their stage. The cosmetic distant duel appears only in Storm Sanctum. Tiny Teddy learns repeated low attacks, uses physical hop/guard counters and corner escapes, and keeps punishable burst recovery without extra HP/armor. Round five onward is the standalone Velvet Colossus: fresh 1,200 HP, 2× base Teddy height, protected 4.8-second Doraemon enlargement and a 1→0.6 camera pullback. INJ keeps her world size; use `fightWidth()` for boss combat bounds and `world.width` for screen/HUD. No boss round timer, but combo/AI/Blink clocks still run. Boss hits deal normal damage without flinch, knockback or attacker-induced hit-stop; committed smashes track early then lock, and remain blockable or avoidable with timed rear Blink. Keep long recovery, jumpable waves, fixed star markers and the relaxed one-echo summon break. Echo kills must never finish the round; echoes/hazards can cause real losses. Reset/KO clears all boss pools, and a boss loss retries its own reveal. Boss music uses the original 88 BPM arrangement and shared mute/music controls. MiMi is INJ's own cat. Wins have a player-paced victory scene after the KO beat; only Next Round or Enter/Space advances it. Keep car transformation separate from victory. Nitro uses a green runtime tint and directional blaze; preserve source art and suppress moving decoration under reduced motion.

Local `inj-progress` saves checkpoint/results/best combo and the earned Colossus Burst across reload/restart. Resume a fresh checkpoint behind the paused profile. Only a real zero-HP Colossus win unlocks the passive; cheat visits and echo kills do not. Three consecutive unblocked hits within two active seconds per hit trigger 1.6× growth over 0.1 s, 0.3 s shrink, nearby knockback and one active second of stun. Block/counter-hit/gap resets the count; no heal/damage or lethal-hit rescue. The dedicated stun overrides giant poise, while ordinary hit poise remains. Use existing recoil art, foot-anchored runtime scaling and no cameo. Round/KO/phase reset clears transient burst state; saved unlock survives.

The detailed arena plate and authored sprites have source notes in `assets/README.md`. Frame-inspection tools read alpha bounds; they do not redraw the art. Preserve image assets during code-only changes.

## Verify and document

Run `node tests/browser.cjs` for the quick default (structure, untouched HTTP/file startup across all levels, pause/cheats, keyboard/touch input coordination and boss targeting). For a subsystem change use `node tests/browser.cjs --suite menus,giant` with the relevant suite names; smoke and structure always run. See [docs/testing.md](docs/testing.md) for the ownership-to-suite map. `--all` runs every functional group without fight simulations, offline audio rendering, slow reveal replays or screenshots. Use `--artifacts` only when previews are useful. Reserve `--full` for an explicit exhaustive/release validation or work that requires the legacy balance/audio/replay checks; do not rerun it after routine edits. The runner reports per-suite time and owns its server/browser. `INJ_PLAYWRIGHT` / `INJ_CHROME` override local tool paths. Do not claim a quick run establishes balance, audio quality or full-suite coverage.

Tests add `window.__test` only to an intercepted copy of `js/main.js`; keep those hooks out of production sources. Update the relevant current guide when behavior or ownership changes. Treat `docs/archive/` and older artifact reports as historical. Chrome emulation does not establish physical iPhone/Safari behavior, and scripted fights do not establish a human win rate.

## Architecture guide and GitHub delivery

- Treat [docs/architecture.md](docs/architecture.md) as the current source map and module contract. Read it before implementation and keep its ownership table, shared APIs, dependencies, startup order and subsystem rules aligned with changes. Update [inj.md](inj.md) for player-visible behavior. Include relevant guide updates in the same commit as the implementation.
- After completing and verifying requested project changes, commit the work and push it to this project's GitHub repository unless the user explicitly asks to keep it local or not to commit/push. A separate push request is not required for completed work.
- The project remote is `origin` at `git@github.com:2531prasad/INJ.git` ([GitHub](https://github.com/2531prasad/INJ)); the default branch is `main`. Check the active branch, remote and working tree before committing. Fetch before pushing and preserve remote changes; never force-push or discard unrelated work.
- Commit the task's source, tests, current guides and relevant validation artifacts together. Stage only changes belonging to the task. Push the completed commit to the corresponding branch on `origin`, then verify the remote branch contains it. Report the commit and push result; if authentication, network access or a conflict blocks delivery, report the blocker without claiming a successful push.
