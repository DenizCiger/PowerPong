import { BALL_RADIUS, PADDLE_MARGIN, PADDLE_WIDTH, BALL_ACCELERATION, MAX_BALL_SPEED } from './constants.js';
import { createPaddleHitParticles, createWallHitParticles } from './particles.js';

// Accelerate the ball to increase intensity
export function accelerateBall(ball) {
    // Only accelerate if we haven't hit the speed cap
    if (Math.abs(ball.speedX) < MAX_BALL_SPEED) {
        // Keep direction but increase magnitude
        const direction = ball.speedX > 0 ? 1 : -1;
        ball.speedX = (Math.abs(ball.speedX) + BALL_ACCELERATION) * direction;
    }
}

// Helper function to calculate combo-based speed multiplier
function getComboSpeedMultiplier(rallyCount) {
    // Logarithmic scaling for smoother progression
    if (rallyCount <= 5) return 1;
    return Math.min(2.5, 1 + Math.log10(rallyCount/5) * 0.5);
}

// Check ball collisions with paddles and walls
export function checkBallCollisions(ball, player1Y, player2Y, player1PaddleHeight, player2PaddleHeight, canvasWidth, canvasHeight, applyScreenShake) {
    let collisionData = {
        paddleHit: false,
        paddleIndex: null,
        wallHit: false,
        scored: false,
        scoringPlayer: null,
        rallyIncrement: 0
    };    // Top/bottom collision
    if (ball.y - BALL_RADIUS < 0 || ball.y + BALL_RADIUS > canvasHeight) {
        ball.speedY = -ball.speedY;
        collisionData.wallHit = true;
        
        // Fix for getting stuck at edges - push the ball away from the edge
        if (ball.y - BALL_RADIUS < 0) {
            ball.y = BALL_RADIUS + 1; // Push down slightly from top edge
        } else if (ball.y + BALL_RADIUS > canvasHeight) {
            ball.y = canvasHeight - BALL_RADIUS - 1; // Push up slightly from bottom edge
        }
        
        if (Math.abs(ball.speedY) > 4) { // Only shake on hard hits
            applyScreenShake();
            createWallHitParticles(ball.x, ball.y, ball.speedY > 0 ? -1 : 1, 8);
        }
    }
      // Check collisions with paddles
    if (ball.x - BALL_RADIUS <= PADDLE_MARGIN + PADDLE_WIDTH && 
        ball.x + BALL_RADIUS >= PADDLE_MARGIN &&
        ball.y + BALL_RADIUS >= player1Y && 
        ball.y - BALL_RADIUS <= player1Y + player1PaddleHeight &&
        ball.speedX < 0) {
            
        // Calculate relative hit position (-0.5 to 0.5)
        const hitPos = (ball.y - player1Y - player1PaddleHeight/2) / player1PaddleHeight;
        
        // Base speed multiplier from combo
        const comboMultiplier = getComboSpeedMultiplier(collisionData.rallyIncrement);
        
        // Reflect ball with angle based on hit position
        const angle = hitPos * Math.PI/3; // 60 degree max angle
        const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY) * comboMultiplier;
        ball.speedX = Math.cos(angle) * speed;
        ball.speedY = Math.sin(angle) * speed;
        
        // Cap maximum speed
        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        if (currentSpeed > MAX_BALL_SPEED) {
            const scale = MAX_BALL_SPEED / currentSpeed;
            ball.speedX *= scale;
            ball.speedY *= scale;
        }
        
        // Set collision data
        collisionData.paddleHit = true;
        collisionData.paddleIndex = 1;
        collisionData.rallyIncrement = 1;
        
        // Add screen shake for dramatic effect
        applyScreenShake();
        
        // Create paddle hit particles
        createPaddleHitParticles(ball.x, ball.y, 1, 12, '#4488ff');
    }
      // Right paddle (Player 2)
    if (ball.x + BALL_RADIUS >= canvasWidth - PADDLE_MARGIN - PADDLE_WIDTH && 
        ball.x - BALL_RADIUS <= canvasWidth - PADDLE_MARGIN &&
        ball.y + BALL_RADIUS >= player2Y && 
        ball.y - BALL_RADIUS <= player2Y + player2PaddleHeight && 
        ball.speedX > 0) {
          // Calculate relative hit position (-0.5 to 0.5)
        const hitPos = (ball.y - player2Y - player2PaddleHeight/2) / player2PaddleHeight;
        
        // Base speed multiplier from combo
        const comboMultiplier = getComboSpeedMultiplier(collisionData.rallyIncrement);
        
        // Reflect ball with angle based on hit position
        const angle = Math.PI + (hitPos * Math.PI/3); // Angle for right paddle (add PI to flip direction)
        const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY) * comboMultiplier;
        ball.speedX = Math.cos(angle) * speed;
        ball.speedY = Math.sin(angle) * speed;
        
        // Cap maximum speed
        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        if (currentSpeed > MAX_BALL_SPEED) {
            const scale = MAX_BALL_SPEED / currentSpeed;
            ball.speedX *= scale;
            ball.speedY *= scale;
        }
        
        // Set collision data
        collisionData.paddleHit = true;
        collisionData.paddleIndex = 2;
        collisionData.rallyIncrement = 1;
        
        // Add screen shake for dramatic effect
        applyScreenShake();
        
        // Create paddle hit particles
        createPaddleHitParticles(ball.x, ball.y, -1, 12, '#ff4444');
    }
    
    // Scoring
    if (ball.x < 0) {
        collisionData.scored = true;
        collisionData.scoringPlayer = 2;
    } else if (ball.x > canvasWidth) {
        collisionData.scored = true;
        collisionData.scoringPlayer = 1;
    }
    
    return collisionData;
}
