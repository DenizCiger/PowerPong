export class PhaserParticles {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.scoreAnimations = [];
    }

    createParticles(x, y, count, options = {}) {
        const defaults = {
            speedMin: 50,
            speedMax: 150,
            scaleMin: 0.1,
            scaleMax: 0.5,
            lifespan: 500,
            tint: 0xffffff,
            blendMode: 'ADD'
        };
        
        const config = { ...defaults, ...options };
          // Create a simple particle burst
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: config.speedMin, max: config.speedMax },
            scale: { start: config.scaleMax, end: config.scaleMin },
            lifespan: config.lifespan,
            tint: config.tint,
            blendMode: config.blendMode,
            quantity: count
        });
        
        // Auto-destroy after lifespan
        this.scene.time.delayedCall(config.lifespan, () => {
            particles.destroy();
        });
        
        return particles;
    }

    createPaddleHitParticles(x, y, paddleIndex) {
        const color = paddleIndex === 1 ? 0x4488ff : 0xff4444;
        return this.createParticles(x, y, 12, {
            tint: color,
            speedMin: 30,
            speedMax: 100,
            lifespan: 400
        });
    }

    createWallHitParticles(x, y) {
        return this.createParticles(x, y, 8, {
            tint: 0xffffff,
            speedMin: 20,
            speedMax: 80,
            lifespan: 300
        });
    }

    createPowerUpCollectionParticles(x, y, color) {
        return this.createParticles(x, y, 15, {
            tint: color,
            speedMin: 40,
            speedMax: 120,
            lifespan: 600,
            scaleMax: 0.7
        });
    }

    createScoreAnimation(player, yPos) {
        const x = player === 1 ? this.scene.cameras.main.width / 4 : this.scene.cameras.main.width * 3 / 4;
        const color = player === 1 ? '#4488ff' : '#ff4444';
        
        const scoreText = this.scene.add.text(x, yPos, '+1', {
            fontSize: '48px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animate the score text
        this.scene.tweens.add({
            targets: scoreText,
            y: yPos - 80,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => scoreText.destroy()
        });
        
        // Create score particles
        this.createParticles(x, yPos, 20, {
            tint: player === 1 ? 0x4488ff : 0xff4444,
            speedMin: 30,
            speedMax: 100,
            lifespan: 800
        });
    }

    createTeleportEffect(x, y) {        // Create a swirling teleport effect
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 20, max: 60 },
            scale: { start: 0.8, end: 0 },
            lifespan: 400,
            tint: 0xff8c00, // Orange color
            blendMode: 'ADD',
            quantity: 20,
            emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 30), quantity: 20 }
        });
        
        this.scene.time.delayedCall(400, () => {
            particles.destroy();
        });
        
        return particles;
    }

    createShockwave(x, y, initialRadius, maxRadius, color) {
        // Create expanding ring effect using graphics
        const graphics = this.scene.add.graphics();
        graphics.x = x;
        graphics.y = y;
        
        this.scene.tweens.add({
            targets: graphics,
            duration: 500,
            onUpdate: (tween) => {
                const progress = tween.progress;
                const currentRadius = initialRadius + (maxRadius - initialRadius) * progress;
                const alpha = 1 - progress;
                
                graphics.clear();
                graphics.lineStyle(3, color, alpha);
                graphics.strokeCircle(0, 0, currentRadius);
            },
            onComplete: () => {
                graphics.destroy();
            }
        });
        
        return graphics;
    }

    createWindParticles(x, y, directionX, directionY, windZoneSize) {
        const angle = Math.atan2(directionY, directionX);
        // Create flowing wind particles
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 40, max: 80 },
            scale: { start: 0.2, end: 0 },
            lifespan: 800,
            tint: 0x87ceeb, // Sky blue
            alpha: { start: 0.6, end: 0 },
            quantity: 2,
            angle: { min: Phaser.Math.RadToDeg(angle) - 15, max: Phaser.Math.RadToDeg(angle) + 15 },
            emitZone: { 
                type: 'random', 
                source: new Phaser.Geom.Rectangle(-windZoneSize/2, -windZoneSize/2, windZoneSize, windZoneSize)
            }
        });
        
        // Let it emit for a short time then stop
        this.scene.time.delayedCall(100, () => {
            particles.stop();
        });
        
        this.scene.time.delayedCall(900, () => {
            particles.destroy();
        });
        
        return particles;
    }

    destroy() {
        // Clean up any remaining particles
        this.particles.forEach(p => {
            if (p && p.destroy) p.destroy();
        });
        this.particles = [];
        this.scoreAnimations = [];
    }
}
