export enum GameMode {
  NORMAL,
  TELLURIC_RESONANCE,
  ENDLESS,
  AETHER_OVERLOAD,
  OBSIDIAN_SCRUBBER,
  PHASE_SHIFT,
}


export enum EntityType {
  PLAYER,
  BOSS,
  BULLET_PLAYER,
  BULLET_ENEMY,
  ITEM_POWER,
  ITEM_POINT,
  ITEM_LIFE,
  ITEM_BIOCHAR
}


export interface Entity {
  id: number;
  active: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  color: string;
  type: EntityType;
  rotation?: number;
  grazed?: boolean;
  scale?: number;
  homing?: boolean;
}


export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  focus: boolean;
  shoot: boolean;
  bomb: boolean;
}


export interface GameStats {
  score: number;
  lives: number;
  bombs: number;
  power: number;
  graze: number;
  bossHealth: number;
  bossPhase: number;
  fps: number;
  hiscore: number;
  pressure?: number;
  topography?: number;
}
export interface PatternConfig {
  count: number;
  speed: number;
  spread: number;
  rotationSpeed: number;
  color: string;
  type: 'FAN' | 'SPIRAL' | 'AIMED' | 'BURST';
}