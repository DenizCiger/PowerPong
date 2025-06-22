export class PhaserUI {
    constructor(scene) {
        this.scene = scene;
        this.notifications = [];
        this.countdownText = null;
    }

    showNotification(message, bgColor = 'rgba(40, 60, 120, 0.7)', duration = 2500) {
        // Remove existing notifications
        this.notifications.forEach(notif => {
            if (notif.container) notif.container.destroy();
        });
        this.notifications = [];

        // Create notification container
        const container = this.scene.add.container(this.scene.cameras.main.width / 2, 50);
        
        // Background
        const bg = this.scene.add.graphics();
        const textStyle = { fontSize: '18px', fill: '#ffffff', align: 'center' };
        const tempText = this.scene.add.text(0, 0, message, textStyle);
        const textBounds = tempText.getBounds();
        tempText.destroy();
        
        const padding = 20;
        const bgWidth = textBounds.width + padding * 2;
        const bgHeight = textBounds.height + padding;
        
        bg.fillStyle(Phaser.Display.Color.HexStringToColor(bgColor.replace('rgba(', '').replace(')', '').split(',')[0]).color);
        bg.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 10);
        
        // Text
        const text = this.scene.add.text(0, 0, message, textStyle).setOrigin(0.5);
        
        container.add([bg, text]);
        
        // Animate in
        container.setAlpha(0);
        container.setScale(0.8);
        
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        // Store notification
        const notification = { container, createdAt: Date.now() };
        this.notifications.push(notification);
        
        // Remove after duration
        this.scene.time.delayedCall(duration, () => {
            if (container && container.scene) {
                this.scene.tweens.add({
                    targets: container,
                    alpha: 0,
                    y: container.y - 30,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => {
                        container.destroy();
                        this.notifications = this.notifications.filter(n => n !== notification);
                    }
                });
            }
        });
        
        return notification;
    }
    drawBallCountdown(ball, ballFreezeUntil) {
        const timeRemaining = Math.ceil((ballFreezeUntil - Date.now()) / 333); // 3-2-1 countdown
        
        if (timeRemaining <= 0) {
            if (this.countdownText) {
                this.countdownText.setVisible(false);
            }
            return;
        }

        if (!this.countdownText) {
            this.countdownText = this.scene.add.text(0, 0, '', {
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }

        this.countdownText.x = ball.x;
        this.countdownText.y = ball.y - 40;
        this.countdownText.setText(timeRemaining.toString());
        this.countdownText.setVisible(true);

        // Add pulsing effect
        this.scene.tweens.add({
            targets: this.countdownText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    showComboNotification(count) {
        let message = '';
        let color = '#ffff00';
        
        if (count >= 100) {
            message = `INCREDIBLE ${count} HIT COMBO!`;
            color = '#ff0080';
        } else if (count >= 50) {
            message = `AMAZING ${count} HIT COMBO!`;
            color = '#ff4400';
        } else if (count >= 25) {
            message = `GREAT ${count} HIT COMBO!`;
            color = '#ff8800';
        } else if (count >= 10) {
            message = `${count} HIT COMBO!`;
            color = '#ffff00';
        } else {
            message = `${count} Hit Combo`;
            color = '#88ff88';
        }
        
        const comboText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 3,
            message,
            {
                fontSize: '28px',
                fill: color,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        // Animate combo text
        comboText.setScale(0);
        this.scene.tweens.add({
            targets: comboText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: comboText,
                    y: comboText.y - 80,
                    alpha: 0,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 2000,
                    ease: 'Power2',
                    onComplete: () => comboText.destroy()
                });
            }
        });
        
        // Create combo particles
        this.scene.particleSystem.createParticles(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 3,
            count >= 50 ? 30 : 20,
            {
                tint: Phaser.Display.Color.HexStringToColor(color).color,
                speedMin: 40,
                speedMax: 120,
                lifespan: 800,
                scaleMax: 0.8
            }
        );
    }

    showDangerModeNotification() {
        this.showNotification(
            '⚠️ DANGER MODE ACTIVATED! ⚠️',
            'rgba(255, 100, 100, 0.8)',
            3000
        );
        
        // Add screen flash effect
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xff0000, 0.3);
        flash.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
    }

    showPauseOverlay() {
        if (this.pauseOverlay) return;
        
        // Create pause overlay
        this.pauseOverlay = this.scene.add.container(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2
        );
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(
            -this.scene.cameras.main.width / 2,
            -this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height
        );
        
        // Pause text
        const pauseText = this.scene.add.text(0, -30, 'PAUSED', {
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        const instructionText = this.scene.add.text(0, 30, 'Press P or ESC to resume', {
            fontSize: '20px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        this.pauseOverlay.add([bg, pauseText, instructionText]);
        
        // Animate in
        this.pauseOverlay.setAlpha(0);
        this.scene.tweens.add({
            targets: this.pauseOverlay,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    hidePauseOverlay() {
        if (!this.pauseOverlay) return;
        
        this.scene.tweens.add({
            targets: this.pauseOverlay,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.pauseOverlay.destroy();
                this.pauseOverlay = null;
            }
        });
    }

    updateScoreDisplay(player1Score, player2Score) {
        // Update HTML elements (maintained for compatibility)
        const player1ScoreEl = document.getElementById('player1-score');
        const player2ScoreEl = document.getElementById('player2-score');
        
        if (player1ScoreEl) player1ScoreEl.textContent = player1Score;
        if (player2ScoreEl) player2ScoreEl.textContent = player2Score;
    }

    createEffectIndicator(player, effectType, duration) {
        // Create visual effect indicator in the game
        const x = player === 'player1' ? 50 : this.scene.cameras.main.width - 50;
        const y = 100;
        
        const effectIcon = this.scene.add.text(x, y, this.getEffectSymbol(effectType), {
            fontSize: '24px',
            fill: this.getEffectColor(effectType),
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Animate duration countdown
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);
            
            if (seconds <= 0 || !effectIcon.scene) {
                clearInterval(interval);
                if (effectIcon.scene) effectIcon.destroy();
                return;
            }
            
            // Update visual based on time remaining
            const alpha = 0.5 + 0.5 * (remaining / duration);
            effectIcon.setAlpha(alpha);
        }, 100);
        
        // Remove after duration
        this.scene.time.delayedCall(duration, () => {
            clearInterval(interval);
            if (effectIcon.scene) {
                this.scene.tweens.add({
                    targets: effectIcon,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 300,
                    onComplete: () => effectIcon.destroy()
                });
            }
        });
        
        return effectIcon;
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

    destroy() {
        // Clean up UI elements
        this.notifications.forEach(notif => {
            if (notif.container) notif.container.destroy();
        });
        this.notifications = [];
        
        if (this.countdownText) {
            this.countdownText.destroy();
            this.countdownText = null;
        }
        
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }
}
