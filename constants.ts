// VOID WEAVER PALETTE
export const PALETTE = {
  BG_VOID: '#000000',
  BG_GRID: '#1a0b2e', // Deep Violet Black
  
  PLAYER_CORE: '#FFFFFF',
  PLAYER_AURA: '#E056FD', // Neon Violet
  PLAYER_HITBOX: '#FF003C', // Cyber Red
  
  BULLET_PLAYER: '#E056FD',
  BULLET_ENEMY: '#FF003C', 
  BULLET_GRAZE: '#FFFFFF',

  ITEM_POWER: '#FF003C', // Red Box
  ITEM_POINT: '#00F3FF', // Cyan Box
  
  BOSS: '#4B0082', // Indigo
  BOSS_AURA: '#FF003C',
  
  TEXT_PRIMARY: '#E056FD',
  TEXT_ALERT: '#FF003C',
  UI_BORDER: '#333333'
};

// DIMENSIONS (PC-98 Ratio)
export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 480;

export const PLAY_AREA_WIDTH = 384; // The vertical shmup strip
export const PLAY_AREA_HEIGHT = 460;
export const PLAY_AREA_X = 32;
export const PLAY_AREA_Y = 10;

// GAMEPLAY BALANCING
export const MAX_BULLETS = 2500;
export const MAX_PARTICLES = 500;
export const MAX_ITEMS = 100;

export const PLAYER_SPEED = 5.5;
export const PLAYER_FOCUS_SPEED = 2.5;

export const PLAYER_HITBOX_RADIUS = 3;
export const PLAYER_GRAZE_RADIUS = 18;
export const PLAYER_COLLECT_RADIUS = 32;

export const BOSS_PHASE_HEALTH = 4000;
export const BOSS_TOTAL_PHASES = 3;
export const BOSS_MAX_HEALTH = BOSS_PHASE_HEALTH * BOSS_TOTAL_PHASES;