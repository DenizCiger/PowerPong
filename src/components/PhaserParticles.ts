import { SCORE_ANIMATION_DURATION } from '../constants';
import { GameParticle, WindParticle, ScoreAnimation, ShockwaveParticle, WindZoneInfo } from '../types/GameTypes';

export class PhaserParticles {
    private particles: GameParticle[] = [];
    private scoreAnimations: ScoreAnimation[] = [];
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // Create particles with common parameters
    createParticles(x: number, y: number, count: number, options: Partial<{
        speedMin: number;
        speedMax: number;
        sizeMin: number;
        sizeMax: number;
        lifeMin: number;
        lifeMax: number;
        color: string;
        directionX: number;
        directionY: number;
        spreadAngle: number;
        particleLimit: number;
    }> = {}): void {
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
        if (this.particles.length > config.particleLimit) return;
        
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
            this.particles.push({
                x,
                y,
                speedX,
                speedY,
                size,
                color: config.color,
                life,
                type: 'regular'
            });
        }
    }

    // Create particles when ball hits paddle
    createPaddleHitParticles(x: number, y: number, directionX: number, count: number, color: string): void {
        this.createParticles(x, y, count, {
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
    createWallHitParticles(x: number, y: number, directionY: number, count: number): void {
        this.createParticles(x, y, count, {
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
    createScoreAnimation(player: number, yPos: number, canvasWidth: number): void {
        const x = player === 1 ? canvasWidth / 4 : canvasWidth * 3 / 4;
        const color = player === 1 ? '#4488ff' : '#ff4444';
        
        this.scoreAnimations.push({
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
        this.createParticles(x, yPos, 20, {
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
    createTeleportEffect(x: number, y: number, applyScreenShake: () => void): void {
        // Add screen shake
        applyScreenShake();
        
        // Add particles using the shared function
        this.createParticles(x, y, 15, {
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

    // Create wind effect particles
    createWindParticles(x: number, y: number, directionX: number, directionY: number, windZoneSize: number): void {
        const particleCount = 1;
        
        // Calculate wind angle
        const windAngle = Math.atan2(directionY, directionX);
        
        // For rotated wind zone, use different dimensions
        const windZoneLength = 200; // Longer in the direction of wind
        const halfLength = windZoneLength / 2;
        const halfWidth = windZoneSize / 2;
        
        // Generate particles at random positions within the wind zone
        for (let i = 0; i < particleCount; i++) {
            // Generate particles with bias towards the upwind edge
            const localX = -halfLength + Math.random() * halfLength * 0.8;
            const localY = (Math.random() * 2 - 1) * halfWidth * 0.9;
            
            // Rotate local coordinates to world space
            const particleX = x + localX * Math.cos(windAngle) - localY * Math.sin(windAngle);
            const particleY = y + localX * Math.sin(windAngle) + localY * Math.cos(windAngle);
            
            // Create particle with wind direction
            const baseSpeed = 4.0 + Math.random() * 2.0;
            const speedX = directionX * baseSpeed;
            const speedY = directionY * baseSpeed;
            
            // Store wind zone info with each particle for boundary checking
            const windZoneInfo: WindZoneInfo = {
                centerX: x,
                centerY: y,
                halfLength,
                halfWidth,
                angle: windAngle,
                dirX: directionX,
                dirY: directionY
            };
            // Create streak particle with wind properties
            const windParticle: WindParticle = {
                x: particleX,
                y: particleY,
                speedX: speedX,
                speedY: speedY,
                size: 2,
                width: 40 + Math.random() * 35,
                height: 1.5 + Math.random() * 1.5,
                color: 'rgba(220, 240, 255, ' + (0.6 + Math.random() * 0.4) + ')',
                life: 20 + Math.random() * 25,
                windZoneInfo,
                type: 'wind',
                angle: windAngle
            };
            
            this.particles.push(windParticle);
        }
    }

    // Create shockwave effect (expanding ring)
    createShockwave(x: number, y: number, initialRadius: number, maxRadius: number, color: string): void {
        const shockwaveParticle: ShockwaveParticle = {
            x,
            y,
            type: 'shockwave',
            initialRadius,
            maxRadius,
            currentRadius: initialRadius,
            color,
            life: 30,
            initialLife: 30,
            opacity: 0.8,
            speedX: 0,
            speedY: 0,
            size: 0
        };
        
        this.particles.push(shockwaveParticle);
    }

    // Update particles (for visual effects)
    update(deltaTime: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX * (deltaTime / 16.67);
            p.y += p.speedY * (deltaTime / 16.67);
            p.life -= (deltaTime / 16.67);
            
            // Handle wind particles specially
            if (p.type === 'wind') {
                const windParticle = p as WindParticle;
                this.updateWindParticle(windParticle);
            }
            
            // Handle shockwave particles
            if (p.type === 'shockwave') {
                const shockwave = p as ShockwaveParticle;
                this.updateShockwave(shockwave);
            }
            
            // Remove expired particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update score animations
        const currentTime = Date.now();
        for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
            const anim = this.scoreAnimations[i];
            const elapsed = currentTime - anim.createdAt;
            const progress = Math.min(1, elapsed / SCORE_ANIMATION_DURATION);
            
            anim.size = anim.maxSize * Math.min(progress * 2, 1);
            anim.y -= 0.5;
            anim.opacity = 1 - progress;
            
            if (progress >= 1) {
                this.scoreAnimations.splice(i, 1);
            }
        }
    }

    private updateWindParticle(p: WindParticle): void {
        const wz = p.windZoneInfo;
        
        // Convert world coordinates to local (rotated) coordinates
        const dx = p.x - wz.centerX;
        const dy = p.y - wz.centerY;
        
        // Rotate to align with wind direction
        const cosAngle = Math.cos(-wz.angle);
        const sinAngle = Math.sin(-wz.angle);
        const localX = dx * cosAngle - dy * sinAngle;
        const localY = dx * sinAngle + dy * cosAngle;
        
        // Check if the particle needs repositioning
        let needsRepositioning = false;
        let newLocalX = localX;
        let newLocalY = localY;
        
        // Check if particle has moved past the downwind edge
        if (localX > wz.halfLength) {
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
            const cosAngleBack = Math.cos(wz.angle);
            const sinAngleBack = Math.sin(wz.angle);
            p.x = wz.centerX + newLocalX * cosAngleBack - newLocalY * sinAngleBack;
            p.y = wz.centerY + newLocalX * sinAngleBack + newLocalY * cosAngleBack;
        }
    }

    private updateShockwave(p: ShockwaveParticle): void {
        const progressRatio = 1 - (p.life / p.initialLife); // 0 to 1
        
        // Calculate current radius and opacity based on life
        p.currentRadius = p.initialRadius + (p.maxRadius - p.initialRadius) * progressRatio;
        p.opacity = 0.8 * (1 - progressRatio);
    }

    // Render particles using Phaser graphics
    render(graphics: Phaser.GameObjects.Graphics): void {
        graphics.clear();
        
        this.particles.forEach(p => {
            if (p.type === 'wind') {
                this.renderWindParticle(graphics, p as WindParticle);
            } else if (p.type === 'shockwave') {
                this.renderShockwave(graphics, p as ShockwaveParticle);
            } else {
                this.renderRegularParticle(graphics, p);
            }
        });
        
        // Render score animations would need to be handled by UI system
        // as Phaser doesn't use canvas 2D context like the original
    }

    private renderRegularParticle(graphics: Phaser.GameObjects.Graphics, p: GameParticle): void {
        const color = Phaser.Display.Color.HexStringToColor(p.color.replace('rgba', '').replace('rgb', ''));
        graphics.fillStyle(color.color);
        graphics.fillCircle(p.x, p.y, p.size);
    }

    private renderWindParticle(graphics: Phaser.GameObjects.Graphics, p: WindParticle): void {
        graphics.save();
        
        // Set rotation and draw streak
        const color = Phaser.Display.Color.HexStringToColor(p.color.replace('rgba', '').replace('rgb', ''));
        graphics.fillStyle(color.color);
        
        // For simplicity, draw as rectangle - full rotation would need matrix transforms
        graphics.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);
        
        graphics.restore();
    }

    private renderShockwave(graphics: Phaser.GameObjects.Graphics, p: ShockwaveParticle): void {
        const color = Phaser.Display.Color.HexStringToColor(p.color.replace('rgba', '').replace('rgb', ''));
        graphics.lineStyle(3 * (1 - (1 - p.life / p.initialLife) * 0.7), color.color, p.opacity);
        graphics.strokeCircle(p.x, p.y, p.currentRadius);
    }

    // Get score animations for UI rendering
    getScoreAnimations(): ScoreAnimation[] {
        return this.scoreAnimations;
    }

    // Reset particles system
    reset(): void {
        this.particles = [];
        this.scoreAnimations = [];
    }
}
