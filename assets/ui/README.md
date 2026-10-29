# Inset attack arc design source

`inset-controls-concept-v1.png` was generated with the built-in `image_gen` tool on 29 October 2026. It is the design reference for the v0.31 HUD components. The original generated file is preserved; this project copy is 1672×941 pixels, SHA-256 `14fcc2dc2fc38c8305dc25d5bd3d8e0f619d87da8dcb78bb6a94a64a1b56eb84`.

The complete generation prompt is in [inset-controls-concept-v1.prompt.txt](inset-controls-concept-v1.prompt.txt).

`index.html`, `js/controls.js` and `styles/responsive.css` implement the generated arrangement as independent SVG/native-button components: equal Punch/Kick arc segments, a slightly smaller Upper segment, then circular Guard/Blink/Shadow/Nitro skills ahead of the arc. Emblems are crisp code-native SVGs based on the concept's fist, boot, rising fist, shield, split silhouette, crescent projectile and blazing boot. Insets fit to 18 px plus safe areas in landscape and 8 px plus safe areas in short portrait arenas; saved scale still fits the available space.

This image is referenced by the current guides. Fighters, sprites, stage plates and game startup resources retain their existing artwork and loading paths.

The v0.32 material pass brings the components closer to this reference with directional rim lighting, graphite and radial inner shading, inset bevel lines and silhouette-shaped outer shadows. These remain code-native SVG/CSS layers on the same interactive faces.
