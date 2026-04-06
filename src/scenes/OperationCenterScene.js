import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";

export class OperationCenterScene extends Phaser.Scene {
  constructor() {
    super("operation-center");
    this.startButton = null;
    this.storeButton = null;
    this.hasStarted = false;
  }

  create() {
    const { width, height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const centerX = playWidth * 0.5;

    this.add
      .image(centerX, height * 0.5, "operation-center-bg")
      .setDisplaySize(playWidth, height)
      .setDepth(0);

    // Global cinematic darkening.
    this.add.rectangle(centerX, height * 0.5, playWidth, height, 0x021015, 0.34).setDepth(1);

    // Mission board area.
    const boardWidth = Math.min(playWidth * 0.5, 500);
    const boardHeight = 156;
    const boardCenterY = height * 0.49;
    this.add.rectangle(centerX, boardCenterY, boardWidth, boardHeight, 0x03151b, 0.42).setDepth(2);
    this.add.rectangle(centerX, boardCenterY, boardWidth, boardHeight, 0x7bf8ea, 0.04).setDepth(2);
    this.add.rectangle(centerX, boardCenterY, boardWidth - 14, boardHeight - 14, 0x59f6e5, 0)
      .setDepth(3)
      .setStrokeStyle(2, 0x6bf3e6, 0.52);
    this.add.rectangle(centerX, boardCenterY, boardWidth - 34, boardHeight - 38, 0x59f6e5, 0)
      .setDepth(3)
      .setStrokeStyle(1, 0x7af9ef, 0.26);

    const missionText =
      "Primary: Survive for 110 seconds.\n" +
      "Threat: Hostile infantry and grenade units.\n" +
      "Directive: Maintain ammo discipline and eliminate priority targets first.";

    const missionCopy = this.add
      .text(centerX, boardCenterY - (boardHeight * 0.5) + 24, missionText, {
        fontFamily: UI_BODY_FONT,
        fontSize: "34px",
        color: "#c9fff8",
        stroke: "#041216",
        strokeThickness: 3,
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: boardWidth - 56, useAdvancedWrap: true }
      })
      .setOrigin(0.5, 0)
      .setDepth(4);

    // Shrink text until it fits the mission board comfortably.
    const maxTextHeight = boardHeight - 30;
    while (missionCopy.height > maxTextHeight && parseInt(missionCopy.style.fontSize, 10) > 18) {
      const nextSize = parseInt(missionCopy.style.fontSize, 10) - 1;
      missionCopy.setFontSize(nextSize);
      missionCopy.setLineSpacing(Math.max(1, Math.floor(nextSize * 0.16)));
    }

    this.startButton = this.createActionButton(centerX - 144, height - 72, 268, 70, "START", "teal");
    this.storeButton = this.createActionButton(centerX + 144, height - 72, 232, 70, "STORE", "gold");

    this.startButton.hit.on("pointerup", () => this.startMission());
    this.storeButton.hit.on("pointerup", () => this.openStore());

    this.input.keyboard.on("keydown-ENTER", () => this.startMission());
    this.input.keyboard.on("keydown-SPACE", () => this.startMission());
  }

  createActionButton(x, y, width, height, label, tone) {
    const palette = tone === "gold"
      ? {
        fill: 0x3b2b0a,
        fillHover: 0x5d4412,
        edge: 0xf6d582,
        edgeOuter: 0xa57f2a,
        glow: 0xffd46c,
        text: "#fff0c3",
        textStroke: "#2b1a05"
      }
      : {
        fill: 0x08282a,
        fillHover: 0x0e4141,
        edge: 0x8affef,
        edgeOuter: 0x2f9d95,
        glow: 0x7effef,
        text: "#a8fff0",
        textStroke: "#052120"
      };

    const makePanelPoints = (panelWidth, panelHeight, bevel = 20, edgeInset = 8) => {
      const halfW = panelWidth * 0.5;
      const halfH = panelHeight * 0.5;
      const left = -halfW;
      const right = halfW;
      const top = -halfH;
      const bottom = halfH;
      const shoulderY = top + panelHeight * 0.34;
      return [
        left + bevel, top,
        right - bevel, top,
        right, shoulderY,
        right - edgeInset, bottom,
        left + edgeInset, bottom,
        left, shoulderY
      ];
    };
    const toPointObjects = (points) => {
      const result = [];
      for (let i = 0; i < points.length; i += 2) {
        result.push(new Phaser.Geom.Point(points[i], points[i + 1]));
      }
      return result;
    };

    const container = this.add.container(x, y).setDepth(6);
    const glowPoints = makePanelPoints(width + 24, height + 20, 24, 10);
    const outerPoints = makePanelPoints(width, height, 18, 8);
    const innerPoints = makePanelPoints(width - 10, height - 10, 15, 7);
    const corePoints = makePanelPoints(width - 24, height - 24, 12, 6);
    const glowPointObjects = toPointObjects(glowPoints);
    const outerPointObjects = toPointObjects(outerPoints);
    const innerPointObjects = toPointObjects(innerPoints);
    const corePointObjects = toPointObjects(corePoints);

    const glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    glow.fillStyle(palette.glow, 0.07);
    glow.fillPoints(glowPointObjects, true);

    const shell = this.add.graphics();
    const redrawShell = (fillColor, fillAlpha) => {
      shell.clear();
      shell.fillStyle(fillColor, fillAlpha);
      shell.fillPoints(outerPointObjects, true);
      shell.lineStyle(2, palette.edgeOuter, 0.9);
      shell.strokePoints(outerPointObjects, true, true);
      shell.lineStyle(2, palette.edge, 0.9);
      shell.strokePoints(innerPointObjects, true, true);
      shell.fillStyle(0xffffff, 0.035);
      shell.fillPoints(corePointObjects, true);
    };
    redrawShell(palette.fill, 0.94);
    const nodeColor = tone === "gold" ? 0xf7d36a : 0x9af6ff;
    const sideNodeOffsetX = width * 0.5 - 10;
    const sideNodeY = 2;
    const leftNodeGlow = this.add.circle(-sideNodeOffsetX, sideNodeY, 8, nodeColor, 0.15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const rightNodeGlow = this.add.circle(sideNodeOffsetX, sideNodeY, 8, nodeColor, 0.15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const leftNode = this.add.circle(-sideNodeOffsetX, sideNodeY, 4, nodeColor, 0.52);
    const rightNode = this.add.circle(sideNodeOffsetX, sideNodeY, 4, nodeColor, 0.52);
    const notch = this.add.graphics();
    const notchLeft = -width * 0.5 + 16;
    const notchRight = width * 0.5 - 16;
    const notchTop = -height * 0.5 + 7;
    const notchBottom = height * 0.5 - 7;
    notch.lineStyle(1, palette.edge, 0.64);
    notch.lineBetween(notchLeft, notchTop + 10, notchLeft + 16, notchTop + 10);
    notch.lineBetween(notchLeft, notchTop + 10, notchLeft, notchTop + 20);
    notch.lineBetween(notchRight - 16, notchTop + 10, notchRight, notchTop + 10);
    notch.lineBetween(notchRight, notchTop + 10, notchRight, notchTop + 20);
    notch.lineStyle(1, palette.edgeOuter, 0.44);
    notch.lineBetween(notchLeft + 2, notchBottom - 8, notchLeft + 12, notchBottom - 8);
    notch.lineBetween(notchRight - 12, notchBottom - 8, notchRight - 2, notchBottom - 8);
    const topEdge = this.add.rectangle(0, -height * 0.5 + 8, width - 18, 2, 0xd8fff7, 0.5);
    const scanline = this.add
      .rectangle(-width * 0.34, 0, Math.max(46, Math.floor(width * 0.18)), height - 18, palette.glow, 0.11)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAngle(-9);
    const text = this.add.text(0, 0, label, {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: width > 240 ? "36px" : "32px",
      color: palette.text,
      stroke: palette.textStroke,
      strokeThickness: 4,
      letterSpacing: 1
    }).setOrigin(0.5, 0.5);
    const maxLabelWidth = width * 0.62;
    const maxLabelHeight = height * 0.5;
    while (
      (text.width > maxLabelWidth || text.height > maxLabelHeight) &&
      parseInt(text.style.fontSize, 10) > 18
    ) {
      const nextSize = parseInt(text.style.fontSize, 10) - 1;
      text.setFontSize(nextSize);
    }
    const hit = this.add
      .zone(0, 0, width + 28, height + 20)
      .setInteractive({ useHandCursor: true });
    hit.input.cursor = "pointer";

    container.add([
      glow,
      shell,
      leftNodeGlow,
      rightNodeGlow,
      leftNode,
      rightNode,
      notch,
      topEdge,
      scanline,
      text,
      hit
    ]);

    hit.on("pointerover", () => {
      redrawShell(palette.fillHover, 1);
      this.tweens.add({
        targets: container,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120,
        ease: "Quad.Out"
      });
      this.tweens.add({
        targets: [glow, scanline, leftNodeGlow, rightNodeGlow, leftNode, rightNode, notch],
        alpha: 0.2,
        duration: 120,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerout", () => {
      redrawShell(palette.fill, 0.94);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: "Quad.Out"
      });
      this.tweens.add({
        targets: [glow, scanline, leftNodeGlow, rightNodeGlow, leftNode, rightNode, notch],
        alpha: 0.09,
        duration: 150,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerdown", () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.98,
        scaleY: 0.98,
        duration: 80,
        ease: "Quad.Out"
      });
    });

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.08, to: 0.16 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    this.tweens.add({
      targets: scanline,
      x: { from: -width * 0.34, to: width * 0.34 },
      alpha: { from: 0.08, to: 0.2 },
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    return { container, hit, glow, shell, text };
  }

  openStore() {
    this.scene.start("store");
  }

  startMission() {
    if (this.hasStarted) {
      return;
    }

    this.hasStarted = true;
    this.scene.start("game", { levelId: 1 });
  }
}
