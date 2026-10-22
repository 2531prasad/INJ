# Encounter stages · 23 October 2026

Four new plates generated with the built-in ImageGen tool (`transparent_background: false`), then copied unchanged into `assets/`. All are 1672×941 RGB PNGs, approximately 16:9. They share a clear level fighting lane and an 88% foot baseline. Runtime scales uniformly to the arena camera, crops above/below as needed, and adds restrained theme-specific light/motes; it does not redraw the plates. The original `hollow-courtyard.png` and all fighter sprite assets remain byte-for-byte unchanged.

| Encounter | Asset | Art direction | SHA-256 |
| --- | --- | --- | --- |
| Round 1 / Dummy | `stage-training-v1.png` | Cedar training courtyard, warm mountain dawn | `d61e6517723344fec11ea155bb74b123d4df85af646b4699c8ae606d64bf0af6` |
| Round 2 / Awakened Dummy | `stage-awakened-v1.png` | Storm sanctum, gold guardian reliefs, moonlit water | `752413ecddab86cf3521f7e994c3dc00a99bdbfc952b3fc5342deda33a7bc9b1` |
| Round 3 / Goldline, both forms | `stage-goldline-v1.png` | Turquoise/gold automotive foundry and neon city | `62842ce36f6630cd6f0617d893dbd52c7ae47586c34bcfcec9621a5a75fec249` |
| Round 4 onward / Blue Velvet | `stage-velvet-v1.png` | Velvet toybox opera, music-box machinery and theatrical sky | `07a20464dc187cfde51d4c7005c14a0b6181b15aa17f85fda5b18bc3ff73ffeb` |

Original generated outputs remain under `/Users/prasad/.codex/generated_images/01a154f5-1824-7642-ab11-29f633f231fe/`: `exec-b8b60bf6-ae54-468e-91a7-7a73219239c4.png`, `exec-b3ce9b4c-2fff-4eb3-a7bb-a25aad3b154e.png`, `exec-65341883-6abe-4ab9-8977-c74c76e3c8d6.png`, and `exec-f504a492-f15a-4075-bb5b-937e752c0920.png`, respectively. The game uses only the relative project paths above. No source references were passed for these new environment generations.

## Cedar Courtyard prompt

```text
Create a high-quality environment background plate for a side-view 2D arcade fighting game, landscape 16:9 composition. STAGE 1: THE CEDAR TRAINING COURTYARD. Richly detailed painterly pixel-art inspired by premium 1990s arcade fighting backgrounds, crisp deliberate shapes, intricate material texture, cinematic warm early-morning light. An ancient mountain martial arts school: weathered cedar pavilion and paper screens, bamboo groves, hanging training ropes and wooden practice equipment along the far left and right walls, mossy stone lanterns, distant misty mountains through a central courtyard gate. Amber, cream, sage and rust palette. Beautiful depth and architectural detail with a quiet darker central backdrop so large fighting characters remain legible. EMPTY arena: no people, no creatures, no fighters, no lettering, no HUD, no logo. Broad continuous level stone-and-cedar fighting floor across the entire lower 30 percent; the fighters' feet will stand on an imaginary horizontal line 88 percent down the image. No objects obstruct the foreground fighting lane. Camera straight-on at fighting game height, no tilted horizon. Fill the entire frame, no borders. This is finished production game art, not a concept sheet.
```

## Storm Sanctum prompt

```text
Production background plate for a premium side-view 2D fighting game. Landscape 16:9, extremely high quality detailed painterly arcade game environment. STAGE 2: THE AWAKENED STORM SANCTUM, for an ancient golden training guardian who has awakened. A majestic ruined mountain monastery at midnight, ornate weathered gold and dark stone, gigantic empty guardian masks carved into the far edges of the architecture, deep indigo and plum storm clouds, a distant bolt of lightning behind pagoda roofs, violet incense haze, amber hanging lanterns and red maple leaves. A small distant central raised terrace framed by an arch, its platform at approximately 65 percent image height, with shadowy water beneath. Strong layered depth, intricate masonry and foliage, moody cinematic lighting, exquisite 1990s arcade atmosphere with precise pixel-like texture. NO characters, no people, no creatures, no readable text, no UI, no logo, no borders. Broad level dark stone fighting floor occupies the lower 30 percent, continuous and clear all the way from left to right, imaginary fighter foot line at 88 percent image height. Keep the middle area quieter and dark enough to read large fighters, detailed set dressing at perimeter and background only. Straight-on side-view fighting game camera, no tilt. Finished game art.
```

## Goldline Foundry prompt

```text
Create a finished high-quality background plate for a premium side-view arcade fighting game, landscape 16:9. STAGE 3: THE GOLDLINE NIGHT FOUNDRY. This is the home arena of a cute turquoise and gold futuristic supercar that transforms into a fierce robot. An opulent futuristic automotive assembly hangar overlooking a neon city in the rain. Rich turquoise power cores, thin warm gold illuminated rails, suspended precision robotic arms high in the distant background, carved mechanical art deco arches, a grand circular empty transformation gantry at the rear center, copper pipes, smoky steam vents at the edges, distant skyscrapers through tall glass windows. Dark teal, midnight navy and antique gold with magenta city accents. Extremely detailed hand-painted 1990s arcade environment with crisp finely textured pixel-art-like material rendering, cinematic reflections, beautiful depth. No foreground vehicles, no people, no fighters, no robots as characters, no readable text, no lettering, no logo, no HUD. Broad perfectly level unobstructed industrial floor across the lower 30 percent with subtle turquoise and gold reflections, foot baseline at 88 percent down the image. Keep central midground fairly dark and calm behind the fighters; put the densest machinery at the edges and far background. Straight-on side-view camera, no tilt, no borders, fill entire canvas. Visually spectacular but readable as a fighting game stage.
```

## Toybox Opera prompt

```text
Create a finished ultra-detailed production background plate for a side-view 2D arcade fighting game, wide landscape 16:9. STAGE 4: BLUE VELVET'S TOYBOX OPERA. An extravagant slightly sinister enchanted toy theatre for a dramatic blue plush monster who becomes tiny and fierce. Huge rich midnight-blue velvet curtains frame an ornate gold proscenium, plush cyan tassels, tiny theatrical spotlights, elegant antique mechanical toy gears and music-box filigree at the far edges, whimsical brass science-gadget props tucked into side balconies, star constellations and a luminous toy crescent moon in a distant painted night-sky stage set. Dusty rose and cream toy balconies, dark indigo and plum shadows, soft turquoise accents, exquisite warm amber edge lighting. A grand empty theatre, whimsical theatrical drama-queen atmosphere, never childish flat clipart. Hand-painted premium 1990s arcade environment with exceptionally rich crisp texture and carefully drawn details, beautiful atmospheric depth. A wide clear warm brown parquet stage floor occupies the entire lower 30 percent of the frame, level and unobstructed, imaginary fighters' feet at 88 percent image height. Central background is dark plum and soft warm cream so a bright blue teddy and a dark hooded ninja read clearly. No characters, no people, no creatures, no teddy bear in the background, no Doraemon, no letters, no text, no logo, no HUD, no borders. Straight-on side-view camera, no tilted horizon. Finished high-quality game art, fill the canvas.
```

## Review

In-game desktop/phone captures are `artifacts/stage-{1,2,3,4}-{desktop,phone}.png`. The structure/browser runner checks all four local plates, actual distinct rendered pixels, round-to-stage mapping, same-stage retries, Goldline phase continuity, later Teddy stages, fallback painting and late image-load isolation. Chrome emulation does not establish physical Safari behavior.

## Fifth encounter: Velvet Colossus (v0.24)

Round five onward now uses the standalone `stage-giants-v1.png` Kingdom of Giants plate. Its enlargement intro starts with a cropped view, then pulls back to reveal the monumental outer statues and architecture. The four plates and generation prompts above remain unchanged. [Fifth-stage prompt, source path, dimensions and hash](giant-generation.md).
