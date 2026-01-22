import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import {
  PALETTE, SCREEN_WIDTH, SCREEN_HEIGHT, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT, PLAY_AREA_X, PLAY_AREA_Y,
  MAX_BULLETS, MAX_ITEMS, MAX_PARTICLES, PLAYER_SPEED, PLAYER_FOCUS_SPEED,
  PLAYER_HITBOX_RADIUS, PLAYER_GRAZE_RADIUS, PLAYER_COLLECT_RADIUS, BOSS_MAX_HEALTH, BOSS_PHASE_HEALTH,
  POC_THRESHOLD_Y, DEATHBOMB_WINDOW, SCORE_EXTEND_1, SCORE_EXTEND_2, BOSS_TOTAL_PHASES
} from '../constants';
import { Entity, EntityType, InputState, GameStats } from '../types';
import { audioSynth } from '../services/AudioSynth';

// --- POOLS ---
class EntityPool {
  pool: Entity[];
  constructor(size: number, defaultType: EntityType) {
    this.pool = new Array(size).fill(null).map((_, i) => ({
      id: i, active: false, x: 0, y: 0, dx: 0, dy: 0, width: 0, height: 0, color: '#fff', type: defaultType, homing: false
    }));
  }
  spawn(x: number, y: number, dx: number, dy: number, color: string = '#fff', w: number = 8, h: number = 8, type: EntityType = EntityType.BULLET_ENEMY) {
    const e = this.pool.find(i => !i.active);
    if (e) {
      e.active = true; e.x = x; e.y = y; e.dx = dx; e.dy = dy; 
      e.color = color; e.width = w; e.height = h; e.grazed = false; e.type = type; e.homing = false;
      e.rotation = Math.atan2(dy, dx);
    }
  }
  clear(particlePool: any) { 
      this.pool.forEach(e => { 
          if(e.active && e.type === EntityType.BULLET_ENEMY) {
            e.active = false;
            particlePool.spawn(e.x, e.y, e.color, 2, 2); 
          }
      }); 
  }
}

class ParticlePool {
    pool: any[];
    constructor() {
        this.pool = new Array(MAX_PARTICLES).fill(null).map(() => ({ active: false, x: 0, y: 0, dx: 0, dy: 0, life: 0, maxLife: 0, color: '#fff', size: 1 }));
    }
    spawn(x: number, y: number, color: string, count: number, speed: number) {
        for(let i=0; i<count; i++) {
            const p = this.pool.find((x:any) => !x.active);
            if(p) {
                p.active = true; p.x = x; p.y = y;
                const a = Math.random() * Math.PI * 2;
                const s = Math.random() * speed;
                p.dx = Math.cos(a)*s; p.dy = Math.sin(a)*s;
                p.life = 20 + Math.random()*20; p.maxLife = p.life; p.color = color; p.size = 1 + Math.random()*2;
            }
        }
    }
    updateAndDraw(ctx: CanvasRenderingContext2D) {
        for(const p of this.pool) {
            if(!p.active) continue;
            p.x += p.dx; p.y += p.dy; p.life--;
            if(p.life <= 0) p.active = false;
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1.0;
        }
    }
}

const bulletPool = new EntityPool(MAX_BULLETS, EntityType.BULLET_ENEMY);
const itemPool = new EntityPool(MAX_ITEMS, EntityType.ITEM_POWER);
const particlePool = new ParticlePool();

export const GameCanvas: React.FC<{ 
    customAudioSrc: string | null; 
    setStats: (s: GameStats) => void; 
    onGameOver: () => void;
    isPaused: boolean;
}> = ({ customAudioSrc, setStats, onGameOver, isPaused }) => {
    
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const player = useRef<Entity>({ id: -1, active: true, type: EntityType.PLAYER, x: 320, y: 400, dx: 0, dy: 0, width: 0, height: 0, color: PALETTE.PLAYER_CORE });
  const boss = useRef({ active: true, x: 320, y: 100, health: BOSS_MAX_HEALTH, phase: 0, timer: 0, rotation: 0 });
  const bomb = useRef({ active: false, radius: 0, timer: 0 });
  const shake = useRef(0);
  const invuln = useRef(0);
  const deathBombTimer = useRef(0); 
  const bgScroll = useRef(0);
  const scoreExtends = useRef([false, false]); 
  
  const stats = useRef<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60, hiscore: 0 });
  const input = useRef<InputState>({ up: false, down: false, left: false, right: false, focus: false, shoot: false, bomb: false });
  const touchState = useRef({ up: false, down: false, left: false, right: false, shoot: false, bomb: false, focus: false });
  const frames = useRef(0);
  const lastTouch = useRef<{x: number, y: number} | null>(null);

  // Audio & Input Setup
  useEffect(() => {
    const initAudio = () => audioSynth.init();
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    
    // Load Hiscore
    const saved = localStorage.getItem('SHRINE98_HISCORE');
    if(saved) stats.current.hiscore = parseInt(saved);

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
    return () => { 
        window.removeEventListener('click', initAudio); 
        window.removeEventListener('keydown', e => handleKey(e, true));
        window.removeEventListener('keyup', e => handleKey(e, false));
    };
  }, []);

  const triggerBomb = () => {
    if (stats.current.bombs > 0 && !bomb.current.active) {
        stats.current.bombs--;
        bomb.current.active = true; bomb.current.timer = 120; bomb.current.radius = 10;
        shake.current = 15;
        audioSynth.playBomb();
        bulletPool.clear(particlePool);
        if (deathBombTimer.current > 0) {
            deathBombTimer.current = 0;
            invuln.current = 120; 
        }
    }
  };

  const handlePlayerDeath = () => {
      if (deathBombTimer.current > 0) return; 
      deathBombTimer.current = DEATHBOMB_WINDOW; 
      audioSynth.playHit(); 
      shake.current = 30;
  };

  const finalizeDeath = () => {
      stats.current.lives--;
      stats.current.power = Math.max(0, stats.current.power - 20); 
      stats.current.bombs = 3; 
      invuln.current = 180; 
      particlePool.spawn(player.current.x, player.current.y, PALETTE.PLAYER_AURA, 50, 6);
      bulletPool.clear(particlePool);
      
      for(let k=0; k<5; k++) itemPool.spawn(boss.current.x, boss.current.y, (Math.random()-0.5)*5, -5, PALETTE.ITEM_POWER, 8, 8, EntityType.ITEM_POWER);
      
      player.current.x = PLAY_AREA_X + PLAY_AREA_WIDTH / 2;
      player.current.y = PLAY_AREA_Y + PLAY_AREA_HEIGHT - 30;

      if (stats.current.lives < 0) {
          if(stats.current.score > stats.current.hiscore) {
              localStorage.setItem('SHRINE98_HISCORE', stats.current.score.toString());
          }
          onGameOver();
      }
  };

  const firePlayer = () => {
      audioSynth.playShoot();
      const pwr = stats.current.power;
      const level = Math.floor(pwr / 32) + 1; 
      const focus = input.current.focus || touchState.current.focus;
      
      bulletPool.spawn(player.current.x, player.current.y - 10, 0, -20, PALETTE.BULLET_PLAYER, 6, 16, EntityType.BULLET_PLAYER);
      
      if (level >= 2) {
          const spread = focus ? 2 : 5;
          bulletPool.spawn(player.current.x - 8, player.current.y, -spread * 0.5, -18, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
          bulletPool.spawn(player.current.x + 8, player.current.y, spread * 0.5, -18, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
      }
      if (level >= 3) {
          const spread = focus ? 4 : 10;
          bulletPool.spawn(player.current.x - 16, player.current.y + 5, -spread, -16, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
          bulletPool.spawn(player.current.x + 16, player.current.y + 5, spread, -16, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
      }
  };

  const update = (dt: number) => {
      if (isPaused || !player.current.active) return;
      frames.current++;

      if (deathBombTimer.current > 0) {
          deathBombTimer.current--;
          if ((input.current.bomb || touchState.current.bomb) && stats.current.bombs > 0) {
              triggerBomb(); 
          } else if (deathBombTimer.current <= 0) {
              finalizeDeath(); 
          }
          return; 
      }

      const inputs = {
          u: input.current.up || touchState.current.up,
          d: input.current.down || touchState.current.down,
          l: input.current.left || touchState.current.left,
          r: input.current.right || touchState.current.right,
          s: input.current.shoot || touchState.current.shoot,
          b: input.current.bomb || touchState.current.bomb,
          f: input.current.focus || touchState.current.focus
      };

      if (inputs.b) triggerBomb();
      
      const spd = inputs.f ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
      if (inputs.u) player.current.y -= spd;
      if (inputs.d) player.current.y += spd;
      if (inputs.l) player.current.x -= spd;
      if (inputs.r) player.current.x += spd;

      player.current.x = Math.max(PLAY_AREA_X+5, Math.min(PLAY_AREA_X + PLAY_AREA_WIDTH-5, player.current.x));
      player.current.y = Math.max(PLAY_AREA_Y+5, Math.min(PLAY_AREA_Y + PLAY_AREA_HEIGHT-5, player.current.y));

      const pocActive = player.current.y < POC_THRESHOLD_Y;

      if (inputs.s && frames.current % 4 === 0) firePlayer();

      boss.current.timer++;
      boss.current.rotation += 0.02;
      boss.current.x = (PLAY_AREA_X + PLAY_AREA_WIDTH/2) + Math.sin(boss.current.timer * 0.015) * 60;
      boss.current.y = 100 + Math.cos(boss.current.timer * 0.02) * 20;

      if (boss.current.active) {
          const t = boss.current.timer;
          const phase = boss.current.phase;

          if (phase === 0 && t % 20 === 0) { 
             const count = 20;
             for (let i = 0; i < count; i++) {
                 const a = (Math.PI * 2 / count) * i + t * 0.05;
                 bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a)*3, Math.sin(a)*3, PALETTE.BULLET_ENEMY, 8, 8);
             }
          } 
          else if (phase === 1 && t % 4 === 0) { 
             const a = t * 0.2;
             bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a)*4, Math.sin(a)*4, '#FF00FF', 8, 8);
             bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a+2)*4, Math.sin(a+2)*4, '#00FFFF', 8, 8);
          }
          else if (phase === 2 && t % 60 === 0) { 
             const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
             for(let i=-5; i<=5; i++) {
                 bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i*0.1)*5, Math.sin(aim + i*0.1)*5, '#FF003C', 10, 10);
             }
          }
          else if (phase >= 3 && t % 2 === 0) { 
             bulletPool.spawn(
                 PLAY_AREA_X + Math.random() * PLAY_AREA_WIDTH, 
                 PLAY_AREA_Y, 
                 0, 
                 3 + Math.random(), 
                 '#FFFFFF', 4, 12
             );
          }
      }

      bulletPool.pool.forEach(b => {
          if (!b.active) return;
          b.x += b.dx; b.y += b.dy;
          if (b.x < PLAY_AREA_X-20 || b.x > PLAY_AREA_X+PLAY_AREA_WIDTH+20 || b.y < PLAY_AREA_Y-20 || b.y > PLAY_AREA_Y+PLAY_AREA_HEIGHT+20) b.active = false;

          if (bomb.current.active && b.type === EntityType.BULLET_ENEMY) {
              const dx = b.x - player.current.x; const dy = b.y - player.current.y;
              if (Math.sqrt(dx*dx + dy*dy) < bomb.current.radius) {
                  b.active = false;
                  itemPool.spawn(b.x, b.y, 0, -2, PALETTE.ITEM_POINT, 8, 8, EntityType.ITEM_POINT);
              }
          }

          if (b.type === EntityType.BULLET_ENEMY && player.current.active && invuln.current <= 0 && deathBombTimer.current <= 0) {
             const dx = b.x - player.current.x; const dy = b.y - player.current.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist < PLAYER_HITBOX_RADIUS + 3) {
                 b.active = false;
                 handlePlayerDeath(); 
             } else if (dist < PLAYER_GRAZE_RADIUS && !b.grazed) {
                 b.grazed = true; stats.current.graze++; stats.current.score += 500;
                 audioSynth.playGraze();
                 particlePool.spawn(b.x, b.y, '#fff', 1, 1);
             }
          }
      });

      itemPool.pool.forEach(i => {
          if (!i.active) return;
          if (pocActive || i.homing) {
             i.homing = true;
             const dx = player.current.x - i.x;
             const dy = player.current.y - i.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             i.x += (dx/dist) * 12; 
             i.y += (dy/dist) * 12;
          } else {
             i.y += 2.5; 
          }

          const dx = i.x - player.current.x; const dy = i.y - player.current.y;
          if (Math.sqrt(dx*dx + dy*dy) < PLAYER_COLLECT_RADIUS) {
              i.active = false;
              audioSynth.playItem();
              if (i.type === EntityType.ITEM_POWER) {
                  stats.current.power = Math.min(128, stats.current.power + 1);
                  stats.current.score += 100;
              } else if (i.type === EntityType.ITEM_LIFE) {
                  stats.current.lives++;
                  audioSynth.playExtend();
              } else {
                  stats.current.score += 5000;
              }
          }
          if (i.y > SCREEN_HEIGHT) i.active = false;
      });

      bulletPool.pool.forEach(b => {
          if (b.active && b.type === EntityType.BULLET_PLAYER) {
              const dx = b.x - boss.current.x; const dy = b.y - boss.current.y;
              if (Math.sqrt(dx*dx + dy*dy) < 30) {
                  b.active = false;
                  boss.current.health -= 10;
                  stats.current.score += 100;
                  particlePool.spawn(b.x, b.y, PALETTE.BOSS_AURA, 1, 2);
                  
                  const hpPerPhase = BOSS_MAX_HEALTH / BOSS_TOTAL_PHASES;
                  const currentPhase = Math.floor((BOSS_MAX_HEALTH - boss.current.health) / hpPerPhase);
                  if (currentPhase > boss.current.phase && currentPhase < BOSS_TOTAL_PHASES) {
                      boss.current.phase = currentPhase;
                      bulletPool.clear(particlePool);
                      shake.current = 15;
                      for(let k=0; k<15; k++) itemPool.spawn(boss.current.x, boss.current.y, (Math.random()-0.5)*3, -4, PALETTE.ITEM_POWER, 8, 8, EntityType.ITEM_POWER)
                  }
                  
                  if (boss.current.health <= 0) {
                      boss.current.health = BOSS_MAX_HEALTH; 
                      stats.current.score += 1000000;
                      bulletPool.clear(particlePool);
                      audioSynth.playExtend();
                      shake.current = 40;
                  }
              }
          }
      });

      if (shake.current > 0) shake.current *= 0.9;
      if (invuln.current > 0) invuln.current--;
      if (bomb.current.active) {
          bomb.current.timer--; bomb.current.radius += 10;
          if (bomb.current.timer <= 0) bomb.current.active = false;
      }
      if (!scoreExtends.current[0] && stats.current.score >= SCORE_EXTEND_1) {
          stats.current.lives++; scoreExtends.current[0] = true; audioSynth.playExtend();
      }
      
      bgScroll.current = (bgScroll.current + 2) % 40;
      
      stats.current.bossHealth = boss.current.health;
      stats.current.bossPhase = boss.current.phase;
      if (frames.current % 10 === 0) setStats({...stats.current});
  };

  const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      
      const sx = (Math.random()-0.5) * shake.current;
      const sy = (Math.random()-0.5) * shake.current;
      ctx.save();
      ctx.translate(sx, sy);
      
      // --- BACKGROUND LAYER ---
// 1. Clear Void
ctx.fillStyle = PALETTE.BG_VOID; 
ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

// 2. Scrolling Grid (The "Speed" Effect)
// This creates vertical lines moving down
ctx.save();
ctx.beginPath();
ctx.strokeStyle = "rgba(224, 86, 253, 0.1)"; // Faint Violet
ctx.lineWidth = 1;

const scrollY = (Date.now() * 0.1) % 40; // Speed factor

// Draw Vertical Grid Lines
for (let i = PLAY_AREA_X; i <= PLAY_AREA_X + PLAY_AREA_WIDTH; i += 40) {
    ctx.moveTo(i, PLAY_AREA_Y);
    ctx.lineTo(i, PLAY_AREA_Y + PLAY_AREA_HEIGHT);
}

// Draw Horizontal Scrolling Lines
for (let j = PLAY_AREA_Y + scrollY - 40; j < PLAY_AREA_Y + PLAY_AREA_HEIGHT; j += 40) {
    ctx.moveTo(PLAY_AREA_X, j);
    ctx.lineTo(PLAY_AREA_X + PLAY_AREA_WIDTH, j);
}
ctx.stroke();
ctx.restore();

// 3. Play Area Background (Semi-transparent to show grid)
ctx.fillStyle = "rgba(10, 0, 16, 0.8)"; // Deep Purple tint
ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);
      
      ctx.strokeStyle = PALETTE.BG_GRID; ctx.lineWidth = 1;
      for (let y = bgScroll.current; y < SCREEN_HEIGHT; y += 40) {
          ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, y); ctx.lineTo(PLAY_AREA_X+PLAY_AREA_WIDTH, y); ctx.stroke();
      }
      ctx.strokeRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, POC_THRESHOLD_Y); ctx.lineTo(PLAY_AREA_X+PLAY_AREA_WIDTH, POC_THRESHOLD_Y); ctx.stroke();
      ctx.setLineDash([]);

      if (boss.current.active) {
          ctx.save();
          ctx.translate(boss.current.x, boss.current.y);
          ctx.rotate(boss.current.rotation);
          ctx.strokeStyle = PALETTE.BOSS_AURA; ctx.lineWidth = 3;
          ctx.beginPath(); 
          for(let i=0; i<6; i++) {
              const a = (Math.PI*2/6)*i;
              ctx.lineTo(Math.cos(a)*30, Math.sin(a)*30);
          }
          ctx.closePath(); ctx.stroke();
          ctx.fillStyle = PALETTE.BOSS; ctx.fill();
          ctx.restore();
      }

      const hpWidth = PLAY_AREA_WIDTH;
      ctx.fillStyle = "#330000"; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth, 5);
      const phaseMax = BOSS_MAX_HEALTH / BOSS_TOTAL_PHASES;
      const phaseCurrent = boss.current.health % phaseMax || phaseMax;
      const pct = phaseCurrent / phaseMax;
      ctx.fillStyle = boss.current.phase === 0 ? '#00FF00' : boss.current.phase === 1 ? '#FFFF00' : '#FF003C';
      ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth * pct, 5);

      if (player.current.active && (invuln.current % 4 < 2)) {
          ctx.fillStyle = PALETTE.PLAYER_AURA;
          if (frames.current % 4 === 0) {
               ctx.globalAlpha = 0.3;
               ctx.beginPath(); ctx.moveTo(player.current.x, player.current.y-15); ctx.lineTo(player.current.x+10, player.current.y+10); ctx.lineTo(player.current.x-10, player.current.y+10); ctx.fill();
               ctx.globalAlpha = 1.0;
          }
          ctx.beginPath(); ctx.moveTo(player.current.x, player.current.y - 15); ctx.lineTo(player.current.x + 10, player.current.y + 10); ctx.lineTo(player.current.x - 10, player.current.y + 10); ctx.fill();
          ctx.fillStyle = PALETTE.PLAYER_CORE; ctx.fillRect(player.current.x - 3, player.current.y - 12, 6, 6);
          
          if (input.current.focus || touchState.current.focus) {
                const rot = frames.current * 0.1;
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS, 0, Math.PI*2); ctx.stroke();
                
                ctx.strokeStyle = PALETTE.PLAYER_AURA;
                ctx.beginPath(); ctx.arc(player.current.x, player.current.y, 25, rot, rot+Math.PI); ctx.stroke();
          }
      }

      if (bomb.current.active) {
          ctx.fillStyle = `rgba(255, 255, 255, ${bomb.current.timer / 120})`; 
          ctx.beginPath(); ctx.arc(player.current.x, player.current.y, bomb.current.radius, 0, Math.PI*2); ctx.fill();
      }

      particlePool.updateAndDraw(ctx);
      itemPool.pool.forEach(i => {
          if(!i.active) return;
          ctx.fillStyle = i.color; ctx.fillRect(i.x-4, i.y-4, 8, 8);
          ctx.fillStyle = '#000'; ctx.font = "8px monospace"; ctx.fillText(i.type===EntityType.ITEM_POWER?"P":"S", i.x-2, i.y+2);
      });
      bulletPool.pool.forEach(b => {
          if(!b.active) return;
          ctx.fillStyle = b.color;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.width/2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillRect(b.x-1, b.y-1, 2, 2);
      });

      ctx.restore();

      const uiX = PLAY_AREA_X + PLAY_AREA_WIDTH + 20;
      ctx.font = "24px monospace"; ctx.fillStyle = PALETTE.TEXT_PRIMARY; ctx.fillText("SHRINE-98", uiX, 40);
      ctx.font = "18px monospace"; ctx.fillStyle = "#fff";
      ctx.fillText(`SCORE:`, uiX, 80);
      ctx.fillText(`${stats.current.score.toString().padStart(9, '0')}`, uiX, 100);
      ctx.fillText(`HISCORE:`, uiX, 130);
      ctx.fillText(`${stats.current.hiscore.toString().padStart(9, '0')}`, uiX, 150);
      ctx.fillText(`LIVES: ${"♥".repeat(Math.max(0, stats.current.lives))}`, uiX, 190);
      ctx.fillText(`BOMBS: ${"★".repeat(Math.max(0, stats.current.bombs))}`, uiX, 220);
      ctx.fillText(`POWER: ${stats.current.power}/128`, uiX, 260);
      ctx.fillStyle = "#333"; ctx.fillRect(uiX, 270, 100, 8);
      ctx.fillStyle = PALETTE.ITEM_POWER; ctx.fillRect(uiX, 270, (stats.current.power/128)*100, 8);
      ctx.fillStyle = "#fff";
      ctx.fillText(`GRAZE: ${stats.current.graze}`, uiX, 310);
      
      if (deathBombTimer.current > 0) {
          ctx.fillStyle = "#FF0000"; ctx.fillText("!! DEATH !!", uiX, 350);
      }
  };

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