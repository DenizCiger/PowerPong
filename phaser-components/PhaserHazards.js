import * as Constants from '../constants.js';

export class PhaserHazards {
    constructor(scene) {
        this.scene = scene;
        this.hazardTypes = [
            {
                type: 'blackHole',
                name: 'Black Hole',
                color: 0x000000,
                glowColor: 0x4a0080,
                radius: Constants.VORTEX_RADIUS,
                duration: Constants.HAZARD_DURATION,
                icon: '🌑',
                description: 'Pulls the ball towards its center'
            },
            {
                type: 'whiteHole',
                name: 'White Hole',
                color: 0xffffff,
                glowColor: 0xffff80,
                radius: Constants.VORTEX_RADIUS,
                duration: Constants.HAZARD_DURATION,
                icon: '⚪',
                description: 'Pushes the ball away from its center'
            },
            {
                type: 'windZone',
                name: 'Wind Zone',
                color: 0x87ceeb,
                glowColor: 0xa0d8ff,
                width: 80,
                height: 120,
                duration: Constants.HAZARD_DURATION,
                icon: '💨',
                description: 'Applies constant wind force to the ball'
            },
            {
                type: 'barrier',
                name: 'Barrier',
                color: 0x3498db,
                glowColor: 0x5dade2,
                width: Constants.BARRIER_WIDTH,
                height: Constants.BARRIER_HEIGHT,
                duration: Constants.HAZARD_DURATION,
                maxHits: 3,
                icon: '🛡️',
                description: 'Blocks the ball, breaks after multiple hits'
            },
            {
                type: 'portal',
                name: 'Portal',
                color: 0x8a2be2,
                glowColor: 0xda70d6,
                radius: 25,
                duration: Constants.HAZARD_DURATION,
                icon: '🌀',
                description: 'Teleports the ball to its linked portal'
            }
        ];
    }

    spawnHazard(x, y, type = null) {
        // Choose random type if not specified
        if (type === null) {
            type = Phaser.Math.RND.pick(this.hazardTypes);
        } else if (typeof type === 'number') {
            type = this.hazardTypes[type];
        }

        const hazard = this.createHazardVisual(x, y, type);
        
        // Store hazard data
        hazard.hazardData = {
            type: type.type,
            name: type.name,
            color: type.color,
            glowColor: type.glowColor,
            createdAt: Date.now(),
            duration: type.duration,
            maxHits: type.maxHits || 0,
            currentHits: 0
        };

        // Add specific properties based on type
        switch (type.type) {
            case 'windZone':
                hazard.hazardData.windDirection = {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                };
                break;
            case 'portal':
                hazard.hazardData.linkedPortal = null; // Will be set when pair is created
                break;
            case 'barrier':
                hazard.hazardData.segments = this.createBarrierSegments(hazard);
                break;
        }

        return hazard;
    }

    createHazardVisual(x, y, type) {
        const hazard = this.scene.add.group();
        let mainBody;

        switch (type.type) {
            case 'blackHole':
                mainBody = this.createBlackHole(x, y, type);
                break;
            case 'whiteHole':
                mainBody = this.createWhiteHole(x, y, type);
                break;
            case 'windZone':
                mainBody = this.createWindZone(x, y, type);
                break;
            case 'barrier':
                mainBody = this.createBarrier(x, y, type);
                break;
            case 'portal':
                mainBody = this.createPortal(x, y, type);
                break;
            default:
                mainBody = this.scene.add.circle(x, y, 20, type.color);
        }

        // Add physics if needed
        if (type.type === 'barrier') {
            this.scene.physics.add.existing(mainBody, true); // Static body
        }

        hazard.add(mainBody);
        hazard.mainBody = mainBody;
        mainBody.x = x;
        mainBody.y = y;

        return mainBody;
    }

    createBlackHole(x, y, type) {
        const blackHole = this.scene.add.group();
        
        // Outer glow
        const outerGlow = this.scene.add.circle(x, y, type.radius + 10, type.glowColor, 0.3);
        
        // Main body
        const body = this.scene.add.circle(x, y, type.radius, type.color);
        body.setStrokeStyle(2, type.glowColor);
        
        // Inner swirl effect
        const swirl = this.scene.add.graphics();
        swirl.x = x;
        swirl.y = y;
        
        blackHole.add(outerGlow);
        blackHole.add(body);
        blackHole.add(swirl);
        
        // Animate swirl
        this.scene.tweens.add({
            targets: swirl,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear',
            onUpdate: () => {
                swirl.clear();
                swirl.lineStyle(2, type.glowColor, 0.8);
                for (let i = 0; i < 3; i++) {
                    const angle = (swirl.rotation + i * Math.PI * 2 / 3);
                    const startRadius = type.radius * 0.8;
                    const endRadius = type.radius * 0.2;
                    swirl.arc(0, 0, startRadius, angle, angle + Math.PI * 0.3, false);
                    swirl.arc(0, 0, endRadius, angle + Math.PI * 0.3, angle + Math.PI * 0.6, false);
                }
                swirl.strokePath();
            }
        });
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: outerGlow,
            alpha: { from: 0.3, to: 0.8 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store group reference
        body.visualGroup = blackHole;
        return body;
    }

    createWhiteHole(x, y, type) {
        const whiteHole = this.scene.add.group();
        
        // Outer glow
        const outerGlow = this.scene.add.circle(x, y, type.radius + 15, type.glowColor, 0.5);
        
        // Main body
        const body = this.scene.add.circle(x, y, type.radius, type.color);
        body.setStrokeStyle(3, type.glowColor);
        
        // Rays effect
        const rays = this.scene.add.graphics();
        rays.x = x;
        rays.y = y;
        
        whiteHole.add(outerGlow);
        whiteHole.add(body);
        whiteHole.add(rays);
        
        // Animate rays
        this.scene.tweens.add({
            targets: rays,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear',
            onUpdate: () => {
                rays.clear();
                rays.lineStyle(3, type.glowColor, 0.6);
                for (let i = 0; i < 8; i++) {
                    const angle = (rays.rotation + i * Math.PI / 4);
                    const length = type.radius * 1.5;
                    rays.lineBetween(
                        Math.cos(angle) * type.radius * 0.7,
                        Math.sin(angle) * type.radius * 0.7,
                        Math.cos(angle) * length,
                        Math.sin(angle) * length
                    );
                }
            }
        });
        
        body.visualGroup = whiteHole;
        return body;
    }

    createWindZone(x, y, type) {
        const windZone = this.scene.add.group();
        
        // Main area
        const area = this.scene.add.rectangle(x, y, type.width, type.height, type.color, 0.3);
        area.setStrokeStyle(2, type.glowColor);
        
        // Wind lines
        const windLines = this.scene.add.graphics();
        windLines.x = x;
        windLines.y = y;
        
        windZone.add(area);
        windZone.add(windLines);
        
        // Animate wind lines
        let offset = 0;
        this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                offset += 5;
                windLines.clear();
                windLines.lineStyle(2, type.glowColor, 0.7);
                
                for (let i = 0; i < 5; i++) {
                    const y = -type.height/2 + (i * type.height/4) + (offset % 20);
                    windLines.lineBetween(-type.width/2 + 10, y, type.width/2 - 10, y);
                }
            },
            loop: true
        });
        
        area.visualGroup = windZone;
        return area;
    }

    createBarrier(x, y, type) {
        const barrier = this.scene.add.group();
        
        // Create barrier segments
        const segmentHeight = type.height / Constants.BARRIER_SEGMENTS;
        const segments = [];
        
        for (let i = 0; i < Constants.BARRIER_SEGMENTS; i++) {
            const segmentY = y - type.height/2 + segmentHeight/2 + i * segmentHeight;
            const segment = this.scene.add.rectangle(x, segmentY, type.width, segmentHeight - Constants.BARRIER_SEGMENT_GAP, type.color);
            segment.setStrokeStyle(2, type.glowColor);
            segments.push(segment);
            barrier.add(segment);
        }
        
        // Main physics body
        const body = this.scene.add.rectangle(x, y, type.width, type.height, 0x000000, 0);
        
        barrier.add(body);
        body.visualGroup = barrier;
        body.segments = segments;
        
        return body;
    }

    createPortal(x, y, type) {
        const portal = this.scene.add.group();
        
        // Outer ring
        const outerRing = this.scene.add.circle(x, y, type.radius + 5, type.glowColor, 0.4);
        
        // Main body
        const body = this.scene.add.circle(x, y, type.radius, type.color, 0.8);
        
        // Swirl effect
        const swirl = this.scene.add.graphics();
        swirl.x = x;
        swirl.y = y;
        
        portal.add(outerRing);
        portal.add(body);
        portal.add(swirl);
        
        // Animate portal swirl
        this.scene.tweens.add({
            targets: swirl,
            rotation: -Math.PI * 2,
            duration: 2500,
            repeat: -1,
            ease: 'Linear',
            onUpdate: () => {
                swirl.clear();
                swirl.lineStyle(2, type.glowColor, 0.9);
                for (let i = 0; i < 4; i++) {
                    const angle = (swirl.rotation + i * Math.PI / 2);
                    const radius = type.radius * 0.7;
                    swirl.arc(0, 0, radius, angle, angle + Math.PI * 0.4, false);
                }
                swirl.strokePath();
            }
        });
        
        body.visualGroup = portal;
        return body;
    }

    createBarrierSegments(barrier) {
        // Segments are already created in createBarrier
        return barrier.segments || [];
    }

    updateHazards(activeHazards) {
        const currentTime = Date.now();
        
        return activeHazards.filter(hazard => {
            if (!hazard.hazardData) return false;
            
            // Check if hazard has expired
            if (currentTime - hazard.hazardData.createdAt > hazard.hazardData.duration) {
                this.destroyHazard(hazard);
                return false;
            }
            
            // Update hazard-specific behaviors
            this.updateHazardBehavior(hazard);
            
            return true;
        });
    }

    updateHazardBehavior(hazard) {
        const data = hazard.hazardData;
        
        switch (data.type) {
            case 'windZone':
                // Continuously spawn wind particles
                if (Math.random() < 0.3) {
                    this.scene.particleSystem.createWindParticles(
                        hazard.x, hazard.y,
                        data.windDirection.x, data.windDirection.y,
                        80
                    );
                }
                break;
        }
    }

    applyHazardEffects(balls, activeHazards) {
        balls.forEach(ball => {
            if (ball.trappedInBlackHole) {
                this.updateTrappedBall(ball, activeHazards);
                return;
            }
            
            activeHazards.forEach(hazard => {
                this.applyHazardEffect(ball, hazard);
            });
        });
    }

    applyHazardEffect(ball, hazard) {
        const data = hazard.hazardData;
        const dx = ball.x - hazard.x;
        const dy = ball.y - hazard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch (data.type) {
            case 'blackHole':
                this.applyBlackHoleEffect(ball, hazard, distance, dx, dy);
                break;
            case 'whiteHole':
                this.applyWhiteHoleEffect(ball, hazard, distance, dx, dy);
                break;
            case 'windZone':
                this.applyWindEffect(ball, hazard, distance);
                break;
            case 'barrier':
                this.applyBarrierEffect(ball, hazard, distance);
                break;
            case 'portal':
                this.applyPortalEffect(ball, hazard, distance);
                break;
        }
    }

    applyBlackHoleEffect(ball, hazard, distance, dx, dy) {
        if (distance < Constants.VORTEX_RADIUS) {
            if (distance < 5) {
                // Trap the ball
                ball.trappedInBlackHole = true;
                ball.trappedBlackHole = hazard;
                ball.trappedStartTime = Date.now();
                hazard.hazardData.trappedBall = ball;
                return;
            }
            
            // Pull towards center
            const force = Constants.GRAVITY_STRENGTH * (1 - distance / Constants.VORTEX_RADIUS);
            const angle = Math.atan2(-dy, -dx);
            
            ball.body.velocity.x += Math.cos(angle) * force;
            ball.body.velocity.y += Math.sin(angle) * force;
        }
    }

    applyWhiteHoleEffect(ball, hazard, distance, dx, dy) {
        if (distance < Constants.VORTEX_RADIUS) {
            // Push away from center
            const force = Constants.GRAVITY_STRENGTH * (1 - distance / Constants.VORTEX_RADIUS);
            const angle = Math.atan2(dy, dx);
            
            ball.body.velocity.x += Math.cos(angle) * force;
            ball.body.velocity.y += Math.sin(angle) * force;
        }
    }

    applyWindEffect(ball, hazard, distance) {
        const data = hazard.hazardData;
        const hazardBounds = hazard.getBounds();
        
        if (Phaser.Geom.Rectangle.Contains(hazardBounds, ball.x, ball.y)) {
            ball.body.velocity.x += data.windDirection.x * Constants.WIND_STRENGTH;
            ball.body.velocity.y += data.windDirection.y * Constants.WIND_STRENGTH;
        }
    }

    applyBarrierEffect(ball, hazard, distance) {
        // Collision is handled by Phaser's physics system
        // This is called when collision occurs
    }

    applyPortalEffect(ball, hazard, distance) {
        const data = hazard.hazardData;
        
        if (distance < data.radius && data.linkedPortal) {
            // Teleport to linked portal
            this.scene.particleSystem.createTeleportEffect(ball.x, ball.y);
            
            ball.x = data.linkedPortal.x;
            ball.y = data.linkedPortal.y;
            
            this.scene.particleSystem.createTeleportEffect(ball.x, ball.y);
            this.scene.applyScreenShake();
            
            // Prevent immediate re-teleport
            ball.portalCooldown = Date.now() + 500;
        }
    }

    updateTrappedBall(ball, activeHazards) {
        const blackHole = ball.trappedBlackHole;
        
        if (!blackHole || !activeHazards.includes(blackHole)) {
            // Black hole is gone, release the ball
            ball.trappedInBlackHole = false;
            ball.trappedBlackHole = null;
            return;
        }
        
        const timeSinceTrapped = Date.now() - ball.trappedStartTime;
        const orbitRadius = Math.max(0.5, (2000 - timeSinceTrapped) / 2000) * Constants.VORTEX_RADIUS * 0.3;
        const orbitSpeed = 0.015 * timeSinceTrapped;
        
        ball.x = blackHole.x + Math.cos(orbitSpeed) * orbitRadius;
        ball.y = blackHole.y + Math.sin(orbitSpeed) * orbitRadius;
        
        // Release after 2 seconds
        if (timeSinceTrapped > 2000) {
            ball.trappedInBlackHole = false;
            ball.trappedBlackHole = null;
            blackHole.hazardData.trappedBall = null;
            
            // Give ball some velocity to escape
            const escapeAngle = Math.random() * Math.PI * 2;
            ball.body.setVelocity(
                Math.cos(escapeAngle) * Constants.BALL_SPEED,
                Math.sin(escapeAngle) * Constants.BALL_SPEED
            );
        }
    }

    handleBarrierCollision(ball, barrier) {
        const data = barrier.hazardData;
        data.currentHits++;
        
        // Create impact particles
        this.scene.particleSystem.createParticles(ball.x, ball.y, 8, {
            tint: 0xdc143c,
            speedMin: 30,
            speedMax: 80,
            lifespan: 400
        });
        
        // Update barrier visual based on damage
        this.updateBarrierVisual(barrier, data.currentHits, data.maxHits);
        
        // Destroy barrier if max hits reached
        if (data.currentHits >= data.maxHits) {
            this.destroyBarrier(barrier);
            return true; // Barrier destroyed
        }
        
        return false; // Barrier still intact
    }

    updateBarrierVisual(barrier, currentHits, maxHits) {
        const healthRatio = 1 - (currentHits / maxHits);
        
        if (barrier.segments) {
            barrier.segments.forEach(segment => {
                if (healthRatio > 0.6) {
                    segment.setFillStyle(Constants.BARRIER_COLORS.healthy.primary);
                    segment.setStrokeStyle(2, Constants.BARRIER_COLORS.healthy.secondary);
                } else if (healthRatio > 0.3) {
                    segment.setFillStyle(Constants.BARRIER_COLORS.damaged.primary);
                    segment.setStrokeStyle(2, Constants.BARRIER_COLORS.damaged.secondary);
                } else {
                    segment.setFillStyle(Constants.BARRIER_COLORS.critical.primary);
                    segment.setStrokeStyle(2, Constants.BARRIER_COLORS.critical.secondary);
                }
            });
        }
    }

    destroyBarrier(barrier) {
        // Create destruction particles
        this.scene.particleSystem.createParticles(barrier.x, barrier.y, 15, {
            tint: 0xffffff,
            speedMin: 50,
            speedMax: 150,
            lifespan: 600
        });
        
        this.destroyHazard(barrier);
    }

    destroyHazard(hazard) {
        if (hazard.visualGroup) {
            hazard.visualGroup.destroy(true);
        } else {
            hazard.destroy();
        }
    }

    spawnHazardPair() {
        // Spawn portal pairs
        const portal1 = this.spawnHazard(
            Phaser.Math.Between(100, this.scene.cameras.main.width - 100),
            Phaser.Math.Between(50, this.scene.cameras.main.height - 50),
            this.hazardTypes.find(h => h.type === 'portal')
        );
        
        const portal2 = this.spawnHazard(
            Phaser.Math.Between(100, this.scene.cameras.main.width - 100),
            Phaser.Math.Between(50, this.scene.cameras.main.height - 50),
            this.hazardTypes.find(h => h.type === 'portal')
        );
        
        // Link the portals
        portal1.hazardData.linkedPortal = portal2;
        portal2.hazardData.linkedPortal = portal1;
        
        return [portal1, portal2];
    }
}
