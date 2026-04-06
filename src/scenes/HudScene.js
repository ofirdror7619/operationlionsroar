import Phaser from "phaser";
import { HUD_PANEL_WIDTH, PLAY_WIDTH } from "../game/config";
import { UI_LAYOUT, UI_MOTION } from "../game/uiTokens";

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
  textMain: "#d8fff9",
  textStroke: "#031016",
  label: "#79d6cb",
  body: "#baf7ec",
  buttonFill: 0x1d9d8f,
  buttonHover: 0x28bda9,
  buttonStroke: 0x8afff2,
  buttonText: "#041915",
  boxFill: 0x051015,
  boxStroke: 0x36b8b2
};

export class HudScene extends Phaser.Scene {
  constructor() {
    super("hud");
    this.crosshair = null;
    this.scoreText = null;
    this.ammoText = null;
    this.grenadeText = null;
    this.healthText = null;
    this.livesText = null;
    this.lifeBarSprite = null;
    this.lifeBarSourceWidth = 0;
    this.lifeBarSourceHeight = 0;
    this.lifeBarTileCount = 20;
    this.healthLaneWidth = 54;
    this.statsTopOffset = -24;
    this.livesRowOffset = 10;
    this.contentLeft = 0;
    this.contentRight = 0;
    this.contentCenterX = 0;
    this.contentValueX = 0;
    this.gameOverText = null;
    this.weaponImage = null;
    this.weaponNameText = null;
    this.continueButton = null;
    this.continueButtonLabel = null;
    this.continueButtonHoverTween = null;
    this.gameSceneRef = null;
    this.hudUpdateHandler = null;
    this.hudGameOverHandler = null;
    this.hudLevelCompleteHandler = null;
  }

  create() {
    this.createPanel();
    this.createCrosshair();
    this.createWeaponCard();
    this.createBottomResourceCounters();
    const valueTextStyle = this.getTextStyle("21px");
    this.scoreText = this.add.text(this.contentValueX, 290 + this.statsTopOffset, "0", valueTextStyle).setOrigin(1, 0);
    this.healthText = this.add.text(this.contentValueX, 482 + this.statsTopOffset, "100", valueTextStyle).setOrigin(1, 0);
    this.livesText = this.add
      .text(this.contentValueX, 522 + this.statsTopOffset + this.livesRowOffset, "3", valueTextStyle)
      .setOrigin(1, 0);
    this.createLifeBar();
    this.gameOverText = this.add
      .text(PLAY_WIDTH / 2, this.scale.height / 2, "MISSION FAILED\nClick to retry", {
        ...this.getTextStyle("44px"),
        fontSize: "44px",
        align: "center"
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.continueButton = this.add
      .rectangle(PLAY_WIDTH / 2, this.scale.height / 2 + 84, 300, 54, UI_COLORS.buttonFill, 0.98)
      .setStrokeStyle(1, UI_COLORS.buttonStroke, 0.92)
      .setDepth(100)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.continueButtonLabel = this.add
      .text(this.continueButton.x, this.continueButton.y, "CONTINUE", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "34px",
        color: UI_COLORS.buttonText,
        letterSpacing: 3
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(false);

    this.continueButton.on("pointerover", () => {
      if (this.continueButton?.visible) {
        this.continueButtonHoverTween?.stop();
        this.continueButton.setFillStyle(UI_COLORS.buttonHover, 1);
        this.continueButtonHoverTween = this.tweens.add({
          targets: [this.continueButton, this.continueButtonLabel].filter(Boolean),
          scaleX: 1.05,
          scaleY: 1.05,
          duration: UI_MOTION.hoverInMs,
          ease: UI_MOTION.easeHover
        });
      }
    });
    this.continueButton.on("pointerout", () => {
      if (this.continueButton?.visible) {
        this.continueButtonHoverTween?.stop();
        this.continueButton.setFillStyle(UI_COLORS.buttonFill, 0.98);
        this.tweens.add({
          targets: [this.continueButton, this.continueButtonLabel].filter(Boolean),
          scaleX: 1,
          scaleY: 1,
          duration: UI_MOTION.hoverOutMs,
          ease: UI_MOTION.easeHover
        });
      }
    });
    this.continueButton.on("pointerdown", () => {
      if (this.continueButton?.visible) {
        this.continueButtonHoverTween?.stop();
        this.tweens.add({
          targets: [this.continueButton, this.continueButtonLabel].filter(Boolean),
          scaleX: 0.97,
          scaleY: 0.97,
          duration: UI_MOTION.pressMs,
          ease: UI_MOTION.easeHover
        });
      }
    });
    this.continueButton.on("pointerup", () => {
      if (!this.continueButton?.visible || !this.gameSceneRef?.events) {
        return;
      }

      this.continueButtonHoverTween?.stop();
      this.tweens.add({
        targets: [this.continueButton, this.continueButtonLabel].filter(Boolean),
        scaleX: 1.03,
        scaleY: 1.03,
        duration: UI_MOTION.tapBounceMs,
        yoyo: true,
        ease: UI_MOTION.easeTap
      });
      this.time.delayedCall(70, () => {
        if (this.gameSceneRef?.events) {
          this.gameSceneRef.events.emit("hud:continue");
        }
      });
    });

    this.cleanupGameEvents();
    this.gameSceneRef = this.scene.get("game");
    this.hudUpdateHandler = (state) => {
      if (!this.scoreText?.active || !this.ammoText?.active || !this.grenadeText?.active || !this.healthText?.active || !this.livesText?.active) {
        return;
      }
      this.scoreText.setText(`${Math.floor(state.score)}`);
      this.ammoText.setText(`${Math.floor(state.ammo)}`);
      this.grenadeText.setText(`x${Math.floor(state.grenades)}`);
      this.healthText.setText(`${Math.floor(state.hp)}`);
      this.livesText.setText(`${Math.floor(state.lives)}`);
      const isMagMode = state.weaponMode === "mag";
      if (this.weaponImage?.active) {
        this.weaponImage.setTexture(isMagMode ? "weapon-mag" : "weapon-m203");
      }
      if (this.weaponNameText?.active) {
        this.weaponNameText.setText(isMagMode ? "FN-MAG-58" : "M-203");
        this.weaponNameText.setFontSize(isMagMode ? 21 : 24);
      }
      this.updateLifeBar(state.hp / state.maxHp);
    };
    this.hudGameOverHandler = () => {
      if (this.gameOverText?.active) {
        this.gameOverText.setText("MISSION FAILED\nClick to retry");
        this.gameOverText.setVisible(true);
      }
      this.continueButton?.setVisible(false);
      this.continueButtonLabel?.setVisible(false);
    };

    this.hudLevelCompleteHandler = () => {
      if (this.gameOverText?.active) {
        this.gameOverText.setText("MISSION COMPLETE\nClick CONTINUE for next challenge");
        this.gameOverText.setVisible(true);
      }
      this.continueButton?.setVisible(true);
      this.continueButtonLabel?.setVisible(true);
    };

    this.gameSceneRef.events.on("hud:update", this.hudUpdateHandler);
    this.gameSceneRef.events.once("hud:gameover", this.hudGameOverHandler);
    this.gameSceneRef.events.once("hud:levelcomplete", this.hudLevelCompleteHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupGameEvents, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupGameEvents, this);
  }

  getTextStyle(size = "24px") {
    return {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: size,
      color: UI_COLORS.textMain,
      stroke: UI_COLORS.textStroke,
      strokeThickness: 3,
      letterSpacing: 1
    };
  }

  createLifeBar() {
    const displayHeight = this.scale.height * 0.64;
    const source = this.textures.get("health-bar").getSourceImage();
    const displayWidth = displayHeight * (source.width / source.height);
    const x = displayWidth * 0.5 + 10;
    const y = this.scale.height * 0.5;

    this.lifeBarSourceWidth = source.width;
    this.lifeBarSourceHeight = source.height;

    this.lifeBarSprite = this.add
      .image(x, y, "health-bar")
      .setDisplaySize(displayWidth, displayHeight)
      .setOrigin(0.5)
      .setDepth(300);
    this.updateLifeBar(1);
  }

  updateLifeBar(normalizedValue) {
    const value = Phaser.Math.Clamp(normalizedValue, 0, 1);
    const visibleTiles = Math.ceil(value * this.lifeBarTileCount);
    const steppedValue = visibleTiles / this.lifeBarTileCount;
    const cropHeight = Math.floor(this.lifeBarSourceHeight * steppedValue);
    const cropY = this.lifeBarSourceHeight - cropHeight;

    if (!this.lifeBarSprite) {
      return;
    }

    if (cropHeight <= 0) {
      this.lifeBarSprite.setVisible(false);
      return;
    }

    this.lifeBarSprite.setVisible(true);
    this.lifeBarSprite.setCrop(0, cropY, this.lifeBarSourceWidth, cropHeight);
  }

  createPanel() {
    const panelLeft = PLAY_WIDTH;
    const panelRight = PLAY_WIDTH + HUD_PANEL_WIDTH;
    const panelCenterX = panelLeft + HUD_PANEL_WIDTH / 2;
    this.contentLeft = panelLeft + 14;
    this.contentRight = panelRight - this.healthLaneWidth - 16;
    this.contentCenterX = (this.contentLeft + this.contentRight) * 0.5;
    this.contentValueX = this.contentRight - 12;

    const bg = this.add.graphics();
    bg.fillGradientStyle(
      UI_COLORS.panelTopLeft,
      UI_COLORS.panelTopRight,
      UI_COLORS.panelBottomLeft,
      UI_COLORS.panelBottomRight,
      1
    );
    bg.fillRect(panelLeft, 0, HUD_PANEL_WIDTH, this.scale.height);

    const frame = this.add.graphics();
    frame.lineStyle(1, UI_COLORS.frameOuter, 0.88);
    frame.strokeRect(panelLeft + 2, 2, HUD_PANEL_WIDTH - 4, this.scale.height - 4);
    frame.lineStyle(1, UI_COLORS.frameInner, 0.8);
    frame.strokeRect(panelLeft + 8, 8, HUD_PANEL_WIDTH - 16, this.scale.height - 16);

    const glow = this.add.graphics();
    glow.fillStyle(UI_COLORS.glow, 0.14);
    glow.fillEllipse(this.contentCenterX, 26, (this.contentRight - this.contentLeft) * 1.05, 54);

    const grid = this.add.graphics();
    grid.lineStyle(1, UI_COLORS.grid, 0.2);
    for (let y = 0; y <= this.scale.height; y += 26) {
      grid.lineBetween(this.contentLeft, y, panelRight - 10, y);
    }
    for (let x = this.contentLeft; x <= panelRight - 10; x += 20) {
      grid.lineBetween(x, 10, x, this.scale.height - 10);
    }

    const sheen = this.add.graphics();
    sheen.fillStyle(0xffffff, 0.04);
    sheen.fillTriangle(panelLeft, 0, panelLeft + HUD_PANEL_WIDTH * 0.46, 0, panelLeft, this.scale.height);

    this.add.text(panelCenterX, 26, "WARZONE VIEW", {
      fontFamily: UI_DISPLAY_FONT,
      fontSize: "31px",
      color: UI_COLORS.textMain,
      stroke: UI_COLORS.textStroke,
      strokeThickness: 4,
      letterSpacing: 2
    }).setOrigin(0.5, 0.5);

    this.add.image(this.contentLeft + 14, 302 + this.statsTopOffset, "icon-score").setScale(0.72);
    this.add.image(this.contentLeft + 14, 494 + this.statsTopOffset, "icon-health").setScale(0.72);
    this.add.image(this.contentLeft + 14, 526 + this.statsTopOffset + this.livesRowOffset, "heart-pickup").setDisplaySize(40, 40);

    this.add.text(this.contentLeft, 266 + this.statsTopOffset, "SCORE", this.getLabelStyle());
    this.add.text(this.contentLeft, 458 + this.statsTopOffset, "HEALTH", this.getLabelStyle());
    this.add.text(this.contentLeft, 498 + this.statsTopOffset + this.livesRowOffset, "LIVES", this.getLabelStyle());
  }

  createBottomResourceCounters() {
    const y = this.scale.height - UI_LAYOUT.bottomHudYInset;
    const resourceIconSize = 68;
    const ammoBox = this.add
      .rectangle(112, y, 206, 62, UI_COLORS.boxFill, 0.88)
      .setStrokeStyle(1, UI_COLORS.boxStroke, 0.78)
      .setDepth(260)
      .setOrigin(0.5);
    this.add.image(44, y, "magazine").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(261);
    this.ammoText = this.add
      .text(82, y, "100", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "40px",
        color: UI_COLORS.textMain,
        stroke: UI_COLORS.textStroke,
        strokeThickness: 4
      })
      .setDepth(261)
      .setOrigin(0, 0.52);

    const grenadeX = PLAY_WIDTH - 88;
    const grenadeBox = this.add
      .rectangle(grenadeX, y, 164, 62, UI_COLORS.boxFill, 0.88)
      .setStrokeStyle(1, UI_COLORS.boxStroke, 0.78)
      .setDepth(260)
      .setOrigin(0.5);
    this.add.image(grenadeX - 52, y, "grenade-pickup").setDisplaySize(resourceIconSize, resourceIconSize).setDepth(261);
    this.grenadeText = this.add
      .text(grenadeX - 14, y, "x3", {
        fontFamily: UI_DISPLAY_FONT,
        fontSize: "40px",
        color: UI_COLORS.textMain,
        stroke: UI_COLORS.textStroke,
        strokeThickness: 4
      })
      .setDepth(261)
      .setOrigin(0, 0.52);
  }

  createCrosshair() {
    this.crosshair = this.add.image(PLAY_WIDTH * 0.5, this.scale.height * 0.5, "scope").setDepth(1000);
    this.crosshair.setScale((PLAY_WIDTH * 0.12) / 128);

    this.input.on("pointermove", (pointer) => {
      const x = Phaser.Math.Clamp(pointer.worldX, 0, PLAY_WIDTH);
      const y = Phaser.Math.Clamp(pointer.worldY, 0, this.scale.height);
      this.crosshair.setPosition(x, y);
    });
  }

  getLabelStyle() {
    return {
      fontFamily: UI_BODY_FONT,
      fontSize: "14px",
      color: UI_COLORS.label,
      stroke: UI_COLORS.textStroke,
      strokeThickness: 2,
      letterSpacing: 1
    };
  }

  createWeaponCard() {
    const topY = 146;
    const contentWidth = this.contentRight - this.contentLeft;
    this.add.text(this.contentLeft, 56, "WEAPON", this.getLabelStyle());
    this.weaponNameText = this.add.text(this.contentLeft, 80, "M-203", this.getTextStyle("24px"));
    this.weaponImage = this.add.image(this.contentCenterX, topY, "weapon-m203").setDisplaySize(contentWidth + 14, 90);
    this.add.text(this.contentLeft, 176, "Right Click:", {
      fontFamily: UI_BODY_FONT,
      fontSize: "12px",
      color: UI_COLORS.body,
      stroke: UI_COLORS.textStroke,
      strokeThickness: 2
    });
    this.add.text(this.contentLeft, 192, "Grenades", {
      fontFamily: UI_BODY_FONT,
      fontSize: "12px",
      color: UI_COLORS.body,
      stroke: UI_COLORS.textStroke,
      strokeThickness: 2
    });
  }

  cleanupGameEvents() {
    if (!this.gameSceneRef?.events) {
      return;
    }

    if (this.hudUpdateHandler) {
      this.gameSceneRef.events.off("hud:update", this.hudUpdateHandler);
    }
    if (this.hudGameOverHandler) {
      this.gameSceneRef.events.off("hud:gameover", this.hudGameOverHandler);
    }
    if (this.hudLevelCompleteHandler) {
      this.gameSceneRef.events.off("hud:levelcomplete", this.hudLevelCompleteHandler);
    }

    this.hudUpdateHandler = null;
    this.hudGameOverHandler = null;
    this.hudLevelCompleteHandler = null;
    this.gameSceneRef = null;
  }
}
