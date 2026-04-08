import Phaser from "phaser";
import { HUD_PANEL_WIDTH, PLAY_WIDTH } from "../game/config";
import { START_MISSION_ID, START_PLAYER_BUDGET } from "../game/progressionConfig";
import { GRENADE_RADIUS_UPGRADE_REGISTRY_KEY, WEAPON_MAG_UPGRADE_REGISTRY_KEYS } from "../game/upgradeConfig";
import { UI_COLORS } from "../game/uiTokens";
import { applyMasterMute, ensureAudioSettings, getAudioSettings, getMusicOutputVolume, updateAudioSettings } from "../game/audioSettings";

const MUSIC_LOOP_START_SECONDS = 15;
const MUSIC_LOOP_MARKER = "main-loop";
const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";
const TEST_GRANT_STARTER_WEAPON = false;
const VFX_REGISTRY_KEY = "vfxEnabled";
const VFX_SETTINGS_STORAGE_KEY = "operation-lions-roar-vfx-settings-v1";
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
    this.creditText = null;
    this.canStart = false;
    this.settingsButtonHit = null;
    this.settingsPanel = null;
    this.settingsControls = null;
  }

  create() {
    ensureAudioSettings(this.registry);
    this.ensureVfxSettings();
    applyMasterMute(this);
    this.startBackgroundMusic();

    const { height } = this.scale;
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
        color: UI_COLORS.textMain,
        stroke: UI_COLORS.textStroke,
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

    this.creditText = this.add
      .text(playWidth / 2, height - 10, "Operation Lion's Roar (2026) - By Ofir Dror", {
        fontFamily: UI_BODY_FONT,
        fontSize: "18px",
        color: UI_COLORS.body,
        stroke: UI_COLORS.textStroke,
        strokeThickness: 2,
        letterSpacing: 0.5
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.92);

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

    this.input.on("pointerdown", (pointer) => {
      if (this.isPointerOnSettingsControls(pointer)) {
        return;
      }
      if (this.settingsPanel?.visible) {
        this.toggleSettingsPanel(false);
        return;
      }
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
    const creditTopY = this.creditText ? this.creditText.getTopCenter().y : this.scale.height - 72;
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
    this.registry.set("playerBudget", START_PLAYER_BUDGET);
    this.registry.set("playerGrenades", 0);
    this.registry.set("hasM203", TEST_GRANT_STARTER_WEAPON);
    this.registry.set("hasMag58", false);
    this.registry.set("hasTar21", false);
    this.registry.set("hasCeramicVest", false);
    this.registry.set("hasGrenadeKit", false);
    this.registry.set(WEAPON_MAG_UPGRADE_REGISTRY_KEYS.m203, 0);
    this.registry.set(WEAPON_MAG_UPGRADE_REGISTRY_KEYS.tavor, 0);
    this.registry.set(WEAPON_MAG_UPGRADE_REGISTRY_KEYS.mag, 0);
    this.registry.set(GRENADE_RADIUS_UPGRADE_REGISTRY_KEY, 0);
    this.registry.set("currentMissionId", START_MISSION_ID);
    this.registry.remove("operationCenterNotice");
    this.scene.start("operation-center");
  }

  createSettingsControls() {
    const buttonX = this.scale.width - 16;
    const buttonY = 34;
    const panelWidth = 316;
    const panelHeight = 208;
    const panelX = this.scale.width - panelWidth * 0.5 - 18;
    const panelY = 154;
    const panelDepth = 40;

    const buttonBackdrop = this.add.circle(buttonX, buttonY, 15, 0x09222c, 0.9)
      .setStrokeStyle(2, 0x88dce8, 0.9)
      .setDepth(panelDepth);
    const gearIcon = this.add
      .text(buttonX, buttonY, "\u2699", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "20px",
        color: "#dbf8ff",
        stroke: "#051c23",
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(panelDepth + 1);
    const buttonHit = this.add
      .circle(buttonX, buttonY, 18, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(panelDepth + 2);
    buttonHit.input.cursor = "pointer";

    const panel = this.add.container(panelX, panelY).setDepth(panelDepth + 8).setVisible(false).setAlpha(0);
    const panelBg = this.add
      .rectangle(0, 0, panelWidth, panelHeight, 0x06131a, 0.96)
      .setStrokeStyle(2, 0x7cc8dc, 0.7);
    const panelTitle = this.add
      .text(0, -panelHeight * 0.5 + 16, "AUDIO / VFX SETTINGS", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "18px",
        color: "#dff9ff",
        stroke: "#032028",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5, 0);

    const musicLabel = this.add.text(-panelWidth * 0.5 + 18, -42, "Music", {
      fontFamily: UI_BODY_FONT,
      fontSize: "18px",
      color: "#b9e8f2"
    }).setOrigin(0, 0.5);
    const sfxLabel = this.add.text(-panelWidth * 0.5 + 18, 0, "SFX", {
      fontFamily: UI_BODY_FONT,
      fontSize: "18px",
      color: "#b9e8f2"
    }).setOrigin(0, 0.5);

    const trackWidth = 164;
    const trackX = 64;
    const createTrack = (y) => this.add.rectangle(trackX, y, trackWidth, 8, 0x173640, 0.9)
      .setStrokeStyle(1, 0x6ea6b6, 0.8)
      .setOrigin(0, 0.5);
    const createFill = (y) => this.add.rectangle(trackX, y, trackWidth, 8, 0x7fe5f7, 0.9).setOrigin(0, 0.5);
    const createKnob = (y) => this.add.circle(trackX, y, 9, 0xe9ffff, 1).setStrokeStyle(2, 0x2a6d7b, 1);
    const musicTrack = createTrack(-42).setInteractive({ useHandCursor: true });
    const musicFill = createFill(-42);
    const musicKnob = createKnob(-42).setInteractive({ useHandCursor: true, draggable: true });
    const sfxTrack = createTrack(0).setInteractive({ useHandCursor: true });
    const sfxFill = createFill(0);
    const sfxKnob = createKnob(0).setInteractive({ useHandCursor: true, draggable: true });

    const soundButton = this.add
      .rectangle(-78, 64, 136, 36, 0x1b5260, 0.95)
      .setStrokeStyle(1, 0x94d8e6, 0.9)
      .setInteractive({ useHandCursor: true });
    const soundLabel = this.add
      .text(-78, 64, "SOUND: ON", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "15px",
        color: "#eaffff",
        stroke: "#042028",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5);
    const vfxButton = this.add
      .rectangle(78, 64, 136, 36, 0x1b5260, 0.95)
      .setStrokeStyle(1, 0x94d8e6, 0.9)
      .setInteractive({ useHandCursor: true });
    const vfxLabel = this.add
      .text(78, 64, "VFX: ON", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "15px",
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
      soundButton,
      soundLabel,
      vfxButton,
      vfxLabel
    ]);

    buttonHit.on("pointerover", () => {
      buttonBackdrop.setFillStyle(0x0d3442, 0.95);
      gearIcon.setScale(1.08);
    });
    buttonHit.on("pointerout", () => {
      buttonBackdrop.setFillStyle(0x09222c, 0.9);
      gearIcon.setScale(1);
    });
    buttonHit.on("pointerup", () => this.toggleSettingsPanel());

    const toVolumeFromLocalX = (localX) => Phaser.Math.Clamp((localX - trackX) / trackWidth, 0, 1);
    const handleTrackPointer = (pointer, callback) => {
      const local = panel.getLocalPoint(pointer.worldX, pointer.worldY);
      callback(toVolumeFromLocalX(local.x));
    };

    musicTrack.on("pointerdown", (pointer) => handleTrackPointer(pointer, (volume) => this.applyMusicVolume(volume)));
    sfxTrack.on("pointerdown", (pointer) => handleTrackPointer(pointer, (volume) => {
      updateAudioSettings(this.registry, { sfxVolume: volume });
      applyMasterMute(this);
      this.updateSettingsControlsView();
    }));

    this.input.setDraggable(musicKnob, true);
    this.input.setDraggable(sfxKnob, true);
    musicKnob.on("drag", (pointer) => {
      const local = panel.getLocalPoint(pointer.worldX, pointer.worldY);
      this.applyMusicVolume(toVolumeFromLocalX(local.x));
    });
    sfxKnob.on("drag", (pointer) => {
      const local = panel.getLocalPoint(pointer.worldX, pointer.worldY);
      updateAudioSettings(this.registry, { sfxVolume: toVolumeFromLocalX(local.x) });
      applyMasterMute(this);
      this.updateSettingsControlsView();
    });

    soundButton.on("pointerup", () => {
      const settings = getAudioSettings(this.registry);
      updateAudioSettings(this.registry, { enabled: !settings.enabled });
      applyMasterMute(this);
      this.applyMusicVolume(getAudioSettings(this.registry).musicVolume);
      this.updateSettingsControlsView();
    });
    vfxButton.on("pointerup", () => {
      this.setVfxEnabled(!this.getVfxEnabled());
      this.updateSettingsControlsView();
    });

    this.settingsButtonHit = buttonHit;
    this.settingsPanel = panel;
    this.settingsControls = {
      panelWidth,
      panelHeight,
      musicFill,
      musicKnob,
      sfxFill,
      sfxKnob,
      soundButton,
      soundLabel,
      vfxButton,
      vfxLabel,
      trackX,
      trackWidth
    };
    this.updateSettingsControlsView();
  }

  updateSettingsControlsView() {
    if (!this.settingsControls) {
      return;
    }

    const settings = getAudioSettings(this.registry);
    const {
      musicFill,
      musicKnob,
      sfxFill,
      sfxKnob,
      soundButton,
      soundLabel,
      vfxButton,
      vfxLabel,
      trackX,
      trackWidth
    } = this.settingsControls;
    musicFill.width = Math.max(4, trackWidth * settings.musicVolume);
    sfxFill.width = Math.max(4, trackWidth * settings.sfxVolume);
    musicKnob.x = trackX + trackWidth * settings.musicVolume;
    sfxKnob.x = trackX + trackWidth * settings.sfxVolume;
    soundButton.setFillStyle(settings.enabled ? 0x1b5260 : 0x5a2626, 0.95);
    soundLabel.setText(settings.enabled ? "SOUND: ON" : "SOUND: OFF");
    soundLabel.setColor(settings.enabled ? "#eaffff" : "#ffd4d4");

    const vfxEnabled = this.getVfxEnabled();
    vfxButton.setFillStyle(vfxEnabled ? 0x1b5260 : 0x5a2626, 0.95);
    vfxLabel.setText(vfxEnabled ? "VFX: ON" : "VFX: OFF");
    vfxLabel.setColor(vfxEnabled ? "#eaffff" : "#ffd4d4");
  }

  toggleSettingsPanel(forceVisible = null) {
    if (!this.settingsPanel) {
      return;
    }

    const nextVisible = forceVisible === null ? !this.settingsPanel.visible : forceVisible;
    this.settingsPanel.setVisible(true);
    this.tweens.killTweensOf(this.settingsPanel);
    this.tweens.add({
      targets: this.settingsPanel,
      alpha: nextVisible ? 1 : 0,
      duration: 150,
      ease: "Quad.Out",
      onComplete: () => {
        if (!nextVisible && this.settingsPanel?.active) {
          this.settingsPanel.setVisible(false);
        }
      }
    });
  }

  applyMusicVolume(volume) {
    updateAudioSettings(this.registry, { musicVolume: volume });
    applyMasterMute(this);
    const bgMusic = this.sound.get("bg-music");
    if (bgMusic) {
      bgMusic.setVolume(getMusicOutputVolume(this.registry, 0.4));
    }
    this.updateSettingsControlsView();
  }

  isPointerOnSettingsControls(pointer) {
    if (!pointer) {
      return false;
    }

    if (this.settingsButtonHit?.getBounds()?.contains(pointer.worldX, pointer.worldY)) {
      return true;
    }

    if (!this.settingsPanel?.visible || !this.settingsControls) {
      return false;
    }

    const panelBounds = new Phaser.Geom.Rectangle(
      this.settingsPanel.x - this.settingsControls.panelWidth * 0.5,
      this.settingsPanel.y - this.settingsControls.panelHeight * 0.5,
      this.settingsControls.panelWidth,
      this.settingsControls.panelHeight
    );
    return panelBounds.contains(pointer.worldX, pointer.worldY);
  }

  ensureVfxSettings() {
    const current = this.registry.get(VFX_REGISTRY_KEY);
    if (typeof current === "boolean") {
      return current;
    }

    let stored = true;
    try {
      const raw = window.localStorage.getItem(VFX_SETTINGS_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.enabled === "boolean") {
          stored = parsed.enabled;
        }
      }
    } catch {
      stored = true;
    }

    this.registry.set(VFX_REGISTRY_KEY, stored);
    return stored;
  }

  getVfxEnabled() {
    this.ensureVfxSettings();
    return this.registry.get(VFX_REGISTRY_KEY) !== false;
  }

  setVfxEnabled(enabled) {
    const next = Boolean(enabled);
    this.registry.set(VFX_REGISTRY_KEY, next);
    try {
      window.localStorage.setItem(VFX_SETTINGS_STORAGE_KEY, JSON.stringify({ enabled: next }));
    } catch {
      // ignore localStorage failures
    }
  }

  startBackgroundMusic() {
    const existingMusic = this.sound.get("bg-music");
    const musicVolume = getMusicOutputVolume(this.registry, 0.4);
    if (existingMusic) {
      existingMusic.setVolume(musicVolume);
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
      volume: musicVolume
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
