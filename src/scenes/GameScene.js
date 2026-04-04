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

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
    this.state = null;
    this.enemies = null;
    this.magazinePickups = null;
    this.medikitPickups = null;
    this.spawner = null;
    this.damageOverlay = null;
    this.playWidth = PLAY_WIDTH;
    this.gameOver = false;
  }

  create() {
    this.startBackgroundMusic();

    this.state = new GameState();
    this.gameOver = false;
    this.enemies = this.physics.add.group();
    this.magazinePickups = this.add.group();
    this.medikitPickups = this.add.group();

    this.add
      .image(this.playWidth / 2, this.scale.height / 2, "bg")
      .setDisplaySize(this.playWidth, this.scale.height);
    this.createDamageOverlay();

    this.spawner = new EnemySpawner(this, this.enemies, {
      enemyOptions: {
        aimDurationMs: 3000,
        onPlayerHit: (enemy) => {
          this.playEnemyFireSound(enemy);
          this.showEnemyMuzzleFlash(enemy);
          this.flashPlayerHit();
          this.state.applyDamage(12);
          this.events.emit("hud:update", this.state);
          this.cameras.main.shake(120, 0.003);

          if (this.state.hp <= 0) {
            this.setGameOver();
          }
        }
      }
    });
    this.spawner.start();

    this.input.setDefaultCursor("none");
    this.input.mouse?.disableContextMenu();
    this.events.emit("hud:update", this.state);

    this.input.on("pointerdown", (pointer) => {
      if (this.gameOver) {
        this.restart();
        return;
      }

      if (pointer.rightButtonDown()) {
        this.throwGrenade(pointer);
        return;
      }

      this.shoot(pointer);
    });

  }

  update(_time, delta) {
    if (this.gameOver) {
      return;
    }

    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }

      enemy.updateEnemy(delta);
    });
  }

  shoot(pointer) {
    if (pointer.worldX > this.playWidth) {
      return;
    }

    this.playFireSound();

    if (!this.state.consumeAmmo()) {
      this.cameras.main.shake(80, 0.002);
      this.events.emit("hud:update", this.state);
      return;
    }

    let didHit = false;
    this.enemies.children.each((enemy) => {
      if (!enemy.active || didHit) {
        return;
      }

      if (enemy.isHit(pointer.worldX, pointer.worldY)) {
        didHit = true;
        this.killEnemy(enemy);
      }
    });

    if (!didHit) {
      didHit = this.tryCollectMagazine(pointer.worldX, pointer.worldY);
    }
    if (!didHit) {
      didHit = this.tryCollectMedikit(pointer.worldX, pointer.worldY);
    }

    if (!didHit) {
      this.events.emit("hud:update", this.state);
    }
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

    this.events.emit("hud:update", this.state);
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
    this.state.addScore(enemy.points);
    this.trySpawnMagazineDrop(deathX, deathY);
    this.trySpawnMedikitDrop(deathX, deathY);

    if (emitHudUpdate) {
      this.events.emit("hud:update", this.state);
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
        this.events.emit("hud:update", this.state);
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
        this.events.emit("hud:update", this.state);
        this.showHealthPickupText(worldX, worldY);
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

  setGameOver() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.spawner.stop();
    this.input.setDefaultCursor("auto");
    this.events.emit("hud:gameover");
  }

  restart() {
    this.scene.stop("hud");
    this.scene.restart();
    this.scene.launch("hud");
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
    this.sound.play("m203-fire", {
      volume: 0.42
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

    const sound = this.sound.add("ak47-fire", {
      volume: 0.3
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
