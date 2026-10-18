# Game utility UI review

## v0.14 restart action

Added Restart game using the existing button styles. The six actions occupy two rows of three, with Resume retaining its primary accent. Existing six-size geometry checks verify all actions remain visible, unclipped and at least 44 px high. The 161-check Chrome suite additionally verifies a damaged later-round restart returns to round one, clears combat state and preserves fullscreen/audio preferences. Updated portrait and landscape menu screenshots were visually reviewed; no new motion, icon or surface styling was introduced. Physical Safari remains unverified.

## v0.13 follow-up: immersive mobile play

Mode: full, scoped to fullscreen/Home Screen setup and the existing pause menu. Vanilla HTML/CSS and Canvas conventions remain in use. This is a Chrome review with emulated iPhone user agents and app launch signals; physical Safari chrome was not inspected.

| Category | Evidence | Result |
| --- | --- | --- |
| Typography | `iphone-fullscreen-help.png`, `home-screen-menu.png`, fallback text and menu labels | Instructions and actions fit the 320 px phone; shorter Exit view label avoids a three-line action |
| Surfaces | Fullscreen/expanded/Home Screen CSS, screenshots and viewport checks | Existing quiet menu retained; immersive pause overlay uses the app viewport so portrait letterboxing cannot clip its panel |
| Animations | New gesture/layout source | No new animation or transition; 10% timeline replay is not applicable |
| Icons | `assets/app-icon.svg`, rendered 192 px mark, manifest and Apple touch link | Original code-native INJ mark; no additional persistent game controls |
| Performance | Event handlers and layout source | No per-frame gesture work or dependencies. Non-passive handlers are needed to cancel browser defaults; physical mobile performance was not profiled |

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `index.html`, fullscreen fallback | Expansion could suggest Safari chrome was hidden; no distinct app launch configuration | Explicit Safari instructions, fullscreen manifest, local app icons, Apple metadata and automatic Home Screen layout; App mode reflects the installed state | Honest state feedback and a complete route to the intended experience |
| MEDIUM | `index.html`, immersive input | Zoom/gesture defaults could interrupt play outside the canvas | Page lock, zoom/callout suppression and gesture cancellation with independent gameplay pointers | Preserve immediate gameplay interaction and predictable browser behaviour on exit |
| MEDIUM | `index.html`, fullscreen target and pause overlay | Sibling dialogs fell outside the wrapper's native top layer; long help could exceed a short arena | Document fullscreen includes profile/roast; pause panel can use the app viewport | Keep settings and instructions reachable without adding an external toolbar |
| LOW | `assets/app-icon.svg`, manifest | Home Screen had no explicit app mark | Native vector INJ monogram plus 180/192/512 px PNG exports | A consistent launch identity using the existing palette |

Considered but rejected: globally setting `user-scalable=no` would restrict ordinary page use and is unreliable on iOS; forcing Safari chrome away with scrolling tricks cannot provide true app mode; adding an install toolbar would consume the gameplay space the user explicitly wants preserved.

Verification: `node tools/render-app-icons.cjs` produced the declared icon sizes. `node tests/browser.cjs` passed **159 checks**, including genuine double-tap/pinch sequences in all three immersive paths, simultaneous movement/guard, restored defaults on exit, jump-cone boundaries in portrait/landscape, visible fullscreen profile, manifest/icon delivery, both app-launch signals, and readable iPhone help at 320×568. Visually inspected the app mark, Home Screen menu and iPhone help screenshot. Existing hover/focus/press styling remains unchanged; regression checks retain no focus halo.

Verdict: **Approve for the inspected Chrome scope**. Not verified: physical Safari/Home Screen chrome, iOS-owned gestures, physical notch/home-indicator ergonomics, GPU performance or subjective audio.

## v0.12 utility redesign

Mode: full. Scope: the in-arena menu trigger, paused settings panel, fullscreen entry/exit, keyboard focus, and UI halos. Framework: existing vanilla HTML/CSS and Canvas; no new styling system, dependencies, or image assets. Existing fighter/arena art, intro, roast dialogue, and combat-button design were outside this polish review; their regression checks still ran.

## Evidence inspected

| Category | Evidence | Result |
| --- | --- | --- |
| Typography | `index.html:209`, the pause grid, `menu-portrait.png`, `menu-landscape.png`; text overflow checks at six phone sizes | Existing Chakra Petch, 12 px action labels, subdued 10 px heading, no clipped labels |
| Surfaces | `index.html:208`, `index.html:295`; live gameplay and paused screenshots; target rectangles | Small transparent trigger; compact panel; 44 px targets do not collide with combat controls |
| Animations | Menu source and `menu-state-checks.json` | No custom menu animation or transition; opening is immediate. A 10% timeline replay is not applicable to these changes |
| Icons | `index.html:435`, live 18 px SVG | One `currentColor` ellipsis, accessible name, decorative SVG hidden from accessibility tree |
| Performance | CSS/source inspection and runtime checks | No new dependencies, `transition: all`, speculative `will-change`, or per-frame UI logic. No FPS or mobile GPU profile was performed |

## Resolved findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `index.html:295` | Two visible 44 px bordered controls under the timer, inside the action area | One borderless 18 px ellipsis at the bottom edge, retaining a transparent 44 px tap target | Motion restraint and hit-area separation: utility controls should have less visual weight than combat |
| MEDIUM | `index.html:208`, `index.html:435` | Large pause title, red CTA and scattered utility buttons | A compact panel with a warm primary Resume button and a consistent three-column action grid | Hierarchy and surface restraint; the smallest tested arena can contain all actions |
| MEDIUM | `index.html:1513` | Pause was absent from the modal Tab boundary; resume focused a header control that can be hidden | Tab/Shift+Tab stay within pause; resume returns focus to the visible menu trigger; `aria-expanded` tracks state | Predictable keyboard use without adding the selection rings the user rejected |
| LOW | `index.html:1488` | Menu actions inherited arcade-style all-cap labels | Sentence-case labels using the game's existing body font | Typography should make settings easy to scan at phone sizes |
| MEDIUM | `index.html:299` | Fullscreen rejection text floated across the playfield | Explanation appears inside the paused panel with bounded overflow | Keep exceptional information near its action without reducing viewport size |
| LOW | `index.html:217` | Fullscreen's unpressed state looked dim like a disabled action | Muted treatment applies only to off audio toggles; Full screen retains normal action contrast | An available action should look available |
| LOW | `index.html:216` | Primary hover/focus styling masked its pressed color | A distinct, restrained pressed background | Press feedback remains static and clear, without a glow or animation |

## Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Gameplay utility area | Keep a separate fullscreen icon permanently visible | Adds a second persistent utility and repeats the visual clutter the user rejected |
| Below arena | Put settings in an external toolbar | Consumes landscape height and violates the requested in-game presentation |
| Menu trigger | Make the entire target only 18 px | Visually small controls still need a dependable touch target; the transparent target remains 44 px |

## Verification

- `node tests/browser.cjs`: 126 checks passed in Chrome across nine viewport sizes, including six compact-menu fit checks, no overlapping touch targets, keyboard focus containment/restoration, audio state labels, native fullscreen entry/exit and unsupported-API fallback. Existing jump, walk, combat, dialogue and audio checks passed too.
- Visually inspected `phone-landscape.png`, `menu-portrait.png`, `menu-landscape.png`, and the production-page menu in headless Chrome.
- Exercised hover, press and focus states. `menu-state-checks.json` records no focus outline or animation, with the primary pressed background changing from `rgb(233, 213, 173)` to `rgb(242, 221, 180)`.
- The retained nightmare AI won 100/100 trials against seven scripted policies. This is a regression benchmark, not a human win-rate estimate. INJ's charged rendering has no hand/floor halo.

Verdict: **Approve for the inspected Chrome UI**. Not verified: physical-phone ergonomics, mobile Safari fullscreen behaviour, GPU performance profiling, or subjective audio listening. No timeline replay was needed for the static menu changes.
