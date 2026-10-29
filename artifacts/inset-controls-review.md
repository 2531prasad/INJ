# Generated inset controls and 2.5× Burst · v0.31

INJ now reaches **2.5×** size at Colossus Burst's 100 ms peak, then returns to normal over 300 ms. The existing three-hit unlock/chain rules, foot anchor, recoil pose, protected animation, zero damage/healing, knockback and one-second stun remain. The saved earned unlock applies automatically with the new scale; no save migration is required.

The control layout was developed with built-in image generation, then implemented as independent native buttons and SVG components. [Generated concept, provenance and complete prompt](../assets/ui/README.md). The generated board is saved at `assets/ui/inset-controls-concept-v1.png`.

| Component | Behavior |
| --- | --- |
| Punch / Kick | Equally prominent persistent annular segments with curved inner and outer edges |
| Uppercut | Third persistent segment, slightly smaller than Punch/Kick |
| Guard | Circular shield button ahead of the arc; hold to block |
| Blink | Circular split-silhouette emblem, active-time cooldown number and perimeter |
| Shadow | Circular crescent/projectile emblem, existing charged state |
| Nitro | Circular blazing-boot emblem, reserved slot visible only at full meter |
| Insets | 18 px plus safe areas in landscape; 8 px in compact portrait |
| Left thumb | Floating joystick visible only while touched; separate menu footer |

Muted graphite faces and ivory emblems follow the concept. The three primary attack areas remain independent of the circular skill buttons. Short portrait arenas compact those circles to the left. The 85–125% saved scale still fits available space, caps compact sizes and preserves ≥44 px frames. Each SVG face receives actual touches and bubbles to the existing native-button capture/input path; glyphs and cooldown overlays do not intercept pointers.

`node tests/browser.cjs --suite controls,combat,menus,progression --artifacts` passed structure and **231 Chromium checks in 35.12 seconds**. Coverage includes eight phone sizes at three scales, inset geometry, equal Punch/Kick area, smaller persistent Upper, four circular emblems, actual hit-region separation, genuine two-thumb input, scale persistence/failure cases, combat abilities, victory/menus, earned unlock persistence and 2.5× animation/hurtbox timing across enemy forms. Both the control press and 0.4 s Burst were replayed at 10% speed. [Recorded run](validation-quick.json).

Inspected [landscape controls](controls-844.png), [320px controls](controls-320.png), [390px controls](controls-390.png), [held joystick](controls-stick-active.png), [press replay](controls-press-mid.png), [Burst peak](burst-replay-10.png) and the generated reference. At 2.5× the oversized sprite can extend above the normal-stage camera; the existing boss camera provides more framing. Runtime scale and foot anchoring remain exact.

JavaScript syntax checks and `git diff --check` passed. No exhaustive suite, fight simulations or offline audio render was run. Physical iPhone/Safari, device notches and subjective thumb comfort remain unverified; Chromium checks do not establish them or human balance.
