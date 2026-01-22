export const PALETTE = {
  BG_VOID: '#000000',
  BG_GRID: '#1a0b2e',
  BG_PLAY_AREA: '#0a0010', // Added missing key
  PLAYER_CORE: '#FFFFFF',
  PLAYER_AURA: '#E056FD',
  PLAYER_HITBOX: '#FF003C',
  BULLET_PLAYER: '#E056FD',
  BULLET_ENEMY: '#FF003C',
  ITEM_POWER: '#FF003C',
  ITEM_POINT: '#00F3FF',
  ITEM_LIFE: '#39FF14', // Added missing key
  BOSS: '#4B0082',
  BOSS_AURA: '#FF003C',
  TEXT_PRIMARY: '#E056FD',
  UI_BORDER: '#333333'
};

export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 480;
export const PLAY_AREA_WIDTH = 384;
export const PLAY_AREA_HEIGHT = 460;
export const PLAY_AREA_X = 32;
export const PLAY_AREA_Y = 10;

// -- NEW EXPORTS --
export const POC_THRESHOLD_Y = PLAY_AREA_Y + 100;
export const DEATHBOMB_WINDOW = 12;
export const SCORE_EXTEND_1 = 10000000;
export const SCORE_EXTEND_2 = 20000000;
export const BOSS_TOTAL_PHASES = 5;

export const MAX_BULLETS = 2500;
export const MAX_PARTICLES = 500;
export const MAX_ITEMS = 100;

export const PLAYER_SPEED = 5.5;
export const PLAYER_FOCUS_SPEED = 2.5;
export const PLAYER_HITBOX_RADIUS = 3;
export const PLAYER_GRAZE_RADIUS = 18;
export const PLAYER_COLLECT_RADIUS = 32;

export const BOSS_PHASE_HEALTH = 4000;
export const BOSS_MAX_HEALTH = BOSS_PHASE_HEALTH * BOSS_TOTAL_PHASES;