# Corner controls · v0.30

The main attack control is a quarter-circle rooted directly at the arena's bottom-right safe corner. Punch occupies its large central area; smaller Kick and Guard arc segments sit at the lower-left and upper-right ends. Four smaller ability buttons follow the outside of the arc in landscape. Short portrait arenas place those abilities to its left while retaining the corner-rooted main control. Faces use muted, translucent charcoal with quiet neutral outlines.

| Control | Placement |
| --- | --- |
| Punch | Large central area of the corner arc |
| Kick | Smaller lower-left arc segment |
| Hold Guard | Smaller upper-right arc segment |
| Blink / Upper / Shadow / ready-only Nitro | Small surrounding abilities; compact left-side arrangement in portrait |
| Move / crouch / jump | Invisible left region; floating joystick appears only while touched |
| Three-dot menu | Separate footer beneath the movement region |

The saved 85–125% scale setting remains available in Pause. Every action retains a frame of at least 44 px. SVG face paths receive pointer events and bubble to the existing native-button capture handlers; labels and overlays do not intercept touches. Hit separation uses actual face geometry, rather than rectangular-frame overlap. The shared test helper checks conservative polygon intersections/containment and native action hit targets. Nitro retains its reserved slot and Blink's numbered cooldown outline follows its smaller ability face.

The floating joystick establishes a fresh neutral origin each gesture. Release, cancellation and pause immediately hide its base/knob. The input region excludes the menu footer and bottom safe area. Existing jump wedge, independent two-thumb input, attack commitment and active-time buffering remain in use. Authored sprites and encounter artwork were preserved.

`node tests/browser.cjs --suite controls,combat,menus` passed structure and **175 Chromium checks in 21.67 seconds**. This covers eight viewport sizes at three scales, actual shaped hit regions, native scale touch/key/immersive dragging, HTTP/file preference reloads, bad/unavailable/future storage, joystick visibility/recentering, genuine held Guard plus movement, cooldown pause, a 10% press replay, existing combat abilities, victory and pause-menu regressions. [Recorded run](validation-quick.json).

Previews were captured in the preceding `--artifacts` run. Inspected [landscape](controls-844.png), [320px portrait](controls-320.png), [390px portrait](controls-390.png), [held joystick](controls-stick-active.png), [settings](controls-settings.png), [intermediate press](controls-press-mid.png) and [settled press](controls-pressed.png). The idle previews have no permanent joystick artwork.

`git diff --check` and JavaScript syntax checks passed. Legacy exhaustive touch fixtures were updated for floating origins and the shared geometry helper; those sections were syntax-checked, not executed. No exhaustive suite, fight simulations or offline audio rendering was run. Physical iPhone/Safari behavior, device notches and human thumb comfort remain unverified.
