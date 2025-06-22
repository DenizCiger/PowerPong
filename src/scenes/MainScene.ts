import Phaser from 'phaser';
import { 
    BALL_RADIUS, 
    BALL_SPEED, 
    PADDLE_HEIGHT, 
    PADDLE_WIDTH, 
    PADDLE_MARGIN, 
    PADDLE_SPEED,
    SCREEN_SHAKE_DURATION,
    SCREEN_SHAKE_INTENSITY,
    POWERUP_DESPAWN_TIME,
    PLAYGROUND_MAX_POWERUPS,
    POWERUP_MAX,
    PLAYGROUND_SPAWN_CHANCE,
    POWERUP_SPAWN_CHANCE,
    PLAYGROUND_MAX_HAZARDS,
    HAZARD_MAX,
    HAZARD_SPAWN_RATE,
    HAZARD_DURATION,
    powerUpTypes,
    hazardTypes
} from '../constants';
import { PhaserPhysics } from '../components/PhaserPhysics';
import { PhaserParticles } from '../components/PhaserParticles';
import { PhaserPowerUps } from '../components/PhaserPowerUps';
import { PhaserHazards } from '../components/PhaserHazards';
import { PhaserUI } from '../components/PhaserUI';
import { 
    ScreenShake, 
    PowerUpData, 
    HazardData, 
    CollisionData 
} from '../types/GameTypes';

// Audio function (we'll keep this as any for now)
declare function playComboSound(count: number): void;

export class MainScene extends Phaser.Scene {
    // Game state
    public gameRunning: boolean = false;
    public paused: boolean = false;
    public rallyCount: number = 0;
    public player1Score: number = 0;
    public player2Score: number = 0;
    public dangerMode: boolean = false;
    public ballFrozen: boolean = false;
    public ballFreezeUntil: number = 0;
    
    // Game mode flags
    public playgroundMode: boolean = false;
    public autoMode: boolean = false;
    public playgroundPowerUpIndex: number = -1;
    public playgroundHazardIndex: number = -1;
    
    // Game objects
    public player1Paddle!: Phaser.GameObjects.Rectangle;
    public player2Paddle!: Phaser.GameObjects.Rectangle;
    public ball!: Phaser.GameObjects.Arc;
    public balls: Phaser.GameObjects.Arc[] = [];
    
    // Collections
    public activePowerUps: any[] = [];
    public activeHazards: any[] = [];
    public particles: any[] = [];
    public scoreAnimations: any[] = [];
    public backgroundStars: any[] = [];
    
    // Effects
    public activeEffects: { player1: Record<string, any>; player2: Record<string, any> } = { 
        player1: {}, 
        player2: {} 
    };
    public screenShake: ScreenShake = { x: 0, y: 0, timeLeft: 0 };
    
    // Phaser components
    public particleSystem!: PhaserParticles;
    public powerUpSystem!: PhaserPowerUps;
    public hazardSystem!: PhaserHazards;
    public uiSystem!: PhaserUI;
    
    // Input
    public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    public wasd!: { [key: string]: Phaser.Input.Keyboard.Key };
    public pauseKey!: Phaser.Input.Keyboard.Key;
    public escapeKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'MainScene' });
    }

    create(): void {
        // Create textures programmatically
        this.createTextures();
          // Initialize systems
        this.particleSystem = new PhaserParticles(this);
        this.powerUpSystem = new PhaserPowerUps(this, this.particleSystem);
        this.hazardSystem = new PhaserHazards(this, this.particleSystem);
        this.uiSystem = new PhaserUI(this);
        
        // Create input handlers
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as { [key: string]: Phaser.Input.Keyboard.Key };
        this.pauseKey = this.input.keyboard!.addKey('P');
        this.escapeKey = this.input.keyboard!.addKey('ESC');
        
        // Create game objects
        this.createGameObjects();
        this.createUI();
        this.generateBackgroundStars();
        
        // Start the game
        this.startGame();
        
        // Setup input handlers
        this.setupInputHandlers();
    }

    private createTextures(): void {
        // Create a simple white pixel texture for particles
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('particle', 4, 4);
        graphics.destroy();
        
        // Create paddle texture
        const paddleGraphics = this.add.graphics();
        paddleGraphics.fillStyle(0xffffff);        paddleGraphics.fillRect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT);
        paddleGraphics.generateTexture('paddle', PADDLE_WIDTH, PADDLE_HEIGHT);
        paddleGraphics.destroy();
        
        // Create ball texture
        const ballGraphics = this.add.graphics();
        ballGraphics.fillStyle(0xffffff);
        ballGraphics.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
        ballGraphics.generateTexture('ball', BALL_RADIUS * 2, BALL_RADIUS * 2);
        ballGraphics.destroy();
    }

    private createGameObjects(): void {        // Create paddles
        this.player1Paddle = this.add.rectangle(
            PADDLE_MARGIN + PADDLE_WIDTH / 2,
            this.cameras.main.height / 2,
            PADDLE_WIDTH,
            PADDLE_HEIGHT,
            0x4488ff
        );
        this.physics.add.existing(this.player1Paddle, true); // Static body (already immovable)
        
        this.player2Paddle = this.add.rectangle(
            this.cameras.main.width - PADDLE_MARGIN - PADDLE_WIDTH / 2,
            this.cameras.main.height / 2,
            PADDLE_WIDTH,
            PADDLE_HEIGHT,
            0xff4444
        );
        this.physics.add.existing(this.player2Paddle, true); // Static body (already immovable)
        
        // Create ball
        this.ball = this.add.circle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            BALL_RADIUS,
            0xffffff
        );
        this.physics.add.existing(this.ball);
        (this.ball.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false); // We'll handle wall collisions manually
        (this.ball.body as Phaser.Physics.Arcade.Body).setBounce(0); // No automatic bounce
        (this.ball.body as Phaser.Physics.Arcade.Body).setCircle(BALL_RADIUS);
        
        // Store ball in balls array for compatibility
        this.balls = [this.ball];
        
        // Setup ball physics
        this.resetBall();
        
        // Initialize paddle properties
        (this.player1Paddle as any).speedMultiplier = 1;
        (this.player2Paddle as any).speedMultiplier = 1;
        
        // Set up paddle physics
        this.physics.add.existing(this.player1Paddle);
        this.physics.add.existing(this.player2Paddle);
        (this.player1Paddle.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (this.player2Paddle.body as Phaser.Physics.Arcade.Body).setImmovable(true);        // Create collision detection - use overlap for better control
        this.physics.add.overlap(this.ball, this.player1Paddle, 
            () => {
                this.handlePaddleHit(1, this.ball, this.player1Paddle);
            });
        this.physics.add.overlap(this.ball, this.player2Paddle, 
            () => {
                this.handlePaddleHit(2, this.ball, this.player2Paddle);
            });
    }

    // Continue with more methods...
    private createUI(): void {
        // Create center line with dashed effect using multiple small lines
        const centerLine = this.add.graphics();
        centerLine.lineStyle(2, 0x96c8ff, 0.5);
        
        // Draw dashed line manually
        const dashLength = 10;
        const gapLength = 10;
        const totalLength = dashLength + gapLength;
        const height = this.cameras.main.height;
        
        for (let y = 0; y < height; y += totalLength) {
            centerLine.lineBetween(
                this.cameras.main.width / 2, y,
                this.cameras.main.width / 2, Math.min(y + dashLength, height)
            );
        }
    }

    private generateBackgroundStars(): void {
        this.backgroundStars = [];
        for (let i = 0; i < 100; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.cameras.main.width,
                y: Math.random() * this.cameras.main.height,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    private startGame(): void {
        this.resetBall();
        this.rallyCount = 0;
        this.gameRunning = true;
        this.resetRound();
    }

    private resetBall(): void {
        this.ball.x = this.cameras.main.width / 2;
        this.ball.y = this.cameras.main.height / 2;
        
        const speed = BALL_SPEED;
        const angle = (Math.random() * Math.PI/3) - Math.PI/6; // Random angle between -30 and 30 degrees
        const direction = Math.random() > 0.5 ? 1 : -1;
          (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(
            Math.cos(angle) * speed * direction,
            Math.sin(angle) * speed
        );
    }    private resetRound(): void {
        this.resetBall();
        this.ballFrozen = true;
        this.ballFreezeUntil = Date.now() + 1000;
        
        // Stop ball movement during freeze
        (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        
        // Reset game systems
        this.powerUpSystem.reset();
        this.hazardSystem.reset();
        
        this.gameRunning = true;
    }

    private setupInputHandlers(): void {
        // Pause key handler
        this.pauseKey.on('down', () => {
            this.togglePause();
        });
        
        this.escapeKey.on('down', () => {
            this.togglePause();
        });
    }

    private togglePause(): void {
        this.paused = !this.paused;
        
        if (this.paused) {
            this.physics.pause();
            this.uiSystem.showPauseOverlay();
        } else {
            this.physics.resume();
            this.uiSystem.hidePauseOverlay();
        }
    }

    // More methods to be continued...
    public update(): void {
        if (!this.gameRunning) return;
        
        this.updatePaddles();
        this.updateBall();
        this.updateScreenShake();
        this.updatePowerUps();
        this.updateHazards();
        
        if (this.dangerMode) {
            this.updateDangerEffects();
        }
    }

    private updatePaddles(): void {
        if (this.paused) return;
        
        const baseSpeed = PADDLE_SPEED;
        
        // Player 1 controls (W/S)
        const player1Speed = baseSpeed * ((this.player1Paddle as any).speedMultiplier || 1);
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
        const player2Speed = baseSpeed * ((this.player2Paddle as any).speedMultiplier || 1);
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
        (this.player1Paddle.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
        (this.player2Paddle.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    }

    private updateBall(): void {
        if (this.paused) return;
        
        // Handle ball freeze
        if (this.ballFrozen) {
            if (Date.now() >= this.ballFreezeUntil) {
                this.ballFrozen = false;
                // Hide countdown text when ball unfreezes
                if (this.uiSystem.countdownText) {
                    this.uiSystem.countdownText.setVisible(false);
                }
                this.resetBall();            } else {
                (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
                this.uiSystem.drawBallCountdown(this.ball, this.ballFreezeUntil);
                return;
            }
        }
        
        // Check for wall collisions using enhanced physics
        const wallCollision = PhaserPhysics.handleBallWallCollision(this.ball, this);
        if (wallCollision.wallHit) {
            this.applyScreenShake();
            this.particleSystem.createWallHitParticles(this.ball.x, this.ball.y, 0, 5);
        }
        
        // Check for scoring
        const scoreData = PhaserPhysics.checkScoring(this.ball, this);
        if (scoreData.scored) {
            if (scoreData.scoringPlayer === 1) {
                this.player1Score++;
            } else {
                this.player2Score++;
            }
            this.updateScore();
            this.resetRound();
            this.rallyCount = 0;
        }
    }

    private handlePaddleHit(paddleIndex: number, ball: Phaser.GameObjects.Arc, paddle: Phaser.GameObjects.Rectangle): void {
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
        this.particleSystem.createPaddleHitParticles(ball.x, ball.y, paddleIndex, 8, '#ffffff');
    }

    private checkComboMilestones(): void {
        const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
        
        if (milestones.includes(this.rallyCount)) {
            // Play combo sound
            try {
                playComboSound(this.rallyCount);
            } catch (e) {
                // Audio function not available
            }
            
            // Show combo notification
            this.uiSystem.showComboNotification(this.rallyCount);
        }
    }

    private applyScreenShake(): void {
        this.screenShake.timeLeft = SCREEN_SHAKE_DURATION;
        this.screenShake.x = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY;
        this.screenShake.y = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY;
    }

    private updateScreenShake(): void {
        if (this.screenShake.timeLeft > 0) {
            this.screenShake.timeLeft -= this.game.loop.delta;
            
            // Apply shake to camera
            this.cameras.main.setScroll(
                this.screenShake.x * (this.screenShake.timeLeft / SCREEN_SHAKE_DURATION),
                this.screenShake.y * (this.screenShake.timeLeft / SCREEN_SHAKE_DURATION)
            );
            
            if (this.screenShake.timeLeft <= 0) {
                this.cameras.main.setScroll(0, 0);
            }
        }
    }

    private updateScore(): void {
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

    private updatePowerUps(): void {
        if (this.paused) return;
        
        // Spawn power-ups
        this.spawnPowerUps();
        
        // Check power-up collisions
        this.powerUpSystem.checkCollisions(this.balls, (type: string, player: string) => {
            PhaserPowerUps.applyPowerUp(type, player, this);
        });
        
        // Clean up expired power-ups
        const currentTime = Date.now();
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            if (powerUp.powerUpData && currentTime - powerUp.powerUpData.createdAt > POWERUP_DESPAWN_TIME) {
                powerUp.powerUpData.group.destroy(true);
                return false;
            }
            return true;
        });
    }

    private spawnPowerUps(): void {
        // Don't spawn if max reached
        const maxPowerups = this.playgroundMode ? PLAYGROUND_MAX_POWERUPS : POWERUP_MAX;
        if (this.activePowerUps.length >= maxPowerups) return;
        
        // Determine spawn chance
        let spawnChance = this.playgroundMode ? PLAYGROUND_SPAWN_CHANCE : POWERUP_SPAWN_CHANCE;
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
                Math.floor(Math.random() * powerUpTypes.length);
            
            // Use the powerUpSystem's spawnPowerUps method instead
            this.powerUpSystem.spawnPowerUps(
                this.cameras.main.width, 
                this.cameras.main.height, 
                this.dangerMode, 
                this, 
                16.67
            );
        }
    }    private updateHazards(): void {
        if (this.paused) return;
        
        // Spawn hazards
        this.spawnHazards();
        
        // Apply hazard effects to balls (check collisions)
        this.hazardSystem.checkCollisions(this.balls);
          // Update hazard system (this handles expiration internally)
        this.hazardSystem.update(this.game.loop.delta);
    }

    private spawnHazards(): void {
        // Don't spawn if max reached
        const maxHazards = this.playgroundMode ? PLAYGROUND_MAX_HAZARDS : HAZARD_MAX;
        const activeHazards = this.hazardSystem.getActiveHazards();
        if (activeHazards.length >= maxHazards) return;
        
        // Check spawn probability
        if (Math.random() < HAZARD_SPAWN_RATE) {
            // Choose random hazard type
            const hazardType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
              // Spawn at random location in safe area (avoiding paddles)
            const safeMargin = 100;
            const gameWidth = this.cameras.main.width;
            const gameHeight = this.cameras.main.height;
            const x = safeMargin + Math.random() * (gameWidth - 2 * safeMargin);
            const y = safeMargin + Math.random() * (gameHeight - 2 * safeMargin);
            
            this.hazardSystem.spawnHazard(x, y, hazardType.type);
        }
    }    private updateDangerEffects(): void {
        // Add pulsing center line effect
        // This would require recreating the center line graphics
        // Implementation details would go here
    }
}
