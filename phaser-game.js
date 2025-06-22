import { PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_MARGIN, BALL_RADIUS, BALL_SPEED, PADDLE_SPEED } from './constants.js';
import { MainScene } from './scenes/MainScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Phaser 3 Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: 'phaser-game',
    backgroundColor: '#000000',    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
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
const game = new Phaser.Game(config);

// Export for global access if needed
window.phaserGame = game;
