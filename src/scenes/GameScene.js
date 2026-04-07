import Phaser from "phaser";
import { EnemySpawner } from "../systems/EnemySpawner";
import { GameState } from "../systems/GameState";
import { PLAY_WIDTH } from "../game/config";
import { MAX_MISSION_ID, MISSION_REWARD_BY_LEVEL } from "../game/progressionConfig";
import { getGrenadeBlastRadius, getWeaponMaxAmmoCapacity } from "../game/upgradeConfig";
import { UI_LAYOUT, UI_MOTION } from "../game/uiTokens";
import { DEFAULT_SPAWN_POINTS } from "../game/enemySpawnerConfig";
import {
  LEVEL_2_KILL_TARGET,
  LEVEL_4_HOSTAGE_ZONE,
  LEVEL_4_KILL_TARGET,
  LEVEL_4_SPAWN_POINTS,
  PHASE_DIRECTOR_CONFIGS
} from "../game/missionDirectorConfig";
import {
  BASE_ENEMY_AIM_DURATION_MS,
  BASE_FIRE_COOLDOWN_MS,
  CERAMIC_VEST_DAMAGE_MULTIPLIER,
  COMBO_RESET_WINDOW_MS,
  DEFAULT_MAG_MODE_DURATION_MS,
  ENEMY_FIRE_DAMAGE,
  GRENADE_ENEMY_FIRE_DAMAGE,
  GRENADE_PICKUP_DROP_CHANCE,
  GRENADE_PICKUP_LIFETIME_MS,
  GRENADE_PICKUP_MAX_ACTIVE,
  GRENADE_PICKUP_REWARD,
  HUD_AMMO_SEGMENTS,
  HUD_GRENADE_ICON_SLOTS,
  HUD_HEALTH_SEGMENTS,
  KILL_FEED_MAX_ITEMS,
  LEVEL_2_MAG_MODE_DURATION_MS,
  LEVEL_3_ENEMY_AIM_DURATION_MS,
  LOW_AMMO_THRESHOLD,
  LOW_HP_THRESHOLD,
  MAG_AIM_ASSIST_RADIUS,
  MAG_FIRE_COOLDOWN_MS,
  MAG_WEAPON_PICKUP_DROP_CHANCE,
  MAG_WEAPON_PICKUP_LIFETIME_MS,
  MAG_WEAPON_PICKUP_MAX_ACTIVE,
  MAGAZINE_AMMO_REWARD,
  MAGAZINE_DROP_CHANCE,
  MAGAZINE_LIFETIME_MS,
  MAGAZINE_MAX_ACTIVE,
  MEDIKIT_DROP_CHANCE,
  MEDIKIT_HEALTH_REWARD,
  MEDIKIT_LIFETIME_MS,
  MEDIKIT_MAX_ACTIVE,
  MUSIC_LOOP_MARKER,
  MUSIC_LOOP_START_SECONDS,
  RETRY_BUTTON_BASE_TINT,
  RETRY_BUTTON_GLOW_TINT,
  RETRY_BUTTON_HOVER_TINT,
  TAVOR_AIM_ASSIST_RADIUS,
  UI_DISPLAY_FONT,
  WEAPON_AIM_FOLLOW_ANGLE_MAX,
  WEAPON_AIM_FOLLOW_LERP,
  WEAPON_AIM_FOLLOW_X_MAX,
  WEAPON_AIM_FOLLOW_Y_MAX,
  WEAPON_BOTTOM_CROP_PX,
  WEAPON_GRENADE_ANIM_FPS,
  WEAPON_LEFT_CROP_PX,
  WEAPON_MUZZLE_OFFSET_X,
  WEAPON_MUZZLE_OFFSET_Y,
  WEAPON_SHADOW_OFFSET_X,
  WEAPON_SHADOW_OFFSET_Y,
  WEAPON_SOURCE_FRAME_HEIGHT,
  WEAPON_SOURCE_FRAME_WIDTH
} from "../game/gameplayTuning";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
    this.maxLevelTimerStepMs = 100;
    this.levelId = 1;
    this.state = null;
    this.enemies = null;
    this.magazinePickups = null;
    this.medikitPickups = null;
    this.grenadePickups = null;
    this.magWeaponPickups = null;
    this.spawner = null;
    this.damageOverlay = null;
    this.magModeEndsAt = 0;
    this.levelDurationMs = 0;
    this.hasSpawnedMagWeaponPickup = false;
    this.lastShotAtMs = -99999;
    this.magTimerText = null;
    this.magFireSound = null;
    this.tavorFireSound = null;
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
    this.grenadeHudIcon = null;
    this.grenadeSweep = null;
    this.grenadeHudBackdropNodes = [];
    this.lifeBarSegments = [];
    this.lastAmmoValue = -1;
    this.lastAmmoSegmentCount = -1;
    this.lastGrenadesValue = -1;
    this.lastHealthSegmentCount = -1;
    this.gameStatusText = null;
    this.retryButton = null;
    this.retryButtonLabel = null;
    this.retryButtonGlow = null;
    this.retryButtonPulseTween = null;
    this.retryButtonHoverTween = null;
    this.failOverlay = null;
    this.failBlurLayers = [];
    this.failZoomTween = null;
    this.failTextFlickerTween = null;
    this.failGlitchGhostLeft = null;
    this.failGlitchGhostRight = null;
    this.abortButton = null;
    this.abortButtonLabel = null;
    this.abortConfirmOverlay = null;
    this.abortConfirmFrame = null;
    this.abortConfirmPanel = null;
    this.abortConfirmTitle = null;
    this.abortConfirmSubtitle = null;
    this.abortConfirmBody = null;
    this.abortConfirmDivider = null;
    this.abortConfirmHint = null;
    this.abortConfirmStayButton = null;
    this.abortConfirmStayGlow = null;
    this.abortConfirmStayLabel = null;
    this.abortConfirmLeaveButton = null;
    this.abortConfirmLeaveGlow = null;
    this.abortConfirmLeaveLabel = null;
    this.backgroundImage = null;
    this.failBackgroundBlurFx = null;
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
    this.selectedWeaponId = "m203";
    this.ownedWeaponIds = [];
    this.isOwnedMagWeaponViewActive = false;
    this.isTavorWeaponViewActive = false;
    this.isCustomM203WeaponViewActive = false;
    this.weaponIdleAnimKey = "weapon-m203-idle";
    this.weaponFireAnimKey = "weapon-m203-fire";
    this.weaponGrenadeAnimKey = "weapon-m203-grenade";
    this.weaponBaseX = 0;
    this.weaponBaseY = 0;
    this.weaponAimTargetX = 0;
    this.weaponAimTargetY = 0;
    this.weaponAimTargetAngle = 0;
    this.weaponRecoilX = 0;
    this.weaponRecoilY = 0;
    this.weaponRecoilAngle = 0;
    this.weaponAmmoById = {};
    this.hasContinuedAfterMissionComplete = false;
    this.levelElapsedMs = 0;
    this.currentDirectorPhaseId = "";
    this.isExtractionWindowActive = false;
    this.hostageZoneRect = null;
  }

  init(data = {}) {
    this.levelId = data.levelId ?? 1;
  }

  create() {
    this.startBackgroundMusic();

    this.state = new GameState();
    this.weaponAmmoById = this.createWeaponAmmoState();
    this.gameOver = false;
    this.levelComplete = false;
    this.hasContinuedAfterMissionComplete = false;
    this.killCount = 0;
    this.magModeEndsAt = 0;
    this.hasSpawnedMagWeaponPickup = false;
    this.lastShotAtMs = -99999;
    this.levelElapsedMs = 0;
    this.levelDurationMs = this.getLevelDurationMs();
    this.currentDirectorPhaseId = "";
    this.isExtractionWindowActive = false;
    this.hostageZoneRect = this.createHostageZoneRect();
    this.enemies = this.physics.add.group();
    this.magazinePickups = this.add.group();
    this.medikitPickups = this.add.group();
    this.grenadePickups = this.add.group();
    this.magWeaponPickups = this.add.group();

    this.backgroundImage = this.add
      .image(this.playWidth / 2, this.scale.height / 2, this.getMissionBackgroundKey())
      .setDisplaySize(this.playWidth, this.scale.height);
    this.createWeaponView();
    this.applyCurrentWeaponAmmoState();
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
    this.createAbortButton();
    this.createPlayerPowerIndicators?.();
    this.createForegroundVignette();
    this.createMissionFailScreen?.();
    this.createAbortConfirmScreen();
    this.startHudIntro();
    this.startHudBreathing();

    this.magFireSound = this.sound.add("mag-fire", {
      volume: 0.55,
      loop: true
    });
    this.tavorFireSound = this.sound.add("tavor-fire", {
      volume: 0.55
    });

    const initialPhaseConfig = this.getCurrentPhaseConfig();
    this.spawner = new EnemySpawner(this, this.enemies, {
      spawnDelayMs: initialPhaseConfig?.spawnDelayMs ?? 1200,
      maxActive: initialPhaseConfig?.maxActive ?? 6,
      enemyTextureWeights: initialPhaseConfig?.enemyWeights,
      spawnsEnabled: true,
      spawnPoints: this.getSpawnPointsForCurrentLevel(),
      enemyOptions: {
        aimDurationMs: this.levelId === 3 ? LEVEL_3_ENEMY_AIM_DURATION_MS : BASE_ENEMY_AIM_DURATION_MS,
        onPlayerHit: (enemy) => {
          this.playEnemyFireSound(enemy);
          this.showEnemyMuzzleFlash(enemy);
          this.flashPlayerHit();
          const isGrenadeEnemy = enemy?.enemyTypeKey === "enemy-grenade";
          const rawDamage = isGrenadeEnemy ? GRENADE_ENEMY_FIRE_DAMAGE : ENEMY_FIRE_DAMAGE;
          const appliedDamage = this.getIncomingDamageAfterArmor(rawDamage);
          this.state.applyDamage(appliedDamage);
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
    this.updatePhaseDirector(true);

    this.input.setDefaultCursor("none");
    this.input.mouse?.disableContextMenu();
    this.state.grenades = this.getStoredGrenadeCount();
    this.emitHudUpdate();

    this.input.on("pointerdown", (pointer) => {
      if (this.isAbortConfirmVisible()) {
        return;
      }

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
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.isAbortConfirmVisible()) {
        this.hideAbortConfirmScreen();
        return;
      }

      this.abortMission();
    });
    this.input.on("wheel", (_pointer, _gameObjects, _deltaX, deltaY) => {
      if (this.gameOver || this.levelComplete || this.isAbortConfirmVisible()) {
        return;
      }

      this.switchWeaponByWheel(deltaY);
    });
    this.gameStatusText = this.add
      .text(this.playWidth / 2, this.scale.height * 0.45, "", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "82px",
        color: "#f8fbff",
        stroke: "#2a0000",
        strokeThickness: 10,
        fontStyle: "900",
        align: "center",
        letterSpacing: 6
      })
      .setDepth(1502)
      .setOrigin(0.5)
      .setVisible(false);
    this.gameStatusText.setShadow(0, 0, "#ff2b39", 30, true, true);
    this.failGlitchGhostLeft = this.add
      .text(this.playWidth / 2, this.scale.height * 0.45, "MISSION FAILED", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "82px",
        color: "#ff5b67",
        fontStyle: "900",
        letterSpacing: 6
      })
      .setDepth(1501)
      .setOrigin(0.5)
      .setAlpha(0)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.failGlitchGhostRight = this.add
      .text(this.playWidth / 2, this.scale.height * 0.45, "MISSION FAILED", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "82px",
        color: "#7fdcff",
        fontStyle: "900",
        letterSpacing: 6
      })
      .setDepth(1501)
      .setOrigin(0.5)
      .setAlpha(0)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.retryButton = this.add
      .image(this.playWidth / 2, this.scale.height / 2 + 88, "hud-counter-grenade-panel")
      .setDisplaySize(248, 60)
      .setTint(RETRY_BUTTON_BASE_TINT)
      .setAlpha(0.98)
      .setDepth(1504)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.retryButtonGlow = this.add
      .image(this.retryButton.x, this.retryButton.y, "hud-counter-grenade-panel")
      .setDisplaySize(278, 74)
      .setTint(RETRY_BUTTON_GLOW_TINT)
      .setAlpha(0)
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
        this.stopRetryButtonPulse();
        this.retryButtonHoverTween?.stop();
        this.retryButton.setTint(RETRY_BUTTON_HOVER_TINT).setAlpha(1);
        this.retryButtonGlow?.setAlpha(0.5);
        this.retryButtonHoverTween = this.tweens.add({
          targets: [this.retryButton, this.retryButtonLabel].filter(Boolean),
          scaleX: 1.07,
          scaleY: 1.07,
          duration: UI_MOTION.hoverInMs,
          ease: UI_MOTION.easeHover
        });
      }
    });
    this.retryButton.on("pointerout", () => {
      if (this.retryButton?.visible) {
        this.retryButtonHoverTween?.stop();
        this.retryButton.setTint(RETRY_BUTTON_BASE_TINT).setAlpha(0.98);
        this.retryButtonGlow?.setAlpha(0.32);
        this.tweens.add({
          targets: [this.retryButton, this.retryButtonLabel].filter(Boolean),
          scaleX: 1,
          scaleY: 1,
          duration: UI_MOTION.hoverOutMs,
          ease: UI_MOTION.easeHover
        });
        this.startRetryButtonPulse();
      }
    });
    this.retryButton.on("pointerdown", () => {
      if (this.retryButton?.visible) {
        this.retryButtonHoverTween?.stop();
        this.tweens.add({
          targets: [this.retryButton, this.retryButtonLabel].filter(Boolean),
          scaleX: 0.97,
          scaleY: 0.97,
          duration: UI_MOTION.pressMs,
          ease: UI_MOTION.easeHover
        });
      }
    });
    this.retryButton.on("pointerup", () => {
      if (this.retryButton?.visible && (this.gameOver || this.levelComplete)) {
        this.retryButtonHoverTween?.stop();
        this.tweens.add({
          targets: [this.retryButton, this.retryButtonLabel].filter(Boolean),
          scaleX: 1.04,
          scaleY: 1.04,
          duration: UI_MOTION.tapBounceMs,
          yoyo: true,
          ease: UI_MOTION.easeTap
        });
        this.time.delayedCall(80, () => {
          if (this.gameOver || this.levelComplete) {
            this.restart();
          }
        });
      }
    });

  }

  update(_time, delta) {
    this.updateComboWindow();
    if (this.gameOver || this.levelComplete || this.isAbortConfirmVisible()) {
      return;
    }

    const safeDeltaMs = Phaser.Math.Clamp(delta, 0, this.maxLevelTimerStepMs);
    this.levelElapsedMs += safeDeltaMs;

    this.updatePhaseDirector();

    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }

      enemy.updateEnemy(delta);
    });

    this.updateMagMode();
    this.updateWeaponAimFollow();
    this.updateObjectiveText();
    this.checkLevelEnd();
    const pointer = this.input.activePointer;
    if (this.isMagFiringMechanicActive() && pointer?.isDown && !pointer.rightButtonDown()) {
      this.tryShoot(pointer);
    }
  }

  tryShoot(pointer) {
    const cooldownMs = this.isMagFiringMechanicActive() ? MAG_FIRE_COOLDOWN_MS : BASE_FIRE_COOLDOWN_MS;
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
    if (!isMagMode && !this.state.consumeAmmo(this.getAmmoCostPerShot())) {
      this.playEmptyFireSound();
      this.cameras.main.shake(80, 0.002);
      this.emitHudUpdate();
      return;
    }

    this.playFireSound();
    this.playWeaponActionAnimation("fire");

    if (this.tryTriggerHostageFailFromShot(pointer.worldX, pointer.worldY)) {
      return;
    }

    const aimAssistRadius = this.getAimAssistRadius();
    const didHitEnemy = this.tryKillEnemyAt(pointer.worldX, pointer.worldY, aimAssistRadius > 0, aimAssistRadius);
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
      didHit = this.tryCollectMagWeaponPickup(pointer.worldX, pointer.worldY);
    }

    if (!didHit) {
      this.emitHudUpdate();
    }

    this.playCrosshairShotFeedback(didHitEnemy, false);
  }

  tryKillEnemyAt(worldX, worldY, allowAimAssist = false, aimAssistRadius = MAG_AIM_ASSIST_RADIUS) {
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
        if (distance <= aimAssistRadius && distance < closestDistance) {
          closestDistance = distance;
          targetEnemy = enemy;
        }
      });
    }

    if (!targetEnemy) {
      return false;
    }

    const isHeadshot = didDirectHit ? this.isHeadshotHit(targetEnemy, worldY) : false;
    const killSource = this.isMagFiringMechanicActive()
      ? "FN-MAG-58"
      : this.isTavorMechanicActive()
        ? "TAVOR TAR-21"
        : "M-203";
    return this.killEnemy(targetEnemy, { isHeadshot, killSource });
  }

  throwGrenade(pointer) {
    if (pointer.worldX > this.playWidth) {
      return;
    }

    if (!this.canUseGrenades()) {
      this.cameras.main.shake(80, 0.0018);
      return;
    }

    if (!this.state.consumeGrenade()) {
      this.cameras.main.shake(110, 0.0025);
      return;
    }
    this.syncGrenadesToRegistry();

    this.playGrenadeSound();
    this.playWeaponActionAnimation("grenade");

    const radius = this.getCurrentGrenadeBlastRadius();
    if (this.tryTriggerHostageFailFromGrenade(pointer.worldX, pointer.worldY, radius)) {
      return;
    }

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
    this.trySpawnMagWeaponPickupDrop(deathX, deathY);

    if (this.isKillObjectiveLevel()) {
      this.updateObjectiveText();
      if (!this.levelComplete && this.killCount >= this.getKillObjectiveTarget()) {
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

    if (Phaser.Math.FloatBetween(0, 1) > this.getPhaseDropChance("magazineDropChance", MAGAZINE_DROP_CHANCE)) {
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
        this.syncSelectedWeaponAmmoState();
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

    if (Phaser.Math.FloatBetween(0, 1) > this.getPhaseDropChance("medikitDropChance", MEDIKIT_DROP_CHANCE)) {
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

    if (Phaser.Math.FloatBetween(0, 1) > this.getPhaseDropChance("grenadePickupDropChance", GRENADE_PICKUP_DROP_CHANCE)) {
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
        this.syncGrenadesToRegistry();
        this.emitHudUpdate();
        this.showGrenadePickupText(worldX, worldY);
      }
    });

    return didCollect;
  }

  trySpawnMagWeaponPickupDrop(originX, originY) {
    if (!this.magWeaponPickups) {
      return;
    }

    if (this.isMagFiringMechanicActive()) {
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
    const activeEnemies = this.enemies.getChildren().filter((enemy) => enemy?.active);
    activeEnemies.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      this.stopEnemyFireSound(enemy);
      enemy.forceIdle?.();
      enemy.destroy();
    });
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    if (this.isHostageProtectionLevel()) {
      this.backgroundImage?.setTexture("bg-level4-failed");
      this.showHostageEndStateUi("MISSION FAILED");
      return;
    }
    this.triggerMissionFailedCinematic?.();
  }

  setLevelComplete() {
    if (this.levelComplete || this.gameOver) {
      return;
    }

    this.levelComplete = true;
    this.spawner.stop();
    const activeEnemies = this.enemies.getChildren().filter((enemy) => enemy?.active);
    activeEnemies.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      this.stopEnemyFireSound(enemy);
      enemy.forceIdle?.();
      enemy.destroy();
    });
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    if (this.isHostageProtectionLevel()) {
      this.backgroundImage?.setTexture("bg-level4-success");
      this.showHostageEndStateUi("MISSION SUCCESS", {
        showRetry: false,
        showContinueHint: true
      });
      return;
    }
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
    if (this.levelDurationMs <= 0) {
      return;
    }

    if (this.getElapsedLevelMs() >= this.levelDurationMs) {
      this.setLevelComplete();
    }
  }

  restart() {
    this.hideMissionFailScreen?.();
    this.scene.restart({ levelId: this.levelId });
  }

  continueToNextChallenge() {
    if (!this.levelComplete || this.gameOver || this.hasContinuedAfterMissionComplete) {
      return;
    }

    this.hasContinuedAfterMissionComplete = true;
    const currentBudget = this.getStoredBudget();
    const missionCompletionReward = this.getMissionCompletionReward();
    this.registry.set("playerBudget", currentBudget + missionCompletionReward);
    const nextMissionId = Phaser.Math.Clamp(this.levelId + 1, 1, MAX_MISSION_ID);
    this.registry.set("currentMissionId", nextMissionId);
    this.registry.set("operationCenterNotice", `MISSION COMPLETE +$${missionCompletionReward}`);
    this.hideMissionFailScreen?.();
    this.scene.start("operation-center");
  }

  getMissionCompletionReward() {
    const completedLevel = Math.max(1, Math.floor(this.levelId || 1));
    return MISSION_REWARD_BY_LEVEL[completedLevel] ?? 1000;
  }

  getStoredGrenadeCount() {
    const grenadesFromRegistry = this.registry.get("playerGrenades");
    if (typeof grenadesFromRegistry !== "number" || !Number.isFinite(grenadesFromRegistry)) {
      return 0;
    }

    return Math.max(0, Math.floor(grenadesFromRegistry));
  }

  syncGrenadesToRegistry() {
    this.registry.set("playerGrenades", Math.max(0, Math.floor(this.state?.grenades ?? 0)));
  }

  getStoredBudget() {
    const budgetFromRegistry = this.registry.get("playerBudget");
    if (typeof budgetFromRegistry !== "number" || !Number.isFinite(budgetFromRegistry)) {
      return 0;
    }

    return Math.max(0, Math.floor(budgetFromRegistry));
  }

  hasCeramicVest() {
    return Boolean(this.registry.get("hasCeramicVest"));
  }

  getIncomingDamageAfterArmor(baseDamage) {
    if (!this.hasCeramicVest()) {
      return baseDamage;
    }

    return Math.max(1, Math.floor(baseDamage * CERAMIC_VEST_DAMAGE_MULTIPLIER));
  }

  getCurrentGrenadeBlastRadius() {
    return getGrenadeBlastRadius(this.registry);
  }

  isHostageProtectionLevel() {
    return this.levelId === 4;
  }

  getMissionBackgroundKey() {
    return this.isHostageProtectionLevel() ? "bg-level4" : "bg";
  }

  getSpawnPointsForCurrentLevel() {
    if (this.isHostageProtectionLevel()) {
      return LEVEL_4_SPAWN_POINTS;
    }

    return DEFAULT_SPAWN_POINTS;
  }

  createHostageZoneRect() {
    if (!this.isHostageProtectionLevel()) {
      return null;
    }

    const left = this.playWidth * LEVEL_4_HOSTAGE_ZONE.x1;
    const top = this.scale.height * LEVEL_4_HOSTAGE_ZONE.y1;
    const width = this.playWidth * (LEVEL_4_HOSTAGE_ZONE.x2 - LEVEL_4_HOSTAGE_ZONE.x1);
    const height = this.scale.height * (LEVEL_4_HOSTAGE_ZONE.y2 - LEVEL_4_HOSTAGE_ZONE.y1);
    return new Phaser.Geom.Rectangle(left, top, width, height);
  }

  getHostageEndStateLayout() {
    const zone = this.hostageZoneRect;
    if (!zone) {
      return {
        centerX: this.playWidth * 0.5,
        statusY: this.scale.height * 0.38,
        retryY: this.scale.height * 0.66
      };
    }

    return {
      centerX: zone.centerX,
      statusY: Phaser.Math.Clamp(zone.top - 64, 84, this.scale.height - 180),
      retryY: Phaser.Math.Clamp(zone.bottom + 78, 120, this.scale.height - 72)
    };
  }

  showHostageEndStateUi(statusText, options = {}) {
    const { showRetry = true, showContinueHint = false } = options;
    this.hideMissionFailScreen?.();
    const { centerX, statusY, retryY } = this.getHostageEndStateLayout();
    this.stopRetryButtonPulse();
    this.tweens.killTweensOf([this.retryButton, this.retryButtonLabel, this.retryButtonGlow, this.gameStatusText]);

    this.failOverlay?.setVisible(false).setAlpha(0);
    this.failBlurLayers.forEach((layer) => layer.setVisible(false).setAlpha(0));
    this.failGlitchGhostLeft?.setVisible(false).setAlpha(0);
    this.failGlitchGhostRight?.setVisible(false).setAlpha(0);

    if (this.gameStatusText?.active) {
      this.gameStatusText
        .setPosition(centerX, statusY)
        .setFontSize("64px")
        .setText(statusText)
        .setVisible(true)
        .setAlpha(1)
        .setScale(1);
      this.gameStatusText.setShadow(0, 0, statusText === "MISSION SUCCESS" ? "#65fff5" : "#ff2937", 26, true, true);
    }

    if (showRetry) {
      this.retryButton
        ?.setPosition(centerX, retryY)
        .setVisible(true)
        .setScale(1)
        .setAlpha(0.98)
        .setTint(RETRY_BUTTON_BASE_TINT);
      this.retryButtonGlow
        ?.setPosition(centerX, retryY)
        .setVisible(true)
        .setScale(1)
        .setAlpha(0.34)
        .setTint(RETRY_BUTTON_GLOW_TINT);
      this.retryButtonLabel
        ?.setPosition(centerX, retryY)
        .setText("RETRY")
        .setVisible(true)
        .setScale(1)
        .setAlpha(1);

      this.tweens.add({
        targets: this.retryButtonGlow,
        alpha: 0.42,
        duration: UI_MOTION.glowPulseMs,
        yoyo: true,
        repeat: -1,
        ease: UI_MOTION.easePulse
      });
      this.startRetryButtonPulse();
      return;
    }

    this.retryButton?.setVisible(false);
    this.retryButtonGlow?.setVisible(false).setAlpha(0);
    this.retryButtonLabel
      ?.setPosition(centerX, retryY)
      .setText(showContinueHint ? "CLICK TO CONTINUE" : "")
      .setVisible(showContinueHint)
      .setScale(1)
      .setAlpha(1);
  }

  isPointInHostageZone(worldX, worldY) {
    if (!this.hostageZoneRect) {
      return false;
    }

    return Phaser.Geom.Rectangle.Contains(this.hostageZoneRect, worldX, worldY);
  }

  doesCircleIntersectHostageZone(worldX, worldY, radius) {
    if (!this.hostageZoneRect) {
      return false;
    }

    const closestX = Phaser.Math.Clamp(worldX, this.hostageZoneRect.left, this.hostageZoneRect.right);
    const closestY = Phaser.Math.Clamp(worldY, this.hostageZoneRect.top, this.hostageZoneRect.bottom);
    const dx = worldX - closestX;
    const dy = worldY - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  failMissionFromHostageHit() {
    if (!this.isHostageProtectionLevel() || this.gameOver || this.levelComplete) {
      return false;
    }

    this.setGameOver();
    return true;
  }

  tryTriggerHostageFailFromShot(worldX, worldY) {
    if (!this.isHostageProtectionLevel()) {
      return false;
    }

    if (!this.isPointInHostageZone(worldX, worldY)) {
      return false;
    }

    return this.failMissionFromHostageHit();
  }

  tryTriggerHostageFailFromGrenade(worldX, worldY, radius) {
    if (!this.isHostageProtectionLevel()) {
      return false;
    }

    if (!this.doesCircleIntersectHostageZone(worldX, worldY, radius)) {
      return false;
    }

    return this.failMissionFromHostageHit();
  }

  getLevelDirectorConfig() {
    return PHASE_DIRECTOR_CONFIGS[this.levelId] ?? PHASE_DIRECTOR_CONFIGS[1];
  }

  getElapsedLevelMs() {
    return Math.max(0, this.levelElapsedMs);
  }

  getCurrentPhaseConfig() {
    const config = this.getLevelDirectorConfig();
    const phases = Array.isArray(config?.phases) ? config.phases : [];
    if (phases.length <= 0) {
      return null;
    }

    const elapsedMs = this.getElapsedLevelMs();
    const activePhase = phases.find((phase) => elapsedMs >= phase.startMs && elapsedMs < phase.endMs);
    return activePhase ?? phases[phases.length - 1];
  }

  updatePhaseDirector(force = false) {
    if (!this.spawner) {
      return;
    }

    const phase = this.getCurrentPhaseConfig();
    if (phase && (force || this.currentDirectorPhaseId !== phase.id)) {
      this.currentDirectorPhaseId = phase.id;
      this.spawner.applyDirectorConfig({
        spawnDelayMs: phase.spawnDelayMs,
        maxActive: phase.maxActive,
        enemyWeights: phase.enemyWeights
      });
    }

    const shouldEnableSpawns = !this.isExtractionPhaseActive();
    if (force || shouldEnableSpawns !== !this.isExtractionWindowActive) {
      this.spawner.setSpawnsEnabled(shouldEnableSpawns);
      this.isExtractionWindowActive = !shouldEnableSpawns;
    }
  }

  getPhaseDropChance(fieldName, fallbackChance) {
    const phase = this.getCurrentPhaseConfig();
    const configuredChance = Number(phase?.[fieldName]);
    if (!Number.isFinite(configuredChance)) {
      return fallbackChance;
    }

    return Phaser.Math.Clamp(configuredChance, 0, 1);
  }

  getLevelExtractionStartMs() {
    const extractionStartMs = Number(this.getLevelDirectorConfig()?.extractionStartMs ?? 0);
    return extractionStartMs > 0 ? extractionStartMs : 0;
  }

  isExtractionPhaseActive() {
    const extractionStartMs = this.getLevelExtractionStartMs();
    if (extractionStartMs <= 0 || this.levelDurationMs <= 0) {
      return false;
    }

    const elapsedMs = this.getElapsedLevelMs();
    return elapsedMs >= extractionStartMs && elapsedMs < this.levelDurationMs;
  }

  getLevelObjectiveText() {
    if (this.isKillObjectiveLevel()) {
      const targetKills = this.getKillObjectiveTarget();
      const displayedKills = Math.min(this.killCount, targetKills);
      if (this.levelId === 4) {
        return `OBJECTIVE: RELEASE HOSTAGE (${displayedKills}/${targetKills})`;
      }

      return `OBJECTIVE: KILL ${targetKills} ENEMIES (${displayedKills}/${targetKills})`;
    }

    const fallbackSeconds = Math.floor(this.getLevelDurationMs() / 1000);
    const secondsToSurvive = this.levelDurationMs > 0
      ? Math.max(0, Math.ceil((this.levelDurationMs - this.getElapsedLevelMs()) / 1000))
      : fallbackSeconds;
    if (this.isHostageProtectionLevel() && !this.isExtractionPhaseActive()) {
      return `OBJECTIVE: PROTECT HOSTAGE (${secondsToSurvive}s)`;
    }
    if (this.isExtractionPhaseActive()) {
      return `OBJECTIVE: HOLD EXTRACTION (${secondsToSurvive}s)`;
    }
    return `OBJECTIVE: SURVIVE FOR ${secondsToSurvive} SECONDS`;
  }

  isKillObjectiveLevel() {
    return this.levelId === 2 || this.levelId === 4;
  }

  getKillObjectiveTarget() {
    if (this.levelId === 4) {
      return LEVEL_4_KILL_TARGET;
    }

    return LEVEL_2_KILL_TARGET;
  }

  getLevelDurationMs() {
    const configuredDuration = Number(this.getLevelDirectorConfig()?.durationMs ?? 0);
    return configuredDuration > 0 ? configuredDuration : 0;
  }

  updateObjectiveText() {
    if (!this.objectiveText?.active) {
      return;
    }

    this.setObjectiveText(this.getLevelObjectiveText());
  }

  createObjectiveBanner() {
    const panelY = UI_LAYOUT.objectiveTopY;
    const abortLaneWidth = 220;
    const panelLeftMargin = 10;
    const panelRightLimit = this.playWidth - abortLaneWidth;
    const availableWidth = Math.max(320, panelRightLimit - panelLeftMargin);
    const panelWidth = Math.min(availableWidth, UI_LAYOUT.objectiveMaxWidth);
    const panelHeight = UI_LAYOUT.objectivePanelHeight;
    const panelLeft = panelLeftMargin;
    const panelRight = panelLeft + panelWidth;
    const panelCenterX = panelLeft + panelWidth * 0.5;
    this.createUiBlurBackdrop(panelCenterX, panelY + panelHeight * 0.5, panelWidth, panelHeight, 93, 16);

    this.objectivePanel = this.add
      .image(panelCenterX, panelY, "hud-objective-panel")
      .setOrigin(0.5, 0)
      .setDisplaySize(panelWidth, panelHeight)
      .setDepth(94)
      .setAlpha(0.95);

    this.objectiveSweep = this.add
      .rectangle(
        panelLeft + UI_LAYOUT.objectiveSweepInset,
        panelY + panelHeight * 0.5,
        UI_LAYOUT.objectiveSweepWidth,
        panelHeight - 14,
        0x7ff9ff,
        0.075
      )
      .setDepth(96)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.objectiveText = this.add.text(panelCenterX, panelY + UI_LAYOUT.objectiveTextTopInset, this.getLevelObjectiveText(), {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "30px",
      color: "#dffcff",
      stroke: "#07161a",
      strokeThickness: 5,
      letterSpacing: 1
    })
      .setOrigin(0.5, 0)
      .setDepth(97);
    this.objectiveTextMaxWidth = panelWidth - UI_LAYOUT.objectiveTextHorizontalPadding;
    this.setObjectiveText(this.getLevelObjectiveText());

    this.tweens.add({
      targets: this.objectiveSweep,
      x: panelRight - UI_LAYOUT.objectiveSweepInset,
      duration: UI_MOTION.objectiveSweepMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

    this.tweens.add({
      targets: this.objectivePanel,
      alpha: 0.82,
      duration: UI_MOTION.objectiveBreatheMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
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
      duration: UI_MOTION.objectiveFlashMs,
      yoyo: true,
      repeat: 1,
      ease: UI_MOTION.easeTap
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
      duration: UI_MOTION.objectiveCompleteFloatMs,
      ease: UI_MOTION.easeHover,
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
        this.weaponSprite.play(this.weaponIdleAnimKey);
      }
    }

    if (!isActive) {
      if (this.magTimerText.visible) {
        this.magTimerText.setVisible(false);
        this.emitHudUpdate();
      }
      if (!this.isOwnedMagWeaponViewActive) {
        this.stopMagFireSound();
      }
      return;
    }

    const secondsLeft = Math.ceil((this.magModeEndsAt - this.time.now) / 1000);
    this.magTimerText.setText(`FN-MAG-58: ${secondsLeft}`).setVisible(true);
  }

  activateMagMode() {
    const magDurationMs = this.levelId === 2 ? LEVEL_2_MAG_MODE_DURATION_MS : DEFAULT_MAG_MODE_DURATION_MS;
    this.magModeEndsAt = this.time.now + magDurationMs;
    this.emitHudUpdate();
    this.updateMagMode();
  }

  isMagModeActive() {
    return this.time.now < this.magModeEndsAt;
  }

  isMagFiringMechanicActive() {
    return this.isMagModeActive() || this.isOwnedMagWeaponViewActive;
  }

  isTavorMechanicActive() {
    return this.isTavorWeaponViewActive && !this.isMagModeActive();
  }

  canUseGrenades() {
    return !this.isMagFiringMechanicActive() && !this.isTavorMechanicActive();
  }

  getAmmoCostPerShot() {
    return this.isTavorMechanicActive() ? 3 : 1;
  }

  getAimAssistRadius() {
    if (this.isMagFiringMechanicActive()) {
      return MAG_AIM_ASSIST_RADIUS;
    }
    if (this.isTavorMechanicActive()) {
      return TAVOR_AIM_ASSIST_RADIUS;
    }
    return 0;
  }

  emitHudUpdate() {
    this.syncSelectedWeaponAmmoState();
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
    this.updateGrenadeHudVisibility();
  }

  createDamageOverlay() {
    this.damageOverlay = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth, this.scale.height, 0xcc2020, 0)
      .setDepth(85);
  }

  createLifeBar() {
    const y = this.scale.height - UI_LAYOUT.bottomHudYInset;
    const panelX = 514;
    const panelWidth = 260;
    const panelHeight = UI_LAYOUT.counterPanelHeight;
    this.createUiBlurBackdrop(panelX, y, panelWidth, panelHeight, 259);
    this.healthPanel = this.add
      .image(panelX, y, "hud-counter-ammo-panel")
      .setDisplaySize(panelWidth, panelHeight)
      .setDepth(260)
      .setOrigin(0.5)
      .setAlpha(0.92);
    const healthSweep = this.add
      .rectangle(panelX - 86, y, 72, panelHeight - 12, 0x86f8ff, 0.07)
      .setDepth(261)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: healthSweep,
      x: panelX + 86,
      duration: UI_MOTION.counterSweepSlowMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

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
    this.hudIntroNodes.push(this.healthPanel, healthSweep);
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
    const y = this.scale.height - UI_LAYOUT.bottomHudYInset;
    const resourceIconSize = 58;
    const iconInsetFromPanelLeft = UI_LAYOUT.counterIconInsetFromPanelLeft;
    const ammoPanelX = 182;
    const ammoPanelWidth = 336;
    const ammoPanelHeight = UI_LAYOUT.counterPanelHeight;
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
      duration: UI_MOTION.counterSweepFastMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

    const ammoIconX = ammoPanelX - ammoPanelWidth * 0.5 + iconInsetFromPanelLeft;
    this.add.image(ammoIconX, y, "hud-icon-ammo").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(263);
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
    const grenadePanelHeight = UI_LAYOUT.counterPanelHeight;
    this.grenadeHudBackdropNodes = this.createUiBlurBackdrop(grenadeX, y, grenadePanelWidth, grenadePanelHeight, 259);
    this.grenadePanel = this.add
      .image(grenadeX, y, "hud-counter-grenade-panel")
      .setDisplaySize(grenadePanelWidth, grenadePanelHeight)
      .setDepth(260)
      .setOrigin(0.5);
    this.grenadeSweep = this.add
      .rectangle(grenadeX - 56, y, 66, grenadePanelHeight - 12, 0x86f8ff, 0.065)
      .setDepth(262)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.grenadeSweep,
      x: grenadeX + 56,
      duration: UI_MOTION.counterSweepSlowMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

    const grenadeIconX = grenadeX - grenadePanelWidth * 0.5 + iconInsetFromPanelLeft;
    this.grenadeHudIcon = this.add
      .image(grenadeIconX, y, "hud-icon-grenade")
      .setDisplaySize(resourceIconSize, resourceIconSize)
      .setDepth(263);
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
      this.grenadeSweep
    );
  }

  updateGrenadeHudVisibility() {
    const shouldShowGrenadeHud = this.canUseGrenades();
    const setVisible = (node, visible) => {
      if (node?.active) {
        node.setVisible(visible);
      }
    };

    this.grenadeHudBackdropNodes.forEach((node) => setVisible(node, shouldShowGrenadeHud));
    setVisible(this.grenadePanel, shouldShowGrenadeHud);
    setVisible(this.grenadeSweep, shouldShowGrenadeHud);
    setVisible(this.grenadeHudIcon, shouldShowGrenadeHud);
    setVisible(this.grenadeText, shouldShowGrenadeHud);
    this.grenadeIcons.forEach((icon) => setVisible(icon, shouldShowGrenadeHud));
    if (this.grenadeOverflowText?.active) {
      this.grenadeOverflowText.setVisible(
        shouldShowGrenadeHud &&
        (this.grenadeOverflowText.text?.length ?? 0) > 0
      );
    }
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
        this.grenadeOverflowText.setText("");
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
      duration: UI_MOTION.hudPulseMs,
      yoyo: true,
      ease: UI_MOTION.easeTap,
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

    this.failBlurLayers = [22, 48, 82, 118].map((expand, index) =>
      this.add
        .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth + expand, this.scale.height + expand, 0x0a0f14, 0)
        .setDepth(1497 + index)
        .setVisible(false)
    );

  }

  startRetryButtonPulse() {
    if (!this.retryButton?.visible || !this.retryButtonLabel?.visible) {
      return;
    }

    this.retryButtonPulseTween?.stop();
    this.retryButtonPulseTween = this.tweens.add({
      targets: [this.retryButton, this.retryButtonLabel],
      scaleX: 1.024,
      scaleY: 1.024,
      duration: UI_MOTION.buttonPulseMs,
      ease: UI_MOTION.easePulse,
      yoyo: true,
      repeat: -1
    });
  }

  stopRetryButtonPulse() {
    this.retryButtonPulseTween?.stop();
    this.retryButtonPulseTween = null;
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
      { dx: 2, dy: -1, tint: "#f8fbff" },
      { dx: 0, dy: 0, tint: "#f8fbff" }
    ];
    this.failGlitchGhostLeft?.setVisible(true).setAlpha(0.5);
    this.failGlitchGhostRight?.setVisible(true).setAlpha(0.5);

    jumps.forEach((jump, index) => {
      this.time.delayedCall(index * UI_MOTION.cinematicGlitchStepMs, () => {
        if (!this.gameStatusText?.active || !this.gameOver) {
          return;
        }

        this.gameStatusText.setPosition(originalX + jump.dx, originalY + jump.dy);
        this.gameStatusText.setColor(jump.tint);
        this.failGlitchGhostLeft?.setPosition(originalX + jump.dx - 5, originalY + jump.dy + 1);
        this.failGlitchGhostRight?.setPosition(originalX + jump.dx + 5, originalY + jump.dy - 1);
        if (index === jumps.length - 1) {
          this.failGlitchGhostLeft?.setAlpha(0.22);
          this.failGlitchGhostRight?.setAlpha(0.22);
        }
      });
    });
  }

  triggerMissionFailedCinematic() {
    this.tweens.killTweensOf(this.reloadWarningText);
    this.reloadWarningText?.setVisible(false);
    this.comboText?.setVisible(false);
    this.failOverlay?.setVisible(true).setAlpha(0);
    this.failBlurLayers.forEach((layer, index) => {
      layer.setVisible(true).setAlpha(0).setScale(1.05 + index * 0.015);
    });

    this.stopRetryButtonPulse();
    this.retryButton?.setVisible(false).setScale(0.96).setAlpha(0).setTint(RETRY_BUTTON_BASE_TINT);
    this.retryButtonLabel?.setVisible(false).setAlpha(0);
    this.retryButtonGlow?.setVisible(false).setAlpha(0).setTint(RETRY_BUTTON_GLOW_TINT);
    if (this.gameStatusText?.active) {
      this.gameStatusText
        .setText("MISSION FAILED")
        .setVisible(true)
        .setAlpha(0)
        .setScale(0.84);
      this.gameStatusText.setShadow(0, 0, "#ff2937", 34, true, true);
    }
    this.failGlitchGhostLeft?.setVisible(false).setAlpha(0).setScale(0.84);
    this.failGlitchGhostRight?.setVisible(false).setAlpha(0).setScale(0.84);

    this.cameras.main.setZoom(1);
    this.cameras.main.shake(220, 0.0034);
    this.failZoomTween?.stop();
    this.cameras.main.setZoom(1);
    if (!this.failBackgroundBlurFx && this.backgroundImage?.preFX?.addBlur) {
      this.backgroundImage.preFX.setPadding?.(12);
      this.failBackgroundBlurFx = this.backgroundImage.preFX.addBlur(1, 0, 0, 0, 0xffffff, 6);
      this.failBackgroundBlurFx?.setActive(false);
    }
    if (this.failBackgroundBlurFx) {
      this.failBackgroundBlurFx.setActive(true);
      this.failBackgroundBlurFx.x = 0;
      this.failBackgroundBlurFx.y = 0;
      this.failBackgroundBlurFx.strength = 0;
      this.tweens.add({
        targets: this.failBackgroundBlurFx,
        x: 2.6,
        y: 2.6,
        strength: 1.45,
      duration: 500,
      ease: UI_MOTION.easeTap
      });
    }
    this.tweens.add({
      targets: this.failOverlay,
      alpha: 0.84,
      duration: UI_MOTION.cinematicOverlayInMs
    });
    this.failBlurLayers.forEach((layer, index) => {
      this.tweens.add({
        targets: layer,
        alpha: 0.13 + index * 0.07,
        scaleX: 1,
        scaleY: 1,
        duration: UI_MOTION.cinematicOverlayInMs + index * 90
      });
    });
    this.tweens.add({
      targets: this.gameStatusText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: UI_MOTION.cinematicStatusPopMs,
      delay: UI_MOTION.cinematicStatusPopDelayMs,
      ease: UI_MOTION.easeCinematicPop
    });
    this.failTextFlickerTween?.stop();
    this.failTextFlickerTween = this.tweens.add({
      targets: this.gameStatusText,
      alpha: { from: 0.9, to: 1 },
      duration: 110,
      delay: 500,
      yoyo: true,
      repeat: 4
    });

    this.time.delayedCall(250, () => this.playMissionFailedGlitch());
    this.time.delayedCall(720, () => this.playMissionFailedGlitch());
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
        duration: UI_MOTION.buttonRevealMs,
        ease: UI_MOTION.easeHover
      });
      this.tweens.add({
        targets: this.retryButtonGlow,
        alpha: 0.4,
        duration: UI_MOTION.glowPulseMs,
        yoyo: true,
        repeat: -1,
        ease: UI_MOTION.easePulse
      });
      this.startRetryButtonPulse();
    });
  }

  hideMissionFailScreen() {
    this.stopRetryButtonPulse();
    this.retryButtonHoverTween?.stop();
    this.failZoomTween?.stop();
    this.failTextFlickerTween?.stop();
    this.failOverlay?.setVisible(false).setAlpha(0);
    this.failBlurLayers.forEach((layer) => layer.setVisible(false).setAlpha(0));
    this.retryButtonGlow?.setVisible(false).setAlpha(0);
    this.failGlitchGhostLeft?.setVisible(false).setAlpha(0);
    this.failGlitchGhostRight?.setVisible(false).setAlpha(0);
    if (this.failBackgroundBlurFx) {
      this.failBackgroundBlurFx.setActive(false);
      this.failBackgroundBlurFx.x = 0;
      this.failBackgroundBlurFx.y = 0;
      this.failBackgroundBlurFx.strength = 0;
    }
    this.cameras.main.setZoom(1);
  }

  createAbortButton() {
    const abortWidth = 170;
    const x = this.playWidth - abortWidth * 0.5 - 12;
    const y = UI_LAYOUT.objectiveTopY + UI_LAYOUT.objectivePanelHeight * 0.5;
    this.abortButton = this.add
      .image(x, y, "hud-objective-panel")
      .setDisplaySize(abortWidth, UI_LAYOUT.objectivePanelHeight)
      .setDepth(306)
      .setAlpha(0.95)
      .setInteractive({ useHandCursor: true });
    this.abortButtonLabel = this.add
      .text(x, y, "ABORT", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "26px",
        color: "#dffcff",
        stroke: "#07161a",
        strokeThickness: 4,
        letterSpacing: 2
      })
      .setOrigin(0.5)
      .setDepth(307);

    this.abortButton.on("pointerover", () => {
      this.abortButton?.setTint(0xd7fbff).setAlpha(1);
    });

    this.abortButton.on("pointerout", () => {
      this.abortButton?.clearTint().setAlpha(0.95);
    });

    this.abortButton.on("pointerup", () => this.abortMission());
  }

  createAbortConfirmScreen() {
    const centerX = this.playWidth / 2;
    const centerY = this.scale.height / 2;
    const panelWidth = 640;
    const panelHeight = 328;
    const buttonY = centerY + 102;
    const buttonOffsetX = 162;
    const baseButtonWidth = 238;
    const baseButtonHeight = 62;

    this.abortConfirmOverlay = this.add
      .rectangle(centerX, centerY, this.playWidth + 40, this.scale.height + 40, 0x04080e, 0.78)
      .setDepth(1600)
      .setVisible(false)
      .setInteractive({ useHandCursor: false });
    this.abortConfirmFrame = this.add
      .rectangle(centerX, centerY, panelWidth + 20, panelHeight + 20, 0x05111a, 0.9)
      .setStrokeStyle(3, 0x66d8ff, 0.72)
      .setDepth(1601)
      .setVisible(false);
    this.abortConfirmPanel = this.add
      .rectangle(centerX, centerY, panelWidth, panelHeight, 0x081924, 0.97)
      .setStrokeStyle(2, 0x2f92b8, 0.85)
      .setDepth(1602)
      .setVisible(false);
    this.abortConfirmTitle = this.add
      .text(centerX, centerY - 114, "ABORT MISSION?", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "50px",
        color: "#f2fdff",
        stroke: "#061116",
        strokeThickness: 8,
        letterSpacing: 4
      })
      .setOrigin(0.5)
      .setDepth(1603)
      .setVisible(false);
    this.abortConfirmSubtitle = this.add
      .text(centerX, centerY - 60, "Return to Operation Center?", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "34px",
        color: "#b8efff",
        stroke: "#061116",
        strokeThickness: 5,
        letterSpacing: 1
      })
      .setOrigin(0.5)
      .setDepth(1603)
      .setVisible(false);
    this.abortConfirmDivider = this.add
      .rectangle(centerX, centerY - 20, panelWidth - 104, 2, 0x59d4f4, 0.45)
      .setDepth(1603)
      .setVisible(false);
    this.abortConfirmBody = this.add
      .text(centerX, centerY + 24, "Current mission progress will be lost.", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "26px",
        align: "center",
        color: "#d1e2e8",
        stroke: "#061116",
        strokeThickness: 4,
        letterSpacing: 1
      })
      .setOrigin(0.5)
      .setDepth(1603)
      .setVisible(false);

    this.abortConfirmStayGlow = this.add
      .image(centerX - buttonOffsetX, buttonY, "hud-counter-grenade-panel")
      .setDisplaySize(baseButtonWidth + 24, baseButtonHeight + 16)
      .setTint(0x45cfff)
      .setAlpha(0)
      .setDepth(1603)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.abortConfirmStayButton = this.add
      .image(centerX - buttonOffsetX, buttonY, "hud-counter-grenade-panel")
      .setDisplaySize(baseButtonWidth, baseButtonHeight)
      .setTint(0x1f8ba8)
      .setDepth(1604)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.abortConfirmStayLabel = this.add
      .text(centerX - buttonOffsetX, buttonY, "STAY", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "38px",
        color: "#f2fdff",
        stroke: "#06202a",
        strokeThickness: 5,
        letterSpacing: 4
      })
      .setOrigin(0.5)
      .setDepth(1605)
      .setVisible(false);
    this.abortConfirmLeaveGlow = this.add
      .image(centerX + buttonOffsetX, buttonY, "hud-counter-grenade-panel")
      .setDisplaySize(baseButtonWidth + 24, baseButtonHeight + 16)
      .setTint(0xff6c7b)
      .setAlpha(0)
      .setDepth(1603)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.abortConfirmLeaveButton = this.add
      .image(centerX + buttonOffsetX, buttonY, "hud-counter-grenade-panel")
      .setDisplaySize(baseButtonWidth, baseButtonHeight)
      .setTint(0x963948)
      .setDepth(1604)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.abortConfirmLeaveLabel = this.add
      .text(centerX + buttonOffsetX, buttonY, "LEAVE", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "38px",
        color: "#fff4f4",
        stroke: "#2a0b10",
        strokeThickness: 5,
        letterSpacing: 4
      })
      .setOrigin(0.5)
      .setDepth(1605)
      .setVisible(false);

    this.abortConfirmStayButton.on("pointerover", () => {
      if (!this.isAbortConfirmVisible()) {
        return;
      }
      this.abortConfirmStayButton?.setTint(0x35b6da);
      this.abortConfirmStayGlow?.setAlpha(0.48);
      this.abortConfirmStayLabel?.setScale(1.04);
    });
    this.abortConfirmStayButton.on("pointerout", () => {
      this.abortConfirmStayButton?.setTint(0x1f8ba8);
      this.abortConfirmStayGlow?.setAlpha(0.22);
      this.abortConfirmStayLabel?.setScale(1);
    });
    this.abortConfirmStayButton.on("pointerdown", () => {
      if (!this.isAbortConfirmVisible()) {
        return;
      }
      this.abortConfirmStayButton?.setScale(0.97);
      this.abortConfirmStayLabel?.setScale(0.99);
    });
    this.abortConfirmStayButton.on("pointerup", () => {
      this.abortConfirmStayButton?.setScale(1);
      this.abortConfirmStayLabel?.setScale(1);
      this.hideAbortConfirmScreen();
    });

    this.abortConfirmLeaveButton.on("pointerover", () => {
      if (!this.isAbortConfirmVisible()) {
        return;
      }
      this.abortConfirmLeaveButton?.setTint(0xb74b5b);
      this.abortConfirmLeaveGlow?.setAlpha(0.46);
      this.abortConfirmLeaveLabel?.setScale(1.04);
    });
    this.abortConfirmLeaveButton.on("pointerout", () => {
      this.abortConfirmLeaveButton?.setTint(0x963948);
      this.abortConfirmLeaveGlow?.setAlpha(0.2);
      this.abortConfirmLeaveLabel?.setScale(1);
    });
    this.abortConfirmLeaveButton.on("pointerdown", () => {
      if (!this.isAbortConfirmVisible()) {
        return;
      }
      this.abortConfirmLeaveButton?.setScale(0.97);
      this.abortConfirmLeaveLabel?.setScale(0.99);
    });
    this.abortConfirmLeaveButton.on("pointerup", () => {
      this.abortConfirmLeaveButton?.setScale(1);
      this.abortConfirmLeaveLabel?.setScale(1);
      this.confirmAbortMission();
    });
  }

  isAbortConfirmVisible() {
    return Boolean(this.abortConfirmOverlay?.visible);
  }

  showAbortConfirmScreen() {
    if (this.isAbortConfirmVisible()) {
      return;
    }

    this.stopMagFireSound();
    this.abortConfirmOverlay?.setVisible(true).setAlpha(0);
    this.abortConfirmFrame?.setVisible(true).setScale(0.98).setAlpha(0);
    this.abortConfirmPanel?.setVisible(true).setScale(0.96).setAlpha(0);
    this.abortConfirmTitle?.setVisible(true).setAlpha(0);
    this.abortConfirmSubtitle?.setVisible(true).setAlpha(0);
    this.abortConfirmBody?.setVisible(true).setAlpha(0);
    this.abortConfirmDivider?.setVisible(true).setAlpha(0);
    this.abortConfirmStayGlow?.setVisible(true).setScale(0.98).setAlpha(0.16).setTint(0x45cfff);
    this.abortConfirmStayButton?.setVisible(true).setScale(0.96).setAlpha(0).setTint(0x1f8ba8);
    this.abortConfirmStayLabel?.setVisible(true).setAlpha(0);
    this.abortConfirmLeaveGlow?.setVisible(true).setScale(0.98).setAlpha(0.14).setTint(0xff6c7b);
    this.abortConfirmLeaveButton?.setVisible(true).setScale(0.96).setAlpha(0).setTint(0x963948);
    this.abortConfirmLeaveLabel?.setVisible(true).setAlpha(0);

    this.tweens.add({
      targets: this.abortConfirmOverlay,
      alpha: 0.78,
      duration: UI_MOTION.cinematicOverlayInMs,
      ease: UI_MOTION.easeTap
    });
    this.tweens.add({
      targets: [
        this.abortConfirmFrame,
        this.abortConfirmPanel,
        this.abortConfirmTitle,
        this.abortConfirmSubtitle,
        this.abortConfirmBody,
        this.abortConfirmDivider,
        this.abortConfirmStayButton,
        this.abortConfirmStayLabel,
        this.abortConfirmLeaveButton,
        this.abortConfirmLeaveLabel
      ].filter(Boolean),
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: UI_MOTION.buttonRevealMs + 70,
      ease: UI_MOTION.easeCinematicPop
    });
    this.tweens.add({
      targets: [this.abortConfirmStayGlow, this.abortConfirmLeaveGlow].filter(Boolean),
      alpha: { from: 0, to: 0.2 },
      scaleX: 1,
      scaleY: 1,
      duration: UI_MOTION.buttonRevealMs + 90,
      ease: UI_MOTION.easeHover
    });
  }

  hideAbortConfirmScreen() {
    this.abortConfirmOverlay?.setVisible(false).setAlpha(0);
    this.abortConfirmFrame?.setVisible(false).setAlpha(0).setScale(1);
    this.abortConfirmPanel?.setVisible(false).setAlpha(0);
    this.abortConfirmTitle?.setVisible(false).setAlpha(0);
    this.abortConfirmSubtitle?.setVisible(false).setAlpha(0);
    this.abortConfirmBody?.setVisible(false).setAlpha(0);
    this.abortConfirmDivider?.setVisible(false).setAlpha(0);
    this.abortConfirmStayGlow?.setVisible(false).setAlpha(0).setScale(1);
    this.abortConfirmStayButton?.setVisible(false).setAlpha(0).setScale(1).setTint(0x1f8ba8);
    this.abortConfirmStayLabel?.setVisible(false).setAlpha(0).setScale(1);
    this.abortConfirmLeaveGlow?.setVisible(false).setAlpha(0).setScale(1);
    this.abortConfirmLeaveButton?.setVisible(false).setAlpha(0).setScale(1).setTint(0x963948);
    this.abortConfirmLeaveLabel?.setVisible(false).setAlpha(0).setScale(1);
  }

  confirmAbortMission() {
    this.hideAbortConfirmScreen();
    this.stopMagFireSound();
    this.hideMissionFailScreen?.();
    this.input.setDefaultCursor("auto");
    this.scene.start("operation-center");
  }

  abortMission() {
    if (this.gameOver || this.levelComplete) {
      return;
    }
    this.showAbortConfirmScreen();
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
    this.refreshOwnedWeaponIds();
    const desiredWeaponId = this.getValidSelectedWeaponId();
    this.selectedWeaponId = desiredWeaponId;
    const hasOwnedMagWeapon = desiredWeaponId === "mag";
    const hasOwnedTavorWeapon = desiredWeaponId === "tavor";
    const canUseOwnedMagView =
      hasOwnedMagWeapon &&
      this.textures.exists("weapon-mag-idle") &&
      this.textures.exists("weapon-mag-firing");
    const canUseOwnedTavorView =
      !canUseOwnedMagView &&
      hasOwnedTavorWeapon &&
      this.textures.exists("weapon-tavor-idle") &&
      this.textures.exists("weapon-tavor-firing");
    const canUseCustomM203View =
      this.textures.exists("weapon-m203-idle-custom") &&
      this.textures.exists("weapon-m203-firing-custom");
    this.isOwnedMagWeaponViewActive = canUseOwnedMagView;
    this.isTavorWeaponViewActive = canUseOwnedTavorView;
    this.isCustomM203WeaponViewActive = !canUseOwnedMagView && !canUseOwnedTavorView && canUseCustomM203View;
    const isCenteredWeaponView =
      this.isOwnedMagWeaponViewActive || this.isTavorWeaponViewActive || this.isCustomM203WeaponViewActive;
    this.weaponSpriteSheetKey = canUseOwnedMagView
      ? "weapon-mag-idle"
      : canUseOwnedTavorView
        ? "weapon-tavor-idle"
      : this.isCustomM203WeaponViewActive
        ? "weapon-m203-idle-custom"
        : this.textures.exists("weapon-m203-sheet")
          ? "weapon-m203-sheet"
          : this.textures.exists("weapon-m203-sheet-new")
            ? "weapon-m203-sheet-new"
            : "weapon-m204-sheet";
    if (!this.textures.exists(this.weaponSpriteSheetKey)) {
      return;
    }

    this.ensureWeaponAnimations();
    this.weaponBaseX = isCenteredWeaponView ? this.playWidth * 0.5 : this.playWidth - 6;
    this.weaponBaseY = isCenteredWeaponView
      ? this.scale.height - UI_LAYOUT.bottomHudYInset - (this.isCustomM203WeaponViewActive ? 140 : 170)
      : this.scale.height - 2;
    this.weaponShadow = this.add
      .ellipse(this.weaponBaseX + WEAPON_SHADOW_OFFSET_X, this.weaponBaseY + WEAPON_SHADOW_OFFSET_Y, 276, 110, 0x000000, 0.17)
      .setAngle(-8)
      .setDepth(90);
    if (isCenteredWeaponView) {
      this.weaponShadow.setVisible(false);
    }
    this.weaponSprite = this.add
      .sprite(this.weaponBaseX, this.weaponBaseY, this.weaponSpriteSheetKey, 0)
      .setDisplaySize(
        this.isOwnedMagWeaponViewActive
          ? 300
          : this.isTavorWeaponViewActive
            ? 330
            : this.isCustomM203WeaponViewActive
              ? 360
              : 320,
        this.isOwnedMagWeaponViewActive
          ? 300
          : this.isTavorWeaponViewActive
            ? 300
            : this.isCustomM203WeaponViewActive
              ? 240
              : 252
      )
      .setOrigin(isCenteredWeaponView ? 0.5 : 1, isCenteredWeaponView ? 0.5 : 1)
      .setDepth(91);
    this.weaponSprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_animation, frame) => {
      this.applyWeaponCrop(frame);
    });
    this.weaponSprite.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${this.weaponFireAnimKey}`, () => {
      if (!this.isMagModeActive() && this.weaponSprite?.active) {
        this.weaponSprite.play(this.weaponIdleAnimKey);
      }
    });
    this.weaponSprite.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${this.weaponGrenadeAnimKey}`, () => {
      if (!this.isMagModeActive() && this.weaponSprite?.active) {
        this.weaponSprite.play(this.weaponIdleAnimKey);
      }
    });
    this.applyWeaponCrop(this.weaponSprite.frame);
    this.weaponSprite.play(this.weaponIdleAnimKey);
    if (typeof this.syncWeaponShadow === "function") {
      this.syncWeaponShadow();
    }
  }

  refreshOwnedWeaponIds() {
    const owned = [];
    if (this.registry.get("hasM203")) {
      owned.push("m203");
    }
    if (this.registry.get("hasTar21")) {
      owned.push("tavor");
    }
    if (this.registry.get("hasMag58")) {
      owned.push("mag");
    }
    if (!owned.length) {
      owned.push("m203");
    }
    this.ownedWeaponIds = owned;
  }

  createWeaponAmmoState() {
    const weaponIds = ["m203", "tavor", "mag"];
    const ammoState = {};
    weaponIds.forEach((weaponId) => {
      const maxAmmo = getWeaponMaxAmmoCapacity(this.registry, weaponId);
      ammoState[weaponId] = {
        ammo: maxAmmo,
        maxAmmo
      };
    });

    return ammoState;
  }

  getWeaponAmmoState(weaponId) {
    const existing = this.weaponAmmoById?.[weaponId];
    if (existing) {
      return existing;
    }

    const maxAmmo = getWeaponMaxAmmoCapacity(this.registry, weaponId);
    const created = { ammo: maxAmmo, maxAmmo };
    this.weaponAmmoById[weaponId] = created;
    return created;
  }

  syncSelectedWeaponAmmoState() {
    const weaponId = this.selectedWeaponId;
    if (!weaponId) {
      return;
    }

    const ammoState = this.getWeaponAmmoState(weaponId);
    ammoState.maxAmmo = getWeaponMaxAmmoCapacity(this.registry, weaponId);
    ammoState.ammo = Phaser.Math.Clamp(Math.floor(this.state.ammo), 0, ammoState.maxAmmo);
    this.state.maxAmmo = ammoState.maxAmmo;
    this.state.ammo = ammoState.ammo;
  }

  applyCurrentWeaponAmmoState() {
    const weaponId = this.selectedWeaponId;
    if (!weaponId) {
      return;
    }

    const ammoState = this.getWeaponAmmoState(weaponId);
    ammoState.maxAmmo = getWeaponMaxAmmoCapacity(this.registry, weaponId);
    ammoState.ammo = Phaser.Math.Clamp(Math.floor(ammoState.ammo), 0, ammoState.maxAmmo);
    this.state.maxAmmo = ammoState.maxAmmo;
    this.state.refillAmmo(ammoState.ammo);
  }

  getValidSelectedWeaponId() {
    if (this.ownedWeaponIds.includes(this.selectedWeaponId)) {
      return this.selectedWeaponId;
    }
    return this.ownedWeaponIds[0] ?? "m203";
  }

  switchWeaponByWheel(deltaY) {
    this.refreshOwnedWeaponIds();
    if (this.ownedWeaponIds.length <= 1 || !deltaY) {
      return;
    }

    const current = this.getValidSelectedWeaponId();
    const currentIndex = this.ownedWeaponIds.indexOf(current);
    const direction = deltaY > 0 ? 1 : -1;
    const nextIndex = (currentIndex + direction + this.ownedWeaponIds.length) % this.ownedWeaponIds.length;
    const nextWeaponId = this.ownedWeaponIds[nextIndex];
    if (!nextWeaponId || nextWeaponId === current) {
      return;
    }

    this.syncSelectedWeaponAmmoState();
    this.selectedWeaponId = nextWeaponId;
    this.applyCurrentWeaponAmmoState();
    this.rebuildWeaponView();
    this.lastShotAtMs = this.time.now;
    this.emitHudUpdate();
  }

  rebuildWeaponView() {
    this.stopMagFireSound();
    if (this.weaponSprite?.active) {
      this.weaponSprite.destroy();
    }
    if (this.weaponShadow?.active) {
      this.weaponShadow.destroy();
    }
    this.weaponSprite = null;
    this.weaponShadow = null;
    this.createWeaponView();
  }

  ensureWeaponAnimations() {
    if (this.weaponSpriteSheetKey === "weapon-mag-idle") {
      this.weaponIdleAnimKey = "weapon-mag-idle-view";
      this.weaponFireAnimKey = "weapon-mag-fire-view";
      this.weaponGrenadeAnimKey = "weapon-mag-grenade-view";

      if (!this.anims.exists(this.weaponIdleAnimKey)) {
        this.anims.create({
          key: this.weaponIdleAnimKey,
          frames: [{ key: "weapon-mag-idle" }],
          frameRate: 4,
          repeat: -1
        });
      }
      if (!this.anims.exists(this.weaponFireAnimKey)) {
        this.anims.create({
          key: this.weaponFireAnimKey,
          frames: [
            { key: "weapon-mag-firing", frame: 0 },
            { key: "weapon-mag-firing", frame: 1 },
            { key: "weapon-mag-firing", frame: 0 }
          ],
          frameRate: 16,
          repeat: 0
        });
      }
      if (!this.anims.exists(this.weaponGrenadeAnimKey)) {
        this.anims.create({
          key: this.weaponGrenadeAnimKey,
          frames: [{ key: "weapon-mag-idle" }],
          frameRate: 8,
          repeat: 0
        });
      }
      return;
    }

    if (this.weaponSpriteSheetKey === "weapon-tavor-idle") {
      this.weaponIdleAnimKey = "weapon-tavor-idle-view";
      this.weaponFireAnimKey = "weapon-tavor-fire-view";
      this.weaponGrenadeAnimKey = "weapon-tavor-grenade-view";
      this.anims.remove(this.weaponIdleAnimKey);
      this.anims.remove(this.weaponFireAnimKey);
      this.anims.remove(this.weaponGrenadeAnimKey);

      this.anims.create({
        key: this.weaponIdleAnimKey,
        frames: [{ key: "weapon-tavor-idle" }],
        frameRate: 4,
        repeat: -1
      });
      this.anims.create({
        key: this.weaponFireAnimKey,
        frames: [
          { key: "weapon-tavor-firing", frame: 0 },
          { key: "weapon-tavor-firing", frame: 1 },
          { key: "weapon-tavor-firing", frame: 0 }
        ],
        frameRate: 16,
        repeat: 0
      });
      this.anims.create({
        key: this.weaponGrenadeAnimKey,
        frames: [{ key: "weapon-tavor-idle" }],
        frameRate: 8,
        repeat: 0
      });
      return;
    }

    if (this.weaponSpriteSheetKey === "weapon-m203-idle-custom") {
      this.weaponIdleAnimKey = "weapon-m203-idle-custom-view";
      this.weaponFireAnimKey = "weapon-m203-fire-custom-view";
      this.weaponGrenadeAnimKey = "weapon-m203-grenade-custom-view";
      this.anims.remove(this.weaponIdleAnimKey);
      this.anims.remove(this.weaponFireAnimKey);
      this.anims.remove(this.weaponGrenadeAnimKey);
      const idleFrame0 = this.textures.exists("weapon-m203-idle-custom-aligned-0")
        ? { key: "weapon-m203-idle-custom-aligned-0" }
        : { key: "weapon-m203-idle-custom", frame: 0 };
      const fireFrame0 = this.textures.exists("weapon-m203-firing-custom-aligned-0")
        ? { key: "weapon-m203-firing-custom-aligned-0" }
        : { key: "weapon-m203-firing-custom", frame: 0 };
      const fireFrame1 = this.textures.exists("weapon-m203-firing-custom-aligned-1")
        ? { key: "weapon-m203-firing-custom-aligned-1" }
        : { key: "weapon-m203-firing-custom", frame: 1 };
      const grenadeFrame0 = this.textures.exists("weapon-m203-firing-grenade-custom-aligned-0")
        ? { key: "weapon-m203-firing-grenade-custom-aligned-0" }
        : { key: "weapon-m203-firing-grenade-custom", frame: 0 };
      const grenadeFrame1 = this.textures.exists("weapon-m203-firing-grenade-custom-aligned-1")
        ? { key: "weapon-m203-firing-grenade-custom-aligned-1" }
        : { key: "weapon-m203-firing-grenade-custom", frame: 1 };
      const grenadeFrame2 = this.textures.exists("weapon-m203-firing-grenade-custom-aligned-2")
        ? { key: "weapon-m203-firing-grenade-custom-aligned-2" }
        : { key: "weapon-m203-firing-grenade-custom", frame: 2 };

      this.anims.create({
        key: this.weaponIdleAnimKey,
        frames: [idleFrame0],
        frameRate: 4,
        repeat: -1
      });
      this.anims.create({
        key: this.weaponFireAnimKey,
        frames: [fireFrame0, fireFrame1, fireFrame0],
        frameRate: 14,
        repeat: 0
      });
      this.anims.create({
        key: this.weaponGrenadeAnimKey,
        frames: this.textures.exists("weapon-m203-firing-grenade-custom")
          ? [grenadeFrame0, grenadeFrame1, grenadeFrame2]
          : [idleFrame0],
        frameRate: this.textures.exists("weapon-m203-firing-grenade-custom") ? WEAPON_GRENADE_ANIM_FPS : 8,
        repeat: 0
      });
      return;
    }

    this.weaponIdleAnimKey = "weapon-m203-idle";
    this.weaponFireAnimKey = "weapon-m203-fire";
    this.weaponGrenadeAnimKey = "weapon-m203-grenade";
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
      this.weaponSprite.play(action === "grenade" ? this.weaponGrenadeAnimKey : this.weaponFireAnimKey, true);
      this.playWeaponTilt(action);
    } else {
      this.cameras.main.shake(action === "grenade" ? 120 : 70, action === "grenade" ? 0.0035 : 0.0018);
    }
  }

  resetWeaponPosition() {
    if (!this.weaponSprite?.active) {
      return;
    }

    if (this.isOwnedMagWeaponViewActive) {
      this.updateWeaponAimTarget();
      this.weaponSprite.setPosition(this.weaponAimTargetX, this.weaponAimTargetY);
      this.weaponSprite.setAngle(this.weaponAimTargetAngle * 0.55);
      this.applyWeaponCrop(this.weaponSprite.frame);
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

    if (this.isOwnedMagWeaponViewActive || this.isTavorWeaponViewActive || this.isCustomM203WeaponViewActive) {
      this.weaponSprite.setCrop();
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

    if (!this.isOwnedMagWeaponViewActive) {
      // Keep non-MAG weapon movement driven by scope-follow only.
      this.tweens.killTweensOf(this.weaponSprite);
      this.resetWeaponPosition();
      return;
    }

    this.applyWeaponRecoil(action);
  }

  applyWeaponRecoil(action) {
    const isGrenade = action === "grenade";
    const kickY = isGrenade ? -16 : -9;
    const kickX = isGrenade ? Phaser.Math.FloatBetween(-2.2, 2.2) : Phaser.Math.FloatBetween(-1.4, 1.4);
    const kickAngle = isGrenade ? Phaser.Math.FloatBetween(-1.8, 1.8) : Phaser.Math.FloatBetween(-1.2, 1.2);

    this.tweens.killTweensOf(this, ["weaponRecoilX", "weaponRecoilY", "weaponRecoilAngle"]);
    this.weaponRecoilX = kickX;
    this.weaponRecoilY = kickY;
    this.weaponRecoilAngle = kickAngle;
    this.tweens.add({
      targets: this,
      weaponRecoilX: 0,
      weaponRecoilY: 0,
      weaponRecoilAngle: 0,
      duration: isGrenade ? 130 : 95,
      ease: "Quad.Out"
    });
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
    this.weaponAimTargetX = this.weaponBaseX + normalizedX * WEAPON_AIM_FOLLOW_X_MAX + this.weaponRecoilX;
    this.weaponAimTargetY = this.weaponBaseY + normalizedY * WEAPON_AIM_FOLLOW_Y_MAX + this.weaponRecoilY;
    this.weaponAimTargetAngle = normalizedX * WEAPON_AIM_FOLLOW_ANGLE_MAX + normalizedY * 1.5 + this.weaponRecoilAngle;
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
    const nodes = [];
    const layers = [
      { expand: 24, alpha: 0.045 },
      { expand: 14, alpha: 0.06 },
      { expand: 6, alpha: 0.08 }
    ];

    layers.forEach((layer) => {
      const node = this.add
        .rectangle(centerX, centerY, width + layer.expand, height + layer.expand, 0x06111a, layer.alpha)
        .setDepth(depth)
        .setOrigin(0.5);
      nodes.push(node);
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
    nodes.push(rim);
    return nodes;
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
    if (this.isMagFiringMechanicActive()) {
      if (!this.magFireSound?.isPlaying) {
        this.magFireSound?.play();
      }
      return;
    }

    this.stopMagFireSound();
    if (this.isTavorMechanicActive()) {
      if (this.tavorFireSound?.isPlaying) {
        this.tavorFireSound.stop();
      }
      this.tavorFireSound?.play();
      return;
    }

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
