# Velvet Colossus · 23 October 2026

Generated with the built-in ImageGen tool. Both final outputs are copied unchanged into the project; the original INJ, Teddy, Doraemon, Dummy, walking and Goldline source PNGs are preserved. The new environment has no reference image; the four boss poses use `teddy-sprites-v1.png` as the character/style reference. There is no CLI/API image-generation fallback or pixel-editing pass.

| Project asset | Output | SHA-256 |
| --- | --- | --- |
| `assets/stage-giants-v1.png` | 1672×941 RGB, Kingdom of Giants environment | `89eea0ee1e48464401328355f2c22342a08229c7403bf6188422bcc8b70cf26f` |
| `assets/teddy-giant-poses-v1.png` | 1254×1254 RGBA, four new boss poses, alpha preserved | `dcf61902abc3dd593128369674a470f1fa42886371a36ff3b8f6ed9ec05114cc` |

Original outputs remain under `/Users/prasad/.codex/generated_images/01a154f5-1824-7642-ab11-29f633f231fe/`: `exec-0de12aa3-e9bc-49e4-8562-b37c3d5dfdcf.png` and `exec-a7b851d4-2b37-46f0-85dc-37800705d079.png`, respectively. Runtime uses only the project-relative paths above.

## Environment prompt

```text
Use case: stylized-concept. Asset type: finished production background plate for a premium side-view 2D arcade BOSS FIGHT, landscape 16:9. THE KINGDOM OF GIANTS: an immense ruined toy kingdom seen from a tiny warrior's perspective. Monumental blue velvet and antique gold toybox architecture, colossal weathered stone plush-monster guardian statues at the far outer edges, gigantic broken music-box gears and enormous toy building blocks in the far background, a distant sweeping bridge dwarfed by gigantic castles, floating ribbons high overhead, a colossal celestial clock under a deep plum eclipse sky. Warm pale sandstone fighting terrace with tiny distant doors, little stairs and railings to communicate enormous scale. Majestic and theatrical, cute but awe-inspiring, blue velvet / midnight plum / ivory stone / antique gold palette with restrained cyan moonlight. Extremely high-quality painterly 1990s arcade background with crisp fine pixel-like material detail, exquisite layered depth, cinematic contrast. Wide empty level fighting floor across the lower 28 percent, continuous and unobstructed from left to right; imaginary fighters' feet will be at 88 percent image height. A quiet darker central backdrop behind a large blue teddy boss. No living characters, no fighters, no enemies, no Doraemon, no text, no logos, no HUD, no borders. Straight-on side-view game camera, no fisheye or tilted horizon. The full image is revealed during a camera pullback: put small scale cues at the center and the truly colossal architecture and statues at the edges. Finished production environment, fill entire canvas.
```

## Boss-pose prompt

`transparent_background: true`; character/style reference: the existing sixteen-pose Teddy atlas.

```text
Use case: stylized-concept. Asset type: FOUR additional transparent fighting-game boss sprites in one two-by-two atlas. The reference image is CHARACTER AND PAINTED STYLE REFERENCE ONLY: the same blue plush long-eared teddy, tan face, huge expressive blue eyes, small blue nose, little ivory teeth and blue claws. Create four NEW full-body poses of that exact teddy, facing RIGHT in three-quarter side view. Preserve character identity, proportions, fur palette and existing hand-painted arcade style. It will be scaled up at runtime; don't change anatomy into a different monster. Poses exact row-major: TOP LEFT: fearsome double-fist ground-smash windup, teddy planted wide, BOTH huge soft paws raised overhead, elbows bent, furious determined face. TOP RIGHT: committed double-hand ground slam impact, BOTH blue-clawed paws planted on the floor well in FRONT toward screen-right, torso leaned forward, hips and feet planted behind, ears swept backward, mouth open. BOTTOM LEFT: low exhausted recovery after the smash, kneeling and leaning on both planted paws, looking toward screen-right, tired expression. BOTTOM RIGHT: smug relaxed boss taking a break, standing with arms folded over belly and a dramatically tilted chin, eyes smugly half closed, same full body. All four use the SAME body scale and consistent grounded foot baseline at 90 percent of their cell. Full ear tips, paws and feet strictly inside each cell, generous transparent gutters. True alpha transparency, clean silhouette edges, NO haze, NO shadows, NO background, NO floor, NO cracks, NO effects, NO text, NO labels, NO other characters, NO grid. Precisely 2 columns and 2 rows of separated sprites on a square transparent PNG. Do not redraw the reference atlas; output only these FOUR new boss poses.
```

## Atlas contract

`python3 tools/inspect-teddy.py` reads four connected alpha silhouettes and appends `giant` metadata to `teddy-frames.js`; it never edits the PNG. Frame order: overhead windup, two-paw impact, kneeling recovery, folded-arm recess. The folded-arm standing pose supplies the 574-source-pixel neutral height; raised paws retain extra reach and kneeling poses retain their lower silhouette. Smash/recovery roots pin the planted rear foot rather than the extended hands. New poses use one uniform runtime scale, with no sprite crossfades.

The Colossus neutral height is 246.4 world units, exactly twice Blue Velvet's 123.2. The intro grows Teddy from scale 1 to 2 while the camera moves from 1 to 0.6. INJ remains 112 world units tall and appears 67.2 units tall on the final camera. The new plate starts cropped and reveals its giant statues and outer architecture during the same pullback. Reduced motion uses a stable final wide camera. [Review and captures](../artifacts/giant-review.md).
