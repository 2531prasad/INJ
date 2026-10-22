# Input coordination · v0.27

Grounded attacks retain startup/active/recovery commitment. Held movement and guard resume at recovery completion; a recent jump press executes on the first legal frame. Jump is resolved before an attack, and ordinary aerial attacks retain the same directional steering as an empty jump. Slide/Nitro retain their authored drive distance.

Commands use a 220 ms simulation-time window, one pending action plus a separate jump, directional snapshots and neutral opposite-direction handling. Space is now a held jump input. Expiry is evaluated at the recovery boundary, rather than the end of a long frame. Pause/focus loss clears input; hit-stop freezes command age. [Rules, ownership and primary-source context](../docs/input.md).

Final validation: `node tests/browser.cjs --suite input,combat,targeting` passed the structure check and **138 Chromium checks in 18.09 seconds**. The input module runs once despite being selected directly and through combat. It covers real Kick → A, released Space, held/released/opposing key combinations, genuine simultaneous joystick jump + Kick, directional modifiers buffered through recovery, air steering, Nitro drive limits, hit-stop/wall-time independence and first-legal-frame resolution. Existing abilities, touch, victory/retry and multi-enemy Blink checks also pass. [Recorded results](validation-quick.json).

The earlier broad functional pass passed 328 checks before the final expiry-boundary refinement; that refinement and its added regression case were verified by the final focused command. No exhaustive suite, long fight simulations or offline audio renders were run. No physical iPhone/Safari, hardware keyboard limits, subjective feel or human win rate is claimed.
