import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { MenuScene } from "../scenes/MenuScene";
import { OperationCenterScene } from "../scenes/OperationCenterScene";
import { StoreScene } from "../scenes/StoreScene";
import { GameScene } from "../scenes/GameScene";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const HUD_PANEL_WIDTH = 0;
export const PLAY_WIDTH = GAME_WIDTH - HUD_PANEL_WIDTH;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#1a1f2b",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, OperationCenterScene, StoreScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
