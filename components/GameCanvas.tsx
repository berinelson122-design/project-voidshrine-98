import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import {
  PALETTE, SCREEN_WIDTH, SCREEN_HEIGHT, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT,
  PLAY_AREA_X, PLAY_AREA_Y, MAX_BULLETS, MAX_ITEMS, MAX_PARTICLES, 
  PLAYER_SPEED, PLAYER_FOCUS_SPEED, PLAYER_HITBOX_RADIUS, PLAYER_GRAZE_RADIUS, 
  PLAYER_COLLECT_RADIUS, BOSS_MAX_HEALTH, BOSS_PHASE_HEALTH, BOSS_TOTAL_PHASES
} from '../constants';
import { Entity, EntityType, InputState, GameStats } from '../types';
import { audioSynth } from '../services/AudioSynth';

// -- POOLS --
class EntityPool {
  pool: Entity[];
  constructor(size: number, defaultType: EntityType) {
    this.pool = new Array(size).fill(null).map((_, i) => ({
      id: i, active: false, x: 0, y: 0, dx: 0, dy: 0, width: 0, height: 0, color: '#fff', type: defaultType
    }));
  }
  spawn(x: number, y: number, dx: number, dy: number, color: string, w: number, h: number, type: EntityType = EntityType.BULLET_ENEMY) {
    const e = this.pool.find(i => !i.active);
    if (e) {
      e.active = true; e.x = x; e.y = y; e.dx = dx; e.dy = dy; 
      e.color = color; e.width = w; e.height = h; e.grazed = false; e.type = type;
    }
  }
  clear() { this.pool.forEach(e => e.active = false); }
}

const bulletPool = new EntityPool(MAX_BULLETS, EntityType.BULLET_ENEMY);
const itemPool = new EntityPool(MAX_ITEMS, EntityType.ITEM_POWER);
const particlePool = new EntityPool(MAX_PARTICLES, EntityType.ITEM_POINT);

export const GameCanvas: React.FC<{
    customAudioSrc: string | null;
    setStats: (s: GameStats) => void;
    onGameOver: () => void;
    isPaused: boolean;
}> = ({ customAudioSrc, setStats, onGameOver, isPaused }) => {
    
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const player = useRef<Entity>({ id: -1, active: true, type: EntityType.PLAYER, x: 320, y: 400, dx: 0, dy: 0, width: 0, height: 0, color: PALETTE.PLAYER_CORE });
  const boss = useRef({ active: true, x: 320, y: 100, health: BOSS_MAX_HEALTH, phase: 0, timer: 0 });
  const bomb = useRef({ active: false, radius: 0, timer: 0 });
  const shake = useRef(0);
  const invuln = useRef(0);
  const bgScroll = useRef(0);
  
  const stats = useRef<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0 });
  const input = useRef<InputState>({ up: false, down: false, left: false, right: false, focus: false, shoot: false, bomb: false });
  
  // Touch
  const lastTouch = useRef<{x: number, y: number} | null>(null);

  // Audio Init (One-time)
  useEffect(() => {
    const initAudio = () => audioSynth.init();
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    return () => { window.removeEventListener('click', initAudio); window.removeEventListener('touchstart', initAudio); }
  }, []);

  // Keyboard Input
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
    return () => { window.removeEventListener('keydown', e => handleKey(e, true)); window.removeEventListener('keyup', e => handleKey(e, false)); };
  }, []);

  // -- LOGIC --

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3;
        particlePool.spawn(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 2, 2, EntityType.ITEM_POINT);
    }
  };

  const firePlayer = () => {
      audioSynth.playShoot();
      const level = Math.min(5, Math.floor(stats.current.power / 20) + 1);
      const focus = input.current.focus;
      
      bulletPool.spawn(player.current.x, player.current.y - 10, 0, -15, PALETTE.BULLET_PLAYER, 6, 12, EntityType.BULLET_PLAYER);
      
      if (level >= 2) {
          bulletPool.spawn(player.current.x - 10, player.current.y, focus ? -1 : -4, -12, PALETTE.BULLET_PLAYER, 4, 10, EntityType.BULLET_PLAYER);
          bulletPool.spawn(player.current.x + 10, player.current.y, focus ? 1 : 4, -12, PALETTE.BULLET_PLAYER, 4, 10, EntityType.BULLET_PLAYER);
      }
  };

  const update = (dt: number) => {
      if (isPaused || !player.current.active) return;
      
      // Movement
      const spd = input.current.focus ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
      if (input.current.up) player.current.y -= spd;
      if (input.current.down) player.current.y += spd;
      if (input.current.left) player.current.x -= spd;
      if (input.current.right) player.current.x += spd;

      // Clamp
      player.current.x = Math.max(PLAY_AREA_X+10, Math.min(PLAY_AREA_X + PLAY_AREA_WIDTH-10, player.current.x));
      player.current.y = Math.max(PLAY_AREA_Y+10, Math.min(PLAY_AREA_Y + PLAY_AREA_HEIGHT-10, player.current.y));

      // Shoot
      if (input.current.shoot && Date.now() % 5 === 0) firePlayer();

      // Bomb
      if (input.current.bomb && stats.current.bombs > 0 && !bomb.current.active) {
          stats.current.bombs--;
          bomb.current.active = true; bomb.current.timer = 120; bomb.current.radius = 10;
          audioSynth.playBomb();
          shake.current = 20;
      }

      // -- BOSS AI --
      boss.current.timer++;
      boss.current.x = (PLAY_AREA_X + PLAY_AREA_WIDTH/2) + Math.sin(boss.current.timer * 0.02) * 80;

      // Phase Transition
      const currentPhase = Math.floor((BOSS_MAX_HEALTH - boss.current.health) / BOSS_PHASE_HEALTH);
      if (currentPhase > boss.current.phase) {
          boss.current.phase = currentPhase;
          // Clear Bullets
          bulletPool.pool.forEach(b => { 
             if (b.active && b.type === EntityType.BULLET_ENEMY) {
                 b.active = false;
                 spawnParticles(b.x, b.y, b.color, 2);
                 itemPool.spawn(b.x, b.y, 0, 2, PALETTE.ITEM_POINT, 8, 8);
             }
          });
          shake.current = 15;
          for(let k=0; k<10; k++) itemPool.spawn(boss.current.x, boss.current.y, (Math.random()-0.5)*5, -5, PALETTE.ITEM_POWER, 8, 8);
      }

      // Patterns
      if (boss.current.active) {
          const t = boss.current.timer;
          // Phase 0: Spirals
          if (boss.current.phase === 0 && t % 4 === 0) {
             const angle = t * 0.1;
             bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(angle)*3, Math.sin(angle)*3, PALETTE.BULLET_ENEMY, 8, 8);
             bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(angle+Math.PI)*3, Math.sin(angle+Math.PI)*3, PALETTE.BULLET_ENEMY, 8, 8);
          }
          // Phase 1: Aimed + Spread
          else if (boss.current.phase === 1 && t % 20 === 0) {
             const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
             for(let i=-2; i<=2; i++) {
                 bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i*0.2)*4, Math.sin(aim + i*0.2)*4, '#FF00FF', 8, 8);
             }
          }
          // Phase 2: Chaos
          else if (boss.current.phase >= 2 && t % 5 === 0) {
              const randAngle = Math.random() * Math.PI * 2;
              bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(randAngle)*2, Math.sin(randAngle)*2, '#FF0000', 10, 10);
              bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(randAngle+Math.PI)*4, Math.sin(randAngle+Math.PI)*4, '#FFFFFF', 6, 6);
          }
      }

      // Bullets Update & Hit
      bulletPool.pool.forEach(b => {
          if (!b.active) return;
          b.x += b.dx; b.y += b.dy;

          // Bounds
          if (b.x < PLAY_AREA_X-50 || b.x > PLAY_AREA_X+PLAY_AREA_WIDTH+50 || b.y < PLAY_AREA_Y-50 || b.y > PLAY_AREA_Y+PLAY_AREA_HEIGHT+50) b.active = false;

          // Player Hit Logic
          if (b.type === EntityType.BULLET_ENEMY && player.current.active && invuln.current <= 0 && !bomb.current.active) {
             const dist = Math.hypot(b.x - player.current.x, b.y - player.current.y);
             if (dist < PLAYER_HITBOX_RADIUS + 4) {
                 b.active = false;
                 stats.current.lives--;
                 invuln.current = 120;
                 shake.current = 20;
                 audioSynth.playHit();
                 spawnParticles(player.current.x, player.current.y, PALETTE.PLAYER_AURA, 50);
                 if (stats.current.lives < 0) onGameOver();
             } else if (dist < PLAYER_GRAZE_RADIUS && !b.grazed) {
                 b.grazed = true;
                 stats.current.graze++;
                 stats.current.score += 500;
                 audioSynth.playGraze();
             }
          }
          
          // Bomb Clear
          if (bomb.current.active && b.type === EntityType.BULLET_ENEMY) {
              const dist = Math.hypot(b.x - player.current.x, b.y - player.current.y);
              if (dist < bomb.current.radius) {
                  b.active = false;
                  spawnParticles(b.x, b.y, b.color, 2);
                  itemPool.spawn(b.x, b.y, 0, -2, PALETTE.ITEM_POINT, 6, 6);
              }
          }
      });
      
      // Boss Damage Logic
      bulletPool.pool.forEach(b => {
          if (b.active && b.type === EntityType.BULLET_PLAYER) {
             const dist = Math.hypot(b.x - boss.current.x, b.y - boss.current.y);
             if (dist < 30) {
                 b.active = false;
                 boss.current.health -= 10;
                 stats.current.score += 10;
                 if (Math.random() < 0.05) spawnParticles(b.x, b.y, PALETTE.BOSS_AURA, 2);
                 
                 // Win State
                 if (boss.current.health <= 0) {
                     boss.current.health = BOSS_MAX_HEALTH;
                     stats.current.score += 100000;
                     shake.current = 30;
                     // Reset bullets
                     bulletPool.pool.forEach(eb => { if(eb.type === EntityType.BULLET_ENEMY) eb.active = false; });
                 }
             }
          }
      });
      
      // Item Update
      itemPool.pool.forEach(i => {
         if(!i.active) return;
         i.y += 2; // Fall
         const dist = Math.hypot(i.x - player.current.x, i.y - player.current.y);
         if (dist < PLAYER_COLLECT_RADIUS) {
             i.active = false;
             audioSynth.playItem();
             if (i.type === EntityType.ITEM_POWER) {
                 stats.current.power = Math.min(128, stats.current.power + 1);
                 stats.current.score += 100;
             } else {
                 stats.current.score += 5000;
             }
         }
         if (i.y > SCREEN_HEIGHT) i.active = false;
      });

      // Update Globals
      if (shake.current > 0) shake.current *= 0.9;
      if (invuln.current > 0) invuln.current--;
      if (bomb.current.active) {
          bomb.current.timer--;
          bomb.current.radius += 10;
          if (bomb.current.timer <= 0) bomb.current.active = false;
      }
      
      bgScroll.current = (bgScroll.current + 2) % 40;
      
      // Sync UI
      if (Date.now() % 10 === 0) setStats({...stats.current, bossHealth: boss.current.health, bossPhase: boss.current.phase});
  };

  const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      
      // Shake
      ctx.save();
      ctx.translate((Math.random()-0.5)*shake.current, (Math.random()-0.5)*shake.current);

      // BG
      ctx.fillStyle = PALETTE.BG_VOID; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = PALETTE.BG_PLAY_AREA; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);
      
      // Grid
      ctx.strokeStyle = PALETTE.BG_GRID; ctx.lineWidth = 1;
      for (let y = bgScroll.current; y < SCREEN_HEIGHT; y+=40) {
          ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, y); ctx.lineTo(PLAY_AREA_X+PLAY_AREA_WIDTH, y); ctx.stroke();
      }
      ctx.strokeStyle = PALETTE.UI_BORDER; ctx.lineWidth = 2; ctx.strokeRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

      // Boss Health Bar
      const hpPct = (boss.current.health % BOSS_PHASE_HEALTH) / BOSS_PHASE_HEALTH;
      const barColor = boss.current.phase === 0 ? '#00FF00' : boss.current.phase === 1 ? '#FFFF00' : '#FF0000';
      ctx.fillStyle = '#330000'; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, 5);
      ctx.fillStyle = barColor; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH * hpPct, 5);

      // Player
      if (player.current.active && (invuln.current % 4 < 2)) {
          ctx.fillStyle = PALETTE.PLAYER_AURA; ctx.beginPath(); ctx.arc(player.current.x, player.current.y, 8, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = PALETTE.PLAYER_CORE; ctx.fillRect(player.current.x - 2, player.current.y - 2, 4, 4);
          if (input.current.focus) {
              ctx.fillStyle = PALETTE.PLAYER_HITBOX; ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS, 0, Math.PI*2); ctx.fill();
          }
      }

      // Magic Circle Logic
        const angle = Date.now() * 0.005;
        ctx.strokeStyle = '#E056FD';
        ctx.lineWidth = 2;

    // Inner Ring
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, 20, angle, angle + Math.PI * 1.5);
        ctx.stroke();

    // Outer Ring
        ctx.strokeStyle = '#FF003C';
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, 28, -angle * 1.5, -angle * 1.5 + Math.PI);
        ctx.stroke();

      // Bomb
      if (bomb.current.active) {
          ctx.fillStyle = `rgba(255, 255, 255, ${bomb.current.timer/120})`; 
          ctx.beginPath(); ctx.arc(player.current.x, player.current.y, bomb.current.radius, 0, Math.PI*2); ctx.fill();
      }

      // Boss
      ctx.fillStyle = PALETTE.BOSS; ctx.beginPath(); ctx.arc(boss.current.x, boss.current.y, 25, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = PALETTE.BOSS_AURA; ctx.beginPath(); ctx.arc(boss.current.x, boss.current.y, 30 + Math.sin(Date.now()*0.01)*5, 0, Math.PI*2); ctx.stroke();

      // Pools
      [bulletPool, itemPool, particlePool].forEach(p => {
          p.pool.forEach(e => {
             if(e.active) {
                 ctx.fillStyle = e.color;
                 if (p === itemPool) ctx.fillRect(e.x-3, e.y-3, 6, 6);
                 else if (p === particlePool) ctx.fillRect(e.x, e.y, 2, 2);
                 else { ctx.beginPath(); ctx.arc(e.x, e.y, e.width/2, 0, Math.PI*2); ctx.fill(); }
             } 
          });
      });
      
      ctx.restore();

      // HUD (Scaled)
      const uiX = PLAY_AREA_X + PLAY_AREA_WIDTH + 20;
      ctx.fillStyle = PALETTE.TEXT_PRIMARY; ctx.font = "24px monospace"; ctx.fillText("SHRINE-98", uiX, 40);
      ctx.font = "18px monospace"; ctx.fillStyle = "#fff";
      ctx.fillText(`SCORE: ${stats.current.score.toString().padStart(9, '0')}`, uiX, 80);
      ctx.fillText(`LIVES: ${"♥".repeat(Math.max(0, stats.current.lives))}`, uiX, 110);
      ctx.fillText(`BOMBS: ${"★".repeat(Math.max(0, stats.current.bombs))}`, uiX, 140);
      ctx.fillText(`POWER: ${stats.current.power}/128`, uiX, 170);
      ctx.fillText(`GRAZE: ${stats.current.graze}`, uiX, 200);
  };

  // TOUCH
  const handleTouchStart = (e: React.TouchEvent) => { lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; input.current.shoot = true; audioSynth.init(); };
  const handleTouchMove = (e: React.TouchEvent) => {
      if (!lastTouch.current) return;
      const t = e.touches[0];
      const dx = (t.clientX - lastTouch.current.x) * 1.5;
      const dy = (t.clientY - lastTouch.current.y) * 1.5;
      player.current.x += dx; player.current.y += dy;
      lastTouch.current = { x: t.clientX, y: t.clientY };
  };

  useGameLoop((dt) => { update(dt); draw(); }, !isPaused);

  return <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} 
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => { lastTouch.current = null; input.current.shoot = false; }}
            className="w-full h-full object-contain cursor-crosshair shadow-[0_0_30px_rgba(224,86,253,0.3)]" />;
};