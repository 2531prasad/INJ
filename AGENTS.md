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
| Attack damage, hitboxes, timing, combo scaling | `js/content.js`, `js/r8-content.js`, `js/combat.js` |
| Joystick, jump wedge, keyboard, Nitro input, input buffering | `js/controls.js`; physics in `js/movement.js` |
| Opponent selection / two-form health / transformation | `js/encounters.js`, `js/rounds.js` |
| Restart / rounds / victory / loss dialogue | `js/menus.js`, `js/rounds.js`; dialogue lines in `js/content.js` |
| Fullscreen, iPhone app mode, gestures, aspect ratio | `js/display.js`, `styles/immersive.css` |
| Fighter pose / walking art | `js/fighters.js`, `js/r8-renderer.js`, `assets/*-frames.js` |
| Arena / distant duel / HUD | `js/arena.js`, `js/renderer.js` |
| Music and effects | `audio.js` |
| Menu and phone layout | `index.html`, `styles/layout.css`, `styles/responsive.css` |

## Preserve unless the user changes the brief

Phone first; independent two-thumb input; joystick jump wedge from 10:30–1:30; dynamic 18:9 default without stretching fighters; instant attack starts; larger round Punch/Kick controls with fixed supporting-action positions; show Nitro only at full meter without shifting other buttons; transparent combo multiplier background; no sprite crossfades; no hand/focus halos; one quiet three-dot menu. Round one is gentle; round two uses evasions, short bursts and punishable pauses, targeting roughly 60% losses. Round three is the two-health Goldline encounter: car ~65%, robot ~90% loss targets. These are playtesting goals, never winner-selection probabilities. Keep the robot reserve and phase numbering hidden until transformation, then reveal a fresh gold health bar and reset the timer to 99. Refill INJ health at robot reveal; preserve Shadow charge and Nitro meter across transformation and clear both boss pools on restart. Goldline is cute turquoise with gold rims but retains fierce attacks. Restart returns to round one. MiMi is INJ's own cat. Wins have a player-paced victory scene after the KO beat; only Next Round or Enter/Space advances it. Keep car transformation separate from victory. Nitro uses a green runtime tint and directional blaze; preserve source art and suppress moving decoration under reduced motion.

The detailed arena plate and authored sprites have source notes in `assets/README.md`. Frame-inspection tools read alpha bounds; they do not redraw the art. Preserve image assets during code-only changes.

## Verify and document

Run `node tests/structure.cjs`, then `node tests/browser.cjs` for gameplay, startup or layout changes. The latter covers real Chromium touch events, combat, audio, and uninstrumented HTTP / direct-file startup. It owns its server and browser. `INJ_PLAYWRIGHT` / `INJ_CHROME` override local test-tool paths.

Tests add `window.__test` only to an intercepted copy of `js/main.js`; keep those hooks out of production sources. Update the relevant current guide when behavior or ownership changes. Treat `docs/archive/` and older artifact reports as historical. Chrome emulation does not establish physical iPhone/Safari behavior, and scripted fights do not establish a human win rate.

## Architecture guide and GitHub delivery

- Treat [docs/architecture.md](docs/architecture.md) as the current source map and module contract. Read it before implementation and keep its ownership table, shared APIs, dependencies, startup order and subsystem rules aligned with changes. Update [inj.md](inj.md) for player-visible behavior. Include relevant guide updates in the same commit as the implementation.
- After completing and verifying requested project changes, commit the work and push it to this project's GitHub repository unless the user explicitly asks to keep it local or not to commit/push. A separate push request is not required for completed work.
- The project remote is `origin` at `git@github.com:2531prasad/INJ.git` ([GitHub](https://github.com/2531prasad/INJ)); the default branch is `main`. Check the active branch, remote and working tree before committing. Fetch before pushing and preserve remote changes; never force-push or discard unrelated work.
- Commit the task's source, tests, current guides and relevant validation artifacts together. Stage only changes belonging to the task. Push the completed commit to the corresponding branch on `origin`, then verify the remote branch contains it. Report the commit and push result; if authentication, network access or a conflict blocks delivery, report the blocker without claiming a successful push.
