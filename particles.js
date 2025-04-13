import { ctx } from './ui.js';
import { BALL_RADIUS, SCORE_ANIMATION_DURATION } from './constants.js';

// Particles array
export let particles = [];
export let scoreAnimations = [];

// Create particles with common parameters
export function createParticles(x, y, count, options = {}) {
    // Default options
    const defaults = {
        speedMin: 1,
        speedMax: 3,
        sizeMin: 1,
        sizeMax: 3,
        lifeMin: 20,
        lifeMax: 30,
        color: 'rgba(255, 255, 255, 0.8)',
        directionX: 0,
        directionY: 0,
        spreadAngle: Math.PI * 2, // Full circle by default
        particleLimit: 100
    };
    
    // Merge options with defaults
    const config = { ...defaults, ...options };
    
    // Limit total particle count for performance
    if (particles.length > config.particleLimit) return;
    
    // Calculate the base angle for directed particles
    const baseAngle = Math.atan2(config.directionY, config.directionX);
    
    for (let i = 0; i < count; i++) {
        // Create a random angle within the spread range
        const angleOffset = (Math.random() - 0.5) * config.spreadAngle;
        const angle = baseAngle + angleOffset;
        
        // Random speed within range
        const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
        
        // Calculate velocity
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed;
        
        // Random size within range
        const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        
        // Random life within range
        const life = config.lifeMin + Math.random() * (config.lifeMax - config.lifeMin);
        
        // Create the particle
        particles.push({
            x,
            y,
            speedX,
            speedY,
            size,
            color: config.color,
            life
        });
    }
}

// Create particles when ball hits paddle
export function createPaddleHitParticles(x, y, directionX, count, color) {
    createParticles(x, y, count, {
        speedMin: 1,
        speedMax: 3,
        sizeMin: 2,
        sizeMax: 5,
        lifeMin: 30,
        lifeMax: 50,
        color: color,
        directionX: directionX,
        spreadAngle: Math.PI,
        particleLimit: 100
    });
}

// Create particles when ball hits wall
export function createWallHitParticles(x, y, directionY, count) {
    createParticles(x, y, count, {
        speedMin: 1,
        speedMax: 2,
        sizeMin: 1,
        sizeMax: 3,
        lifeMin: 20,
        lifeMax: 35,
        directionY: directionY,
        spreadAngle: Math.PI,
        particleLimit: 100
    });
}

// Create visual score animation
export function createScoreAnimation(player, yPos, canvasWidth) {
    const x = player === 1 ? canvasWidth / 4 : canvasWidth * 3 / 4;
    const color = player === 1 ? '#4488ff' : '#ff4444';
    
    scoreAnimations.push({
        x,
        y: yPos,
        text: '+1',
        color,
        size: 0,
        maxSize: 60,
        opacity: 1,
        createdAt: Date.now()
    });
    
    // Create particles using the shared function
    createParticles(x, yPos, 20, {
        speedMin: 1,
        speedMax: 5,
        sizeMin: 2,
        sizeMax: 6,
        lifeMin: 40,
        lifeMax: 70,
        color: color,
        spreadAngle: Math.PI * 2,
        particleLimit: 150
    });
}

// Create visual teleport effect
export function createTeleportEffect(x, y, applyScreenShake) {
    // Add screen shake
    applyScreenShake();
    
    // Add particles using the shared function
    createParticles(x, y, 15, {
        speedMin: 1,
        speedMax: 4,
        sizeMin: 2,
        sizeMax: 6,
        lifeMin: 10,
        lifeMax: 30,
        color: 'rgba(255, 140, 0, 0.7)',
        spreadAngle: Math.PI * 2,
        particleLimit: 120
    });
}

// Draw particles
export function drawParticles() {
    particles.forEach(p => {
        if (p.isWindParticle && p.width && p.height) {
            // Draw wind particles as streaks
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            
            // Draw the streak
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
            
            // Optional: Add a small gradient at the leading edge
            const gradient = ctx.createLinearGradient(
                p.width/2 - 5, 0,
                p.width/2, 0
            );
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(p.width/2 - 5, -p.height/2, 5, p.height);
            
            ctx.restore();
        } else if (p.isShockwave) {
            drawShockwave(p);
        } else {
            // Draw regular particles as circles
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
    });
}

// Draw score animations
export function drawScoreAnimations() {
    scoreAnimations.forEach(anim => {
        ctx.font = `bold ${anim.size}px Arial`;
        ctx.fillStyle = anim.color.replace(')', `, ${anim.opacity})`);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(anim.text, anim.x, anim.y);
    });
}

// Update particles (for visual effects)
export function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update particle position
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        // Handle wind particles specially to keep them inside their rotated box
        if (p.isWindParticle && p.windZoneInfo) {
            const wz = p.windZoneInfo;
            
            // Convert world coordinates to local (rotated) coordinates
            // First translate to make wind zone center the origin
            const dx = p.x - wz.centerX;
            const dy = p.y - wz.centerY;
            
            // Then rotate to align with wind direction
            const cosAngle = Math.cos(-wz.angle);
            const sinAngle = Math.sin(-wz.angle);
            const localX = dx * cosAngle - dy * sinAngle;
            const localY = dx * sinAngle + dy * cosAngle;
            
            // Check if the particle is outside the bounds in local space
            let needsRepositioning = false;
            let newLocalX = localX;
            let newLocalY = localY;
            
            // Check if particle has moved past the downwind edge
            if (localX > wz.halfLength) {
                // Reset to upwind side with slight randomization
                newLocalX = -wz.halfLength + Math.random() * wz.halfLength * 0.3;
                needsRepositioning = true;
            }
            
            // Bounce off the sides
            if (Math.abs(localY) > wz.halfWidth) {
                newLocalY = localY > 0 ? wz.halfWidth * 0.95 : -wz.halfWidth * 0.95;
                needsRepositioning = true;
            }
            
            // If we need to reposition, convert back to world coordinates
            if (needsRepositioning) {
                // Rotate and translate back to world space
                const cosAngle = Math.cos(wz.angle);
                const sinAngle = Math.sin(wz.angle);
                p.x = wz.centerX + newLocalX * cosAngle - newLocalY * sinAngle;
                p.y = wz.centerY + newLocalX * sinAngle + newLocalY * cosAngle;
            }
        }
        
        // Remove expired particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Update score animations
    const currentTime = Date.now();
    for (let i = scoreAnimations.length - 1; i >= 0; i--) {
        const anim = scoreAnimations[i];
        const elapsed = currentTime - anim.createdAt;
        const progress = Math.min(1, elapsed / SCORE_ANIMATION_DURATION);
        
        anim.size = anim.maxSize * Math.min(progress * 2, 1);
        anim.y -= 0.5;
        anim.opacity = 1 - progress;
        
        if (progress >= 1) {
            scoreAnimations.splice(i, 1);
        }
    }
}

// Create wind effect particles
export function createWindParticles(x, y, directionX, directionY, windZoneSize) {
    // Reduce the particle count for lower frequency
    // Already at 1, so we'll leave it but increase the randomness between spawns
    const particleCount = 1;
    
    // Calculate wind angle
    const windAngle = Math.atan2(directionY, directionX);
    
    // For rotated wind zone, use different dimensions
    const windZoneLength = 200; // Longer in the direction of wind
    const halfLength = windZoneLength / 2;
    const halfWidth = windZoneSize / 2;
    
    // Generate particles at random positions within the wind zone
    for (let i = 0; i < particleCount; i++) {
        // We'll work in the rotated space (local coordinates)
        
        // Generate particles with bias towards the upwind edge
        // In local coordinates, this means a negative x value
        const localX = -halfLength + Math.random() * halfLength * 0.8;
        const localY = (Math.random() * 2 - 1) * halfWidth * 0.9; // Stay slightly within the bounds
        
        // Rotate local coordinates to world space
        const particleX = x + localX * Math.cos(windAngle) - localY * Math.sin(windAngle);
        const particleY = y + localX * Math.sin(windAngle) + localY * Math.cos(windAngle);
        
        // Create particle with wind direction - significantly faster speed
        const baseSpeed = 4.0 + Math.random() * 2.0; // Much faster (was 1.8+1.2)
        const speedX = directionX * baseSpeed;
        const speedY = directionY * baseSpeed;
        
        // Store wind zone info with each particle for boundary checking
        const windZoneInfo = {
            centerX: x,
            centerY: y,
            halfLength,
            halfWidth,
            angle: windAngle,
            dirX: directionX,
            dirY: directionY
        };
        
        // Create streak particle with wind properties - even longer and thicker
        particles.push({
            x: particleX,
            y: particleY,
            speedX: speedX,
            speedY: speedY,
            // Keep the same dimensions but make them move faster
            width: 40 + Math.random() * 35,
            height: 1.5 + Math.random() * 1.5,
            color: 'rgba(220, 240, 255, ' + (0.6 + Math.random() * 0.4) + ')', // Keep same brightness
            life: 20 + Math.random() * 25, // Shorter life since they're moving faster (was 30+40)
            windZoneInfo, // Store wind zone info for containment
            isWindParticle: true, // Mark as wind particle for special handling
            angle: windAngle // Store wind angle for drawing the streak
        });
    }
}

// Reset particles system
export function resetParticles() {
    particles = [];
    scoreAnimations = [];
}

// Create shockwave effect (expanding ring)
export function createShockwave(x, y, initialRadius, maxRadius, color) {
    // Create a special particle that expands from initial to max radius
    particles.push({
        x,
        y,
        isShockwave: true,
        initialRadius,
        maxRadius,
        currentRadius: initialRadius,
        color,
        life: 30,
        initialLife: 30,
        opacity: 0.8
    });
}

// Helper function to draw shockwaves
function drawShockwave(p) {
    const progressRatio = 1 - (p.life / p.initialLife); // 0 to 1
    
    // Calculate current radius and opacity based on life
    p.currentRadius = p.initialRadius + (p.maxRadius - p.initialRadius) * progressRatio;
    p.opacity = 0.8 * (1 - progressRatio);
    
    // Draw expanding ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.currentRadius, 0, Math.PI * 2);
    ctx.lineWidth = 3 * (1 - progressRatio * 0.7); // Thinner as it expands
    ctx.strokeStyle = p.color.replace(')', `, ${p.opacity})`);
    ctx.stroke();
}
