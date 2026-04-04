import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { DEFAULT_ENEMY_TYPE_CONFIGS, DEFAULT_SPAWN_POINTS } from "../game/enemySpawnerConfig";

export class EnemySpawner {
  constructor(scene, group, options = {}) {
    this.scene = scene;
    this.group = group;
    this.timer = null;
    this.enemyOptions = options.enemyOptions ?? {};
    this.enemyTextureKeys = options.enemyTextureKeys ?? ["enemy", "enemy-grenade"];
    this.spawnPoints = options.spawnPoints ?? DEFAULT_SPAWN_POINTS;
    this.lastSpawnPointId = null;

    this.enemyTypeConfigs = {
      ...DEFAULT_ENEMY_TYPE_CONFIGS,
      ...(options.enemyTypeConfigs ?? {})
    };

    if (options.cleanFiringFrame != null) {
      this.enemyTypeConfigs.cleanShooter = {
        ...(this.enemyTypeConfigs.cleanShooter ?? {}),
        fireFrame: options.cleanFiringFrame
      };
    }
  }

  start() {
    this.stop();
    this.timer = this.scene.time.addEvent({
      delay: 1200,
      callback: () => this.spawnOne(),
      callbackScope: this,
      loop: true
    });
  }

  stop() {
    if (!this.timer) {
      return;
    }
    this.timer.destroy();
    this.timer = null;
  }

  spawnOne() {
    if (this.group.countActive(true) >= 6) {
      return;
    }

    const eligiblePoints = this.spawnPoints.filter((point) => point.id !== this.lastSpawnPointId);
    const point = Phaser.Utils.Array.GetRandom(eligiblePoints.length > 0 ? eligiblePoints : this.spawnPoints);
    this.lastSpawnPointId = point.id ?? null;
    const enemyTypeConfig = this.enemyTypeConfigs[point.enemyType ?? "default"] ?? this.enemyTypeConfigs.default;
    const availableTextureKeys = this.enemyTextureKeys.filter((key) => this.scene.textures.exists(key));
    const textureKey = availableTextureKeys.length > 0 ? Phaser.Utils.Array.GetRandom(availableTextureKeys) : "enemy";
    const playWidth = this.scene.playWidth ?? this.scene.scale.width;
    const x = playWidth * point.x;
    const y = this.scene.scale.height * point.y;
    const enemy = new Enemy(this.scene, x, y, {
      ...this.enemyOptions,
      ...enemyTypeConfig,
      textureKey,
      flipX: point.side === "right",
      targetHeight: this.scene.scale.height * point.height,
      lowerBodyHideRatio: point.lowerBodyHideRatio ?? 0,
      idleDurationMs: Phaser.Math.Between(250, 900)
    });
    this.group.add(enemy);
  }
}
