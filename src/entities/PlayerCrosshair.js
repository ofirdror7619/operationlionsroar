import Phaser from "phaser";

export class PlayerCrosshair extends Phaser.GameObjects.Image {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2, "scope");
    scene.add.existing(this);
    this.setDepth(100);

    const targetWidth = scene.scale.width * 0.18;
    const sourceWidth = this.width || 1;
    this.setScale(targetWidth / sourceWidth);
  }

  syncToPointer(pointer) {
    this.setPosition(pointer.worldX, pointer.worldY);
  }
}
