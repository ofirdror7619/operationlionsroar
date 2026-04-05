export const DEFAULT_SPAWN_POINTS = [
  { id: "A", x: 0.244, y: 0.263, side: "left", height: 0.2 },
  { id: "D", x: 0.22, y: 0.603, side: "left", height: 0.29, lowerBodyHideRatio: 0.52, bottomTrimRatio: 0, enemyType: "cleanShooter" },
  { id: "mid-left", x: 0.42, y: 0.545, side: "left", height: 0.265 },
  { id: "mid-right", x: 0.615, y: 0.548, side: "right", height: 0.265 },
  { id: "C", x: 0.82, y: 0.555, side: "right", height: 0.28, lowerBodyHideRatio: 0.52, bottomTrimRatio: 0, enemyType: "cleanShooter" },
  { id: "B", x: 0.82, y: 0.276, side: "right", height: 0.2 }
];

export const DEFAULT_ENEMY_TYPE_CONFIGS = {
  default: {},
  cleanShooter: {}
};
