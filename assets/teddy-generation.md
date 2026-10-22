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

## Walking correction

The original left-step cell also advanced the near/right leg. A separate **`teddy-walk-left-v1.png`** now supplies the far/left-leg-forward step. The built-in ImageGen tool produced the correction; the selected final PNG was copied without pixel editing. Its far forward leg is behind the planted near thigh, with a smaller blue-clawed paw and opposite arm swing. The correct right step and every other original atlas cell retain their original source pixels. The original atlas and Doraemon hashes above remain unchanged.

`walkLeft` metadata normalizes the replacement's visible height to the old left step. The inspector measures the lower-torso center across 70–78% of the silhouette height and matches the correct right step's torso-to-root offset. Feet share the original floor baseline. This affects rendering only; walking distance, speed, hitboxes and AI are unchanged. [Normal/tiny, both-facing preview](../artifacts/teddy-walk-review.png).

### Initial single-pose edit prompt

```text
Use case: precise-object-edit. Asset type: one corrected transparent walking sprite for an existing 2D game. Reference/edit target: the blue plush teddy sprite atlas. Extract/recreate ONLY the third sprite in its TOP ROW (the intended LEFT-LEG-FORWARD walk pose) as ONE isolated full-body sprite on a square transparent canvas. Correct its gait: same teddy facing RIGHT in the SAME three-quarter side view, but the ANATOMICAL LEFT leg, the FAR-SIDE LEG, must swing FORWARD toward screen-right. The ANATOMICAL RIGHT leg, the NEAR-SIDE LEG, is planted BACK toward screen-left supporting the weight. Make the forward far-side left leg visibly emerge BEHIND the belly/right thigh at the hip; its shin and foot reach rightward beyond the planted right foot. The planted near right thigh must clearly overlap and occlude the root of the far left thigh, establishing which leg is which. Do NOT raise the near right leg in front of the body like the reference: that is the error being fixed. The left/far forward paw shows its TOP BLUE FUR and tiny blue claws, with its toes tipped slightly DOWN; NO broad cream sole facing the camera on this forward paw. Keep head, ears, face, guard hands, sky-blue plush texture, proportions and hand-painted style closely matching the top-row source sprites. Long upright cream-lined ears, tan face, huge blue eyes, tiny blue nose, small triangular teeth. Counter-swing the arms subtly for the opposite step. Keep the torso upright, neutral guard, both legs clearly distinguishable. Whole character including ear tips and all toes inside frame, generous transparent margin. Only ONE sprite, no other poses, no labels, no scene, no background, no floor, no shadow or glow. Genuine alpha transparency. This is the opposite leg step to the current atlas top-right pose; DO NOT simply mirror the character or change facing.
```

The first result still put the diagonal thigh in front. The following targeted edit supplied the selected final pose.

### Final correction prompt

```text
Edit target is IMAGE 1, the single blue teddy walking sprite. Image 2 is the existing game atlas, style reference only. The leg layering is STILL WRONG in image 1: the huge diagonal forward leg is drawn in the foreground. Correct ONLY the walking limb pose/layering, retaining this same character, right-facing head, ears, torso design, overall scale, source hand-painted appearance and transparent background. The FORWARD LEG reaching screen-right must be the FAR LEG, drawn SMALLER, slightly darker blue and BEHIND the planted NEAR LEG where the thighs overlap. Put the vertical planted near/right thigh visibly IN FRONT at the crotch overlap, its outside edge unbroken from hip down to the broad planted paw at screen-left. Hide the ROOT of the diagonal forward far/left thigh behind that foreground planted thigh. The forward far leg should only become visible from BEHIND the planted leg around knee height, then extend right with a small TOP-VIEW blue-clawed paw. No giant foreground diagonal thigh, no camera-facing cream sole. Lift the NEAR RIGHT ARM FORWARD at chest level, paw reaching toward screen-right in front of the belly; swing the FAR LEFT ARM backward, partially occluded by torso, to counterbalance the forward far/left leg. This is explicitly the OPPOSITE stride and arm swing to the top-right walking sprite of image 2, while both sprites face RIGHT. Strong readable side-view limb occlusion is essential; don't just make the same near leg stride with different fur. One full-body sprite, all ear tips and feet inside generous transparent margins. No background, floor, shadows, glows, labels or extra sprites. Genuine transparency.
```

Final `teddy-walk-left-v1.png` SHA-256: `4588da5c7553da9f78d5edf5d95a63c17748146b82a708cc309297e62c2c7183`.
