import { ScoreAnimation } from '../types/GameTypes';

export class PhaserUI {
    private scene: Phaser.Scene;
    private scoreText!: Phaser.GameObjects.Text;
    private player1ScoreText!: Phaser.GameObjects.Text;
    private player2ScoreText!: Phaser.GameObjects.Text;
    private rallyText!: Phaser.GameObjects.Text;
    private modeText!: Phaser.GameObjects.Text;

    // Additional UI elements
    private pauseOverlay?: Phaser.GameObjects.Text;
    public countdownText?: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI(): void {
        // Main score display
        this.scoreText = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            30, 
            '0 - 0', 
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);

        // Player 1 score
        this.player1ScoreText = this.scene.add.text(
            50, 
            30, 
            'Player 1: 0', 
            {
                fontSize: '18px',
                color: '#4488ff',
                fontFamily: 'Arial'
            }
        );

        // Player 2 score
        this.player2ScoreText = this.scene.add.text(
            this.scene.cameras.main.width - 50, 
            30, 
            'Player 2: 0', 
            {
                fontSize: '18px',
                color: '#ff4444',
                fontFamily: 'Arial'
            }
        ).setOrigin(1, 0);

        // Rally counter
        this.rallyText = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            70, 
            'Rally: 0', 
            {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);

        // Mode indicator
        this.modeText = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            this.scene.cameras.main.height - 30, 
            '', 
            {
                fontSize: '14px',
                color: '#ffff00',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
    }

    updateScore(player1Score: number, player2Score: number): void {
        this.scoreText.setText(`${player1Score} - ${player2Score}`);
        this.player1ScoreText.setText(`Player 1: ${player1Score}`);
        this.player2ScoreText.setText(`Player 2: ${player2Score}`);
    }

    updateRally(rallyCount: number): void {
        this.rallyText.setText(`Rally: ${rallyCount}`);
    }

    setMode(mode: string): void {
        this.modeText.setText(mode);
    }

    showGameOver(winner: number): void {
        const gameOverText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            `Player ${winner} Wins!\nPress SPACE to restart`,
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Add background
        const background = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            400, 200,
            0x000000, 0.8
        ).setOrigin(0.5);

        // Bring text to front
        gameOverText.setDepth(1000);
        background.setDepth(999);
    }

    renderScoreAnimations(scoreAnimations: ScoreAnimation[]): void {
        // Score animations would be handled through Phaser's text objects
        // This is a placeholder for the score animation rendering
        scoreAnimations.forEach(anim => {
            const animText = this.scene.add.text(anim.x, anim.y, anim.text, {
                fontSize: `${anim.size}px`,
                color: anim.color,
                fontFamily: 'Arial'
            }).setOrigin(0.5).setAlpha(anim.opacity);

            // Clean up after animation
            this.scene.time.delayedCall(1000, () => {
                animText.destroy();
            });
        });
    }

    reset(): void {
        this.updateScore(0, 0);
        this.updateRally(0);
        this.setMode('');
    }

    showPauseOverlay(): void {
        if (!this.pauseOverlay) {
            this.pauseOverlay = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                'PAUSED\nPress ESC to resume',
                {
                    fontSize: '32px',
                    color: '#ffffff',
                    fontFamily: 'Arial',
                    align: 'center'
                }
            ).setOrigin(0.5).setDepth(1000);
        }
        this.pauseOverlay.setVisible(true);
    }

    hidePauseOverlay(): void {
        if (this.pauseOverlay) {
            this.pauseOverlay.setVisible(false);
        }
    }

    showComboNotification(rallyCount: number): void {
        if (rallyCount > 5) {
            const comboText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 - 50,
                `${rallyCount} HIT COMBO!`,
                {
                    fontSize: '24px',
                    color: '#ffff00',
                    fontFamily: 'Arial'
                }
            ).setOrigin(0.5).setDepth(1000);

            // Fade out after 2 seconds
            this.scene.tweens.add({
                targets: comboText,
                alpha: 0,
                y: comboText.y - 50,
                duration: 2000,
                onComplete: () => comboText.destroy()
            });
        }
    }

    updateScoreDisplay(player1Score: number, player2Score: number): void {
        this.updateScore(player1Score, player2Score);
    }

    showDangerModeNotification(): void {
        const dangerText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 4,
            'DANGER MODE ACTIVATED!',
            {
                fontSize: '28px',
                color: '#ff0000',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(1000);

        // Flash effect
        this.scene.tweens.add({
            targets: dangerText,
            alpha: 0,
            duration: 3000,
            onComplete: () => dangerText.destroy()
        });
    }

    drawBallCountdown(ball: Phaser.GameObjects.Arc, freezeUntil: number): void {
        const timeLeft = Math.max(0, Math.ceil((freezeUntil - Date.now()) / 1000));
        
        if (!this.countdownText) {
            this.countdownText = this.scene.add.text(
                ball.x,
                ball.y - 30,
                timeLeft.toString(),
                {
                    fontSize: '24px',
                    color: '#ffffff',
                    fontFamily: 'Arial'
                }
            ).setOrigin(0.5).setDepth(1000);
        } else {
            this.countdownText.setText(timeLeft.toString());
            this.countdownText.setPosition(ball.x, ball.y - 30);
        }

        if (timeLeft <= 0 && this.countdownText) {
            this.countdownText.destroy();
            this.countdownText = undefined;
        }
    }
}
