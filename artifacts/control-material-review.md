# Control surface materials · v0.32

The live controls now use the generated concept's material cues: a softly lit outer edge, graphite face shading, a recessed inner contour and an outer shadow following each actual silhouette. [Generated reference](../assets/ui/inset-controls-concept-v1.png).

Each existing button has five SVG layers: a directional face gradient, radial edge shading, a silver rim gradient, a dark inset line and a fine inset highlight. The SVG face casts a short contact shadow and a softer lower shadow. Portrait uses a tighter shadow to fit its existing 8 px inset. Pressed buttons darken and lower the shadow; keyboard focus and ability readiness adjust the rim. Neutral colors and the existing icons/layout are retained.

Private `prepareControlSurface` creates unique per-button definitions once inside `initControls`, before preferences load. `updateControlFace` applies the existing geometry to every material layer and the separate cooldown track on resize. Only the base face receives touches. Other layers, contours and shadows remain decorative. There is no new production API, game-loop work, image download or raster replacement.

`node tests/browser.cjs --suite controls,combat --artifacts` passed structure and **156 Chromium checks in 20.93 seconds**. Existing checks cover HTTP/file startup, eight viewport sizes at three scales, arc sizing/insets, hit-region separation, independent touch/keyboard input, settings persistence, cooldown, abilities and victory. A negative native hit test confirms shadows outside each skill face cannot activate it. The control press replay still settles at 0.96 scale, supports interrupted release/repress, and respects reduced motion. [Recorded run](validation-quick.json).

Inspected [landscape](controls-844.png), [320px phone](controls-320.png), [390px phone](controls-390.png), [pressed state](controls-pressed.png) and [intermediate press](controls-press-mid.png). The [material close-up](controls-material-detail.png) is a real browser capture at 2× device pixel ratio, including the outer shadows. It is not generated concept art.

`git diff --check` and JavaScript syntax checks passed. No exhaustive suite, fight simulations or audio renders were run. Physical iPhone/Safari appearance and low-end device performance remain unverified.
