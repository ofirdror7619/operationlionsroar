import Phaser from "phaser";

const ENEMY_STATE = {
  IDLE: "idle",
  AIMING: "aiming",
  FIRING: "firing",
  DEAD: "dead"
};

const FRAME_CENTER_X_OFFSETS = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    const textureKey = options.textureKey ?? "enemy";
    const resolvedTextureKey = scene.textures.exists(textureKey) ? textureKey : "__MISSING";
    super(scene, x, y, resolvedTextureKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.enemyTypeKey = textureKey;

    const isEnemy2Layout = textureKey === "enemy-grenade";
    this.idleFrames = options.idleFrames ?? (isEnemy2Layout ? [0, 1] : [4]);
    this.aimFrames = options.aimFrames ?? (isEnemy2Layout ? [2, 3, 4] : [4, 5]);
    this.fireFrames = options.fireFrames ?? (isEnemy2Layout ? [5, 6, 7, 8] : [5]);
    this.deadFrames = options.deadFrames ?? (isEnemy2Layout ? [9, 10] : [8, 9]);
    if (typeof options.idleFrame === "number") {
      this.idleFrames = [options.idleFrame];
    }
    if (typeof options.aimFrame === "number") {
      this.aimFrames = [options.aimFrame];
    }
    if (typeof options.fireFrame === "number") {
      this.fireFrames = [options.fireFrame];
    }
    if (typeof options.deadFrame === "number") {
      this.deadFrames = [options.deadFrame];
    }
    this.aimDurationMs = options.aimDurationMs ?? 3000;
    this.fireDurationMs = options.fireDurationMs ?? 170;
    this.idleDurationMs = options.idleDurationMs ?? 550;
    this.onPlayerHit = options.onPlayerHit ?? (() => {});
    this.points = options.points ?? 100;
    this.state = ENEMY_STATE.IDLE;
    this.stateElapsedMs = 0;
    this.anchorX = Math.round(x);
    this.flipX = options.flipX ?? false;
    this.baseLowerBodyHideRatio = Phaser.Math.Clamp(options.lowerBodyHideRatio ?? 0, 0, 0.75);
    this.bottomTrimRatio = Phaser.Math.Clamp(options.bottomTrimRatio ?? 0.1, 0, 0.2);
    this.lowerBodyHideRatio = Phaser.Math.Clamp(this.baseLowerBodyHideRatio + this.bottomTrimRatio, 0, 0.78);
    this.visibleBodyRatio = 1 - this.lowerBodyHideRatio;
    this.enableLowerBodyOcclusion = options.enableLowerBodyOcclusion ?? false;
    this.animKeys = this.ensureAnimations(resolvedTextureKey);

    const targetHeight = options.targetHeight ?? scene.scale.height * 0.26;
    const visualScaleMultiplier = options.visualScaleMultiplier ?? 0.62;
    const referenceFrameKey = `${textureKey}-frame-${this.idleFrames[0] ?? 0}`;
    const referenceFrameTexture = scene.textures.exists(referenceFrameKey)
      ? scene.textures.get(referenceFrameKey).getSourceImage()
      : null;
    const referenceHeight = referenceFrameTexture?.height ?? this.height;
    this.setScale((targetHeight * visualScaleMultiplier) / referenceHeight);
    this.play(this.animKeys.idle);
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.alignToCurrentFrame, this);
    this.y = Math.round(this.y);
    this.alignToCurrentFrame();
    this.applyLowerBodyOcclusion();
    this.setVelocity(0, 0);
    this.setImmovable(true);
    this.setDepth(Math.floor(y));
  }

  updateEnemy(delta) {
    if (!this.active || this.state === ENEMY_STATE.DEAD) {
      return;
    }

    this.stateElapsedMs += delta;

    if (this.state === ENEMY_STATE.IDLE && this.stateElapsedMs >= this.idleDurationMs) {
      this.enterAimingState();
      return;
    }

    if (this.state === ENEMY_STATE.AIMING && this.stateElapsedMs >= this.aimDurationMs) {
      this.enterFiringState();
      return;
    }

    if (this.state === ENEMY_STATE.FIRING && this.stateElapsedMs >= this.fireDurationMs) {
      this.enterAimingState();
    }
  }

  kill() {
    if (!this.active || this.state === ENEMY_STATE.DEAD) {
      return;
    }

    this.state = ENEMY_STATE.DEAD;
    this.setVelocity(0, 0);
    this.play(this.animKeys.dead);
    this.alignToCurrentFrame();
    this.applyLowerBodyOcclusion();

    if (this.body) {
      this.body.enable = false;
    }

    this.scene.time.delayedCall(700, () => {
      if (this.active) {
        this.destroy();
      }
    });
  }

  isHit(worldX, worldY) {
    if (this.state === ENEMY_STATE.DEAD) {
      return false;
    }

    // Use the currently visible upper-body region so occluded enemies still feel fair to hit.
    const visibleHeight = this.displayHeight * this.visibleBodyRatio;
    const hitWidth = this.displayWidth * 0.4;
    const hitHeight = visibleHeight * 0.88;
    const topY = this.y - this.displayHeight * this.originY;
    const hitTop = topY + visibleHeight * 0.06;
    const hitbox = new Phaser.Geom.Rectangle(
      this.x - hitWidth / 2,
      hitTop,
      hitWidth,
      hitHeight
    );

    return Phaser.Geom.Rectangle.Contains(hitbox, worldX, worldY);
  }

  enterAimingState() {
    this.state = ENEMY_STATE.AIMING;
    this.stateElapsedMs = 0;
    this.setVelocity(0, 0);
    this.play(this.animKeys.aim);
    this.alignToCurrentFrame();
    this.applyLowerBodyOcclusion();
  }

  enterFiringState() {
    this.state = ENEMY_STATE.FIRING;
    this.stateElapsedMs = 0;
    this.play(this.animKeys.fire);
    this.alignToCurrentFrame();
    this.applyLowerBodyOcclusion();
    this.onPlayerHit(this);
  }

  forceIdle() {
    if (!this.active || this.state === ENEMY_STATE.DEAD) {
      return;
    }

    this.state = ENEMY_STATE.IDLE;
    this.stateElapsedMs = 0;
    this.setVelocity(0, 0);
    this.play(this.animKeys.idle);
    this.alignToCurrentFrame();
    this.applyLowerBodyOcclusion();
  }

  applyLowerBodyOcclusion() {
    if (!this.enableLowerBodyOcclusion) {
      this.lowerBodyHideRatio = 0;
      this.visibleBodyRatio = 1;
      this.setCrop();
      return;
    }

    if (this.lowerBodyHideRatio <= 0) {
      this.setCrop();
      return;
    }

    const frame = this.frame;
    const visibleHeight = Math.floor(frame.height * (1 - this.lowerBodyHideRatio));
    this.setCrop(0, 0, frame.width, visibleHeight);
  }

  alignToCurrentFrame() {
    const textureKey = this.texture?.key ?? "";
    const extractedMatch = textureKey.match(/-frame-(\d+)$/);
    const frameIndex = extractedMatch
      ? Number(extractedMatch[1])
      : Number(this.frame?.name ?? this.frame?.index ?? -1);
    const baseOffset = FRAME_CENTER_X_OFFSETS[frameIndex] ?? 0;
    const adjustedOffset = this.flipX ? -baseOffset : baseOffset;
    this.x = Math.round(this.anchorX - adjustedOffset);
    this.y = Math.round(this.y);
  }

  ensureAnimations(textureKey) {
    const idleKey = `${textureKey}-idle`;
    const aimKey = `${textureKey}-aim`;
    const fireKey = `${textureKey}-fire`;
    const deadKey = `${textureKey}-dead`;

    const mapFrames = (frames) =>
      frames.map((frame) => {
        const extractedKey = `${this.enemyTypeKey}-frame-${frame}`;
        if (this.scene.textures.exists(extractedKey)) {
          return { key: extractedKey };
        }

        return { key: textureKey, frame };
      });

    if (!this.scene.anims.exists(idleKey)) {
      this.scene.anims.create({
        key: idleKey,
        frames: mapFrames(this.idleFrames),
        frameRate: 3,
        repeat: -1,
        yoyo: this.idleFrames.length > 1
      });
    }

    if (!this.scene.anims.exists(aimKey)) {
      this.scene.anims.create({
        key: aimKey,
        frames: mapFrames(this.aimFrames),
        frameRate: 4,
        repeat: -1,
        yoyo: this.aimFrames.length > 1
      });
    }

    if (!this.scene.anims.exists(fireKey)) {
      this.scene.anims.create({
        key: fireKey,
        frames: mapFrames(this.fireFrames),
        frameRate: 12,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists(deadKey)) {
      this.scene.anims.create({
        key: deadKey,
        frames: mapFrames(this.deadFrames),
        frameRate: 9,
        repeat: 0
      });
    }

    return {
      idle: idleKey,
      aim: aimKey,
      fire: fireKey,
      dead: deadKey
    };
  }
}
