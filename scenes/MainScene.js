import * as Constants from '../constants.js';
import { playComboSound } from '../audio.js';
import { PhaserPhysics } from '../phaser-components/PhaserPhysics.js';
import { PhaserParticles } from '../phaser-components/PhaserParticles.js';
import { PhaserPowerUps } from '../phaser-components/PhaserPowerUps.js';
import { PhaserHazards } from '../phaser-components/PhaserHazards.js';
import { PhaserUI } from '../phaser-components/PhaserUI.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        
        // Game state
        this.gameRunning = false;
        this.paused = false;
        this.rallyCount = 0;
        this.player1Score = 0;
        this.player2Score = 0;
        this.dangerMode = false;
        this.ballFrozen = false;
        this.ballFreezeUntil = 0;
        
        // Game mode flags
        this.playgroundMode = false;
        this.autoMode = false;
        this.playgroundPowerUpIndex = -1;
        this.playgroundHazardIndex = -1;
        
        // Game objects
        this.player1Paddle = null;
        this.player2Paddle = null;
        this.ball = null;
        this.balls = [];
        
        // Collections
        this.activePowerUps = [];
        this.activeHazards = [];
        this.particles = [];
        this.scoreAnimations = [];
        this.backgroundStars = [];
          // Effects
        this.activeEffects = { player1: {}, player2: {} };
        this.screenShake = { x: 0, y: 0, timeLeft: 0 };        // Phaser components
        this.particleSystem = null;
        this.powerUpSystem = null;
        this.hazardSystem = null;
        this.uiSystem = null;
        
        // Input
        this.cursors = null;
        this.wasd = null;
        this.pauseKey = null;
        this.escapeKey = null;
    }
    preload() {
        // We'll create textures programmatically in create() instead of loading images
        // This avoids the data URI issue
    }
    create() {
        // Create textures programmatically
        this.createTextures();
        
        // Initialize systems
        this.particleSystem = new PhaserParticles(this);
        this.powerUpSystem = new PhaserPowerUps(this);
        this.hazardSystem = new PhaserHazards(this);
        this.uiSystem = new PhaserUI(this);
        
        // Create input handlers
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.pauseKey = this.input.keyboard.addKey('P');
        this.escapeKey = this.input.keyboard.addKey('ESC');
        
        // Create game objects
        this.createGameObjects();
        this.createUI();
        this.generateBackgroundStars();
        
        // Start the game
        this.startGame();
        
        // Setup input handlers        this.setupInputHandlers();
    }

    createTextures() {
        // Create a simple white pixel texture for particles
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('particle', 4, 4);
        graphics.destroy();
        
        // Create paddle texture
        const paddleGraphics = this.add.graphics();
        paddleGraphics.fillStyle(0xffffff);
        paddleGraphics.fillRect(0, 0, Constants.PADDLE_WIDTH, Constants.PADDLE_HEIGHT);
        paddleGraphics.generateTexture('paddle', Constants.PADDLE_WIDTH, Constants.PADDLE_HEIGHT);
        paddleGraphics.destroy();
        
        // Create ball texture
        const ballGraphics = this.add.graphics();
        ballGraphics.fillStyle(0xffffff);
        ballGraphics.fillCircle(Constants.BALL_RADIUS, Constants.BALL_RADIUS, Constants.BALL_RADIUS);
        ballGraphics.generateTexture('ball', Constants.BALL_RADIUS * 2, Constants.BALL_RADIUS * 2);
        ballGraphics.destroy();
    }

    createGameObjects() {
        // Create paddles
        this.player1Paddle = this.add.rectangle(
            Constants.PADDLE_MARGIN + Constants.PADDLE_WIDTH / 2,
            this.cameras.main.height / 2,
            Constants.PADDLE_WIDTH,
            Constants.PADDLE_HEIGHT,
            0x4488ff
        );        this.physics.add.existing(this.player1Paddle, true); // Static body (already immovable)
        
        this.player2Paddle = this.add.rectangle(
            this.cameras.main.width - Constants.PADDLE_MARGIN - Constants.PADDLE_WIDTH / 2,
            this.cameras.main.height / 2,
            Constants.PADDLE_WIDTH,
            Constants.PADDLE_HEIGHT,
            0xff4444
        );
        this.physics.add.existing(this.player2Paddle, true); // Static body (already immovable)
        
        // Create ball
        this.ball = this.add.circle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            Constants.BALL_RADIUS,
            0xffffff
        );
        this.physics.add.existing(this.ball);
        this.ball.body.setCollideWorldBounds(false); // We'll handle wall collisions manually
        this.ball.body.setBounce(0); // No automatic bounce
        this.ball.body.setCircle(Constants.BALL_RADIUS);
        
        // Store ball in balls array for compatibility
        this.balls = [this.ball];
          // Setup ball physics
        this.resetBall();
        
        // Initialize paddle properties
        this.player1Paddle.speedMultiplier = 1;
        this.player2Paddle.speedMultiplier = 1;
        
        // Create collision detection
        this.physics.add.collider(this.ball, this.player1Paddle, this.handlePaddleHit.bind(this, 1));
        this.physics.add.collider(this.ball, this.player2Paddle, this.handlePaddleHit.bind(this, 2));
    }    createUI() {
        // Create center line with dashed effect using multiple small lines
        const centerLine = this.add.graphics();
        centerLine.lineStyle(2, 0x96c8ff, 0.5);
        
        // Draw dashed line manually
        const dashLength = 5;
        const gapLength = 15;
        const totalLength = dashLength + gapLength;
        const height = this.cameras.main.height;
        
        for (let y = 0; y < height; y += totalLength) {
            centerLine.lineBetween(
                this.cameras.main.width / 2, y,
                this.cameras.main.width / 2, Math.min(y + dashLength, height)
            );
        }
        
        // Create arena outline
        const arena = this.add.graphics();
        arena.lineStyle(2, 0x6496ff, 0.3);
        arena.strokeRect(20, 20, this.cameras.main.width - 40, this.cameras.main.height - 40);
        
        // Create center circle
        arena.strokeCircle(this.cameras.main.width / 2, this.cameras.main.height / 2, 50);
    }

    generateBackgroundStars() {
        this.backgroundStars = [];
        const starCount = 100;
        
        for (let i = 0; i < starCount; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.cameras.main.width,
                y: Math.random() * this.cameras.main.height,
                size: Math.random() * 2 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
    }

    startGame() {
        this.gameRunning = true;
        this.resetRound();
    }

    resetBall() {
        this.ball.x = this.cameras.main.width / 2;
        this.ball.y = this.cameras.main.height / 2;
        
        const speed = Constants.BALL_SPEED;
        const angle = (Math.random() * Math.PI/3) - Math.PI/6; // Random angle between -30 and 30 degrees
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        this.ball.body.setVelocity(
            Math.cos(angle) * speed * direction,
            Math.sin(angle) * speed
        );
    }

    resetRound() {
        this.resetBall();
        this.ballFrozen = true;
        this.ballFreezeUntil = Date.now() + 1000;
        
        // Stop ball movement during freeze
        this.ball.body.setVelocity(0, 0);
        
        this.gameRunning = true;
    }

    setupInputHandlers() {
        // Pause key handler
        this.pauseKey.on('down', () => {
            this.togglePause();
        });
        
        this.escapeKey.on('down', () => {
            this.togglePause();
        });
    }
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            this.physics.pause();
            this.uiSystem.showPauseOverlay();
        } else {
            this.physics.resume();
            this.uiSystem.hidePauseOverlay();
        }
    }

    showPauseOverlay() {
        if (!this.pauseOverlay) {
            this.pauseOverlay = this.add.graphics();
            this.pauseOverlay.fillStyle(0x000000, 0.7);
            this.pauseOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
            
            this.pauseText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                'PAUSED\nPress P or ESC to resume',
                {
                    fontSize: '32px',
                    fill: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);
        }
        
        this.pauseOverlay.setVisible(true);
        this.pauseText.setVisible(true);
    }

    hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.setVisible(false);
            this.pauseText.setVisible(false);
        }
    }    handlePaddleHit(paddleIndex, ball, paddle) {
        // Use enhanced physics
        const collisionData = PhaserPhysics.handleBallPaddleCollision(
            ball, paddle, paddleIndex, this.rallyCount, this
        );
        
        // Increment rally count
        this.rallyCount += collisionData.rallyIncrement;
        
        // Apply screen shake
        this.applyScreenShake();
        
        // Check for combo milestones
        this.checkComboMilestones();
        
        // Create enhanced particles
        this.particleSystem.createPaddleHitParticles(ball.x, ball.y, paddleIndex);
    }    checkComboMilestones() {
        const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
        
        if (milestones.includes(this.rallyCount)) {
            // Play combo sound
            playComboSound(this.rallyCount);
            
            // Show combo notification
            this.uiSystem.showComboNotification(this.rallyCount);
        }
    }

    showComboNotification(count) {
        const text = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 4,
            `${count} HIT COMBO!`,
            {
                fontSize: '24px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Animate and remove
        this.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    applyScreenShake() {
        this.screenShake.timeLeft = Constants.SCREEN_SHAKE_DURATION;
        this.screenShake.x = (Math.random() - 0.5) * Constants.SCREEN_SHAKE_INTENSITY;
        this.screenShake.y = (Math.random() - 0.5) * Constants.SCREEN_SHAKE_INTENSITY;
    }    updatePaddles() {
        if (this.paused) return;
        
        const baseSpeed = Constants.PADDLE_SPEED;
        
        // Player 1 controls (W/S)
        const player1Speed = baseSpeed * (this.player1Paddle.speedMultiplier || 1);
        if (this.wasd.W.isDown) {
            this.player1Paddle.y = Math.max(
                this.player1Paddle.displayHeight / 2,
                this.player1Paddle.y - player1Speed
            );
        } else if (this.wasd.S.isDown) {
            this.player1Paddle.y = Math.min(
                this.cameras.main.height - this.player1Paddle.displayHeight / 2,
                this.player1Paddle.y + player1Speed
            );
        }
        
        // Player 2 controls (Arrow keys)
        const player2Speed = baseSpeed * (this.player2Paddle.speedMultiplier || 1);
        if (this.cursors.up.isDown) {
            this.player2Paddle.y = Math.max(
                this.player2Paddle.displayHeight / 2,
                this.player2Paddle.y - player2Speed
            );
        } else if (this.cursors.down.isDown) {
            this.player2Paddle.y = Math.min(
                this.cameras.main.height - this.player2Paddle.displayHeight / 2,
                this.player2Paddle.y + player2Speed
            );
        }
        
        // Update physics body positions
        this.player1Paddle.body.updateFromGameObject();
        this.player2Paddle.body.updateFromGameObject();
    }updateBall() {
        if (this.paused) return;
          // Handle ball freeze
        if (this.ballFrozen) {
            if (Date.now() >= this.ballFreezeUntil) {
                this.ballFrozen = false;
                // Hide countdown text when ball unfreezes
                if (this.uiSystem.countdownText) {
                    this.uiSystem.countdownText.setVisible(false);
                }
                this.resetBall();
            } else {
                this.ball.body.setVelocity(0, 0);
                this.uiSystem.drawBallCountdown(this.ball, this.ballFreezeUntil);
                return;
            }
        }
        
        // Check for wall collisions using enhanced physics
        const wallCollision = PhaserPhysics.handleBallWallCollision(this.ball, this);
        if (wallCollision.wallHit) {
            this.applyScreenShake();
            this.particleSystem.createWallHitParticles(this.ball.x, this.ball.y);
        }
        
        // Check for scoring
        const scoreData = PhaserPhysics.checkScoring(this.ball, this);
        if (scoreData.scored) {
            if (scoreData.scoringPlayer === 1) {
                this.player1Score++;
                this.particleSystem.createScoreAnimation(1, this.ball.y);
            } else {
                this.player2Score++;
                this.particleSystem.createScoreAnimation(2, this.ball.y);
            }
            
            this.updateScore();
            this.resetRound();
            this.rallyCount = 0;
        }
    }

    drawBallCountdown() {
        const timeRemaining = Math.ceil((this.ballFreezeUntil - Date.now()) / 333); // 3-2-1 countdown
        if (timeRemaining <= 0) return;
        
        if (!this.countdownText) {
            this.countdownText = this.add.text(
                this.ball.x,
                this.ball.y - 30,
                '',
                {
                    fontSize: '36px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
        }
        
        this.countdownText.x = this.ball.x;
        this.countdownText.y = this.ball.y - 30;
        this.countdownText.setText(timeRemaining.toString());
        this.countdownText.setVisible(true);
        
        if (timeRemaining <= 0) {
            this.countdownText.setVisible(false);
        }
    }
    updateScore() {
        // Update HTML elements and internal UI
        this.uiSystem.updateScoreDisplay(this.player1Score, this.player2Score);
        
        // Check for danger mode
        const scoreDiff = Math.abs(this.player1Score - this.player2Score);
        const minScore = Math.max(this.player1Score, this.player2Score);
        const wasDangerMode = this.dangerMode;
        this.dangerMode = scoreDiff <= 2 && minScore >= 5;
        
        // Show danger mode notification if just activated
        if (this.dangerMode && !wasDangerMode) {
            this.uiSystem.showDangerModeNotification();
        }
    }

    updateScreenShake() {
        if (this.screenShake.timeLeft > 0) {
            this.screenShake.timeLeft -= 16; // Assuming 60 FPS
            
            if (this.screenShake.timeLeft <= 0) {
                this.cameras.main.setScroll(0, 0);
            } else {
                this.cameras.main.setScroll(this.screenShake.x, this.screenShake.y);
            }
        }
    }

    drawBackgroundStars() {
        const graphics = this.add.graphics();
        graphics.clear();
        
        this.backgroundStars.forEach(star => {
            const brightness = star.brightness + Math.sin(Date.now() * star.twinkleSpeed) * 0.3;
            const alpha = Math.max(0.1, Math.min(1, brightness));
            
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(star.x, star.y, star.size);
        });
    }
    update() {
        if (!this.gameRunning) return;
        
        this.updatePaddles();
        this.updateBall();
        this.updatePowerUps();
        this.updateHazards();
        this.updateScreenShake();
        
        // Update danger mode effects
        if (this.dangerMode) {
            this.updateDangerEffects();
        }
    }

    updatePowerUps() {
        if (this.paused) return;
        
        // Spawn power-ups
        this.spawnPowerUps();
        
        // Check power-up collisions
        this.activePowerUps = this.powerUpSystem.checkPowerUpCollisions(this.balls, this.activePowerUps);
        
        // Remove expired power-ups
        const currentTime = Date.now();
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            if (powerUp.powerUpData && currentTime - powerUp.powerUpData.createdAt > Constants.POWERUP_DESPAWN_TIME) {
                powerUp.powerUpData.group.destroy(true);
                return false;
            }
            return true;
        });
    }

    spawnPowerUps() {
        // Don't spawn if max reached
        const maxPowerups = this.playgroundMode ? Constants.PLAYGROUND_MAX_POWERUPS : Constants.POWERUP_MAX;
        if (this.activePowerUps.length >= maxPowerups) return;
        
        // Determine spawn chance
        let spawnChance = this.playgroundMode ? Constants.PLAYGROUND_SPAWN_CHANCE : Constants.POWERUP_SPAWN_CHANCE;
        if (this.dangerMode && !this.playgroundMode) {
            spawnChance *= 1.5;
        }
        
        // Check if we should spawn
        if (Math.random() < spawnChance && 
            !(this.playgroundMode && this.playgroundPowerUpIndex === -1)) {
            
            // Choose position away from paddles
            const safeZone = 100;
            const x = Math.random() * (this.cameras.main.width - 2 * safeZone) + safeZone;
            const y = Math.random() * (this.cameras.main.height - 100) + 50;
              // Choose power-up type
            let powerUpIndex = this.playgroundMode ? 
                this.playgroundPowerUpIndex : 
                Math.floor(Math.random() * this.powerUpSystem.powerUpTypes.length);
            
            // Spawn the power-up
            const powerUp = this.powerUpSystem.spawnPowerUp(x, y, powerUpIndex);
            this.activePowerUps.push(powerUp);
        }
    }

    updateHazards() {
        if (this.paused) return;
        
        // Spawn hazards
        this.spawnHazards();
        
        // Apply hazard effects to balls
        this.hazardSystem.applyHazardEffects(this.balls, this.activeHazards);
        
        // Update hazards (animations, expiration)
        this.activeHazards = this.hazardSystem.updateHazards(this.activeHazards);
    }

    spawnHazards() {
        // Don't spawn if max reached
        const maxHazards = this.playgroundMode ? Constants.PLAYGROUND_MAX_HAZARDS : Constants.HAZARD_MAX;
        if (this.activeHazards.length >= maxHazards) return;
        
        // Determine spawn chance
        let spawnChance = this.playgroundMode ? Constants.PLAYGROUND_SPAWN_CHANCE : Constants.HAZARD_SPAWN_RATE;
        if (this.dangerMode && !this.playgroundMode) {
            spawnChance *= 2;
        }
        
        // Check if we should spawn
        if (Math.random() < spawnChance && 
            !(this.playgroundMode && this.playgroundHazardIndex === -1)) {
            
            // Choose position away from paddles
            const safeZone = 100;
            const x = Math.random() * (this.cameras.main.width - 2 * safeZone) + safeZone;
            const y = Math.random() * (this.cameras.main.height - 100) + 50;
            
            // Choose hazard type
            let hazardIndex = this.playgroundMode ? 
                this.playgroundHazardIndex : 
                Math.floor(Math.random() * this.hazardSystem.hazardTypes.length);
            
            // Spawn the hazard
            const hazard = this.hazardSystem.spawnHazard(x, y, hazardIndex);
            this.activeHazards.push(hazard);
            
            // Add barrier collision if it's a barrier
            if (hazard.hazardData.type === 'barrier') {
                this.balls.forEach(ball => {
                    this.physics.add.collider(ball, hazard, (ball, barrier) => {
                        this.hazardSystem.handleBarrierCollision(ball, barrier);
                    });
                });
            }
        }
    }    updateDangerEffects() {
        // Add pulsing center line effect
        if (!this.dangerCenterLine) {
            this.dangerCenterLine = this.add.graphics();
        }
        
        const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        this.dangerCenterLine.clear();
        this.dangerCenterLine.lineStyle(2 + pulse * 2, 0xff0000, 0.7);
        
        // Draw dashed line manually for danger mode
        const dashLength = 5;
        const gapLength = 10;
        const totalLength = dashLength + gapLength;
        const height = this.cameras.main.height;
        
        for (let y = 0; y < height; y += totalLength) {
            this.dangerCenterLine.lineBetween(
                this.cameras.main.width / 2, y,
                this.cameras.main.width / 2, Math.min(y + dashLength, height)
            );
        }
    }
}
