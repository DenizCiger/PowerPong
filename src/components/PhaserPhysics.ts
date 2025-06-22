import Phaser from 'phaser';
import * as Constants from '../constants';
import { CollisionData, WallCollisionData, ScoreData } from '../types/GameTypes';

export class PhaserPhysics {
    static accelerateBall(ball: Phaser.GameObjects.Arc): void {
        // Only accelerate if we haven't hit the speed cap
        const body = ball.body as Phaser.Physics.Arcade.Body;
        const currentSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        
        if (currentSpeed < Constants.MAX_BALL_SPEED) {
            const direction = body.velocity.x > 0 ? 1 : -1;
            const newSpeed = Math.min(currentSpeed + Constants.BALL_ACCELERATION, Constants.MAX_BALL_SPEED);
            const angle = Math.atan2(body.velocity.y, Math.abs(body.velocity.x));
            
            body.setVelocity(
                Math.cos(angle) * newSpeed * direction,
                Math.sin(angle) * newSpeed
            );
        }
    }

    static getComboSpeedMultiplier(rallyCount: number): number {
        if (rallyCount <= 5) return 1;
        return Math.min(2.5, 1 + Math.log10(rallyCount / 5) * 0.5);
    }

    static handleBallPaddleCollision(
        ball: Phaser.GameObjects.Arc, 
        paddle: Phaser.GameObjects.Rectangle, 
        paddleIndex: number, 
        rallyCount: number, 
        scene: Phaser.Scene
    ): CollisionData {
        // Calculate relative hit position (-0.5 to 0.5)
        const paddleCenter = paddle.y;
        const hitPos = (ball.y - paddleCenter) / paddle.displayHeight;
        const clampedHitPos = Math.max(-0.5, Math.min(0.5, hitPos));
        
        // Get current speed and accelerate it
        const body = ball.body as Phaser.Physics.Arcade.Body;
        const currentSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        const baseSpeed = Math.max(currentSpeed + Constants.BALL_ACCELERATION, Constants.BALL_SPEED);
        
        // Apply combo multiplier (but don't let it go below base speed)
        const comboMultiplier = this.getComboSpeedMultiplier(rallyCount);
        const newSpeed = Math.max(baseSpeed, baseSpeed * comboMultiplier);
        
        // Calculate new velocity based on hit position
        const angle = clampedHitPos * Math.PI/3; // 60 degree max angle
        
        // Set new velocity based on paddle
        const direction = paddleIndex === 1 ? 1 : -1;
        body.setVelocity(
            Math.cos(angle) * newSpeed * direction,
            Math.sin(angle) * newSpeed
        );
        
        // Ensure ball doesn't get stuck in paddle
        if (paddleIndex === 1) {
            ball.x = paddle.x + paddle.displayWidth/2 + Constants.BALL_RADIUS + 2;
        } else {
            ball.x = paddle.x - paddle.displayWidth/2 - Constants.BALL_RADIUS - 2;
        }
        
        // Cap maximum speed
        const finalSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        if (finalSpeed > Constants.MAX_BALL_SPEED) {
            const normalizedX = body.velocity.x / finalSpeed;
            const normalizedY = body.velocity.y / finalSpeed;
            body.setVelocity(
                normalizedX * Constants.MAX_BALL_SPEED,
                normalizedY * Constants.MAX_BALL_SPEED
            );
        }
        
        return {
            paddleHit: true,
            paddleIndex: paddleIndex,
            rallyIncrement: 1
        };
    }

    static handleBallWallCollision(ball: Phaser.GameObjects.Arc, scene: Phaser.Scene): WallCollisionData {
        let collision: WallCollisionData = { wallHit: false };
        const body = ball.body as Phaser.Physics.Arcade.Body;
        
        // Check top wall
        if (ball.y <= Constants.BALL_RADIUS) {
            ball.y = Constants.BALL_RADIUS + 1;
            if (body.velocity.y < 0) {
                body.velocity.y = -body.velocity.y;
            }
            collision = { wallHit: true, wall: 'top' };
        } 
        // Check bottom wall
        else if (ball.y >= scene.cameras.main.height - Constants.BALL_RADIUS) {
            ball.y = scene.cameras.main.height - Constants.BALL_RADIUS - 1;
            if (body.velocity.y > 0) {
                body.velocity.y = -body.velocity.y;
            }
            collision = { wallHit: true, wall: 'bottom' };
        }
        
        return collision;
    }

    static checkScoring(ball: Phaser.GameObjects.Arc, scene: Phaser.Scene): ScoreData {
        if (ball.x < 0) {
            return { scored: true, scoringPlayer: 2 };
        } else if (ball.x > scene.cameras.main.width) {
            return { scored: true, scoringPlayer: 1 };
        }
        return { scored: false };
    }
}
