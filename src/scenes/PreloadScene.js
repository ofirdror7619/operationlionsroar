import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("bg", "src/assets/images/background.png");
    this.load.image("health-bar", "src/assets/images/health-bar.png");
    this.load.image("weapon-m203", "src/assets/images/m-203.png");
    this.load.image("magazine", "src/assets/images/magazine.png");
    this.load.image("medikit", "src/assets/images/medikit.png");
    this.load.audio("bg-music", "src/assets/audio/music.mp3");
    this.load.audio("ak47-fire", "src/assets/audio/ak-47.mp3");
    this.load.audio("m203-fire", "src/assets/audio/m-203.mp3");
    this.load.audio("m203-grenade", "src/assets/audio/m-203-grenade.mp3");
    this.load.spritesheet("enemy", "src/assets/images/enemy.png", {
      frameWidth: 384,
      frameHeight: 1024
    });
    this.createEffectsTextures();
    this.createUiTextures();
  }

  create() {
    this.scene.start("menu");
  }

  createEffectsTextures() {
    const flash = this.make.graphics({ x: 0, y: 0, add: false });
    flash.fillStyle(0xfff7b0, 1);
    flash.fillCircle(32, 32, 14);
    flash.fillStyle(0xffc83d, 1);
    flash.fillCircle(32, 32, 9);
    flash.generateTexture("muzzle-flash", 64, 64);
    flash.destroy();

    const blast = this.make.graphics({ x: 0, y: 0, add: false });
    blast.fillStyle(0xffcf68, 0.95);
    blast.fillCircle(80, 80, 66);
    blast.fillStyle(0xff8f2f, 0.85);
    blast.fillCircle(80, 80, 44);
    blast.fillStyle(0xfff4c6, 0.75);
    blast.fillCircle(80, 80, 24);
    blast.generateTexture("grenade-blast", 160, 160);
    blast.destroy();
  }

  createUiTextures() {
    const scope = this.make.graphics({ x: 0, y: 0, add: false });
    scope.lineStyle(2, 0xffffff, 0.92);
    scope.strokeCircle(64, 64, 44);
    scope.lineStyle(1, 0xffffff, 0.55);
    scope.strokeCircle(64, 64, 30);
    scope.lineBetween(64, 4, 64, 44);
    scope.lineBetween(64, 84, 64, 124);
    scope.lineBetween(4, 64, 44, 64);
    scope.lineBetween(84, 64, 124, 64);
    scope.fillStyle(0xff3e3e, 0.9);
    scope.fillCircle(64, 64, 2);
    scope.generateTexture("scope", 128, 128);
    scope.destroy();

    const healthIcon = this.make.graphics({ x: 0, y: 0, add: false });
    healthIcon.fillStyle(0xeb4a4a, 1);
    healthIcon.fillCircle(13, 11, 8);
    healthIcon.fillCircle(27, 11, 8);
    healthIcon.fillTriangle(6, 15, 34, 15, 20, 34);
    healthIcon.generateTexture("icon-health", 40, 40);
    healthIcon.destroy();

    const scoreIcon = this.make.graphics({ x: 0, y: 0, add: false });
    scoreIcon.fillStyle(0x1f2a3b, 0.65);
    scoreIcon.fillCircle(21, 22, 15);
    scoreIcon.fillStyle(0xf6c443, 1);
    scoreIcon.fillCircle(20, 20, 14);
    scoreIcon.fillStyle(0xd69a22, 1);
    scoreIcon.fillCircle(20, 20, 11);
    scoreIcon.fillStyle(0x362302, 0.45);
    scoreIcon.fillCircle(20, 20, 8);
    scoreIcon.fillStyle(0xffefb4, 0.9);
    scoreIcon.fillCircle(16, 15, 4);
    scoreIcon.fillStyle(0xffe07c, 1);
    scoreIcon.fillTriangle(20, 9, 23, 16, 30, 16);
    scoreIcon.fillTriangle(20, 9, 14, 16, 17, 23);
    scoreIcon.fillTriangle(20, 9, 23, 16, 27, 23);
    scoreIcon.fillTriangle(20, 9, 10, 16, 14, 16);
    scoreIcon.fillTriangle(20, 9, 17, 23, 20, 19);
    scoreIcon.fillStyle(0x2b6cb0, 0.95);
    scoreIcon.fillRoundedRect(8, 29, 10, 8, 2);
    scoreIcon.fillStyle(0xcd2f45, 0.95);
    scoreIcon.fillRoundedRect(22, 29, 10, 8, 2);
    scoreIcon.generateTexture("icon-score", 40, 40);
    scoreIcon.destroy();

    const ammoIcon = this.make.graphics({ x: 0, y: 0, add: false });
    ammoIcon.fillStyle(0x111c2d, 0.45);
    ammoIcon.fillRoundedRect(9, 11, 23, 20, 5);
    ammoIcon.fillStyle(0xbec9d7, 0.95);
    ammoIcon.fillRoundedRect(10, 22, 20, 10, 4);
    ammoIcon.fillStyle(0x8f9fb2, 0.95);
    ammoIcon.fillRect(10, 26, 20, 2);
    ammoIcon.fillStyle(0xf4d7a2, 1);
    ammoIcon.fillRoundedRect(11, 6, 6, 18, 3);
    ammoIcon.fillRoundedRect(17, 4, 6, 20, 3);
    ammoIcon.fillRoundedRect(23, 6, 6, 18, 3);
    ammoIcon.fillStyle(0x9e6f31, 1);
    ammoIcon.fillRect(11, 17, 6, 3);
    ammoIcon.fillRect(17, 17, 6, 3);
    ammoIcon.fillRect(23, 17, 6, 3);
    ammoIcon.fillStyle(0xfff4da, 0.85);
    ammoIcon.fillRoundedRect(12, 8, 4, 4, 2);
    ammoIcon.fillRoundedRect(18, 6, 4, 4, 2);
    ammoIcon.fillRoundedRect(24, 8, 4, 4, 2);
    ammoIcon.generateTexture("icon-ammo", 40, 40);
    ammoIcon.destroy();

    const grenadeIcon = this.make.graphics({ x: 0, y: 0, add: false });
    grenadeIcon.fillStyle(0x6e7b86, 1);
    grenadeIcon.fillCircle(20, 22, 11);
    grenadeIcon.fillStyle(0x9aa8b5, 1);
    grenadeIcon.fillRect(18, 8, 4, 7);
    grenadeIcon.fillStyle(0xd9b24f, 1);
    grenadeIcon.fillRect(16, 4, 8, 4);
    grenadeIcon.generateTexture("icon-grenade", 40, 40);
    grenadeIcon.destroy();
  }
}
