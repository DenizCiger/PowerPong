import { ctx } from './ui.js';
import { BALL_RADIUS, PADDLE_MARGIN, PADDLE_WIDTH, POWERUP_SIZE, VORTEX_RADIUS, BARRIER_WIDTH, BARRIER_HEIGHT, WIND_STRENGTH, BARRIER_COLORS, BARRIER_SEGMENT_GAP, BARRIER_SEGMENTS } from './constants.js';
import * as Particles from './particles.js';

// Draw the arena/court
export function drawArena(canvasWidth, canvasHeight) {
    // Draw court outline
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);
    
    // Draw corner arcs
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI/2);
    ctx.arc(canvasWidth - 20, 20, 20, Math.PI/2, Math.PI);
    ctx.arc(canvasWidth - 20, canvasHeight - 20, 20, Math.PI, Math.PI * 3/2);
    ctx.arc(20, canvasHeight - 20, 20, Math.PI * 3/2, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
    ctx.stroke();
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(canvasWidth/2, canvasHeight/2, 50, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
    ctx.stroke();
}

// Draw center line of the court
export function drawCenterLine(canvasWidth, canvasHeight) {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw paddles with gradient and glow effects
export function drawPaddles(canvasWidth, player1Y, player2Y, player1PaddleHeight, player2PaddleHeight) {
    // Player 1 paddle
    const p1Gradient = ctx.createLinearGradient(0, player1Y, 0, player1Y + player1PaddleHeight);
    p1Gradient.addColorStop(0, '#4a90e2'); // Top color
    p1Gradient.addColorStop(0.5, '#357ABD'); // Middle color
    p1Gradient.addColorStop(1, '#2A5D9E'); // Bottom color

    ctx.fillStyle = p1Gradient;
    ctx.shadowColor = 'rgba(74, 144, 226, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillRect(PADDLE_MARGIN, player1Y, PADDLE_WIDTH, player1PaddleHeight);

    // Add glowing border
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(PADDLE_MARGIN, player1Y, PADDLE_WIDTH, player1PaddleHeight);

    // Reset shadow for performance
    ctx.shadowBlur = 0;

    // Player 2 paddle
    const p2Gradient = ctx.createLinearGradient(0, player2Y, 0, player2Y + player2PaddleHeight);
    p2Gradient.addColorStop(0, '#e94e77'); // Top color
    p2Gradient.addColorStop(0.5, '#D43A5C'); // Middle color
    p2Gradient.addColorStop(1, '#B22C4A'); // Bottom color

    ctx.fillStyle = p2Gradient;
    ctx.shadowColor = 'rgba(233, 78, 119, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillRect(canvasWidth - PADDLE_MARGIN - PADDLE_WIDTH, player2Y, PADDLE_WIDTH, player2PaddleHeight);

    // Add glowing border
    ctx.strokeStyle = 'rgba(233, 78, 119, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasWidth - PADDLE_MARGIN - PADDLE_WIDTH, player2Y, PADDLE_WIDTH, player2PaddleHeight);

    // Reset shadow for performance
    ctx.shadowBlur = 0;

    // Add subtle highlights to both paddles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(PADDLE_MARGIN + 2, player1Y + 2, PADDLE_WIDTH - 4, player1PaddleHeight / 3);
    ctx.fillRect(canvasWidth - PADDLE_MARGIN - PADDLE_WIDTH + 2, player2Y + 2, PADDLE_WIDTH - 4, player2PaddleHeight / 3);
}

// Draw all balls
export function drawBalls(balls) {
    balls.forEach(ball => {
        // Calculate speed magnitude for visual effects
        const speedMagnitude = ball.speedX && ball.speedY ? 
            Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY) : 0;
        const speedFactor = Math.min(speedMagnitude / 20, 1); // Normalize speed (0-1)
        
        // Enhanced glow effect based on speed
        const glowSize = 5 + speedFactor * 15;
        const glowOpacity = 0.3 + speedFactor * 0.4;
        
        // Draw speed-based glow
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS + glowSize, 0, Math.PI * 2);
        const glowColor = `rgba(255, ${180 - speedFactor * 100}, ${255 - speedFactor * 255}, ${glowOpacity})`;
        const glow = ctx.createRadialGradient(
            ball.x, ball.y, BALL_RADIUS,
            ball.x, ball.y, BALL_RADIUS + glowSize
        );
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fill();
        
        // Ball shadow effect - more intense at higher speeds
        ctx.shadowColor = `rgba(180, ${210 - speedFactor * 150}, ${255 - speedFactor * 100}, ${0.8 + speedFactor * 0.2})`;
        ctx.shadowBlur = 15 + speedFactor * 10;
          // Check if ball is trapped in a black hole
        if (ball.trappedInBlackHole) {
            // Use special appearance for trapped balls
            const distortionFactor = 1 + 0.3 * Math.sin(Date.now() / 100);
            
            // Draw distorted ball
            ctx.beginPath();
            ctx.ellipse(
                ball.x, 
                ball.y, 
                BALL_RADIUS * distortionFactor, 
                BALL_RADIUS / distortionFactor, 
                Date.now() / 200, // Rotating angle
                0, 
                Math.PI * 2
            );
            
            // Purple-hued gradient for the trapped ball
            const trapGradient = ctx.createRadialGradient(
                ball.x, ball.y, 0,
                ball.x, ball.y, BALL_RADIUS * distortionFactor
            );
            trapGradient.addColorStop(0, 'rgba(220, 180, 255, 1)');
            trapGradient.addColorStop(0.6, 'rgba(150, 50, 200, 0.9)');
            trapGradient.addColorStop(1, 'rgba(100, 0, 150, 0.7)');
            
            ctx.fillStyle = trapGradient;
            ctx.fill();
            
            // Add energy sparks around the trapped ball
            const sparkCount = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < sparkCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = BALL_RADIUS * (1.2 + Math.random() * 0.5);
                ctx.beginPath();
                ctx.arc(
                    ball.x + Math.cos(angle) * dist,
                    ball.y + Math.sin(angle) * dist,
                    1 + Math.random(),
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = 'rgba(255, 200, 255, 0.8)';
                ctx.fill();
            }
        } else {
            // Normal ball appearance
            // Gradient for the ball - gets more intense with speed
            const ballGradient = ctx.createRadialGradient(
                ball.x - BALL_RADIUS/3, ball.y - BALL_RADIUS/3, 0,
                ball.x, ball.y, BALL_RADIUS
            );
            ballGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            ballGradient.addColorStop(1, `rgba(${200 + speedFactor * 55}, ${220 - speedFactor * 100}, ${255 - speedFactor * 100}, 0.8)`);
            
            // Draw the ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = ballGradient;
            ctx.fill();
        }
        
        // Reset shadow for performance
        ctx.shadowBlur = 0;
        
        // Add a highlight spot
        ctx.beginPath();
        ctx.arc(ball.x - BALL_RADIUS/3, ball.y - BALL_RADIUS/3, BALL_RADIUS/3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        
        // Add motion blur streaks for high speeds
        if (speedFactor > 0.3) {
            const streakLength = 10 * speedFactor;
            const directionX = -ball.speedX / speedMagnitude;
            const directionY = -ball.speedY / speedMagnitude;
            
            ctx.beginPath();
            const streakGradient = ctx.createLinearGradient(
                ball.x, ball.y,
                ball.x + directionX * streakLength, ball.y + directionY * streakLength
            );
            streakGradient.addColorStop(0, `rgba(255, ${255 - speedFactor * 200}, ${255 - speedFactor * 200}, 0.7)`);
            streakGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = streakGradient;
            ctx.lineWidth = BALL_RADIUS * 1.5;
            ctx.lineCap = 'round';
            ctx.moveTo(ball.x, ball.y);
            ctx.lineTo(
                ball.x + directionX * streakLength, 
                ball.y + directionY * streakLength
            );
            ctx.stroke();
        }
    });
}

// Draw background stars
export function drawBackgroundStars(backgroundStars, timestamp) {
    backgroundStars.forEach(star => {
        // Create blinking effect
        const brightness = Math.sin(timestamp * star.blinkSpeed) * 0.2 + star.brightness;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        
        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw all active hazards
export function drawHazards(activeHazards, timestamp) {
    activeHazards.forEach(hazard => {
        switch (hazard.type) {            case 'blackHole':
                // Create black hole effect with accretion disk
                const pulseScale = 1 + 0.1 * Math.sin(timestamp / 300);
                const radius = VORTEX_RADIUS * pulseScale;
                  // 1. Create outer glow with gradient (event horizon)
                const blackHoleGlow = ctx.createRadialGradient(
                    hazard.x, hazard.y, radius * 0.4,
                    hazard.x, hazard.y, radius * 1.3
                );
                blackHoleGlow.addColorStop(0, 'rgba(30, 0, 60, 0.8)');
                blackHoleGlow.addColorStop(0.6, 'rgba(80, 20, 120, 0.5)');
                blackHoleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                  ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, radius * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = blackHoleGlow;
                ctx.fill();
                
                // 2. Draw accretion disk (glowing ring of matter)
                const glowRing = ctx.createRadialGradient(
                    hazard.x, hazard.y, radius * 0.5,
                    hazard.x, hazard.y, radius * 0.9
                );
                glowRing.addColorStop(0, 'rgba(200, 120, 255, 0.1)');
                glowRing.addColorStop(0.5, 'rgba(180, 50, 220, 0.8)');
                glowRing.addColorStop(1, 'rgba(100, 0, 150, 0.2)');
                
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, radius * 0.9, 0, Math.PI * 2);
                ctx.fillStyle = glowRing;
                ctx.fill();
                
                // 3. Draw the dark center (event horizon)
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                ctx.fill();
                
                // 4. Add spiral light distortion effect (simulates light bending)
                const gravityRotationSpeed = timestamp / 800;
                ctx.save();
                ctx.translate(hazard.x, hazard.y);
                
                for (let i = 0; i < 4; i++) {
                    const angle = gravityRotationSpeed + i * Math.PI / 2;
                    ctx.save();
                    ctx.rotate(angle);
                    
                    const gradient = ctx.createLinearGradient(
                        radius * 0.5, 0,
                        radius * 1.2, 0
                    );
                    gradient.addColorStop(0, 'rgba(180, 100, 255, 0.7)');
                    gradient.addColorStop(1, 'rgba(100, 0, 200, 0)');
                    
                    ctx.beginPath();
                    ctx.moveTo(radius * 0.5, 0);
                    
                    // Create curved spiral arms
                    for (let t = 0; t < Math.PI/2; t += 0.05) {
                        const x = radius * (0.5 + t/2) * Math.cos(t * 1.5);
                        const y = radius * (0.5 + t/2) * Math.sin(t * 1.5);
                        ctx.lineTo(x, y);
                    }
                    
                    ctx.lineWidth = 2 + Math.sin(timestamp / 200) * 1;
                    ctx.strokeStyle = gradient;
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
                
                // 5. Add particles being sucked in
                const bhParticleCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < bhParticleCount; i++) {
                    // Calculate a random position around the black hole
                    const particleAngle = Math.random() * Math.PI * 2;
                    const distFromCenter = radius * (0.7 + Math.random() * 0.5);
                    
                    const particleX = hazard.x + Math.cos(particleAngle) * distFromCenter;
                    const particleY = hazard.y + Math.sin(particleAngle) * distFromCenter;
                    
                    // Draw the particle
                    const particleSize = 1 + Math.random() * 2;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${150 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, ${0.5 + Math.random() * 0.5})`;
                    ctx.fill();
                    
                    // Add motion blur / trail effect for the particle
                    const trailLength = 3 + Math.floor(Math.random() * 4);
                    for (let t = 1; t <= trailLength; t++) {
                        const trailAngle = particleAngle + (t * 0.1); // Spiral trail
                        const trailDist = distFromCenter - (t * 2);
                        if (trailDist < radius * 0.5) continue; // Don't draw inside event horizon
                        
                        const trailX = hazard.x + Math.cos(trailAngle) * trailDist;
                        const trailY = hazard.y + Math.sin(trailAngle) * trailDist;
                        
                        ctx.beginPath();
                        ctx.arc(trailX, trailY, particleSize * (1 - t/trailLength), 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${150 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, ${(0.6 - t/trailLength) * 0.8})`;
                        ctx.fill();
                    }
                }
                break;
                  case 'whiteHole':
                // Create white hole effect (inverse of black hole)
                const whiteHoleScale = 1 + 0.1 * Math.sin(timestamp / 300);
                const whiteHoleRadius = VORTEX_RADIUS * whiteHoleScale;
                  // 1. Create outer glow with gradient (inverse of event horizon)
                const whiteHoleGlow = ctx.createRadialGradient(
                    hazard.x, hazard.y, whiteHoleRadius * 0.4,
                    hazard.x, hazard.y, whiteHoleRadius * 1.3
                );
                whiteHoleGlow.addColorStop(0, 'rgba(225, 225, 255, 0.8)');                whiteHoleGlow.addColorStop(0.6, 'rgba(180, 200, 255, 0.5)');
                whiteHoleGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.beginPath();                ctx.arc(hazard.x, hazard.y, whiteHoleRadius * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = whiteHoleGlow;
                ctx.fill();
                
                // 2. Draw emission disk (glowing ring of outward energy)
                const emissionRing = ctx.createRadialGradient(                    hazard.x, hazard.y, whiteHoleRadius * 0.5,
                    hazard.x, hazard.y, whiteHoleRadius * 0.9
                );
                emissionRing.addColorStop(0, 'rgba(200, 220, 255, 0.9)');
                emissionRing.addColorStop(0.5, 'rgba(120, 180, 255, 0.8)');
                emissionRing.addColorStop(1, 'rgba(180, 230, 255, 0.2)');
                
                ctx.beginPath();                ctx.arc(hazard.x, hazard.y, whiteHoleRadius * 0.9, 0, Math.PI * 2);
                ctx.fillStyle = emissionRing;
                ctx.fill();
                
                // 3. Draw the bright center (inverse of event horizon)
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, whiteHoleRadius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.fill();
                  // 4. Add spiral light emission effect (outward spirals)
                const whiteHoleRotationSpeed = timestamp / 800;
                ctx.save();
                ctx.translate(hazard.x, hazard.y);
                
                for (let i = 0; i < 4; i++) {                    const angle = whiteHoleRotationSpeed + i * Math.PI / 2; // Changed from negative to positive
                    ctx.save();
                    ctx.rotate(angle);
                    
                    const gradient = ctx.createLinearGradient(
                        whiteHoleRadius * 0.5, 0,
                        whiteHoleRadius * 1.2, 0
                    );
                    gradient.addColorStop(0, 'rgba(150, 200, 255, 0.7)');
                    gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');                    ctx.beginPath();
                    ctx.moveTo(whiteHoleRadius * 0.5, 0);
                    
                    // Create curved spiral arms (outward direction)
                    for (let t = 0; t < Math.PI/2; t += 0.05) {
                        // Using positive 't' for outward direction
                        const x = whiteHoleRadius * (0.5 + t/2) * Math.cos(t * 1.5);
                        const y = whiteHoleRadius * (0.5 + t/2) * Math.sin(t * 1.5);
                        ctx.lineTo(x, y);
                    }
                    
                    ctx.lineWidth = 2 + Math.sin(timestamp / 200) * 1;
                    ctx.strokeStyle = gradient;
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
                
                // 5. Add particles being ejected outward                // Reduced particle count for white holes
                if (Math.random() < 0.5) {
                    // Calculate a random position from center outward
                    const particleAngle = Math.random() * Math.PI * 2;
                    const distFromCenter = whiteHoleRadius * (0.7 + Math.random() * 0.5);
                    
                    const particleX = hazard.x + Math.cos(particleAngle) * distFromCenter;
                    const particleY = hazard.y + Math.sin(particleAngle) * distFromCenter;
                    
                    // Draw the particle
                    const particleSize = 1 + Math.random() * 2;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${220 + Math.random() * 35}, ${220 + Math.random() * 35}, 255, ${0.5 + Math.random() * 0.5})`;
                    ctx.fill();
                    
                    // Add motion blur / trail effect for the particle (inward to outward)
                    const trailLength = 3 + Math.floor(Math.random() * 4);
                    for (let t = 1; t <= trailLength; t++) {
                        // Inverse trail direction (particles moving outward)
                        const trailAngle = particleAngle - (t * 0.1);
                        const trailDist = distFromCenter - (t * 2);
                        
                        const trailX = hazard.x + Math.cos(trailAngle) * trailDist;
                        const trailY = hazard.y + Math.sin(trailAngle) * trailDist;
                        
                        ctx.beginPath();
                        ctx.arc(trailX, trailY, particleSize * (1 - t/trailLength), 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${200 + Math.random() * 55}, ${220 + Math.random() * 35}, 255, ${(0.6 - t/trailLength) * 0.8})`;
                        ctx.fill();
                    }
                }
                break;
                
            case 'windZone':                
    // Set up the rotated wind zone area (invisible now - no border)
    const windZoneSize = 150;
    const windZoneLength = 200; // Longer in the direction of wind
    
    // Normalize direction vectors for particle movement
    const dirX = hazard.direction.x / WIND_STRENGTH;
    const dirY = hazard.direction.y / WIND_STRENGTH;
    
    // Calculate rotation angle from direction
    const windAngle = Math.atan2(dirY, dirX);
    
    // Save current context state
    ctx.save();
    
    // Translate to the wind zone center
    ctx.translate(hazard.x, hazard.y);
    
    // Rotate context to align with wind direction
    ctx.rotate(windAngle);
    
    // Add wind direction indicators with fewer but longer streamlines
    const arrowSpacing = 50; // Increased spacing even more (from 40)
    const numArrows = Math.floor(windZoneLength / arrowSpacing) - 1;
    
    // Draw subtle streamlines
    ctx.beginPath();
    for (let i = 0; i < numArrows; i++) {
        const xPos = -windZoneLength/2 + (i + 1) * arrowSpacing;
        
        // Draw longer, thinner lines for streamlines
        ctx.moveTo(xPos, -windZoneSize/4);
        ctx.lineTo(xPos + 35, -windZoneSize/4); // Even longer lines (from 25)
        
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos + 35, 0); // Longer lines
        
        ctx.moveTo(xPos, windZoneSize/4);
        ctx.lineTo(xPos + 35, windZoneSize/4); // Longer lines
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5; // Keep lines thin
    ctx.stroke();
    
    // Restore context to previous state
    ctx.restore();
      // Generate minimal wind particles for effect
    if (Math.random() < 0.15) { // Further reduced for better performance
        Particles.createWindParticles(
            hazard.x, 
            hazard.y, 
            dirX, 
            dirY, 
            windZoneSize
        );
    }
    break;
                  case 'barrier':
                // Save the current context to restore later
                ctx.save();
                
                // Get damage state (0 = critical, 0.5 = damaged, 1 = healthy)
                const damageState = hazard.currentHitPoints / hazard.hitPoints;
                
                // Choose color scheme based on damage
                let colorScheme;
                if (damageState <= 0.33) {
                    colorScheme = BARRIER_COLORS.critical;
                } else if (damageState <= 0.66) {
                    colorScheme = BARRIER_COLORS.damaged;
                } else {
                    colorScheme = BARRIER_COLORS.healthy;
                }
                
                // Calculate segment height (divide barrier into segments)
                const segmentHeight = (BARRIER_HEIGHT - BARRIER_SEGMENT_GAP * (BARRIER_SEGMENTS - 1)) / BARRIER_SEGMENTS;
                
                // Draw each segment of the barrier
                for (let i = 0; i < BARRIER_SEGMENTS; i++) {
                    const segmentY = hazard.y + i * (segmentHeight + BARRIER_SEGMENT_GAP);
                    
                    // Determine which segments are active based on damage
                    const isActiveSegment = i < Math.ceil(damageState * BARRIER_SEGMENTS);
                    
                    // Create a modern gradient for each segment
                    const segmentGradient = ctx.createLinearGradient(
                        hazard.x, segmentY,
                        hazard.x + BARRIER_WIDTH, segmentY + segmentHeight
                    );
                    
                    if (isActiveSegment) {
                        // Active segment with dynamic colors based on health
                        segmentGradient.addColorStop(0, colorScheme.secondary);
                        segmentGradient.addColorStop(0.5, colorScheme.primary);
                        segmentGradient.addColorStop(1, colorScheme.secondary);
                        
                        // Add pulsing effect to active segments
                        const pulseSpeed = 300 - (1 - damageState) * 150; // Pulse faster when damaged
                        const pulseIntensity = Math.sin(timestamp / pulseSpeed) * 0.15 + 0.85;
                        
                        // Draw glow effect for active segments (efficient version)
                        if (i === 0 || i === BARRIER_SEGMENTS - 1 || !isActiveSegment) {
                            ctx.shadowBlur = 8;
                            ctx.shadowColor = colorScheme.glow;
                        } else {
                            ctx.shadowBlur = 0; // No shadow for middle segments for performance
                        }
                        
                        // Draw segment with pulse effect
                        ctx.globalAlpha = pulseIntensity;
                        ctx.fillStyle = segmentGradient;
                        ctx.fillRect(hazard.x, segmentY, BARRIER_WIDTH, segmentHeight);
                        ctx.globalAlpha = 1.0;
                      } else {
                        // Inactive segment (broken/disabled)
                        ctx.shadowBlur = 0;
                        
                        // Draw hollow broken segment frame
                        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(hazard.x + 1, segmentY + 1, BARRIER_WIDTH - 2, segmentHeight - 2);
                        
                        // Draw inner broken lines
                        ctx.beginPath();
                        ctx.moveTo(hazard.x, segmentY);
                        ctx.lineTo(hazard.x + BARRIER_WIDTH, segmentY + segmentHeight);
                        ctx.moveTo(hazard.x, segmentY + segmentHeight);
                        ctx.lineTo(hazard.x + BARRIER_WIDTH, segmentY);
                        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
                        ctx.stroke();
                    }
                }
                
                // Draw the outer border (once for the whole barrier)
                ctx.shadowBlur = 0;
                ctx.strokeStyle = colorScheme.secondary;
                ctx.lineWidth = 1;
                ctx.strokeRect(hazard.x, hazard.y, BARRIER_WIDTH, BARRIER_HEIGHT);
                
                // Restore the original context settings
                ctx.restore();
                break;
                
            case 'portal':
                // Simplified Portal-inspired effect - pure black fill with colored outline
                const portalPulse = 1 + 0.15 * Math.sin(timestamp / 150);
                const portalRadius = VORTEX_RADIUS * portalPulse;
                
                // Use Portal's blue/orange colors based on entry/exit
                const portalColor = hazard.isExit ? '#FF6600' : '#00A4FF';
                
                
                // Draw colored portal ring (thick outline)
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, portalRadius, 0, Math.PI * 2);
                ctx.lineWidth = 5;
                ctx.strokeStyle = portalColor;
                ctx.stroke();
                
                // Draw inner black circle (event horizon)
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, portalRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#000000'; // Solid black fill
                ctx.fill();
                
                // Add glowing effect, but make sure not to overwrite the black fill
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, portalRadius * 1.15, 0, Math.PI * 2);
                ctx.fillStyle = `${portalColor}80`; // Semi-transparent version of color
                ctx.fill();
                  // Draw pure black fill for portal center
                ctx.beginPath();
                ctx.arc(hazard.x, hazard.y, portalRadius * 0.9, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();
                break;
        }
        
        // Draw remaining time or hit points for barriers only
        if (hazard.type !== 'barrier') {
            // Show remaining time for other hazards
            const remainingTime = Math.ceil((hazard.createdAt + hazard.duration - Date.now()) / 1000);
            if (remainingTime <= 5) { // Only show countdown for last 5 seconds
                ctx.fillStyle = remainingTime <= 2 ? 'red' : 'white';
                ctx.fillText(remainingTime, hazard.x, hazard.y + 24);
            }
        }
    });
}

// Draw power-ups
export function drawPowerUps(activePowerUps) {
    activePowerUps.forEach(powerUp => {
        // Create animation values
        const now = Date.now();
        const pulseRate = 200 + (powerUp.type === 'fury' ? Math.sin(now / 100) * 30 : 0); // Fury pulses more erratically
        const pulseSize = Math.sin(now / pulseRate) * 3;
        const rotationAngle = powerUp.type === 'fury' ? now / 500 : 0; // Only fury powerups rotate
        const hoverOffset = Math.sin(now / 400) * 2; // Subtle vertical hover effect
        
        // Save context for transformations
        ctx.save();
        
        // Move to powerup position with hover effect
        ctx.translate(powerUp.x, powerUp.y + hoverOffset);
        
        // Apply rotation for certain powerups
        if (rotationAngle) {
            ctx.rotate(rotationAngle);
        }
        
        // Add outer glow with specific glow color
        const glowColor = powerUp.glowColor || `${powerUp.color}88`; // Use specific glow color or fallback
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15 + pulseSize;
        
        // Draw the shape based on powerup type
        switch(powerUp.shape) {
            case 'triangle':
                // Speed Up - Triangle pointing up
                ctx.beginPath();
                ctx.moveTo(0, -POWERUP_SIZE/2);                    // Top vertex
                ctx.lineTo(-POWERUP_SIZE/2, POWERUP_SIZE/2);       // Bottom left
                ctx.lineTo(POWERUP_SIZE/2, POWERUP_SIZE/2);        // Bottom right
                ctx.closePath();
                ctx.fillStyle = powerUp.color;
                ctx.fill();
                
                // Add subtle inner gradient for 3D effect
                const triGradient = ctx.createLinearGradient(0, -POWERUP_SIZE/2, 0, POWERUP_SIZE/2);
                triGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                triGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = triGradient;
                
                ctx.beginPath();
                ctx.moveTo(0, -POWERUP_SIZE/2.5);
                ctx.lineTo(-POWERUP_SIZE/2.5, POWERUP_SIZE/3);
                ctx.lineTo(POWERUP_SIZE/2.5, POWERUP_SIZE/3);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'triangle-down':
                // Slow Down - Triangle pointing down
                ctx.beginPath();
                ctx.moveTo(0, POWERUP_SIZE/2);                     // Bottom vertex
                ctx.lineTo(-POWERUP_SIZE/2, -POWERUP_SIZE/2);      // Top left
                ctx.lineTo(POWERUP_SIZE/2, -POWERUP_SIZE/2);       // Top right
                ctx.closePath();
                ctx.fillStyle = powerUp.color;
                ctx.fill();
                
                // Add subtle inner gradient for 3D effect
                const triDownGradient = ctx.createLinearGradient(0, -POWERUP_SIZE/2, 0, POWERUP_SIZE/2);
                triDownGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                triDownGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = triDownGradient;
                
                ctx.beginPath();
                ctx.moveTo(0, POWERUP_SIZE/2.5);
                ctx.lineTo(-POWERUP_SIZE/2.5, -POWERUP_SIZE/3);
                ctx.lineTo(POWERUP_SIZE/2.5, -POWERUP_SIZE/3);
                ctx.closePath();
                ctx.fill();
                break;
            
            case 'rectangle':
                // Grow Paddle - Rectangle shape
                const rectWidth = POWERUP_SIZE * 0.8;
                const rectHeight = POWERUP_SIZE * 0.5;
                
                // Main shape
                ctx.fillStyle = powerUp.color;
                ctx.fillRect(-rectWidth/2, -rectHeight/2, rectWidth, rectHeight);
                
                // 3D effect with inner gradient
                const rectGradient = ctx.createLinearGradient(0, -rectHeight/2, 0, rectHeight/2);
                rectGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
                rectGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
                ctx.fillStyle = rectGradient;
                ctx.fillRect(-rectWidth/2.5, -rectHeight/2.5, rectWidth * 0.8, rectHeight * 0.6);
                break;
                
            case 'diamond':
                // Shrink Paddle - Diamond shape
                ctx.beginPath();
                ctx.moveTo(0, -POWERUP_SIZE/2);                   // Top point
                ctx.lineTo(POWERUP_SIZE/2, 0);                     // Right point
                ctx.lineTo(0, POWERUP_SIZE/2);                    // Bottom point
                ctx.lineTo(-POWERUP_SIZE/2, 0);                    // Left point
                ctx.closePath();
                ctx.fillStyle = powerUp.color;
                ctx.fill();
                
                // Add highlight
                const diamondGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, POWERUP_SIZE/2);
                diamondGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
                diamondGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = diamondGradient;
                
                // Smaller diamond for inner highlight
                ctx.beginPath();
                ctx.moveTo(0, -POWERUP_SIZE/4);
                ctx.lineTo(POWERUP_SIZE/4, 0);
                ctx.lineTo(0, POWERUP_SIZE/4);
                ctx.lineTo(-POWERUP_SIZE/4, 0);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'circle':
                // Fast Ball - Circle shape like the ball
                // Main circle
                ctx.beginPath();
                ctx.arc(0, 0, POWERUP_SIZE/2, 0, Math.PI * 2);
                ctx.fillStyle = powerUp.color;
                ctx.fill();
                
                // Inner gradient for 3D effect
                const circleGradient = ctx.createRadialGradient(
                    -POWERUP_SIZE/6, -POWERUP_SIZE/6, 0,
                    0, 0, POWERUP_SIZE/1.8
                );
                circleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                circleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.beginPath();
                ctx.arc(0, 0, POWERUP_SIZE/2 * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = circleGradient;
                ctx.fill();
                
                // Add subtle speed lines
                ctx.beginPath();
                ctx.moveTo(POWERUP_SIZE/3, -POWERUP_SIZE/6);
                ctx.lineTo(POWERUP_SIZE/2 + 5, -POWERUP_SIZE/3);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(POWERUP_SIZE/3, POWERUP_SIZE/6);
                ctx.lineTo(POWERUP_SIZE/2 + 5, POWERUP_SIZE/3);
                ctx.stroke();
                break;
                
            case 'star':
                // Multi Ball - Star shape
                const spikes = 5;
                const outerRadius = POWERUP_SIZE/2;
                const innerRadius = POWERUP_SIZE/4;
                
                ctx.beginPath();
                
                for(let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if(i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                ctx.fillStyle = powerUp.color;
                ctx.fill();
                
                // Add highlight to center of star
                const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, POWERUP_SIZE/3);
                starGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                starGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = starGradient;
                
                // Draw a circle in the center
                ctx.beginPath();
                ctx.arc(0, 0, POWERUP_SIZE/5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'hexagon':
                // Fury - Hexagon shape
                const hexRadius = POWERUP_SIZE/2;
                
                ctx.beginPath();
                for(let i = 0; i < 6; i++) {
                    const angle = (i * 2 * Math.PI / 6) + Math.PI/6;
                    const x = Math.cos(angle) * hexRadius;
                    const y = Math.sin(angle) * hexRadius;
                    
                    if(i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                
                // Add fiery gradient for fury powerup
                const furyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, hexRadius);
                furyGradient.addColorStop(0, '#ffdd00');
                furyGradient.addColorStop(0.6, '#ff4400');
                furyGradient.addColorStop(1, '#cc0000');
                ctx.fillStyle = furyGradient;
                ctx.fill();
                
                // Add pulsing glow particles for fury mode
                const particleCount = 2 + Math.floor(Math.random() * 2);
                if(Math.random() < 0.3) {
                    for(let i = 0; i < particleCount; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * (hexRadius * 0.8);
                        
                        ctx.beginPath();
                        const particleX = Math.cos(angle) * distance;
                        const particleY = Math.sin(angle) * distance;
                        const particleSize = 1 + Math.random() * 2;
                        
                        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.fill();
                    }
                }
                break;
                
            default:
                // Fallback to circle for any undefined shapes
                ctx.beginPath();
                ctx.arc(0, 0, POWERUP_SIZE/2, 0, Math.PI * 2);
                ctx.fillStyle = powerUp.color;
                ctx.fill();
                
                // Add highlight spot for 3D effect
                ctx.beginPath();
                ctx.arc(-POWERUP_SIZE/6, -POWERUP_SIZE/6, POWERUP_SIZE/5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fill();
        }
        
        // Reset shadow for icon
        ctx.shadowBlur = 0;
        
        // Draw the icon
        if(powerUp.icon) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `bold ${POWERUP_SIZE/2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.icon, 0, 0);
        } else {
            // Fallback to effect text if no icon
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.effect, 0, 0);
        }
        
        // Restore the context state
        ctx.restore();
    });
}

// Draw danger mode effects
export function drawDangerEffects(timestamp, canvasWidth, canvasHeight) {
    // Pulsing center line
    const pulseIntensity = Math.sin(timestamp / 100) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.setLineDash([5, 10]);
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.strokeStyle = `rgba(255, ${Math.floor(100 * pulseIntensity)}, ${Math.floor(100 * pulseIntensity)}, 0.7)`;
    ctx.lineWidth = 2 + pulseIntensity * 2;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
}

// Draw effects based on rally count
export function drawRallyEffect(balls, rallyCount) {
    // Trail effect behind the ball
    const mainBall = balls[0];
    if (mainBall) {
        ctx.beginPath();
        // Larger glow for higher combos with logarithmic scaling
        const glowSize = Math.min(20 + Math.log10(rallyCount + 1) * 20, 60);
        const gradient = ctx.createRadialGradient(
            mainBall.x, mainBall.y, BALL_RADIUS,
            mainBall.x, mainBall.y, BALL_RADIUS + glowSize
        );
        
        // Color changes based on combo level with more tiers
        let color1, color2;
        if (rallyCount >= 100) {
            // Rainbow effect for extremely high combos
            const hue = (Date.now() / 20) % 360;
            color1 = `hsla(${hue}, 100%, 50%, 0.9)`;
            color2 = `hsla(${hue}, 100%, 50%, 0)`;
        } else if (rallyCount >= 50) {
            color1 = 'rgba(255, 0, 255, 0.9)'; // Magenta
            color2 = 'rgba(255, 0, 255, 0)';
        } else if (rallyCount >= 25) {
            color1 = 'rgba(255, 0, 0, 0.9)'; // Red
            color2 = 'rgba(255, 0, 0, 0)';
        } else if (rallyCount >= 15) {
            color1 = 'rgba(255, 100, 0, 0.9)'; // Orange
            color2 = 'rgba(255, 50, 0, 0)';
        } else if (rallyCount >= 5) {
            color1 = 'rgba(255, 255, 150, 0.8)'; // Yellow
            color2 = 'rgba(255, 180, 100, 0)';
        } else {
            color1 = 'rgba(255, 255, 255, 0.8)'; // White
            color2 = 'rgba(255, 255, 255, 0)';
        }
          gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.arc(mainBall.x, mainBall.y, BALL_RADIUS + glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add rally counter with pulsing effect
        if (rallyCount > 3) {
            // Faster pulse for higher combos
            const pulseSpeed = Math.min(100 + rallyCount, 500);
            const pulse = Math.sin(Date.now() / pulseSpeed) * 0.2 + 1;
            const baseSize = Math.min(16 + Math.log10(rallyCount + 1) * 20, 60);
            const size = baseSize * pulse;
            
            // Enhanced glow effects for high combos
            if (rallyCount >= 5) {
                ctx.shadowBlur = Math.min(10 + Math.log10(rallyCount) * 10, 30);
                if (rallyCount >= 100) {
                    // Rainbow shadow for extreme combos
                    const hue = (Date.now() / 20) % 360;
                    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                } else if (rallyCount >= 50) {
                    ctx.shadowColor = '#ff00ff'; // Magenta
                } else if (rallyCount >= 25) {
                    ctx.shadowColor = '#ff0000'; // Red
                } else if (rallyCount >= 15) {
                    ctx.shadowColor = '#ff6600'; // Orange
                } else {
                    ctx.shadowColor = '#ffaa00'; // Yellow
                }
            }
            
            // Text effects based on combo level
            let textColor;
            if (rallyCount >= 100) {
                const hue = (Date.now() / 20) % 360;
                textColor = `hsl(${hue}, 100%, 50%)`;
            } else if (rallyCount >= 50) {
                textColor = '#ff00ff';
            } else if (rallyCount >= 25) {
                textColor = '#ff2222';
            } else if (rallyCount >= 15) {
                textColor = '#ff6600';
            } else if (rallyCount >= 5) {
                textColor = '#ffaa00';
            } else {
                textColor = '#ffffff';
            }
            
            ctx.fillStyle = textColor;
            ctx.font = `bold ${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw combo text with shadow
            ctx.fillText(`${rallyCount}×`, ctx.canvas.width / 2, 35);
            
            // Add dynamic combo text based on level
            let comboText = '';
            if (rallyCount >= 100) {
                comboText = 'INCREDIBLE!';
            } else if (rallyCount >= 50) {
                comboText = 'UNSTOPPABLE!';
            } else if (rallyCount >= 25) {
                comboText = 'AMAZING!';
            } else if (rallyCount >= 15) {
                comboText = 'AWESOME!';
            } else if (rallyCount >= 10) {
                comboText = 'COMBO!';
            }
            
            if (comboText) {
                ctx.font = `bold ${Math.min(12 + Math.log10(rallyCount + 1) * 8, 32)}px Arial`;
                ctx.fillText(comboText, ctx.canvas.width / 2, 65);
            }
            
            // Reset shadow
            ctx.shadowBlur = 0;
        }
    }
    
    return mainBall; // Return the main ball for other effects
}
