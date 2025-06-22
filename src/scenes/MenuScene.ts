import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        // This will be used for future menu implementation
        // For now, automatically start the main game
        this.scene.start('MainScene');
    }
}
