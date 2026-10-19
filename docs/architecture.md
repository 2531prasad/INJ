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
| `js/encounters.js` | Opponent ladder, form health, protected transformation and actor margins | `configureOpponent`, `beginR8Transform`, `completeR8Transform`, `fighterMargin`, `isR8` |
| `js/arena.js` | Background bake/buffers, atmosphere and cosmetic distant duel | `paintArena`, `stageDuelAt`, `drawStageDuel`, `drawArenaAtmosphere` |
| `js/effects.js` | Hit sparks, dust, blood, projectile and particle updates | `updateProjectiles`, `updateParticles`, `hitSpark`, `dust` |
| `js/rounds.js` | KO, round reset, announcements, timeout and round progression | `endRound`, `resetRound`, `updateFlow` |
| `js/combat.js` | Attack lifecycle, hit detection, damage, guard, charge and interrupts | `startAttack`, `stepAttack`, `hurtbox`, `tryHit`, `applyHit` |
| `js/controls.js` | Keyboard and captured touch input, jump cone, buffering, control labels | `input`, `queueAction`, `resetInput`, `initControls` |
| `js/movement.js` | Player decisions, jump/landing physics and distance-based walking | `controlPlayer`, `physics`, `moveWalking` |
| `js/opponent.js` | Warmup and awakened opponent behavior | `controlDummy`, `controlAwakenedDummy`, `dodgeDummy` |
| `js/r8.js` | Car/robot decisions, boost physics, shield counters and low hurtbox | `controlR8`, `startR8Attack`, `stepR8Attack`, `r8Hurtbox` |
| `js/r8-renderer.js` | Sixteen hard-switched poses, single visible phase health bar and wheel projectiles | `r8Sheet`, `sampleR8Animation`, `drawR8`, `drawR8Health`, `drawRim` |
| `js/fighters.js` | Atlas loading, hard pose changes, contact shadows and reflections | `sampleFighterAnimation`, `sampleAttackAnimation`, `drawFighter` |
| `js/renderer.js` | Frame composition, projectiles/effects drawing, health bars and HUD | `render`, `text`, `drawBar` |
| `js/menus.js` | Profile, pause, restart, audio controls, MiMi dialogue and page lifecycle | `pauseGame`, `resumeGame`, `restartGame`, `startRoast`, `initMenus` |
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

`dummy` remains the live opponent object for all rounds; check `kind` / `isR8` rather than its variable name. Round two uses `LEVEL_TWO`; round three onward configures the R8. Combat delegates its hurtbox and attack physics, while shared damage/guard still decides outcomes. Empty car health enters `transform`, clears attacks/input/projectiles and freezes simulation until the robot is installed. The first form displays one turquoise bar and no reserve/phase label; transformation keeps that depleted bar until the robot reveals a new gold bar. The second form preserves INJ health and charge, refills only robot health, resets the phase clock to 99 and resumes with brief entry protection. Timer expiry loses to the boss in either form; both pools must be cleared. The engine freezes transformation when paused. Keep these rules in `encounters.js` and `rounds.js`, not in renderer callbacks.

## Stylesheet order

| File | Scope |
| --- | --- |
| `styles/base.css` | Tokens, page typography, initial header / arena shell, shared buttons |
| `styles/profile.css` | Profile card, portrait CRT treatment, commands and entry action |
| `styles/controls.css` | Basic joystick and action-button surfaces / visibility |
| `styles/layout.css` | Current header and pause panel, compact portrait adjustments |
| `styles/responsive.css` | Landscape shell, final touch-deck sizing, portrait stick layout |
| `styles/immersive.css` | Quiet menu trigger, fullscreen/app layouts, safe areas and gesture CSS |
| `styles/dialogue.css` | MiMi portrait, bubbles, reading layout and reduced viewport adjustments |

These files preserve the previous cascade in exactly this order. Some later rules intentionally refine earlier component rules; this extraction does not redesign or deduplicate them. Keep structural cleanup separate from behavior changes.

## Tests, tools and records

- `node tests/structure.cjs`: local resource links, classic-script syntax, defer/bootstrap order and absence of production test hooks; no package dependencies.
- `node tests/browser.cjs`: broad integration runner. Its sections cover mobile geometry/input/display, animation, combat/opponent balance, dialogue, audio and desktop. Test-only inspection is appended to an intercepted `js/main.js`, while separate production smoke tests use untouched HTTP and `file://` sources.
- `tests/r8.cjs`: boss integration checks, isolated 100-fight phase benchmarks and car/robot previews. Called by the main browser runner. `tests/server.cjs` owns the concurrent local HTTP server.
- `tools/inspect-sprites.py`, `tools/inspect-walk.py`, `tools/inspect-r8.py`: alpha-bound/anchor extraction. `tools/render-app-icons.cjs`: code-native app-mark PNG export. See `assets/README.md` for provenance.
- `artifacts/validation.json`: latest browser outcome and scripted opponent benchmarks. `artifacts/r8-balance.md` describes current difficulty targets, phase rules and measurement limits. The older `opponent-balance.md` is historical. `artifacts/module-refactor.json`: one-time AST/DOM/CSS extraction comparison against the pre-split source. It supplements runtime checks and is not a continuously enforced test.
- `docs/archive/original-v0.1.md`: historical design and obsolete implementation notes. Read for history, not current file ownership.

No production framework, package installation, compilation or local server is required. A server remains convenient for development. Existing Google Fonts requests are optional; gameplay uses local art and scripts.
