// Game type definitions for Power Pong
import 'phaser';

// Particle system types
export interface GameParticle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
  color: string;
  life: number;
  type: 'regular' | 'wind' | 'shockwave';
}

export interface WindZoneInfo {
  centerX: number;
  centerY: number;
  halfLength: number;
  halfWidth: number;
  angle: number;
  dirX: number;
  dirY: number;
}

export interface WindParticle extends GameParticle {
  type: 'wind';
  width: number;
  height: number;
  windZoneInfo: WindZoneInfo;
  angle: number;
}

export interface ShockwaveParticle extends GameParticle {
  type: 'shockwave';
  initialRadius: number;
  maxRadius: number;
  currentRadius: number;
  initialLife: number;
  opacity: number;
}

export interface ScoreAnimation {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  maxSize: number;
  opacity: number;
  createdAt: number;
}

export interface PowerUpType {
  type: string;
  color: string;
  effect: string;
  description: string;
  shape: string;
  glowColor: string;
  icon: string;
  particles: {
    color: string;
    count: number;
    speedMax: number;
  };
}

export interface HazardType {
  type: string;
  color: string;
  effect: string;
  duration: number;
  direction?: { x: number; y: number };
  hitPoints?: number;
  linkedPortal?: string | null;
}

export interface CollisionData {
  paddleHit: boolean;
  paddleIndex: number;
  rallyIncrement: number;
}

export interface WallCollisionData {
  wallHit: boolean;
  wall?: 'top' | 'bottom';
}

export interface ScoreData {
  scored: boolean;
  scoringPlayer?: number;
}

export interface ScreenShake {
  x: number;
  y: number;
  timeLeft: number;
}

export interface PowerUpData {
  type: string;
  createdAt: number;
  group?: any; // Phaser.GameObjects.Group - using any to avoid circular dependency
}

export interface HazardData {
  type: string;
  createdAt: number;
  x: number;
  y: number;
  id?: string;
  linkedPortalId?: string;
  hitPoints?: number;
  direction?: { x: number; y: number };
  velocity?: { x: number; y: number };
}

export interface ParticleConfig {
  color: string;
  count: number;
  speedMax: number;
  lifespan?: number;
  scale?: { start: number; end: number };
  alpha?: { start: number; end: number };
}

export interface GameConfig {
  width: number;
  height: number;
  type: number;
  parent: string;
  backgroundColor: string;
  physics: {
    default: string;
    arcade: {
      gravity: { y: number };
      debug: boolean;
      fps: number;
      fixedStep: boolean;
    };
  };
  scene: any[];
  scale: {
    mode: number;
    autoCenter: number;
  };
}
