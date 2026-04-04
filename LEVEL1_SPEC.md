# Level 1 Design Spec (Operation Lion's Roar)

## Goal
Ship a first level that is:
- Beatable by new players in 1-3 attempts
- Short and replayable (about 2-4 minutes)
- Clear in objective and feedback
- Tuned for fairness over chaos

## Win/Lose Conditions
- Win: survive until the Level 1 timer ends at `110s`
- Lose: lives reach `0`
- Restart: keep current restart flow (`click to retry`)

## Level Timeline
Level 1 has 3 phases and one short cooldown at the end.

### Phase A: Intro (0s-30s)
- Purpose: teach pacing and target priority
- Spawn interval: `1600ms`
- Max active enemies: `4`
- Enemy mix: `80% enemy`, `20% enemy-grenade`
- Enemy fire damage: current value (`12`) is fine for now

### Phase B: Pressure (30s-75s)
- Purpose: force faster target switching and resource use
- Spawn interval: `1200ms`
- Max active enemies: `6`
- Enemy mix: `65% enemy`, `35% enemy-grenade`

### Phase C: Final Push (75s-105s)
- Purpose: challenge spike before finish
- Spawn interval: `900ms`
- Max active enemies: `7`
- Enemy mix: `50% enemy`, `50% enemy-grenade`

### Phase D: Extraction Window (105s-110s)
- Purpose: reward survival and avoid cheap last-second deaths
- New spawns disabled
- Existing enemies remain and can still attack
- If player is alive at `110s`, level is won

## Spawn Rules
- Keep existing spawn points.
- Add anti-repeat soft rule: avoid selecting the same spawn point 3 times in a row.
- Keep lower-body occlusion behavior as-is for cover points.

## Scoring Targets
- Base enemy kill score remains `100`.
- Level 1 expected score ranges:
- Bronze: `1800+`
- Silver: `2600+`
- Gold: `3400+`

## Pickup Economy (Level 1)
Current baseline is close; tune by phase:

- Magazine drop chance:
- Phase A: `12%`
- Phase B: `9%`
- Phase C: `7%`

- Medikit drop chance:
- Phase A: `8%`
- Phase B: `6%`
- Phase C: `4%`

- Grenade pickup (`grenade.png`, grants `+1 grenade`) drop chance:
- Phase A: `3%`
- Phase B: `2.5%`
- Phase C: `2%`
- Must always stay lower than medikit drop chance.

- Keep caps:
- Max active magazines: `2`
- Max active medikits: `2`
- Max active grenade pickups: `1`

## Difficulty Success Targets
Use these as validation goals after implementation:
- First-time clear rate: `60-80%` after up to 3 tries
- Average clear time: `2-4 min`
- Average lives left on clear: `0-1`
- No frequent unwinnable ammo starvation

## UI/Feedback Requirements
- HUD shows:
- Time left (or phase progress)
- Score
- Bullets, grenades, health, lives
- End-state messaging:
- On win: `MISSION COMPLETE`
- On lose: existing `MISSION FAILED`

## Audio Requirements
- Regular enemy fire: `ak47-fire`
- Grenade enemy fire: `m203-grenade`
- Keep current player weapon audio set

## Implementation Checklist
1. Add `levelTimerMs = 110000` in `GameScene`.
2. Add phase table with per-phase spawn interval, max active, and enemy mix.
3. Update `EnemySpawner` to support:
   - dynamic spawn interval updates
   - dynamic max active updates
   - weighted random texture key selection (`enemy` vs `enemy-grenade`)
4. Add extraction window logic: stop new spawns at `105s`.
5. Add level win event at `110s` and show mission complete UI in HUD.
6. Add HUD timer/progress text.
7. Make pickup drop chances phase-aware.
8. Keep grenade pickup reward at `+1` and keep grenade pickup chance below medikit in all phases.
9. Playtest 10 runs and tune against success targets.

## Recommended Default Numbers (Ready To Implement)
```js
const LEVEL_1 = {
  durationMs: 110000,
  extractionStartMs: 105000,
  phases: [
    { startMs: 0, endMs: 30000, spawnDelayMs: 1600, maxActive: 4, grenadeEnemyWeight: 0.2, magazineDropChance: 0.12, medikitDropChance: 0.08, grenadePickupDropChance: 0.03 },
    { startMs: 30000, endMs: 75000, spawnDelayMs: 1200, maxActive: 6, grenadeEnemyWeight: 0.35, magazineDropChance: 0.09, medikitDropChance: 0.06, grenadePickupDropChance: 0.025 },
    { startMs: 75000, endMs: 105000, spawnDelayMs: 900, maxActive: 7, grenadeEnemyWeight: 0.5, magazineDropChance: 0.07, medikitDropChance: 0.04, grenadePickupDropChance: 0.02 }
  ]
};
```

## Definition Of Done For Level 1
- End-to-end playable with win + lose flows.
- 10 internal runs completed without crashes or softlocks.
- Tuning lands inside success targets.
- HUD and audio feedback complete and readable.
