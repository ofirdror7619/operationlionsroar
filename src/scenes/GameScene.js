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
const WEAPON_SHADOW_OFFSET_X = -128;
const WEAPON_SHADOW_OFFSET_Y = -22;
const UI_DISPLAY_FONT = "'Barlow Condensed', 'Teko', sans-serif";
const HUD_AMMO_SEGMENTS = 10;
const HUD_HEALTH_SEGMENTS = 10;
const HUD_GRENADE_ICON_SLOTS = 5;
const LOW_HP_THRESHOLD = 30;
const LOW_AMMO_THRESHOLD = 12;
const COMBO_RESET_WINDOW_MS = 2200;
const KILL_FEED_MAX_ITEMS = 4;

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
    this.objectiveTextMaxWidth = 0;
    this.objectivePanel = null;
    this.objectiveSweep = null;
    this.killCount = 0;
    this.playWidth = PLAY_WIDTH;
    this.gameOver = false;
    this.levelComplete = false;
    this.weaponSprite = null;
    this.weaponShadow = null;
    this.vignetteOverlays = [];
    this.crosshair = null;
    this.crosshairContainer = null;
    this.crosshairHitMarker = null;
    this.crosshairBaseScale = 1;
    this.ammoText = null;
    this.ammoSegments = [];
    this.grenadeText = null;
    this.grenadeIcons = [];
    this.grenadeOverflowText = null;
    this.lifeBarSegments = [];
    this.lastAmmoValue = -1;
    this.lastAmmoSegmentCount = -1;
    this.lastGrenadesValue = -1;
    this.lastHealthSegmentCount = -1;
    this.gameStatusText = null;
    this.retryButton = null;
    this.retryButtonLabel = null;
    this.retryButtonGlow = null;
    this.failOverlay = null;
    this.failBlurLayers = [];
    this.isLowHpPulseActive = false;
    this.isLowAmmoBlinkActive = false;
    this.lowHpPulseTween = null;
    this.lowAmmoBlinkTween = null;
    this.comboText = null;
    this.comboCount = 0;
    this.lastKillAtMs = -99999;
    this.headshotText = null;
    this.reloadWarningText = null;
    this.killFeedTexts = [];
    this.hudIntroNodes = [];
    this.hudBreathingTweens = [];
    this.ammoPanel = null;
    this.grenadePanel = null;
    this.healthPanel = null;
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

    this.createObjectiveBanner();
    this.createPlayerPowerIndicators?.();
    this.createForegroundVignette();
    this.createMissionFailScreen?.();
    this.startHudIntro();
    this.startHudBreathing();

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
        fontSize: "86px",
        color: "#f8fbff",
        stroke: "#3a0000",
        strokeThickness: 10,
        align: "center",
        letterSpacing: 8
      })
      .setDepth(1502)
      .setOrigin(0.5)
      .setVisible(false);
    this.gameStatusText.setShadow(0, 0, "#ff5050", 20, true, true);

    this.retryButton = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2 + 88, 248, 60, 0xba1f2f, 0.98)
      .setStrokeStyle(3, 0xff9cab, 0.95)
      .setDepth(1504)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.retryButtonGlow = this.add
      .rectangle(this.retryButton.x, this.retryButton.y, 270, 76, 0xff5269, 0)
      .setDepth(1503)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.retryButtonLabel = this.add
      .text(this.retryButton.x, this.retryButton.y, "RETRY", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "38px",
        color: "#ffffff",
        letterSpacing: 5
      })
      .setOrigin(0.5)
      .setDepth(1505)
      .setVisible(false);
    this.retryButton.on("pointerover", () => {
      if (this.retryButton?.visible) {
        this.retryButton.setFillStyle(0xd22a3c, 1);
        this.retryButton.setScale(1.06);
        this.retryButtonGlow?.setAlpha(0.34);
      }
    });
    this.retryButton.on("pointerout", () => {
      if (this.retryButton?.visible) {
        this.retryButton.setFillStyle(0xba1f2f, 0.98);
        this.retryButton.setScale(1);
        this.retryButtonGlow?.setAlpha(0.2);
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
    this.updateComboWindow();
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

    const didHitEnemy = this.tryKillEnemyAt(pointer.worldX, pointer.worldY, isMagMode);
    let didHit = didHitEnemy;

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

    this.playCrosshairShotFeedback(didHitEnemy, false);
  }

  tryKillEnemyAt(worldX, worldY, allowAimAssist = false) {
    let targetEnemy = null;
    let didDirectHit = false;
    this.enemies.children.each((enemy) => {
      if (!enemy?.active || targetEnemy) {
        return;
      }

      if (enemy.isHit(worldX, worldY)) {
        targetEnemy = enemy;
        didDirectHit = true;
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

    const isHeadshot = didDirectHit ? this.isHeadshotHit(targetEnemy, worldY) : false;
    const killSource = this.isMagModeActive() ? "FN-MAG-58" : "M-203";
    return this.killEnemy(targetEnemy, { isHeadshot, killSource });
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

    let didHitEnemy = false;
    this.enemies.children.each((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, enemy.x, enemy.y);
      if (distance <= radius) {
        const didKill = this.killEnemy(enemy, { emitHudUpdate: false, killSource: "GRENADE" });
        didHitEnemy = didHitEnemy || didKill;
      }
    });

    this.playCrosshairShotFeedback(didHitEnemy, true);
    this.emitHudUpdate();
    this.cameras.main.shake(180, 0.004);
  }

  killEnemy(enemy, options = {}) {
    const emitHudUpdate = options.emitHudUpdate ?? true;
    const isHeadshot = options.isHeadshot ?? false;
    const killSource = options.killSource ?? "M-203";
    if (!enemy?.active) {
      return false;
    }

    const deathX = enemy.x;
    const deathY = enemy.y;
    this.stopEnemyFireSound(enemy);
    enemy.kill();
    this.killCount += 1;
    this.state.addScore(enemy.points);
    this.registerKillFeedback({
      isHeadshot,
      killSource
    });
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
    this.triggerMissionFailedCinematic?.();
  }

  setLevelComplete() {
    if (this.levelComplete || this.gameOver) {
      return;
    }

    this.levelComplete = true;
    this.spawner.stop();
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    this.hideMissionFailScreen?.();
    this.updateReloadWarning(1);
    this.comboText?.setVisible(false);
    if (this.gameStatusText?.active) {
      this.gameStatusText
        .setFontSize("64px")
        .setText("MISSION COMPLETE\nClick to continue")
        .setVisible(true);
      this.gameStatusText.setShadow(0, 0, "#65fff5", 14, true, true);
    }
    this.retryButton?.setVisible(false);
    this.retryButtonLabel?.setVisible(false);
    this.retryButtonGlow?.setVisible(false);
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
    this.hideMissionFailScreen?.();
    this.scene.restart({ levelId: this.levelId });
  }

  continueToNextChallenge() {
    if (!this.levelComplete || this.gameOver) {
      return;
    }

    this.hideMissionFailScreen?.();
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

    this.setObjectiveText(this.getLevelObjectiveText());
  }

  createObjectiveBanner() {
    const panelY = 8;
    const panelWidth = Math.min(this.playWidth - 56, 900);
    const panelHeight = 64;
    const panelLeft = (this.playWidth - panelWidth) * 0.5;
    const panelRight = panelLeft + panelWidth;
    this.createUiBlurBackdrop(this.playWidth * 0.5, panelY + panelHeight * 0.5, panelWidth, panelHeight, 93, 16);

    this.objectivePanel = this.add
      .image(this.playWidth * 0.5, panelY, "hud-objective-panel")
      .setOrigin(0.5, 0)
      .setDisplaySize(panelWidth, panelHeight)
      .setDepth(94)
      .setAlpha(0.95);

    this.objectiveSweep = this.add
      .rectangle(panelLeft + 46, panelY + panelHeight * 0.5, 96, panelHeight - 14, 0x7ff9ff, 0.075)
      .setDepth(96)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.objectiveText = this.add.text(this.playWidth / 2, panelY + 14, this.getLevelObjectiveText(), {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "30px",
      color: "#dffcff",
      stroke: "#07161a",
      strokeThickness: 5,
      letterSpacing: 1
    })
      .setOrigin(0.5, 0)
      .setDepth(97);
    this.objectiveTextMaxWidth = panelWidth - 44;
    this.setObjectiveText(this.getLevelObjectiveText());

    this.tweens.add({
      targets: this.objectiveSweep,
      x: panelRight - 46,
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.tweens.add({
      targets: this.objectivePanel,
      alpha: 0.82,
      duration: 880,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
    this.hudIntroNodes.push(this.objectivePanel, this.objectiveSweep, this.objectiveText);
  }

  setObjectiveText(text) {
    if (!this.objectiveText?.active) {
      return;
    }

    const maxWidth = this.objectiveTextMaxWidth > 0 ? this.objectiveTextMaxWidth : this.playWidth - 80;
    this.objectiveText.setText(text);
    let fontSize = 30;
    this.objectiveText.setFontSize(fontSize);
    while (this.objectiveText.width > maxWidth && fontSize > 18) {
      fontSize -= 1;
      this.objectiveText.setFontSize(fontSize);
    }
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
      this.weaponShadow?.setVisible(!isActive);
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
    const ammo = Math.floor(this.state.ammo);
    const health = Math.floor(this.state.hp);
    if (this.ammoText?.active) {
      this.ammoText.setText(this.formatAmmoCounter(ammo));
      this.ammoText.setColor(ammo <= 20 ? "#ff5f72" : "#e4f2ff");
      this.updateAmmoSegments(ammo);
      if (this.lastAmmoValue !== ammo) {
        this.pulseHudNode(this.ammoText, 1.14);
      }
      this.lastAmmoValue = ammo;
    }
    const grenades = Math.floor(this.state.grenades);
    if (this.grenadeText?.active) {
      this.grenadeText.setText(`${grenades}`);
    }
    this.updateGrenadeIcons(grenades);
    this.lastGrenadesValue = grenades;
    this.updateLifeBar(health / this.state.maxHp);
    this.updateDangerStateEffects(ammo, health);
    this.updateReloadWarning(ammo);
  }

  createDamageOverlay() {
    this.damageOverlay = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth, this.scale.height, 0xcc2020, 0)
      .setDepth(85);
  }

  createLifeBar() {
    const y = this.scale.height - 28;
    const panelX = 514;
    const panelWidth = 260;
    const panelHeight = 72;
    this.createUiBlurBackdrop(panelX, y, panelWidth, panelHeight, 259);
    this.healthPanel = this.add
      .image(panelX, y, "hud-counter-ammo-panel")
      .setDisplaySize(panelWidth, panelHeight)
      .setDepth(260)
      .setOrigin(0.5)
      .setAlpha(0.92);

    this.add.image(panelX - 108, y, "hud-icon-health").setDisplaySize(42, 42).setDepth(263);

    this.lifeBarSegments = [];
    const segmentWidth = 14;
    const segmentHeight = 26;
    const gap = 6;
    const startX = panelX - 86;
    for (let i = 0; i < HUD_HEALTH_SEGMENTS; i += 1) {
      const x = startX + i * (segmentWidth + gap);
      const base = this.add
        .rectangle(x, y, segmentWidth, segmentHeight, 0x15222d, 0.9)
        .setStrokeStyle(1, 0x1b3b53, 0.95)
        .setDepth(262)
        .setOrigin(0, 0.5);
      const glow = this.add
        .rectangle(x + segmentWidth * 0.5, y, segmentWidth + 8, segmentHeight + 10, 0x82ffb4, 0)
        .setDepth(261)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.hudIntroNodes.push(base, glow);
      this.lifeBarSegments.push({ base, glow });
    }
    this.hudIntroNodes.push(this.healthPanel);
    this.updateLifeBar(1);
  }

  updateLifeBar(normalizedValue) {
    if (!this.lifeBarSegments.length) {
      return;
    }

    const value = Phaser.Math.Clamp(normalizedValue, 0, 1);
    const activeSegments = Phaser.Math.Clamp(Math.ceil(value * HUD_HEALTH_SEGMENTS), 0, HUD_HEALTH_SEGMENTS);

    this.lifeBarSegments.forEach((segmentNode, index) => {
      const isActive = index < activeSegments;
      const t = HUD_HEALTH_SEGMENTS <= 1 ? 1 : index / (HUD_HEALTH_SEGMENTS - 1);
      const activeColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(255, 72, 96),
        new Phaser.Display.Color(88, 255, 156),
        100,
        Math.round(t * 100)
      );
      const activeColorInt = Phaser.Display.Color.GetColor(activeColor.r, activeColor.g, activeColor.b);
      const strokeColor = Phaser.Display.Color.GetColor(
        Math.min(255, activeColor.r + 26),
        Math.min(255, activeColor.g + 26),
        Math.min(255, activeColor.b + 26)
      );
      segmentNode.base.setFillStyle(isActive ? activeColorInt : 0x15222d, isActive ? 0.95 : 0.72);
      segmentNode.base.setStrokeStyle(1, isActive ? strokeColor : 0x1b3b53, isActive ? 0.95 : 0.7);
      segmentNode.glow.setFillStyle(activeColorInt, 1);
      segmentNode.glow.setAlpha(isActive ? 0.28 : 0);
      if (this.lastHealthSegmentCount >= 0 && activeSegments !== this.lastHealthSegmentCount && isActive) {
        this.pulseHudNode(segmentNode.base, 1.2);
      }
    });
    this.lastHealthSegmentCount = activeSegments;
  }

  createBottomResourceCounters() {
    const y = this.scale.height - 28;
    const resourceIconSize = 58;
    const ammoPanelX = 182;
    const ammoPanelWidth = 336;
    const ammoPanelHeight = 72;
    this.createUiBlurBackdrop(ammoPanelX, y, ammoPanelWidth, ammoPanelHeight, 259);
    this.ammoPanel = this.add
      .image(ammoPanelX, y, "hud-counter-ammo-panel")
      .setDisplaySize(ammoPanelWidth, ammoPanelHeight)
      .setDepth(260)
      .setOrigin(0.5);
    const ammoSweep = this.add
      .rectangle(ammoPanelX - 108, y, 84, ammoPanelHeight - 12, 0x86f8ff, 0.07)
      .setDepth(262)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ammoSweep,
      x: ammoPanelX + 108,
      duration: 1750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.add.image(50, y, "hud-icon-ammo").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(263);
    this.ammoText = this.add
      .text(54, y, "100", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "32px",
        color: "#eaffff",
        stroke: "#061418",
        strokeThickness: 5,
        letterSpacing: 2
      })
      .setDepth(263)
      .setOrigin(0, 0.52);
    this.createAmmoSegments(ammoPanelX, ammoPanelWidth, y);

    const grenadeX = PLAY_WIDTH - 110;
    const grenadePanelWidth = 196;
    const grenadePanelHeight = 72;
    this.createUiBlurBackdrop(grenadeX, y, grenadePanelWidth, grenadePanelHeight, 259);
    this.grenadePanel = this.add
      .image(grenadeX, y, "hud-counter-grenade-panel")
      .setDisplaySize(grenadePanelWidth, grenadePanelHeight)
      .setDepth(260)
      .setOrigin(0.5);
    const grenadeSweep = this.add
      .rectangle(grenadeX - 56, y, 66, grenadePanelHeight - 12, 0x86f8ff, 0.065)
      .setDepth(262)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: grenadeSweep,
      x: grenadeX + 56,
      duration: 2050,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.add.image(grenadeX - 52, y, "hud-icon-grenade").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(263);
    const grenadeValueX = grenadeX + grenadePanelWidth * 0.5 - 18;
    const grenadeValueY = y;
    this.grenadeText = this.add
      .text(grenadeValueX, grenadeValueY, "3", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "28px",
        color: "#eaffff",
        stroke: "#061418",
        strokeThickness: 4,
        letterSpacing: 2
      })
      .setDepth(263)
      .setOrigin(1, 0.5);
    this.createGrenadeIcons(grenadeX - 24, y + 17);
    this.hudIntroNodes.push(
      this.ammoPanel,
      this.grenadePanel,
      this.ammoText,
      this.grenadeText,
      ammoSweep,
      grenadeSweep
    );
  }

  createAmmoSegments(panelX, panelWidth, y) {
    this.ammoSegments = [];
    const segmentWidth = 14;
    const segmentHeight = 26;
    const gap = 6;
    const totalWidth = HUD_AMMO_SEGMENTS * segmentWidth + (HUD_AMMO_SEGMENTS - 1) * gap;
    const rightPadding = 24;
    const startX = panelX + panelWidth * 0.5 - rightPadding - totalWidth;

    for (let i = 0; i < HUD_AMMO_SEGMENTS; i += 1) {
      const x = startX + i * (segmentWidth + gap);
      const glow = this.add
        .rectangle(x + segmentWidth * 0.5, y, segmentWidth + 8, segmentHeight + 10, 0x7af0ff, 0)
        .setDepth(260)
        .setBlendMode(Phaser.BlendModes.ADD);
      const base = this.add
        .rectangle(x, y, segmentWidth, segmentHeight, 0x75cfff, 0.95)
        .setStrokeStyle(1, 0x0c3250, 0.95)
        .setDepth(261)
        .setOrigin(0, 0.5);
      this.hudIntroNodes.push(base, glow);
      this.ammoSegments.push({ base, glow });
    }
  }

  updateAmmoSegments(ammo) {
    if (!this.ammoSegments.length) {
      return;
    }

    const activeSegments = Phaser.Math.Clamp(Math.ceil(ammo / 10), 0, HUD_AMMO_SEGMENTS);
    this.ammoSegments.forEach((segmentNode, index) => {
      if (!segmentNode?.base?.active) {
        return;
      }

      const isActive = index < activeSegments;
      const t = HUD_AMMO_SEGMENTS <= 1 ? 1 : index / (HUD_AMMO_SEGMENTS - 1);
      const activeColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(255, 72, 96),
        new Phaser.Display.Color(88, 255, 156),
        100,
        Math.round(t * 100)
      );
      const activeColorInt = Phaser.Display.Color.GetColor(activeColor.r, activeColor.g, activeColor.b);
      const strokeColor = Phaser.Display.Color.GetColor(
        Math.min(255, activeColor.r + 26),
        Math.min(255, activeColor.g + 26),
        Math.min(255, activeColor.b + 26)
      );
      segmentNode.base.setFillStyle(isActive ? activeColorInt : 0x203443, isActive ? 0.95 : 0.55);
      segmentNode.base.setStrokeStyle(1, isActive ? strokeColor : 0x14212c, isActive ? 0.95 : 0.85);
      segmentNode.glow.setFillStyle(activeColorInt, 1);
      segmentNode.glow.setAlpha(isActive ? 0.24 : 0);
      if (this.lastAmmoSegmentCount >= 0 && activeSegments !== this.lastAmmoSegmentCount && isActive) {
        this.pulseHudNode(segmentNode.base, 1.22);
      }
    });
    this.lastAmmoSegmentCount = activeSegments;
  }

  createGrenadeIcons(startX, y) {
    this.grenadeIcons = [];
    const gap = 22;
    for (let i = 0; i < HUD_GRENADE_ICON_SLOTS; i += 1) {
      const icon = this.add
        .image(startX + i * gap, y, "hud-icon-grenade")
        .setDisplaySize(16, 16)
        .setDepth(264)
        .setAlpha(0.28);
      this.hudIntroNodes.push(icon);
      this.grenadeIcons.push(icon);
    }

    this.grenadeOverflowText = this.add
      .text(startX + HUD_GRENADE_ICON_SLOTS * gap + 2, y, "", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "20px",
        color: "#c1f2ff",
        stroke: "#061418",
        strokeThickness: 3
      })
      .setDepth(264)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.hudIntroNodes.push(this.grenadeOverflowText);
  }

  updateGrenadeIcons(grenadeCount) {
    if (!this.grenadeIcons.length) {
      return;
    }

    const clamped = Math.max(0, grenadeCount);
    const activeIcons = Math.min(clamped, HUD_GRENADE_ICON_SLOTS);
    this.grenadeIcons.forEach((icon, index) => {
      const isActive = index < activeIcons;
      icon.setAlpha(isActive ? 1 : 0.28);
      icon.setTint(isActive ? 0xffffff : 0x456072);
      if (this.lastGrenadesValue >= 0 && this.lastGrenadesValue !== clamped && isActive) {
        this.pulseHudNode(icon, 1.28);
      }
    });

    if (this.grenadeOverflowText?.active) {
      const overflow = clamped - HUD_GRENADE_ICON_SLOTS;
      if (overflow > 0) {
        this.grenadeOverflowText.setText(`+${overflow}`).setVisible(true);
      } else {
        this.grenadeOverflowText.setVisible(false);
      }
    }
  }

  formatAmmoCounter(ammo) {
    return String(Math.max(0, Math.floor(ammo))).padStart(3, "0");
  }

  pulseHudNode(node, maxScale = 1.14) {
    if (!node?.active) {
      return;
    }

    this.tweens.killTweensOf(node);
    if (typeof node.__hudBaseScaleX !== "number") {
      node.__hudBaseScaleX = node.scaleX ?? 1;
    }
    if (typeof node.__hudBaseScaleY !== "number") {
      node.__hudBaseScaleY = node.scaleY ?? 1;
    }

    const originalScaleX = node.__hudBaseScaleX;
    const originalScaleY = node.__hudBaseScaleY;
    node.setScale(originalScaleX, originalScaleY);
    this.tweens.add({
      targets: node,
      scaleX: originalScaleX * maxScale,
      scaleY: originalScaleY * maxScale,
      duration: 90,
      yoyo: true,
      ease: "Sine.Out",
      onComplete: () => {
        if (node?.active) {
          node.setScale(originalScaleX, originalScaleY);
        }
      }
    });
  }

  isHeadshotHit(enemy, hitY) {
    if (!enemy?.active) {
      return false;
    }

    const visibleBodyRatio = enemy.visibleBodyRatio ?? 1;
    const topY = enemy.y - enemy.displayHeight * enemy.originY;
    const visibleHeight = enemy.displayHeight * visibleBodyRatio;
    const headThresholdY = topY + visibleHeight * 0.34;
    return hitY <= headThresholdY;
  }

  registerKillFeedback({ isHeadshot = false, killSource = "M-203" } = {}) {
    const now = this.time.now;
    const withinComboWindow = now - this.lastKillAtMs <= COMBO_RESET_WINDOW_MS;
    this.comboCount = withinComboWindow ? this.comboCount + 1 : 1;
    this.lastKillAtMs = now;

    if (this.comboText?.active && this.comboCount >= 2) {
      this.comboText
        .setText(`COMBO x${this.comboCount}`)
        .setVisible(true)
        .setAlpha(1)
        .setScale(1);
      this.pulseHudNode(this.comboText, 1.24);
    }

    if (isHeadshot) {
      this.showHeadshotIndicator();
    }

    this.addKillFeedEntry(isHeadshot ? `HEADSHOT (${killSource})` : `ENEMY DOWN (${killSource})`);
  }

  updateComboWindow() {
    if (!this.comboText?.active || this.comboCount <= 0) {
      return;
    }

    if (this.time.now - this.lastKillAtMs <= COMBO_RESET_WINDOW_MS) {
      return;
    }

    this.comboCount = 0;
    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      y: this.comboText.y - 10,
      duration: 220,
      onComplete: () => {
        if (this.comboText?.active) {
          this.comboText.setVisible(false);
          this.comboText.setY(94);
        }
      }
    });
  }

  showHeadshotIndicator() {
    if (!this.headshotText?.active) {
      return;
    }

    this.headshotText
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.85)
      .setY(this.scale.height * 0.54 + 14);
    this.tweens.killTweensOf(this.headshotText);
    this.tweens.add({
      targets: this.headshotText,
      y: this.scale.height * 0.54 - 8,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 120,
      yoyo: true,
      ease: "Sine.Out"
    });
    this.tweens.add({
      targets: this.headshotText,
      alpha: 0,
      delay: 420,
      duration: 240,
      onComplete: () => {
        if (this.headshotText?.active) {
          this.headshotText.setVisible(false);
        }
      }
    });
  }

  addKillFeedEntry(message) {
    const feedX = 18;
    const feedBaseY = this.scale.height - 106;
    const text = this.add.text(feedX, feedBaseY, `+ ${message}`, {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "23px",
      color: "#f3fbff",
      stroke: "#061820",
      strokeThickness: 4,
      letterSpacing: 1
    })
      .setOrigin(0, 1)
      .setDepth(302)
      .setAlpha(0);

    this.killFeedTexts.unshift(text);
    while (this.killFeedTexts.length > KILL_FEED_MAX_ITEMS) {
      const item = this.killFeedTexts.pop();
      item?.destroy();
    }

    this.killFeedTexts.forEach((entry, index) => {
      this.tweens.killTweensOf(entry);
      this.tweens.add({
        targets: entry,
        x: feedX,
        y: feedBaseY - index * 24,
        alpha: 1 - index * 0.13,
        duration: 170,
        ease: "Sine.Out"
      });
    });

    this.time.delayedCall(850, () => {
      if (!text?.active) {
        return;
      }

      this.tweens.add({
        targets: text,
        alpha: 0,
        x: text.x - 24,
        duration: 130,
        onComplete: () => {
          const idx = this.killFeedTexts.indexOf(text);
          if (idx >= 0) {
            this.killFeedTexts.splice(idx, 1);
          }
          text.destroy();
        }
      });
    });
  }

  createPlayerPowerIndicators() {
    this.comboText = this.add.text(this.playWidth / 2, 94, "", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "34px",
      color: "#fff2a1",
      stroke: "#3c2904",
      strokeThickness: 6,
      letterSpacing: 3
    })
      .setOrigin(0.5, 0)
      .setDepth(301)
      .setVisible(false);

    this.headshotText = this.add.text(this.playWidth / 2, this.scale.height * 0.54, "HEADSHOT!", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "52px",
      color: "#fffaeb",
      stroke: "#4f1a02",
      strokeThickness: 8,
      letterSpacing: 4
    })
      .setOrigin(0.5)
      .setDepth(303)
      .setVisible(false);

    this.reloadWarningText = this.add.text(this.playWidth / 2, this.scale.height - 102, "RELOAD!", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "54px",
      color: "#ff7373",
      stroke: "#3a0000",
      strokeThickness: 8,
      letterSpacing: 5
    })
      .setOrigin(0.5)
      .setDepth(304)
      .setVisible(false);

    this.hudIntroNodes.push(this.comboText, this.reloadWarningText);
  }

  updateReloadWarning(ammo) {
    if (!this.reloadWarningText?.active) {
      return;
    }

    const shouldShow = ammo <= 0 && !this.isMagModeActive() && !this.levelComplete && !this.gameOver;
    if (shouldShow) {
      if (!this.reloadWarningText.visible) {
        this.reloadWarningText.setVisible(true);
        this.tweens.killTweensOf(this.reloadWarningText);
        this.tweens.add({
          targets: this.reloadWarningText,
          alpha: 0.35,
          duration: 170,
          yoyo: true,
          repeat: -1
        });
      }
      return;
    }

    this.tweens.killTweensOf(this.reloadWarningText);
    this.reloadWarningText.setVisible(false).setAlpha(1);
  }

  updateDangerStateEffects(ammo, health) {
    const lowAmmo = ammo <= LOW_AMMO_THRESHOLD && ammo > 0 && !this.isMagModeActive();
    if (lowAmmo && !this.isLowAmmoBlinkActive && this.ammoText?.active) {
      this.isLowAmmoBlinkActive = true;
      this.lowAmmoBlinkTween = this.tweens.add({
        targets: [this.ammoText, this.ammoPanel].filter(Boolean),
        alpha: 0.32,
        duration: 170,
        yoyo: true,
        repeat: -1
      });
    } else if (!lowAmmo && this.isLowAmmoBlinkActive) {
      this.isLowAmmoBlinkActive = false;
      this.lowAmmoBlinkTween?.stop();
      this.lowAmmoBlinkTween = null;
      this.ammoText?.setAlpha(1);
      this.ammoPanel?.setAlpha(1);
    }

    const lowHealth = health <= LOW_HP_THRESHOLD && health > 0;
    if (lowHealth && !this.isLowHpPulseActive) {
      this.isLowHpPulseActive = true;
      const healthNodes = this.lifeBarSegments.flatMap((segmentNode) => [segmentNode.base, segmentNode.glow]);
      this.lowHpPulseTween = this.tweens.add({
        targets: healthNodes,
        alpha: 0.42,
        duration: 260,
        yoyo: true,
        repeat: -1
      });
    } else if (!lowHealth && this.isLowHpPulseActive) {
      this.isLowHpPulseActive = false;
      this.lowHpPulseTween?.stop();
      this.lowHpPulseTween = null;
      this.lifeBarSegments.forEach((segmentNode) => {
        segmentNode.base.setAlpha(1);
        segmentNode.glow.setAlpha(segmentNode.glow.alpha > 0 ? 0.2 : 0);
      });
      this.updateLifeBar(health / this.state.maxHp);
    }
  }

  startHudIntro() {
    this.hudIntroNodes = this.hudIntroNodes.filter((node) => node?.active);
    this.hudIntroNodes.forEach((node) => {
      node.setAlpha(1);
    });
  }

  startHudBreathing() {
    this.hudBreathingTweens = [];
  }

  createMissionFailScreen() {
    this.failOverlay = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth + 40, this.scale.height + 40, 0x030406, 0)
      .setDepth(1500)
      .setVisible(false);

    this.failBlurLayers = [26, 56, 92].map((expand, index) =>
      this.add
        .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth + expand, this.scale.height + expand, 0x0a0f14, 0)
        .setDepth(1497 + index)
        .setVisible(false)
    );

  }

  playMissionFailedGlitch() {
    if (!this.gameStatusText?.active || this.gameStatusText.text !== "MISSION FAILED") {
      return;
    }

    const originalX = this.gameStatusText.x;
    const originalY = this.gameStatusText.y;
    const jumps = [
      { dx: -6, dy: 1, tint: "#ff9aa0" },
      { dx: 5, dy: -2, tint: "#9de9ff" },
      { dx: -3, dy: 2, tint: "#ffd6de" },
      { dx: 0, dy: 0, tint: "#f8fbff" }
    ];

    jumps.forEach((jump, index) => {
      this.time.delayedCall(index * 55, () => {
        if (!this.gameStatusText?.active || !this.gameOver) {
          return;
        }

        this.gameStatusText.setPosition(originalX + jump.dx, originalY + jump.dy);
        this.gameStatusText.setColor(jump.tint);
      });
    });
  }

  triggerMissionFailedCinematic() {
    this.tweens.killTweensOf(this.reloadWarningText);
    this.reloadWarningText?.setVisible(false);
    this.comboText?.setVisible(false);
    this.failOverlay?.setVisible(true).setAlpha(0);
    this.failBlurLayers.forEach((layer) => layer.setVisible(true).setAlpha(0));

    this.retryButton?.setVisible(false).setScale(0.96).setAlpha(0);
    this.retryButtonLabel?.setVisible(false).setAlpha(0);
    this.retryButtonGlow?.setVisible(false).setAlpha(0);
    if (this.gameStatusText?.active) {
      this.gameStatusText
        .setText("MISSION FAILED")
        .setVisible(true)
        .setAlpha(0)
        .setScale(0.9);
      this.gameStatusText.setShadow(0, 0, "#ff3535", 22, true, true);
    }

    this.cameras.main.setZoom(1);
    this.cameras.main.shake(220, 0.0034);
    this.tweens.add({
      targets: this.failOverlay,
      alpha: 0.75,
      duration: 320
    });
    this.failBlurLayers.forEach((layer, index) => {
      this.tweens.add({
        targets: layer,
        alpha: 0.18 + index * 0.07,
        duration: 320 + index * 90
      });
    });
    this.tweens.add({
      targets: this.gameStatusText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 240,
      delay: 120,
      ease: "Back.Out"
    });

    this.time.delayedCall(250, () => this.playMissionFailedGlitch());
    this.time.delayedCall(420, () => {
      if (!this.gameOver) {
        return;
      }

      this.retryButton?.setVisible(true);
      this.retryButtonLabel?.setVisible(true);
      this.retryButtonGlow?.setVisible(true);
      this.tweens.add({
        targets: [this.retryButton, this.retryButtonLabel, this.retryButtonGlow].filter(Boolean),
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 240,
        ease: "Quad.Out"
      });
      this.tweens.add({
        targets: this.retryButtonGlow,
        alpha: 0.34,
        duration: 640,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut"
      });
    });
  }

  hideMissionFailScreen() {
    this.failOverlay?.setVisible(false).setAlpha(0);
    this.failBlurLayers.forEach((layer) => layer.setVisible(false).setAlpha(0));
    this.retryButtonGlow?.setVisible(false).setAlpha(0);
    this.cameras.main.setZoom(1);
  }

  createCrosshair() {
    this.crosshairContainer = this.add.container(PLAY_WIDTH * 0.5, this.scale.height * 0.5).setDepth(1000);
    this.crosshair = this.add.image(0, 0, "scope");
    this.crosshairBaseScale = (PLAY_WIDTH * 0.12) / 128;
    this.crosshair.setScale(this.crosshairBaseScale);

    this.crosshairHitMarker = this.add.graphics();
    this.crosshairHitMarker.lineStyle(3, 0xffffff, 0.95);
    this.crosshairHitMarker.lineBetween(-13, -13, -4, -4);
    this.crosshairHitMarker.lineBetween(13, -13, 4, -4);
    this.crosshairHitMarker.lineBetween(-13, 13, -4, 4);
    this.crosshairHitMarker.lineBetween(13, 13, 4, 4);
    this.crosshairHitMarker.setAlpha(0);

    this.crosshairContainer.add([this.crosshair, this.crosshairHitMarker]);
    this.input.on("pointermove", (pointer) => {
      const x = Phaser.Math.Clamp(pointer.worldX, 0, PLAY_WIDTH);
      const y = Phaser.Math.Clamp(pointer.worldY, 0, this.scale.height);
      this.crosshairContainer.setPosition(x, y);
    });
  }

  playCrosshairShotFeedback(didHitEnemy, isGrenade) {
    if (!this.crosshair?.active) {
      return;
    }

    const spreadScale = isGrenade ? 1.22 : 1.14;
    const recoilY = isGrenade ? -4 : -2.5;
    const recoilAngle = isGrenade ? 2.8 : 1.4;
    this.tweens.killTweensOf(this.crosshair);
    this.crosshair.setScale(this.crosshairBaseScale);
    this.crosshair.setY(0);
    this.crosshair.setAngle(0);

    this.tweens.add({
      targets: this.crosshair,
      scaleX: this.crosshairBaseScale * spreadScale,
      scaleY: this.crosshairBaseScale * spreadScale,
      y: recoilY,
      angle: recoilAngle,
      duration: 52,
      yoyo: true,
      ease: "Quad.Out"
    });

    if (!didHitEnemy) {
      return;
    }

    this.crosshair.setTint(0xff6a78);
    this.time.delayedCall(95, () => {
      if (this.crosshair?.active) {
        this.crosshair.clearTint();
      }
    });

    if (!this.crosshairHitMarker?.active) {
      return;
    }

    this.tweens.killTweensOf(this.crosshairHitMarker);
    this.crosshairHitMarker.setAlpha(1);
    this.crosshairHitMarker.setScale(0.72);
    this.tweens.add({
      targets: this.crosshairHitMarker,
      alpha: 0,
      scaleX: 1.13,
      scaleY: 1.13,
      duration: 130,
      ease: "Quad.Out"
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
    this.weaponShadow = this.add
      .ellipse(this.weaponBaseX + WEAPON_SHADOW_OFFSET_X, this.weaponBaseY + WEAPON_SHADOW_OFFSET_Y, 276, 110, 0x000000, 0.17)
      .setAngle(-8)
      .setDepth(90);
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
    if (typeof this.syncWeaponShadow === "function") {
      this.syncWeaponShadow();
    }
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
    if (typeof this.syncWeaponShadow === "function") {
      this.syncWeaponShadow();
    }
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
      ? (this.crosshairContainer?.x ?? this.input.activePointer?.worldX ?? this.playWidth * 0.5)
      : (this.weaponSprite?.x ?? this.weaponBaseX);
    const anchorY = anchorToCrosshair
      ? (this.crosshairContainer?.y ?? this.input.activePointer?.worldY ?? this.scale.height * 0.5)
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
    const aimX = Phaser.Math.Clamp(this.crosshairContainer?.x ?? this.input.activePointer?.worldX ?? this.playWidth * 0.5, 0, this.playWidth);
    const aimY = Phaser.Math.Clamp(
      this.crosshairContainer?.y ?? this.input.activePointer?.worldY ?? this.scale.height * 0.5,
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
    if (typeof this.syncWeaponShadow === "function") {
      this.syncWeaponShadow();
    }
  }

  syncWeaponShadow() {
    if (!this.weaponShadow?.active || !this.weaponSprite?.active) {
      return;
    }

    this.weaponShadow.x = this.weaponSprite.x + WEAPON_SHADOW_OFFSET_X;
    this.weaponShadow.y = this.weaponSprite.y + WEAPON_SHADOW_OFFSET_Y;
    this.weaponShadow.angle = this.weaponSprite.angle * 0.35 - 8;
  }

  createUiBlurBackdrop(centerX, centerY, width, height, depth, cornerRadius = 12) {
    const layers = [
      { expand: 24, alpha: 0.045 },
      { expand: 14, alpha: 0.06 },
      { expand: 6, alpha: 0.08 }
    ];

    layers.forEach((layer) => {
      this.add
        .rectangle(centerX, centerY, width + layer.expand, height + layer.expand, 0x06111a, layer.alpha)
        .setDepth(depth)
        .setOrigin(0.5);
    });

    const rim = this.add.graphics();
    rim.fillStyle(0x98d8ff, 0.04);
    rim.fillRoundedRect(
      centerX - width * 0.5 - 2,
      centerY - height * 0.5 - 2,
      width + 4,
      height + 4,
      cornerRadius
    );
    rim.setDepth(depth + 0.1);
  }

  createForegroundVignette() {
    const depth = 910;
    const layers = [
      { inset: 0, alpha: 0.1 },
      { inset: 16, alpha: 0.075 },
      { inset: 34, alpha: 0.052 },
      { inset: 58, alpha: 0.035 }
    ];
    const sideBand = 44;
    const verticalBand = 34;
    const edgeColor = 0x02070c;

    this.vignetteOverlays = [];
    layers.forEach((layer) => {
      const top = this.add
        .rectangle(this.playWidth * 0.5, layer.inset + verticalBand * 0.5, this.playWidth - layer.inset * 2, verticalBand, edgeColor, layer.alpha)
        .setDepth(depth);
      const bottom = this.add
        .rectangle(
          this.playWidth * 0.5,
          this.scale.height - layer.inset - verticalBand * 0.5,
          this.playWidth - layer.inset * 2,
          verticalBand,
          edgeColor,
          layer.alpha
        )
        .setDepth(depth);
      const left = this.add
        .rectangle(layer.inset + sideBand * 0.5, this.scale.height * 0.5, sideBand, this.scale.height - layer.inset * 2, edgeColor, layer.alpha)
        .setDepth(depth);
      const right = this.add
        .rectangle(
          this.playWidth - layer.inset - sideBand * 0.5,
          this.scale.height * 0.5,
          sideBand,
          this.scale.height - layer.inset * 2,
          edgeColor,
          layer.alpha
        )
        .setDepth(depth);

      this.vignetteOverlays.push(top, bottom, left, right);
    });
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
