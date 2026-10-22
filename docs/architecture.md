# Source map

INJ remains a build-free static game. `index.html` contains the interface markup; local styles and classic deferred scripts contain the implementation. Classic scripts keep both direct file opening and ordinary static hosting available.

## Read for a change

1. Read `inj.md` for the current product contract.
2. Pick the subsystem below. Read its dependency header if the change crosses a boundary.
3. Run the structure and browser checks, including the affected interaction.

| File | Owns | Main entry points / state |
| --- | --- | --- |
| `js/core.js` | Canvas context, dimensions, math, seeded randomness, shared audio reference | `world.width`, `clock.last`, `H`, `GROUND`, `ctx`, `Sfx` |
| `js/content.js` | Fighter palettes, move definitions, rotating MiMi exchanges | `MOVES`, `INJ_PAL`, `DUM_PAL`, `ROASTS` |
| `js/r8-content.js` | Mechanical moves and difficulty profiles | `R8_MOVES`, `R8_TUNING`, `LEVEL_TWO` |
| `js/state.js` | Fighter models, live actors, match state, effect pools | `makeFighter`, `player`, `dummy`, `game`, `projectiles`, `particles`, `afterimages` |
| `js/encounters.js` | Opponent ladder, form health, protected transformation and actor margins | `configureOpponent`, `beginR8Transform`, `completeR8Transform`, `fighterMargin`, `isR8`, `isTeddy` |
| `js/arena.js` | Background bake/buffers, atmosphere and cosmetic distant duel | `paintArena`, `stageDuelAt`, `drawStageDuel`, `drawArenaAtmosphere` |
| `js/effects.js` | Hit sparks, dust, blood, projectile and particle updates | `updateProjectiles`, `updateParticles`, `hitSpark`, `dust` |
| `js/rounds.js` | KO, player-paced victory state/result, round reset, announcements, timeout and progression | `endRound`, `beginVictory`, `finishVictory`, `resetRound`, `updateFlow` |
| `js/combat.js` | Attack lifecycle, slide/Nitro travel, hit detection, combo scaling, damage, guard, charge and interrupts | `startAttack`, `stepAttack`, `hurtbox`, `tryHit`, `applyHit`, `resetCombo` |
| `js/controls.js` | Keyboard and captured touch input, jump cone, buffering, control labels | `input`, `queueAction`, `resetInput`, `initControls` |
| `js/movement.js` | Player actions in all stances, slide/Nitro/aerial Shadow dispatch, jump/landing physics and distance-based walking | `controlPlayer`, `physics`, `moveWalking` |
| `js/opponent.js` | Warmup and awakened opponent behavior | `controlDummy`, `controlAwakenedDummy`, `dodgeDummy` |
| `js/r8.js` | Car/robot decisions, repeated-move recognition, recovery punishes, boost physics, shield counters and low hurtbox | `controlR8`, `startR8Attack`, `stepR8Attack`, `r8Hurtbox` |
| `js/r8-renderer.js` | Sixteen hard-switched poses, single visible phase health bar and wheel projectiles | `r8Sheet`, `sampleR8Animation`, `drawR8`, `drawR8Health`, `drawRim` |
| `js/teddy.js` | Blue Velvet move data, reactive AI, punch pulses and protected shrink flow | `TEDDY_MOVES`, `TEDDY_TUNING`, `controlTeddy`, `stepTeddyShrink`, `teddyHurtbox` |
| `js/teddy-renderer.js` | Teddy/cameo atlas and corrected left-step loading, matched walk roots, hard poses, ray sequence and blue health bar | `teddySheets`, `sampleTeddyAnimation`, `drawTeddy`, `drawTeddyCameo` |
| `js/teleport.js` | Blink lifecycle, active-fight cooldown, relocation, phone countdown and slice effect | `startTeleport`, `stepTeleport`, `tickTeleport`, `teleportVisibility`, `updateTeleportUI` |
| `js/fighters.js` | Atlas loading, hard pose changes, runtime green Nitro atlas cache, phase poses/flames, contact shadows and reflections | `sampleFighterAnimation`, `sampleAttackAnimation`, `drawFighter` |
| `js/renderer.js` | Frame composition, victory stage, projectiles/effects drawing, health bars and HUD | `render`, `text`, `drawBar` |
| `js/menus.js` | Profile, pause, restart, audio controls, MiMi/victory interfaces and page lifecycle | `pauseGame`, `resumeGame`, `restartGame`, `startRoast`, `initMenus` |
| `js/display.js` | Native/expanded/Home Screen modes, browser gesture lock, arena resizing | `toggleFullscreen`, `fitArena`, `syncFullscreenUI`, `initDisplay` |
| `js/engine.js` | Simulation tick, hit-stop, clock and animation loop | `update`, `frame`, `startEngine` |
| `js/main.js` | One startup sequence | Initializes controls, menus and display, then starts the engine |
| `audio.js` | Procedural score, synthesis, voice cleanup, audio preferences | Existing `window.InjAudio` API |

Atlas bounds remain data files under `assets/`. They are loaded before game code, followed by `audio.js`. The exact ordered script list is in `index.html`; do not maintain a second loader manifest.

## Module contract

Each file registers its API on **one internal namespace**, `window.INJ`. Its `App` parameter points to that object. Local names remain file scoped; exports are listed at the end. Dependencies are explicit `App.foo` references rather than globals whose origin is hidden.

Objects such as `game`, actors and input keep their identity during reset. The old mutable width and last-frame scalars now live in `world.width` and `clock.last`, so every file sees their current values. Menu-only focus state and the display observer's scheduling flag stay private.

There are deliberate runtime cycles: combat updates control labels; input dispatches player actions; round flow opens the loss dialogue; UI calls the renderer and round reset. Those calls resolve through `App` **when invoked**. Registration does not start the game. `js/main.js` runs after every API exists and calls initialization exactly once. This avoids capturing undefined functions from a later script without needing a bundler or asynchronous loader.

The namespace is an internal implementation API, not a saved-game or external plugin format. Add a subsystem export only when another subsystem or a meaningful integration check needs it. Avoid duplicating mutable values in separate modules.

## Goldline encounter boundary

`dummy` remains the live opponent object for all rounds; check `kind` / `isR8` rather than its variable name. Round two uses `LEVEL_TWO`; round three configures the R8; round four onward configures Blue Velvet. Combat delegates its hurtbox and attack physics, while shared damage/guard still decides outcomes. Empty car health enters `transform`, clears attacks/input/projectiles and freezes simulation until the robot is installed. The first form displays one turquoise bar and no reserve/phase label; transformation keeps that depleted bar until the robot reveals a new gold bar. The second form refills both INJ and robot health, preserves INJ Shadow charge and Nitro meter, clears the hit chain, resets the phase clock to 99 and resumes with brief entry protection. The robot recognizes repeated low strikes, shields during its counter windup, closes against projectiles, punishes recovery, and uses a faster/reaching jet uppercut against jumps. Its shield beat varies from 160–300 ms before a ground counter; after a stagger it spends 10–65 ms reassessing before its next offensive decision. Incoming damage is now 85% of base and outgoing damage 130%, with the same 140 HP. Its 480–780 ms burst rests include a guaranteed 320 ms opening before defensive reactions resume. Timer expiry loses to the boss in either form; both pools must be cleared. The engine freezes transformation when paused. Keep these rules in `encounters.js` and `rounds.js`, not in renderer callbacks.

## Player combo and ability boundary

`state.js` owns the independent `player.charge` (0–3 Shadow charge) and `player.meter` (0–100 Nitro energy). Shared combat credits clean hits, applies the escalating combo multiplier before armor, and clears a chain on interruption/block/whiff. `game.hits` and its 1.4-second `hitTimer` drive the HUD. Invalid/invulnerable hits do not extend the chain. Round resets clear both resources; robot reveal restores health while carrying them forward.

`controls.js` owns NITRO / Q and rejects that action below full meter; `movement.js` dispatches it standing, crouching and airborne. The kick costs 100 on attack start, travels forward during its active window and can be blocked or interrupted. `combat.js` integrates only the elapsed active portion of each step, so the 60 ms startup / 160 ms active / 260 ms recovery burst travels 105.6 units at 660 units/s regardless of frame partition. Crouching selects a low hitbox/pose. Down + forward + Kick slides without spending meter; down + Kick remains the sweep. Airborne Shadow aims at the current opponent hurtbox when released, with no homing afterward. `fighters.js` reuses authored sweep/flying-kick frames, while `renderer.js` draws the Nitro bar and hit multiplier directly over the arena without a background panel. Nitro uses a quick coil/strike/recoil sequence with a cached green sprite recolor, separate short-lived green echoes and directional flame ribbons; the fighter sprite remains opaque and hard-switched. The runtime source-atop atlas recolor preserves native alpha and never rewrites assets. Reduced motion retains the green color cue and omits moving decoration.

`index.html` owns the seven labeled SVG action buttons. `controls.js` updates the Shadow label without replacing its icon and toggles Nitro's `hidden` state at full meter. `styles/responsive.css` fixes supporting actions above the larger round Punch/Kick targets, with a reserved Nitro slot so readiness never moves the other buttons. Blink occupies the lower-left deck slot. In portrait the quiet menu occupies the 44 px gap between Blink and Punch; landscape keeps it centered. Shared deck sizing tokens live on `.screen`, so the deck and menu use identical geometry. At 320 px the primary targets are 48 px, larger than the 44 px supporting actions. Touch capture stays independent when Nitro hides during an active press.

## Blue Velvet encounter boundary

`teddy.js` registers eight original theatrical moves on `MOVES`, plus `TEDDY_TUNING`. It loads after shared state/combat registration; `configureOpponent` only reads that tuning at runtime after all registration finishes. Combat delegates Teddy hurtboxes/attack stepping and Dummy control delegates its AI. The normal neutral sprite is 123.2 world units high, 110% of INJ's 112. Shrinking retains 34% of that height (41.888 units); the hurtbox and arena margins scale with it. Walking keeps indices 2/3: `drawTeddyFrame` routes index 2 to the separate `teddy-walk-left-v1.png`/`walkLeft` metadata and leaves index 3 on the original atlas. The alpha inspector normalizes the replacement to the previous step height and matches its lower-torso root to the unchanged right step, so normal/tiny and both facings use the same registration. The original sixteen-pose atlas is unchanged. Both forms share one 140 HP pool, without armor reduction or a refill. Low attacks and downward-aimed ground/aerial Shadow reach the tiny body.

During `fight`, `rounds.updateFlow` delegates to `stepTeddyShrink`. At HP ≤67%, it samples one delay in [0.45, 1.5) active seconds. The event waits for an in-flight Blink to finish; a lethal hit before the event still wins. The 2.35-second protected `shrink` state clears attacks, input, projectiles, particles and combo, freezes the round clock and cooldown, grounds both actors, and preserves health, Shadow/Nitro and cooldown resources. The renderer stages Doraemon's arrival, aim, beam, continuous anchored scale change and farewell. The tiny form uses 230-unit/s pursuit, three separate low punches per barrage, leaping punches, anti-air and spinning slams. Threat guards have a reaction delay; short bursts end in explicit openings. Rendering never triggers the transformation or changes health. Reset clears the one-shot marker and size. Pausing freezes the event; reduced motion omits spin, entrance scaling and decorative beam motion.

## Teleport boundary

`state.js` owns `player.teleport` and `teleportCooldown`; `teleport.js` owns their lifecycle. `controls.js` routes BLINK / E; `movement.js` accepts it standing, crouching or airborne, while free to act. It cannot cancel attacks, hitstun or knockdown. The 460 ms action prevents attacks/damage while disappearing, relocates at 190 ms behind the opponent's **current** facing/position, then reveals INJ facing the opponent. Landing is grounded and clamped to the arena; corner side-switches gently separate the opponent inward to create rear space. The cooldown starts at activation and lasts 10 active fight seconds. Pause, hit-stop, intro, boss cutscenes and victory freeze it. Round/restart resets it; Goldline/shrink preserve it. `engine.js` also skips the final cutscene tick so controllers and cooldown never consume a whole cutscene-finishing delta.

`fighters.js` clips the crisp current pose with a shrinking/expanding horizontal window, rather than dissolving between sprites. `teleport.js` adds separate staggered line fragments; reduced motion omits those fragments. `display.js` shifts an in-flight origin with world resizes, while relocation reads current world bounds. Opponents commit existing swings toward the last seen side and reacquire after the 460 ms Blink, retaining a brief 120 ms opening rather than tracking an invisible arrival. Phone countdown text is updated only when its displayed second changes; the desktop HUD also shows ready/cooldown. The cooldown button keeps its fixed position and is labeled with `aria-disabled` while unavailable.

## Victory boundary

`combat.js` records `game.bestCombo` for the current round/encounter. `rounds.js` snapshots actual health, opponent and best combo in `game.victory` at an INJ win. A 1.1-second KO beat enters `victory`; losses retain their three-second beat and MiMi flow. A car clear still enters transformation and never opens a victory scene. Only robot defeat completes Goldline.

`beginVictory` clears combat effects/input and installs the authored victory pose. `engine.js` advances the scene clock while skipping fighter controllers, projectiles and damage; pause freezes it. `renderer.js` owns the dimmed arena, subtle uniform hero close-up, defeated opponent and deterministic gold flecks. Rendering never decides progression. `menus.js` fills/shows the accessible `index.html` victory panel, hides the touch deck/joystick via the scene class and focuses Next Round. The quiet menu moves to the bottom-left for this scene. `finishVictory` accepts Next Round or Enter/Space once and resets the round; restart/reset clear the panel, snapshot, best combo and effects. `audio.js` owns the short victory fanfare. Reduced motion uses the final static framing without gold motion.

## Stylesheet order

| File | Scope |
| --- | --- |
| `styles/base.css` | Tokens, page typography, initial header / arena shell, shared buttons |
| `styles/profile.css` | Profile card, portrait CRT treatment, commands and entry action |
| `styles/controls.css` | Basic joystick and action-button surfaces / visibility |
| `styles/layout.css` | Current header and pause panel, compact portrait adjustments |
| `styles/responsive.css` | Landscape shell, final touch-deck sizing, portrait stick layout |
| `styles/immersive.css` | Quiet menu trigger, fullscreen/app layouts, safe areas and gesture CSS |
| `styles/dialogue.css` | MiMi portrait/dialogue plus the responsive victory panel |

These files preserve the previous cascade in exactly this order. Some later rules intentionally refine earlier component rules; this extraction does not redesign or deduplicate them. Keep structural cleanup separate from behavior changes.

## Tests, tools and records

- `node tests/structure.cjs`: local resource links, classic-script syntax, defer/bootstrap order and absence of production test hooks; no package dependencies.
- `node tests/browser.cjs`: broad integration runner. Its sections cover mobile geometry/input/display, animation, combat/opponent balance, dialogue, audio and desktop. Test-only inspection is appended to an intercepted `js/main.js`, while separate production smoke tests use untouched HTTP and `file://` sources.
- `tests/abilities.cjs`: combo arithmetic/reset rules, meter earning/spending, all three Nitro stances, phase timing/travel, transparent combo HUD, ready/hidden layout separation, repeated ability touch/capture, slide input and airborne projectile checks. Called by the main browser runner.
- `tests/victory.cjs`: win/result lifecycle, battle freeze, pause/restart, car/robot boundaries, responsive scene geometry, and touch/keyboard progression. Called by the main browser runner.
- `tests/teddy-teleport.cjs`: real rendered height/foot anchors, threshold/random delay, one-shot protected shrink, resource retention, all eight attacks, three-hit barrage, reactive guards/openings, low Shadow targeting, stance/wall teleport, cooldown/pause, real multitouch/E input and seven-control geometry/previews. Called by the main runner.
- `tests/r8.cjs`: boss integration checks, isolated 100-fight phase benchmarks and car/robot previews. Called by the main browser runner. `tests/server.cjs` owns the concurrent local HTTP server.
- `tools/inspect-sprites.py`, `tools/inspect-walk.py`, `tools/inspect-r8.py`, `tools/inspect-teddy.py`: alpha-bound/anchor extraction. `tools/render-app-icons.cjs`: code-native app-mark PNG export. See `assets/README.md` for provenance.
- `artifacts/validation.json`: latest browser outcome and scripted opponent benchmarks. `artifacts/r8-balance.md` describes current difficulty targets, phase rules and measurement limits. The older `opponent-balance.md` is historical. `artifacts/module-refactor.json`: one-time AST/DOM/CSS extraction comparison against the pre-split source. It supplements runtime checks and is not a continuously enforced test.
- `docs/archive/original-v0.1.md`: historical design and obsolete implementation notes. Read for history, not current file ownership.

No production framework, package installation, compilation or local server is required. A server remains convenient for development. Existing Google Fonts requests are optional; gameplay uses local art and scripts.
