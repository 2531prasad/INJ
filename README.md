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

Round 1 is a warmup. From round two, the awakened dummy favours evasive footwork and one- or two-hit bursts instead of constant combos. Bursts end in 0.65–1.05 seconds of breathing room, with a guaranteed opening before it can evade another threat. Dodges also leave an opening, active strikes commit, and its damage, armor and pursuit speed are reduced from the previous version. The tuning target is roughly **85% dummy victories**, rather than 99%; this is not a measured human win rate. The latest 100-fight regression benchmark uses full 99-second rounds and seven scripted play styles. The latest run produced 88 dummy wins and 12 INJ wins. [Balance notes](artifacts/opponent-balance.md) explain the changes and test limits; raw metrics are in [validation.json](artifacts/validation.json).

## Project reference

- [Game design and current implementation](inj.md)
- [Artwork sources and generation prompts](assets/README.md)
- [Latest browser validation](artifacts/validation.json)

## Verification

Run `node tests/browser.cjs` with Playwright and Chrome/Chromium installed. Set `INJ_PLAYWRIGHT` and `INJ_CHROME` if needed. The test suite starts its own local server and injects inspection hooks only into the served test copy.

The latest run passed 168 checks in headless Chrome across phone and desktop viewports. This includes actual double-tap/pinch input, simultaneous controls while gesture blocking is active, jump-cone boundaries, fullscreen profile visibility, and emulated Home Screen launch signals. Physical-phone ergonomics, actual Safari/Home Screen chrome, and subjective speaker/headphone listening still need testing.

The optional Python atlas inspection tools require Pillow. They regenerate source bounds and animation anchors without modifying image pixels.
