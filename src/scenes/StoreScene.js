import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";
import { START_PLAYER_BUDGET } from "../game/progressionConfig";
import {
  GRENADE_BASE_RADIUS,
  GRENADE_RADIUS_UPGRADE_REGISTRY_KEY,
  GRENADE_RADIUS_UPGRADE_STEP,
  WEAPON_MAG_UPGRADE_REGISTRY_KEYS,
  WEAPON_MAG_UPGRADE_STEP,
  getGrenadeBlastRadius,
  getGrenadeRadiusMaxLevel,
  getGrenadeRadiusUpgradeCost,
  getGrenadeRadiusUpgradeLevel,
  getWeaponMagazineMaxLevel,
  getWeaponMagazineUpgradeCost,
  getWeaponMagazineUpgradeLevel,
  getWeaponMaxAmmoCapacity
} from "../game/upgradeConfig";
import { UI_MOTION } from "../game/uiTokens";
import { applyMasterMute, ensureAudioSettings, getAudioSettings, getMusicOutputVolume, updateAudioSettings } from "../game/audioSettings";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";
const STORE_CARD_WIDTH = 314;
const STORE_CARD_HEIGHT = 182;
const STORE_CARD_HOVER_SCALE = 1.008;
const VFX_REGISTRY_KEY = "vfxEnabled";
const VFX_SETTINGS_STORAGE_KEY = "operation-lions-roar-vfx-settings-v1";

export class StoreScene extends Phaser.Scene {
  constructor() {
    super("store");
    this.playerBudget = 0;
    this.budgetText = null;
    this.storeNoticeText = null;
    this.storeNoticeTween = null;
    this.cardViews = {};
    this.storeItems = [];
    this.settingsButtonHit = null;
    this.settingsPanel = null;
    this.settingsControls = null;
  }

  create() {
    const { height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const centerX = playWidth * 0.5;
    ensureAudioSettings(this.registry);
    this.ensureVfxSettings();
    applyMasterMute(this);
    const budgetFromRegistry = this.registry.get("playerBudget");
    if (typeof budgetFromRegistry === "number" && Number.isFinite(budgetFromRegistry)) {
      this.playerBudget = Math.max(0, Math.floor(budgetFromRegistry));
    } else {
      this.playerBudget = START_PLAYER_BUDGET;
      this.registry.set("playerBudget", this.playerBudget);
    }

    this.add
      .image(centerX, height * 0.5, "store-bg")
      .setDisplaySize(playWidth, height)
      .setDepth(0);

    this.add.rectangle(centerX, height * 0.5, playWidth, height, 0x041017, 0.36).setDepth(1);

    this.createBudgetIndicator(playWidth);
    this.createStoreNotice(centerX);
    this.createStoreItems(centerX, height);
    this.createBackButton(31, 23);


    this.input.on("pointerdown", (pointer) => {
      if (this.isPointerOnSettingsControls(pointer)) {
        return;
      }
      if (this.settingsPanel?.visible) {
        this.toggleSettingsPanel(false);
      }
    });

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.settingsPanel?.visible) {
        this.toggleSettingsPanel(false);
        return;
      }
      this.backToOperationCenter();
    });
    this.input.keyboard.on("keydown-BACKSPACE", () => this.backToOperationCenter());
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

  createBudgetIndicator(playWidth) {
    const x = playWidth - 170;
    const y = 58;

    this.add
      .image(x, y, "hud-counter-ammo-panel")
      .setDisplaySize(278, 70)
      .setAlpha(0.95)
      .setDepth(5);

    this.add
      .rectangle(x - 88, y, 62, 56, 0x7ff7ff, 0.07)
      .setDepth(5);

    const budgetSweep = this.add
      .rectangle(x - 82, y, 66, 56, 0x86f8ff, 0.07)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: budgetSweep,
      x: x + 82,
      duration: UI_MOTION.counterSweepSlowMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

    this.add
      .text(x - 34, y - 13, "BUDGET", {
        fontFamily: UI_BODY_FONT,
        fontSize: "16px",
        color: "#9ddde5",
        stroke: "#04151b",
        strokeThickness: 2,
        letterSpacing: 1
      })
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.budgetText = this.add
      .text(x - 34, y + 13, `$${this.playerBudget}`, {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "30px",
        color: "#eaffff",
        stroke: "#04151b",
        strokeThickness: 4,
        letterSpacing: 1
      })
      .setOrigin(0, 0.5)
      .setDepth(6);
  }

  createStoreItems(centerX, height) {
    this.storeItems = [
      {
        key: "store-item-m203",
        imageKey: "store-item-m203",
        name: "M-203 Rifle",
        basePrice: 1000,
        baseDescription: "Has grenade launcher.",
        type: "weapon",
        weaponId: "m203"
      },
      {
        key: "store-item-mag",
        imageKey: "store-item-mag",
        name: "FN-MAG-58 Machine Gun",
        basePrice: 5000,
        baseDescription: "Shoots automatically with awesome firepower.",
        type: "weapon",
        weaponId: "mag"
      },
      {
        key: "store-item-tavor",
        imageKey: "store-item-tavor",
        name: "Tavor TAR-21",
        basePrice: 3000,
        baseDescription: "Has a bigger hit radius.",
        type: "weapon",
        weaponId: "tavor"
      },
      {
        key: "store-item-ceramic-vest",
        imageKey: "store-item-ceramic-vest",
        name: "Ceramic Vest",
        basePrice: 6500,
        baseDescription: "Cuts incoming damage by 50%.",
        type: "vest"
      },
      {
        key: "store-item-grenade-buy",
        imageKey: "store-item-grenade",
        name: "Hand Grenade",
        basePrice: 100,
        baseDescription: "Buy +1 grenade.",
        type: "grenade-buy"
      },
      {
        key: "store-item-grenade-upgrade",
        imageKey: "store-item-grenade",
        name: "Grenade Blast Upgrade",
        basePrice: 0,
        baseDescription: "Increase grenade blast radius.",
        type: "grenade-upgrade"
      }
    ];

    const slots = this.getStoreSlots(centerX, height, this.storeItems.length);
    this.storeItems.forEach((item, index) => this.createStoreCard(item, slots[index]));
    this.refreshStoreCards();
  }

  createStoreCard(item, slot) {
    const card = this.add.container(slot.x, slot.y).setDepth(slot.depth ?? 4);
    const panel = this.add
      .image(0, 0, "hud-counter-ammo-panel")
      .setDisplaySize(STORE_CARD_WIDTH, STORE_CARD_HEIGHT)
      .setAlpha(0.92);
    const panelSweep = this.add
      .rectangle(-102, 0, 76, STORE_CARD_HEIGHT - 24, 0x86f8ff, 0.07)
      .setBlendMode(Phaser.BlendModes.ADD);
    const accent = this.add
      .rectangle(-106, -2, 86, STORE_CARD_HEIGHT - 32, 0x83f8ff, 0.06)
      .setDepth(1);
    const image = this.add.image(0, -18, item.imageKey ?? item.key);
    const maxItemWidth = 290;
    const maxItemHeight = 128;
    const fitScale = Math.min(maxItemWidth / image.width, maxItemHeight / image.height);
    image.setScale(fitScale);
    const priceTag = this.add
      .image(0, 72, "hud-counter-grenade-panel")
      .setDisplaySize(174, 36)
      .setAlpha(0.96);
    const name = this.add
      .text(0, -74, item.name, {
        fontFamily: UI_BODY_FONT,
        fontSize: "18px",
        color: "#c9f8ff",
        stroke: "#03141a",
        strokeThickness: 2,
        letterSpacing: 1
      })
      .setOrigin(0.5);
    const description = this.add
      .text(0, 38, item.baseDescription, {
        fontFamily: UI_BODY_FONT,
        fontSize: "14px",
        color: "#9fd6de",
        stroke: "#021015",
        strokeThickness: 2,
        align: "center",
        wordWrap: { width: 264, useAdvancedWrap: true }
      })
      .setOrigin(0.5, 0.5);
    const price = this.add
      .text(0, 72, `$${item.basePrice}`, {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "22px",
        color: "#baf4ff",
        stroke: "#03141a",
        strokeThickness: 3,
        letterSpacing: 2
      })
      .setOrigin(0.5);
    const ownedBadge = this.add.container(116, -52).setVisible(false);
    const ownedBadgeGlow = this.add.circle(0, 0, 30, 0x52ffc0, 0.22).setBlendMode(Phaser.BlendModes.ADD);
    const ownedBadgeCore = this.add
      .circle(0, 0, 21, 0x0e2e25, 0.92)
      .setStrokeStyle(3, 0x63ffbc, 0.95);
    const ownedBadgeSweep = this.add.circle(-8, -8, 9, 0xa2ffe0, 0.18);
    const ownedMark = this.add
      .text(0, 0, "V", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "40px",
        color: "#a8ffd3",
        stroke: "#0f3a2a",
        strokeThickness: 4,
        fontStyle: "900"
      })
      .setOrigin(0.5);
    ownedBadge.add([ownedBadgeGlow, ownedBadgeCore, ownedBadgeSweep, ownedMark]);
    const hit = this.add
      .zone(0, 0, STORE_CARD_WIDTH, STORE_CARD_HEIGHT)
      .setInteractive({ useHandCursor: true });

    card.add([panel, panelSweep, accent, image, priceTag, name, description, price, ownedBadge, hit]);
    card.setScale(slot.scale ?? 1);

    this.tweens.add({
      targets: panelSweep,
      x: 102,
      duration: UI_MOTION.counterSweepFastMs,
      yoyo: true,
      repeat: -1,
      ease: UI_MOTION.easePulse
    });

    hit.on("pointerover", () => {
      this.tweens.add({
        targets: card,
        scaleX: (slot.scale ?? 1) * STORE_CARD_HOVER_SCALE,
        scaleY: (slot.scale ?? 1) * STORE_CARD_HOVER_SCALE,
        y: slot.y - 4,
        duration: 110,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerout", () => {
      this.tweens.add({
        targets: card,
        scaleX: slot.scale ?? 1,
        scaleY: slot.scale ?? 1,
        y: slot.y,
        duration: 130,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerup", () => this.attemptPurchase(item));
    this.cardViews[item.key] = { panel, name, description, price, ownedBadge };
  }

  getStoreSlots(centerX, height, itemCount) {
    const cols = 3;
    const horizontalMargin = 30;
    const minCardGap = 30;
    const maxContentWidth = PLAY_WIDTH - horizontalMargin * 2;
    const requiredWidth = (STORE_CARD_WIDTH * STORE_CARD_HOVER_SCALE) * cols + minCardGap * (cols - 1);
    const cardScale = Math.min(1, maxContentWidth / requiredWidth);
    const effectiveCardWidth = STORE_CARD_WIDTH * cardScale;
    const effectiveCardHeight = STORE_CARD_HEIGHT * cardScale;
    const xGap = Math.max(10, (maxContentWidth - effectiveCardWidth * cols) / (cols - 1));
    const xSpacing = effectiveCardWidth + xGap;
    const rows = Math.max(1, Math.ceil(itemCount / cols));
    const topSafe = 116;
    const bottomSafe = 60;
    const topCenter = topSafe + effectiveCardHeight * 0.5;
    const bottomCenter = height - bottomSafe - effectiveCardHeight * 0.5;
    const ySpacing = rows > 1 ? (bottomCenter - topCenter) / (rows - 1) : 0;
    const slots = [];

    for (let index = 0; index < itemCount; index += 1) {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const rowCount = Math.min(cols, itemCount - row * cols);
      const rowStartX = centerX - ((rowCount - 1) * xSpacing) * 0.5;
      slots.push({
        x: rowStartX + col * xSpacing,
        y: rows > 1 ? topCenter + row * ySpacing : (topCenter + bottomCenter) * 0.5,
        depth: 10 - row,
        scale: cardScale
      });
    }

    return slots;
  }

  createStoreNotice(centerX) {
    this.storeNoticeText = this.add
      .text(centerX, 138, "", {
        fontFamily: UI_BODY_FONT,
        fontSize: "24px",
        color: "#ffd69b",
        stroke: "#2c1402",
        strokeThickness: 3,
        letterSpacing: 1
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setAlpha(0);
  }

  updateBudgetIndicator() {
    if (this.budgetText?.active) {
      this.budgetText.setText(`$${this.playerBudget}`);
    }
  }

  showStoreNotice(message, color = "#ffd69b", stroke = "#2c1402") {
    if (!this.storeNoticeText?.active) {
      return;
    }

    this.storeNoticeTween?.stop();
    this.storeNoticeText.setText(message);
    this.storeNoticeText.setColor(color);
    this.storeNoticeText.setStroke(stroke, 3);
    this.storeNoticeText.setAlpha(1);

    this.storeNoticeTween = this.tweens.add({
      targets: this.storeNoticeText,
      alpha: 0,
      y: this.storeNoticeText.y - 12,
      duration: 1150,
      ease: "Sine.Out",
      onComplete: () => {
        if (this.storeNoticeText?.active) {
          this.storeNoticeText.setY(138);
        }
      }
    });
  }

  attemptPurchase(item) {
    if (item.type === "weapon") {
      if (!this.isWeaponOwned(item.weaponId)) {
        this.attemptBasePurchase(item, () => {
          this.setWeaponOwned(item.weaponId, true);
          this.showStoreNotice(`PURCHASED ${item.name}`, "#b2ffd9", "#04291a");
        });
        return;
      }
      this.attemptWeaponMagazineUpgrade(item.weaponId);
      return;
    }

    if (item.type === "vest") {
      if (this.registry.get("hasCeramicVest")) {
        this.showStoreNotice("CERAMIC VEST ALREADY OWNED", "#b2ffd9", "#04291a");
        return;
      }
      this.attemptBasePurchase(item, () => {
        this.registry.set("hasCeramicVest", true);
        this.showStoreNotice("CERAMIC VEST EQUIPPED", "#b2ffd9", "#04291a");
      });
      return;
    }

    if (item.type === "grenade-buy") {
      this.attemptBasePurchase(item, () => {
        this.registry.set("hasGrenadeKit", true);
        const currentGrenades = this.getStoredGrenadeCount();
        const nextGrenades = currentGrenades + 1;
        this.registry.set("playerGrenades", nextGrenades);
        this.showStoreNotice(`PURCHASED GRENADE (+1) | TOTAL: ${nextGrenades}`, "#b2ffd9", "#04291a");
      });
      return;
    }

    if (item.type === "grenade-upgrade") {
      if (!this.registry.get("hasGrenadeKit")) {
        this.showStoreNotice("BUY GRENADE FIRST", "#ffd69b", "#2c1402");
        return;
      }
      this.attemptGrenadeRadiusUpgrade();
    }
  }

  attemptBasePurchase(item, onSuccess) {
    if (this.playerBudget < item.basePrice) {
      this.showStoreNotice("INSUFFICIENT FUNDS", "#ffd69b", "#2c1402");
      return;
    }

    this.playerBudget -= item.basePrice;
    this.registry.set("playerBudget", this.playerBudget);
    this.updateBudgetIndicator();
    onSuccess?.();
    this.refreshStoreCards();
  }

  attemptWeaponMagazineUpgrade(weaponId) {
    const currentLevel = getWeaponMagazineUpgradeLevel(this.registry, weaponId);
    const upgradeCost = getWeaponMagazineUpgradeCost(weaponId, currentLevel);
    if (upgradeCost === null) {
      this.showStoreNotice("MAGAZINE UPGRADE MAXED", "#b2ffd9", "#04291a");
      return;
    }

    if (this.playerBudget < upgradeCost) {
      this.showStoreNotice("INSUFFICIENT FUNDS", "#ffd69b", "#2c1402");
      return;
    }

    this.playerBudget -= upgradeCost;
    this.registry.set("playerBudget", this.playerBudget);
    this.registry.set(WEAPON_MAG_UPGRADE_REGISTRY_KEYS[weaponId], currentLevel + 1);
    this.updateBudgetIndicator();
    this.refreshStoreCards();
    const nextCapacity = getWeaponMaxAmmoCapacity(this.registry, weaponId);
    this.showStoreNotice(`${this.getWeaponDisplayName(weaponId)} MAG UPGRADED | MAX AMMO: ${nextCapacity}`, "#b2ffd9", "#04291a");
  }

  attemptGrenadeRadiusUpgrade() {
    const currentLevel = getGrenadeRadiusUpgradeLevel(this.registry);
    const upgradeCost = getGrenadeRadiusUpgradeCost(currentLevel);
    if (upgradeCost === null) {
      this.showStoreNotice("GRENADE BLAST UPGRADE MAXED", "#b2ffd9", "#04291a");
      return;
    }

    if (this.playerBudget < upgradeCost) {
      this.showStoreNotice("INSUFFICIENT FUNDS", "#ffd69b", "#2c1402");
      return;
    }

    this.playerBudget -= upgradeCost;
    this.registry.set("playerBudget", this.playerBudget);
    this.registry.set(GRENADE_RADIUS_UPGRADE_REGISTRY_KEY, currentLevel + 1);
    this.updateBudgetIndicator();
    this.refreshStoreCards();
    const nextRadius = getGrenadeBlastRadius(this.registry);
    this.showStoreNotice(`GRENADE BLAST UPGRADED | RADIUS: ${nextRadius}`, "#b2ffd9", "#04291a");
  }

  refreshStoreCards() {
    this.storeItems.forEach((item) => {
      const view = this.cardViews[item.key];
      if (!view) {
        return;
      }

      if (item.type === "weapon") {
        this.refreshWeaponCard(item, view);
        return;
      }
      if (item.type === "vest") {
        this.refreshVestCard(item, view);
        return;
      }
      if (item.type === "grenade-buy") {
        this.refreshGrenadeBuyCard(item, view);
        return;
      }
      if (item.type === "grenade-upgrade") {
        this.refreshGrenadeUpgradeCard(item, view);
      }
    });
  }

  refreshWeaponCard(item, view) {
    const owned = this.isWeaponOwned(item.weaponId);
    view.ownedBadge.setVisible(owned);
    if (!owned) {
      view.name.setText(item.name);
      view.description.setText(item.baseDescription);
      view.price.setText(`$${item.basePrice}`);
      view.price.setColor("#baf4ff");
      view.panel.setAlpha(0.92);
      return;
    }

    const level = getWeaponMagazineUpgradeLevel(this.registry, item.weaponId);
    const maxLevel = getWeaponMagazineMaxLevel(item.weaponId);
    const currentCapacity = getWeaponMaxAmmoCapacity(this.registry, item.weaponId);
    const upgradeCost = getWeaponMagazineUpgradeCost(item.weaponId, level);
    const nextCapacity = upgradeCost === null ? currentCapacity : currentCapacity + WEAPON_MAG_UPGRADE_STEP;

    view.name.setText(`${this.getWeaponDisplayName(item.weaponId)} MAG LV.${Math.min(level, maxLevel)}`);
    view.description.setText(
      upgradeCost === null
        ? `MAXED: ${currentCapacity} ammo.`
        : `${currentCapacity} -> ${nextCapacity} ammo\n+${WEAPON_MAG_UPGRADE_STEP} capacity.`
    );
    view.price.setText(upgradeCost === null ? "MAXED" : `$${upgradeCost}`);
    view.price.setColor(upgradeCost === null ? "#93ffc8" : "#baf4ff");
    view.panel.setAlpha(upgradeCost === null ? 0.82 : 0.92);
  }

  refreshVestCard(item, view) {
    const owned = Boolean(this.registry.get("hasCeramicVest"));
    view.ownedBadge.setVisible(owned);
    if (!owned) {
      view.name.setText(item.name);
      view.description.setText(item.baseDescription);
      view.price.setText(`$${item.basePrice}`);
      view.price.setColor("#baf4ff");
      view.panel.setAlpha(0.92);
      return;
    }

    view.name.setText("CERAMIC VEST");
    view.description.setText("EQUIPPED\nIncoming damage reduced by 50%.");
    view.price.setText("OWNED");
    view.price.setColor("#93ffc8");
    view.panel.setAlpha(0.86);
  }

  refreshGrenadeBuyCard(item, view) {
    const owned = Boolean(this.registry.get("hasGrenadeKit"));
    view.ownedBadge.setVisible(false);
    const grenadeCount = this.getStoredGrenadeCount();
    view.name.setText(owned ? "HAND GRENADE STOCK" : item.name);
    view.description.setText(
      owned
        ? `Buy +1 grenade each purchase.\nCurrent stock: ${grenadeCount}.`
        : item.baseDescription
    );
    view.price.setText(`$${item.basePrice}`);
    view.price.setColor("#baf4ff");
    view.panel.setAlpha(0.92);
  }

  refreshGrenadeUpgradeCard(item, view) {
    const owned = Boolean(this.registry.get("hasGrenadeKit"));
    view.ownedBadge.setVisible(false);
    if (!owned) {
      view.name.setText(item.name.toUpperCase());
      view.description.setText("Locked: buy grenade first.");
      view.price.setText("LOCKED");
      view.price.setColor("#ffd69b");
      view.panel.setAlpha(0.82);
      return;
    }

    const level = getGrenadeRadiusUpgradeLevel(this.registry);
    const maxLevel = getGrenadeRadiusMaxLevel();
    const currentRadius = getGrenadeBlastRadius(this.registry);
    const upgradeCost = getGrenadeRadiusUpgradeCost(level);
    const nextRadius = upgradeCost === null ? currentRadius : currentRadius + GRENADE_RADIUS_UPGRADE_STEP;

    view.name.setText(`GRENADE BLAST LV.${Math.min(level, maxLevel)}`);
    view.description.setText(
      upgradeCost === null
        ? `MAXED: radius ${currentRadius}.`
        : `Blast radius: ${currentRadius} -> ${nextRadius}\nBase radius: ${GRENADE_BASE_RADIUS}.`
    );
    view.price.setText(upgradeCost === null ? "MAXED" : `$${upgradeCost}`);
    view.price.setColor(upgradeCost === null ? "#93ffc8" : "#baf4ff");
    view.panel.setAlpha(upgradeCost === null ? 0.82 : 0.92);
  }

  getWeaponDisplayName(weaponId) {
    if (weaponId === "m203") {
      return "M-203";
    }
    if (weaponId === "tavor") {
      return "TAVOR";
    }
    if (weaponId === "mag") {
      return "MAG-58";
    }

    return "WEAPON";
  }

  isWeaponOwned(weaponId) {
    if (weaponId === "m203") {
      return Boolean(this.registry.get("hasM203"));
    }
    if (weaponId === "tavor") {
      return Boolean(this.registry.get("hasTar21"));
    }
    if (weaponId === "mag") {
      return Boolean(this.registry.get("hasMag58"));
    }

    return false;
  }

  setWeaponOwned(weaponId, owned) {
    if (weaponId === "m203") {
      this.registry.set("hasM203", Boolean(owned));
      return;
    }
    if (weaponId === "tavor") {
      this.registry.set("hasTar21", Boolean(owned));
      return;
    }
    if (weaponId === "mag") {
      this.registry.set("hasMag58", Boolean(owned));
    }
  }

  getStoredGrenadeCount() {
    const grenadesFromRegistry = this.registry.get("playerGrenades");
    if (typeof grenadesFromRegistry !== "number" || !Number.isFinite(grenadesFromRegistry)) {
      return 0;
    }

    return Math.max(0, Math.floor(grenadesFromRegistry));
  }

  createBackButton(x, y) {
    const buttonWidth = 278;
    const buttonHeight = 70;
    const container = this.add.container(x, y).setDepth(5);
    const panel = this.add
      .image(buttonWidth * 0.5, buttonHeight * 0.5, "hud-counter-ammo-panel")
      .setDisplaySize(buttonWidth, buttonHeight)
      .setAlpha(0.95);
    const label = this.add
      .text(buttonWidth * 0.5, buttonHeight * 0.5, "EXIT", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "29px",
        color: "#e5faff",
        stroke: "#062128",
        strokeThickness: 4
      })
      .setOrigin(0.5, 0.5);
    const hit = this.add
      .rectangle(0, 0, buttonWidth, buttonHeight, 0xffffff, 0.001)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    container.add([panel, label, hit]);

    hit.on("pointerover", () => {
      panel.setAlpha(1);
      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 120,
        ease: "Quad.Out"
      });
    });

    hit.on("pointerout", () => {
      panel.setAlpha(0.94);
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
