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
    this.spawnDelayMs = Math.max(150, Math.floor(options.spawnDelayMs ?? 1200));
    this.maxActive = Math.max(1, Math.floor(options.maxActive ?? 6));
    this.spawnsEnabled = options.spawnsEnabled ?? true;
    this.enemyTextureWeights = {
      enemy: 1,
      "enemy-grenade": 0.35,
      ...(options.enemyTextureWeights ?? {})
    };

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
    this.startTimer(this.spawnDelayMs);
  }

  stop() {
    if (!this.timer) {
      return;
    }
    this.timer.destroy();
    this.timer = null;
  }

  startTimer(delayMs) {
    const safeDelay = Math.max(150, Math.floor(delayMs));
    this.timer = this.scene.time.addEvent({
      delay: safeDelay,
      callback: () => this.spawnOne(),
      callbackScope: this,
      loop: true
    });
  }

  setSpawnDelay(delayMs) {
    const safeDelay = Math.max(150, Math.floor(delayMs));
    if (safeDelay === this.spawnDelayMs) {
      return;
    }

    this.spawnDelayMs = safeDelay;
    if (!this.timer) {
      return;
    }

    this.stop();
    this.start();
  }

  setMaxActive(maxActive) {
    this.maxActive = Math.max(1, Math.floor(maxActive));
  }

  setEnemyTextureWeights(weights = {}) {
    this.enemyTextureWeights = {
      ...this.enemyTextureWeights,
      ...weights
    };
  }

  setSpawnsEnabled(enabled) {
    this.spawnsEnabled = Boolean(enabled);
  }

  applyDirectorConfig(config = {}) {
    if (config.spawnDelayMs != null) {
      this.setSpawnDelay(config.spawnDelayMs);
    }
    if (config.maxActive != null) {
      this.setMaxActive(config.maxActive);
    }
    if (config.enemyWeights) {
      this.setEnemyTextureWeights(config.enemyWeights);
    }
    if (config.spawnsEnabled != null) {
      this.setSpawnsEnabled(config.spawnsEnabled);
    }
  }

  spawnOne() {
    if (!this.spawnsEnabled) {
      return;
    }

    if (this.group.countActive(true) >= this.maxActive) {
      return;
    }

    const eligiblePoints = this.spawnPoints.filter((point) => point.id !== this.lastSpawnPointId);
    const point = Phaser.Utils.Array.GetRandom(eligiblePoints.length > 0 ? eligiblePoints : this.spawnPoints);
    this.lastSpawnPointId = point.id ?? null;
    const enemyTypeConfig = this.enemyTypeConfigs[point.enemyType ?? "default"] ?? this.enemyTypeConfigs.default;
    const textureKey = this.pickEnemyTextureKey();
    const playWidth = this.scene.playWidth ?? this.scene.scale.width;
    const x = Math.round(playWidth * point.x);
    const y = Math.round(this.scene.scale.height * point.y);
    const minSpawnDistance = Math.max(90, this.scene.scale.height * 0.13);
    let isOccupied = false;
    this.group.children.each((existingEnemy) => {
      if (isOccupied || !existingEnemy?.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(existingEnemy.x, existingEnemy.y, x, y);
      if (distance < minSpawnDistance) {
        isOccupied = true;
      }
    });

    if (isOccupied) {
      return;
    }

    const enemy = new Enemy(this.scene, x, y, {
      ...this.enemyOptions,
      ...enemyTypeConfig,
      textureKey,
      flipX: point.side === "right",
      targetHeight: this.scene.scale.height * point.height,
      lowerBodyHideRatio: point.lowerBodyHideRatio ?? 0,
      bottomTrimRatio: point.bottomTrimRatio,
      enableLowerBodyOcclusion: (point.lowerBodyHideRatio ?? 0) > 0,
      idleDurationMs: Phaser.Math.Between(250, 900)
    });
    this.group.add(enemy);
  }

  pickEnemyTextureKey() {
    const availableTextureKeys = this.enemyTextureKeys.filter((key) => this.scene.textures.exists(key));
    if (availableTextureKeys.length <= 0) {
      return "enemy";
    }

    const weighted = availableTextureKeys
      .map((key) => ({
        key,
        weight: Math.max(0, Number(this.enemyTextureWeights[key] ?? 0))
      }))
      .filter((entry) => entry.weight > 0);

    if (weighted.length <= 0) {
      return Phaser.Utils.Array.GetRandom(availableTextureKeys);
    }

    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Phaser.Math.FloatBetween(0, totalWeight);
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.key;
      }
    }

    return weighted[weighted.length - 1].key;
  }
}
