# Fighting input contract

INJ uses separate held-direction and button-press inputs. A grounded attack commits through startup, active frames and recovery. Holding left during a kick records that direction continuously; walking starts as soon as recovery ends. A jump tap near the end of recovery is buffered and starts on the first legal frame. Jump plus an attack resolves the jump first, selecting an aerial attack.

This follows a common fighting-game distinction between input recognition, legal actions and explicit cancels. Rules differ by game: [Capcom's cancel guide](https://game.capcom.com/cfn/sfv/column/132455?lang=en) explains that only designated moves/timings permit a cancel, and [WB's MK11 documentation](https://support.wbgames.com/hc/en-us/articles/49628545452691-Mortal-Kombat-11-Accessibility-Options) describes configurable input timing/shortcut leniency. These sources do not specify INJ's buffer duration or air steering; those are deliberate choices for this phone-first game.

| State | Direction / jump / attack behavior |
| --- | --- |
| Ready on ground | Held directions move/crouch/guard. Jump is resolved before an attack, so up + Kick starts a flying kick. Blink is the explicit action with priority over jumping. |
| Ground attack | Direction input remains held while the move commits. Walking, guard and jump resume at recovery completion, without an extra idle frame. No arbitrary walk/jump cancel during startup, impact or recovery. |
| Ordinary aerial attack | The same limited horizontal steering as an empty jump remains available. Gravity and landing continue. |
| Slide / Nitro | Authored directional travel commits; steering cannot add extra burst distance. |
| Hitstun / knockdown | Damage reactions commit. Held input or a recent buffered action resumes at the legal recovery boundary. |
| Blink | Existing protected relocation completes before the next action; destination follows the combat target selected on activation. |
| Hit-stop | Input may be recorded, but command age and combat simulation freeze. |
| Pause / focus loss / cutscene / restart | Input reset clears held directions, pending requests, direction snapshots and the input clock. |

`controls.js` owns held keyboard/pointer state and one next non-jump action plus an independent jump request. New button presses replace an older pending non-jump action; they do not accumulate a backlog. OS key-repeat does not create new attacks, and key release never creates an attack. Space, W, Up and the joystick's upward wedge all support held jump. Left+right or up+down resolve to neutral; releasing one opposing key restores the other. Opposing vertical inputs clear a pending jump.

Commands retain **220 ms of active simulation time**, an intentionally generous existing mobile window. A brief early jump that expires before a long attack finishes is discarded; holding jump continues requesting it when free. Holding movement requires no buffer. Pauses and hit-stop cannot age out a command through wall-clock time. Expiry is checked at the actual recovery boundary, before unused time in that frame, so a slow frame cannot discard an otherwise valid input.

Each press snapshots down/forward/horizontal intent. A down+forward Kick queued during recovery remains Slide even if the stick returns to neutral before it executes. Low Nitro keeps the same rule. A buffered diagonal jump retains its direction if the stick was released before takeoff. Existing move timing, damage, meter cost and grounded attack commitment remain the combat contract.

`state.js` owns `game.inputTime` in milliseconds. `controlPlayer` advances it with the simulation segments it processes, including recovery and Blink; the engine does not call those segments during pause, hit-stop or protected scenes. `pressBuf` holds deadlines in that clock, not `performance.now()`. `consume(action)` returns a direction snapshot or `null` and clears the request. `resetInput()` resets this state. Direct test fixtures use `game.inputTime + 220` for injected deadlines.

The controller spends time in the current attack/reaction first, then uses any remaining frame time for the next legal state. Ordinary aerial steering is processed during attacks as well as empty jumps. `combat.startAttack(fighter, key, command?)` accepts optional directional context for low Nitro; existing AI calls keep their signatures.

The main mobile control is a quarter-circle rooted in the bottom-right safe corner: a wide central Punch area with smaller Kick and Guard arc segments at its lower-left and upper-right ends. Blink, Upper, Shadow and ready-only Nitro use smaller surrounding ability buttons. Landscape places these outside the main arc; short portrait arenas compact them to its left. Faces use muted translucent charcoal and quiet neutral outlines. Blink retains a numbered cooldown and outline that follows its face. Nitro’s reserved slot never moves other actions.

The invisible left region creates a floating joystick at each touch origin, clamped to region/safe-area bounds. Its base/knob disappear on release, cancellation and pause; no idle ring/arrows/labels remain. The region excludes the separate three-dot menu footer. Movement/crouch and the 10:30–1:30 jump wedge retain their rules. SVG face paths receive touches and bubble to their native buttons/captured pointers. Frames may overlap while actual face hit regions remain disjoint.

Pause → **Button scale** offers 85–125% in 5% steps. `controls.js` saves `{ version: 1, scale }` under `inj-controls`, separate from `inj-progress` and `inj-audio`. Reload/restart retains the preference; bad/unavailable storage cannot block play, and future schema versions remain untouched. The requested scale is a ceiling: fitting limits growth on cramped arenas while preserving ≥44 px targets, primary strike hierarchy and non-overlapping input regions. Stick size/travel follows the same layout; all existing command rules still apply. `display.fitArena()` refits controls after any arena-size/mode change, even if the combat world's width does not change. No drag-to-rearrange/custom-layout mode is included.

Verify with `node tests/browser.cjs --suite input` or `--suite combat`. The input suite includes actual keyboard Kick → A, Space, opposing-key rollover, released jump taps, same-frame recovery transitions, modifier snapshots, hit-stop timing and genuine two-thumb diagonal jump + Kick. The default runner includes this suite; `--all` includes the other functional systems without long balance/audio runs. Physical keyboard hardware limits and physical iPhone/Safari behavior are not established by Chromium automation.

Use `--suite controls` for layout/settings/cooldown and input regressions, with `--artifacts` for the control previews and 10% press-state replay.
