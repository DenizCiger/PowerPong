// Audio context for sound effects
let audioContext;

try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
    console.warn('Web Audio API not supported');
}

// Create a combo sound with increasing pitch and complexity
function createComboSound(milestone) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;
      // More dynamic sound based on combo level
    if (milestone >= 100) {
        // Create a more complex sound for incredible combos
        oscillator.type = 'square';
        const mod = audioContext.createOscillator();
        const modGain = audioContext.createGain();
        mod.type = 'sine';
        mod.frequency.setValueAtTime(10, now); // Fast modulation
        modGain.gain.setValueAtTime(100, now);
        mod.connect(modGain);
        modGain.connect(oscillator.frequency);
        mod.start(now);
        mod.stop(now + 0.3);
        oscillator.frequency.setValueAtTime(440 * Math.pow(1.2, Math.min(milestone/20, 12)), now);
    } else if (milestone >= 50) {
        // Rich harmonics for high combos
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(330 * Math.pow(1.3, Math.min(milestone/15, 8)), now);
    } else if (milestone >= 25) {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(275 * Math.pow(1.4, Math.min(milestone/10, 6)), now);
    } else if (milestone >= 10) {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220 * Math.pow(1.5, Math.min(milestone/5, 4)), now);
    } else {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220 * Math.pow(1.5, milestone/5), now);
    }
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
}

export function playComboSound(milestone) {
    createComboSound(milestone);
}
