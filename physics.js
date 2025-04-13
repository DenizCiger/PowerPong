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

// Check for ball collision with paddles and walls
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
    
    // Paddle collisions
    // Left paddle (Player 1)
    if (ball.x - BALL_RADIUS < PADDLE_MARGIN + PADDLE_WIDTH && 
        ball.y > player1Y && 
        ball.y < player1Y + player1PaddleHeight && 
        ball.speedX < 0) {
        
        ball.speedX = -ball.speedX;
        // Adjust angle based on where ball hits paddle
        const hitPosition = (ball.y - (player1Y + player1PaddleHeight / 2)) / (player1PaddleHeight / 2);
        ball.speedY = hitPosition * 5;
        
        // Accelerate ball slightly with each hit to increase intensity
        accelerateBall(ball);
        
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
    if (ball.x + BALL_RADIUS > canvasWidth - PADDLE_MARGIN - PADDLE_WIDTH && 
        ball.y > player2Y && 
        ball.y < player2Y + player2PaddleHeight && 
        ball.speedX > 0) {
        
        ball.speedX = -ball.speedX;
        // Adjust angle based on where ball hits paddle
        const hitPosition = (ball.y - (player2Y + player2PaddleHeight / 2)) / (player2PaddleHeight / 2);
        ball.speedY = hitPosition * 5;
        
        // Accelerate ball slightly with each hit to increase intensity
        accelerateBall(ball);
        
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
