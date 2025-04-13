import { POWERUP_SPAWN_CHANCE, POWERUP_MAX, powerUpTypes, BALL_RADIUS, POWERUP_SIZE, POWERUP_DURATION } from './constants.js';
import { player1EffectsEl, player2EffectsEl } from './ui.js';

// Check for ball collision with power-ups
export function checkPowerUpCollisions(balls, activePowerUps, applyPowerUp) {
    const collidedPowerUps = [];
    
    for (let i = activePowerUps.length - 1; i >= 0; i--) {
        const powerUp = activePowerUps[i];
        
        for (const ball of balls) {
            // Use slightly larger detection area for star-shaped powerups
            const collisionRadius = powerUp.shape === 'star' ? 
                POWERUP_SIZE/1.8 : POWERUP_SIZE/2;
            
            if (Math.hypot(ball.x - powerUp.x, ball.y - powerUp.y) < BALL_RADIUS + collisionRadius) {
                // Determine which player gets the power-up (based on ball direction)
                // The ball is moving AWAY from the player who last hit it, so we need to reverse the logic
                const player = ball.speedX > 0 ? 'player1' : 'player2';
                
                // Create collection particles before applying power-up
                createPowerUpCollectionEffect(powerUp);
                
                // Apply the power-up effect
                applyPowerUp(powerUp.type, player);
                collidedPowerUps.push(i);
                break;
            }
        }
    }
    
    // Remove collided power-ups in reverse order to avoid index issues
    collidedPowerUps.sort((a, b) => b - a).forEach(index => {
        activePowerUps.splice(index, 1);
    });
    
    return activePowerUps;
}

// Create visual effect when powerup is collected
function createPowerUpCollectionEffect(powerUp) {
    // Import from particles at the module level to avoid circular dependencies
    import('./particles.js').then(Particles => {
        // Use custom particle configuration if available, or fallback values
        const particleConfig = powerUp.particles || {
            color: powerUp.glowColor || `${powerUp.color}bb`,
            count: 12,
            speedMax: 3
        };
        
        // Create explosion particles
        Particles.createParticles(
            powerUp.x, 
            powerUp.y, 
            particleConfig.count, 
            {
                speedMin: 1,
                speedMax: particleConfig.speedMax,
                sizeMin: 2,
                sizeMax: 5,
                color: particleConfig.color,
                lifeMin: 25,
                lifeMax: 50,
                spreadAngle: Math.PI * 2 // Full circular explosion
            }
        );
        
        // Create a shockwave effect for special powerups
        if (powerUp.type === 'fury' || powerUp.type === 'multiball') {
            const shockwaveColor = powerUp.type === 'fury' ? 
                'rgba(255, 50, 20, 0.6)' : 'rgba(255, 150, 50, 0.6)';
            
            // Create shockwave particle
            Particles.createShockwave(
                powerUp.x,
                powerUp.y,
                POWERUP_SIZE * 1.2,
                POWERUP_SIZE * 4,
                shockwaveColor
            );
        }
    });
}

// Spawn power-ups with intensity-based probabilities
export function spawnPowerUps(activePowerUps, canvasWidth, canvasHeight, dangerMode) {
    let spawnChance = POWERUP_SPAWN_CHANCE;
    let updatedPowerUps = [...activePowerUps];
    
    // Increase spawn chance in danger mode
    if (dangerMode) {
        spawnChance *= 1.5;
    }
    
    if (Math.random() < spawnChance && updatedPowerUps.length < POWERUP_MAX) {
        // Choose power-up type, with Fury being rare but more common in danger mode
        let powerUpIndex;
        if (dangerMode && Math.random() < 0.2) {
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
        let x, y;
        let validPosition = false;
        let attempts = 0;
        const MIN_DISTANCE = POWERUP_SIZE * 2.5; // Minimum distance between powerups
        
        while (!validPosition && attempts < 15) {
            x = Math.random() * (canvasWidth - 200) + 100;
            y = Math.random() * (canvasHeight - 100) + 50;
            
            // Check distance from other powerups
            validPosition = true;
            for (const existing of updatedPowerUps) {
                const dist = Math.hypot(x - existing.x, y - existing.y);
                if (dist < MIN_DISTANCE) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }
        
        // Create the powerup with all visual properties from the template
        const powerUp = {
            x,
            y,
            type: powerUpTemplate.type,
            color: powerUpTemplate.color,
            effect: powerUpTemplate.effect,
            description: powerUpTemplate.description,
            shape: powerUpTemplate.shape || 'circle',
            glowColor: powerUpTemplate.glowColor,
            icon: powerUpTemplate.icon,
            particles: powerUpTemplate.particles,
            createdAt: Date.now(),
            // Add spawn animation properties
            spawning: true,
            spawnProgress: 0,
            rotationSpeed: (Math.random() * 0.1) - 0.05
        };
        
        // Create spawn particles effect around the new powerup
        import('./particles.js').then(Particles => {
            // Create a burst of particles at the spawn location
            Particles.createParticles(
                x, y, 8, 
                {
                    speedMin: 0.5,
                    speedMax: 2,
                    sizeMin: 1,
                    sizeMax: 3,
                    color: powerUp.glowColor || `${powerUp.color}aa`,
                    lifeMin: 20,
                    lifeMax: 35,
                    spreadAngle: Math.PI * 2
                }
            );
            
            // Create a shockwave at the spawn location
            Particles.createShockwave(
                x, y, 
                POWERUP_SIZE/2,  // Initial radius 
                POWERUP_SIZE*2, // Max radius
                powerUp.glowColor || `${powerUp.color}88`
            );
        });
        
        updatedPowerUps.push(powerUp);
    }
    
    // Update powerups - handle spawn animations
    updatedPowerUps = updatedPowerUps.map(powerUp => {
        // If powerup is in spawn animation
        if (powerUp.spawning) {
            const elapsedTime = Date.now() - powerUp.createdAt;
            if (elapsedTime > 300) { // End spawn animation after 300ms
                powerUp.spawning = false;
                powerUp.spawnProgress = 1;
            } else {
                // Progress from 0 to 1 during spawn animation
                powerUp.spawnProgress = Math.min(elapsedTime / 300, 1);
            }
        }
        
        // Add movement - small hovering effect
        if (!powerUp.hovering) {
            powerUp.hovering = {
                amplitude: 2 + Math.random() * 1.5, // Random amplitude
                frequency: 0.001 + Math.random() * 0.001, // Random frequency
                phase: Math.random() * Math.PI * 2, // Random phase
                baseY: powerUp.y
            };
        }
        
        // Apply hovering effect to y position
        if (powerUp.hovering) {
            const hover = powerUp.hovering;
            powerUp.y = hover.baseY + Math.sin(Date.now() * hover.frequency + hover.phase) * hover.amplitude;
        }
        
        return powerUp;
    });
    
    return updatedPowerUps;
}

// Apply power-up effect to a player
export function applyPowerUp(type, player, gameState) {
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const effectsEl = player === 'player1' ? player1EffectsEl : player2EffectsEl;
    
    // Create effect indicator with tooltip
    const effectId = `${player}-${type}-${Date.now()}`;
    const effectDiv = document.createElement('div');
    effectDiv.className = 'effect-indicator';
    effectDiv.id = effectId;
    
    // Set effect properties based on type
    switch(type) {
        case 'speedUp':
            effectDiv.textContent = '+SPD';
            effectDiv.style.backgroundColor = '#00ff00';
            effectDiv.title = 'Speed Boost: Your paddle moves 38% faster';
            if (player === 'player1') gameState.player1PaddleSpeed += 3;
            else gameState.player2PaddleSpeed += 3;
            break;
        case 'slowDown':
            effectDiv.textContent = '-SPD';
            effectDiv.style.backgroundColor = '#ff0000';
            effectDiv.title = 'Slow Opponent: Opponent paddle moves 38% slower';
            if (opponent === 'player1') gameState.player1PaddleSpeed = Math.max(3, gameState.player1PaddleSpeed - 3);
            else gameState.player2PaddleSpeed = Math.max(3, gameState.player2PaddleSpeed - 3);
            break;
        case 'growPaddle':
            effectDiv.textContent = '+PAD';
            effectDiv.style.backgroundColor = '#0088ff';
            effectDiv.title = 'Paddle Growth: Your paddle is 40% larger';
            if (player === 'player1') gameState.player1PaddleHeight += 40;
            else gameState.player2PaddleHeight += 40;
            break;
        case 'shrinkPaddle':
            effectDiv.textContent = '-PAD';
            effectDiv.style.backgroundColor = '#ff00ff';
            effectDiv.title = 'Shrink Opponent: Opponent paddle is 30% smaller';
            if (opponent === 'player1') gameState.player1PaddleHeight = Math.max(30, gameState.player1PaddleHeight - 30);
            else gameState.player2PaddleHeight = Math.max(30, gameState.player2PaddleHeight - 30);
            break;
        case 'fastBall':
            effectDiv.textContent = '+BALL';
            effectDiv.style.backgroundColor = '#ffff00';
            effectDiv.title = 'Fast Ball: Ball speed increased by 30%';
            gameState.balls.forEach(ball => {
                ball.speedX *= 1.3;
                ball.speedY *= 1.3;
            });
            break;
        case 'multiball':
            effectDiv.textContent = 'MULTI';
            effectDiv.style.backgroundColor = '#ff8800';
            effectDiv.title = 'Multi Ball: Adds an extra ball to the game';
            // Add a new ball with similar properties to the existing one
            if (gameState.balls.length > 0) {
                const templateBall = gameState.balls[0];
                gameState.balls.push({
                    x: gameState.canvasWidth / 2,
                    y: gameState.canvasHeight / 2,
                    speedX: -templateBall.speedX,
                    speedY: Math.random() * 6 - 3
                });
            }
            break;
        case 'fury':
            effectDiv.textContent = 'FURY';
            effectDiv.style.backgroundColor = '#ff1111';
            effectDiv.title = 'Fury Mode: Paddle size +30%, speed +50%, ball speed +40%';
            
            // Fury mode - multiple intense effects
            if (player === 'player1') {
                gameState.player1PaddleHeight += 30;
                gameState.player1PaddleSpeed += 4;
            } else {
                gameState.player2PaddleHeight += 30;
                gameState.player2PaddleSpeed += 4;
            }
            
            // Increase all ball speeds dramatically
            gameState.balls.forEach(ball => {
                ball.speedX *= 1.4;
                ball.speedY *= 1.4;
            });
            
            // Add screen shake for dramatic effect
            gameState.applyScreenShake();
            break;
        case 'curveShot':
            effectDiv.textContent = 'CURVE';
            effectDiv.style.backgroundColor = '#ff9900';
            effectDiv.title = 'Curve Shot: Ball curves dynamically for 5 seconds';

            // Apply curve effect to all balls
            gameState.balls.forEach(ball => {
                ball.curveActive = true;
                ball.curveStartTime = Date.now();
            });
            break;
    }
    
    effectsEl.appendChild(effectDiv);
    gameState.activeEffects[player][effectId] = { type, element: effectDiv };
    
    // Add duration counter
    const durationIndicator = document.createElement('span');
    durationIndicator.className = 'duration-indicator';
    effectDiv.appendChild(durationIndicator);
    
    // Update duration counter
    let timeLeft = POWERUP_DURATION;
    const durationInterval = setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft <= 0) {
            clearInterval(durationInterval);
        } else {
            const seconds = Math.ceil(timeLeft / 1000);
            durationIndicator.textContent = ` ${seconds}s`;
        }
    }, 1000);
    
    // Remove effect after duration
    setTimeout(() => {
        removeEffect(player, effectId, gameState);
        clearInterval(durationInterval);
    }, POWERUP_DURATION);
}

// Remove an active effect
export function removeEffect(player, effectId, gameState) {
    if (!gameState.activeEffects[player][effectId]) return;
    
    const effect = gameState.activeEffects[player][effectId];
    const type = effect.type;
    const opponent = player === 'player1' ? 'player2' : 'player1';
    
    // Revert changes based on effect type
    switch(type) {
        case 'speedUp':
            if (player === 'player1') gameState.player1PaddleSpeed = gameState.PADDLE_SPEED;
            else gameState.player2PaddleSpeed = gameState.PADDLE_SPEED;
            break;
        case 'slowDown':
            if (opponent === 'player1') gameState.player1PaddleSpeed = gameState.PADDLE_SPEED;
            else gameState.player2PaddleSpeed = gameState.PADDLE_SPEED;
            break;
        case 'growPaddle':
            if (player === 'player1') gameState.player1PaddleHeight = gameState.PADDLE_HEIGHT;
            else gameState.player2PaddleHeight = gameState.PADDLE_HEIGHT;
            break;
        case 'shrinkPaddle':
            if (opponent === 'player1') gameState.player1PaddleHeight = gameState.PADDLE_HEIGHT;
            else gameState.player2PaddleHeight = gameState.PADDLE_HEIGHT;
            break;
        case 'fury':
            if (player === 'player1') {
                gameState.player1PaddleHeight = gameState.PADDLE_HEIGHT;
                gameState.player1PaddleSpeed = gameState.PADDLE_SPEED;
            } else {
                gameState.player2PaddleHeight = gameState.PADDLE_HEIGHT;
                gameState.player2PaddleSpeed = gameState.PADDLE_SPEED;
            }
            break;
    }
    
    // Remove the effect indicator
    effect.element.remove();
    delete gameState.activeEffects[player][effectId];
}
