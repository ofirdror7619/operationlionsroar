import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";
import { MAX_MISSION_ID, MISSION_REWARD_BY_LEVEL } from "../game/progressionConfig";
import { UI_MOTION } from "../game/uiTokens";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";

export class AfterActionScene extends Phaser.Scene {
  constructor() {
    super("after-action");
    this.levelId = 1;
    this.killCount = 0;
    this.runStats = null;
    this.report = null;
    this.hasContinued = false;
  }

  init(data = {}) {
    this.levelId = Math.max(1, Math.floor(data.levelId ?? 1));
    this.killCount = Math.max(0, Math.floor(data.killCount ?? 0));
    this.runStats = {
      shotsFired: Math.max(0, Math.floor(data.runStats?.shotsFired ?? 0)),
      enemyHits: Math.max(0, Math.floor(data.runStats?.enemyHits ?? 0)),
      headshots: Math.max(0, Math.floor(data.runStats?.headshots ?? 0)),
      grenadesThrown: Math.max(0, Math.floor(data.runStats?.grenadesThrown ?? 0)),
      grenadeKills: Math.max(0, Math.floor(data.runStats?.grenadeKills ?? 0)),
      damageTaken: Math.max(0, Math.floor(data.runStats?.damageTaken ?? 0))
    };
    this.report = this.normalizeReport(data.report);
    this.hasContinued = false;
  }

  create() {
    const { height } = this.scale;
    const centerX = PLAY_WIDTH * 0.5;
    const centerY = height * 0.5;

    if (this.textures.exists("after-action-bg")) {
      this.add.image(centerX, centerY, "after-action-bg").setDisplaySize(PLAY_WIDTH, height).setDepth(0);
    } else if (this.textures.exists("operation-center-bg")) {
      this.add.image(centerX, centerY, "operation-center-bg").setDisplaySize(PLAY_WIDTH, height).setDepth(0);
    }

    this.add.text(centerX, 52, "AFTER ACTION REPORT", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "52px",
      color: "#e8fdff",
      stroke: "#041b22",
      strokeThickness: 6,
      letterSpacing: 3
    }).setOrigin(0.5).setDepth(3);

    const accuracyPercent = this.runStats.shotsFired > 0
      ? Math.round((this.runStats.enemyHits / this.runStats.shotsFired) * 100)
      : 0;
    const statLines = [
      `Time: ${this.report.elapsedSeconds}s`,
      `Kills: ${this.killCount}   Headshots: ${this.runStats.headshots}`,
      `Shots: ${this.runStats.shotsFired}   Accuracy: ${accuracyPercent}%`,
      `Grenades: ${this.runStats.grenadesThrown} thrown / ${this.runStats.grenadeKills} kills`,
      `Damage Taken: ${this.runStats.damageTaken}`
    ];
    const rewardLines = [
      `Base Reward: $${this.report.baseReward}`,
      `Headshot Bonus: $${this.report.headshotBonus}`,
      `Efficiency Bonus: $${this.report.efficiencyBonus}`,
      `Discipline Bonus: $${this.report.disciplineBonus}`
    ];
    const cardY = 322;
    const cardWidth = 298;
    const cardHeight = 246;
    const cardGap = 20;
    const leftCardX = centerX - (cardWidth * 0.5 + cardGap * 0.5);
    const rightCardX = centerX + (cardWidth * 0.5 + cardGap * 0.5);

    this.createReportCard(leftCardX, cardY, cardWidth, cardHeight, "MISSION STATS", statLines, {
      bodyFont: UI_BODY_FONT,
      bodySizePx: 16,
      bodyColor: "#d7f8ff",
      bodyStroke: "#07242c",
      lineSpacing: 8
    });

    this.createReportCard(rightCardX, cardY, cardWidth, cardHeight, "BONUSES", rewardLines, {
      bodyFont: UI_DISPLAY_FONT,
      bodySizePx: 17,
      bodyColor: "#a8ffd9",
      bodyStroke: "#063228",
      lineSpacing: 8,
      footerLine: `TOTAL CREDIT: $${this.report.totalReward}`,
      footerColor: "#d1ffe9"
    });

    const continueButton = this.add.container(centerX, height - 58).setDepth(3);
    const continuePanel = this.add
      .image(0, 0, "hud-counter-ammo-panel")
      .setDisplaySize(320, 62)
      .setAlpha(0.96);
    const continueHit = this.add
      .rectangle(0, 0, 320, 62, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    continueButton.add([continuePanel, continueHit]);

    this.add.text(centerX, height - 58, "CONTINUE", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "36px",
      color: "#e8fdff",
      stroke: "#062128",
      strokeThickness: 4,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(4);

    continueHit.on("pointerover", () => {
      continuePanel.setAlpha(1);
      this.tweens.add({
        targets: continueButton,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 120,
        ease: "Quad.Out"
      });
    });
    continueHit.on("pointerout", () => {
      continuePanel.setAlpha(0.96);
      this.tweens.add({
        targets: continueButton,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Quad.Out"
      });
    });
    continueHit.on("pointerup", () => this.finalizeAndContinue());

    this.input.keyboard.on("keydown-ENTER", () => this.finalizeAndContinue());
    this.input.keyboard.on("keydown-SPACE", () => this.finalizeAndContinue());
    this.input.keyboard.on("keydown-ESC", () => this.finalizeAndContinue());
  }

  createReportCard(x, y, width, height, title, lines, options = {}) {
    const bodyFont = options.bodyFont ?? UI_BODY_FONT;
    const bodySizePx = options.bodySizePx ?? 18;
    const bodyColor = options.bodyColor ?? "#d5f3f8";
    const bodyStroke = options.bodyStroke ?? "#07242c";
    const lineSpacing = options.lineSpacing ?? 6;
    const footerLine = options.footerLine ?? "";
    const footerColor = options.footerColor ?? bodyColor;

    const card = this.add.container(x, y).setDepth(2);
    const panel = this.add
      .image(0, 0, "hud-counter-ammo-panel")
      .setDisplaySize(width, height)
      .setAlpha(0.93);
    const panelSweep = this.add
      .rectangle(-width * 0.34, 0, width * 0.24, height - 24, 0x86f8ff, 0.06)
      .setBlendMode(Phaser.BlendModes.ADD);
    const accent = this.add
      .rectangle(-width * 0.33, -2, width * 0.27, height - 34, 0x83f8ff, 0.05)
      .setDepth(1);
    card.add([panel, panelSweep, accent]);

    this.tweens.add({
      targets: panelSweep,
      x: width * 0.34,
      duration: UI_MOTION.counterSweepFastMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

    const titleText = this.add.text(x, y - height * 0.41, title, {
      fontFamily: UI_BODY_FONT,
      fontSize: "23px",
      color: "#c9f8ff",
      stroke: "#03141a",
      strokeThickness: 3,
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(4);
    this.fitTextToBounds(titleText, width - 34, 30, 16);

    const bodyY = y - height * 0.33;
    const footerLineGap = 22;
    const footerY = y + height * 0.33;
    const maxBodyBottomY = footerLine ? footerY - footerLineGap : y + height * 0.42;
    const maxBodyHeight = Math.max(40, maxBodyBottomY - bodyY);
    const bodyText = this.add.text(x, bodyY, lines.join("\n"), {
      fontFamily: bodyFont,
      fontSize: `${bodySizePx}px`,
      color: bodyColor,
      stroke: bodyStroke,
      strokeThickness: 3,
      align: "left",
      lineSpacing
    }).setOrigin(0.5, 0).setDepth(4);
    this.fitTextToBounds(bodyText, width - 42, maxBodyHeight, 12);

    if (footerLine) {
      const footerText = this.add.text(x, footerY, footerLine, {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "24px",
        color: footerColor,
        stroke: "#063228",
        strokeThickness: 4,
        align: "center",
        letterSpacing: 1
      }).setOrigin(0.5).setDepth(4);
      this.fitTextToBounds(footerText, width - 34, 34, 14);
    }
  }

  fitTextToBounds(textObject, maxWidth, maxHeight, minSizePx = 12) {
    const initialSize = Number.parseInt(String(textObject.style.fontSize), 10);
    let size = Number.isFinite(initialSize) ? initialSize : 18;

    while ((textObject.width > maxWidth || textObject.height > maxHeight) && size > minSizePx) {
      size -= 1;
      textObject.setFontSize(size);
    }
  }

  normalizeReport(report) {
    const baseReward = MISSION_REWARD_BY_LEVEL[this.levelId] ?? 1000;
    const safeTotal = Number(report?.totalReward);
    const totalReward = Number.isFinite(safeTotal) ? Math.max(0, Math.floor(safeTotal)) : baseReward;
    return {
      elapsedSeconds: Math.max(0, Math.floor(report?.elapsedSeconds ?? 0)),
      baseReward,
      headshotBonus: Math.max(0, Math.floor(report?.headshotBonus ?? 0)),
      efficiencyBonus: Math.max(0, Math.floor(report?.efficiencyBonus ?? 0)),
      disciplineBonus: Math.max(0, Math.floor(report?.disciplineBonus ?? 0)),
      totalReward
    };
  }

  finalizeAndContinue() {
    if (this.hasContinued) {
      return;
    }
    this.hasContinued = true;

    const currentBudgetRaw = Number(this.registry.get("playerBudget") ?? 0);
    const currentBudget = Number.isFinite(currentBudgetRaw) ? Math.max(0, Math.floor(currentBudgetRaw)) : 0;
    const missionReward = this.report.totalReward;
    const nextMissionId = Phaser.Math.Clamp(this.levelId + 1, 1, MAX_MISSION_ID);

    this.registry.set("playerBudget", currentBudget + missionReward);
    this.registry.set("currentMissionId", nextMissionId);
    this.registry.set("operationCenterNotice", `MISSION COMPLETE +$${missionReward}`);
    this.scene.start("operation-center");
  }
}
