# Blue Velvet and Doraemon · 22 October 2026

Generated with the built-in ImageGen tool, then copied into the project without pixel editing. The user's attached blue plush photograph was the teddy design reference; it is not bundled as a game asset. Both final PNGs retain generated alpha. `python3 tools/inspect-teddy.py` reads connected alpha silhouettes, measures their foot anchors and writes `teddy-frames.js`; it never redraws or modifies the PNGs.

- `teddy-sprites-v1.png`: 1254×1254 RGBA, sixteen row-major poses. Neutral guard, block, two walking steps; straight punch, uppercut, high kick, sweep; airborne punch, crouch, hurt, diva victory; tantrum, alternate cross, cannonball, shrinking shock. Runtime neutral height is 123.2 world units; the tiny form uniformly scales the same art to 34% of that height.
- `doraemon-sprites-v1.png`: 1536×1024 RGBA, four row-major poses: arrive, aim, fire, farewell. The final image is the cleanup edit below. Runtime beam geometry joins the gadget to the teddy; the art does not encode gameplay or decide the shrink timing.
- Metadata treats ears as part of neutral sprite height. Body hurtboxes exclude the tips; airborne poses use an explicit centered body root rather than a forward paw. Grounded art stays at its measured source foot baseline.

Existing INJ, Dummy, walking, Goldline and arena PNGs are unchanged. Teleport uses runtime clipping of INJ's existing art; it needs no replacement atlas.

## Teddy prompt

```text
Use case: stylized-concept. Asset type: production fighting-game sprite atlas, genuine transparent PNG. Reference image role: character design reference only, the blue furry plush monster in the user's attachment. Create exactly SIXTEEN isolated full-body poses of this SAME cute blue teddy monster in an evenly spaced FOUR by FOUR grid, row-major. Face RIGHT, three-quarter side view, same body proportions and source scale in every cell. Sky blue plush fur, long upright ears with cream interiors, tan face, huge expressive blue eyes, tiny blue nose, little triangular ivory teeth, blue claws; unmistakably follows the supplied reference. Premium hand-painted 2D arcade sprite art with clean readable outlines and plush texture, not 3D photographic product shots. Exaggerated theatrical fighting expressions: adorable but fierce drama queen. Generous gutters; every extremity strictly inside its own cell. Body root centered and grounded feet on consistent baseline 90% down each cell. NO effects trails, shadows, labels, text, grid, other characters, environment or props. Poses EXACTLY: row1 neutral boxing guard; raised blocking guard; left-foot-forward walk; right-foot-forward walk. Row2 extended straight punch right; rising uppercut; flamboyant high side kick right; grounded low sweeping kick right. Row3 airborne flying punch right; low curled crouch; recoiling hurt; triumphant diva pose one paw on hip other raised. Row4 outraged squatting tantrum with fists cocked; fierce rapid boxing follow-through opposite fist extended right; curled airborne spinning cannonball with face visible; shocked shrinking reaction clutching cheeks. Keep plush identity, ears, face and fur consistent in all sixteen cells. Each sprite should be about 230-300 pixels tall on a large square sheet, with separated alpha silhouettes. Actual transparent background.
```

## Doraemon prompt

```text
Use case: stylized-concept. Asset type: transparent game cameo sprite atlas. Create exactly FOUR isolated full-body sprites of DORAEMON, the recognizable round blue robotic cat, in a precise 2-column by 2-row grid. Matching premium hand-painted 2D arcade game sprite style with clean edges and gentle plush-like shading, clear at small sizes. Blue round head and body, white round face and belly, red nose and collar, gold bell, short white paws, no pointed cat ears. All four face RIGHT in three-quarter side view. Each holds the same small retro SHRINK RAY gadget, an orange and mint pistol with a round glass green emitter. Poses row-major: 1 arriving with curious smile and gadget down; 2 aiming shrink-ray pistol horizontally right with both paws braced; 3 firing pose eyes squeezed in concentration, gadget aimed right, small vivid green muzzle spark ONLY (no long beam); 4 delighted farewell wave, gadget lowered. Keep full body, same scale, feet same baseline, wide transparent gutters, each silhouette strictly within cell. No background, no floor/shadows, no text, no grids, no additional characters. Actual alpha transparency.
```

## Doraemon cleanup edit

```text
Edit this exact four-pose Doraemon sprite atlas. Remove ALL soft colored glows, gradient haze, black backdrop, shadows and any fuzzy ambient background pixels around every sprite. Preserve the four character bodies, shrink-ray gadgets, tiny green muzzle spark, poses, sizes and positions unchanged. Output clean fully opaque character interiors and genuinely empty alpha=0 transparent gutters/background right up to clean antialiased silhouette edges. This must be a game cutout sheet with four separate clean silhouettes; no colored aura anywhere.
```

## Final source hashes

- `teddy-sprites-v1.png` SHA-256: `0327355ce3c647db316cd4df4ae1fa24714742e34781f47b2bfd6edaab3324a9`
- `doraemon-sprites-v1.png` SHA-256: `0182523c28a15ff9e9e0025d0ff037a1383388c5bc229c4dcdf2f7fb8283c112`
