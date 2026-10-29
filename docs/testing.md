# Testing INJ

Use one command for routine work:

```sh
node tests/browser.cjs
```

It runs the dependency-free structure check, untouched HTTP and direct-file startup, every level through the real cheat menu, pause/cheat keyboard and phone-layout regressions, keyboard/touch input coordination, and focused Colossus targeting/Blink checks. It prints one summary per group and elapsed seconds. One browser is shared; every module gets a fresh context so menu state, input, random seeds and audio preferences cannot leak between groups. Local servers use an OS-assigned port.

Choose the relevant group instead of rerunning every subsystem:

| Change | Command after `node tests/browser.cjs` |
| --- | --- |
| Pause, cheat field, level selection, keyboard focus | `--suite menus` |
| Local save/reload, checkpoints, earned passive and defensive burst | `--suite progression` |
| Held directions, jump/attack arbitration and input buffering | `--suite input` |
| Mobile thumb arc, button scale/save, cooldown presentation and touch coordination | `--suite controls` |
| Combo, attacks, Nitro, touch abilities, victory and retries | `--suite combat` |
| Boss AI, enlargement, attacks, summons or Blink targeting | `--suite giant` |
| Only multi-enemy targeting / Blink | `--suite targeting` |
| Teddy shrink, low-kick defense or teleport | `--suite teddy` |
| Goldline car/robot encounter | `--suite r8` |
| Encounter backdrop selection / loading | `--suite stages` |
| Shared changes across systems | `--all` |

Example: `node tests/browser.cjs --suite menus,giant`. Structure and production smoke always run, duplicate modules run once, and unknown suite names fail before opening a browser. `--list` lists available commands; `--verbose` prints each assertion. The old `node tests/giant-targeting.cjs` command delegates to the same runner.

Functional runs reuse existing assertions. Goldline, Teddy and Colossus stop after their core deterministic behavior checks; `combat` retains real Chromium multi-touch and ability interactions. Screenshot calls in supported functional groups run only with `--artifacts`. This avoids regenerating unrelated tracked previews. No synthetic shortcuts decide fight winners. `tests/control-geometry.cjs` is the shared shape-aware geometry check used by controls, abilities and legacy Teddy UI checks. Arc frames may overlap; the actual face hit regions must remain separate. The controls suite additionally checks eight phone sizes at three scales, native action hit targets and actual curved-polygon intersection/containment checks, inset margins, equal Punch/Kick area, smaller persistent Upper and circular skill emblems, touch-only joystick release/cancel/pause and fresh-origin checks, real scale touch/key editing, HTTP/file preferences and storage failures, safe-area simulation, held Guard plus joystick, a negative hit test outside decorative shadows, and a brief 10% press replay. The progression suite additionally exercises real reloads and a four-second 10% replay of the 0.4-second passive. Legacy balance trials explicitly keep the post-Colossus passive locked to retain their baseline.

For exhaustive work, opt in explicitly:

```sh
node tests/browser.cjs --full
```

This runs the preserved `tests/full.cjs` integration program, including full fight simulations, audio rendering, reveal replay, wider UI/input checks and previews. It takes longer and rewrites legacy validation artifacts. Its balance assertions may need reassessment after deliberate tuning changes; do not weaken them simply to make a command pass. Broad functional validation is `--all`; exhaustive release/balance/audio validation is `--full`. These are different coverage levels.

`artifacts/validation-quick.json` records the latest successful functional command, timestamp, per-module duration, assertion count and skipped categories. It never overwrites `artifacts/validation.json`, which remains the last exhaustive report. A failed run exits nonzero and leaves the previous successful report intact. Compare report timestamps before citing results.

Production remains build-free. Playwright/Chrome are local verification tools only; `INJ_PLAYWRIGHT` and `INJ_CHROME` override their paths. Test inspection hooks exist only in intercepted copies of `js/main.js`; production HTTP/file smoke pages have none. Chromium emulation does not establish physical iPhone/Safari behavior, subjective audio quality or human win rates.
