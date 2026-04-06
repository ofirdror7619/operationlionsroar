import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";

export class StoreScene extends Phaser.Scene {
  constructor() {
    super("store");
  }

  create() {
    const { height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const centerX = playWidth * 0.5;

    this.add
      .image(centerX, height * 0.5, "store-bg")
      .setDisplaySize(playWidth, height)
      .setDepth(0);

    this.add.rectangle(centerX, height * 0.5, playWidth, height, 0x041017, 0.36).setDepth(1);

    this.add
      .text(centerX, 84, "STORE", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "72px",
        color: "#e4fbff",
        stroke: "#03161d",
        strokeThickness: 8,
        letterSpacing: 4
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(centerX, 140, "Loadout upgrades coming online...", {
        fontFamily: UI_BODY_FONT,
        fontSize: "28px",
        color: "#b7ecf4",
        stroke: "#03161d",
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.createBackButton(48, 48);

    this.input.keyboard.on("keydown-ESC", () => this.backToOperationCenter());
    this.input.keyboard.on("keydown-BACKSPACE", () => this.backToOperationCenter());
  }

  createBackButton(x, y) {
    const container = this.add.container(x, y).setDepth(5);
    const panel = this.add
      .rectangle(0, 0, 196, 56, 0x071f25, 0.84)
      .setOrigin(0)
      .setStrokeStyle(2, 0x79d8e8, 0.8);
    const arrow = this.add.triangle(18, 28, 20, 14, 20, 42, 4, 28, 0x9ee8f4, 1).setOrigin(0.5, 0.5);
    const label = this.add
      .text(38, 28, "EXIT", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "30px",
        color: "#dff8ff",
        stroke: "#062128",
        strokeThickness: 4
      })
      .setOrigin(0, 0.5);
    const hit = this.add
      .rectangle(0, 0, 196, 56, 0xffffff, 0.001)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    container.add([panel, arrow, label, hit]);

    hit.on("pointerover", () => {
      panel.setFillStyle(0x0f3138, 0.95);
      panel.setStrokeStyle(2, 0xb5f3ff, 1);
      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 120,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerout", () => {
      panel.setFillStyle(0x071f25, 0.84);
      panel.setStrokeStyle(2, 0x79d8e8, 0.8);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerup", () => this.backToOperationCenter());
  }

  backToOperationCenter() {
    this.scene.start("operation-center");
  }
}
