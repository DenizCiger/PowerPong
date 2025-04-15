import { BALL_RADIUS, VORTEX_RADIUS, BARRIER_HEIGHT, BARRIER_WIDTH, hazardTypes, HAZARD_MAX, HAZARD_SPAWN_RATE, GRAVITY_STRENGTH, WIND_STRENGTH, PLAYGROUND_MAX_HAZARDS, PLAYGROUND_SPAWN_CHANCE } from './constants.js';
import { createTeleportEffect, createParticles } from './particles.js';
import { showHazardNotification } from './ui.js';

// Spawn hazards with random chance
export function spawnHazards(activeHazards, canvasWidth, canvasHeight, dangerMode, gameState) {
    // Don't spawn hazards if max reached
    const maxHazards = gameState.playgroundMode ? PLAYGROUND_MAX_HAZARDS : HAZARD_MAX;
    if (activeHazards.length >= maxHazards) return activeHazards;
    
    // Clone the active hazards array
    let updatedHazards = [...activeHazards];
    
    // Adjust spawn chance based on mode
    let spawnChance;
    if (gameState.playgroundMode) {
        spawnChance = PLAYGROUND_SPAWN_CHANCE;
    } else {
        spawnChance = dangerMode ? HAZARD_SPAWN_RATE * 2 : HAZARD_SPAWN_RATE;
    }
      if (Math.random() < spawnChance && 
        !(gameState.playgroundMode && gameState.playgroundHazardIndex === -1)) {
        // Choose hazard type based on mode
        const hazardIndex = gameState.playgroundMode ? 
            gameState.playgroundHazardIndex : 
            Math.floor(Math.random() * hazardTypes.length);
        const hazardTemplate = hazardTypes[hazardIndex];
        
        // Make sure we don't place hazards too close to paddles
        const safeZone = 100;
        const x = Math.random() * (canvasWidth - 2 * safeZone) + safeZone;
        const y = Math.random() * (canvasHeight - 100) + 50;
        
        // Create hazard object
        const hazard = {
            ...structuredClone(hazardTemplate),
            x,
            y,
            createdAt: Date.now(),
            id: Date.now() + Math.random()
        };
        
        // Special handling for specific hazard types
        if (hazard.type === 'windZone') {
            // Random wind direction
            const angle = Math.random() * Math.PI * 2;
            hazard.direction = {
                x: Math.cos(angle) * WIND_STRENGTH,
                y: Math.sin(angle) * WIND_STRENGTH
            };
        } 
        else if (hazard.type === 'portal') {
            // Create exit portal
            const exitX = Math.random() * (canvasWidth - 2 * safeZone) + safeZone;
            const exitY = Math.random() * (canvasHeight - 100) + 50;
            const exitPortal = {
                ...structuredClone(hazardTemplate),
                x: exitX,
                y: exitY,
                createdAt: Date.now(),
                id: Date.now() + Math.random() + 1,
                isExit: true
            };
            
            // Link the portals
            hazard.linkedPortalId = exitPortal.id;
            exitPortal.linkedPortalId = hazard.id;
            
            // Add exit portal
            updatedHazards.push(exitPortal);
        }
        else if (hazard.type === 'barrier') {
            // Initialize hit points for barriers
            hazard.currentHitPoints = hazard.hitPoints;
        }
        
        updatedHazards.push(hazard);
    }
    
    return updatedHazards;
}

// Update hazards (animation, removal of expired hazards)
export function updateHazards(activeHazards, canvasWidth, canvasHeight) {
    const currentTime = Date.now();
    
    // Remove expired hazards (except barriers, which expire on hit count)
    let updatedHazards = activeHazards.filter(hazard => {
        if (hazard.type === 'barrier') {
            return hazard.currentHitPoints > 0;
        }
          // If it's a black hole with a trapped ball, check if it's time to despawn
        if (hazard.type === 'blackHole' && hazard.trappedBall && 
            currentTime - hazard.trappedStartTime > 2000) { // 2 seconds after trapping a ball
            
            // Eject the ball with a more reasonable speed
            const ball = hazard.trappedBall;
            const angle = Math.random() * Math.PI * 2; // Random direction
            const baseSpeed = Math.sqrt(ball.storedSpeedX * ball.storedSpeedX + ball.storedSpeedY * ball.storedSpeedY);            const ejectionSpeed = Math.min(Math.max(baseSpeed * 0.8, 6), 12); // Balance speed with min/max caps
            
            // Place ball outside black hole before applying velocity
            ball.x = hazard.x + Math.cos(angle) * (VORTEX_RADIUS * 1.5);
            ball.y = hazard.y + Math.sin(angle) * (VORTEX_RADIUS * 1.5);
            
            // Apply new velocity
            ball.speedX = Math.cos(angle) * ejectionSpeed;
            ball.speedY = Math.sin(angle) * ejectionSpeed;
            ball.trappedInBlackHole = false;
            
            // Create explosive particles during ejection
            createParticles(hazard.x, hazard.y, 25, {
                speedMin: 2,
                speedMax: 6,
                sizeMin: 2,
                sizeMax: 5,
                lifeMin: 30,
                lifeMax: 50,
                color: 'rgba(180, 100, 255, 0.8)',
                spreadAngle: Math.PI * 2
            });
            
            return false; // Remove the black hole
        }
        
        return currentTime - hazard.createdAt < hazard.duration;
    });
    
    // Move any moving hazards
    updatedHazards = updatedHazards.map(hazard => {
        if (hazard.type === 'barrier' && !hazard.velocity) {
            // Initialize velocity for moving barriers
            hazard.velocity = { 
                x: 0, 
                y: (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()) 
            };
        }
        
        if (hazard.velocity) {
            hazard.y += hazard.velocity.y;
            hazard.x += hazard.velocity.x;
            
            // Bounce off walls for moving barriers
            if (hazard.y < 0 || hazard.y + BARRIER_HEIGHT > canvasHeight) {
                hazard.velocity.y = -hazard.velocity.y;
            }
            if (hazard.x < 0 || hazard.x + BARRIER_WIDTH > canvasWidth) {
                hazard.velocity.x = -hazard.velocity.x;
            }
        }
        
        return hazard;
    });
    
    return updatedHazards;
}

// Handle ball-hazard interactions
export function applyHazardEffects(ball, activeHazards, applyScreenShake) {
    let hitBarriers = [];

    // If ball is trapped but its black hole is gone, force release it
    if (ball.trappedInBlackHole) {
        const blackHole = activeHazards.find(h => h.type === 'blackHole' && h.trappedBall === ball);
        
        if (!blackHole) {
            // Black hole is gone, release the ball
            const angle = Math.random() * Math.PI * 2;
            const baseSpeed = ball.storedSpeedX ? 
                Math.sqrt(ball.storedSpeedX * ball.storedSpeedX + ball.storedSpeedY * ball.storedSpeedY) : 
                6; // Default speed if stored speed is missing
            
            ball.speedX = Math.cos(angle) * baseSpeed;
            ball.speedY = Math.sin(angle) * baseSpeed;
            ball.trappedInBlackHole = false;
            
            // Create escape particles
            createParticles(ball.x, ball.y, 15, {
                speedMin: 1,
                speedMax: 3,
                sizeMin: 2,
                sizeMax: 4,
                lifeMin: 20,
                lifeMax: 40,
                color: 'rgba(180, 100, 255, 0.7)',
                spreadAngle: Math.PI * 2
            });
            
            return; // Skip other interactions this frame
        }

        // Continue with normal trapped ball behavior
        const timeSinceTrapped = Date.now() - blackHole.trappedStartTime;
        const orbitRadius = Math.max(0.5, (2000 - timeSinceTrapped) / 2000) * VORTEX_RADIUS * 0.3;
        const orbitSpeed = 0.015 * timeSinceTrapped;
        
        ball.x = blackHole.x + Math.cos(orbitSpeed) * orbitRadius;
        ball.y = blackHole.y + Math.sin(orbitSpeed) * orbitRadius;
        
        return; // Skip other interactions while trapped
    }

    activeHazards.forEach((hazard) => {
        // Calculate distance from ball to hazard center
        const dx = ball.x - hazard.x;
        const dy = ball.y - hazard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch (hazard.type) {
            case 'blackHole':
                // Check if ball has entered the center of the black hole
                if (distance < VORTEX_RADIUS * 0.4 && !ball.trappedInBlackHole) {
                    // Only trap the ball if it's not already trapped
                    ball.trappedInBlackHole = true;
                    ball.storedSpeedX = ball.speedX || 6; // Store current speed for later ejection with default fallback
                    ball.storedSpeedY = ball.speedY || 3;
                    ball.speedX = 0; // Stop regular movement
                    ball.speedY = 0;
                    
                    // Mark the black hole as having trapped a ball
                    hazard.trappedBall = ball;
                    hazard.trappedStartTime = Date.now();
                    
                    // Apply screen shake when ball gets trapped
                    applyScreenShake();
                }
                // Apply gravity effect within an expanded radius (3x the visual radius)
                else if (distance < VORTEX_RADIUS * 3) {
                    // Stronger pull, especially when closer to the center
                    const pullFactor = 2.0; // Increased from original
                    const strength = (1 - distance / (VORTEX_RADIUS * 3)) * GRAVITY_STRENGTH * pullFactor;
                    
                    // Apply stronger pull as the ball gets closer
                    const proximityFactor = (VORTEX_RADIUS * 3 - distance) / (VORTEX_RADIUS * 3); // 0 to 1
                    const enhancedStrength = strength * (1 + proximityFactor * 2);
                    
                    ball.speedX -= dx / distance * enhancedStrength;
                    ball.speedY -= dy / distance * enhancedStrength;
                }
                break;
            case 'whiteHole':
                // Significantly stronger push
                if (distance < VORTEX_RADIUS * 3) {
                    const strength = (1 - distance / (VORTEX_RADIUS * 3)) * GRAVITY_STRENGTH * 3.5; // Increased from 3
                    ball.speedX += dx / distance * strength;
                    ball.speedY += dy / distance * strength;
                }
                break;
                
            case 'windZone':
                // Check if ball is within the wind zone (rectangular)
                const windZoneSize = 150;
                if (Math.abs(dx) < windZoneSize/2 && Math.abs(dy) < windZoneSize/2) {
                    ball.speedX += hazard.direction.x;
                    ball.speedY += hazard.direction.y;
                }
                break;
            case 'barrier':
                // Check for collision with barrier rectangle using the ball radius
                if (ball.x + BALL_RADIUS > hazard.x &&
                    ball.x - BALL_RADIUS < hazard.x + BARRIER_WIDTH &&
                    ball.y + BALL_RADIUS > hazard.y &&
                    ball.y - BALL_RADIUS < hazard.y + BARRIER_HEIGHT) {
                    
                    // Figure out which side collided
                    const rightCollision = ball.x - ball.speedX > hazard.x + BARRIER_WIDTH;
                    const leftCollision = ball.x - ball.speedX < hazard.x;
                    const topCollision = ball.y - ball.speedY < hazard.y;
                    const bottomCollision = ball.y - ball.speedY > hazard.y + BARRIER_HEIGHT;
                      if (rightCollision || leftCollision) {
                        ball.speedX = -ball.speedX * 1.1; // Bounce with extra speed
                        // Push away from horizontal edge of barrier
                        if (rightCollision) {
                            ball.x = hazard.x + BARRIER_WIDTH + BALL_RADIUS + 1;
                        } else if (leftCollision) {
                            ball.x = hazard.x - BALL_RADIUS - 1;
                        }
                    } 
                    if (topCollision || bottomCollision) {
                        ball.speedY = -ball.speedY * 1.1; // Bounce with extra speed
                        // Push away from vertical edge of barrier
                        if (topCollision) {
                            ball.y = hazard.y - BALL_RADIUS - 1;
                        } else if (bottomCollision) {
                            ball.y = hazard.y + BARRIER_HEIGHT + BALL_RADIUS + 1;
                        }
                    }
                    
                    // Reduce hitpoints and track the barrier that was hit
                    if (hazard.currentHitPoints > 0) {
                        hazard.currentHitPoints--;
                        hitBarriers.push({
                            hazard, 
                            x: ball.x,
                            y: ball.y
                        });
                    }
                    
                    // Add screen shake for impact
                    applyScreenShake();
                }
                break;
                
            case 'portal':
                // Teleport ball to linked portal if close enough
                if (distance < VORTEX_RADIUS) {
                    // Find linked portal
                    const linkedPortal = activeHazards.find(p => p.id === hazard.linkedPortalId);
                    if (linkedPortal && !ball.recentlyTeleported) {
                        // Teleport the ball
                        ball.x = linkedPortal.x;
                        ball.y = linkedPortal.y;
                        // Slightly change direction for fun
                        const angle = Math.atan2(ball.speedY, ball.speedX);
                        const newAngle = angle + (Math.random() - 0.5) * Math.PI / 4;
                        const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
                        ball.speedX = Math.cos(newAngle) * speed;
                        ball.speedY = Math.sin(newAngle) * speed;
                        
                        // Prevent immediate re-teleporting
                        ball.recentlyTeleported = true;
                        setTimeout(() => {
                            if (ball) {
                                ball.recentlyTeleported = false;
                            }
                        }, 1000);
                        
                        // Visual effect
                        createTeleportEffect(linkedPortal.x, linkedPortal.y, applyScreenShake);
                    }
                }
                break;
        }
    });

    // Create break particles for barriers that were hit
    hitBarriers.forEach(({hazard, x, y}) => {
        // Create particles for hit feedback
        const color = hazard.currentHitPoints === 0 ? 
            'rgba(255, 255, 255, 0.9)' : // White particles for final hit
            'rgba(220, 20, 60, 0.7)';    // Red particles for regular hits
            
        const particleCount = hazard.currentHitPoints === 0 ? 15 : 8;
        
        createParticles(x, y, particleCount, {
            speedMin: 1,
            speedMax: 3,
            sizeMin: 2,
            sizeMax: 4,
            lifeMin: 15,
            lifeMax: 30,
            color: color,
            spreadAngle: Math.PI * 2
        });
    });
}
