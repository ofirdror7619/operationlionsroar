import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("bg", "assets/images/game/background.png");
    this.load.image("health-bar", "assets/images/hud/health-bar.png");
    this.load.image("weapon-m203", "assets/images/hud/m-203-hud.png");
    this.load.image("weapon-mag", "assets/images/hud/MAG-hud.png");
    this.load.image("hud-icon-ammo", "assets/images/hud/icon-ammo-hud.png");
    this.load.image("hud-icon-health", "assets/images/hud/icon-health-hud.png");
    this.load.image("hud-icon-grenade", "assets/images/hud/icon-grenade-hud.png");
    this.load.spritesheet("weapon-m203-sheet-new", "assets/images/game/m-203-sprite-sheet-new.png", {
      frameWidth: 384,
      frameHeight: 256
    });
    this.load.spritesheet("weapon-m203-sheet", "assets/images/game/m-203-sprite-sheet-new.png", {
      frameWidth: 384,
      frameHeight: 256
    });
    this.load.spritesheet("weapon-m204-sheet", "assets/images/game/m-204-sprite-sheet.png", {
      frameWidth: 384,
      frameHeight: 256
    });
    this.load.image("mag-weapon-pickup", "assets/images/game/MAG-game.png");
    this.load.image("magazine", "assets/images/game/magazine.png");
    this.load.image("medikit", "assets/images/game/medikit.png");
    this.load.image("heart-pickup", "assets/images/game/heart.png");
    this.load.image("grenade-pickup", "assets/images/game/grenade.png");
    this.load.audio("bg-music", "assets/audio/music.mp3");
    this.load.audio("ak47-fire", "assets/audio/ak-47.mp3");
    this.load.audio("m203-empty", "assets/audio/empty-m-203.mp3");
    this.load.audio("m203-fire", "assets/audio/m-203.mp3");
    this.load.audio("m203-grenade", "assets/audio/m-203-grenade.mp3");
    this.load.audio("mag-fire", "assets/audio/MAG.mp3");
    this.load.image("enemy", "assets/images/game/enemy-1/enemy-1-sprite-sheet.png");
    this.load.image("enemy-grenade", "assets/images/game/enemy-2/enemy-2-sprite-sheet.png");
    this.createEffectsTextures();
    this.createUiTextures();
  }

  create() {
    this.createNormalizedEnemyFrameTextures();
    this.createNormalizedWeaponFrameTextures();
    this.createStableWeaponAnimTextures();
    this.scene.start("menu");
  }

  createNormalizedEnemyFrameTextures() {
    const normalizedWidth = 420;
    const normalizedHeight = 420;
    const bottomPadding = 8;
    const enemy1Bounds = {
      0: { x: 139, y: 20, width: 154, height: 328 },
      1: { x: 316, y: 22, width: 158, height: 326 },
      4: { x: 105, y: 402, width: 182, height: 380 },
      5: { x: 317, y: 402, width: 187, height: 380 },
      6: { x: 556, y: 401, width: 233, height: 380 },
      7: { x: 778, y: 401, width: 286, height: 379 },
      8: { x: 41, y: 852, width: 304, height: 133 },
      9: { x: 368, y: 853, width: 357, height: 140 },
      10: { x: 757, y: 852, width: 329, height: 147 },
      11: { x: 1140, y: 852, width: 346, height: 147 }
    };
    const enemy2Bounds = {
      0: { x: 100, y: 73, width: 180, height: 367 },
      1: { x: 324, y: 74, width: 178, height: 367 },
      2: { x: 622, y: 79, width: 201, height: 361 },
      3: { x: 859, y: 83, width: 198, height: 357 },
      4: { x: 1067, y: 88, width: 268, height: 352 },
      5: { x: 107, y: 527, width: 209, height: 330 },
      6: { x: 366, y: 514, width: 187, height: 343 },
      7: { x: 582, y: 525, width: 247, height: 333 },
      8: { x: 810, y: 528, width: 212, height: 329 },
      9: { x: 90, y: 912, width: 302, height: 88 },
      10: { x: 406, y: 907, width: 325, height: 93 },
      11: { x: 739, y: 915, width: 369, height: 84 }
    };
    const textureKeys = ["enemy", "enemy-grenade"];

    textureKeys.forEach((textureKey) => {
      const texture = this.textures.get(textureKey);
      const source = texture?.getSourceImage?.();
      if (!source) {
        return;
      }

      const frameBounds = source.width >= 1500 ? enemy1Bounds : enemy2Bounds;
      Object.entries(frameBounds).forEach(([frameKey, bounds]) => {
        const frame = Number(frameKey);
        const key = `${textureKey}-frame-${frame}`;
        if (this.textures.exists(key)) {
          return;
        }

        const canvasTexture = this.textures.createCanvas(key, normalizedWidth, normalizedHeight);
        const ctx = canvasTexture.getContext();
        ctx.clearRect(0, 0, normalizedWidth, normalizedHeight);
        const drawX = Math.floor((normalizedWidth - bounds.width) * 0.5);
        const drawY = normalizedHeight - bottomPadding - bounds.height;
        ctx.drawImage(
          source,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          drawX,
          drawY,
          bounds.width,
          bounds.height
        );
        canvasTexture.refresh();
      });
    });
  }

  createNormalizedWeaponFrameTextures() {
    const cols = 4;
    const textureKey = this.textures.exists("weapon-m203-sheet")
      ? "weapon-m203-sheet"
      : this.textures.exists("weapon-m203-sheet-new")
        ? "weapon-m203-sheet-new"
        : "weapon-m204-sheet";
    const texture = this.textures.get(textureKey);
    const source = texture?.getSourceImage?.();
    if (!source) {
      return;
    }
    const frameWidth = Math.floor(source.width / cols);
    const frameHeight = Math.floor(source.height / 4);
    const rows = Math.floor(source.height / frameHeight);
    const totalFrames = cols * rows;

    for (let frame = 0; frame < totalFrames; frame += 1) {
      const key = `weapon-m203-frame-${frame}`;
      if (this.textures.exists(key)) {
        continue;
      }

      const sx = (frame % cols) * frameWidth;
      const sy = Math.floor(frame / cols) * frameHeight;
      // Create standalone frame textures with identical dimensions to prevent sheet-bleed and jitter.
      const canvasTexture = this.textures.createCanvas(key, frameWidth, frameHeight);
      const ctx = canvasTexture.getContext();
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.drawImage(
        source,
        sx,
        sy,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );
      canvasTexture.refresh();
    }
  }

  createStableWeaponAnimTextures() {
    const cols = 4;
    const frameWidth = 384;
    const frameHeight = 256;
    const textureKey = this.textures.exists("weapon-m203-sheet")
      ? "weapon-m203-sheet"
      : this.textures.exists("weapon-m203-sheet-new")
        ? "weapon-m203-sheet-new"
        : "weapon-m204-sheet";
    const texture = this.textures.get(textureKey);
    const source = texture?.getSourceImage?.();
    if (!source) {
      return;
    }

    const stableFrames = [0, 4, 5, 12, 13];
    const measureOpaqueBounds = (sx, sy) => {
      const sample = this.textures.createCanvas(
        `weapon-stable-sample-${sx}-${sy}`,
        frameWidth,
        frameHeight
      );
      const sampleCtx = sample.getContext();
      sampleCtx.clearRect(0, 0, frameWidth, frameHeight);
      sampleCtx.drawImage(source, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
      const imageData = sampleCtx.getImageData(0, 0, frameWidth, frameHeight).data;
      this.textures.remove(sample.key);

      let minX = frameWidth;
      let minY = frameHeight;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < frameHeight; y += 1) {
        for (let x = 0; x < frameWidth; x += 1) {
          const alpha = imageData[(y * frameWidth + x) * 4 + 3];
          if (alpha <= 8) {
            continue;
          }
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      if (maxX < 0 || maxY < 0) {
        return null;
      }

      return {
        centerX: (minX + maxX) * 0.5,
        bottomY: maxY
      };
    };

    const idleSx = (0 % cols) * frameWidth;
    const idleSy = Math.floor(0 / cols) * frameHeight;
    const idleBounds = measureOpaqueBounds(idleSx, idleSy);
    if (!idleBounds) {
      return;
    }

    stableFrames.forEach((frame) => {
      const key = `weapon-stable-${frame}`;
      if (this.textures.exists(key)) {
        return;
      }

      const sx = (frame % cols) * frameWidth;
      const sy = Math.floor(frame / cols) * frameHeight;
      const frameBounds = measureOpaqueBounds(sx, sy);
      const offsetX = frameBounds ? Math.round(idleBounds.centerX - frameBounds.centerX) : 0;
      const offsetY = frameBounds ? Math.round(idleBounds.bottomY - frameBounds.bottomY) : 0;
      const canvasTexture = this.textures.createCanvas(key, frameWidth, frameHeight);
      const ctx = canvasTexture.getContext();
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.drawImage(
        source,
        sx,
        sy,
        frameWidth,
        frameHeight,
        offsetX,
        offsetY,
        frameWidth,
        frameHeight
      );
      canvasTexture.refresh();
    });
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
    this.createObjectivePanelTexture();
    this.createResourcePanelTextures();

    const scope = this.make.graphics({ x: 0, y: 0, add: false });
    const cx = 64;
    const cy = 64;

    // Subtle glow layers
    scope.lineStyle(7, 0x67d9ff, 0.08);
    scope.strokeCircle(cx, cy, 49);
    scope.lineStyle(4, 0x67d9ff, 0.15);
    scope.strokeCircle(cx, cy, 46);

    // Main ring and inner ring
    scope.lineStyle(2, 0xd8f3ff, 0.92);
    scope.strokeCircle(cx, cy, 44);
    scope.lineStyle(1, 0x95d9ff, 0.7);
    scope.strokeCircle(cx, cy, 30);

    // Segmented ring markers
    scope.lineStyle(2, 0xb4e9ff, 0.92);
    scope.lineBetween(cx, 8, cx, 19);
    scope.lineBetween(cx, 109, cx, 120);
    scope.lineBetween(8, cy, 19, cy);
    scope.lineBetween(109, cy, 120, cy);
    scope.lineStyle(1, 0xb4e9ff, 0.75);
    scope.lineBetween(cx - 28, 16, cx - 22, 22);
    scope.lineBetween(cx + 22, 22, cx + 28, 16);
    scope.lineBetween(cx - 28, 112, cx - 22, 106);
    scope.lineBetween(cx + 22, 106, cx + 28, 112);

    // Precision crosshair with center gap
    scope.lineStyle(1, 0xe8f8ff, 0.95);
    scope.lineBetween(cx, 22, cx, 56);
    scope.lineBetween(cx, 72, cx, 106);
    scope.lineBetween(22, cy, 56, cy);
    scope.lineBetween(72, cy, 106, cy);

    // Range aid marks and bottom chevron
    scope.lineStyle(1, 0x9fdefa, 0.82);
    scope.lineBetween(cx - 14, cy + 20, cx + 14, cy + 20);
    scope.lineBetween(cx - 9, cy + 26, cx + 9, cy + 26);
    scope.lineStyle(2, 0x8ee5d9, 0.9);
    scope.lineBetween(cx - 8, cy + 12, cx, cy + 18);
    scope.lineBetween(cx + 8, cy + 12, cx, cy + 18);

    // Center lock ring and hit point
    scope.lineStyle(1, 0xffffff, 0.9);
    scope.strokeCircle(cx, cy, 4);
    scope.fillStyle(0xff5d6e, 0.95);
    scope.fillCircle(cx, cy, 1.8);

    // Tiny side notches for style/readability
    scope.fillStyle(0xcff2ff, 0.85);
    scope.fillRect(cx - 1, 19, 2, 2);
    scope.fillRect(cx - 1, 107, 2, 2);
    scope.fillRect(19, cy - 1, 2, 2);
    scope.fillRect(107, cy - 1, 2, 2);
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

  createObjectivePanelTexture() {
    const width = 900;
    const height = 64;
    const bevel = 24;
    const edgeInset = 8;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const outerPoints = [
      new Phaser.Geom.Point(bevel, 0),
      new Phaser.Geom.Point(width - bevel, 0),
      new Phaser.Geom.Point(width, height * 0.32),
      new Phaser.Geom.Point(width - edgeInset, height),
      new Phaser.Geom.Point(edgeInset, height),
      new Phaser.Geom.Point(0, height * 0.32)
    ];
    const innerPoints = outerPoints.map((point) => new Phaser.Geom.Point(
      Phaser.Math.Clamp(point.x, edgeInset, width - edgeInset),
      Phaser.Math.Clamp(point.y, edgeInset, height - edgeInset)
    ));

    g.fillStyle(0x1bf0ff, 0.1);
    g.fillPoints(outerPoints, true);
    g.fillStyle(0x050d10, 0.9);
    g.fillPoints(innerPoints, true);

    g.lineStyle(3, 0x56fbff, 0.34);
    g.strokePoints(outerPoints, true, true);
    g.lineStyle(1, 0xa2f8ff, 0.64);
    g.strokePoints(innerPoints, true, true);

    g.lineStyle(1, 0x63d5de, 0.14);
    for (let y = 11; y < height - 10; y += 4) {
      g.lineBetween(bevel + 8, y, width - bevel - 8, y);
    }

    g.fillStyle(0xf7d36a, 0.18);
    g.fillCircle(width * 0.12, height * 0.5, 10);
    g.fillCircle(width * 0.88, height * 0.5, 10);

    g.fillStyle(0x9af6ff, 0.2);
    g.fillRect(30, 8, width - 60, 4);
    g.fillStyle(0x39dbe8, 0.12);
    g.fillRect(26, height - 12, width - 52, 3);

    g.generateTexture("hud-objective-panel", width, height);
    g.destroy();
  }

  createResourcePanelTextures() {
    this.createCounterPanelTexture("hud-counter-ammo-panel", 336, 72);
    this.createCounterPanelTexture("hud-counter-grenade-panel", 196, 72);
  }

  createCounterPanelTexture(key, width, height) {
    const bevel = 20;
    const edgeInset = 7;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const outerPoints = [
      new Phaser.Geom.Point(bevel, 0),
      new Phaser.Geom.Point(width - bevel, 0),
      new Phaser.Geom.Point(width, height * 0.35),
      new Phaser.Geom.Point(width - edgeInset, height),
      new Phaser.Geom.Point(edgeInset, height),
      new Phaser.Geom.Point(0, height * 0.35)
    ];
    const innerPoints = outerPoints.map((point) => new Phaser.Geom.Point(
      Phaser.Math.Clamp(point.x, edgeInset, width - edgeInset),
      Phaser.Math.Clamp(point.y, edgeInset, height - edgeInset)
    ));

    g.fillStyle(0x29f6ff, 0.09);
    g.fillPoints(outerPoints, true);
    g.fillStyle(0x050e12, 0.92);
    g.fillPoints(innerPoints, true);

    g.lineStyle(2, 0x56fbff, 0.42);
    g.strokePoints(outerPoints, true, true);
    g.lineStyle(1, 0xbefeff, 0.58);
    g.strokePoints(innerPoints, true, true);

    g.lineStyle(1, 0x5edeea, 0.12);
    for (let y = 12; y < height - 10; y += 4) {
      g.lineBetween(bevel + 6, y, width - bevel - 6, y);
    }

    g.fillStyle(0x9af6ff, 0.17);
    g.fillRect(24, 8, width - 48, 3);
    g.fillStyle(0x35d8e2, 0.11);
    g.fillRect(22, height - 12, width - 44, 3);

    g.generateTexture(key, width, height);
    g.destroy();
  }
}
