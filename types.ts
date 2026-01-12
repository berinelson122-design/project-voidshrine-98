export enum EntityType {
  PLAYER,
  ENEMY,
  BULLET_PLAYER,
  BULLET_ENEMY,
  ITEM_POWER,
  ITEM_POINT,
  PARTICLE
}

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  dx: number;
  dy: number;
}

export interface Entity extends Point, Vector {
  id: number;
  active: boolean;
  type: EntityType;
  width: number;
  height: number;
  color: string;
  rotation?: number;
  grazed?: boolean; // For player bullets grazing logic check
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  focus: boolean; // Shift
  shoot: boolean; // Z
  bomb: boolean; // X
}

export interface GameStats {
  score: number;
  lives: number;
  bombs: number;
  power: number; // 0 to 500? Let's say 1 power item = 1, max 100 per level?
  // Let's simplify: Power Level 1-5. Internal counter 0-50.
  graze: number;
  bossHealth: number;
  bossPhase: number;
  fps: number;
}

export enum BossPattern {
  IDLE,
  RADIAL_BURST,
  SPIRAL_STREAM,
  AIMED_SHOT,
  FINAL_BARRAGE
}