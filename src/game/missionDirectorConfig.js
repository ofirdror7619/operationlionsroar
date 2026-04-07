export const LEVEL_2_KILL_TARGET = 50;
export const LEVEL_4_KILL_TARGET = 40;

export const LEVEL_4_HOSTAGE_ZONE = {
  x1: 0.463,
  x2: 0.55,
  y1: 0.397,
  y2: 0.625
};

export const LEVEL_4_SPAWN_POINTS = [
  { id: "A", x: 0.12, y: 0.528, side: "left", height: 0.43, lowerBodyHideRatio: 0, bottomTrimRatio: 0, enemyType: "cleanShooter" },
  { id: "D", x: 0.365, y: 0.537, side: "left", height: 0.4, lowerBodyHideRatio: 0.42, bottomTrimRatio: 0, enemyType: "cleanShooter" },
  { id: "E", x: 0.409, y: 0.488, side: "left", height: 0.37, lowerBodyHideRatio: 0.3, bottomTrimRatio: 0, enemyType: "cleanShooter" },
  { id: "C", x: 0.632, y: 0.528, side: "right", height: 0.41, lowerBodyHideRatio: 0, bottomTrimRatio: 0, enemyType: "cleanShooter" },
  { id: "B", x: 0.902, y: 0.66, side: "right", height: 0.52, lowerBodyHideRatio: 0, bottomTrimRatio: 0, enemyType: "cleanShooter" }
];

export const PHASE_DIRECTOR_CONFIGS = {
  1: {
    durationMs: 110000,
    extractionStartMs: 105000,
    phases: [
      {
        id: "L1-A",
        startMs: 0,
        endMs: 30000,
        spawnDelayMs: 1600,
        maxActive: 4,
        enemyWeights: { enemy: 0.8, "enemy-grenade": 0.2 },
        magazineDropChance: 0.12,
        medikitDropChance: 0.08,
        grenadePickupDropChance: 0.03
      },
      {
        id: "L1-B",
        startMs: 30000,
        endMs: 75000,
        spawnDelayMs: 1200,
        maxActive: 6,
        enemyWeights: { enemy: 0.65, "enemy-grenade": 0.35 },
        magazineDropChance: 0.09,
        medikitDropChance: 0.06,
        grenadePickupDropChance: 0.025
      },
      {
        id: "L1-C",
        startMs: 75000,
        endMs: 105000,
        spawnDelayMs: 900,
        maxActive: 7,
        enemyWeights: { enemy: 0.5, "enemy-grenade": 0.5 },
        magazineDropChance: 0.07,
        medikitDropChance: 0.04,
        grenadePickupDropChance: 0.02
      }
    ]
  },
  2: {
    durationMs: 0,
    extractionStartMs: 0,
    phases: [
      {
        id: "L2-A",
        startMs: 0,
        endMs: 35000,
        spawnDelayMs: 1100,
        maxActive: 7,
        enemyWeights: { enemy: 0.62, "enemy-grenade": 0.38 },
        magazineDropChance: 0.08,
        medikitDropChance: 0.05,
        grenadePickupDropChance: 0.022
      },
      {
        id: "L2-B",
        startMs: 35000,
        endMs: 80000,
        spawnDelayMs: 920,
        maxActive: 8,
        enemyWeights: { enemy: 0.54, "enemy-grenade": 0.46 },
        magazineDropChance: 0.07,
        medikitDropChance: 0.04,
        grenadePickupDropChance: 0.02
      },
      {
        id: "L2-C",
        startMs: 80000,
        endMs: 120000,
        spawnDelayMs: 780,
        maxActive: 9,
        enemyWeights: { enemy: 0.5, "enemy-grenade": 0.5 },
        magazineDropChance: 0.06,
        medikitDropChance: 0.03,
        grenadePickupDropChance: 0.018
      },
      {
        id: "L2-D",
        startMs: 120000,
        endMs: Number.POSITIVE_INFINITY,
        spawnDelayMs: 680,
        maxActive: 10,
        enemyWeights: { enemy: 0.44, "enemy-grenade": 0.56 },
        magazineDropChance: 0.05,
        medikitDropChance: 0.025,
        grenadePickupDropChance: 0.015
      }
    ]
  },
  3: {
    durationMs: 150000,
    extractionStartMs: 142000,
    phases: [
      {
        id: "L3-A",
        startMs: 0,
        endMs: 50000,
        spawnDelayMs: 900,
        maxActive: 8,
        enemyWeights: { enemy: 0.52, "enemy-grenade": 0.48 },
        magazineDropChance: 0.06,
        medikitDropChance: 0.035,
        grenadePickupDropChance: 0.018
      },
      {
        id: "L3-B",
        startMs: 50000,
        endMs: 105000,
        spawnDelayMs: 760,
        maxActive: 9,
        enemyWeights: { enemy: 0.45, "enemy-grenade": 0.55 },
        magazineDropChance: 0.05,
        medikitDropChance: 0.03,
        grenadePickupDropChance: 0.015
      },
      {
        id: "L3-C",
        startMs: 105000,
        endMs: 142000,
        spawnDelayMs: 650,
        maxActive: 10,
        enemyWeights: { enemy: 0.38, "enemy-grenade": 0.62 },
        magazineDropChance: 0.045,
        medikitDropChance: 0.022,
        grenadePickupDropChance: 0.012
      }
    ]
  },
  4: {
    durationMs: 0,
    extractionStartMs: 0,
    phases: [
      {
        id: "L4-A",
        startMs: 0,
        endMs: 42000,
        spawnDelayMs: 1250,
        maxActive: 4,
        enemyWeights: { enemy: 0.78, "enemy-grenade": 0.22 },
        magazineDropChance: 0.09,
        medikitDropChance: 0.065,
        grenadePickupDropChance: 0.026
      },
      {
        id: "L4-B",
        startMs: 42000,
        endMs: 90000,
        spawnDelayMs: 980,
        maxActive: 5,
        enemyWeights: { enemy: 0.66, "enemy-grenade": 0.34 },
        magazineDropChance: 0.075,
        medikitDropChance: 0.05,
        grenadePickupDropChance: 0.021
      },
      {
        id: "L4-C",
        startMs: 90000,
        endMs: 122000,
        spawnDelayMs: 840,
        maxActive: 6,
        enemyWeights: { enemy: 0.58, "enemy-grenade": 0.42 },
        magazineDropChance: 0.06,
        medikitDropChance: 0.038,
        grenadePickupDropChance: 0.017
      }
    ]
  }
};
