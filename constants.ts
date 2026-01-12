// PC-98 Inspired Palette
export const PALETTE = {
  BG_DARK: '#110022', // Deep purple/black
  BG_GRID: '#2a1a4a',
  PLAYER_MAIN: '#ff0044', // Neon Red
  PLAYER_CORE: '#ffffff',
  BULLET_ENEMY: '#aa00ff', // Bright Purple
  BULLET_ENEMY_CORE: '#ddaaff',
  BULLET_PLAYER: '#ff3333',
  BOSS: '#4400cc',
  ITEM_POWER: '#ff0000', // Red
  ITEM_POINT: '#00ccff', // Blue
  TEXT: '#00ffcc', // Cyber green
  UI_BG: '#1a1a2e',
};

// Dimensions
export const GAME_WIDTH = 480; // Vertical play area
export const GAME_HEIGHT = 640;
export const CANVAS_WIDTH = 640; // Total canvas width (Play area + UI rendered on canvas for perf, or split)
export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 400;

export const PLAY_AREA_WIDTH = 300;
export const PLAY_AREA_HEIGHT = 380;
export const PLAY_AREA_X = (SCREEN_WIDTH - PLAY_AREA_WIDTH) / 2; // Center it
export const PLAY_AREA_Y = 10;

// Logic
export const MAX_BULLETS = 2000;
export const MAX_ITEMS = 200;
export const PLAYER_SPEED = 5;
export const PLAYER_FOCUS_SPEED = 2;
export const PLAYER_HITBOX_RADIUS = 3;
export const PLAYER_GRAZE_RADIUS = 13; // Hitbox (3) + 10 pixels
export const PLAYER_ITEM_COLLECT_RADIUS = 30;

// Boss
export const BOSS_PHASE_HEALTH = 5000;
export const BOSS_TOTAL_PHASES = 3;
export const BOSS_MAX_HEALTH = BOSS_PHASE_HEALTH * BOSS_TOTAL_PHASES;
