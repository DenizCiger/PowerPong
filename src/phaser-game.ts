// Power Pong - TypeScript Entry Point
import Phaser from 'phaser';
import {
    PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_MARGIN, 
    BALL_RADIUS, BALL_SPEED, PADDLE_SPEED 
} from './constants';

// Import scenes - we'll convert these gradually
import { MainScene } from './scenes/MainScene';
import { MenuScene } from './scenes/MenuScene';
import { GameOverScene } from './scenes/GameOverScene';

// Phaser 3 Game Configuration with full TypeScript support
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: 'phaser-game',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: false,
            fps: 60,
            fixedStep: false
        }
    },
    scene: [MainScene, MenuScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create the Phaser game instance
const game: Phaser.Game = new Phaser.Game(config);

// Export for global access if needed
declare global {
    interface Window {
        phaserGame: Phaser.Game;
    }
}

window.phaserGame = game;

export { game };
