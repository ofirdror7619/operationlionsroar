import Phaser from "phaser";
import { PLAY_WIDTH } from "../game/config";
import { UI_MOTION } from "../game/uiTokens";

const UI_DISPLAY_FONT = "'Oxanium', 'Barlow Condensed', sans-serif";
const UI_BODY_FONT = "'Share Tech Mono', 'Chakra Petch', monospace";

export class StoreScene extends Phaser.Scene {
  constructor() {
    super("store");
    this.playerBudget = 0;
    this.budgetText = null;
    this.storeNoticeText = null;
    this.storeNoticeTween = null;
  }

  create() {
    const { height } = this.scale;
    const playWidth = PLAY_WIDTH;
    const centerX = playWidth * 0.5;
    const budgetFromRegistry = this.registry.get("playerBudget");
    if (typeof budgetFromRegistry === "number" && Number.isFinite(budgetFromRegistry)) {
      this.playerBudget = Math.max(0, Math.floor(budgetFromRegistry));
    } else {
      this.playerBudget = 1300;
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

    this.input.keyboard.on("keydown-ESC", () => this.backToOperationCenter());
    this.input.keyboard.on("keydown-BACKSPACE", () => this.backToOperationCenter());
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
    const offerings = [
      { key: "store-item-m203", name: "M-203 Rifle", price: 1000, description: "Has grenade launcher." },
      {
        key: "store-item-mag",
        name: "FN-MAG-58 Machine Gun",
        price: 5000,
        description: "Shoots automatically with awesome firepower."
      },
      { key: "store-item-tavor", name: "Tavor TAR-21", price: 3000, description: "Has a bigger hit radius." },
      { key: "store-item-grenade", name: "Hand Grenade", price: 100, description: "Single-use explosive." }
    ];

    const slots = this.getStoreSlots(centerX, height, offerings.length);
    offerings.forEach((item, index) => {
      const slot = slots[index];
      const card = this.add.container(slot.x, slot.y).setDepth(4);
      const panel = this.add
        .image(0, 0, "hud-counter-ammo-panel")
        .setDisplaySize(280, 156)
        .setAlpha(0.92);
      const panelSweep = this.add
        .rectangle(-88, 0, 70, 132, 0x86f8ff, 0.07)
        .setBlendMode(Phaser.BlendModes.ADD);
      const accent = this.add
        .rectangle(-92, -2, 80, 124, 0x83f8ff, 0.06)
        .setDepth(1);
      const image = this.add.image(0, -16, item.key);
      const maxItemWidth = 248;
      const maxItemHeight = 100;
      const fitScale = Math.min(maxItemWidth / image.width, maxItemHeight / image.height);
      image.setScale(fitScale);
      const priceTag = this.add
        .image(0, 58, "hud-counter-grenade-panel")
        .setDisplaySize(154, 34)
        .setAlpha(0.96);
      const name = this.add
        .text(0, -62, item.name, {
          fontFamily: UI_BODY_FONT,
          fontSize: "18px",
          color: "#c9f8ff",
          stroke: "#03141a",
          strokeThickness: 2,
          letterSpacing: 1
        })
        .setOrigin(0.5);
      const description = this.add
        .text(0, 28, item.description ?? "", {
          fontFamily: UI_BODY_FONT,
          fontSize: "14px",
          color: "#9fd6de",
          stroke: "#021015",
          strokeThickness: 2,
          align: "center",
          wordWrap: { width: 236, useAdvancedWrap: true }
        })
        .setOrigin(0.5, 0.5);
      const price = this.add
        .text(0, 58, `$${item.price}`, {
          fontFamily: UI_DISPLAY_FONT,
          fontSize: "22px",
          color: "#baf4ff",
          stroke: "#03141a",
          strokeThickness: 3,
          letterSpacing: 2
        })
        .setOrigin(0.5);
      const hit = this.add
        .zone(0, 0, 280, 156)
        .setInteractive({ useHandCursor: true });

      card.add([panel, panelSweep, accent, image, priceTag, name, description, price, hit]);

      this.tweens.add({
        targets: panelSweep,
        x: 88,
        duration: UI_MOTION.counterSweepFastMs,
        yoyo: true,
        repeat: -1,
        ease: UI_MOTION.easePulse
      });

      hit.on("pointerover", () => {
        this.tweens.add({
          targets: card,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 110,
          ease: "Quad.Out"
        });
      });

      hit.on("pointerout", () => {
        this.tweens.add({
          targets: card,
          scaleX: 1,
          scaleY: 1,
          duration: 130,
          ease: "Quad.Out"
        });
      });

      hit.on("pointerup", () => this.attemptPurchase(item));
    });
  }

  getStoreSlots(centerX, height, itemCount) {
    if (itemCount <= 3) {
      const spacing = 302;
      const startX = centerX - ((itemCount - 1) * spacing) * 0.5;
      return Array.from({ length: itemCount }, (_value, index) => ({
        x: startX + index * spacing,
        y: height * 0.57
      }));
    }

    const xOffset = 172;
    const cardHeight = 156;
    const rowGap = 22;
    const centerY = height * 0.57;
    const rowDistance = cardHeight + rowGap;
    const topY = centerY - rowDistance * 0.5;
    const bottomY = centerY + rowDistance * 0.5;
    return [
      { x: centerX - xOffset, y: topY },
      { x: centerX + xOffset, y: topY },
      { x: centerX - xOffset, y: bottomY },
      { x: centerX + xOffset, y: bottomY }
    ].slice(0, itemCount);
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
    if (item.key === "store-item-m203" && this.registry.get("hasM203")) {
      this.showStoreNotice("M-203 ALREADY OWNED", "#b2ffd9", "#04291a");
      return;
    }
    if (item.key === "store-item-mag" && this.registry.get("hasMag58")) {
      this.showStoreNotice("FN-MAG-58 ALREADY OWNED", "#b2ffd9", "#04291a");
      return;
    }
    if (item.key === "store-item-tavor" && this.registry.get("hasTar21")) {
      this.showStoreNotice("TAVOR TAR-21 ALREADY OWNED", "#b2ffd9", "#04291a");
      return;
    }

    if (this.playerBudget < item.price) {
      this.showStoreNotice("INSUFFICIENT FUNDS", "#ffd69b", "#2c1402");
      return;
    }

    this.playerBudget -= item.price;
    this.registry.set("playerBudget", this.playerBudget);

    if (item.key === "store-item-m203") {
      this.registry.set("hasM203", true);
    } else if (item.key === "store-item-mag") {
      this.registry.set("hasMag58", true);
    } else if (item.key === "store-item-tavor") {
      this.registry.set("hasTar21", true);
    } else if (item.key === "store-item-grenade") {
      const currentGrenades = this.getStoredGrenadeCount();
      this.registry.set("playerGrenades", currentGrenades + 1);
    }

    this.updateBudgetIndicator();
    if (item.key === "store-item-grenade") {
      const totalGrenades = this.getStoredGrenadeCount();
      this.showStoreNotice(`PURCHASED GRENADE (+1) | TOTAL: ${totalGrenades}`, "#b2ffd9", "#04291a");
      return;
    }

    this.showStoreNotice(`PURCHASED ${item.name}`, "#b2ffd9", "#04291a");
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
