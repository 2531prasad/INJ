# INJ

A phone-first arcade fighting game made for a friend, with desktop keyboard controls, original procedural arcade music, a detailed temple arena, and MiMi's post-loss commentary.

The arena defaults to 18:9 and dynamically adapts to landscape, fullscreen, and available window height while preserving fighter proportions.

## Play locally

Open `index.html` in a browser, or serve this directory:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. No build or installation is needed to play. Audio starts after a tap or key press.

Phones use the on-screen joystick and action buttons. The upward 90° wedge—from **10:30 to 1:30**—jumps; shallow upward tilts outside that wedge only move sideways. A discreet three-dot icon at the bottom of the arena opens the pause menu, where Full screen, Restart game, Profile, Sound and Music are available. Restart game immediately returns to round one with full health and cleared combat state, preserving fullscreen and audio settings. There is no external fullscreen bar taking space from the game. Double-tap zoom, pinch/rotation, long-press callouts and page scrolling are blocked during fullscreen, expanded view and Home Screen app play. Independent joystick/attack touches remain available, and long dialogs can still scroll vertically. Ordinary browser gestures return when fullscreen/expanded view ends.

**iPhone without Safari bars:** in Safari, use Share → Add to Home Screen → enable **Open as Web App** if shown → Add, then launch **INJ from its Home Screen icon**. The manifest, Apple app metadata and local icons support this launch mode, which automatically uses the immersive game layout. A regular Safari tab may retain its URL/tab bars; the in-game button falls back to expanded view and explains the Home Screen route. iOS system gestures remain controlled by iOS. See [Apple's instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios). This does not add offline caching or a service worker.

Desktop controls: A/D to move, W to jump, S to crouch, J to punch, K to kick, U to uppercut, L for Shadow, Shift to guard, and Escape to pause.

Round 1 is a warmup. Round 2 keeps the awakened Dummy's evasions, short bursts and punishable pauses, with a gentler **60% loss target**. Round 3 introduces **Goldline**, a cute turquoise Audi R8 with gold rims: **125 car HP** with dash, thruster leap, rim disc and occasional rear-up attacks, then **140 robot HP** with piston punches, wheel kicks, jet uppercuts, dive slams and wheel-shield counters. Its car and robot forms target **65%** and **90%** losses respectively. These are tuning goals, not measured human probabilities or predetermined winners.

Only the current health bar is visible: the robot is a surprise, revealing a fresh gold life bar after the car is defeated. INJ refills health at the robot reveal and retains Shadow charge and Nitro meter; crouching strikes reach the low car, and Shadow aims down automatically. The timer resets to 99 seconds when the robot emerges; timeouts lose to the boss. Later rounds repeat Goldline for now. [Balance notes](artifacts/r8-balance.md) record the scripted checks and their limits. [Sprite source and exact ImageGen edit prompts](assets/r8-generation-v2.md) document the new sixteen-pose atlas.

Clean consecutive hits scale damage: normal first hit, then ×1.1, ×1.2, ×1.3 and onward. The HUD shows the active hit count and multiplier. Taking a hit, an attack being blocked, a missed melee attack or 1.4 seconds without a clean hit ends the chain. Down + forward + Kick slides. Five clean hits fill the independent Nitro bar; taking hits also adds a little energy. **NITRO / Q** spends a full bar on a forward kick from standing, crouching or midair. **Shadow / L** now works in the air, too. Goldline takes more damage per hit; the robot counters repeated low attacks, punishes recovery and responds to aerial approaches while retaining pauses.

## Source organization

`index.html` contains the interface markup. Focused systems live in `js/` (combat, opponent AI, controls, movement, rendering, menus and display), with ordered stylesheets in `styles/`. `js/main.js` initializes the systems after registration. The shared `window.INJ` namespace keeps cross-file dependencies explicit. Direct file opening and static hosting still work without a build step. See the [source map](docs/architecture.md) before editing. Older design notes are preserved under `docs/archive/`.

## Project reference

- [Game design and current implementation](inj.md)
- [Agent working guide](AGENTS.md)
- [Source ownership and architecture](docs/architecture.md)
- [Artwork sources and generation prompts](assets/README.md)
- [Latest browser validation](artifacts/validation.json)

## Verification

Run `node tests/structure.cjs`, then `node tests/browser.cjs` with Playwright and Chrome/Chromium installed. Set `INJ_PLAYWRIGHT` and `INJ_CHROME` if needed. The test suite starts its own local server and appends inspection hooks only to an intercepted test copy of `js/main.js`. It separately checks unmodified HTTP and direct-file startup.

The latest run passed 238 checks in headless Chrome across phone and desktop viewports. This includes actual double-tap/pinch input, simultaneous controls while gesture blocking is active, jump-cone boundaries, fullscreen profile visibility, and emulated Home Screen launch signals. Physical-phone ergonomics, actual Safari/Home Screen chrome, and subjective speaker/headphone listening still need testing.

The optional Python atlas inspection tools require Pillow. They regenerate source bounds and animation anchors without modifying image pixels.
