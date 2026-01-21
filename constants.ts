/**
 * ARCHITECT: VOID_WEAVER
 * PROTOCOL: LEGACY_COLORS_V2
 */
export const PALETTE = {
  BG_VOID: '#000000',
  BG_PLAY_AREA: '#110022', // The old deep purple
  BG_GRID: '#2a1a4a',
  
  PLAYER_CORE: '#FFFFFF',
  PLAYER_AURA: '#E056FD', // Red-Violet
  PLAYER_HITBOX: '#FF003C', // Cyber Red

  
  BULLET_PLAYER: '#FFFFFF',
  BULLET_ENEMY: '#E056FD', 
  
  ITEM_POWER: '#FF003C',
  ITEM_POINT: '#00F3FF',
  
  BOSS: '#4400CC',
  BOSS_AURA: '#E056FD',
  
  TEXT_PRIMARY: '#E056FD', // Requested Red-Violet
  TEXT_ALERT: '#FF003C',
  UI_BORDER: '#2a1a4a'
};

export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 480;
export const PLAY_AREA_WIDTH = 320;
export const PLAY_AREA_HEIGHT = 460;
export const PLAY_AREA_X = 20; // Shifted left to make room for Widescreen Sidebars
export const PLAY_AREA_Y = 10;

export const MAX_BULLETS = 2000;
export const MAX_PARTICLES = 100;
export const MAX_ITEMS = 100;
export const PLAYER_SPEED = 5.0;
export const PLAYER_FOCUS_SPEED = 2.0;
export const PLAYER_HITBOX_RADIUS = 2.5;
export const PLAYER_GRAZE_RADIUS = 15;
export const PLAYER_COLLECT_RADIUS = 40;
export const BOSS_MAX_HEALTH = 12000;
export const BOSS_PHASE_HEALTH = 4000;
export const BOSS_TOTAL_PHASES = 3;