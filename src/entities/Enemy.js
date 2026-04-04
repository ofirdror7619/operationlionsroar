import Phaser from "phaser";

const ENEMY_STATE = {
  IDLE: "idle",
  AIMING: "aiming",
  FIRING: "firing",
  DEAD: "dead"
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, "enemy", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.idleFrame = options.idleFrame ?? 0;
    this.aimFrame = options.aimFrame ?? 1;
    this.fireFrame = options.fireFrame ?? this.aimFrame;
    this.deadFrame = options.deadFrame ?? 3;
    this.aimDurationMs = options.aimDurationMs ?? 3000;
    this.fireDurationMs = options.fireDurationMs ?? 350;
    this.idleDurationMs = options.idleDurationMs ?? 550;
    this.onPlayerHit = options.onPlayerHit ?? (() => {});
    this.points = options.points ?? 100;
    this.state = ENEMY_STATE.IDLE;
    this.stateElapsedMs = 0;
    this.flipX = options.flipX ?? false;
    this.baseLowerBodyHideRatio = Phaser.Math.Clamp(options.lowerBodyHideRatio ?? 0, 0, 0.75);
    this.bottomTrimRatio = Phaser.Math.Clamp(options.bottomTrimRatio ?? 0.1, 0, 0.2);
    this.lowerBodyHideRatio = Phaser.Math.Clamp(this.baseLowerBodyHideRatio + this.bottomTrimRatio, 0, 0.78);
    this.visibleBodyRatio = 1 - this.lowerBodyHideRatio;

    const targetHeight = options.targetHeight ?? scene.scale.height * 0.26;
    this.setScale(targetHeight / this.height);
    this.setFrame(this.idleFrame);
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
    this.setFrame(this.deadFrame);
    this.applyLowerBodyOcclusion();

    if (this.body) {
      this.body.enable = false;
    }

    this.scene.time.delayedCall(450, () => {
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
    this.setFrame(this.aimFrame);
    this.applyLowerBodyOcclusion();
  }

  enterFiringState() {
    this.state = ENEMY_STATE.FIRING;
    this.stateElapsedMs = 0;
    this.setFrame(this.fireFrame);
    this.applyLowerBodyOcclusion();
    this.onPlayerHit(this);
  }

  applyLowerBodyOcclusion() {
    if (this.lowerBodyHideRatio <= 0) {
      this.setCrop();
      return;
    }

    const frame = this.frame;
    const visibleHeight = Math.floor(frame.height * (1 - this.lowerBodyHideRatio));
    this.setCrop(0, 0, frame.width, visibleHeight);
  }
}
