// Game constants
export const PADDLE_HEIGHT = 100;
export const PADDLE_WIDTH = 15;
export const PADDLE_MARGIN = 30;
export const BALL_RADIUS = 8;
export const BALL_SPEED = 8; // Higher base speed for more excitement
export const PADDLE_SPEED = 10; // Faster paddle movement for better control at high speeds
export const POWERUP_SIZE = 30;
export const POWERUP_SPAWN_CHANCE = 0.008; // Increased chance for more action
export const POWERUP_MAX = 4; // Allow more power-ups at once
export const POWERUP_DESPAWN_TIME = 10000; // Power-ups despawn after 7 seconds if not collected

// Playground mode constants
export const PLAYGROUND_MAX_POWERUPS = 5; // Maximum powerups in playground mode
export const PLAYGROUND_MAX_HAZARDS = 50;  // Maximum hazards in playground mode
export const PLAYGROUND_SPAWN_CHANCE = 0.015; // Increased spawn chance for testing

// Rest of the constants
export const POWERUP_DURATION = 7000; // 7 seconds
export const POWERUP_PARTICLE_COUNT = 8; // Particles created when powerup is collected
export const BALL_ACCELERATION = 0.5; // Ball gets faster with each paddle hit
export const MAX_BALL_SPEED = 100; // Maximum ball speed cap
export const SCREEN_SHAKE_DURATION = 150; // How long the screen shakes in ms
export const SCREEN_SHAKE_INTENSITY = 10; // How much the screen shakes
export const HAZARD_SPAWN_RATE = 0.003; // Chance per frame of spawning a hazard
export const HAZARD_MAX = 10; // Maximum number of hazards at once
export const HAZARD_DURATION = 10000; // How long hazards last (10 seconds)
export const GRAVITY_STRENGTH = 0.8; // How strongly black holes pull
export const WIND_STRENGTH = 0.5; // How strongly wind affects the ball
export const VORTEX_RADIUS = 35; // Size of gravity/vortex hazards
export const BARRIER_WIDTH = 18; // Slightly wider
export const BARRIER_HEIGHT = 75; // Slightly shorter
export const BARRIER_SEGMENTS = 3; // Number of segments in the new barrier design
export const BARRIER_SEGMENT_GAP = 2; // Gap between segments
// Adjust trail length to be more responsive to speed
export const TRAIL_LENGTH = 20; // Increased from 10 to allow for longer trails at high speeds
export const SCORE_ANIMATION_DURATION = 1000; // Duration of score animation in ms

// Barrier color schemes
export const BARRIER_COLORS = {
    healthy: {
        primary: '#3498db',    // Blue
        secondary: '#2980b9',  // Darker blue
        glow: 'rgba(52, 152, 219, 0.7)'
    },
    damaged: {
        primary: '#e67e22',    // Orange
        secondary: '#d35400',  // Darker orange
        glow: 'rgba(230, 126, 34, 0.7)'
    },
    critical: {
        primary: '#e74c3c',    // Red
        secondary: '#c0392b',  // Darker red
        glow: 'rgba(231, 76, 60, 0.8)'
    }
};

// Power-ups configuration with enhanced visual details
export const powerUpTypes = [
    { 
        type: 'speedUp', 
        color: '#00ff00', 
        effect: '+SPD', 
        description: 'Paddle Speed +',
        shape: 'triangle',     // Triangle indicates higher speed
        glowColor: 'rgba(0, 255, 0, 0.7)',
        icon: '↑',             // Up arrow icon
        particles: {
            color: 'rgba(0, 255, 50, 0.9)',
            count: 12,
            speedMax: 3
        }
    },
    { 
        type: 'slowDown', 
        color: '#ff0000', 
        effect: '-SPD', 
        description: 'Opponent Speed -',
        shape: 'triangle-down', // Inverted triangle for slowing down
        glowColor: 'rgba(255, 0, 0, 0.7)',
        icon: '↓',             // Down arrow icon
        particles: {
            color: 'rgba(255, 50, 0, 0.9)',
            count: 12,
            speedMax: 2.5
        }
    },
    { 
        type: 'growPaddle', 
        color: '#0088ff', 
        effect: '+PAD', 
        description: 'Paddle Size +',
        shape: 'rectangle',    // Rectangle resembles paddles
        glowColor: 'rgba(0, 136, 255, 0.7)',
        icon: '⬌',             // Horizontal expand icon
        particles: {
            color: 'rgba(0, 136, 255, 0.9)',
            count: 10,
            speedMax: 2.5
        }
    },
    { 
        type: 'shrinkPaddle', 
        color: '#ff00ff', 
        effect: '-PAD', 
        description: 'Opponent Size -',
        shape: 'diamond',      // Diamond shape for shrinking
        glowColor: 'rgba(255, 0, 255, 0.7)',
        icon: '⬍',             // Shrink icon
        particles: {
            color: 'rgba(255, 0, 255, 0.9)',
            count: 10,
            speedMax: 2.5
        }
    },
    { 
        type: 'fastBall', 
        color: '#ffff00', 
        effect: '+BALL', 
        description: 'Ball Speed +',
        shape: 'circle',       // Circle like the ball
        glowColor: 'rgba(255, 255, 0, 0.7)',
        icon: '⚡',             // Lightning bolt icon
        particles: {
            color: 'rgba(255, 255, 0, 0.9)',
            count: 14,
            speedMax: 4
        }
    },
    { 
        type: 'multiball', 
        color: '#ff8800', 
        effect: 'MULTI', 
        description: 'Multi Ball',
        shape: 'star',         // Star for special effect
        glowColor: 'rgba(255, 136, 0, 0.7)',
        icon: '+',             // Plus sign
        particles: {
            color: 'rgba(255, 136, 0, 0.9)',
            count: 16,
            speedMax: 3.5
        }
    },
    { 
        type: 'fury', 
        color: '#ff1111', 
        effect: 'FURY', 
        description: 'Fury Mode',
        shape: 'hexagon',      // Hexagon for powerful effect
        glowColor: 'rgba(255, 17, 17, 0.8)',
        icon: '★',             // Star icon
        particles: {
            color: 'rgba(255, 17, 17, 0.9)',
            count: 20,
            speedMax: 5
        }
    },
    { 
        type: 'curveShot', 
        color: '#ff9900', 
        effect: 'CURVE', 
        description: 'Curve Shot: Ball curves dynamically for 5 seconds',
        shape: 'circle',       // Circle shape for simplicity
        glowColor: 'rgba(255, 153, 0, 0.7)',
        icon: '↺',             // Circular arrow icon
        particles: {
            color: 'rgba(255, 153, 0, 0.9)',
            count: 12,
            speedMax: 3
        }
    }
];

// Hazard types
export const hazardTypes = [    { 
        type: 'blackHole', 
        color: 'rgba(75, 0, 130, 0.7)',
        effect: 'GRAVITY',
        duration: HAZARD_DURATION
    },    { 
        type: 'whiteHole', 
        color: 'rgba(0, 255, 255, 0.7)',
        effect: 'REPEL',
        duration: HAZARD_DURATION
    },
    { 
        type: 'windZone', 
        color: 'rgba(200, 200, 255, 0.5)',
        effect: 'WIND',
        duration: HAZARD_DURATION,
        direction: { x: 0, y: 0 } // Will be set when created
    },
    { 
        type: 'barrier', 
        color: 'rgba(52, 152, 219, 0.8)',
        effect: 'BARRIER',
        duration: HAZARD_DURATION,
        hitPoints: 3  // Barrier can take 3 hits before disappearing
    },
    { 
        type: 'portal', 
        color: 'rgba(255, 140, 0, 0.8)',
        effect: 'PORTAL',
        duration: HAZARD_DURATION,
        linkedPortal: null
    }
];
