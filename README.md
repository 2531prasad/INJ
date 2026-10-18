# INJ

A phone-first arcade fighting game made for a friend, with desktop keyboard controls, original procedural arcade music, a detailed temple arena, and MiMi's post-loss commentary.

## Play locally

Open `index.html` in a browser, or serve this directory:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. No build or installation is needed to play. Audio starts after a tap or key press.

Phones use the on-screen joystick and action buttons. Push the joystick up to jump, or diagonally up to jump forward/backward. A fullscreen button sits below the arena; the pause menu lets you exit. If the browser does not support native fullscreen, an expanded view and Home Screen hint are shown. Desktop controls: A/D to move, W to jump, S to crouch, J to punch, K to kick, U to uppercut, L for Shadow, Shift to guard, and Escape to pause.

Round 1 is a warmup. Later rounds use a manageable sparring opponent with slower attacks, lighter damage, and breathing room. Every round is beatable.

## Project reference

- [Game design and current implementation](inj.md)
- [Artwork sources and generation prompts](assets/README.md)
- [Latest browser validation](artifacts/validation.json)

## Verification

Run `node tests/browser.cjs` with Playwright and Chrome/Chromium installed. Set `INJ_PLAYWRIGHT` and `INJ_CHROME` if needed. The test suite starts its own local server and injects inspection hooks only into the served test copy.

The latest run passed 110 checks in headless Chrome across phone and desktop viewports. Physical-phone ergonomics, mobile Safari, and subjective speaker/headphone listening still need testing.

The optional Python atlas inspection tools require Pillow. They regenerate source bounds and animation anchors without modifying image pixels.
