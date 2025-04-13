import { POWERUP_DURATION } from './constants.js';

// DOM elements
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const player1ScoreEl = document.getElementById('player1-score');
export const player2ScoreEl = document.getElementById('player2-score');
export const player1EffectsEl = document.getElementById('player1-effects');
export const player2EffectsEl = document.getElementById('player2-effects');
export const gameStatusEl = document.getElementById('game-status');

// Generic notification display function
export function showNotification(message, bgColor, position = '30%', duration = 2500) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'game-notification';
    
    // Position at the specified position of the screen
    notification.style.position = 'absolute';
    notification.style.top = position;
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = '#fff';
    notification.style.fontWeight = 'bold';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    notification.style.zIndex = '100';
    notification.style.textAlign = 'center';
    notification.style.fontSize = '18px';
    notification.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
    notification.style.pointerEvents = 'none'; // Don't interfere with mouse events
    
    notification.innerHTML = message;
    notification.style.backgroundColor = bgColor;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '0.9';
    }, 50);
    
    // Fade out and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, duration);
    
    return notification;
}

// Show a notification about power-ups
export function showPowerUpNotification(type, player) {
    const playerName = player === 'player1' ? 'Player 1' : 'Player 2';
    let message, bgColor;
    
    switch(type) {
        case 'speedUp':
            message = `${playerName} gained Speed Boost!<br>Paddle moves 38% faster`;
            bgColor = '#00aa00';
            break;
        case 'slowDown':
            message = `${playerName} used Slow Down!<br>Opponent paddle moves 38% slower`;
            bgColor = '#cc0000';
            break;
        case 'growPaddle':
            message = `${playerName} gained Paddle Growth!<br>Paddle is 40% larger`;
            bgColor = '#0066cc';
            break;
        case 'shrinkPaddle':
            message = `${playerName} used Shrink Paddle!<br>Opponent paddle is 30% smaller`;
            bgColor = '#cc00cc';
            break;
        case 'fastBall':
            message = `${playerName} activated Fast Ball!<br>Ball speed increased by 30%`;
            bgColor = '#cccc00';
            break;
        case 'multiball':
            message = `${playerName} unleashed Multi Ball!<br>An extra ball appears`;
            bgColor = '#cc6600';
            break;
        case 'fury':
            message = `${playerName} enters FURY MODE!<br>+Size +Speed +Ball Speed`;
            bgColor = '#aa0000';
            break;
        case 'curveShot':
            message = `${playerName} activated Curve Shot!<br>Ball curves dynamically`;
            bgColor = '#dd8800'; // Slightly darker orange for notification
            break;
    }
    
    showNotification(message, bgColor, '30%');
}

// Show notification about a new hazard
export function showHazardNotification(type) {
    let message, bgColor;
    
    switch(type) {        case 'blackHole':
            message = 'BLACK HOLE!<br>The ball is being pulled toward the center';
            bgColor = 'rgba(75, 0, 130, 0.9)';
            break;        case 'whiteHole':
            message = 'WHITE HOLE!<br>The ball is being pushed away';
            bgColor = 'rgba(0, 200, 200, 0.9)';
            break;
        case 'windZone':
            message = 'WIND ZONE!<br>The ball is blown in a random direction';
            bgColor = 'rgba(100, 100, 255, 0.9)';
            break;
        case 'barrier':
            message = 'MOVING BARRIER!<br>The ball will bounce off this obstacle';
            bgColor = 'rgba(220, 20, 60, 0.9)';
            break;
        case 'portal':
            message = 'PORTALS!<br>Teleport between linked portals';
            bgColor = 'rgba(255, 140, 0, 0.9)';
            break;
    }
    
    showNotification(message, bgColor, '20%');
}

// Create a power-up effect indicator in the UI
export function createEffectIndicator(type, player, effectId) {
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const effectsEl = player === 'player1' ? player1EffectsEl : player2EffectsEl;
    
    const effectDiv = document.createElement('div');
    effectDiv.className = 'effect-indicator';
    effectDiv.id = effectId;
    
    switch(type) {
        case 'speedUp':
            effectDiv.textContent = '+SPD';
            effectDiv.style.backgroundColor = '#00ff00';
            effectDiv.title = 'Speed Boost: Your paddle moves 38% faster';
            break;
        case 'slowDown':
            effectDiv.textContent = '-SPD';
            effectDiv.style.backgroundColor = '#ff0000';
            effectDiv.title = 'Slow Opponent: Opponent paddle moves 38% slower';
            break;
        case 'growPaddle':
            effectDiv.textContent = '+PAD';
            effectDiv.style.backgroundColor = '#0088ff';
            effectDiv.title = 'Paddle Growth: Your paddle is 40% larger';
            break;
        case 'shrinkPaddle':
            effectDiv.textContent = '-PAD';
            effectDiv.style.backgroundColor = '#ff00ff';
            effectDiv.title = 'Shrink Opponent: Opponent paddle is 30% smaller';
            break;
        case 'fastBall':
            effectDiv.textContent = '+BALL';
            effectDiv.style.backgroundColor = '#ffff00';
            effectDiv.title = 'Fast Ball: Ball speed increased by 30%';
            break;
        case 'multiball':
            effectDiv.textContent = 'MULTI';
            effectDiv.style.backgroundColor = '#ff8800';
            effectDiv.title = 'Multi Ball: Adds an extra ball to the game';
            break;
        case 'fury':
            effectDiv.textContent = 'FURY';
            effectDiv.style.backgroundColor = '#ff1111';
            effectDiv.title = 'Fury Mode: Paddle size +30%, speed +50%, ball speed +40%';
            break;
    }
    
    effectsEl.appendChild(effectDiv);
    
    // Add duration counter
    const durationIndicator = document.createElement('span');
    durationIndicator.className = 'duration-indicator';
    effectDiv.appendChild(durationIndicator);
    
    // Update duration counter
    let timeLeft = POWERUP_DURATION;
    const durationInterval = setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft <= 0) {
            clearInterval(durationInterval);
        } else {
            const seconds = Math.ceil(timeLeft / 1000);
            durationIndicator.textContent = ` ${seconds}s`;
        }
    }, 1000);
    
    return {
        element: effectDiv,
        interval: durationInterval
    };
}

// Draw countdown above the ball
export function drawBallCountdown(ball, ballFreezeUntil) {
    const timeRemaining = Math.ceil((ballFreezeUntil - Date.now()) / 1000);
    if (timeRemaining <= 0) return;

    // Save the current canvas state
    ctx.save();

    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw shadow first
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(timeRemaining, ball.x + 2, ball.y - 30 + 2);

    // Draw the number with a slight glow effect
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(150, 200, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(timeRemaining, ball.x, ball.y - 30);

    // Restore the canvas state to avoid affecting other drawings
    ctx.restore();
}

// Pause overlay functions
export function showPauseOverlay() {
    // Create the pause overlay if it doesn't exist
    let pauseOverlay = document.getElementById('pauseOverlay');
    
    if (!pauseOverlay) {
        pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.className = 'pause-overlay';
        
        const pauseContent = document.createElement('div');
        pauseContent.className = 'pause-content';
        
        // Create pause text
        const pauseTitle = document.createElement('h2');
        pauseTitle.textContent = 'GAME PAUSED';
        
        // Create instructions
        const pauseInstructions = document.createElement('p');
        pauseInstructions.textContent = 'Press P or ESC to resume';
        
        // Add elements to the pause content
        pauseContent.appendChild(pauseTitle);
        pauseContent.appendChild(pauseInstructions);
        pauseOverlay.appendChild(pauseContent);
        
        // Add to body
        document.body.appendChild(pauseOverlay);
    } else {
        pauseOverlay.style.display = 'flex';
    }
}

export function hidePauseOverlay() {
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.style.display = 'none';
    }
}
