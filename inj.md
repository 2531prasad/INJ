# INJ — Phone-First Arcade Fighter

## Current build · v0.17 · 19 October 2026

A personal fighting game made for a friend. Phones are the primary platform; PC keyboard play remains available. Keep INJ cool, movement intuitive, and attacks responsive. Level two is more forgiving, and level three introduces Goldline: a blue Audi R8 with gold rims and a second, humanoid machine form. The existing INJ, Dummy and stage artwork are preserved.

For code changes, start with [AGENTS.md](AGENTS.md) and the [source map](docs/architecture.md). `index.html` now owns markup and ordered resource links. `js/` owns game systems, `styles/` owns presentation, and `audio.js` remains the procedural sound engine. There is no build step or production package dependency.

## Play

Open [index.html](index.html) directly, or run:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Local artwork, scripts and synthesized audio work without asset downloads; Google Fonts are optional. Audio starts after entering the arena.

On iPhone, Safari Share → Add to Home Screen → enable Open as Web App if shown → Add, then launch INJ from its icon to use the app window without Safari's URL/tab bars. Ordinary Safari tabs may keep those bars. Physical Safari behavior remains unverified.

## Current behavior

- **Phone controls:** independent captured pointers for each thumb. The left joystick moves/crouches; its upward 90° wedge from 10:30 to 1:30 jumps, including diagonal jumps. Shallow upward tilts outside that wedge stay grounded. Touch-down starts eligible attacks immediately; busy fighters retain a 220 ms buffer.
- **Display:** dynamic aspect ratio with an 18:9 desktop/portrait default and landscape fit. World height stays 225; width changes without stretching fighters or changing combat scale. Fighters occupy about half the arena height. Resize preserves health, attacks and spacing.
- **Quiet menu:** one borderless three-dot trigger at the arena's bottom edge. The two-row panel contains Resume, Full screen, Restart game, Profile, Sound and Music. Restart immediately returns to round one with full health and cleared combat state, preserving fullscreen and audio settings. No hand/focus halos or pulsing utility buttons.
- **Immersive play:** native fullscreen, expanded view and Home Screen app mode suppress browser double-tap/pinch gestures, callouts and page movement while preserving gameplay multitouch. Long dialogs can scroll vertically. Browser gestures return after leaving immersive play. iOS-owned system gestures cannot be removed by the game.
- **Rounds:** round one is gentle. Round two is the awakened Dummy, targeting roughly **60% player losses**. It favors evasions, one- or two-hit bursts and punishable pauses: 820–1220 ms after bursts, with an initial 400 ms opening; dodges expose a 300 ms opening. Damage, armor, pursuit and reactions are softer than the earlier 85% build. Outcomes are resolved by combat, never selected from a probability.
- **Level three / Goldline:** the blue Audi R8 has **140 car HP**, then **165 robot HP**, displayed as two stacked bars. The low car uses Goldline Dash, Thruster Hop, Gold Rim Disc and a temporary Rear-Up Strike. Crouching punches/sweeps reach it; high jabs can miss, and Shadow automatically angles downward. Its tuning target is **65% player losses**. After the car bar empties, a protected 2.1-second transformation starts the **85% target** robot phase: Piston Cross, Axle Breaker, Jet Uppercut, Orbital Slam and Boosted Cross, plus wheel-shield counters. Committed engine attacks retain light-hit poise after 60 ms; sweeps and charged Shadow can still stagger them. INJ keeps remaining health and charge, including charge earned by the final car hit. Each phase has a fresh 99-second clock; timing out loses to the boss. Later rounds repeat this encounter until the endless progression is designed. Restart always returns to round one. See [current balance notes](artifacts/r8-balance.md) for scripted results and limits.
- **Combat:** punch chains, crouching strikes/sweeps, anti-air uppercuts, flying kicks, Shadow projectiles, guard/chip damage, knockdown and recovery. Three clean melee hits charge the next Shadow toss for an enhanced hit and knockdown. No additional move button is required.
- **Fighters:** authored transparent atlases with adult proportions and restrained painted materials. Walking alternates four travel-driven poses, reverses when backing up, and stops at walls. Sprite changes are immediate with no crossfades; attack anticipation is fast and root recovery is softer. INJ retains the hood, pale theatrical makeup, crimson lips and physical gold ring. Goldline has a separate sixteen-pose car/robot atlas with consistent blue metal and gold wheels, generated before implementing its moves; [prompt and provenance](assets/r8-generation.md).
- **Stage:** the detailed Hollow Temple plate is unchanged. Ambient lantern/water/mist/petal effects share its camera transform. A separate cosmetic awakened duel loops on the far terrace; awakened INJ wins, celebrates and the tableau repeats. It never affects foreground damage or randomness.
- **MiMi:** losses lead to a tap-paced five-line exchange between INJ and her own cat. The cat gets the final roast. One exchange includes “MiMi, please stop.” The portrait shares INJ's CRT treatment. Next advances, Fight Again starts the next round, and Skip/Escape bypasses the exchange. Wins skip it.
- **Audio/lifecycle:** original continuous 112 BPM, 16-bar procedural arcade score; coordinated synthesized combat cues, including engine, thruster, rim and transformation sounds; independent persisted sound/music controls. Initial profile, pause, loss dialogue, focus loss and backgrounding stop combat and clear held input. Hidden pages suspend audio. Menu music continues quietly; reduced-motion settings suppress decoration.

## Controls

| Action | Phone | Keyboard |
| --- | --- | --- |
| Move / crouch | Joystick left, right / down | A/D/S or arrows |
| Jump | Joystick 10:30–1:30 wedge | W, up arrow or Space |
| Punch | Punch | J |
| Kick / sweep / flying kick | Kick; down or jump changes move | K |
| Uppercut | Upper | U |
| Shadow / charged Shadow | Shadow | L |
| Guard | Hold Guard | Shift or I |
| Pause / resume | Three-dot menu / Resume | Escape |
| Mute | Menu → Sound | M |
| Restart / fullscreen | Three-dot menu | Same menu actions |

## Verification

Run `node tests/structure.cjs`, then `node tests/browser.cjs`. Playwright and Chrome/Chromium are required only for browser checks; `INJ_PLAYWRIGHT` and `INJ_CHROME` override tool paths. The runner owns its server/browser, intercepts only a test copy of `js/main.js`, and separately exercises untouched HTTP and direct-file startup.

The latest suite passes **208 Chrome checks** across phone and desktop sizes, including genuine simultaneous touch, gestures, jump boundaries, menu/restart/fullscreen flows, animation, combat, opponent behavior, MiMi dialogue and audio. [validation.json](artifacts/validation.json) records results and three 100-fight scripted benchmarks (Dummy, car and robot). Boss phases are tested separately with fresh INJ health; a real encounter carries her health between forms. These policies do not establish a human win rate.

The one-time [extraction comparison](artifacts/module-refactor.json) matched all 59 original function bodies and 64 initializers after normalizing cross-file references, plus DOM structure/attributes/text and 169 CSS rules in the same cascade. Width/frame time intentionally moved into shared objects, and startup is now explicit. Runtime checks supplement this source comparison.

Physical-phone ergonomics, real Safari/Home Screen chrome and interruptions, and subjective speaker/headphone listening remain unverified. The offline score render has finite audible samples, no clipped samples and no silent arrangement gaps; that is a signal check, not listening approval.

## References and later work

- [Architecture / ownership / startup contract](docs/architecture.md), [agent instructions](AGENTS.md)
- [Art provenance and prompts](assets/README.md), [score preview](artifacts/arcade-score-preview.wav), [latest validation](artifacts/validation.json)
- [Landscape play](artifacts/phone-landscape.png), [menu](artifacts/menu-landscape.png), [MiMi exchange](artifacts/mimi-easter-egg.png)
- Historical [v0.15 implementation notes](docs/archive/build-v0.15.md) and [original v0.1 design](docs/archive/original-v0.1.md)

Endless exponential difficulty, additional opponents, more stages, finishers and a campaign remain future work. Keep those separate from responsive controls and the current simple charged-Shadow mechanic.
