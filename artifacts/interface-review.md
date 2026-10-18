# Game utility UI review

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
