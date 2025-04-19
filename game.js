import * as Constants from './constants.js';
import * as UI from './ui.js';
import * as Rendering from './rendering.js';
import * as Physics from './physics.js';
import * as Particles from './particles.js';
import * as Hazards from './hazards.js';
import * as PowerUps from './powerups.js';

// Game state
const GameState = {
    // Constants from the module
    PADDLE_HEIGHT: Constants.PADDLE_HEIGHT,
    PADDLE_WIDTH: Constants.PADDLE_WIDTH,
    PADDLE_MARGIN: Constants.PADDLE_MARGIN,
    BALL_RADIUS: Constants.BALL_RADIUS,
    BALL_SPEED: Constants.BALL_SPEED,
    PADDLE_SPEED: Constants.PADDLE_SPEED,
    
    // Game modes
    playgroundMode: false,
    autoMode: false,  // When true, both players are CPU controlled
    
    // Playground mode state
    playgroundPowerUpIndex: -1, // -1 means no powerups will spawn
    playgroundHazardIndex: -1,  // -1 means no hazards will spawn
    
    // Game state variables
    gameRunning: false,
    paused: false,
    ballX: 0,
    ballY: 0,
    ballSpeedX: 0,
    ballSpeedY: 0,
    player1Y: 0,
    player2Y: 0,
    player1Score: 0,
    player2Score: 0,
    player1PaddleHeight: Constants.PADDLE_HEIGHT,
    player2PaddleHeight: Constants.PADDLE_HEIGHT,
    player1PaddleSpeed: Constants.PADDLE_SPEED,
    player2PaddleSpeed: Constants.PADDLE_SPEED,
    lastTime: 0,
    rallyCount: 0,
    screenShake: { x: 0, y: 0, timeLeft: 0 },
    dangerMode: false,
    ballFrozen: false,
    ballFreezeUntil: 0,
    canvasWidth: UI.canvas.width,
    canvasHeight: UI.canvas.height,
    
    // Game elements
    activePowerUps: [],
    activeEffects: { player1: {}, player2: {} },
    balls: [],
    activeHazards: [],
    backgroundStars: [],
    
    // Input tracking
    keys: {
        w: false,
        s: false,
        arrowup: false,
        arrowdown: false,
        ' ': false,
        'p': false,
        'escape': false
    },
    
    // Method to apply screen shake
    applyScreenShake() {
        this.screenShake.timeLeft = Constants.SCREEN_SHAKE_DURATION;
    },

    // Method to toggle pause state
    togglePause() {
        this.paused = !this.paused;
        
        // Update UI to show pause state
        if (this.paused) {
            UI.showPauseOverlay();
        } else {
            UI.hidePauseOverlay();
        }
    }
};

// Generate background stars
function generateBackgroundStars() {
    GameState.backgroundStars = [];
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
        GameState.backgroundStars.push({
            x: Math.random() * GameState.canvasWidth,
            y: Math.random() * GameState.canvasHeight,
            size: Math.random() * 2 + 1,
            brightness: Math.random() * 0.5 + 0.5, // Between 0.5 and 1
            blinkSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

// Initialize the game
function initGame() {
    GameState.player1Y = (GameState.canvasHeight - GameState.player1PaddleHeight) / 2;
    GameState.player2Y = (GameState.canvasHeight - GameState.player2PaddleHeight) / 2;
    resetBall();
    GameState.activePowerUps = [];
    GameState.balls = [];
    GameState.balls.push({
        x: GameState.ballX,
        y: GameState.ballY,
        speedX: GameState.ballSpeedX,
        speedY: GameState.ballSpeedY
    });
    
    // Clear any existing active effects
    GameState.activeEffects = { player1: {}, player2: {} };
    UI.player1EffectsEl.innerHTML = '';
    UI.player2EffectsEl.innerHTML = '';
    
    // Clear active hazards
    GameState.activeHazards = [];
    
    // Generate background stars
    generateBackgroundStars();
    
    // Reset particles
    Particles.resetParticles();
}

// Start the game
function startGame() {
    GameState.gameRunning = true;
    UI.gameStatusEl.style.display = 'none';
    initGame();
    requestAnimationFrame(gameLoop);
}

// Reset ball position and speed
function resetBall() {
    GameState.ballX = GameState.canvasWidth / 2;
    GameState.ballY = GameState.canvasHeight / 2;
    // Always reset to the initial ball speed
    GameState.ballSpeedX = Constants.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    GameState.ballSpeedY = Constants.BALL_SPEED * (Math.random() * 0.8 - 0.4);
}

// Reset after a point is scored
function resetRound() {
    resetBall();
    GameState.balls = [{
        x: GameState.ballX,
        y: GameState.ballY,
        speedX: GameState.ballSpeedX,
        speedY: GameState.ballSpeedY
    }];
    
    // Set the ball to be frozen for 1 second
    GameState.ballFrozen = true;
    GameState.ballFreezeUntil = Date.now() + 1000; // 1 second from now
    
    // Automatically continue the game instead of waiting for SPACE press
    GameState.gameRunning = true;
    
    // Reset paddle sizes and speeds to default values to prevent accumulated speed changes
    GameState.player1PaddleHeight = Constants.PADDLE_HEIGHT;
    GameState.player2PaddleHeight = Constants.PADDLE_HEIGHT;
    GameState.player1PaddleSpeed = Constants.PADDLE_SPEED;
    GameState.player2PaddleSpeed = Constants.PADDLE_SPEED;
    
    // Clear all active effects
    for (const player of ['player1', 'player2']) {
        for (const effectId in GameState.activeEffects[player]) {
            const effect = GameState.activeEffects[player][effectId];
            if (effect.element) effect.element.remove();
        }
        GameState.activeEffects[player] = {};
    }
    
    UI.player1EffectsEl.innerHTML = '';
    UI.player2EffectsEl.innerHTML = '';
    
    // Reset rally counter
    GameState.rallyCount = 0;
    
    // Reset screen shake
    GameState.screenShake = { x: 0, y: 0, timeLeft: 0 };
    
    // Check for danger mode (close scores)
    GameState.dangerMode = Math.abs(GameState.player1Score - GameState.player2Score) <= 2 && 
                Math.max(GameState.player1Score, GameState.player2Score) >= 5;
}

// Update screen shake effect
function updateScreenShake() {
    if (GameState.screenShake.timeLeft > 0) {
        GameState.screenShake.timeLeft -= 16; // Approximate for 60fps
        if (GameState.screenShake.timeLeft <= 0) {
            GameState.screenShake.x = 0;
            GameState.screenShake.y = 0;
        } else {
            GameState.screenShake.x = (Math.random() - 0.5) * Constants.SCREEN_SHAKE_INTENSITY;
            GameState.screenShake.y = (Math.random() - 0.5) * Constants.SCREEN_SHAKE_INTENSITY;
        }
    }
}

// Update paddle positions
function updatePaddles(deltaTime) {
    if (GameState.autoMode) {
        // Find the most relevant ball to track (closest one heading towards each paddle)
        let player1Target = GameState.canvasHeight / 2;
        let player2Target = GameState.canvasHeight / 2;
        
        GameState.balls.forEach(ball => {
            // For player 1, track balls moving left
            if (ball.speedX < 0) {
                const timeToReach = (ball.x - GameState.PADDLE_MARGIN) / -ball.speedX;
                const predictedY = ball.y + ball.speedY * timeToReach;
                if (timeToReach > 0) {
                    player1Target = predictedY;
                }
            }
            // For player 2, track balls moving right
            else if (ball.speedX > 0) {
                const timeToReach = (GameState.canvasWidth - GameState.PADDLE_MARGIN - GameState.PADDLE_WIDTH - ball.x) / ball.speedX;
                const predictedY = ball.y + ball.speedY * timeToReach;
                if (timeToReach > 0) {
                    player2Target = predictedY;
                }
            }
        });
        
        // Update CPU-controlled paddle positions
        GameState.player1Y = updateCPUPaddle(GameState.player1Y, GameState.player1PaddleHeight, player1Target, GameState.player1PaddleSpeed * (deltaTime/16.67));
        GameState.player2Y = updateCPUPaddle(GameState.player2Y, GameState.player2PaddleHeight, player2Target, GameState.player2PaddleSpeed * (deltaTime/16.67));
    } else {
        // Normal player controls
        if (GameState.keys.w && GameState.player1Y > 0) {
            GameState.player1Y -= GameState.player1PaddleSpeed * (deltaTime/16.67);
        }
        if (GameState.keys.s && GameState.player1Y + GameState.player1PaddleHeight < GameState.canvasHeight) {
            GameState.player1Y += GameState.player1PaddleSpeed * (deltaTime/16.67);
        }
        
        if (GameState.keys.arrowup && GameState.player2Y > 0) {
            GameState.player2Y -= GameState.player2PaddleSpeed * (deltaTime/16.67);
        }
        if (GameState.keys.arrowdown && GameState.player2Y + GameState.player2PaddleHeight < GameState.canvasHeight) {
            GameState.player2Y += GameState.player2PaddleSpeed * (deltaTime/16.67);
        }
    }
}

// CPU paddle movement logic
function updateCPUPaddle(paddleY, paddleHeight, targetY, paddleSpeed) {
    // Add some reaction delay/imperfection to make it more natural
    const reactionThreshold = 10;
    const paddleCenter = paddleY + paddleHeight / 2;
      if (Math.abs(paddleCenter - targetY) > reactionThreshold) {
        // Move towards the target
        if (paddleCenter < targetY) {
            return Math.min(paddleY + paddleSpeed, GameState.canvasHeight - paddleHeight);
        } else {
            return Math.max(paddleY - paddleSpeed, 0);
        }
    }
    return paddleY;
}

// Draw ball trails
let ballTrails = {}; // To track ball trails

function updateBallTrails() {
    // Create an entry for each ball
    GameState.balls.forEach((ball, index) => {
        if (!ballTrails[index]) {
            ballTrails[index] = [];
        }
        
        // Add current position to trail
        ballTrails[index].unshift({x: ball.x, y: ball.y});
        
        // Limit trail length
        if (ballTrails[index].length > Constants.TRAIL_LENGTH) {
            ballTrails[index].pop();
        }
    });
    
    // Remove trails for balls that no longer exist
    for (let index in ballTrails) {
        if (!GameState.balls[index]) {
            delete ballTrails[index];
        }
    }
}

function drawBallTrails() {
    // Update trails first
    updateBallTrails();
    
    // Draw each trail
    for (let index in ballTrails) {
        const trail = ballTrails[index];
        const ball = GameState.balls[index];
        
        if (ball) {
            // Calculate speed magnitude for intensity effects
            const speedMagnitude = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
            const speedFactor = Math.min(speedMagnitude / 20, 1); // Normalize speed (0-1)
            
            // Longer trails at higher speeds
            const trailLength = Math.min(trail.length, Math.floor(5 + speedFactor * 15));
            
            for (let i = 0; i < trailLength; i++) {
                // Enhanced opacity and size for high speeds
                const opacity = (1 - i / trailLength) * 0.5 * (1 + speedFactor);
                const size = Constants.BALL_RADIUS * (1 - i / trailLength * 0.5) * (1 + speedFactor * 0.3);
                
                // Color shifts with speed - from white to orange/red at high speeds
                const r = 255;
                const g = Math.max(255 - speedFactor * 200 - (i / trailLength) * 50, 120);
                const b = Math.max(255 - speedFactor * 255 - (i / trailLength) * 50, 50);
                
                UI.ctx.beginPath();
                UI.ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2);
                UI.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                UI.ctx.fill();
            }
            
            // Add intensity particles at high speeds
            if (speedFactor > 0.6 && Math.random() < speedFactor * 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Constants.BALL_RADIUS * 1.2;
                
                Particles.createParticles(
                    ball.x + Math.cos(angle) * distance,
                    ball.y + Math.sin(angle) * distance,
                    1,
                    {
                        speedMin: 0.2,
                        speedMax: 1.0 * speedFactor,
                        sizeMin: 1,
                        sizeMax: 2 + speedFactor * 2,
                        color: `rgba(255, ${Math.floor(180 - speedFactor * 180)}, ${Math.floor(100 - speedFactor * 100)}, ${0.7 + speedFactor * 0.3})`,
                        lifeMin: 5 + speedFactor * 10,
                        lifeMax: 10 + speedFactor * 20
                    }
                );
            }
        }
    }
}

// Check for combo milestones and create effects
function handleComboMilestones(prevCount, newCount, ball) {
    const milestones = [5, 10, 15, 20];
    for (const milestone of milestones) {
        if (prevCount < milestone && newCount >= milestone) {
            // Screen shake intensity increases with higher milestones
            const shakeIntensity = (milestone / 5) * Constants.SCREEN_SHAKE_INTENSITY;
            GameState.screenShake.x = (Math.random() - 0.5) * shakeIntensity;
            GameState.screenShake.y = (Math.random() - 0.5) * shakeIntensity;
            GameState.screenShake.timeLeft = Constants.SCREEN_SHAKE_DURATION;
            
            // Create milestone particle effects
            const particleCount = milestone * 2;
            const color = milestone >= 15 ? 'rgba(255, 50, 50, 0.8)' : 
                         milestone >= 10 ? 'rgba(255, 150, 50, 0.8)' : 
                         'rgba(255, 255, 150, 0.8)';
            
            Particles.createParticles(
                ball.x,
                ball.y,
                particleCount,
                {
                    speedMin: 2,
                    speedMax: 5,
                    sizeMin: 2,
                    sizeMax: 4,
                    color: color,
                    lifeMin: 30,
                    lifeMax: 50
                }
            );
            
            // Create shockwave effect for higher milestones
            if (milestone >= 10) {
                Particles.createShockwave(
                    ball.x,
                    ball.y,
                    Constants.BALL_RADIUS * 2,
                    Constants.BALL_RADIUS * (milestone / 2),
                    color
                );
            }
        }
    }
}

// Update ball positions and check for collisions
function updateBalls(deltaTime) {
    for (let i = GameState.balls.length - 1; i >= 0; i--) {
        const ball = GameState.balls[i];

        // Check if the ball should still be frozen
        if (GameState.ballFrozen && Date.now() < GameState.ballFreezeUntil) {
            // Ball is frozen, just show the countdown
            UI.drawBallCountdown(ball, GameState.ballFreezeUntil);
            continue; // Skip movement updates while frozen
        } else if (GameState.ballFrozen) {
            // Time's up, unfreeze the ball
            GameState.ballFrozen = false;
        }

        // Ensure we have valid speed values before applying hazard effects
        if (isNaN(ball.speedX) || isNaN(ball.speedY)) {
            ball.speedX = Constants.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
            ball.speedY = Constants.BALL_SPEED * (Math.random() * 0.8 - 0.4);
        }        // Apply curve effect if active
        if (ball.curveActive) {
            const elapsedTime = Date.now() - ball.curveStartTime;
            if (elapsedTime > Constants.POWERUP_DURATION) {
                ball.curveActive = false;
                ball.curveAngle = 0;
            } else {
                const maxCurveForce = 0.4;
                const curvePeriod = 2000;
                const curveAngle = (elapsedTime % curvePeriod) / curvePeriod * Math.PI * 2;
                const direction = Math.atan2(ball.speedY, ball.speedX);
                const perpendicular = direction + Math.PI/2;
                const forceMagnitude = Math.sin(curveAngle) * maxCurveForce;
                ball.speedX += Math.cos(perpendicular) * forceMagnitude * (deltaTime/16.67);
                ball.speedY += Math.sin(perpendicular) * forceMagnitude * (deltaTime/16.67);
            }
        }

        // Apply hazard effects to ball movement
        Hazards.applyHazardEffects(ball, GameState.activeHazards, GameState.applyScreenShake.bind(GameState), deltaTime);
        
        // Move the ball
        ball.x += ball.speedX * (deltaTime/16.67);
        ball.y += ball.speedY * (deltaTime/16.67);
        
        // Check collisions with walls and paddles
        const collisionData = Physics.checkBallCollisions(
            ball,
            GameState.player1Y,
            GameState.player2Y,
            GameState.player1PaddleHeight,
            GameState.player2PaddleHeight,
            GameState.canvasWidth,
            GameState.canvasHeight,
            GameState.applyScreenShake.bind(GameState),
            GameState.rallyCount // Pass rally count for combo-based effects
        );
        
        // Update rally count if paddle hit
        if (collisionData.paddleHit) {
            const prevCount = GameState.rallyCount;
            GameState.rallyCount += collisionData.rallyIncrement;
            handleComboMilestones(prevCount, GameState.rallyCount, ball);
        }
        
        // Handle scoring
        if (collisionData.scored) {
            if (collisionData.scoringPlayer === 1) {
                GameState.player1Score++;
                UI.player1ScoreEl.textContent = GameState.player1Score;
                Particles.createScoreAnimation(1, ball.y, GameState.canvasWidth);
            } else {
                GameState.player2Score++;
                UI.player2ScoreEl.textContent = GameState.player2Score;
                Particles.createScoreAnimation(2, ball.y, GameState.canvasWidth);
            }
            
            GameState.balls.splice(i, 1);
            if (GameState.balls.length === 0) {
                resetRound();
            }
        }
    }
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time for consistent movement
    const deltaTime = timestamp - GameState.lastTime || 0;
    GameState.lastTime = timestamp;
    
    // Update screen shake effect
    updateScreenShake();
    
    // Apply screen shake to canvas
    UI.ctx.save();
    if (GameState.screenShake.timeLeft > 0) {
        UI.ctx.translate(GameState.screenShake.x, GameState.screenShake.y);
    }
    
    // Clear canvas with background that changes during danger mode
    UI.ctx.clearRect(0, 0, GameState.canvasWidth, GameState.canvasHeight);
    
    // Create a gradient background
    const bgGradient = UI.ctx.createLinearGradient(0, 0, 0, GameState.canvasHeight);
    if (GameState.dangerMode) {
        const intensity = Math.sin(timestamp / 200) * 0.1 + 0.2;
        bgGradient.addColorStop(0, `rgba(40, ${Math.floor(intensity * 20)}, ${Math.floor(intensity * 20)}, 1)`) ;
        bgGradient.addColorStop(1, 'rgba(20, 0, 0, 1)');
    } else {
        bgGradient.addColorStop(0, 'rgba(0, 10, 30, 1)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 10, 1)');
    }
    UI.ctx.fillStyle = bgGradient;
    UI.ctx.fillRect(0, 0, GameState.canvasWidth, GameState.canvasHeight);
    
    // Draw background stars
    Rendering.drawBackgroundStars(GameState.backgroundStars, timestamp);
    
    if (GameState.gameRunning) {
        // Check for pause toggle
        if ((GameState.keys.p && !GameState.prevPauseState) || 
            (GameState.keys.escape && !GameState.prevEscapeState)) {
            GameState.togglePause();
        }
        GameState.prevPauseState = GameState.keys.p;
        GameState.prevEscapeState = GameState.keys.escape;
        
        // Only update game state if not paused
        if (!GameState.paused) {
            // Update game state
            updatePaddles(deltaTime);
            GameState.activeHazards = Hazards.updateHazards(GameState.activeHazards, GameState.canvasWidth, GameState.canvasHeight, deltaTime);
            updateBalls(deltaTime);
            GameState.activePowerUps = PowerUps.checkPowerUpCollisions(
                GameState.balls, 
                GameState.activePowerUps,
                (type, player) => PowerUps.applyPowerUp(type, player, GameState),
                deltaTime
            );
            GameState.activePowerUps = PowerUps.spawnPowerUps(
                GameState.activePowerUps,
                GameState.canvasWidth,
                GameState.canvasHeight,
                GameState.dangerMode,
                GameState,
                deltaTime
            );
            GameState.activeHazards = Hazards.spawnHazards(
                GameState.activeHazards, 
                GameState.canvasWidth,
                GameState.canvasHeight,
                GameState.dangerMode,
                GameState,
                deltaTime
            );
        }
        
        // Draw game elements - always rendered even when paused
        Rendering.drawArena(GameState.canvasWidth, GameState.canvasHeight);
        Rendering.drawCenterLine(GameState.canvasWidth, GameState.canvasHeight);
        Rendering.drawPaddles(
            GameState.canvasWidth, 
            GameState.player1Y, 
            GameState.player2Y, 
            GameState.player1PaddleHeight,
            GameState.player2PaddleHeight
        );
        Rendering.drawHazards(GameState.activeHazards, timestamp);
        
        // Only draw dynamic effects if not paused
        if (!GameState.paused) {
            drawBallTrails();
        }
        
        Rendering.drawBalls(GameState.balls);
        
        if (GameState.ballFrozen && GameState.balls.length > 0) {
            UI.drawBallCountdown(GameState.balls[0], GameState.ballFreezeUntil); 
        }
        
        Rendering.drawPowerUps(GameState.activePowerUps);
        
        // Only update particles if not paused
        if (!GameState.paused) {
            Particles.updateParticles(deltaTime);
        }
        
        Particles.drawParticles(); 
        Particles.drawScoreAnimations(); 
        
        // Additional visual effects
        if (GameState.dangerMode) {
            Rendering.drawDangerEffects(timestamp, GameState.canvasWidth, GameState.canvasHeight);
        }
        
        // Add particle effects for intense moments
        if (GameState.rallyCount > 3 && !GameState.paused) {
            const mainBall = Rendering.drawRallyEffect(GameState.balls, GameState.rallyCount, GameState.canvasWidth);
            
            // Add small particles around main ball for high rally counts
            if (GameState.rallyCount > 8 && Math.random() < 0.2 && mainBall) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Constants.BALL_RADIUS * 2;
                Particles.createParticles(
                    mainBall.x + Math.cos(angle) * distance,
                    mainBall.y + Math.sin(angle) * distance,
                    1,
                    {
                        speedMin: 0.3,
                        speedMax: 0.7,
                        sizeMin: 1,
                        sizeMax: 3,
                        color: `hsl(${30 + GameState.rallyCount * 5}, 100%, 60%)`,
                        lifeMin: 10,
                        lifeMax: 20
                    }
                );
            }
        }
        
        // Add speed-based screen shake for very fast balls
        if (!GameState.paused) {
            GameState.balls.forEach(ball => {
                const speedMagnitude = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
                if (speedMagnitude > 20 && Math.random() < 0.05) {
                    // Light screen shake for very fast balls to add intensity
                    const shakeIntensity = (speedMagnitude - 20) / 10;
                    GameState.screenShake.x = (Math.random() - 0.5) * Constants.SCREEN_SHAKE_INTENSITY * shakeIntensity;
                    GameState.screenShake.y = (Math.random() - 0.5) * Constants.SCREEN_SHAKE_INTENSITY * shakeIntensity;
                    GameState.screenShake.timeLeft = 100; // Short duration
                }
            });
        }
    }
    
    UI.ctx.restore(); // Restore canvas state after screen shake
    
    requestAnimationFrame(gameLoop);
}

// Input handlers
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    // Special handling for arrow keys
    if (key === 'arrowup' || key === 'arrowdown') {
        GameState.keys[key] = true;
    } else if (key in GameState.keys) {
        GameState.keys[key] = true;
    }
    
    // Handle game start
    if (key === ' ' && !GameState.gameRunning) {
        startGame();
    }
    
    // Handle game modes
    if (key === 'p' && e.altKey) {
        e.preventDefault(); // Prevent the 'p' key from triggering pause
        GameState.playgroundMode = !GameState.playgroundMode;
        UI.showNotification(
            `Playground Mode: ${GameState.playgroundMode ? 'ON' : 'OFF'}`,
            GameState.playgroundMode ? '#00aa00' : '#aa0000'
        );
    } else if (key === 'a' && e.altKey) {
        e.preventDefault();
        GameState.autoMode = !GameState.autoMode;
        UI.showNotification(
            `Auto Mode: ${GameState.autoMode ? 'ON' : 'OFF'}`,
            GameState.autoMode ? '#00aaaa' : '#666666'
        );
    }
    
    // Handle playground mode controls
    if (GameState.playgroundMode && GameState.gameRunning) {
        if (key === 'n' || key === 'm') {
            if (e.shiftKey) {
                // Cycle through hazards
                if (key === 'n') {
                    GameState.playgroundHazardIndex = (GameState.playgroundHazardIndex <= -1) ? 
                        Constants.hazardTypes.length - 1 : GameState.playgroundHazardIndex - 1;
                } else {
                    GameState.playgroundHazardIndex = (GameState.playgroundHazardIndex >= Constants.hazardTypes.length - 1) ? 
                        -1 : GameState.playgroundHazardIndex + 1;
                }
                GameState.activeHazards = [];
                UI.showNotification(
                    GameState.playgroundHazardIndex === -1 ? 
                        'Hazards: Disabled' : 
                        `Selected Hazard: ${Constants.hazardTypes[GameState.playgroundHazardIndex].type}`,
                    GameState.playgroundHazardIndex === -1 ? '#666666' : '#4488ff'
                );
            } else {
                // Cycle through powerups
                if (key === 'n') {
                    GameState.playgroundPowerUpIndex = (GameState.playgroundPowerUpIndex <= -1) ? 
                        Constants.powerUpTypes.length - 1 : GameState.playgroundPowerUpIndex - 1;
                } else {
                    GameState.playgroundPowerUpIndex = (GameState.playgroundPowerUpIndex >= Constants.powerUpTypes.length - 1) ? 
                        -1 : GameState.playgroundPowerUpIndex + 1;
                }
                GameState.activePowerUps = [];
                UI.showNotification(
                    GameState.playgroundPowerUpIndex === -1 ? 
                        'Power-ups: Disabled' : 
                        `Selected Power-up: ${Constants.powerUpTypes[GameState.playgroundPowerUpIndex].type}`,
                    GameState.playgroundPowerUpIndex === -1 ? '#666666' : '#44ff88'
                );
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'arrowdown') {
        GameState.keys[key] = false;
    } else if (key in GameState.keys) {
        GameState.keys[key] = false;
    }
});

// Initialize the game at startup
initGame();
