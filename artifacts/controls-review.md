# Mobile thumb controls · v0.29

Full interface-polish review of the seven phone actions, left joystick, quiet menu, Blink cooldown and saved button scale. Existing plain CSS, inline SVG and classic JavaScript are retained; no framework, production dependency or new image asset was added. The supplied MLBB images informed circular hierarchy and thumb reach. This review covers the requested controls, rather than the rest of the game's authored art or balance.

## Layout and mapping

| Position | Action |
| --- | --- |
| Lower-right, largest circle | Punch |
| Beside Punch | Kick; joystick down/forward or jump selects existing sweep/slide/aerial move |
| Above Punch | Uppercut |
| Peak of the curved fan | Shadow; existing charged-state label |
| Above-left | Nitro, visible only at full meter in a reserved slot |
| Inner edge | Hold Guard |
| Separate lower-left utility slot | Blink, with a cooldown ring and large remaining seconds |
| Left thumb | Move/crouch/jump wedge; independently captured pointer |
| Gap between Blink and Kick | Quiet three-dot menu |

Pause → **Button scale** offers 85–125% in 5% steps, saved as version-1 `inj-controls`, independently from progression/audio. Requested size is a ceiling: fitting preserves ≥44 px support targets and a larger strike pair. The arc compacts on small phones; wide arenas have a deeper curve. Geometry is shared with the joystick/menu and refits on arena changes, including unchanged world width. No control-rearrangement mode was introduced.

## Scope and coverage

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | 320/390/844 screenshots, native slider/output, short labels, charged Shadow, Blink seconds/accessibility | Resolved label/number presentation; existing type system retained |
| Surfaces | Round attack/ability hierarchy, every button center hit test, all-scale geometry at eight viewports, 320 px cheat menu/victory, simulated Home Screen insets | Resolved thumb hierarchy, fitting and reserved-menu spacing |
| Animations | Actual CSS press transition at 10% playback, intermediate/end captures, release/repress, reduced motion; cooldown pause | Clear; 0.96 feedback is interruptible, readiness has no repeated entrance/pulse |
| Icons | Existing inline SVG at final minimum sizes, uniform 2px currentColor strokes, accessible action names, cooldown icon/number state | Resolved weight and hierarchy; labels remain independent of color |
| Performance | Source review of layout invocation, bounded fit, input-handler feedback, one small cooldown ring, no new will-change/libraries/frame storage writes | Clear; fitting runs on resize/settings, not per fight frame |

States inspected: normal, pointer-held Guard, pressed/released/interrupted, keyboard-focused range, ready/charged, Nitro hidden, Blink cooling/ready, paused, corrupt/blocked/future settings, restart/reload and reduced motion. There is no asynchronous loading/empty-data UI in this scope; Nitro's hidden state is explicitly tested.

## Findings resolved

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `styles/responsive.css:77`, `styles/immersive.css:1` | Flat supporting row, equal primary pair and mode-specific menu positioning | Circular thumb fan, largest lower-right Punch, adjacent Kick, role colors and one reserved touch-menu gap | Hierarchy and minimum hit area: frequent actions are easier to find without overlapping the menu |
| MEDIUM | `index.html:166`, `js/controls.js:215`, `styles/layout.css:328`, `js/display.js:126` | Fixed CSS sizes without a saved preference | Native 44px range, 85–125% preference, screen fitting and shared stick/menu tokens | Touch ergonomics: larger settings remain safe at narrow widths and survive reload/restart |
| HIGH | `js/display.js:205` | Immersive gesture lock prevented the newly added range's one-finger drag | Allow the paused native range to handle that drag; retain other gesture rules | An exposed setting must be operable by the phone's actual touch path; a real CDP drag reproduced and verifies the fix |
| MEDIUM | `js/teleport.js:68`, `index.html:209`, `styles/responsive.css:181` | Long BLINK/countdown label inside a small square | Short fixed label, centered seconds, proportional ring and accessible remaining time | Tabular numbers and static cues make availability readable without changing position |
| LOW | `styles/responsive.css:105` | Small icons had a lighter 1.7px stroke | Same existing SVG set with a consistent 2px currentColor stroke and size-relative presentation | Icon weight matches the semibold labels and remains readable at minimum size |
| MEDIUM | `js/controls.js:182`, `styles/responsive.css:220` | Knob displacement capped at a constant 48px independently of the visible ring | Measured-radius travel and matching idle/active geometry, with fitted safe-area offsets | Optical/input alignment: the visual stick matches its directional sampling across scales |

Press feedback remains the established 0.96 scale. The new surfaces use static gradient depth, state borders and restrained shadows, rather than adding pulsing ability entrances. Keyboard focus has a visible outline; all action names remain readable without role color.

## Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Combat deck | Collapse Punch/Kick into a single basic-attack button | INJ's fighting mechanics need direct independent access to both moves |
| Settings | Drag/rearrange individual actions | The requested scope is a sensible fixed layout plus one scale setting |
| Nitro | Keep a disabled button on screen while charging | Existing product contract asks for a ready-only button; a reserved slot preserves muscle memory |
| Ability faces | Generate detailed raster illustrations and animated glows | Existing SVGs read at 44px, preserve local startup and identify actions with less decoration |

## Verification

`node tests/browser.cjs --suite controls,combat,menus,teddy` passed structure and **238 checks in 22.50 seconds**, recorded in [validation-quick.json](validation-quick.json). Controls cover eight viewports (320/360/390/430 portrait and 568/667/844/932 landscape), three requested scales, actual center hit-testing, hidden/ready stability, native key/tap/immersive drag, actual two-thumb Guard release/cancel, HTTP/file persistence, bad/unavailable/future schemas, simulated insets, cooldown pause and 10% press/release behavior. Existing input, abilities, victory, menus and Teddy/teleport regressions pass. `git diff --check` and syntax checks also passed.

Previews were captured with `--artifacts`; inspected [320px](controls-320.png), [390px](controls-390.png), [landscape](controls-844.png), [settings](controls-settings.png), [10% intermediate press](controls-press-mid.png), [settled press](controls-pressed.png), and the regenerated 320px cheat/victory screens. A resize screenshot initially caught an incomplete browser paint; captures now wait for layout/paint before rendering the preview.

No exhaustive suite, long fight simulations or offline audio renders were run. Physical iPhone/Safari behavior, device-specific notches, human thumb comfort and subjective gameplay feel remain **not verified**. Safe-area emulation and Chromium touch events do not establish those properties. No human balance or audio claim is made.

**Verdict: Approve** for the reviewed Chromium implementation; no actionable interface-polish findings remain. Unverified: physical iPhone/Safari, real-device safe areas/comfort, exhaustive validation and subjective gameplay/audio.
