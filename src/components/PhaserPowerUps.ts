import { 
    POWERUP_SPAWN_CHANCE, 
    POWERUP_MAX, 
    powerUpTypes, 
    BALL_RADIUS, 
    POWERUP_SIZE, 
    POWERUP_DURATION, 
    PLAYGROUND_SPAWN_CHANCE, 
    PLAYGROUND_MAX_POWERUPS, 
    POWERUP_DESPAWN_TIME 
} from '../constants';
import { PowerUpData, PowerUpType } from '../types/GameTypes';
import { PhaserParticles } from './PhaserParticles';

export class PhaserPowerUps {
    private scene: Phaser.Scene;
    private particles: PhaserParticles;
    private activePowerUps: PowerUpData[] = [];
    private powerUpGroup: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, particles: PhaserParticles) {
        this.scene = scene;
        this.particles = particles;
        this.powerUpGroup = this.scene.add.group();
    }

    // Check for ball collision with power-ups
    checkCollisions(balls: Phaser.GameObjects.Arc[], applyPowerUpCallback: (type: string, player: string) => void): void {
        const collidedPowerUps: number[] = [];
          for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUpData = this.activePowerUps[i];
            const powerUpSprite = this.powerUpGroup.children.entries[i] as Phaser.GameObjects.Arc;
            
            if (!powerUpSprite) continue;
            
            for (const ball of balls) {
                // Use slightly larger detection area for star-shaped powerups
                const powerUpTemplate = powerUpTypes.find(p => p.type === powerUpData.type);
                const collisionRadius = powerUpTemplate?.shape === 'star' ? 
                    POWERUP_SIZE / 1.8 : POWERUP_SIZE / 2;
                
                const distance = Phaser.Math.Distance.Between(
                    ball.x, ball.y, 
                    powerUpSprite.x, powerUpSprite.y
                );
                
                if (distance < BALL_RADIUS + collisionRadius) {
                    // Determine which player gets the power-up (based on ball direction)
                    const body = ball.body as Phaser.Physics.Arcade.Body;
                    const player = body.velocity.x > 0 ? 'player1' : 'player2';
                    
                    // Create collection particles before applying power-up
                    this.createCollectionEffect(powerUpData, powerUpSprite.x, powerUpSprite.y);
                    
                    // Apply the power-up effect
                    applyPowerUpCallback(powerUpData.type, player);
                    collidedPowerUps.push(i);
                    break;
                }
            }
        }
        
        // Remove collided power-ups in reverse order to avoid index issues
        collidedPowerUps.sort((a, b) => b - a).forEach(index => {
            this.removePowerUp(index);
        });
    }

    // Create visual effect when powerup is collected
    private createCollectionEffect(powerUp: PowerUpData, x: number, y: number): void {
        const powerUpTemplate = powerUpTypes.find(p => p.type === powerUp.type);
        if (!powerUpTemplate) return;
        
        // Use custom particle configuration if available, or fallback values
        const particleConfig = powerUpTemplate.particles || {
            color: powerUpTemplate.glowColor || `${powerUpTemplate.color}bb`,
            count: 12,
            speedMax: 3
        };
        
        // Create explosion particles
        this.particles.createParticles(x, y, particleConfig.count, {
            speedMin: 1,
            speedMax: particleConfig.speedMax,
            sizeMin: 2,
            sizeMax: 5,
            color: particleConfig.color,
            lifeMin: 25,
            lifeMax: 50,
            spreadAngle: Math.PI * 2 // Full circular explosion
        });
        
        // Create a shockwave effect for special powerups
        if (powerUp.type === 'fury' || powerUp.type === 'multiball') {
            const shockwaveColor = powerUp.type === 'fury' ? 
                'rgba(255, 50, 20, 0.6)' : 'rgba(255, 150, 50, 0.6)';
            
            this.particles.createShockwave(
                x, y,
                POWERUP_SIZE * 1.2,
                POWERUP_SIZE * 4,
                shockwaveColor
            );
        }
    }

    // Spawn power-ups with intensity-based probabilities
    spawnPowerUps(canvasWidth: number, canvasHeight: number, dangerMode: boolean, gameState: any, deltaTime: number): void {
        // Remove power-ups that have existed longer than the despawn time
        const now = Date.now();
        this.removeExpiredPowerUps(now);
        
        let spawnChance = gameState.playgroundMode ? PLAYGROUND_SPAWN_CHANCE : POWERUP_SPAWN_CHANCE;
        let maxPowerups = gameState.playgroundMode ? PLAYGROUND_MAX_POWERUPS : POWERUP_MAX;
        
        // Increase spawn chance in danger mode (only in normal mode)
        if (dangerMode && !gameState.playgroundMode) {
            spawnChance *= 1.5;
        }
        
        if (Math.random() < spawnChance && this.activePowerUps.length < maxPowerups && 
            !(gameState.playgroundMode && gameState.playgroundPowerUpIndex === -1)) {
            
            // Choose power-up type based on mode
            let powerUpIndex: number;
            if (gameState.playgroundMode) {
                powerUpIndex = gameState.playgroundPowerUpIndex;
            } else if (dangerMode && Math.random() < 0.2) {
                // In danger mode, 20% chance for fury power-up
                powerUpIndex = powerUpTypes.findIndex(p => p.type === 'fury');
            } else {
                // Normal random selection with reduced chance for fury
                do {
                    powerUpIndex = Math.floor(Math.random() * powerUpTypes.length);
                } while (powerUpTypes[powerUpIndex].type === 'fury' && Math.random() > 0.05);
            }
            
            // Get the powerup template
            const powerUpTemplate = powerUpTypes[powerUpIndex];
            
            // Find a position that isn't too close to other powerups
            const position = this.findValidPosition(canvasWidth, canvasHeight);
            if (position) {
                this.createPowerUp(powerUpTemplate, position.x, position.y);
            }
        }
        
        // Update existing powerups
        this.updatePowerUps(deltaTime);
    }

    private removeExpiredPowerUps(currentTime: number): void {
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            if (currentTime - powerUp.createdAt >= POWERUP_DESPAWN_TIME) {
                this.removePowerUp(i);
            }
        }
    }

    private findValidPosition(canvasWidth: number, canvasHeight: number): { x: number; y: number } | null {
        const MIN_DISTANCE = POWERUP_SIZE * 2.5;
        let attempts = 0;
        
        while (attempts < 15) {
            const x = Math.random() * (canvasWidth - 200) + 100;
            const y = Math.random() * (canvasHeight - 100) + 50;
              // Check distance from other powerups
            let validPosition = true;
            for (let i = 0; i < this.activePowerUps.length; i++) {
                const existing = this.powerUpGroup.children.entries[i] as Phaser.GameObjects.Arc;
                if (existing) {
                    const dist = Phaser.Math.Distance.Between(x, y, existing.x, existing.y);
                    if (dist < MIN_DISTANCE) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            attempts++;
        }
        
        return null;
    }

    private createPowerUp(template: PowerUpType, x: number, y: number): void {
        // Create the power-up sprite
        const powerUpSprite = this.scene.add.circle(x, y, POWERUP_SIZE / 2, 
            Phaser.Display.Color.HexStringToColor(template.color).color);
        
        // Add physics body
        this.scene.physics.add.existing(powerUpSprite);
        const body = powerUpSprite.body as Phaser.Physics.Arcade.Body;
        body.setCircle(POWERUP_SIZE / 2);
        body.setImmovable(true);
        
        // Add to group
        this.powerUpGroup.add(powerUpSprite);
        
        // Create power-up data
        const powerUpData: PowerUpData = {
            type: template.type,
            createdAt: Date.now()
        };
        
        this.activePowerUps.push(powerUpData);
        
        // Create spawn particles effect
        this.particles.createParticles(x, y, 8, {
            speedMin: 0.5,
            speedMax: 2,
            sizeMin: 1,
            sizeMax: 3,
            color: template.glowColor || `${template.color}aa`,
            lifeMin: 20,
            lifeMax: 35,
            spreadAngle: Math.PI * 2
        });
        
        // Create spawn shockwave
        this.particles.createShockwave(
            x, y,
            POWERUP_SIZE / 2,
            POWERUP_SIZE * 2,
            template.glowColor || `${template.color}88`
        );
        
        // Add spawn animation and hovering effect
        this.addPowerUpAnimations(powerUpSprite);
    }

    private addPowerUpAnimations(sprite: Phaser.GameObjects.Arc): void {
        // Spawn animation
        sprite.setScale(0);
        this.scene.tweens.add({
            targets: sprite,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Hovering animation
        this.scene.tweens.add({
            targets: sprite,
            y: sprite.y - 5,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Rotation animation
        this.scene.tweens.add({
            targets: sprite,
            rotation: Math.PI * 2,
            duration: 3000 + Math.random() * 2000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    private updatePowerUps(deltaTime: number): void {
        // Power-ups are updated through Phaser's tween system
        // Additional update logic can be added here if needed
    }

    private removePowerUp(index: number): void {
        if (index >= 0 && index < this.activePowerUps.length) {
            // Remove from data array
            this.activePowerUps.splice(index, 1);
            
            // Remove sprite from group
            const sprite = this.powerUpGroup.children.entries[index];
            if (sprite) {
                this.powerUpGroup.remove(sprite);
                sprite.destroy();
            }
        }
    }

    // Apply power-up effect to a player (this would be handled by the main scene)
    static applyPowerUp(type: string, player: string, gameState: any): void {
        const opponent = player === 'player1' ? 'player2' : 'player1';
        
        // Create effect indicator (would need UI system integration)
        const effectId = `${player}-${type}-${Date.now()}`;
        
        // Apply effects based on type
        switch(type) {
            case 'speedUp':
                if (player === 'player1') gameState.player1PaddleSpeed += 3;
                else gameState.player2PaddleSpeed += 3;
                break;
            case 'slowDown':
                if (opponent === 'player1') gameState.player1PaddleSpeed = Math.max(3, gameState.player1PaddleSpeed - 3);
                else gameState.player2PaddleSpeed = Math.max(3, gameState.player2PaddleSpeed - 3);
                break;
            case 'growPaddle':
                if (player === 'player1') gameState.player1PaddleHeight += 40;
                else gameState.player2PaddleHeight += 40;
                break;
            case 'shrinkPaddle':
                if (opponent === 'player1') gameState.player1PaddleHeight = Math.max(30, gameState.player1PaddleHeight - 30);
                else gameState.player2PaddleHeight = Math.max(30, gameState.player2PaddleHeight - 30);
                break;
            case 'fastBall':
                gameState.balls.forEach((ball: Phaser.GameObjects.Arc) => {
                    const body = ball.body as Phaser.Physics.Arcade.Body;
                    body.setVelocity(body.velocity.x * 1.3, body.velocity.y * 1.3);
                });
                break;
            case 'multiball':
                // Add a new ball with similar properties to the existing one
                if (gameState.balls.length > 0) {
                    const templateBall = gameState.balls[0];
                    const templateBody = templateBall.body as Phaser.Physics.Arcade.Body;
                    
                    const newBall = gameState.scene.add.circle(
                        gameState.scene.cameras.main.width / 2,
                        gameState.scene.cameras.main.height / 2,
                        BALL_RADIUS,
                        0xffffff
                    );
                    
                    gameState.scene.physics.add.existing(newBall);
                    const newBody = newBall.body as Phaser.Physics.Arcade.Body;
                    newBody.setCircle(BALL_RADIUS);
                    newBody.setBounce(1, 1);
                    newBody.setVelocity(-templateBody.velocity.x, Math.random() * 200 - 100);
                    
                    gameState.balls.push(newBall);
                }
                break;
            case 'fury':
                // Fury mode - multiple intense effects
                if (player === 'player1') {
                    gameState.player1PaddleHeight += 30;
                    gameState.player1PaddleSpeed += 4;
                } else {
                    gameState.player2PaddleHeight += 30;
                    gameState.player2PaddleSpeed += 4;
                }
                
                // Increase all ball speeds dramatically
                gameState.balls.forEach((ball: Phaser.GameObjects.Arc) => {
                    const body = ball.body as Phaser.Physics.Arcade.Body;
                    body.setVelocity(body.velocity.x * 1.4, body.velocity.y * 1.4);
                });
                
                // Add screen shake for dramatic effect
                if (gameState.applyScreenShake) {
                    gameState.applyScreenShake();
                }
                break;
            case 'curveShot':
                // Apply curve effect to all balls
                gameState.balls.forEach((ball: any) => {
                    ball.curveActive = true;
                    ball.curveStartTime = Date.now();
                });
                break;
        }
        
        // Store effect for later removal
        if (!gameState.activeEffects) gameState.activeEffects = {};
        if (!gameState.activeEffects[player]) gameState.activeEffects[player] = {};
        gameState.activeEffects[player][effectId] = { type };
        
        // Remove effect after duration
        setTimeout(() => {
            PhaserPowerUps.removeEffect(player, effectId, gameState);
        }, POWERUP_DURATION);
    }

    // Remove an active effect
    static removeEffect(player: string, effectId: string, gameState: any): void {
        if (!gameState.activeEffects?.[player]?.[effectId]) return;
        
        const effect = gameState.activeEffects[player][effectId];
        const type = effect.type;
        const opponent = player === 'player1' ? 'player2' : 'player1';
        
        // Revert changes based on effect type
        switch(type) {
            case 'speedUp':
                if (player === 'player1') gameState.player1PaddleSpeed = gameState.PADDLE_SPEED || 6;
                else gameState.player2PaddleSpeed = gameState.PADDLE_SPEED || 6;
                break;
            case 'slowDown':
                if (opponent === 'player1') gameState.player1PaddleSpeed = gameState.PADDLE_SPEED || 6;
                else gameState.player2PaddleSpeed = gameState.PADDLE_SPEED || 6;
                break;
            case 'growPaddle':
                if (player === 'player1') gameState.player1PaddleHeight = gameState.PADDLE_HEIGHT || 100;
                else gameState.player2PaddleHeight = gameState.PADDLE_HEIGHT || 100;
                break;
            case 'shrinkPaddle':
                if (opponent === 'player1') gameState.player1PaddleHeight = gameState.PADDLE_HEIGHT || 100;
                else gameState.player2PaddleHeight = gameState.PADDLE_HEIGHT || 100;
                break;
            case 'fury':
                if (player === 'player1') {
                    gameState.player1PaddleHeight = gameState.PADDLE_HEIGHT || 100;
                    gameState.player1PaddleSpeed = gameState.PADDLE_SPEED || 6;
                } else {
                    gameState.player2PaddleHeight = gameState.PADDLE_HEIGHT || 100;
                    gameState.player2PaddleSpeed = gameState.PADDLE_SPEED || 6;
                }
                break;
        }
        
        delete gameState.activeEffects[player][effectId];
    }

    // Reset power-ups system
    reset(): void {
        this.activePowerUps = [];
        this.powerUpGroup.clear(true, true);
    }

    // Get active power-ups for external access
    getActivePowerUps(): PowerUpData[] {
        return this.activePowerUps;
    }
}
