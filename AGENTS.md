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
| Opponent decisions, dodges, pauses, difficulty | `js/opponent.js` for Dummy, `js/r8.js` for Goldline; tuning in `js/r8-content.js`, damage in `js/combat.js` |
| Attack damage, hitboxes, timing | `js/content.js`, `js/r8-content.js`, `js/combat.js` |
| Joystick, jump wedge, keyboard, input buffering | `js/controls.js`; physics in `js/movement.js` |
| Opponent selection / two-form health / transformation | `js/encounters.js`, `js/rounds.js` |
| Restart / rounds / loss dialogue | `js/menus.js`, `js/rounds.js`; dialogue lines in `js/content.js` |
| Fullscreen, iPhone app mode, gestures, aspect ratio | `js/display.js`, `styles/immersive.css` |
| Fighter pose / walking art | `js/fighters.js`, `js/r8-renderer.js`, `assets/*-frames.js` |
| Arena / distant duel / HUD | `js/arena.js`, `js/renderer.js` |
| Music and effects | `audio.js` |
| Menu and phone layout | `index.html`, `styles/layout.css`, `styles/responsive.css` |

## Preserve unless the user changes the brief

Phone first; independent two-thumb input; joystick jump wedge from 10:30–1:30; dynamic 18:9 default without stretching fighters; instant attack starts; no sprite crossfades; no hand/focus halos; one quiet three-dot menu. Round one is gentle; round two uses evasions, short bursts and punishable pauses, targeting roughly 60% losses. Round three is the two-health Goldline encounter: car ~65%, robot ~85% loss targets. These are playtesting goals, never winner-selection probabilities. Preserve INJ health/charge across transformation and clear both boss pools on restart. Restart returns to round one. MiMi is INJ's own cat.

The detailed arena plate and authored sprites have source notes in `assets/README.md`. Frame-inspection tools read alpha bounds; they do not redraw the art. Preserve image assets during code-only changes.

## Verify and document

Run `node tests/structure.cjs`, then `node tests/browser.cjs` for gameplay, startup or layout changes. The latter covers real Chromium touch events, combat, audio, and uninstrumented HTTP / direct-file startup. It owns its server and browser. `INJ_PLAYWRIGHT` / `INJ_CHROME` override local test-tool paths.

Tests add `window.__test` only to an intercepted copy of `js/main.js`; keep those hooks out of production sources. Update the relevant current guide when behavior or ownership changes. Treat `docs/archive/` and older artifact reports as historical. Chrome emulation does not establish physical iPhone/Safari behavior, and scripted fights do not establish a human win rate.
