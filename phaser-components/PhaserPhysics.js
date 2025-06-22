import * as Constants from '../constants.js';

export class PhaserPhysics {
    static accelerateBall(ball) {
        // Only accelerate if we haven't hit the speed cap
        const currentSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        
        if (currentSpeed < Constants.MAX_BALL_SPEED) {
            const direction = ball.body.velocity.x > 0 ? 1 : -1;
            const newSpeed = Math.min(currentSpeed + Constants.BALL_ACCELERATION, Constants.MAX_BALL_SPEED);
            const angle = Math.atan2(ball.body.velocity.y, Math.abs(ball.body.velocity.x));
            
            ball.body.setVelocity(
                Math.cos(angle) * newSpeed * direction,
                Math.sin(angle) * newSpeed
            );
        }
    }

    static getComboSpeedMultiplier(rallyCount) {
        if (rallyCount <= 5) return 1;
        return Math.min(2.5, 1 + Math.log10(rallyCount / 5) * 0.5);
    }    static handleBallPaddleCollision(ball, paddle, paddleIndex, rallyCount, scene) {
        // Calculate relative hit position (-0.5 to 0.5)
        const hitPos = (ball.y - paddle.y) / paddle.height;
        
        // Get current speed and accelerate it
        const currentSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        const baseSpeed = Math.max(currentSpeed + Constants.BALL_ACCELERATION, Constants.BALL_SPEED);
        
        // Apply combo multiplier (but don't let it go below base speed)
        const comboMultiplier = this.getComboSpeedMultiplier(rallyCount);
        const newSpeed = Math.max(baseSpeed, baseSpeed * comboMultiplier);
        
        // Calculate new velocity based on hit position
        const angle = hitPos * Math.PI/3; // 60 degree max angle
        
        // Set new velocity based on paddle
        const direction = paddleIndex === 1 ? 1 : -1;
        ball.body.setVelocity(
            Math.cos(angle) * newSpeed * direction,
            Math.sin(angle) * newSpeed
        );
        
        // Cap maximum speed
        const finalSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        if (finalSpeed > Constants.MAX_BALL_SPEED) {
            const normalizedX = ball.body.velocity.x / finalSpeed;
            const normalizedY = ball.body.velocity.y / finalSpeed;
            ball.body.setVelocity(
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

    static handleBallWallCollision(ball, scene) {
        // Check top/bottom walls
        if (ball.y <= Constants.BALL_RADIUS) {
            ball.y = Constants.BALL_RADIUS + 2;
            ball.body.velocity.y = Math.abs(ball.body.velocity.y);
            return { wallHit: true, wall: 'top' };
        } else if (ball.y >= scene.cameras.main.height - Constants.BALL_RADIUS) {
            ball.y = scene.cameras.main.height - Constants.BALL_RADIUS - 2;
            ball.body.velocity.y = -Math.abs(ball.body.velocity.y);
            return { wallHit: true, wall: 'bottom' };
        }
        
        return { wallHit: false };
    }

    static checkScoring(ball, scene) {
        if (ball.x < 0) {
            return { scored: true, scoringPlayer: 2 };
        } else if (ball.x > scene.cameras.main.width) {
            return { scored: true, scoringPlayer: 1 };
        }
        return { scored: false };
    }
}
