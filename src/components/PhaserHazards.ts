import { HazardData, HazardType } from '../types/GameTypes';
import { PhaserParticles } from './PhaserParticles';
import { hazardTypes, POWERUP_SIZE } from '../constants';

export class PhaserHazards {
    private scene: Phaser.Scene;
    private particles: PhaserParticles;
    private activeHazards: HazardData[] = [];
    private hazardGroup: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, particles: PhaserParticles) {
        this.scene = scene;
        this.particles = particles;
        this.hazardGroup = this.scene.add.group();
    }

    // Check for collisions with hazards
    checkCollisions(balls: Phaser.GameObjects.Arc[]): void {
        const collidedHazards: number[] = [];
        
        for (let i = this.activeHazards.length - 1; i >= 0; i--) {
            const hazardData = this.activeHazards[i];
            const hazardSprite = this.hazardGroup.children.entries[i] as Phaser.GameObjects.Arc;
            
            if (!hazardSprite) continue;
            
            for (const ball of balls) {
                const distance = Phaser.Math.Distance.Between(
                    ball.x, ball.y, 
                    hazardSprite.x, hazardSprite.y
                );
                
                if (distance < POWERUP_SIZE) {
                    // Apply hazard effect
                    this.applyHazardEffect(hazardData, ball);
                    
                    // Remove hazard if it's not persistent
                    if (hazardData.type !== 'wind') {
                        collidedHazards.push(i);
                    }
                    break;
                }
            }
        }
        
        // Remove collided hazards
        collidedHazards.sort((a, b) => b - a).forEach(index => {
            this.removeHazard(index);
        });
    }

    private applyHazardEffect(hazard: HazardData, ball: Phaser.GameObjects.Arc): void {
        const body = ball.body as Phaser.Physics.Arcade.Body;
        
        switch (hazard.type) {
            case 'wind':
                if (hazard.direction) {
                    const windForce = 100;
                    body.setVelocity(
                        body.velocity.x + hazard.direction.x * windForce,
                        body.velocity.y + hazard.direction.y * windForce
                    );
                }
                break;
            case 'teleporter':
                // Teleport ball to random location
                ball.setPosition(
                    Math.random() * this.scene.cameras.main.width,
                    Math.random() * this.scene.cameras.main.height
                );
                this.particles.createTeleportEffect(ball.x, ball.y, () => {
                    // Screen shake effect would go here
                });
                break;
        }
    }

    spawnHazard(x: number, y: number, hazardType: string): void {
        const hazardTemplate = hazardTypes.find(h => h.type === hazardType);
        if (!hazardTemplate) return;

        // Create hazard sprite
        const hazardSprite = this.scene.add.circle(x, y, POWERUP_SIZE / 2, 
            Phaser.Display.Color.HexStringToColor(hazardTemplate.color).color);
        
        // Add physics if needed
        this.scene.physics.add.existing(hazardSprite);
        const body = hazardSprite.body as Phaser.Physics.Arcade.Body;
        body.setCircle(POWERUP_SIZE / 2);
        body.setImmovable(true);
        
        this.hazardGroup.add(hazardSprite);
        
        // Create hazard data
        const hazardData: HazardData = {
            type: hazardType,
            createdAt: Date.now(),
            x,
            y,
            direction: hazardTemplate.direction
        };
        
        this.activeHazards.push(hazardData);
    }

    private removeHazard(index: number): void {
        if (index >= 0 && index < this.activeHazards.length) {
            this.activeHazards.splice(index, 1);
            
            const sprite = this.hazardGroup.children.entries[index];
            if (sprite) {
                this.hazardGroup.remove(sprite);
                sprite.destroy();
            }
        }
    }

    update(deltaTime: number): void {
        // Update hazard logic if needed
    }

    reset(): void {
        this.activeHazards = [];
        this.hazardGroup.clear(true, true);
    }

    getActiveHazards(): HazardData[] {
        return this.activeHazards;
    }
}
