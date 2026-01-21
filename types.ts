export enum EntityType {
  PLAYER,
  BOSS,
  BULLET_PLAYER,
  BULLET_ENEMY,
  ITEM_POWER,
  ITEM_POINT
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
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  focus: boolean; // Shift
  shoot: boolean; // Z
  bomb: boolean;  // X
}

export interface GameStats {
  score: number;
  lives: number;
  bombs: number;
  power: number; // 0 to 128 (Max Power)
  graze: number;
  bossHealth: number;
  bossPhase: number;
}