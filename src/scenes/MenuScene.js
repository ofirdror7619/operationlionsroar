import Phaser from "phaser";
import { HUD_PANEL_WIDTH, PLAY_WIDTH } from "../game/config";

const MUSIC_LOOP_START_SECONDS = 15;
const MUSIC_LOOP_MARKER = "main-loop";
const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";
const UI_COLORS = {
  panelTopLeft: 0x07141a,
  panelTopRight: 0x0a201f,
  panelBottomLeft: 0x050d12,
  panelBottomRight: 0x0a1918,
  frameOuter: 0x4bbfbc,
  frameInner: 0x2a6665,
  glow: 0x2de5d0,
  grid: 0x2a8f8c,
  title: "#d8fff9",
  titleStroke: "#031016",
  body: "#baf7ec",
  buttonFill: 0x1d9d8f,
  buttonHover: 0x28bda9,
  buttonStroke: 0x8afff2,
  buttonText: "#041915"
};

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
    this.hasStarted = false;
    this.typingEvent = null;
    this.fullBriefingText = "";
    this.typewriterCursor = 0;
    this.briefingText = null;
    this.startButton = null;
    this.startLabel = null;
    this.startBlinkTween = null;
    this.canStart = false;
  }

  create() {
    this.startBackgroundMusic();

    const { width, height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const panelLeft = playWidth;
    const panelRight = playWidth + HUD_PANEL_WIDTH;
    const healthLaneWidth = 54;
    const contentLeft = panelLeft + 14;
    const contentRight = panelRight - healthLaneWidth - 16;
    const contentCenterX = (contentLeft + contentRight) * 0.5;

    this.hasStarted = false;
    this.canStart = false;
    this.fullBriefingText =
      "The year is 2026.\n" +
      "Somewhere in the Middle East, a classified operation is underway.\n\n" +
      "A small unit has been deployed behind hostile lines.\n" +
      "No backup. No extraction window. No second chances.\n\n" +
      "The mission is simple:\n" +
      "secure the area... eliminate all hostile forces.\n\n" +
      "Every shadow could be your last.\n" +
      "Every second counts. Stay sharp. Stay alive.";
    this.typewriterCursor = 0;

    this.add.image(playWidth / 2, height / 2, "bg").setDisplaySize(playWidth, height);
    this.add.rectangle(playWidth / 2, height / 2, playWidth, height, 0x040d11, 0.5);
    this.add.rectangle(playWidth * 0.2, height * 0.28, playWidth * 0.5, height * 0.5, 0x0f504d, 0.12);
    this.add.rectangle(playWidth * 0.8, height * 0.8, playWidth * 0.44, height * 0.36, 0x0b3a38, 0.1);
    if (HUD_PANEL_WIDTH > 0) {
      const hudBg = this.add.graphics();
      hudBg.fillGradientStyle(
        UI_COLORS.panelTopLeft,
        UI_COLORS.panelTopRight,
        UI_COLORS.panelBottomLeft,
        UI_COLORS.panelBottomRight,
        1
      );
      hudBg.fillRect(panelLeft, 0, HUD_PANEL_WIDTH, height);

      const hudFrame = this.add.graphics();
      hudFrame.lineStyle(1, UI_COLORS.frameOuter, 0.88);
      hudFrame.strokeRect(panelLeft + 2, 2, HUD_PANEL_WIDTH - 4, height - 4);
      hudFrame.lineStyle(1, UI_COLORS.frameInner, 0.8);
      hudFrame.strokeRect(panelLeft + 8, 8, HUD_PANEL_WIDTH - 16, height - 16);

      const hudGlow = this.add.graphics();
      hudGlow.fillStyle(UI_COLORS.glow, 0.14);
      hudGlow.fillEllipse(contentCenterX, 26, (contentRight - contentLeft) * 1.05, 54);

      const hudGrid = this.add.graphics();
      hudGrid.lineStyle(1, UI_COLORS.grid, 0.2);
      for (let y = 0; y <= height; y += 26) {
        hudGrid.lineBetween(contentLeft, y, panelRight - 10, y);
      }
      for (let x = contentLeft; x <= panelRight - 10; x += 20) {
        hudGrid.lineBetween(x, 10, x, height - 10);
      }

      const hudSheen = this.add.graphics();
      hudSheen.fillStyle(0xffffff, 0.04);
      hudSheen.fillTriangle(panelLeft, 0, panelLeft + HUD_PANEL_WIDTH * 0.46, 0, panelLeft, height);
    }

    this.add
      .text(playWidth / 2, 52, "OPERATION LION'S ROAR", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "62px",
        color: UI_COLORS.title,
        stroke: UI_COLORS.titleStroke,
        strokeThickness: 5,
        letterSpacing: 3
      })
      .setOrigin(0.5);

    this.briefingText = this.add
      .text(64, 100, "", {
        fontFamily: UI_BODY_FONT,
        fontSize: "21px",
        color: UI_COLORS.body,
        lineSpacing: 9,
        wordWrap: { width: playWidth - 128 }
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    this.briefingText.on("pointerup", () => {
      this.completeTypewriter();
    });

    this.startButton = this.add
      .rectangle(playWidth / 2, height - 120, 226, 52, 0x1f7f77, 0.97)
      .setFillStyle(UI_COLORS.buttonFill, 0.97)
      .setStrokeStyle(1, UI_COLORS.buttonStroke, 0.95)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.startLabel = this.add
      .text(this.startButton.x, this.startButton.y, "START", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "34px",
        color: UI_COLORS.buttonText,
        letterSpacing: 3
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.startButton.on("pointerover", () => {
      if (!this.canStart) {
        return;
      }
      this.startButton.setFillStyle(UI_COLORS.buttonHover, 1);
    });
    this.startButton.on("pointerout", () => this.startButton.setFillStyle(UI_COLORS.buttonFill, 0.97));
    this.startButton.on("pointerup", () => {
      if (this.canStart) {
        this.startGame();
      }
    });

    this.input.on("pointerdown", () => {
      if (!this.canStart) {
        this.completeTypewriter();
      }
    });

    this.input.keyboard.on("keydown-ENTER", () => {
      if (this.canStart) {
        this.startGame();
      }
    });
    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.canStart) {
        this.startGame();
      }
    });

    this.startTypewriter();
  }

  startTypewriter() {
    this.typingEvent = this.time.addEvent({
      delay: 34,
      callback: () => {
        this.typewriterCursor += 1;
        this.briefingText.setText(this.fullBriefingText.slice(0, this.typewriterCursor));
        if (this.typewriterCursor >= this.fullBriefingText.length) {
          this.typingEvent?.remove(false);
          this.typingEvent = null;
          this.revealStartButton();
        }
      },
      loop: true
    });
  }

  completeTypewriter() {
    if (!this.typingEvent || this.canStart) {
      return;
    }

    this.typingEvent.remove(false);
    this.typingEvent = null;
    this.typewriterCursor = this.fullBriefingText.length;
    this.briefingText.setText(this.fullBriefingText);
    this.revealStartButton();
  }

  revealStartButton() {
    const buttonHalfHeight = this.startButton.height * 0.5;
    const textToButtonGap = 14;
    const creditTopY = this.scale.height - 72;
    const buttonToCreditGap = 4;

    let minButtonY = this.briefingText.y + this.briefingText.height + textToButtonGap + buttonHalfHeight;
    let maxButtonY = creditTopY - buttonToCreditGap - buttonHalfHeight;

    const buttonY = Phaser.Math.Clamp((minButtonY + maxButtonY) * 0.5, minButtonY, maxButtonY);
    this.startButton.setPosition(PLAY_WIDTH / 2, buttonY);
    this.startLabel.setPosition(this.startButton.x, this.startButton.y);
    this.canStart = true;
    this.startButton.setVisible(true);
    this.startLabel.setVisible(true);
    this.tweens.add({
      targets: [this.startButton, this.startLabel],
      alpha: { from: 0, to: 1 },
      duration: 280,
      ease: "Quad.Out"
    });

    this.startBlinkTween?.remove();
    this.startBlinkTween = this.tweens.add({
      targets: this.startLabel,
      alpha: { from: 1, to: 0.45 },
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
  }

  startGame() {
    if (this.hasStarted || !this.canStart) {
      return;
    }

    this.hasStarted = true;
    this.startBlinkTween?.remove();
    this.startBlinkTween = null;
    this.typingEvent?.remove(false);
    this.typingEvent = null;
    this.scene.start("game");
  }

  startBackgroundMusic() {
    const existingMusic = this.sound.get("bg-music");
    if (existingMusic) {
      this.ensureMusicLoopMarker(existingMusic);
      if (existingMusic.isPlaying) {
        if (existingMusic.currentMarker?.name === MUSIC_LOOP_MARKER) {
          return;
        }
        existingMusic.stop();
      }
      existingMusic.play(MUSIC_LOOP_MARKER);
      return;
    }

    const music = this.sound.add("bg-music", {
      volume: 0.4
    });
    this.ensureMusicLoopMarker(music);
    music.play(MUSIC_LOOP_MARKER);
  }

  ensureMusicLoopMarker(music) {
    if (music.__loopMarkerReady) {
      return;
    }

    const duration = Math.max(0.1, music.totalDuration - MUSIC_LOOP_START_SECONDS);
    music.addMarker({
      name: MUSIC_LOOP_MARKER,
      start: MUSIC_LOOP_START_SECONDS,
      duration,
      config: {
        loop: true
      }
    });
    music.__loopMarkerReady = true;
  }
}
