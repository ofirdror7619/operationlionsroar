import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";
import { MAX_MISSION_ID } from "../game/progressionConfig";
import { UI_COLORS } from "../game/uiTokens";
import { applyMasterMute, ensureAudioSettings, getAudioSettings, updateAudioSettings } from "../game/audioSettings";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";

export class OperationCenterScene extends Phaser.Scene {
  constructor() {
    super("operation-center");
    this.startButton = null;
    this.storeButton = null;
    this.hasStarted = false;
    this.warningText = null;
    this.audioControls = null;
  }

  create() {
    const { height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const centerX = playWidth * 0.5;
    ensureAudioSettings(this.registry);
    applyMasterMute(this);
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

  createAudioControls() {
    const buttonX = this.scale.width - 16;
    const buttonY = 34;
    const panelWidth = 300;
    const panelHeight = 182;
    const panelX = this.scale.width - panelWidth * 0.5 - 18;
    const panelY = 156;

    const buttonBackdrop = this.add
      .circle(buttonX, buttonY, 15, 0x09222c, 0.9)
      .setStrokeStyle(2, 0x88dce8, 0.9)
      .setDepth(6)
      .setAlpha(0.96);
    const buttonIcon = this.add
      .text(buttonX, buttonY, "\u2699", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "20px",
        color: "#dff9ff",
        stroke: "#04222b",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5)
      .setDepth(7);
    const button = this.add
      .circle(buttonX, buttonY, 18, 0xffffff, 0.001)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    button.input.cursor = "pointer";

    const panel = this.add.container(panelX, panelY).setDepth(20).setVisible(false).setAlpha(0);
    const panelBg = this.add
      .rectangle(0, 0, panelWidth, panelHeight, 0x06131a, 0.95)
      .setStrokeStyle(2, 0x7cc8dc, 0.7);
    const panelTitle = this.add
      .text(0, -panelHeight * 0.5 + 20, "AUDIO SETTINGS", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "20px",
        color: "#dff9ff",
        stroke: "#032028",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5, 0);

    const musicLabel = this.add.text(-panelWidth * 0.5 + 18, -36, "Music", {
      fontFamily: UI_BODY_FONT,
      fontSize: "18px",
      color: "#b9e8f2"
    }).setOrigin(0, 0.5);
    const sfxLabel = this.add.text(-panelWidth * 0.5 + 18, 14, "SFX", {
      fontFamily: UI_BODY_FONT,
      fontSize: "18px",
      color: "#b9e8f2"
    }).setOrigin(0, 0.5);

    const trackWidth = 164;
    const trackX = 24;
    const createTrack = (y) => this.add.rectangle(trackX, y, trackWidth, 8, 0x173640, 0.9)
      .setStrokeStyle(1, 0x6ea6b6, 0.8)
      .setOrigin(0, 0.5);
    const createFill = (y) => this.add.rectangle(trackX, y, trackWidth, 8, 0x7fe5f7, 0.9).setOrigin(0, 0.5);
    const createKnob = (y) => this.add.circle(trackX, y, 9, 0xe9ffff, 1).setStrokeStyle(2, 0x2a6d7b, 1);
    const musicTrack = createTrack(-36).setInteractive({ useHandCursor: true });
    const musicFill = createFill(-36);
    const musicKnob = createKnob(-36).setInteractive({ useHandCursor: true, draggable: true });
    const sfxTrack = createTrack(14).setInteractive({ useHandCursor: true });
    const sfxFill = createFill(14);
    const sfxKnob = createKnob(14).setInteractive({ useHandCursor: true, draggable: true });
    const onOffButton = this.add
      .rectangle(0, 62, 162, 36, 0x1b5260, 0.95)
      .setStrokeStyle(1, 0x94d8e6, 0.9)
      .setInteractive({ useHandCursor: true });
    const onOffLabel = this.add
      .text(0, 62, "SOUND: ON", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "18px",
        color: "#eaffff",
        stroke: "#042028",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5);

    panel.add([
      panelBg,
      panelTitle,
      musicLabel,
      sfxLabel,
      musicTrack,
      musicFill,
      musicKnob,
      sfxTrack,
      sfxFill,
      sfxKnob,
      onOffButton,
      onOffLabel
    ]);

    button.on("pointerover", () => {
      buttonBackdrop.setFillStyle(0x0d3442, 0.95);
      buttonIcon.setScale(1.08);
    });
    button.on("pointerout", () => {
      buttonBackdrop.setFillStyle(0x09222c, 0.9);
      buttonIcon.setScale(1);
    });
    button.on("pointerup", () => {
      const nextVisible = !panel.visible;
      panel.setVisible(nextVisible);
      this.tweens.add({
        targets: panel,
        alpha: nextVisible ? 1 : 0,
        duration: 150,
        ease: "Quad.Out",
        onComplete: () => {
          if (!nextVisible) {
            panel.setVisible(false);
          }
        }
      });
    });

    const toVolumeFromLocalX = (localX) => Phaser.Math.Clamp((localX - trackX) / trackWidth, 0, 1);
    const applyMusicVolume = (volume) => {
      updateAudioSettings(this.registry, { musicVolume: volume });
      applyMasterMute(this);
      this.updateAudioControlsView();
      const bgMusic = this.sound.get("bg-music");
      if (bgMusic) {
        bgMusic.setVolume(0.4 * getAudioSettings(this.registry).musicVolume);
      }
    };
    const applySfxVolume = (volume) => {
      updateAudioSettings(this.registry, { sfxVolume: volume });
      applyMasterMute(this);
      this.updateAudioControlsView();
    };
    const handleTrackPointer = (pointer, callback) => {
      const local = panel.getLocalPoint(pointer.worldX, pointer.worldY);
      callback(toVolumeFromLocalX(local.x));
    };

    musicTrack.on("pointerdown", (pointer) => handleTrackPointer(pointer, applyMusicVolume));
    sfxTrack.on("pointerdown", (pointer) => handleTrackPointer(pointer, applySfxVolume));
    this.input.setDraggable(musicKnob, true);
    this.input.setDraggable(sfxKnob, true);
    musicKnob.on("drag", (pointer) => {
      const local = panel.getLocalPoint(pointer.worldX, pointer.worldY);
      applyMusicVolume(toVolumeFromLocalX(local.x));
    });
    sfxKnob.on("drag", (pointer) => {
      const local = panel.getLocalPoint(pointer.worldX, pointer.worldY);
      applySfxVolume(toVolumeFromLocalX(local.x));
    });
    onOffButton.on("pointerup", () => {
      const settings = getAudioSettings(this.registry);
      updateAudioSettings(this.registry, { enabled: !settings.enabled });
      applyMasterMute(this);
      this.updateAudioControlsView();
      const bgMusic = this.sound.get("bg-music");
      if (bgMusic) {
        bgMusic.setVolume(0.4 * getAudioSettings(this.registry).musicVolume);
      }
    });

    this.audioControls = {
      panel,
      button,
      musicFill,
      musicKnob,
      sfxFill,
      sfxKnob,
      onOffButton,
      onOffLabel,
      trackX,
      trackWidth
    };
    this.updateAudioControlsView();
  }

  updateAudioControlsView() {
    if (!this.audioControls) {
      return;
    }

    const settings = getAudioSettings(this.registry);
    const { musicFill, musicKnob, sfxFill, sfxKnob, onOffButton, onOffLabel, trackX, trackWidth } = this.audioControls;
    const musicWidth = Math.max(4, trackWidth * settings.musicVolume);
    const sfxWidth = Math.max(4, trackWidth * settings.sfxVolume);
    musicFill.width = musicWidth;
    sfxFill.width = sfxWidth;
    musicKnob.x = trackX + trackWidth * settings.musicVolume;
    sfxKnob.x = trackX + trackWidth * settings.sfxVolume;
    onOffButton.setFillStyle(settings.enabled ? 0x1b5260 : 0x5a2626, 0.95);
    onOffLabel.setText(settings.enabled ? "SOUND: ON" : "SOUND: OFF");
    onOffLabel.setColor(settings.enabled ? "#eaffff" : "#ffd4d4");
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

    return Phaser.Math.Clamp(Math.floor(missionFromRegistry), 1, MAX_MISSION_ID);
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
        "Primary: Eliminate 50 hostiles.\n" +
        "Threat: Fast wave rotations and grenadiers.\n" +
        "Directive: Keep pressure up and chain kills."
      );
    }

    if (levelId === 3) {
      return (
        "Primary: Survive for 20 seconds.\n" +
        "Threat: High-tempo enemy fire and grenades.\n" +
        "Directive: Stay mobile and protect your health."
      );
    }

    if (levelId >= 4) {
      return (
        "Primary: Release the hostage by eliminating 40 terrorists.\n" +
        "Threat: Tunnel crossfire and hostage proximity.\n" +
        "Directive: Keep fire disciplined and avoid the hostage kill zone."
      );
    }

    return (
      "Primary: Survive for 20 seconds.\n" +
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
