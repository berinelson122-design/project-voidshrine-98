import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import {
  PALETTE, SCREEN_WIDTH, SCREEN_HEIGHT, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT, PLAY_AREA_X, PLAY_AREA_Y,
  MAX_BULLETS, MAX_ITEMS, MAX_PARTICLES, PLAYER_SPEED, PLAYER_FOCUS_SPEED,
  PLAYER_HITBOX_RADIUS, PLAYER_GRAZE_RADIUS, PLAYER_COLLECT_RADIUS, BOSS_MAX_HEALTH, BOSS_PHASE_HEALTH, BOSS_TOTAL_PHASES
} from '../constants';
import { Entity, EntityType, InputState, GameStats } from '../types';
import { audioSynth } from '../services/AudioSynth';

// --- OPTIMIZED POOLS (Defined outside component) ---
class EntityPool {
  pool: Entity[];
  constructor(size: number, defaultType: EntityType) {
    this.pool = new Array(size).fill(null).map((_, i) => ({
      id: i, active: false, x: 0, y: 0, dx: 0, dy: 0, width: 0, height: 0, color: '#fff', type: defaultType
    }));
  }
  spawn(x: number, y: number, dx: number, dy: number, color: string, w: number, h: number) {
    const e = this.pool.find(i => !i.active);
    if (e) {
      e.active = true; e.x = x; e.y = y; e.dx = dx; e.dy = dy; e.color = color; e.width = w; e.height = h; e.grazed = false;
      e.rotation = Math.atan2(dy, dx);
    }
  }
  clear() { this.pool.forEach(e => e.active = false); }
}

const bulletPool = new EntityPool(MAX_BULLETS, EntityType.BULLET_ENEMY);
const itemPool = new EntityPool(MAX_ITEMS, EntityType.ITEM_POWER);
const particlePool = new EntityPool(MAX_PARTICLES, EntityType.ITEM_POINT); // Reusing Entity interface for particles

export const GameCanvas: React.FC<{ 
    customAudioSrc: string | null; 
    setStats: (s: GameStats) => void; 
    onGameOver: () => void;
    isPaused: boolean;
}> = ({ customAudioSrc, setStats, onGameOver, isPaused }) => {
    
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for speed)
  const player = useRef<Entity>({ id: -1, active: true, type: EntityType.PLAYER, x: 320, y: 400, dx: 0, dy: 0, width: 0, height: 0, color: PALETTE.PLAYER_CORE });
  const boss = useRef({ active: true, x: 320, y: 100, health: BOSS_MAX_HEALTH, phase: 0, timer: 0 });
  const bomb = useRef({ active: false, radius: 0, timer: 0 });
  const shake = useRef(0);
  const invuln = useRef(0);
  const bgScroll = useRef(0);
  
  const stats = useRef<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0 });
  const input = useRef<InputState>({ up: false, down: false, left: false, right: false, focus: false, shoot: false, bomb: false });
  const touchState = useRef({ up: false, down: false, left: false, right: false, shoot: false, bomb: false, focus: false });

  // Input Listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      switch(e.code) {
        case 'ArrowUp': input.current.up = isDown; break;
        case 'ArrowDown': input.current.down = isDown; break;
        case 'ArrowLeft': input.current.left = isDown; break;
        case 'ArrowRight': input.current.right = isDown; break;
        case 'ShiftLeft': input.current.focus = isDown; break;
        case 'KeyZ': input.current.shoot = isDown; break;
        case 'KeyX': input.current.bomb = isDown; break;
      }
    };
    window.addEventListener('keydown', e => handleKey(e, true));
    window.addEventListener('keyup', e => handleKey(e, false));
    
    // Reset game state on mount
    bulletPool.clear(); itemPool.clear(); particlePool.clear();
    player.current.active = true;
    
    return () => { window.removeEventListener('keydown', e => handleKey(e, true)); window.removeEventListener('keyup', e => handleKey(e, false)); };
  }, []);

  // --- GAMEPLAY LOGIC ---

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3;
          particlePool.spawn(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 2, 2);
      }
  };

  const firePlayer = () => {
      audioSynth.playShoot();
      // Power Level Logic (1 to 5 streams)
      const level = Math.min(5, Math.floor(stats.current.power / 20) + 1);
      const focus = input.current.focus || touchState.current.focus;
      
      bulletPool.spawn(player.current.x, player.current.y - 10, 0, -15, PALETTE.BULLET_PLAYER, 6, 12);
      
      if (level >= 2) {
          bulletPool.spawn(player.current.x - 10, player.current.y, focus ? -1 : -4, -12, PALETTE.BULLET_PLAYER, 4, 10);
          bulletPool.spawn(player.current.x + 10, player.current.y, focus ? 1 : 4, -12, PALETTE.BULLET_PLAYER, 4, 10);
      }
      if (level >= 3) {
          bulletPool.spawn(player.current.x - 20, player.current.y + 5, focus ? -2 : -6, -10, PALETTE.BULLET_PLAYER, 4, 10);
          bulletPool.spawn(player.current.x + 20, player.current.y + 5, focus ? 2 : 6, -10, PALETTE.BULLET_PLAYER, 4, 10);
      }
  };

  const useBomb = () => {
      if (stats.current.bombs > 0 && !bomb.current.active) {
          stats.current.bombs--;
          bomb.current.active = true;
          bomb.current.timer = 120;
          bomb.current.radius = 10;
          shake.current = 20;
          audioSynth.playBomb();
          // Convert bullets to points
          bulletPool.pool.forEach(b => {
              if (b.active && b.type === EntityType.BULLET_ENEMY) {
                  b.active = false;
                  itemPool.spawn(b.x, b.y, 0, 2, PALETTE.ITEM_POINT, 8, 8);
              }
          });
      }
  };

  const update = (dt: number) => {
      if (isPaused || !player.current.active) return;
      
      // 1. Player Movement
      const inputs = {
          u: input.current.up || touchState.current.up,
          d: input.current.down || touchState.current.down,
          l: input.current.left || touchState.current.left,
          r: input.current.right || touchState.current.right,
          s: input.current.shoot || touchState.current.shoot,
          b: input.current.bomb || touchState.current.bomb,
          f: input.current.focus || touchState.current.focus
      };

      const spd = inputs.f ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
      if (inputs.u) player.current.y -= spd;
      if (inputs.d) player.current.y += spd;
      if (inputs.l) player.current.x -= spd;
      if (inputs.r) player.current.x += spd;

      // Bounds
      player.current.x = Math.max(PLAY_AREA_X+5, Math.min(PLAY_AREA_X + PLAY_AREA_WIDTH-5, player.current.x));
      player.current.y = Math.max(PLAY_AREA_Y+5, Math.min(PLAY_AREA_Y + PLAY_AREA_HEIGHT-5, player.current.y));

      // Actions
      if (inputs.s && Date.now() % 4 === 0) firePlayer(); // Simple throttle
      if (inputs.b) useBomb();

      // 2. Boss Logic
      boss.current.timer++;
      boss.current.x = (PLAY_AREA_X + PLAY_AREA_WIDTH/2) + Math.sin(boss.current.timer * 0.02) * 50;
      
      // Patterns
      if (boss.current.active && boss.current.timer % 5 === 0) {
          const phase = boss.current.phase;
          // Phase 1: Radial
          if (phase === 0) {
              const angle = boss.current.timer * 0.1;
              bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(angle)*3, Math.sin(angle)*3, PALETTE.BULLET_ENEMY, 8, 8);
              bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(angle+Math.PI)*3, Math.sin(angle+Math.PI)*3, PALETTE.BULLET_ENEMY, 8, 8);
          }
          // Phase 2: Aimed Stream + Random
          else if (phase === 1) {
              const aimAngle = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
              bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aimAngle)*5, Math.sin(aimAngle)*5, PALETTE.BULLET_ENEMY, 10, 10);
              if (Math.random() > 0.5) {
                   bulletPool.spawn(boss.current.x, boss.current.y, (Math.random()-0.5)*4, 3, '#FF00FF', 6, 6);
              }
          }
      }

      // 3. Bullet Updates & Collision
      bulletPool.pool.forEach(b => {
          if (!b.active) return;
          b.x += b.dx;
          b.y += b.dy;
          
          // Screen Bounds
          if (b.x < PLAY_AREA_X-20 || b.x > PLAY_AREA_X+PLAY_AREA_WIDTH+20 || b.y < PLAY_AREA_Y-20 || b.y > PLAY_AREA_Y+PLAY_AREA_HEIGHT+20) {
              b.active = false;
          }

          // Player Hit Logic
          if (b.type === EntityType.BULLET_ENEMY && player.current.active && invuln.current <= 0 && !bomb.current.active) {
              const dx = b.x - player.current.x;
              const dy = b.y - player.current.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist < PLAYER_HITBOX_RADIUS + 2) {
                  // HIT
                  b.active = false;
                  stats.current.lives--;
                  shake.current = 20;
                  invuln.current = 120;
                  audioSynth.playHit();
                  bulletPool.pool.forEach(eb => { if(eb.type === EntityType.BULLET_ENEMY) eb.active = false; }); // Clear screen
                  if (stats.current.lives < 0) onGameOver();
              } else if (dist < PLAYER_GRAZE_RADIUS && !b.grazed) {
                  // GRAZE
                  b.grazed = true;
                  stats.current.graze++;
                  stats.current.score += 500;
                  audioSynth.playGraze();
                  spawnParticles(b.x, b.y, '#fff', 1);
              }
          }
      });

      // 4. Item Updates
      itemPool.pool.forEach(i => {
          if (!i.active) return;
          i.y += 3; // Gravity fall
          
          // Collection
          const dx = i.x - player.current.x;
          const dy = i.y - player.current.y;
          if (Math.sqrt(dx*dx + dy*dy) < PLAYER_COLLECT_RADIUS) {
              i.active = false;
              audioSynth.playItem();
              if (i.color === PALETTE.ITEM_POWER) {
                  stats.current.power = Math.min(128, stats.current.power + 1);
                  stats.current.score += 100;
              } else {
                  stats.current.score += 5000;
              }
          }
          if (i.y > SCREEN_HEIGHT) i.active = false;
      });

      // 5. Boss Hit Logic
      bulletPool.pool.forEach(b => {
          if (b.active && b.type === EntityType.BULLET_PLAYER) {
              const dx = b.x - boss.current.x;
              const dy = b.y - boss.current.y;
              if (Math.sqrt(dx*dx + dy*dy) < 40) {
                  b.active = false;
                  boss.current.health -= 10;
                  stats.current.score += 10;
                  spawnParticles(b.x, b.y, PALETTE.BOSS_AURA, 1);
                  
                  // Phase Check
                  const hpPerPhase = BOSS_MAX_HEALTH / BOSS_TOTAL_PHASES;
                  const currentPhase = Math.floor((BOSS_MAX_HEALTH - boss.current.health) / hpPerPhase);
                  if (currentPhase > boss.current.phase) {
                      boss.current.phase = currentPhase;
                      bulletPool.pool.forEach(eb => { if(eb.type === EntityType.BULLET_ENEMY) eb.active = false; });
                      shake.current = 15;
                      for(let k=0; k<10; k++) itemPool.spawn(boss.current.x, boss.current.y, 0, 0, PALETTE.ITEM_POWER, 8, 8);
                  }
              }
          }
      });

      // Globals
      if (shake.current > 0) shake.current *= 0.9;
      if (invuln.current > 0) invuln.current--;
      if (bomb.current.active) {
          bomb.current.timer--;
          bomb.current.radius += 10;
          if (bomb.current.timer <= 0) bomb.current.active = false;
          // Bomb Clear Logic
          bulletPool.pool.forEach(b => {
              if (b.active && b.type === EntityType.BULLET_ENEMY) {
                  const dx = b.x - player.current.x;
                  const dy = b.y - player.current.y;
                  if (Math.sqrt(dx*dx + dy*dy) < bomb.current.radius) {
                      b.active = false;
                      spawnParticles(b.x, b.y, b.color, 2);
                      itemPool.spawn(b.x, b.y, 0, 0, PALETTE.ITEM_POINT, 8, 8);
                  }
              }
          });
      }

      // Sync Stats
      stats.current.bossHealth = boss.current.health;
      stats.current.bossPhase = boss.current.phase;
      if (Date.now() % 10 === 0) setStats({...stats.current});
  };

  const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      // Clear & Shake
      const sx = (Math.random()-0.5) * shake.current;
      const sy = (Math.random()-0.5) * shake.current;
      ctx.save();
      ctx.translate(sx, sy);
      
      // BG
      ctx.fillStyle = PALETTE.BG_VOID;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      
      // Grid
      bgScroll.current = (bgScroll.current + 2) % 40;
      ctx.strokeStyle = PALETTE.BG_GRID;
      ctx.lineWidth = 2;
      for (let y = bgScroll.current; y < SCREEN_HEIGHT; y += 40) {
          ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, y); ctx.lineTo(PLAY_AREA_X + PLAY_AREA_WIDTH, y); ctx.stroke();
      }
      // Play Area Border
      ctx.strokeRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

      // Player
      if (player.current.active) {
          if (Math.floor(invuln.current / 4) % 2 === 0) {
            ctx.fillStyle = PALETTE.PLAYER_AURA;
            ctx.fillRect(player.current.x - 10, player.current.y - 10, 20, 20);
            ctx.fillStyle = PALETTE.PLAYER_CORE;
            ctx.fillRect(player.current.x - 5, player.current.y - 5, 10, 10);
            
            if (input.current.focus || touchState.current.focus) {
                ctx.fillStyle = PALETTE.PLAYER_HITBOX;
                ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS, 0, Math.PI*2); ctx.fill();
            }
          }
      }

      // Bomb
      if (bomb.current.active) {
          ctx.fillStyle = `rgba(255, 255, 255, ${bomb.current.timer / 120})`;
          ctx.beginPath(); ctx.arc(player.current.x, player.current.y, bomb.current.radius, 0, Math.PI*2); ctx.fill();
      }

      // Boss
      if (boss.current.active) {
          ctx.fillStyle = PALETTE.BOSS;
          ctx.beginPath(); ctx.arc(boss.current.x, boss.current.y, 30, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = PALETTE.BOSS_AURA;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(boss.current.x, boss.current.y, 40 + Math.sin(Date.now()*0.01)*5, 0, Math.PI*2); ctx.stroke();
      }

      // Pools
      [bulletPool, itemPool, particlePool].forEach(pool => {
          pool.pool.forEach(e => {
              if (e.active) {
                  ctx.fillStyle = e.color;
                  if (pool === itemPool) ctx.fillRect(e.x - 4, e.y - 4, 8, 8);
                  else if (pool === particlePool) ctx.fillRect(e.x, e.y, 2, 2);
                  else { // Bullet
                      ctx.beginPath(); ctx.arc(e.x, e.y, e.width/2, 0, Math.PI*2); ctx.fill();
                      ctx.fillStyle = '#fff'; ctx.fillRect(e.x-1, e.y-1, 2, 2);
                  }
              }
          });
      });

      ctx.restore();
  };

  useGameLoop((dt) => { update(dt); draw(); }, !isPaused);

  return <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} className="w-full h-full object-contain" />;
};