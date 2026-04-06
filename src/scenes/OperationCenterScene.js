import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";
import { UI_COLORS } from "../game/uiTokens";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";

export class OperationCenterScene extends Phaser.Scene {
  constructor() {
    super("operation-center");
    this.startButton = null;
    this.storeButton = null;
    this.hasStarted = false;
    this.warningText = null;
  }

  create() {
    const { height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const centerX = playWidth * 0.5;
    this.hasStarted = false;
    const currentMissionId = this.getCurrentMissionId();
    const playerBudget = this.getPlayerBudget();
    const missionText = this.getMissionBriefing(currentMissionId);

    this.add
      .image(centerX, height * 0.5, "operation-center-bg")
      .setDisplaySize(playWidth, height)
      .setDepth(0);

    // Global cinematic darkening.
    this.add.rectangle(centerX, height * 0.5, playWidth, height, UI_COLORS.missionOverlay, 0.34).setDepth(1);

    // Mission board area.
    const boardWidth = Math.min(playWidth * 0.56, 560);
    const boardHeight = 196;
    const boardCenterY = height * 0.49;
    const boardLeft = centerX - boardWidth * 0.5;
    const boardTop = boardCenterY - boardHeight * 0.5;
    this.add.rectangle(centerX, boardCenterY, boardWidth, boardHeight, 0x081217, 0.62).setDepth(2);
    this.add.rectangle(centerX, boardCenterY, boardWidth - 8, boardHeight - 8, 0x0b1f28, 0.84).setDepth(2);
    this.add.rectangle(centerX, boardCenterY, boardWidth - 18, boardHeight - 18, 0x06131a, 0.78).setDepth(2);
    this.add.rectangle(centerX, boardCenterY, boardWidth, boardHeight, UI_COLORS.missionPanelGlow, 0)
      .setDepth(3)
      .setStrokeStyle(2, 0x6dcde7, 0.5);
    this.add.rectangle(centerX, boardCenterY, boardWidth - 18, boardHeight - 18, UI_COLORS.missionPanelGlow, 0)
      .setDepth(3)
      .setStrokeStyle(1, 0x2c768b, 0.5);

    const boardLines = this.add.graphics().setDepth(3);
    boardLines.lineStyle(1, 0x83e0f8, 0.11);
    for (let y = boardTop + 20; y <= boardTop + boardHeight - 20; y += 6) {
      boardLines.lineBetween(boardLeft + 16, y, boardLeft + boardWidth - 16, y);
    }

    const bracket = this.add.graphics().setDepth(4);
    bracket.lineStyle(2, 0x9eeeff, 0.72);
    const bracketLen = 20;
    const inset = 12;
    const left = boardLeft + inset;
    const right = boardLeft + boardWidth - inset;
    const top = boardTop + inset;
    const bottom = boardTop + boardHeight - inset;
    bracket.lineBetween(left, top, left + bracketLen, top);
    bracket.lineBetween(left, top, left, top + bracketLen);
    bracket.lineBetween(right, top, right - bracketLen, top);
    bracket.lineBetween(right, top, right, top + bracketLen);
    bracket.lineBetween(left, bottom, left + bracketLen, bottom);
    bracket.lineBetween(left, bottom, left, bottom - bracketLen);
    bracket.lineBetween(right, bottom, right - bracketLen, bottom);
    bracket.lineBetween(right, bottom, right, bottom - bracketLen);

    const missionHeading = this.add
      .text(centerX, boardCenterY - (boardHeight * 0.5) + 18, `MISSION ${currentMissionId} BRIEFING`, {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "30px",
        color: "#dbf8ff",
        stroke: "#04181f",
        strokeThickness: 4,
        letterSpacing: 3
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.add
      .rectangle(centerX, missionHeading.y + missionHeading.height + 6, boardWidth - 72, 2, 0x7fdef6, 0.52)
      .setDepth(4);

    const missionCopy = this.add
      .text(centerX, missionHeading.y + missionHeading.height + 14, missionText, {
        fontFamily: UI_BODY_FONT,
        fontSize: "34px",
        color: UI_COLORS.body,
        stroke: UI_COLORS.textStroke,
        strokeThickness: 3,
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: boardWidth - 64, useAdvancedWrap: true }
      })
      .setOrigin(0.5, 0)
      .setDepth(4);

    // Shrink text until it fits the mission board comfortably.
    const maxTextHeight = boardHeight - 94;
    while (missionCopy.height > maxTextHeight && parseInt(missionCopy.style.fontSize, 10) > 18) {
      const nextSize = parseInt(missionCopy.style.fontSize, 10) - 1;
      missionCopy.setFontSize(nextSize);
      missionCopy.setLineSpacing(Math.max(1, Math.floor(nextSize * 0.16)));
    }

    this.add
      .image(playWidth - 160, 52, "hud-counter-ammo-panel")
      .setDisplaySize(268, 66)
      .setAlpha(0.94)
      .setDepth(5);
    this.add
      .text(playWidth - 230, 40, "BUDGET", {
        fontFamily: UI_BODY_FONT,
        fontSize: "16px",
        color: "#9ddde5",
        stroke: "#04151b",
        strokeThickness: 2,
        letterSpacing: 1
      })
      .setOrigin(0, 0.5)
      .setDepth(6);
    this.add
      .text(playWidth - 230, 64, `$${playerBudget}`, {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "30px",
        color: "#eaffff",
        stroke: "#04151b",
        strokeThickness: 4,
        letterSpacing: 1
      })
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.warningText = this.add
      .text(centerX, height - 126, "", {
        fontFamily: UI_BODY_FONT,
        fontSize: "24px",
        color: "#ffcf93",
        stroke: "#2b1402",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setAlpha(0);

    const operationCenterNotice = this.registry.get("operationCenterNotice");
    if (typeof operationCenterNotice === "string" && operationCenterNotice.length > 0) {
      this.showWarning(operationCenterNotice, "#b2ffd9", "#04291a");
      this.registry.remove("operationCenterNotice");
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
        fillHover: 0x4d3810,
        edge: 0xd8bc77,
        edgeOuter: 0x896927,
        glow: 0xf1c967,
        text: "#fff0c3",
        textStroke: "#2b1a05"
      }
      : {
        fill: 0x0a2528,
        fillHover: 0x12353a,
        edge: UI_COLORS.buttonStroke,
        edgeOuter: UI_COLORS.frameInner,
        glow: UI_COLORS.glow,
        text: UI_COLORS.textMain,
        textStroke: UI_COLORS.textStroke
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
    const nodeColor = tone === "gold" ? 0xf1c967 : 0x8cebe1;
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
    const topEdge = this.add.rectangle(0, -height * 0.5 + 8, width - 18, 2, 0xc6f7f1, 0.45);
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

    if (!this.hasAnyPrimaryWeapon()) {
      this.showWarning("YOU HAVE NO WEAPON EQUIPPED");
      return;
    }

    this.hasStarted = true;
    this.scene.start("game", { levelId: this.getCurrentMissionId() });
  }

  hasAnyPrimaryWeapon() {
    return Boolean(this.registry.get("hasM203") || this.registry.get("hasMag58") || this.registry.get("hasTar21"));
  }

  getCurrentMissionId() {
    const missionFromRegistry = this.registry.get("currentMissionId");
    if (typeof missionFromRegistry !== "number" || !Number.isFinite(missionFromRegistry)) {
      return 1;
    }

    return Phaser.Math.Clamp(Math.floor(missionFromRegistry), 1, 3);
  }

  getPlayerBudget() {
    const budgetFromRegistry = this.registry.get("playerBudget");
    if (typeof budgetFromRegistry !== "number" || !Number.isFinite(budgetFromRegistry)) {
      return 0;
    }

    return Math.max(0, Math.floor(budgetFromRegistry));
  }

  getMissionBriefing(levelId) {
    if (levelId === 2) {
      return (
        "Primary: Eliminate 40 hostiles.\n" +
        "Threat: Fast wave rotations and grenadiers.\n" +
        "Directive: Keep pressure up and chain kills."
      );
    }

    if (levelId >= 3) {
      return (
        "Primary: Survive for 150 seconds.\n" +
        "Threat: High-tempo enemy fire and grenades.\n" +
        "Directive: Stay mobile and protect your health."
      );
    }

    return (
      "Primary: Survive for 110 seconds.\n" +
      "Threat: Hostile infantry and grenade units.\n" +
      "Directive: Maintain ammo discipline and eliminate priority targets first."
    );
  }

  showWarning(message, color = "#ffcf93", stroke = "#2b1402") {
    if (!this.warningText?.active) {
      return;
    }

    this.tweens.killTweensOf(this.warningText);
    this.warningText.setText(message);
    this.warningText.setColor(color);
    this.warningText.setStroke(stroke, 3);
    this.warningText.setAlpha(1);
    this.warningText.setY(this.scale.height - 126);

    this.tweens.add({
      targets: this.warningText,
      alpha: 0,
      y: this.warningText.y - 12,
      duration: 1200,
      ease: "Sine.Out",
      onComplete: () => {
        if (this.warningText?.active) {
          this.warningText.setY(this.scale.height - 126);
        }
      }
    });
  }
}
