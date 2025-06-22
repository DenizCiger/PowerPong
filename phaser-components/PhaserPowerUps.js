import * as Constants from '../constants.js';

export class PhaserPowerUps {
    constructor(scene) {
        this.scene = scene;
        this.powerUpTypes = [
            {
                type: 'speedUp',
                name: 'Speed Boost',
                color: 0x00ff00,
                glowColor: 0x88ff88,
                icon: '⚡',
                description: 'Increases paddle speed'
            },
            {
                type: 'bigPaddle',
                name: 'Big Paddle',
                color: 0x0080ff,
                glowColor: 0x88c0ff,
                icon: '🏓',
                description: 'Increases paddle size'
            },
            {
                type: 'slowOpponent',
                name: 'Slow Opponent',
                color: 0xff8000,
                glowColor: 0xffc088,
                icon: '🐌',
                description: 'Slows down opponent paddle'
            },
            {
                type: 'smallOpponentPaddle',
                name: 'Shrink Opponent',
                color: 0xff0080,
                glowColor: 0xff88c0,
                icon: '🔽',
                description: 'Shrinks opponent paddle'
            },
            {
                type: 'multiball',
                name: 'Multi Ball',
                color: 0xff4444,
                glowColor: 0xff8888,
                icon: '⚾',
                description: 'Spawns additional balls'
            },
            {
                type: 'teleport',
                name: 'Teleport Ball',
                color: 0x8000ff,
                glowColor: 0xc088ff,
                icon: '🌀',
                description: 'Teleports ball to random position'
            },
            {
                type: 'freeze',
                name: 'Freeze Ball',
                color: 0x00ffff,
                glowColor: 0x88ffff,
                icon: '❄️',
                description: 'Temporarily freezes the ball'
            },
            {
                type: 'fury',
                name: 'Fury Mode',
                color: 0xff0000,
                glowColor: 0xff6666,
                icon: '🔥',
                description: 'Greatly increases ball speed'
            }
        ];
    }

    spawnPowerUp(x, y, type = null) {
        // Choose random type if not specified
        if (type === null) {
            type = Phaser.Math.RND.pick(this.powerUpTypes);
        } else if (typeof type === 'number') {
            type = this.powerUpTypes[type];
        }

        // Create power-up visual
        const powerUp = this.scene.add.group();
        
        // Main power-up body
        const body = this.scene.add.circle(x, y, Constants.POWERUP_SIZE / 2, type.color);
        body.setStrokeStyle(2, type.glowColor);
        
        // Add glow effect
        const glow = this.scene.add.circle(x, y, Constants.POWERUP_SIZE / 2 + 5, type.glowColor, 0.3);
        
        // Add icon text
        const icon = this.scene.add.text(x, y, type.icon, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Group all elements
        powerUp.add(glow);
        powerUp.add(body);
        powerUp.add(icon);
        
        // Add physics
        this.scene.physics.add.existing(body);
        body.body.setCircle(Constants.POWERUP_SIZE / 2);
        
        // Store power-up data
        body.powerUpData = {
            type: type.type,
            name: type.name,
            description: type.description,
            color: type.color,
            glowColor: type.glowColor,
            createdAt: Date.now(),
            group: powerUp,
            glow: glow,
            icon: icon
        };
        
        // Add floating animation
        this.scene.tweens.add({
            targets: [body, glow, icon],
            y: y - 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add rotation to icon
        this.scene.tweens.add({
            targets: icon,
            rotation: Math.PI * 2,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Add pulsing glow
        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        return body;
    }

    checkPowerUpCollisions(balls, activePowerUps) {
        const collidedPowerUps = [];
        
        balls.forEach(ball => {
            activePowerUps.forEach((powerUp, index) => {
                if (!powerUp.powerUpData) return;
                  const distance = Phaser.Math.Distance.Between(
                    ball.x, ball.y,
                    powerUp.x, powerUp.y
                );
                
                if (distance < Constants.BALL_RADIUS + Constants.POWERUP_SIZE / 2) {
                    // Collision detected
                    collidedPowerUps.push({ index, powerUp, ball });
                }
            });
        });
        
        // Process collisions in reverse order to avoid index issues
        collidedPowerUps.reverse().forEach(({ index, powerUp, ball }) => {
            this.collectPowerUp(powerUp, ball);
            activePowerUps.splice(index, 1);
        });
        
        return activePowerUps;
    }

    collectPowerUp(powerUp, ball) {
        const data = powerUp.powerUpData;
        
        // Create collection effect
        this.scene.particleSystem.createPowerUpCollectionParticles(
            powerUp.x, powerUp.y, data.glowColor
        );
        
        // Apply power-up effect
        this.applyPowerUp(data.type, ball);
        
        // Show notification
        this.showPowerUpNotification(data.name, data.description);
        
        // Destroy power-up visual
        data.group.destroy(true);
    }

    applyPowerUp(type, ball) {
        const scene = this.scene;
        
        switch (type) {
            case 'speedUp':
                // Increase paddle speed for the player who hit the ball
                const player = ball.body.velocity.x > 0 ? 'player2' : 'player1';
                this.addEffect(player, 'speedUp', Constants.POWERUP_DURATION);
                break;
                
            case 'bigPaddle':
                const bigPlayer = ball.body.velocity.x > 0 ? 'player2' : 'player1';
                this.addEffect(bigPlayer, 'bigPaddle', Constants.POWERUP_DURATION);
                break;
                
            case 'slowOpponent':
                const slowTarget = ball.body.velocity.x > 0 ? 'player1' : 'player2';
                this.addEffect(slowTarget, 'slow', Constants.POWERUP_DURATION);
                break;
                
            case 'smallOpponentPaddle':
                const shrinkTarget = ball.body.velocity.x > 0 ? 'player1' : 'player2';
                this.addEffect(shrinkTarget, 'smallPaddle', Constants.POWERUP_DURATION);
                break;
                
            case 'multiball':
                this.createMultiBall(ball);
                break;
                
            case 'teleport':
                this.teleportBall(ball);
                break;
                
            case 'freeze':
                this.freezeBall(ball);
                break;
                
            case 'fury':
                this.furyMode(ball);
                break;
        }
    }

    addEffect(player, effectType, duration) {
        const paddle = player === 'player1' ? this.scene.player1Paddle : this.scene.player2Paddle;
        const effectId = `${player}-${effectType}-${Date.now()}`;
        
        // Apply effect
        switch (effectType) {
            case 'speedUp':
                paddle.speedMultiplier = (paddle.speedMultiplier || 1) * 1.5;
                break;
            case 'bigPaddle':
                paddle.displayHeight *= 1.5;
                paddle.body.setSize(paddle.width, paddle.displayHeight);
                break;
            case 'slow':
                paddle.speedMultiplier = (paddle.speedMultiplier || 1) * 0.5;
                break;
            case 'smallPaddle':
                paddle.displayHeight *= 0.7;
                paddle.body.setSize(paddle.width, paddle.displayHeight);
                break;
        }
        
        // Store effect for removal
        this.scene.activeEffects[player][effectId] = {
            type: effectType,
            paddle: paddle,
            originalValue: this.getOriginalValue(effectType, paddle)
        };
        
        // Remove effect after duration
        this.scene.time.delayedCall(duration, () => {
            this.removeEffect(player, effectId);
        });
        
        // Update UI effect indicator
        this.updateEffectUI(player, effectType, duration);
    }

    removeEffect(player, effectId) {
        const effect = this.scene.activeEffects[player][effectId];
        if (!effect) return;
        
        const paddle = effect.paddle;
        
        // Revert effect
        switch (effect.type) {
            case 'speedUp':
            case 'slow':
                paddle.speedMultiplier = effect.originalValue;
                break;
            case 'bigPaddle':
            case 'smallPaddle':
                paddle.displayHeight = effect.originalValue;
                paddle.body.setSize(paddle.width, paddle.displayHeight);
                break;
        }
        
        delete this.scene.activeEffects[player][effectId];
    }

    getOriginalValue(effectType, paddle) {
        switch (effectType) {
            case 'speedUp':
            case 'slow':
                return 1; // Default speed multiplier
            case 'bigPaddle':
            case 'smallPaddle':
                return Constants.PADDLE_HEIGHT;
            default:
                return null;
        }
    }

    createMultiBall(originalBall) {
        const scene = this.scene;
        const numBalls = 2; // Create 2 additional balls
        
        for (let i = 0; i < numBalls; i++) {
            const newBall = scene.add.circle(
                originalBall.x + (Math.random() - 0.5) * 50,
                originalBall.y + (Math.random() - 0.5) * 50,
                Constants.BALL_RADIUS,
                0xffffff
            );
            
            scene.physics.add.existing(newBall);
            
            // Set random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = Constants.BALL_SPEED;
            newBall.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            // Add collision detection
            scene.physics.add.collider(newBall, scene.player1Paddle, (ball, paddle) => {
                scene.handlePaddleHit(1, ball, paddle);
            });
            scene.physics.add.collider(newBall, scene.player2Paddle, (ball, paddle) => {
                scene.handlePaddleHit(2, ball, paddle);
            });
            
            scene.balls.push(newBall);
        }
    }

    teleportBall(ball) {
        // Create teleport effect at current position
        this.scene.particleSystem.createTeleportEffect(ball.x, ball.y);
        
        // Teleport ball to random position
        const newX = Phaser.Math.Between(
            this.scene.cameras.main.width * 0.3,
            this.scene.cameras.main.width * 0.7
        );
        const newY = Phaser.Math.Between(50, this.scene.cameras.main.height - 50);
        
        ball.x = newX;
        ball.y = newY;
        
        // Create teleport effect at new position
        this.scene.time.delayedCall(100, () => {
            this.scene.particleSystem.createTeleportEffect(ball.x, ball.y);
        });
        
        // Apply screen shake
        this.scene.applyScreenShake();
    }

    freezeBall(ball) {
        // Store original velocity
        const originalVelocity = { x: ball.body.velocity.x, y: ball.body.velocity.y };
        
        // Stop the ball
        ball.body.setVelocity(0, 0);
        
        // Add freeze visual effect
        const freezeEffect = this.scene.add.circle(ball.x, ball.y, Constants.BALL_RADIUS + 10, 0x00ffff, 0.3);
        
        // Animate freeze effect
        this.scene.tweens.add({
            targets: freezeEffect,
            alpha: { from: 0.3, to: 0.8 },
            scale: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                freezeEffect.destroy();
                // Restore ball velocity
                ball.body.setVelocity(originalVelocity.x, originalVelocity.y);
            }
        });
    }

    furyMode(ball) {
        // Multiply ball speed by 2
        const currentSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        const newSpeed = Math.min(currentSpeed * 2, Constants.MAX_BALL_SPEED);
        
        const angle = Math.atan2(ball.body.velocity.y, ball.body.velocity.x);
        ball.body.setVelocity(
            Math.cos(angle) * newSpeed,
            Math.sin(angle) * newSpeed
        );
          // Add fury visual effect to ball
        ball.setFillStyle(0xff0000);
        
        // Remove fury effect after 5 seconds
        this.scene.time.delayedCall(5000, () => {
            ball.setFillStyle(0xffffff); // Reset to white
        });
    }    showPowerUpNotification(name, description) {
        // Use the scene's UI system
        this.scene.uiSystem.showNotification(
            `${name}: ${description}`,
            'rgba(100, 200, 100, 0.8)'
        );
    }

    updateEffectUI(player, effectType, duration) {
        // Use the scene's UI system for in-game effects
        this.scene.uiSystem.createEffectIndicator(player, effectType, duration);
        
        // Also update HTML UI elements for compatibility
        const effectsEl = document.getElementById(`${player}-effects`);
        if (!effectsEl) return;
        
        const effectDiv = document.createElement('div');
        effectDiv.className = 'effect-indicator';
        effectDiv.style.backgroundColor = this.getEffectColor(effectType);
        effectDiv.textContent = this.getEffectSymbol(effectType);
        effectDiv.title = this.getEffectDescription(effectType);
        
        effectsEl.appendChild(effectDiv);
        
        // Remove after duration
        setTimeout(() => {
            if (effectDiv.parentNode) {
                effectDiv.parentNode.removeChild(effectDiv);
            }
        }, duration);
    }

    getEffectColor(effectType) {
        const colors = {
            speedUp: '#00ff00',
            bigPaddle: '#0080ff',
            slow: '#ff8000',
            smallPaddle: '#ff0080'
        };
        return colors[effectType] || '#ffffff';
    }

    getEffectSymbol(effectType) {
        const symbols = {
            speedUp: '⚡',
            bigPaddle: '🏓',
            slow: '🐌',
            smallPaddle: '🔽'
        };
        return symbols[effectType] || '?';
    }

    getEffectDescription(effectType) {
        const descriptions = {
            speedUp: 'Increased paddle speed',
            bigPaddle: 'Bigger paddle',
            slow: 'Reduced paddle speed',
            smallPaddle: 'Smaller paddle'
        };
        return descriptions[effectType] || 'Unknown effect';
    }
}
