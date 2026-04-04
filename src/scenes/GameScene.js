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
    this.createDamageOverlay();
    this.magTimerText = this.add.text(this.playWidth / 2, 46, "", {
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "30px",
      color: "#ff2b2b",
      stroke: "#260000",
      strokeThickness: 5,
      letterSpacing: 1
    })
      .setOrigin(0.5, 0)
      .setDepth(95)
      .setVisible(false);

    this.objectiveText = this.add.text(this.playWidth / 2, 10, this.getLevelObjectiveText(), {
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "30px",
      color: "#ff3b3b",
      stroke: "#2a0000",
      strokeThickness: 5,
      letterSpacing: 1
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
          const isGrenadeEnemy = enemy?.texture?.key === "enemy-grenade";
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
        this.restart();
        return;
      }

      if (this.levelComplete) {
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

    this.events.on("hud:continue", this.continueToNextChallenge, this);

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
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "26px",
      color: "#f6d471",
      stroke: "#1a1208",
      strokeThickness: 5,
      letterSpacing: 1
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
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "26px",
      color: "#90e8a7",
      stroke: "#0d1f12",
      strokeThickness: 5,
      letterSpacing: 1
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
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "26px",
      color: "#ffcb6b",
      stroke: "#2a1800",
      strokeThickness: 5,
      letterSpacing: 1
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
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "28px",
      color: "#ff7e92",
      stroke: "#2a0d13",
      strokeThickness: 5,
      letterSpacing: 1
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
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "27px",
      color: "#ff6e6e",
      stroke: "#300000",
      strokeThickness: 5,
      letterSpacing: 1
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
    const hasMoreLives = this.state.loseLife();

    if (!hasMoreLives) {
      this.emitHudUpdate();
      this.setGameOver();
      return;
    }

    this.state.hp = this.state.maxHp;
    this.state.refillAmmo();
    this.damageOverlay?.setAlpha(0);
    this.cameras.main.shake(170, 0.004);
    this.emitHudUpdate();
  }

  setGameOver() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.spawner.stop();
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    this.events.emit("hud:gameover");
  }

  setLevelComplete() {
    if (this.levelComplete || this.gameOver) {
      return;
    }

    this.levelComplete = true;
    this.spawner.stop();
    this.input.setDefaultCursor("auto");
    this.stopMagFireSound();
    this.events.emit("hud:levelcomplete");
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
    this.events.off("hud:continue", this.continueToNextChallenge, this);
    this.scene.stop("hud");
    this.scene.restart({ levelId: this.levelId });
    this.scene.launch("hud");
  }

  continueToNextChallenge() {
    if (!this.levelComplete || this.gameOver) {
      return;
    }

    this.events.off("hud:continue", this.continueToNextChallenge, this);
    this.scene.stop("hud");
    this.scene.restart({ levelId: this.levelId + 1 });
    this.scene.launch("hud");
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
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "40px",
      color: "#ffeb7a",
      stroke: "#3a2200",
      strokeThickness: 6,
      letterSpacing: 1
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
    this.events.emit("hud:update", {
      ...this.state,
      levelId: this.levelId,
      weaponMode: this.isMagModeActive() ? "mag" : "m203"
    });
  }

  createDamageOverlay() {
    this.damageOverlay = this.add
      .rectangle(this.playWidth / 2, this.scale.height / 2, this.playWidth, this.scale.height, 0xcc2020, 0)
      .setDepth(85);
  }

  showEnemyMuzzleFlash(enemy) {
    if (!enemy || !enemy.active) {
      return;
    }

    const flashX = enemy.flipX
      ? enemy.x + enemy.displayWidth * 0.18
      : enemy.x - enemy.displayWidth * 0.18;
    const flashY = enemy.y - enemy.displayHeight * 0.34;
    const flash = this.add.image(flashX, flashY, "muzzle-flash").setDepth(40);
    flash.setScale(Phaser.Math.FloatBetween(0.35, 0.48));
    flash.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: flash.scaleX * 1.25,
      scaleY: flash.scaleY * 1.25,
      duration: 120,
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
    const isGrenadeEnemy = enemy.texture?.key === "enemy-grenade";
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
