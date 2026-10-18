# INJ

A phone-first arcade fighting game made for a friend, with desktop keyboard controls, original procedural arcade music, a detailed temple arena, and MiMi's post-loss commentary.

The arena defaults to 18:9 and dynamically adapts to landscape, fullscreen, and available window height while preserving fighter proportions.

## Play locally

Open `index.html` in a browser, or serve this directory:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. No build or installation is needed to play. Audio starts after a tap or key press.

Phones use the on-screen joystick and action buttons. Push the joystick up to jump, or diagonally up to jump forward/backward. A discreet three-dot icon at the bottom of the arena opens the pause menu, where Full screen, Profile, Sound and Music are available. There is no external fullscreen bar taking space from the game. If the browser does not support native fullscreen, an expanded view and Home Screen hint are shown. Desktop controls: A/D to move, W to jump, S to crouch, J to punch, K to kick, U to uppercut, L for Shadow, Shift to guard, and Escape to pause.

Round 1 is a warmup. Round two onward is intentionally insufferable: the awakened dummy is extremely fast, evasive, aggressive, and armored. Rare real openings remain, but defeat is the expected outcome. It won all 100 trials against seven scripted play styles; that is not a measured human win rate.

## Project reference

- [Game design and current implementation](inj.md)
- [Artwork sources and generation prompts](assets/README.md)
- [Latest browser validation](artifacts/validation.json)

## Verification

Run `node tests/browser.cjs` with Playwright and Chrome/Chromium installed. Set `INJ_PLAYWRIGHT` and `INJ_CHROME` if needed. The test suite starts its own local server and injects inspection hooks only into the served test copy.

The latest run passed 126 checks in headless Chrome across phone and desktop viewports. Physical-phone ergonomics, mobile Safari, and subjective speaker/headphone listening still need testing.

The optional Python atlas inspection tools require Pillow. They regenerate source bounds and animation anchors without modifying image pixels.
