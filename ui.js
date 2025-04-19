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
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '5%';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.zIndex = '9999';
        container.style.width = '100%';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'game-notification-modern';
    notification.innerHTML = message;
    notification.style.background = bgColor || 'rgba(40, 60, 120, 0.7)';
    notification.style.marginTop = '0px';
    notification.style.marginBottom = '0px';
    notification.style.transition = 'opacity 0.5s cubic-bezier(.4,2,.6,1), transform 0.5s cubic-bezier(.4,2,.6,1), margin 0.4s cubic-bezier(.4,2,.6,1)';

    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
        notification.style.marginTop = '10px';
        notification.style.marginBottom = '10px';
    }, 10);

    // FLIP animation for stack when removing
    function animateStackOnRemove(removed) {
        const notifs = Array.from(container.children);
        // Record first positions
        const firstRects = notifs.map(n => n.getBoundingClientRect());
        // Remove the notification
        removed.remove();
        // Record last positions
        const lastRects = Array.from(container.children).map(n => n.getBoundingClientRect());
        // Invert and play
        Array.from(container.children).forEach((n, i) => {
            const dy = firstRects[i+1] ? firstRects[i+1].top - lastRects[i].top : 0;
            if (dy) {
                n.style.transition = 'none';
                n.style.transform = `translateY(${dy}px)`;
                // Force reflow
                n.getBoundingClientRect();
                n.style.transition = 'transform 0.5s cubic-bezier(.4,2,.6,1)';
                n.style.transform = '';
            }
        });
    }

    // Animate out and remove
    setTimeout(() => {
        notification.classList.remove('show');
        notification.style.marginTop = '0px';
        notification.style.marginBottom = '0px';
        setTimeout(() => {
            animateStackOnRemove(notification);
            // Remove container if empty
            if (container.childElementCount === 0) {
                container.remove();
            }
        }, 600);
    }, duration);

    return notification;
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
    let pauseIndicator = document.querySelector('.pause-indicator');
    
    if (!pauseOverlay) {
        // Create background overlay
        pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.className = 'pause-overlay';
        document.body.appendChild(pauseOverlay);
    }
    
    if (!pauseIndicator) {
        // Create pause indicator
        pauseIndicator = document.createElement('div');
        pauseIndicator.className = 'pause-indicator';
        
        // Create pause text with icon
        const pauseTitle = document.createElement('h2');
        pauseTitle.innerHTML = '<span>⏸️</span><span>PAUSED</span>';
        
        // Create minimal instructions
        const pauseInstructions = document.createElement('p');
        pauseInstructions.textContent = 'P/ESC';
        
        // Add elements to the indicator
        pauseIndicator.appendChild(pauseTitle);
        pauseIndicator.appendChild(pauseInstructions);
        document.body.appendChild(pauseIndicator);
    }
    
    pauseOverlay.style.display = 'block';
    pauseIndicator.style.display = 'block';
}

export function hidePauseOverlay() {
    const pauseOverlay = document.getElementById('pauseOverlay');
    const pauseIndicator = document.querySelector('.pause-indicator');
    if (pauseOverlay) {
        pauseOverlay.style.display = 'none';
    }
    if (pauseIndicator) {
        pauseIndicator.style.display = 'none';
    }
}
