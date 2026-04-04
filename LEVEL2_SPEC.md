# Level 2 Design Spec (Operation Lion's Roar)

## Goal
Ship a second level that is:
- A clear step up from Level 1 without feeling unfair
- Focused on pressure and target prioritization
- Playable in about 2.5-4.5 minutes
- Tuned around resource decisions (ammo, grenades, MAG timing)

## Win/Lose Conditions
- Win: survive to extraction start, then hold until extraction timer ends
- Lose: lives reach `0`
- Restart: keep current restart flow (`click to retry`)

## Level Timeline
Level 2 has 4 combat phases plus an extraction hold.

### Phase A: Re-entry (0s-35s)
- Purpose: settle player into faster baseline than late Level 1
- Spawn interval: `1100ms`
- Max active enemies: `7`
- Enemy mix: `62% enemy`, `38% enemy-grenade`

### Phase B: Crossfire (35s-80s)
- Purpose: enforce target switching and grenade usage
- Spawn interval: `920ms`
- Max active enemies: `8`
- Enemy mix: `54% enemy`, `46% enemy-grenade`

### Phase C: Pinch (80s-120s)
- Purpose: high pressure with near-even composition
- Spawn interval: `780ms`
- Max active enemies: `9`
- Enemy mix: `50% enemy`, `50% enemy-grenade`

### Phase D: Burnthrough (120s-140s)
- Purpose: short, dangerous spike before extraction
- Spawn interval: `680ms`
- Max active enemies: `10`
- Enemy mix: `44% enemy`, `56% enemy-grenade`

### Phase E: Extraction Hold (140s-150s)
- Purpose: final execution check
- New spawns disabled at `140s`
- Existing enemies remain and can attack
- If player is alive at `150s`, level is won

## Spawn Rules
- Keep existing spawn points from Level 1.
- Keep anti-repeat rule for consecutive spawn points.
- Keep lower-body occlusion behavior as-is for cover points.
- Keep no-immediate-repeat spawn policy to prevent easy pre-aim farming.

## MAG Weapon Rules (Level 2)
- MAG pickup can spawn at most once per level.
- Use a guaranteed spawn window if it has not appeared yet:
- Guarantee window: first enemy kill after `60s`
- If already spawned naturally before `60s`, skip guarantee
- MAG mode duration: `18s` (slightly shorter than Level 1)
- MAG pickup lifetime: `9000ms`

## Pickup Economy (Level 2)
Tune drops per phase to increase tension while staying recoverable.

- Magazine drop chance:
- Phase A: `8%`
- Phase B: `7%`
- Phase C: `6%`
- Phase D: `5%`

- Medikit drop chance:
- Phase A: `5%`
- Phase B: `4%`
- Phase C: `3%`
- Phase D: `2.5%`

- Grenade pickup (`grenade.png`, grants `+1 grenade`) drop chance:
- Phase A: `2.2%`
- Phase B: `2.0%`
- Phase C: `1.8%`
- Phase D: `1.5%`

- Keep caps:
- Max active magazines: `2`
- Max active medikits: `2`
- Max active grenade pickups: `1`
- Max active MAG weapon pickups: `1`

## Difficulty Success Targets
Use these as validation goals after implementation:
- First-time clear rate after up to 3 attempts: `35-50%`
- Average lives left on clear: `0-1`
- Clear rate must remain above `70%` for players who beat Level 1
- No unavoidable ammo starvation in more than 1 of 10 playtests

## UI/Feedback Requirements
- HUD shows:
- `LEVEL 2` timer through `140s`
- `EXTRACT` timer from `140s` to `150s`
- End-state messaging:
- On win: `MISSION COMPLETE`
- On lose: `MISSION FAILED`
- Keep existing click-to-retry behavior on end states.

## Audio Requirements
- Keep existing weapon and enemy audio set.
- During extraction start (`140s`), play one short stinger if available.
- Do not overlap MAG fire tracks; keep the continuous-play behavior already implemented.

## Implementation Checklist
1. Add `LEVEL_2` constants object in game config.
2. Add `levelId` support in `GameScene` so Level 1 and Level 2 can share logic.
3. Make phase-driven spawn config update by elapsed level time.
4. Stop new spawns at extraction start (`140000ms`).
5. Trigger level win at `150000ms` and emit HUD event.
6. Add HUD timer mode switch from `LEVEL 2` to `EXTRACT` at `140s`.
7. Make pickup drop rates phase-aware for Level 2.
8. Add MAG guarantee check at or after `60s` if not yet spawned.
9. Run 10 playtests and tune against success targets.

## Recommended Default Numbers (Ready To Implement)
```js
const LEVEL_2 = {
  durationMs: 150000,
  extractionStartMs: 140000,
  magGuaranteeAfterMs: 60000,
  magModeDurationMs: 18000,
  phases: [
    { startMs: 0, endMs: 35000, spawnDelayMs: 1100, maxActive: 7, grenadeEnemyWeight: 0.38, magazineDropChance: 0.08, medikitDropChance: 0.05, grenadePickupDropChance: 0.022 },
    { startMs: 35000, endMs: 80000, spawnDelayMs: 920, maxActive: 8, grenadeEnemyWeight: 0.46, magazineDropChance: 0.07, medikitDropChance: 0.04, grenadePickupDropChance: 0.02 },
    { startMs: 80000, endMs: 120000, spawnDelayMs: 780, maxActive: 9, grenadeEnemyWeight: 0.5, magazineDropChance: 0.06, medikitDropChance: 0.03, grenadePickupDropChance: 0.018 },
    { startMs: 120000, endMs: 140000, spawnDelayMs: 680, maxActive: 10, grenadeEnemyWeight: 0.56, magazineDropChance: 0.05, medikitDropChance: 0.025, grenadePickupDropChance: 0.015 }
  ]
};
```

## Definition Of Done For Level 2
- End-to-end playable with win + lose flows.
- HUD displays correct phase timers and extraction hold.
- MAG pickup spawns no more than once per level.
- 10 internal runs completed without crashes or softlocks.
- Tuning lands inside success targets.
