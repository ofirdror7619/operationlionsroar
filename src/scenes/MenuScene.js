import Phaser from "phaser";
import { HUD_PANEL_WIDTH, PLAY_WIDTH } from "../game/config";

const MUSIC_LOOP_START_SECONDS = 15;
const MUSIC_LOOP_MARKER = "main-loop";

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
    this.canStart = false;
  }

  create() {
    this.startBackgroundMusic();

    const { width, height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const panelLeft = playWidth;
    const panelRight = playWidth + HUD_PANEL_WIDTH;
    const hudX = playWidth + HUD_PANEL_WIDTH / 2;
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
      "Every second counts.\n\n" +
      "Stay sharp. Stay alive.";
    this.typewriterCursor = 0;

    this.add.image(playWidth / 2, height / 2, "bg").setDisplaySize(playWidth, height);
    this.add.rectangle(playWidth / 2, height / 2, playWidth, height, 0x0f0b07, 0.7);
    const hudBg = this.add.graphics();
    hudBg.fillGradientStyle(0x0f1727, 0x121c30, 0x0a1222, 0x0e182b, 1);
    hudBg.fillRect(panelLeft, 0, HUD_PANEL_WIDTH, height);

    const hudFrame = this.add.graphics();
    hudFrame.lineStyle(2, 0x314766, 0.85);
    hudFrame.strokeRect(panelLeft + 2, 2, HUD_PANEL_WIDTH - 4, height - 4);
    hudFrame.lineStyle(1, 0x1f2f4a, 0.8);
    hudFrame.strokeRect(panelLeft + 8, 8, HUD_PANEL_WIDTH - 16, height - 16);

    const hudGlow = this.add.graphics();
    hudGlow.fillStyle(0x3f77c7, 0.13);
    hudGlow.fillEllipse(contentCenterX, 26, (contentRight - contentLeft) * 1.05, 54);

    const hudGrid = this.add.graphics();
    hudGrid.lineStyle(1, 0x2f4362, 0.22);
    for (let y = 0; y <= height; y += 26) {
      hudGrid.lineBetween(contentLeft, y, panelRight - 10, y);
    }
    for (let x = contentLeft; x <= panelRight - 10; x += 20) {
      hudGrid.lineBetween(x, 10, x, height - 10);
    }

    const hudSheen = this.add.graphics();
    hudSheen.fillStyle(0xffffff, 0.04);
    hudSheen.fillTriangle(panelLeft, 0, panelLeft + HUD_PANEL_WIDTH * 0.46, 0, panelLeft, height);

    this.add
      .text(playWidth / 2, 52, "OPERATION LION'S ROAR", {
        fontFamily: "'Teko', 'Impact', sans-serif",
        fontSize: "56px",
        color: "#f4dcc0",
        stroke: "#1c130c",
        strokeThickness: 8,
        letterSpacing: 2
      })
      .setOrigin(0.5);

    this.briefingText = this.add
      .text(64, 100, "", {
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        fontSize: "22px",
        color: "#d9d2bf",
        lineSpacing: 8,
        wordWrap: { width: playWidth - 128 }
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    this.briefingText.on("pointerup", () => {
      this.completeTypewriter();
    });

    this.add.text(hudX, 26, "WARZONE VIEW", {
      fontFamily: "'Teko', 'Impact', sans-serif",
      fontSize: "31px",
      color: "#c9d6e6",
      stroke: "#09101a",
      strokeThickness: 5,
      letterSpacing: 1
    }).setOrigin(0.5, 0.5);

    this.startButton = this.add
      .rectangle(hudX, 142, HUD_PANEL_WIDTH - 34, 58, 0x85703e, 0.97)
      .setStrokeStyle(2, 0xead8aa, 0.9)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.startLabel = this.add
      .text(this.startButton.x, this.startButton.y, "START", {
        fontFamily: "'Teko', 'Impact', sans-serif",
        fontSize: "40px",
        color: "#1b1711",
        letterSpacing: 2
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.startButton.on("pointerover", () => {
      if (!this.canStart) {
        return;
      }
      this.startButton.setFillStyle(0x9f8751, 1);
    });
    this.startButton.on("pointerout", () => this.startButton.setFillStyle(0x85703e, 0.97));
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
    this.canStart = true;
    this.startButton.setVisible(true);
    this.startLabel.setVisible(true);
    this.tweens.add({
      targets: [this.startButton, this.startLabel],
      alpha: { from: 0, to: 1 },
      duration: 280,
      ease: "Quad.Out"
    });
  }

  startGame() {
    if (this.hasStarted || !this.canStart) {
      return;
    }

    this.hasStarted = true;
    this.typingEvent?.remove(false);
    this.typingEvent = null;
    this.scene.start("game");
    this.scene.launch("hud");
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
