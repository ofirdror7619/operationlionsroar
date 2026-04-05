import Phaser from "phaser";
import { EnemySpawner } from "../systems/EnemySpawner";
import { GameState } from "../systems/GameState";
import { PLAY_WIDTH } from "../game/config";

const MUSIC_LOOP_START_SECONDS = 15;
const MUSIC_LOOP_MARKER = "main-loop";
const MAGAZINE_DROP_CHANCE = 0.09;
const MAGAZINE_AMMO_REWARD = 20;
const MAGAZINE_MAX_ACTIVE = 2;
const MAGAZINE_LIFETIME_MS = 8000;
const MEDIKIT_DROP_CHANCE = 0.06;
const MEDIKIT_HEALTH_REWARD = 20;
const MEDIKIT_MAX_ACTIVE = 2;
const MEDIKIT_LIFETIME_MS = 8000;
const GRENADE_PICKUP_DROP_CHANCE = 0.03;
const GRENADE_PICKUP_REWARD = 1;
const GRENADE_PICKUP_MAX_ACTIVE = 1;
const GRENADE_PICKUP_LIFETIME_MS = 8000;
const HEART_PICKUP_DROP_CHANCE = 0.007;
const HEART_PICKUP_REWARD = 1;
const HEART_PICKUP_MAX_ACTIVE = 1;
const HEART_PICKUP_LIFETIME_MS = 9000;
const MAG_WEAPON_PICKUP_DROP_CHANCE = 0.015;
const MAG_WEAPON_PICKUP_MAX_ACTIVE = 1;
const MAG_WEAPON_PICKUP_LIFETIME_MS = 9000;
const MAG_MODE_DURATION_MS = 20000;
const LEVEL_1_SURVIVAL_DURATION_MS = 110000;
const LEVEL_3_SURVIVAL_DURATION_MS = 150000;
const LEVEL_2_KILL_TARGET = 40;
const BASE_FIRE_COOLDOWN_MS = 150;
const MAG_FIRE_COOLDOWN_MS = 70;
const MAG_AIM_ASSIST_RADIUS = 44;
const ENEMY_FIRE_DAMAGE = 12;
const GRENADE_ENEMY_FIRE_DAMAGE = 18;
const BASE_ENEMY_AIM_DURATION_MS = 3000;
const LEVEL_3_ENEMY_AIM_DURATION_MS = 1000;
const WEAPON_SOURCE_FRAME_WIDTH = 384;
const WEAPON_SOURCE_FRAME_HEIGHT = 256;
const WEAPON_LEFT_CROP_PX = 78;
const WEAPON_BOTTOM_CROP_PX = 22;
const WEAPON_MUZZLE_OFFSET_X = 246;
const WEAPON_MUZZLE_OFFSET_Y = 178;
const WEAPON_TILT_DEGREES = -6.5;
const WEAPON_TILT_Y_KICK = -7;
const WEAPON_TILT_X_KICK = 0;
const WEAPON_TILT_IN_MS = 38;
const WEAPON_TILT_OUT_MS = 110;
const WEAPON_GRENADE_ANIM_FPS = 10;
const WEAPON_AIM_FOLLOW_X_MAX = 26;
const WEAPON_AIM_FOLLOW_Y_MAX = 18;
const WEAPON_AIM_FOLLOW_ANGLE_MAX = 5;
const WEAPON_AIM_FOLLOW_LERP = 0.2;
const UI_DISPLAY_FONT = "'Barlow Condensed', 'Teko', sans-serif";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
    this.levelId = 1;
    this.state = null;
    this.enemies = null;
    this.magazinePickups = null;
    this.medikitPickups = null;
    this.grenadePickups = null;
    this.heartPickups = null;
    this.magWeaponPickups = null;
    this.spawner = null;
    this.damageOverlay = null;
    this.magModeEndsAt = 0;
    this.levelEndsAt = 0;
    this.hasSpawnedMagWeaponPickup = false;
    this.lastShotAtMs = -99999;
    this.magTimerText = null;
    this.magFireSound = null;
    this.objectiveText = null;
    this.killCount = 0;
    this.playWidth = PLAY_WIDTH;
    this.gameOver = false;
    this.levelComplete = false;
    this.weaponSprite = null;
    this.crosshair = null;
    this.ammoText = null;
    this.ammoSegments = [];
    this.grenadeText = null;
    this.lifeBarSprite = null;
    this.lifeBarSourceWidth = 0;
    this.lifeBarSourceHeight = 0;
    this.lifeBarTileCount = 20;
    this.gameStatusText = null;
    this.retryButton = null;
    this.retryButtonLabel = null;
    this.weaponSpriteSheetKey = "weapon-m203-sheet";
    this.weaponBaseX = 0;
    this.weaponBaseY = 0;
    this.weaponAimTargetX = 0;
    this.weaponAimTargetY = 0;
    this.weaponAimTargetAngle = 0;
  }

  init(data = {}) {
    this.levelId = data.levelId ?? 1;
  }

  create() {
    this.startBackgroundMusic();

    this.state = new GameState();
    this.gameOver = false;
    this.levelComplete = false;
    this.killCount = 0;
    this.magModeEndsAt = 0;
    this.hasSpawnedMagWeaponPickup = false;
    this.lastShotAtMs = -99999;
    this.enemies = this.physics.add.group();
    this.magazinePickups = this.add.group();
    this.medikitPickups = this.add.group();
    this.grenadePickups = this.add.group();
    this.heartPickups = this.add.group();
    this.magWeaponPickups = this.add.group();

    this.add
      .image(this.playWidth / 2, this.scale.height / 2, "bg")
      .setDisplaySize(this.playWidth, this.scale.height);
    this.createWeaponView();
    this.createCrosshair();
    this.createBottomResourceCounters();
    this.createLifeBar();
    this.createDamageOverlay();
    this.magTimerText = this.add.text(this.playWidth / 2, 46, "", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "30px",
      color: "#89ddff",
      stroke: "#0a1724",
      strokeThickness: 5,
      letterSpacing: 2
    })
      .setOrigin(0.5, 0)
      .setDepth(95)
      .setVisible(false);

    this.objectiveText = this.add.text(this.playWidth / 2, 10, this.getLevelObjectiveText(), {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "30px",
      color: "#e2f2ff",
      stroke: "#0a1724",
      strokeThickness: 5,
      letterSpacing: 2
    })
      .setOrigin(0.5, 0)
      .setDepth(95);

    this.magFireSound = this.sound.add("mag-fire", {
      volume: 0.55,
      loop: true
    });

    this.spawner = new EnemySpawner(this, this.enemies, {
      enemyOptions: {
        aimDurationMs: this.levelId >= 3 ? LEVEL_3_ENEMY_AIM_DURATION_MS : BASE_ENEMY_AIM_DURATION_MS,
        onPlayerHit: (enemy) => {
          this.playEnemyFireSound(enemy);
          this.showEnemyMuzzleFlash(enemy);
          this.flashPlayerHit();
          const isGrenadeEnemy = enemy?.enemyTypeKey === "enemy-grenade";
          this.state.applyDamage(isGrenadeEnemy ? GRENADE_ENEMY_FIRE_DAMAGE : ENEMY_FIRE_DAMAGE);
          this.cameras.main.shake(120, 0.003);

          if (this.state.hp <= 0) {
            this.handlePlayerDeath();
            return;
          }

          this.emitHudUpdate();
        }
      }
    });
    this.spawner.start();

    this.input.setDefaultCursor("none");
    this.input.mouse?.disableContextMenu();
    this.emitHudUpdate();

    this.input.on("pointerdown", (pointer) => {
      if (this.gameOver) {
        return;
      }

      if (this.levelComplete) {
        this.continueToNextChallenge();
        return;
      }

      if (pointer.rightButtonDown()) {
        this.throwGrenade(pointer);
        return;
      }

      this.tryShoot(pointer);
    });

    this.input.on("pointerup", () => {
      this.stopMagFireSound();
    });
    this.gameStatusText = this.add
      .text(this.playWidth / 2, this.scale.height * 0.45, "", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "44px",
        color: "#e6f3ff",
        stroke: "#0a1724",
        strokeThickness: 6,
        align: "center",
        letterSpacing: 2
      })
      .setDepth(1400)
      .setOrigin(0.5)
      .setVisible(false);

    this.retryButton = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2 + 84, 240, 54, 0x1f7f77, 0.98)
      .setStrokeStyle(2, 0x8fe3dd, 0.92)
      .setDepth(1401)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.retryButtonLabel = this.add
      .text(this.retryButton.x, this.retryButton.y, "RETRY", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "34px",
        color: "#04171b",
        letterSpacing: 3
      })
      .setOrigin(0.5)
      .setDepth(1402)
      .setVisible(false);
    this.retryButton.on("pointerover", () => {
      if (this.retryButton?.visible) {
        this.retryButton.setFillStyle(0x2b968d, 1);
      }
    });
    this.retryButton.on("pointerout", () => {
      if (this.retryButton?.visible) {
        this.retryButton.setFillStyle(0x1f7f77, 0.98);
      }
    });
    this.retryButton.on("pointerup", () => {
      if (this.retryButton?.visible && this.gameOver) {
        this.restart();
      }
    });

    const levelDurationMs = this.getLevelDurationMs();
    this.levelEndsAt = levelDurationMs > 0 ? this.time.now + levelDurationMs : 0;
  }

  update(_time, delta) {
    if (this.gameOver || this.levelComplete) {
      return;
    }

    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }

      enemy.updateEnemy(delta);
    });

    this.updateMagMode();
    this.updateWeaponAimFollow();
    this.checkLevelEnd();
    const pointer = this.input.activePointer;
    if (this.isMagModeActive() && pointer?.isDown && !pointer.rightButtonDown()) {
      this.tryShoot(pointer);
    }
  }

  tryShoot(pointer) {
    const cooldownMs = this.isMagModeActive() ? MAG_FIRE_COOLDOWN_MS : BASE_FIRE_COOLDOWN_MS;
    const nowMs = this.time.now;
    if (nowMs - this.lastShotAtMs < cooldownMs) {
      return;
    }

    this.lastShotAtMs = nowMs;
    this.shoot(pointer);
  }

  shoot(pointer) {
    if (pointer.worldX > this.playWidth) {
      return;
    }

    const isMagMode = this.isMagModeActive();
    if (!isMagMode && !this.state.consumeAmmo()) {
      this.playEmptyFireSound();
      this.cameras.main.shake(80, 0.002);
      this.emitHudUpdate();
      return;
    }

    this.playFireSound();
    this.playWeaponActionAnimation("fire");

    let didHit = this.tryKillEnemyAt(pointer.worldX, pointer.worldY, isMagMode);

    if (!didHit) {
      didHit = this.tryCollectMagazine(pointer.worldX, pointer.worldY);
    }
    if (!didHit) {
      didHit = this.tryCollectMedikit(pointer.worldX, pointer.worldY);
    }
    if (!didHit) {
      didHit = this.tryCollectGrenadePickup(pointer.worldX, pointer.worldY);
    }
    if (!didHit) {
      didHit = this.tryCollectHeartPickup(pointer.worldX, pointer.worldY);
    }
    if (!didHit) {
      didHit = this.tryCollectMagWeaponPickup(pointer.worldX, pointer.worldY);
    }

    if (!didHit) {
      this.emitHudUpdate();
    }
  }

  tryKillEnemyAt(worldX, worldY, allowAimAssist = false) {
    let targetEnemy = null;
    this.enemies.children.each((enemy) => {
      if (!enemy?.active || targetEnemy) {
        return;
      }

      if (enemy.isHit(worldX, worldY)) {
        targetEnemy = enemy;
      }
    });

    if (!targetEnemy && allowAimAssist) {
      let closestDistance = Number.POSITIVE_INFINITY;
      this.enemies.children.each((enemy) => {
        if (!enemy?.active) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y);
        if (distance <= MAG_AIM_ASSIST_RADIUS && distance < closestDistance) {
          closestDistance = distance;
          targetEnemy = enemy;
        }
      });
    }

    if (!targetEnemy) {
      return false;
    }

    return this.killEnemy(targetEnemy);
  }

  throwGrenade(pointer) {
    if (pointer.worldX > this.playWidth) {
      return;
    }

    if (!this.state.consumeGrenade()) {
      this.cameras.main.shake(110, 0.0025);
      return;
    }

    this.playGrenadeSound();
    this.playWeaponActionAnimation("grenade");

    const radius = 170;
    const blast = this.add
      .image(pointer.worldX, pointer.worldY, "grenade-blast")
      .setScale(0.08)
      .setDepth(70)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: blast,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 260,
      onComplete: () => blast.destroy()
    });

    this.enemies.children.each((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, enemy.x, enemy.y);
      if (distance <= radius) {
        this.killEnemy(enemy, { emitHudUpdate: false });
      }
    });

    this.emitHudUpdate();
    this.cameras.main.shake(180, 0.004);
  }

  killEnemy(enemy, options = {}) {
    const emitHudUpdate = options.emitHudUpdate ?? true;
    if (!enemy?.active) {
      return false;
    }

    const deathX = enemy.x;
    const deathY = enemy.y;
    this.stopEnemyFireSound(enemy);
    enemy.kill();
    this.killCount += 1;
    this.state.addScore(enemy.points);
    this.trySpawnMagazineDrop(deathX, deathY);
    this.trySpawnMedikitDrop(deathX, deathY);
    this.trySpawnGrenadePickupDrop(deathX, deathY);
    this.trySpawnHeartPickupDrop(deathX, deathY);
    this.trySpawnMagWeaponPickupDrop(deathX, deathY);

    if (this.isKillObjectiveLevel()) {
      this.updateObjectiveText();
      if (!this.levelComplete && this.killCount >= LEVEL_2_KILL_TARGET) {
        this.showObjectiveCompleteFlash();
        this.setLevelComplete();
      }
    }

    if (emitHudUpdate) {
      this.emitHudUpdate();
    }

    return true;
  }

  trySpawnMagazineDrop(originX, originY) {
    if (!this.magazinePickups) {
      return;
    }

    if (this.magazinePickups.countActive(true) >= MAGAZINE_MAX_ACTIVE) {
      return;
    }

    if (Phaser.Math.FloatBetween(0, 1) > MAGAZINE_DROP_CHANCE) {
      return;
    }

    const x = Phaser.Math.Clamp(originX + Phaser.Math.Between(-72, 72), 24, this.playWidth - 24);
    const y = Phaser.Math.Clamp(originY + Phaser.Math.Between(-48, 48), 28, this.scale.height - 28);
    const pickup = this.add.image(x, y, "magazine").setDepth(74);

    const targetWidth = 54;
    pickup.setScale(targetWidth / pickup.width);
    this.magazinePickups.add(pickup);

    this.tweens.add({
      targets: pickup,
      y: pickup.y - 5,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.time.delayedCall(MAGAZINE_LIFETIME_MS, () => {
      if (pickup.active) {
        pickup.destroy();
      }
    });
  }

  tryCollectMagazine(worldX, worldY) {
    if (!this.magazinePickups) {
      return false;
    }

    let didCollect = false;
    this.magazinePickups.children.each((pickup) => {
      if (didCollect || !pickup?.active) {
        return;
      }

      if (pickup.getBounds().contains(worldX, worldY)) {
        didCollect = true;
        pickup.destroy();
        this.state.addAmmo(MAGAZINE_AMMO_REWARD);
        this.emitHudUpdate();
        this.showAmmoPickupText(worldX, worldY);
      }
    });

    return didCollect;
  }

  trySpawnMedikitDrop(originX, originY) {
    if (!this.medikitPickups) {
      return;
    }

    if (this.medikitPickups.countActive(true) >= MEDIKIT_MAX_ACTIVE) {
      return;
    }

    if (Phaser.Math.FloatBetween(0, 1) > MEDIKIT_DROP_CHANCE) {
      return;
    }

    const x = Phaser.Math.Clamp(originX + Phaser.Math.Between(-72, 72), 24, this.playWidth - 24);
    const y = Phaser.Math.Clamp(originY + Phaser.Math.Between(-48, 48), 28, this.scale.height - 28);
    const pickup = this.add.image(x, y, "medikit").setDepth(74);

    const targetWidth = 54;
    pickup.setScale(targetWidth / pickup.width);
    this.medikitPickups.add(pickup);

    this.tweens.add({
      targets: pickup,
      y: pickup.y - 5,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.time.delayedCall(MEDIKIT_LIFETIME_MS, () => {
      if (pickup.active) {
        pickup.destroy();
      }
    });
  }

  tryCollectMedikit(worldX, worldY) {
    if (!this.medikitPickups) {
      return false;
    }

    let didCollect = false;
    this.medikitPickups.children.each((pickup) => {
      if (didCollect || !pickup?.active) {
        return;
      }

      if (pickup.getBounds().contains(worldX, worldY)) {
        didCollect = true;
        pickup.destroy();
        this.state.heal(MEDIKIT_HEALTH_REWARD);
        this.emitHudUpdate();
        this.showHealthPickupText(worldX, worldY);
      }
    });

    return didCollect;
  }

  trySpawnGrenadePickupDrop(originX, originY) {
    if (!this.grenadePickups) {
      return;
    }

    if (this.grenadePickups.countActive(true) >= GRENADE_PICKUP_MAX_ACTIVE) {
      return;
    }

    if (Phaser.Math.FloatBetween(0, 1) > GRENADE_PICKUP_DROP_CHANCE) {
      return;
    }

    const x = Phaser.Math.Clamp(originX + Phaser.Math.Between(-72, 72), 24, this.playWidth - 24);
    const y = Phaser.Math.Clamp(originY + Phaser.Math.Between(-48, 48), 28, this.scale.height - 28);
    const pickup = this.add.image(x, y, "grenade-pickup").setDepth(74);

    const targetWidth = 54;
    pickup.setScale(targetWidth / pickup.width);
    this.grenadePickups.add(pickup);

    this.tweens.add({
      targets: pickup,
      y: pickup.y - 5,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.time.delayedCall(GRENADE_PICKUP_LIFETIME_MS, () => {
      if (pickup.active) {
        pickup.destroy();
      }
    });
  }

  tryCollectGrenadePickup(worldX, worldY) {
    if (!this.grenadePickups) {
      return false;
    }

    let didCollect = false;
    this.grenadePickups.children.each((pickup) => {
      if (didCollect || !pickup?.active) {
        return;
      }

      if (pickup.getBounds().contains(worldX, worldY)) {
        didCollect = true;
        pickup.destroy();
        this.state.addGrenades(GRENADE_PICKUP_REWARD);
        this.emitHudUpdate();
        this.showGrenadePickupText(worldX, worldY);
      }
    });

    return didCollect;
  }

  trySpawnHeartPickupDrop(originX, originY) {
    if (!this.heartPickups) {
      return;
    }

    if (this.heartPickups.countActive(true) >= HEART_PICKUP_MAX_ACTIVE) {
      return;
    }

    if (Phaser.Math.FloatBetween(0, 1) > HEART_PICKUP_DROP_CHANCE) {
      return;
    }

    const x = Phaser.Math.Clamp(originX + Phaser.Math.Between(-72, 72), 24, this.playWidth - 24);
    const y = Phaser.Math.Clamp(originY + Phaser.Math.Between(-48, 48), 28, this.scale.height - 28);
    const pickup = this.add.image(x, y, "heart-pickup").setDepth(74);

    const targetWidth = 52;
    pickup.setScale(targetWidth / pickup.width);
    this.heartPickups.add(pickup);

    this.tweens.add({
      targets: pickup,
      y: pickup.y - 5,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.time.delayedCall(HEART_PICKUP_LIFETIME_MS, () => {
      if (pickup.active) {
        pickup.destroy();
      }
    });
  }

  tryCollectHeartPickup(worldX, worldY) {
    if (!this.heartPickups) {
      return false;
    }

    let didCollect = false;
    this.heartPickups.children.each((pickup) => {
      if (didCollect || !pickup?.active) {
        return;
      }

      if (pickup.getBounds().contains(worldX, worldY)) {
        didCollect = true;
        pickup.destroy();
        this.state.addLife(HEART_PICKUP_REWARD);
        this.emitHudUpdate();
        this.showLifePickupText(worldX, worldY);
      }
    });

    return didCollect;
  }

  trySpawnMagWeaponPickupDrop(originX, originY) {
    if (!this.magWeaponPickups) {
      return;
    }

    if (this.hasSpawnedMagWeaponPickup) {
      return;
    }

    if (this.magWeaponPickups.countActive(true) >= MAG_WEAPON_PICKUP_MAX_ACTIVE) {
      return;
    }

    if (Phaser.Math.FloatBetween(0, 1) > MAG_WEAPON_PICKUP_DROP_CHANCE) {
      return;
    }

    const x = Phaser.Math.Clamp(originX + Phaser.Math.Between(-72, 72), 24, this.playWidth - 24);
    const y = Phaser.Math.Clamp(originY + Phaser.Math.Between(-48, 48), 28, this.scale.height - 28);
    const pickup = this.add.image(x, y, "mag-weapon-pickup").setDepth(74);

    this.hasSpawnedMagWeaponPickup = true;
    const targetWidth = 56;
    pickup.setScale(targetWidth / pickup.width);
    this.magWeaponPickups.add(pickup);

    this.tweens.add({
      targets: pickup,
      y: pickup.y - 5,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.time.delayedCall(MAG_WEAPON_PICKUP_LIFETIME_MS, () => {
      if (pickup.active) {
        pickup.destroy();
      }
    });
  }

  tryCollectMagWeaponPickup(worldX, worldY) {
    if (!this.magWeaponPickups) {
      return false;
    }

    let didCollect = false;
    this.magWeaponPickups.children.each((pickup) => {
      if (didCollect || !pickup?.active) {
        return;
      }

      if (pickup.getBounds().contains(worldX, worldY)) {
        didCollect = true;
        pickup.destroy();
        this.activateMagMode();
        this.showMagWeaponPickupText(worldX, worldY);
      }
    });

    return didCollect;
  }

  showAmmoPickupText(x, y) {
    const text = this.add.text(x, y - 16, `+${MAGAZINE_AMMO_REWARD} AMMO`, {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "26px",
      color: "#e8f5ff",
      stroke: "#0b1622",
      strokeThickness: 5,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: text,
      y: y - 44,
      alpha: 0,
      duration: 460,
      onComplete: () => text.destroy()
    });
  }

  showHealthPickupText(x, y) {
    const text = this.add.text(x, y - 16, `+${MEDIKIT_HEALTH_REWARD} HP`, {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "26px",
      color: "#9effb7",
      stroke: "#0b2315",
      strokeThickness: 5,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: text,
      y: y - 44,
      alpha: 0,
      duration: 460,
      onComplete: () => text.destroy()
    });
  }

  showGrenadePickupText(x, y) {
    const text = this.add.text(x, y - 16, `+${GRENADE_PICKUP_REWARD} GRENADE`, {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "26px",
      color: "#ffd086",
      stroke: "#2c1801",
      strokeThickness: 5,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: text,
      y: y - 44,
      alpha: 0,
      duration: 460,
      onComplete: () => text.destroy()
    });
  }

  showLifePickupText(x, y) {
    const text = this.add.text(x, y - 16, `+${HEART_PICKUP_REWARD} LIFE`, {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "28px",
      color: "#ff93a8",
      stroke: "#31111a",
      strokeThickness: 5,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: text,
      y: y - 44,
      alpha: 0,
      duration: 520,
      onComplete: () => text.destroy()
    });
  }

  showMagWeaponPickupText(x, y) {
    const text = this.add.text(x, y - 16, "FN-MAG-58 ONLINE", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "27px",
      color: "#7ce5d9",
      stroke: "#06211f",
      strokeThickness: 5,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: text,
      y: y - 44,
      alpha: 0,
      duration: 520,
      onComplete: () => text.destroy()
    });
  }

  handlePlayerDeath() {
    this.emitHudUpdate();
    this.setGameOver();
  }

  setGameOver() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.spawner.stop();
    this.enemies.children.each((enemy) => {
      if (!enemy?.active) {
        return;
      }

      this.stopEnemyFireSound(enemy);
      enemy.forceIdle?.();
    });
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    if (this.gameStatusText?.active) {
      this.gameStatusText.setText("MISSION FAILED").setVisible(true);
    }
    this.retryButton?.setVisible(true);
    this.retryButtonLabel?.setVisible(true);
  }

  setLevelComplete() {
    if (this.levelComplete || this.gameOver) {
      return;
    }

    this.levelComplete = true;
    this.spawner.stop();
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    if (this.gameStatusText?.active) {
      this.gameStatusText.setText("MISSION COMPLETE\nClick to continue").setVisible(true);
    }
    this.retryButton?.setVisible(false);
    this.retryButtonLabel?.setVisible(false);
  }

  checkLevelEnd() {
    if (this.isKillObjectiveLevel()) {
      return;
    }

    if (this.levelEndsAt > 0 && this.time.now >= this.levelEndsAt) {
      this.setLevelComplete();
    }
  }

  restart() {
    this.scene.restart({ levelId: this.levelId });
  }

  continueToNextChallenge() {
    if (!this.levelComplete || this.gameOver) {
      return;
    }

    this.scene.restart({ levelId: this.levelId + 1 });
  }

  getLevelObjectiveText() {
    if (this.isKillObjectiveLevel()) {
      const displayedKills = Math.min(this.killCount, LEVEL_2_KILL_TARGET);
      return `OBJECTIVE: CHALLENGE 2 - KILL ${LEVEL_2_KILL_TARGET} ENEMIES (${displayedKills}/${LEVEL_2_KILL_TARGET})`;
    }

    const secondsToSurvive = Math.floor(this.getLevelDurationMs() / 1000);
    const challengeNumber = Math.max(1, this.levelId);
    return `OBJECTIVE: CHALLENGE ${challengeNumber} - SURVIVE FOR ${secondsToSurvive} SECONDS`;
  }

  isKillObjectiveLevel() {
    return this.levelId === 2;
  }

  getLevelDurationMs() {
    if (this.levelId >= 3) {
      return LEVEL_3_SURVIVAL_DURATION_MS;
    }

    if (this.levelId <= 1) {
      return LEVEL_1_SURVIVAL_DURATION_MS;
    }

    return 0;
  }

  updateObjectiveText() {
    if (!this.objectiveText?.active) {
      return;
    }

    this.objectiveText.setText(this.getLevelObjectiveText());
  }

  showObjectiveCompleteFlash() {
    if (!this.objectiveText?.active) {
      return;
    }

    this.tweens.add({
      targets: this.objectiveText,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 100,
      yoyo: true,
      repeat: 1,
      ease: "Sine.Out"
    });

    const completeText = this.add.text(this.playWidth / 2, 80, "OBJECTIVE COMPLETE!", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "40px",
      color: "#8ff4e5",
      stroke: "#06221f",
      strokeThickness: 6,
      letterSpacing: 2
    })
      .setOrigin(0.5, 0)
      .setDepth(99);

    this.tweens.add({
      targets: completeText,
      y: 62,
      alpha: 0,
      duration: 600,
      ease: "Quad.Out",
      onComplete: () => completeText.destroy()
    });
  }

  updateMagMode() {
    if (!this.magTimerText) {
      return;
    }

    const isActive = this.isMagModeActive();
    if (this.weaponSprite?.active) {
      this.weaponSprite.setVisible(!isActive);
      if (!isActive && !this.weaponSprite.anims.isPlaying) {
        this.resetWeaponPosition();
        this.weaponSprite.play("weapon-m203-idle");
      }
    }

    if (!isActive) {
      if (this.magTimerText.visible) {
        this.magTimerText.setVisible(false);
        this.emitHudUpdate();
      }
      this.stopMagFireSound();
      return;
    }

    const secondsLeft = Math.ceil((this.magModeEndsAt - this.time.now) / 1000);
    this.magTimerText.setText(`FN-MAG-58: ${secondsLeft}`).setVisible(true);
  }

  activateMagMode() {
    this.magModeEndsAt = this.time.now + MAG_MODE_DURATION_MS;
    this.emitHudUpdate();
    this.updateMagMode();
  }

  isMagModeActive() {
    return this.time.now < this.magModeEndsAt;
  }

  emitHudUpdate() {
    if (this.ammoText?.active) {
      const ammo = Math.floor(this.state.ammo);
      this.ammoText.setText(`${ammo}`);
      this.ammoText.setColor(ammo <= 20 ? "#ff5f72" : "#e4f2ff");
      this.updateAmmoSegments(ammo);
    }
    if (this.grenadeText?.active) {
      this.grenadeText.setText(`x${Math.floor(this.state.grenades)}`);
    }
    this.updateLifeBar(this.state.hp / this.state.maxHp);
  }

  createDamageOverlay() {
    this.damageOverlay = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth, this.scale.height, 0xcc2020, 0)
      .setDepth(85);
  }

  createLifeBar() {
    const displayHeight = this.scale.height * 0.56;
    const source = this.textures.get("health-bar").getSourceImage();
    const displayWidth = displayHeight * (source.width / source.height);
    const x = displayWidth * 0.5 + 10;
    const y = this.scale.height * 0.5;

    this.lifeBarSourceWidth = source.width;
    this.lifeBarSourceHeight = source.height;
    this.lifeBarSprite = this.add
      .image(x, y, "health-bar")
      .setDisplaySize(displayWidth, displayHeight)
      .setOrigin(0.5)
      .setDepth(300);
    this.updateLifeBar(1);
  }

  updateLifeBar(normalizedValue) {
    if (!this.lifeBarSprite) {
      return;
    }

    const value = Phaser.Math.Clamp(normalizedValue, 0, 1);
    const visibleTiles = Math.ceil(value * this.lifeBarTileCount);
    const steppedValue = visibleTiles / this.lifeBarTileCount;
    const cropHeight = Math.floor(this.lifeBarSourceHeight * steppedValue);
    const cropY = this.lifeBarSourceHeight - cropHeight;
    if (cropHeight <= 0) {
      this.lifeBarSprite.setVisible(false);
      return;
    }

    this.lifeBarSprite.setVisible(true);
    this.lifeBarSprite.setCrop(0, cropY, this.lifeBarSourceWidth, cropHeight);
  }

  createBottomResourceCounters() {
    const y = this.scale.height - 26;
    const resourceIconSize = 58;
    this.add
      .rectangle(172, y, 300, 62, 0x09131e, 0.88)
      .setStrokeStyle(2, 0x3e84b8, 0.78)
      .setDepth(260)
      .setOrigin(0.5);
    this.add.image(40, y, "magazine").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(261);
    this.ammoText = this.add
      .text(74, y, "100", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "40px",
        color: "#e4f2ff",
        stroke: "#041017",
        strokeThickness: 5
      })
      .setDepth(261)
      .setOrigin(0, 0.52);
    this.createAmmoSegments(y);

    const grenadeX = PLAY_WIDTH - 88;
    this.add
      .rectangle(grenadeX, y, 164, 62, 0x09131e, 0.88)
      .setStrokeStyle(2, 0x3e84b8, 0.78)
      .setDepth(260)
      .setOrigin(0.5);
    this.add.image(grenadeX - 48, y, "grenade-pickup").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(261);
    this.grenadeText = this.add
      .text(grenadeX - 20, y, "x3", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "40px",
        color: "#e4f2ff",
        stroke: "#041017",
        strokeThickness: 5
      })
      .setDepth(261)
      .setOrigin(0, 0.52);
  }

  createAmmoSegments(y) {
    this.ammoSegments = [];
    const segmentCount = 10;
    const segmentWidth = 13;
    const segmentHeight = 26;
    const gap = 3;
    const startX = 148;

    for (let i = 0; i < segmentCount; i += 1) {
      const x = startX + i * (segmentWidth + gap);
      const segment = this.add
        .rectangle(x, y, segmentWidth, segmentHeight, 0x75cfff, 0.95)
        .setStrokeStyle(1, 0x0c3250, 0.95)
        .setDepth(261)
        .setOrigin(0, 0.5);
      this.ammoSegments.push(segment);
    }
  }

  updateAmmoSegments(ammo) {
    if (!this.ammoSegments.length) {
      return;
    }

    const activeSegments = Phaser.Math.Clamp(Math.ceil(ammo / 10), 0, 10);
    this.ammoSegments.forEach((segment, index) => {
      if (!segment?.active) {
        return;
      }

      const isActive = index < activeSegments;
      segment.setFillStyle(isActive ? 0x75cfff : 0x203443, isActive ? 0.95 : 0.55);
      segment.setStrokeStyle(1, isActive ? 0x0c3250 : 0x14212c, 0.9);
    });
  }

  createCrosshair() {
    this.crosshair = this.add.image(PLAY_WIDTH * 0.5, this.scale.height * 0.5, "scope").setDepth(1000);
    this.crosshair.setScale((PLAY_WIDTH * 0.12) / 128);
    this.input.on("pointermove", (pointer) => {
      const x = Phaser.Math.Clamp(pointer.worldX, 0, PLAY_WIDTH);
      const y = Phaser.Math.Clamp(pointer.worldY, 0, this.scale.height);
      this.crosshair.setPosition(x, y);
    });
  }

  createWeaponView() {
    this.weaponSpriteSheetKey = this.textures.exists("weapon-m203-sheet")
      ? "weapon-m203-sheet"
      : this.textures.exists("weapon-m203-sheet-new")
        ? "weapon-m203-sheet-new"
        : "weapon-m204-sheet";
    if (!this.textures.exists(this.weaponSpriteSheetKey)) {
      return;
    }

    this.ensureWeaponAnimations();
    this.weaponBaseX = this.playWidth - 6;
    this.weaponBaseY = this.scale.height - 2;
    this.weaponSprite = this.add
      .sprite(this.weaponBaseX, this.weaponBaseY, this.weaponSpriteSheetKey, 0)
      .setDisplaySize(320, 252)
      .setOrigin(1, 1)
      .setDepth(91);
    this.weaponSprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_animation, frame) => {
      this.applyWeaponCrop(frame);
    });
    this.weaponSprite.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}weapon-m203-fire`, () => {
      if (!this.isMagModeActive() && this.weaponSprite?.active) {
        this.weaponSprite.play("weapon-m203-idle");
      }
    });
    this.weaponSprite.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}weapon-m203-grenade`, () => {
      if (!this.isMagModeActive() && this.weaponSprite?.active) {
        this.weaponSprite.play("weapon-m203-idle");
      }
    });
    this.applyWeaponCrop(this.weaponSprite.frame);
    this.weaponSprite.play("weapon-m203-idle");
  }

  ensureWeaponAnimations() {
    const fallbackSpriteSheetKey = this.weaponSpriteSheetKey || "weapon-m203-sheet";
    const sheetTexture = this.textures.get(fallbackSpriteSheetKey);
    const availableFrameCount = Math.max(0, (sheetTexture?.frameTotal ?? 1) - 1);
    const hasNewLayout = availableFrameCount >= 16;
    const hasStableActionFrames =
      this.textures.exists("weapon-stable-0") &&
      this.textures.exists("weapon-stable-4") &&
      this.textures.exists("weapon-stable-5") &&
      this.textures.exists("weapon-stable-12") &&
      this.textures.exists("weapon-stable-13");

    const weaponFrame = (frameIndex) => [{ key: fallbackSpriteSheetKey, frame: frameIndex }];
    const weaponFrameList = (frameIndexes) =>
      frameIndexes.filter((frameIndex) => availableFrameCount > frameIndex).map((frameIndex) => ({
        key: fallbackSpriteSheetKey,
        frame: frameIndex
      }));
    const stableFrameList = (frameIndexes) => frameIndexes.map((frameIndex) => ({ key: `weapon-stable-${frameIndex}` }));

    const idleFrame = 0;
    const fireFrames = hasNewLayout ? [4, 5, 4] : [3, 4, 5];
    const grenadeFrames = [12, 13, 12, 13];

    if (!this.anims.exists("weapon-m203-idle")) {
      this.anims.create({
        key: "weapon-m203-idle",
        frames: hasStableActionFrames ? stableFrameList([idleFrame]) : weaponFrame(idleFrame),
        frameRate: 4,
        repeat: -1,
        yoyo: false
      });
    }

    if (!this.anims.exists("weapon-m203-fire")) {
      this.anims.create({
        key: "weapon-m203-fire",
        frames: hasStableActionFrames ? stableFrameList([4, 5, 4]) : weaponFrameList(fireFrames),
        frameRate: hasNewLayout ? 16 : 16,
        repeat: 0
      });
    }

    if (!this.anims.exists("weapon-m203-grenade")) {
      this.anims.create({
        key: "weapon-m203-grenade",
        frames: hasStableActionFrames ? stableFrameList(grenadeFrames) : weaponFrameList(grenadeFrames),
        frameRate: WEAPON_GRENADE_ANIM_FPS,
        repeat: 0
      });
    }
  }

  playWeaponActionAnimation(action) {
    const isMagMode = this.isMagModeActive();
    const hasWeaponSprite = Boolean(this.weaponSprite?.active);

    if (hasWeaponSprite && !isMagMode) {
      this.resetWeaponPosition();
      this.weaponSprite.play(action === "grenade" ? "weapon-m203-grenade" : "weapon-m203-fire", true);
      this.playWeaponTilt(action);
    } else {
      this.cameras.main.shake(action === "grenade" ? 120 : 70, action === "grenade" ? 0.0035 : 0.0018);
    }
  }

  resetWeaponPosition() {
    if (!this.weaponSprite?.active) {
      return;
    }

    this.updateWeaponAimTarget();
    this.weaponSprite.setPosition(this.weaponAimTargetX, this.weaponAimTargetY);
    this.weaponSprite.setAngle(this.weaponAimTargetAngle);
    this.applyWeaponCrop(this.weaponSprite.frame);
  }

  applyWeaponCrop(frame) {
    if (!this.weaponSprite?.active) {
      return;
    }

    const frameWidth = frame?.width ?? this.weaponSprite.frame?.width ?? WEAPON_SOURCE_FRAME_WIDTH;
    const frameHeight = frame?.height ?? this.weaponSprite.frame?.height ?? WEAPON_SOURCE_FRAME_HEIGHT;
    const cropHeight = Math.max(1, frameHeight - WEAPON_BOTTOM_CROP_PX);
    const cropX = Math.min(WEAPON_LEFT_CROP_PX, Math.max(0, frameWidth - 1));
    const cropWidth = Math.max(1, frameWidth - cropX);
    this.weaponSprite.setCrop(cropX, 0, cropWidth, cropHeight);
  }

  playWeaponMuzzleEffect(action, options = {}) {
    if (!this.textures.exists("muzzle-flash")) {
      return;
    }

    const anchorToCrosshair = options.anchorToCrosshair ?? false;
    const anchorX = anchorToCrosshair
      ? (this.crosshair?.x ?? this.input.activePointer?.worldX ?? this.playWidth * 0.5)
      : (this.weaponSprite?.x ?? this.weaponBaseX);
    const anchorY = anchorToCrosshair
      ? (this.crosshair?.y ?? this.input.activePointer?.worldY ?? this.scale.height * 0.5)
      : (this.weaponSprite?.y ?? this.weaponBaseY);
    const muzzleX = anchorToCrosshair ? anchorX : anchorX - WEAPON_MUZZLE_OFFSET_X;
    const muzzleY = anchorToCrosshair ? anchorY : anchorY - WEAPON_MUZZLE_OFFSET_Y;
    const isGrenade = action === "grenade";

    const flash = this.add.image(muzzleX, muzzleY, "muzzle-flash").setDepth(92);
    flash.setScale(isGrenade ? 1.55 : 1.28);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    flash.setAlpha(0.98);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: flash.scaleX * 1.32,
      scaleY: flash.scaleY * 1.32,
      duration: isGrenade ? 210 : 150,
      onComplete: () => flash.destroy()
    });

    const core = this.add.image(muzzleX + 2, muzzleY + 1, "muzzle-flash").setDepth(93);
    core.setScale(isGrenade ? 0.9 : 0.75);
    core.setTint(0xfff6cf);
    core.setBlendMode(Phaser.BlendModes.ADD);
    core.setAlpha(1);
    this.tweens.add({
      targets: core,
      alpha: 0,
      scaleX: core.scaleX * 1.2,
      scaleY: core.scaleY * 1.2,
      duration: isGrenade ? 120 : 90,
      onComplete: () => core.destroy()
    });

    const smoke = this.add.image(muzzleX - (isGrenade ? 8 : 4), muzzleY - (isGrenade ? 4 : 2), "muzzle-flash").setDepth(91);
    smoke.setTint(0xcfd3d8);
    smoke.setAlpha(0.55);
    smoke.setScale(isGrenade ? 1.4 : 1.05);
    this.tweens.add({
      targets: smoke,
      alpha: 0,
      x: smoke.x - (isGrenade ? 18 : 12),
      y: smoke.y - (isGrenade ? 10 : 7),
      scaleX: smoke.scaleX * 1.28,
      scaleY: smoke.scaleY * 1.28,
      duration: isGrenade ? 280 : 220,
      onComplete: () => smoke.destroy()
    });
  }

  playWeaponTilt(action) {
    if (!this.weaponSprite?.active) {
      return;
    }

    // Keep weapon movement driven by scope-follow, not recoil tweening.
    this.tweens.killTweensOf(this.weaponSprite);
    this.resetWeaponPosition();
  }

  updateWeaponAimTarget() {
    const aimX = Phaser.Math.Clamp(this.crosshair?.x ?? this.input.activePointer?.worldX ?? this.playWidth * 0.5, 0, this.playWidth);
    const aimY = Phaser.Math.Clamp(
      this.crosshair?.y ?? this.input.activePointer?.worldY ?? this.scale.height * 0.5,
      0,
      this.scale.height
    );
    const normalizedX = ((aimX / this.playWidth) - 0.5) * 2;
    const normalizedY = ((aimY / this.scale.height) - 0.5) * 2;
    this.weaponAimTargetX = this.weaponBaseX + normalizedX * WEAPON_AIM_FOLLOW_X_MAX;
    this.weaponAimTargetY = this.weaponBaseY + normalizedY * WEAPON_AIM_FOLLOW_Y_MAX;
    this.weaponAimTargetAngle = normalizedX * WEAPON_AIM_FOLLOW_ANGLE_MAX + normalizedY * 1.5;
  }

  updateWeaponAimFollow() {
    if (!this.weaponSprite?.active) {
      return;
    }

    if (this.isMagModeActive()) {
      return;
    }

    this.updateWeaponAimTarget();
    const t = WEAPON_AIM_FOLLOW_LERP;
    this.weaponSprite.x = Phaser.Math.Linear(this.weaponSprite.x, this.weaponAimTargetX, t);
    this.weaponSprite.y = Phaser.Math.Linear(this.weaponSprite.y, this.weaponAimTargetY, t);
    this.weaponSprite.angle = Phaser.Math.Linear(this.weaponSprite.angle, this.weaponAimTargetAngle, t);
  }

  showEnemyMuzzleFlash(enemy) {
    if (!enemy || !enemy.active) {
      return;
    }

    // Enemy art is mostly front-facing; anchor flash around rifle front-center.
    const flashX = enemy.x + (enemy.flipX ? enemy.displayWidth * 0.05 : enemy.displayWidth * 0.11);
    const flashY = enemy.y - enemy.displayHeight * 0.36;
    const flash = this.add.image(flashX, flashY, "muzzle-flash").setDepth((enemy.depth ?? 0) + 6);
    flash.setScale(Phaser.Math.FloatBetween(0.72, 0.92));
    flash.setAlpha(1);
    flash.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: flash.scaleX * 1.25,
      scaleY: flash.scaleY * 1.25,
      duration: 170,
      onComplete: () => flash.destroy()
    });
  }

  flashPlayerHit() {
    if (!this.damageOverlay) {
      return;
    }

    this.damageOverlay.setAlpha(0.24);
    this.tweens.killTweensOf(this.damageOverlay);
    this.tweens.add({
      targets: this.damageOverlay,
      alpha: 0,
      duration: 170
    });
  }

  playFireSound() {
    if (this.isMagModeActive()) {
      if (!this.magFireSound?.isPlaying) {
        this.magFireSound?.play();
      }
      return;
    }

    this.stopMagFireSound();
    this.sound.play("m203-fire", {
      volume: 0.42
    });
  }

  stopMagFireSound() {
    if (this.magFireSound?.isPlaying) {
      this.magFireSound.stop();
    }
  }

  playEmptyFireSound() {
    this.sound.play("m203-empty", {
      volume: 0.62
    });
  }

  playGrenadeSound() {
    this.sound.play("m203-grenade", {
      volume: 1
    });
  }

  playEnemyFireSound(enemy) {
    if (!enemy) {
      return;
    }

    this.stopEnemyFireSound(enemy);
    const isGrenadeEnemy = enemy?.enemyTypeKey === "enemy-grenade";
    const soundKey = isGrenadeEnemy ? "m203-grenade" : "ak47-fire";
    const volume = isGrenadeEnemy ? 0.75 : 0.3;

    const sound = this.sound.add(soundKey, {
      volume
    });
    enemy.fireSound = sound;
    sound.once("complete", () => {
      if (enemy.fireSound === sound) {
        enemy.fireSound = null;
      }
      sound.destroy();
    });
    sound.play();
  }

  stopEnemyFireSound(enemy) {
    const sound = enemy?.fireSound;
    if (!sound) {
      return;
    }

    if (sound.isPlaying) {
      sound.stop();
    }
    sound.destroy();
    enemy.fireSound = null;
  }

  startBackgroundMusic() {
    const existingMusic = this.sound.get("bg-music");
    if (existingMusic) {
      this.ensureMusicLoopMarker(existingMusic);
      if (existingMusic.isPlaying) {
        if (existingMusic.currentMarker?.name === MUSIC_LOOP_MARKER) {
          return;
        }
        existingMusic.stop();
      }
      existingMusic.play(MUSIC_LOOP_MARKER);
      return;
    }

    const music = this.sound.add("bg-music", {
      volume: 0.4
    });
    this.ensureMusicLoopMarker(music);
    music.play(MUSIC_LOOP_MARKER);
  }

  ensureMusicLoopMarker(music) {
    if (music.__loopMarkerReady) {
      return;
    }

    const duration = Math.max(0.1, music.totalDuration - MUSIC_LOOP_START_SECONDS);
    music.addMarker({
      name: MUSIC_LOOP_MARKER,
      start: MUSIC_LOOP_START_SECONDS,
      duration,
      config: {
        loop: true
      }
    });
    music.__loopMarkerReady = true;
  }
}
