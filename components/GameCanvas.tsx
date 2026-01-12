import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { 
  PALETTE, 
  SCREEN_WIDTH, 
  SCREEN_HEIGHT, 
  PLAY_AREA_WIDTH, 
  PLAY_AREA_HEIGHT, 
  PLAY_AREA_X, 
  PLAY_AREA_Y,
  MAX_BULLETS,
  MAX_ITEMS,
  PLAYER_SPEED,
  PLAYER_FOCUS_SPEED,
  PLAYER_HITBOX_RADIUS,
  PLAYER_GRAZE_RADIUS,
  PLAYER_ITEM_COLLECT_RADIUS,
  BOSS_MAX_HEALTH,
  BOSS_PHASE_HEALTH,
  BOSS_TOTAL_PHASES
} from '../constants';
import { Entity, EntityType, InputState, BossPattern, GameStats } from '../types';
import { audioSynth } from '../services/AudioSynth';

// -- ENGINE CLASSES --

class ItemPool {
  items: Entity[];

  constructor() {
    this.items = new Array(MAX_ITEMS).fill(null).map((_, i) => ({
      id: i,
      active: false,
      x: 0, 
      y: 0,
      dx: 0,
      dy: 0,
      width: 8,
      height: 8,
      type: EntityType.ITEM_POWER,
      color: PALETTE.ITEM_POWER
    }));
  }

  spawn(x: number, y: number, type: EntityType) {
    const item = this.items.find(i => !i.active);
    if (item) {
      item.active = true;
      item.x = x;
      item.y = y;
      // Burst out slightly then fall
      item.dx = (Math.random() - 0.5) * 4;
      item.dy = -3 - Math.random() * 2;
      item.type = type;
      item.color = type === EntityType.ITEM_POWER ? PALETTE.ITEM_POWER : PALETTE.ITEM_POINT;
    }
  }

  updateAndDraw(ctx: CanvasRenderingContext2D, player: Entity, onCollect: (type: EntityType) => void) {
    const collectSq = PLAYER_ITEM_COLLECT_RADIUS * PLAYER_ITEM_COLLECT_RADIUS;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.active) continue;

      // Physics
      item.dy += 0.1; // Gravity
      if (item.dy > 3) item.dy = 3; // Terminal velocity
      
      item.x += item.dx;
      item.y += item.dy;

      // Bounds
      if (item.y > PLAY_AREA_Y + PLAY_AREA_HEIGHT + 10) {
        item.active = false;
        continue;
      }

      // Draw
      ctx.fillStyle = item.color;
      ctx.fillRect(item.x - 3, item.y - 3, 6, 6);
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.fillText(item.type === EntityType.ITEM_POWER ? "P" : "SCORE", item.x - 2, item.y);

      // Collection
      if (player.active) {
        const dx = item.x - player.x;
        const dy = item.y - player.y;
        if (dx*dx + dy*dy < collectSq) {
          item.active = false;
          onCollect(item.type);
        }
      }
    }
  }
}

class BulletPool {
  bullets: Entity[];
  
  constructor() {
    this.bullets = new Array(MAX_BULLETS).fill(null).map((_, i) => ({
      id: i,
      active: false,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      width: 6,
      height: 6,
      type: EntityType.BULLET_ENEMY,
      color: PALETTE.BULLET_ENEMY,
      grazed: false
    }));
  }

  spawn(x: number, y: number, dx: number, dy: number, type: EntityType, color: string) {
    const bullet = this.bullets.find(b => !b.active);
    if (bullet) {
      bullet.active = true;
      bullet.x = x;
      bullet.y = y;
      bullet.dx = dx;
      bullet.dy = dy;
      bullet.type = type;
      bullet.color = color;
      bullet.grazed = false;
      bullet.rotation = Math.atan2(dy, dx);
    }
  }

  clearEnemyBullets() {
    this.bullets.forEach(b => {
      if (b.active && b.type === EntityType.BULLET_ENEMY) {
        b.active = false;
        // Optional: Spawn small particle effect
      }
    });
  }

  updateAndDraw(ctx: CanvasRenderingContext2D, dt: number, player: Entity, bombActive: boolean, bombRadiusSq: number, onGraze: () => void, onHit: () => void) {
    const grazeDistSq = PLAYER_GRAZE_RADIUS * PLAYER_GRAZE_RADIUS;
    const hitDistSq = PLAYER_HITBOX_RADIUS * PLAYER_HITBOX_RADIUS;
    const timeScale = dt / 16.67; 

    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      if (!b.active) continue;

      b.x += b.dx * timeScale;
      b.y += b.dy * timeScale;

      if (b.x < PLAY_AREA_X - 20 || b.x > PLAY_AREA_X + PLAY_AREA_WIDTH + 20 || 
          b.y < PLAY_AREA_Y - 20 || b.y > PLAY_AREA_Y + PLAY_AREA_HEIGHT + 20) {
        b.active = false;
        continue;
      }

      // Bomb Collision (Vaporize)
      if (bombActive && b.type === EntityType.BULLET_ENEMY) {
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        if (dx*dx + dy*dy < bombRadiusSq) {
            b.active = false;
            // Create a small poof effect logic could go here
            continue;
        }
      }

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - b.height/2);
      ctx.lineTo(b.x + b.width/2, b.y);
      ctx.lineTo(b.x, b.y + b.height/2);
      ctx.lineTo(b.x - b.width/2, b.y);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(b.x - 1, b.y - 1, 2, 2);

      if (b.type === EntityType.BULLET_ENEMY && player.active && !bombActive) {
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const distSq = dx*dx + dy*dy;

        if (distSq < hitDistSq) {
          b.active = false;
          onHit();
          continue; 
        }

        if (!b.grazed && distSq < grazeDistSq) {
          b.grazed = true;
          onGraze();
        }
      }
    }
  }
}

// -- MAIN COMPONENT --

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const playerRef = useRef<Entity>({
    id: -1,
    active: true,
    type: EntityType.PLAYER,
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT - 100,
    dx: 0, dy: 0, width: 0, height: 0, color: PALETTE.PLAYER_MAIN
  });
  
  const bossRef = useRef({
    x: SCREEN_WIDTH / 2,
    y: 100,
    health: BOSS_MAX_HEALTH,
    phase: 0, // 0, 1, 2
    phaseTimer: 0,
    pattern: BossPattern.IDLE,
    moveAngle: 0
  });

  const bombRef = useRef({
    active: false,
    timer: 0,
    radius: 0,
    maxRadius: 500
  });

  const bulletPoolRef = useRef(new BulletPool());
  const itemPoolRef = useRef(new ItemPool());
  
  const inputRef = useRef<InputState>({
    up: false, down: false, left: false, right: false, focus: false, shoot: false, bomb: false
  });
  
  const statsRef = useRef<GameStats>({
    score: 0,
    lives: 3,
    bombs: 3,
    power: 0, // 0-49 = Lv1, 50-99 = Lv2, etc. Max 200 (Lv5)
    graze: 0,
    bossHealth: BOSS_MAX_HEALTH,
    bossPhase: 0,
    fps: 60
  });

  const [uiStats, setUiStats] = useState<GameStats>(statsRef.current);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const [customAudioSrc, setCustomAudioSrc] = useState<string | null>(null);

  const lastUiUpdateRef = useRef(0);

  // Audio Logic
  useEffect(() => {
    // Create Audio Element
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;
    return () => {
        audio.pause();
        audioRef.current = null;
    }
  }, []);

  useEffect(() => {
      if (audioRef.current) {
          if (useCustomAudio && customAudioSrc) {
              audioRef.current.src = customAudioSrc;
              if (isPlaying) audioRef.current.play().catch(e => console.log("Audio play failed", e));
          } else {
              audioRef.current.pause();
              // Original FM Synth logic would go here if we had a BGM synth
          }
      }
  }, [useCustomAudio, customAudioSrc, isPlaying]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setCustomAudioSrc(url);
          setUseCustomAudio(true);
      }
  };

  // Input Handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      switch(e.code) {
        case 'ArrowUp': inputRef.current.up = isDown; break;
        case 'ArrowDown': inputRef.current.down = isDown; break;
        case 'ArrowLeft': inputRef.current.left = isDown; break;
        case 'ArrowRight': inputRef.current.right = isDown; break;
        case 'ShiftLeft': 
        case 'ShiftRight': inputRef.current.focus = isDown; break;
        case 'KeyZ': inputRef.current.shoot = isDown; break;
        case 'KeyX': inputRef.current.bomb = isDown; break;
      }
    };
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, []);

  const startGame = () => {
    audioSynth.init();
    
    playerRef.current.active = true;
    playerRef.current.x = PLAY_AREA_X + PLAY_AREA_WIDTH / 2;
    playerRef.current.y = PLAY_AREA_Y + PLAY_AREA_HEIGHT - 50;
    
    bossRef.current.health = BOSS_MAX_HEALTH;
    bossRef.current.phase = 0;
    bossRef.current.x = PLAY_AREA_X + PLAY_AREA_WIDTH / 2;
    bossRef.current.y = PLAY_AREA_Y + 80;
    
    statsRef.current = { 
        score: 0, lives: 3, bombs: 3, power: 0, 
        graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60 
    };
    setUiStats(statsRef.current);
    
    bulletPoolRef.current.bullets.forEach(b => b.active = false);
    itemPoolRef.current.items.forEach(i => i.active = false);

    setIsPlaying(true);
    setGameOver(false);

    if (useCustomAudio && audioRef.current) {
        audioRef.current.play().catch(e => console.error(e));
    }
  };

  const spawnItems = (x: number, y: number, count: number, type: EntityType) => {
      for(let i=0; i<count; i++) itemPoolRef.current.spawn(x, y, type);
  }

  const handleGraze = useCallback(() => {
    statsRef.current.graze++;
    statsRef.current.score += 100;
    audioSynth.playGraze();
  }, []);

  const handleItemCollect = useCallback((type: EntityType) => {
      if (type === EntityType.ITEM_POWER) {
          statsRef.current.power = Math.min(statsRef.current.power + 1, 200);
          statsRef.current.score += 10;
      } else {
          statsRef.current.score += 1000;
      }
  }, []);

  const handlePlayerHit = useCallback(() => {
    if (!playerRef.current.active) return;
    
    statsRef.current.lives--;
    statsRef.current.power = Math.max(0, statsRef.current.power - 10); // Penalty
    statsRef.current.bombs = 3; // Reset bombs on death usually
    audioSynth.playHit();
    
    bulletPoolRef.current.clearEnemyBullets();

    if (statsRef.current.lives < 0) {
      playerRef.current.active = false;
      setIsPlaying(false);
      setGameOver(true);
      if (audioRef.current) audioRef.current.pause();
    } else {
      playerRef.current.x = PLAY_AREA_X + PLAY_AREA_WIDTH / 2;
      playerRef.current.y = PLAY_AREA_Y + PLAY_AREA_HEIGHT - 30;
      // Spawn some recovery items
      spawnItems(playerRef.current.x, playerRef.current.y - 100, 5, EntityType.ITEM_POWER);
    }
  }, []);

  const triggerBomb = () => {
      if (statsRef.current.bombs > 0 && !bombRef.current.active) {
          statsRef.current.bombs--;
          bombRef.current.active = true;
          bombRef.current.timer = 60; // 1 second duration
          bombRef.current.radius = 0;
          // Audio FX for bomb
          audioSynth.playShoot(); // Reuse for now or add new
      }
  }

  // -- UPDATE LOOP --
  const update = (dt: number) => {
    if (gameOver) return;

    const player = playerRef.current;
    const input = inputRef.current;
    const boss = bossRef.current;
    const pool = bulletPoolRef.current;
    
    // 1. Bomb Logic
    if (input.bomb) triggerBomb();
    
    if (bombRef.current.active) {
        bombRef.current.timer--;
        bombRef.current.radius += 15;
        if (bombRef.current.timer <= 0) {
            bombRef.current.active = false;
        }
    }

    // 2. Player Movement
    let speed = input.focus ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
    if ((input.up || input.down) && (input.left || input.right)) speed *= 0.707;
    if (input.up) player.y -= speed;
    if (input.down) player.y += speed;
    if (input.left) player.x -= speed;
    if (input.right) player.x += speed;
    player.x = Math.max(PLAY_AREA_X + 5, Math.min(PLAY_AREA_X + PLAY_AREA_WIDTH - 5, player.x));
    player.y = Math.max(PLAY_AREA_Y + 5, Math.min(PLAY_AREA_Y + PLAY_AREA_HEIGHT - 5, player.y));

    // 3. Player Shooting (Power Levels)
    if (input.shoot && player.active && !bombRef.current.active) {
      if (Date.now() % 5 === 0) {
         const powerLvl = Math.floor(statsRef.current.power / 10) + 1; // 0-9=Lvl1, 10-19=Lvl2...
         const safePower = Math.min(powerLvl, 5);
         
         const spawnBullet = (dx: number, dy: number) => 
            pool.spawn(player.x, player.y - 10, dx, dy, EntityType.BULLET_PLAYER, PALETTE.BULLET_PLAYER);

         spawnBullet(0, -12); // Center always

         if (safePower >= 2) {
             spawnBullet(-1, -11);
             spawnBullet(1, -11);
         }
         if (safePower >= 3) {
             spawnBullet(-3, -10);
             spawnBullet(3, -10);
         }
         // Lvl 4 adds density, Lvl 5 adds wide
         if (safePower >= 5) {
             spawnBullet(-6, -9);
             spawnBullet(6, -9);
         }

         audioSynth.playShoot();
      }
    }

    // 4. Boss Logic & Phases
    boss.phaseTimer++;
    boss.x = (PLAY_AREA_X + PLAY_AREA_WIDTH / 2) + Math.sin(boss.phaseTimer * 0.02) * 50;
    
    // Determine Phase based on HP
    const calculatedPhase = boss.health <= 5000 ? 2 : boss.health <= 10000 ? 1 : 0;

    if (calculatedPhase > boss.phase) {
        // Phase Transition Event
        boss.phase = calculatedPhase;
        pool.clearEnemyBullets(); // Spell Card Break!
        spawnItems(boss.x, boss.y, 10, EntityType.ITEM_POWER);
        spawnItems(boss.x, boss.y, 20, EntityType.ITEM_POINT);
    }
    statsRef.current.bossPhase = calculatedPhase;

    // Boss Patterns
    if (player.active) {
        if (boss.phase === 0) {
            // Phase 1: Basic Radial
             if (boss.phaseTimer % 30 === 0) {
                for (let i = 0; i < 16; i++) {
                    const angle = (Math.PI * 2 / 16) * i + boss.phaseTimer * 0.02;
                    pool.spawn(boss.x, boss.y, Math.cos(angle) * 3, Math.sin(angle) * 3, EntityType.BULLET_ENEMY, PALETTE.BULLET_ENEMY);
                }
            }
        } else if (boss.phase === 1) {
            // Phase 2: Spiral + Stream
            if (boss.phaseTimer % 5 === 0) {
                const angle = boss.phaseTimer * 0.2;
                pool.spawn(boss.x, boss.y, Math.cos(angle) * 4, Math.sin(angle) * 4, EntityType.BULLET_ENEMY, PALETTE.BULLET_ENEMY);
                pool.spawn(boss.x, boss.y, Math.cos(angle + Math.PI) * 4, Math.sin(angle + Math.PI) * 4, EntityType.BULLET_ENEMY, PALETTE.BULLET_ENEMY);
            }
        } else {
            // Phase 3: Final Barrage (Aimed + Random)
            if (boss.phaseTimer % 10 === 0) {
                // Aimed
                const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
                pool.spawn(boss.x, boss.y, Math.cos(angle) * 6, Math.sin(angle) * 6, EntityType.BULLET_ENEMY, "#ff00ff");
                // Random Spray
                const randAngle = Math.random() * Math.PI * 2;
                pool.spawn(boss.x, boss.y, Math.cos(randAngle) * 3, Math.sin(randAngle) * 3, EntityType.BULLET_ENEMY, PALETTE.BULLET_ENEMY);
            }
        }
    }

    // 5. Collisions & Bullets
    // Player Bullets -> Boss
    for(const b of pool.bullets) {
        if (b.active && b.type === EntityType.BULLET_PLAYER) {
            if (Math.abs(b.x - boss.x) < 30 && Math.abs(b.y - boss.y) < 30) {
                b.active = false;
                boss.health -= 10;
                statsRef.current.score += 10;
                // Add a chance to drop point item on hit
                if (Math.random() < 0.05) spawnItems(boss.x, boss.y, 1, EntityType.ITEM_POINT);
                
                if (boss.health <= 0) {
                    boss.health = 0; // Win state logic could go here
                    // Just loop for now or reset
                    boss.health = BOSS_MAX_HEALTH;
                    statsRef.current.score += 100000;
                    pool.clearEnemyBullets();
                }
            }
        }
    }

    // Items
    itemPoolRef.current.updateAndDraw(canvasRef.current!.getContext('2d')!, player, handleItemCollect);
  };

  const draw = (dt: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // BG
    ctx.fillStyle = PALETTE.BG_DARK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Play Area
    ctx.strokeStyle = PALETTE.BG_GRID;
    ctx.lineWidth = 2;
    ctx.strokeRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

    const player = playerRef.current;
    
    // Player
    if (player.active) {
        ctx.fillStyle = PALETTE.PLAYER_MAIN;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 15);
        ctx.lineTo(player.x + 10, player.y + 10);
        ctx.lineTo(player.x - 10, player.y + 10);
        ctx.fill();
        ctx.fillStyle = PALETTE.PLAYER_CORE;
        ctx.fillRect(player.x - 3, player.y - 12, 6, 6);

        if (inputRef.current.focus) {
            const time = Date.now();
            const pulse = (Math.sin(time * 0.015) + 1) * 0.5;
            const glowRadius = PLAYER_HITBOX_RADIUS + 3 + (pulse * 4); 
            const glowOpacity = 0.4 + (pulse * 0.2);
            
            ctx.fillStyle = `rgba(255, 255, 255, ${glowOpacity})`;
            ctx.beginPath();
            ctx.arc(player.x, player.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(player.x, player.y, PLAYER_HITBOX_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Bomb Visual
    if (bombRef.current.active) {
        ctx.fillStyle = `rgba(255, 255, 255, ${bombRef.current.timer / 60 * 0.5})`;
        ctx.beginPath();
        ctx.arc(player.x, player.y, bombRef.current.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Boss
    const boss = bossRef.current;
    ctx.fillStyle = PALETTE.BOSS;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, 20, 0, Math.PI * 2);
    ctx.fill();

    itemPoolRef.current.updateAndDraw(ctx, player, handleItemCollect);

    // Boss Health Bar
    const currentHP = boss.health;
    const hpWidth = PLAY_AREA_WIDTH;
    
    ctx.fillStyle = "#330000";
    ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth, 6);
    
    const phaseHP = currentHP % BOSS_PHASE_HEALTH || BOSS_PHASE_HEALTH; 
    const pct = phaseHP / BOSS_PHASE_HEALTH;
    ctx.fillStyle = boss.phase === 0 ? "#00FF00" : boss.phase === 1 ? "#FFFF00" : "#FF0000";
    ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth * pct, 6);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`PHASE ${boss.phase + 1}/3`, PLAY_AREA_X, PLAY_AREA_Y - 5);

    // Bullets
    bulletPoolRef.current.updateAndDraw(ctx, dt, player, bombRef.current.active, bombRef.current.radius * bombRef.current.radius, handleGraze, handlePlayerHit);

    // UI
    const uiX = PLAY_AREA_X + PLAY_AREA_WIDTH + 10;
    ctx.fillStyle = PALETTE.TEXT;
    ctx.font = "24px 'VT323', monospace";
    ctx.fillText("PROJECT SHRINE-98", uiX, 40);
    
    ctx.font = "20px 'VT323', monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`SCORE: ${statsRef.current.score.toString().padStart(9, '0')}`, uiX, 80);
    ctx.fillText(`LIVES: ${"♥".repeat(Math.max(0, statsRef.current.lives))}`, uiX, 110);
    ctx.fillText(`BOMBS: ${"★".repeat(Math.max(0, statsRef.current.bombs))}`, uiX, 140);
    
    // Power Level
    const pwr = Math.floor(statsRef.current.power / 10);
    ctx.fillText(`POWER: ${pwr}/20`, uiX, 170);
    ctx.fillStyle = "#333";
    ctx.fillRect(uiX, 180, 100, 10);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(uiX, 180, Math.min(100, statsRef.current.power / 2), 10);

    ctx.fillStyle = "#AAAAAA";
    ctx.fillText("CONTROLS:", uiX, 260);
    ctx.fillText("Z: Fire  X: Bomb", uiX, 285);
    ctx.fillText("SHIFT: Focus", uiX, 310);

    const now = Date.now();
    if (now - lastUiUpdateRef.current > 500) {
        setUiStats({...statsRef.current});
        lastUiUpdateRef.current = now;
    }
  };

  useGameLoop((dt) => {
    if (isPlaying) {
        update(dt);
        draw(dt);
    }
  }, isPlaying);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-black overflow-hidden">
      {!isPlaying && (
        <div className="absolute z-20 flex flex-col items-center justify-center p-8 border-4 border-purple-500 bg-slate-900 text-white scanlines shadow-lg shadow-purple-500/50">
          <h1 className="text-4xl mb-4 text-purple-300 tracking-widest">SHRINE-98</h1>
          {gameOver ? (
             <div className="flex flex-col items-center mb-6 animate-pulse">
                <p className="text-red-500 text-2xl font-bold tracking-widest">MISSION FAILED</p>
                <p className="text-gray-300 mt-2">FINAL SCORE: {statsRef.current.score}</p>
             </div>
          ) : (
             <p className="mb-4 text-gray-400">Vertical Danmaku Engine</p>
          )}

          <div className="mb-6 w-full text-center">
              <label className="block text-sm text-gray-400 mb-2">CUSTOM RADIO HUB</label>
              <div className="flex flex-col gap-2 items-center">
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setUseCustomAudio(false)}
                        className={`px-3 py-1 border ${!useCustomAudio ? 'bg-purple-700 border-white' : 'border-gray-600 text-gray-600'}`}
                    >
                        FM-SYNTH
                    </button>
                    <button 
                        onClick={() => setUseCustomAudio(true)}
                        className={`px-3 py-1 border ${useCustomAudio ? 'bg-purple-700 border-white' : 'border-gray-600 text-gray-600'}`}
                        disabled={!customAudioSrc}
                    >
                        MP3 LINK
                    </button>
                  </div>
                  <input 
                    type="file" 
                    accept="audio/*" 
                    onChange={handleFileUpload}
                    className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-2 file:border-0 file:bg-purple-900 file:text-white hover:file:bg-purple-700"
                  />
              </div>
          </div>

          <button 
            onClick={startGame}
            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold border-2 border-white pixel-font uppercase transition-all transform hover:scale-105"
          >
            {gameOver ? "RETRY OPERATION" : "INITIALIZE SYSTEM"}
          </button>
        </div>
      )}
      
      <div className="relative border-4 border-slate-700 shadow-2xl shadow-purple-900/50 rounded-sm">
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          className="bg-black block scanlines cursor-none"
        />
        <div className="absolute inset-0 pointer-events-none scanlines opacity-20"></div>
      </div>
    </div>
  );
};