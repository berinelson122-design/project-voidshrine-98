import React, { useRef, useEffect, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import {
    PALETTE, SCREEN_WIDTH, SCREEN_HEIGHT, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT, PLAY_AREA_X, PLAY_AREA_Y,
    MAX_BULLETS, MAX_ITEMS, MAX_PARTICLES, PLAYER_SPEED, PLAYER_FOCUS_SPEED,
    PLAYER_HITBOX_RADIUS, PLAYER_GRAZE_RADIUS, PLAYER_COLLECT_RADIUS, BOSS_MAX_HEALTH, BOSS_TOTAL_PHASES, POC_THRESHOLD_Y, DEATHBOMB_WINDOW, SCORE_EXTEND_1
} from '../constants';
import { Entity, EntityType, GameStats, GameMode } from '../types';
import { audioSynth } from '../services/AudioSynth';
import { Zap, Target, Crosshair } from 'lucide-react';
import { useInputStore } from '../store/useInputStore';
import { VirtualJoystick } from './ui/VirtualJoystick';
import { generateInfinitePattern } from '../utils/PattermEngine';


// --- ENTITY POOL ARCHITECTURE ---
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
    clear(particlePool: ParticlePool) {
        this.pool.forEach(e => {
            if (e.active && e.type === EntityType.BULLET_ENEMY) {
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
        for (let i = 0; i < count; i++) {
            const p = this.pool.find((x: any) => !x.active);
            if (p) {
                p.active = true; p.x = x; p.y = y;
                const a = Math.random() * Math.PI * 2;
                const s = Math.random() * speed;
                p.dx = Math.cos(a) * s; p.dy = Math.sin(a) * s;
                p.life = 20 + Math.random() * 20; p.maxLife = p.life; p.color = color; p.size = 1 + Math.random() * 2;
            }
        }
    }
    updateAndDraw(ctx: CanvasRenderingContext2D) {
        for (const p of this.pool) {
            if (!p.active) continue;
            p.x += p.dx; p.y += p.dy; p.life--;
            if (p.life <= 0) p.active = false;
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
    mode: GameMode;
}> = ({ customAudioSrc, setStats, onGameOver, isPaused, mode }) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState(false);


    // GAME STATE
    const player = useRef<Entity>({ id: -1, active: true, type: EntityType.PLAYER, x: 320, y: 400, dx: 0, dy: 0, width: 0, height: 0, color: PALETTE.PLAYER_CORE });
    const boss = useRef({
        active: true, x: 320, y: 100, health: BOSS_MAX_HEALTH, phase: 0, timer: 0, rotation: 0, currentPattern: null as any, patternTimer: 0, patternCooldown: 0, scale: 1 // For audio-reactive pulsing
    });
    const bomb = useRef({ active: false, radius: 0, timer: 0 });
    const shake = useRef(0);
    const invuln = useRef(0);
    const deathBombTimer = useRef(0);
    const bgScroll = useRef(0);
    const scoreExtends = useRef([false, false]);
    const stats = useRef<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60, hiscore: 0, pressure: 0, topography: 0 });
    const frames = useRef(0);


    // --- INITIALIZATION ---
    useEffect(() => {
        setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        const initAudio = () => audioSynth.init();
        window.addEventListener('click', initAudio);
        window.addEventListener('touchstart', initAudio);


        const saved = localStorage.getItem('SHRINE98_HISCORE');
        if (saved) stats.current.hiscore = parseInt(saved);


        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('touchstart', initAudio);
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
        // --- MODE OVERRIDE: INFINITE LIVES ---
        if (mode !== GameMode.ENDLESS) {
            stats.current.lives--;
        }
        // -------------------------------------

        stats.current.power = Math.max(0, stats.current.power - 20);
        stats.current.bombs = 3;
        invuln.current = 180;
        particlePool.spawn(player.current.x, player.current.y, PALETTE.PLAYER_AURA, 50, 6);
        bulletPool.clear(particlePool);

        for (let k = 0; k < 5; k++) itemPool.spawn(boss.current.x, boss.current.y, (Math.random() - 0.5) * 5, -5, PALETTE.ITEM_POWER, 8, 8, EntityType.ITEM_POWER);

        player.current.x = PLAY_AREA_X + PLAY_AREA_WIDTH / 2;
        player.current.y = PLAY_AREA_Y + PLAY_AREA_HEIGHT - 30;

        // Game Over should only trigger if NOT in Endless
        if (stats.current.lives < 0 && mode !== GameMode.ENDLESS) {
            if (stats.current.score > stats.current.hiscore) {
                localStorage.setItem('SHRINE98_HISCORE', stats.current.score.toString());
            }
            onGameOver();
        }
    };


    const firePlayer = (isFocused: boolean) => {
        audioSynth.playShoot();
        const pwr = stats.current.power;
        const level = Math.floor(pwr / 32) + 1;


        bulletPool.spawn(player.current.x, player.current.y - 10, 0, -20, PALETTE.BULLET_PLAYER, 6, 16, EntityType.BULLET_PLAYER);


        if (level >= 2) {
            const spread = isFocused ? 2 : 5;
            bulletPool.spawn(player.current.x - 8, player.current.y, -spread * 0.5, -18, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
            bulletPool.spawn(player.current.x + 8, player.current.y, spread * 0.5, -18, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
        }
        if (level >= 3) {
            const spread = isFocused ? 4 : 10;
            bulletPool.spawn(player.current.x - 16, player.current.y + 5, -spread, -16, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
            bulletPool.spawn(player.current.x + 16, player.current.y + 5, spread, -16, PALETTE.BULLET_PLAYER, 4, 12, EntityType.BULLET_PLAYER);
        }
    };


    const update = (dt: number) => {
        if (isPaused || !player.current.active) return;
        frames.current++;

        // 1. UPLINK TO GLOBAL INPUT STATE
        const inputState = useInputStore.getState();
        let cmds = inputState.commands;

        // --- GHOST NODE INTERCEPT ---
        if (inputState.isGhostMode && inputState.ghostData.length > 0) {
            if (frames.current < inputState.ghostData.length) {
                cmds = inputState.ghostData[frames.current]; // Playback
            } else {
                cmds = { UP: false, DOWN: false, LEFT: false, RIGHT: false, ACTION: false, BOMB: false, FOCUS: false }; // End of run
            }
        } else if (inputState.isRecording) {
            inputState.recordFrame(cmds); // Record
        }

        if (deathBombTimer.current > 0) {
            deathBombTimer.current--;
            if (cmds.BOMB && stats.current.bombs > 0) {
                triggerBomb();
            } else if (deathBombTimer.current <= 0) {
                finalizeDeath();
            }
            return;
        }


        // Aether Overload bomb mapping / Game Over
        if (mode === GameMode.AETHER_OVERLOAD) {
            if ((stats.current.pressure || 0) >= 100) {
                stats.current.pressure = 0;
                handlePlayerDeath(); // Overload
            } else if (cmds.BOMB && (stats.current.pressure || 0) > 0) {
                stats.current.pressure = 0; // release
                triggerBomb();
                cmds.BOMB = false;
            }
        }


        if (cmds.BOMB) triggerBomb();


        let spd = cmds.FOCUS ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
        if (mode === GameMode.AETHER_OVERLOAD) spd *= (1 + (stats.current.pressure || 0) / 100);


        if (cmds.UP) player.current.y -= spd;
        if (cmds.DOWN) player.current.y += spd;
        if (cmds.LEFT) player.current.x -= spd;
        if (cmds.RIGHT) player.current.x += spd;


        player.current.x = Math.max(PLAY_AREA_X + 5, Math.min(PLAY_AREA_X + PLAY_AREA_WIDTH - 5, player.current.x));
        player.current.y = Math.max(PLAY_AREA_Y + 5, Math.min(PLAY_AREA_Y + PLAY_AREA_HEIGHT - 5, player.current.y));


        const pocActive = player.current.y < POC_THRESHOLD_Y;


        if (mode === GameMode.AETHER_OVERLOAD) {
            const fireDelay = Math.max(1, Math.floor(4 - (stats.current.pressure || 0) / 25));
            if (frames.current % fireDelay === 0) firePlayer(cmds.FOCUS);
        } else {
            if (cmds.ACTION && frames.current % 4 === 0) firePlayer(cmds.FOCUS);
        }

        // --- ENEMY/BULLET LOGIC (UNCHANGED) ---
        // --- ENDLESS BOSS LOGIC START ---
        boss.current.timer++;
        boss.current.rotation += 0.02;
        boss.current.x = (PLAY_AREA_X + PLAY_AREA_WIDTH / 2) + Math.sin(boss.current.timer * 0.015) * 60;
        boss.current.y = 100 + Math.cos(boss.current.timer * 0.02) * 20;

        if (boss.current.active) {
            const t = boss.current.timer;
            const phase = stats.current.bossPhase;

            if (mode === GameMode.ENDLESS) {
                if (boss.current.health <= 0) {
                    stats.current.bossPhase++;
                    boss.current.health = BOSS_MAX_HEALTH + (stats.current.bossPhase * 1000);
                    boss.current.timer = 0;
                    bulletPool.clear(particlePool);
                    audioSynth.playExtend();
                    shake.current = 15;
                    boss.current.currentPattern = generateInfinitePattern(stats.current.bossPhase);
                }

                const p = boss.current.currentPattern || generateInfinitePattern(0);

                switch (p.type) {
                    case 'SPIRAL':
                        if (t % 2 === 0) {
                            const a = t * p.rotationSpeed;
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * p.speed, Math.sin(a) * p.speed, p.color);
                        }
                        break;
                    case 'FAN':
                        if (t % 30 === 0) {
                            for (let i = 0; i < p.count; i++) {
                                const a = (Math.PI * 2 / p.count) * i + (t * 0.01);
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * p.speed, Math.sin(a) * p.speed, p.color);
                            }
                        }
                        break;
                    case 'AIMED':
                        if (t % 40 === 0) {
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            for (let i = -2; i <= 2; i++) {
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.15) * (p.speed + 1), Math.sin(aim + i * 0.15) * (p.speed + 1), p.color);
                            }
                        }
                        break;
                    case 'BURST':
                        if (t % 60 === 0) {
                            for (let j = 0; j < 3; j++) {
                                const offset = j * 0.5;
                                for (let i = 0; i < Math.floor(p.count / 2); i++) {
                                    const a = (Math.PI * 2 / (p.count / 2)) * i + offset;
                                    bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * p.speed, Math.sin(a) * p.speed, p.color);
                                }
                            }
                        }
                        break;
                }
            }
            // --- ENDLESS BOSS LOGIC END ---

            if (mode === GameMode.TELLURIC_RESONANCE) {
                const spec = audioSynth.getSpectrum();
                if (spec) {
                    let lowAvg = 0, highAvg = 0;
                    for (let i = 0; i < 5; i++) lowAvg += spec[i];
                    for (let i = 100; i < 110; i++) highAvg += spec[i];
                    lowAvg /= 5; highAvg /= 10;

                    if (highAvg > 160 && t % 3 === 0) {
                        const a = t * 0.1;
                        bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 6, Math.sin(a) * 6, '#FF003C', 4, 16);
                        bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a + Math.PI) * 6, Math.sin(a + Math.PI) * 6, '#E056FD', 4, 16);
                    }
                    if (lowAvg > 220 && t % 40 === 0) {
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i;
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 2.5, Math.sin(a) * 2.5, '#00FF00', 14, 14);
                        }
                    }
                }
            } else {
                // --- START NEW CODE: TEN ADDITIONAL BOSS PHASES & SCALING DIFFICULTY (15 PHASES TOTAL) ---
                switch (phase) {
                    case 0: // Phase 1/15: Sub-Zero Radial Expansion
                        if (t % 20 === 0) {
                            const count = 20;
                            for (let i = 0; i < count; i++) {
                                const a = (Math.PI * 2 / count) * i + t * 0.05;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 3, Math.sin(a) * 3, PALETTE.BULLET_ENEMY, 8, 8);
                            }
                        }
                        break;
                    case 1: // Phase 2/15: Dual Helix Counter-Rotating Spirals
                        if (t % 4 === 0) {
                            const a = t * 0.2;
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 4, Math.sin(a) * 4, '#FF00FF', 8, 8);
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a + 2) * 4, Math.sin(a + 2) * 4, '#00FFFF', 8, 8);
                        }
                        break;
                    case 2: // Phase 3/15: Aimed 5-Way Fan Barrage
                        if (t % 50 === 0) {
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            for (let i = -2; i <= 2; i++) {
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.12) * 4.8, Math.sin(aim + i * 0.12) * 4.8, '#FF003C', 10, 10);
                            }
                        }
                        break;
                    case 3: // Phase 4/15: Star Nova Burst
                        if (t % 45 === 0) {
                            for (let i = 0; i < 8; i++) {
                                const baseA = (Math.PI * 2 / 8) * i + t * 0.03;
                                for (let j = 1; j <= 3; j++) {
                                    bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(baseA) * (2.5 + j * 0.8), Math.sin(baseA) * (2.5 + j * 0.8), '#E056FD', 8, 8);
                                }
                            }
                        }
                        break;
                    case 4: // Phase 5/15: Accelerating Double Spiral Cannon
                        if (t % 3 === 0) {
                            const a1 = t * 0.15;
                            const a2 = -t * 0.15;
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a1) * 5.2, Math.sin(a1) * 5.2, '#39FF14', 6, 6);
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a2) * 5.2, Math.sin(a2) * 5.2, '#FFD700', 6, 6);
                        }
                        break;
                    case 5: // Phase 6/15: Homing Seeker Swarm + Outer Curtain Ring
                        if (t % 35 === 0) {
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            for (let i = -1; i <= 1; i++) {
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.25) * 5.5, Math.sin(aim + i * 0.25) * 5.5, '#FF003C', 8, 8);
                            }
                            for (let i = 0; i < 16; i++) {
                                const a = (Math.PI * 2 / 16) * i;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 2.8, Math.sin(a) * 2.8, '#00F3FF', 8, 8);
                            }
                        }
                        break;
                    case 6: // Phase 7/15: Intersecting Crossfire Grid Matrix
                        if (t % 40 === 0) {
                            for (let i = -3; i <= 3; i++) {
                                const offsetX = i * 25;
                                bulletPool.spawn(boss.current.x + offsetX, boss.current.y, 0, 4.5, '#E056FD', 8, 8);
                                const a = (Math.PI / 4) + i * 0.15;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 4.5, Math.sin(a) * 4.5, '#FF003C', 8, 8);
                            }
                        }
                        break;
                    case 7: // Phase 8/15: Dynamic Void Vortex Shockwave
                        if (t % 12 === 0) {
                            const a = t * 0.25;
                            const spd = 3.5 + Math.sin(t * 0.05) * 1.5;
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * spd, Math.sin(a) * spd, '#00FFFF', 8, 8);
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a + Math.PI) * spd, Math.sin(a + Math.PI) * spd, '#FF00FF', 8, 8);
                        }
                        break;
                    case 8: // Phase 9/15: 12-Petal Blossom Cascade
                        if (t % 30 === 0) {
                            for (let i = 0; i < 12; i++) {
                                const a = (Math.PI * 2 / 12) * i + Math.sin(t * 0.1) * 0.5;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 5.8, Math.sin(a) * 5.8, '#FFD700', 8, 8);
                            }
                        }
                        break;
                    case 9: // Phase 10/15: High-Speed 3-Stream Needle Barrage
                        if (t % 10 === 0) {
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim) * 7.5, Math.sin(aim) * 7.5, '#FF003C', 4, 16);
                            bulletPool.spawn(boss.current.x - 15, boss.current.y, Math.cos(aim - 0.1) * 7.2, Math.sin(aim - 0.1) * 7.2, '#E056FD', 4, 16);
                            bulletPool.spawn(boss.current.x + 15, boss.current.y, Math.cos(aim + 0.1) * 7.2, Math.sin(aim + 0.1) * 7.2, '#E056FD', 4, 16);
                        }
                        break;
                    case 10: // Phase 11/15: Chaos Explosion Nova
                        if (t % 25 === 0) {
                            for (let i = 0; i < 18; i++) {
                                const a = Math.random() * Math.PI * 2;
                                const spd = 3.5 + Math.random() * 4.5;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * spd, Math.sin(a) * spd, '#39FF14', 8, 8);
                            }
                        }
                        break;
                    case 11: // Phase 12/15: Concentric Shockwave Rings + Sniper Aimed Shots
                        if (t % 35 === 0) {
                            for (let i = 0; i < 28; i++) {
                                const a = (Math.PI * 2 / 28) * i;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 4.2, Math.sin(a) * 4.2, '#00F3FF', 8, 8);
                            }
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            for (let i = -1; i <= 1; i++) {
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.08) * 8.0, Math.sin(aim + i * 0.08) * 8.0, '#FF003C', 6, 12);
                            }
                        }
                        break;
                    case 12: // Phase 13/15: Quad Cross-Spiral Storm + Aimed Fan Bursts
                        if (t % 2 === 0) {
                            for (let k = 0; k < 4; k++) {
                                const a = t * 0.15 + (Math.PI / 2) * k;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 6.0, Math.sin(a) * 6.0, '#FF00FF', 6, 6);
                            }
                        }
                        if (t % 40 === 0) {
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            for (let i = -2; i <= 2; i++) {
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.15) * 6.5, Math.sin(aim + i * 0.15) * 6.5, '#FFD700', 8, 8);
                            }
                        }
                        break;
                    case 13: // Phase 14/15: Imploding Singularity Sphere & Radial Eruption
                        if (t % 50 === 0) {
                            for (let i = 0; i < 36; i++) {
                                const a = (Math.PI * 2 / 36) * i + (t * 0.02);
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 6.8, Math.sin(a) * 6.8, '#E056FD', 8, 8);
                            }
                        }
                        break;
                    case 14: default: // Phase 15/15: Absolute Void Overdrive (Climax Final Phase)
                        if (t % 2 === 0) {
                            const a1 = t * 0.2;
                            const a2 = -t * 0.2;
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a1) * 6.5, Math.sin(a1) * 6.5, '#FF003C', 8, 8);
                            bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a2) * 6.5, Math.sin(a2) * 6.5, '#00F3FF', 8, 8);
                        }
                        if (t % 25 === 0) {
                            const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                            for (let i = -5; i <= 5; i++) {
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.1) * 7.5, Math.sin(aim + i * 0.1) * 7.5, '#FFD700', 6, 14);
                            }
                        }
                        break;
                }
                // --- END NEW CODE ---
            }
        }


        bulletPool.pool.forEach(b => {
            if (!b.active) return;
            b.x += b.dx; b.y += b.dy;
            if (b.x < PLAY_AREA_X - 20 || b.x > PLAY_AREA_X + PLAY_AREA_WIDTH + 20 || b.y < PLAY_AREA_Y - 20 || b.y > PLAY_AREA_Y + PLAY_AREA_HEIGHT + 20) b.active = false;


            if (bomb.current.active && b.type === EntityType.BULLET_ENEMY) {
                const dx = b.x - player.current.x; const dy = b.y - player.current.y;
                if (Math.sqrt(dx * dx + dy * dy) < bomb.current.radius) {
                    b.active = false;
                    itemPool.spawn(b.x, b.y, 0, -2, PALETTE.ITEM_POINT, 8, 8, EntityType.ITEM_POINT);
                }
            }


            if (b.type === EntityType.BULLET_ENEMY && player.current.active && invuln.current <= 0 && deathBombTimer.current <= 0) {
                const dx = b.x - player.current.x; const dy = b.y - player.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (mode === GameMode.PHASE_SHIFT && cmds.FOCUS) {
                    if (dist < 80) {
                        b.x -= dx * 0.05;
                        b.y -= dy * 0.05;
                        if (dist < PLAYER_HITBOX_RADIUS + 10) {
                            b.active = false;
                            audioSynth.playGraze();
                            stats.current.bombs = Math.min(stats.current.bombs + 0.05, 5); // Energy Scavenging
                        }
                    }
                } else if (dist < PLAYER_HITBOX_RADIUS + 3) {
                    b.active = false;
                    handlePlayerDeath();
                } else if (dist < PLAYER_GRAZE_RADIUS && !b.grazed) {
                    b.grazed = true; stats.current.graze++; stats.current.score += 500;
                    if (mode === GameMode.AETHER_OVERLOAD) stats.current.pressure = Math.min(100, (stats.current.pressure || 0) + 5);
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
                const dist = Math.sqrt(dx * dx + dy * dy);
                i.x += (dx / dist) * 12;
                i.y += (dy / dist) * 12;
            } else {
                i.y += 2.5;
            }


            const dx = i.x - player.current.x; const dy = i.y - player.current.y;
            if (Math.sqrt(dx * dx + dy * dy) < PLAYER_COLLECT_RADIUS) {
                i.active = false;
                audioSynth.playItem();
                if (i.type === EntityType.ITEM_POWER) {
                    stats.current.power = Math.min(128, stats.current.power + 1);
                    stats.current.score += 100;
                } else if (i.type === EntityType.ITEM_LIFE) {
                    stats.current.lives++;
                    audioSynth.playExtend();
                } else if (i.type === EntityType.ITEM_BIOCHAR) {
                    stats.current.topography = Math.min(90, (stats.current.topography || 0) + 1);
                    stats.current.score += 200;
                } else {
                    stats.current.score += 5000;
                }
            }
            if (i.y > SCREEN_HEIGHT) i.active = false;
        });


        bulletPool.pool.forEach(b => {
            if (b.active && b.type === EntityType.BULLET_PLAYER) {
                const dx = b.x - boss.current.x; const dy = b.y - boss.current.y;
                if (Math.sqrt(dx * dx + dy * dy) < 30) {
                    if (mode === GameMode.OBSIDIAN_SCRUBBER && Math.random() < 0.1) {
                        itemPool.spawn(b.x, b.y, (Math.random() - 0.5) * 2, -2, '#E056FD', 6, 6, EntityType.ITEM_BIOCHAR);
                    }
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
                        for (let k = 0; k < 15; k++) itemPool.spawn(boss.current.x, boss.current.y, (Math.random() - 0.5) * 3, -4, PALETTE.ITEM_POWER, 8, 8, EntityType.ITEM_POWER)
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
        if (frames.current % 10 === 0) setStats({ ...stats.current });
    };


    const draw = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;


        const cmds = useInputStore.getState().commands; // Read state for visual feedback


        const sx = (Math.random() - 0.5) * shake.current;
        const sy = (Math.random() - 0.5) * shake.current;
        ctx.save();
        ctx.translate(sx, sy);


        // BACKGROUND
        ctx.fillStyle = PALETTE.BG_VOID; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = "rgba(10, 0, 16, 0.8)"; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);


        if (mode === GameMode.OBSIDIAN_SCRUBBER) {
            const topogHeight = (PLAY_AREA_HEIGHT * (stats.current.topography || 0)) / 100;
            ctx.fillStyle = "rgba(224, 86, 253, 0.15)";
            ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y + PLAY_AREA_HEIGHT - topogHeight, PLAY_AREA_WIDTH, topogHeight);
        }


        ctx.strokeStyle = PALETTE.BG_GRID; ctx.lineWidth = 1;
        for (let y = bgScroll.current; y < SCREEN_HEIGHT; y += 40) {
            ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, y); ctx.lineTo(PLAY_AREA_X + PLAY_AREA_WIDTH, y); ctx.stroke();
        }
        ctx.strokeRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);


        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, POC_THRESHOLD_Y); ctx.lineTo(PLAY_AREA_X + PLAY_AREA_WIDTH, POC_THRESHOLD_Y); ctx.stroke();
        ctx.setLineDash([]);


        if (cmds.FOCUS) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS, 0, Math.PI * 2);
            ctx.fill();


            ctx.strokeStyle = '#FF003C';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS + 1, 0, Math.PI * 2);
            ctx.stroke();


            ctx.strokeStyle = '#E056FD';
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(player.current.x, player.current.y, 15, frames.current * 0.05, frames.current * 0.05 + Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
        }


        // BOSS
        if (boss.current.active) {
            ctx.save();
            ctx.translate(boss.current.x, boss.current.y);
            ctx.rotate(boss.current.rotation);
            ctx.strokeStyle = PALETTE.BOSS_AURA; ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 / 6) * i;
                ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
            }
            ctx.closePath(); ctx.stroke();
            ctx.fillStyle = PALETTE.BOSS; ctx.fill();
            ctx.restore();
        }


        const hpWidth = PLAY_AREA_WIDTH;
        ctx.fillStyle = "#330000"; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth, 5);
        // --- START NEW CODE: SCALING BOSS PHASE COLOR PALETTE ---
        const phaseMax = BOSS_MAX_HEALTH / BOSS_TOTAL_PHASES;
        const phaseCurrent = boss.current.health % phaseMax || phaseMax;
        const pct = phaseCurrent / phaseMax;
        const phaseColors = ['#00FF00', '#39FF14', '#00F3FF', '#00FFFF', '#E056FD', '#FF00FF', '#FFD700', '#FFA500', '#FF4500', '#FF003C', '#FF0055', '#D100D1', '#9900FF', '#00E5FF', '#FFFFFF'];
        ctx.fillStyle = phaseColors[boss.current.phase % phaseColors.length] || '#FF003C';
        ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth * pct, 5);
        // --- END NEW CODE ---


        if (player.current.active && (invuln.current % 4 < 2)) {
            ctx.fillStyle = PALETTE.PLAYER_AURA;
            if (frames.current % 4 === 0) {
                ctx.globalAlpha = 0.3;
                ctx.beginPath(); ctx.moveTo(player.current.x, player.current.y - 15); ctx.lineTo(player.current.x + 10, player.current.y + 10); ctx.lineTo(player.current.x - 10, player.current.y + 10); ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            ctx.beginPath(); ctx.moveTo(player.current.x, player.current.y - 15); ctx.lineTo(player.current.x + 10, player.current.y + 10); ctx.lineTo(player.current.x - 10, player.current.y + 10); ctx.fill();
            ctx.fillStyle = PALETTE.PLAYER_CORE; ctx.fillRect(player.current.x - 3, player.current.y - 12, 6, 6);


            if (cmds.FOCUS) {
                const rot = frames.current * 0.1;
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS, 0, Math.PI * 2); ctx.stroke();


                ctx.strokeStyle = PALETTE.PLAYER_AURA;
                ctx.beginPath(); ctx.arc(player.current.x, player.current.y, 25, rot, rot + Math.PI); ctx.stroke();
            }
        }


        if (bomb.current.active) {
            ctx.fillStyle = `rgba(255, 255, 255, ${bomb.current.timer / 120})`;
            ctx.beginPath(); ctx.arc(player.current.x, player.current.y, bomb.current.radius, 0, Math.PI * 2); ctx.fill();
        }


        particlePool.updateAndDraw(ctx);
        itemPool.pool.forEach(i => {
            if (!i.active) return;
            ctx.fillStyle = i.color; ctx.fillRect(i.x - 4, i.y - 4, 8, 8);
            ctx.fillStyle = '#000'; ctx.font = "8px monospace";
            ctx.fillText(i.type === EntityType.ITEM_POWER ? "P" : i.type === EntityType.ITEM_BIOCHAR ? "B" : "S", i.x - 2, i.y + 2);
        });
        bulletPool.pool.forEach(b => {
            if (!b.active) return;
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
        });


        ctx.restore();


        // UI
        // UI (Lives Indicator)
        const uiX = PLAY_AREA_X + PLAY_AREA_WIDTH + 20;

        // If Endless, show infinite symbol, otherwise show hearts
        const livesDisplay = mode === GameMode.ENDLESS ? "∞" : "♥".repeat(Math.max(0, stats.current.lives));
        ctx.fillText(`LIVES: ${livesDisplay}`, uiX, 190);



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
        ctx.fillStyle = PALETTE.ITEM_POWER; ctx.fillRect(uiX, 270, (stats.current.power / 128) * 100, 8);
        ctx.fillStyle = "#fff";
        ctx.fillText(`GRAZE: ${stats.current.graze}`, uiX, 310);

        // --- START NEW CODE: BOSS PHASE UI HUD DISPLAY ---
        ctx.fillStyle = "#E056FD";
        ctx.fillText(`PHASE: ${boss.current.phase + 1}/${BOSS_TOTAL_PHASES}`, uiX, 340);
        // --- END NEW CODE ---

        if (mode === GameMode.AETHER_OVERLOAD) {
            ctx.fillStyle = '#FF003C';
            ctx.fillText(`PRESSURE: ${Math.floor(stats.current.pressure || 0)}%`, uiX, 370);
        } else if (mode === GameMode.OBSIDIAN_SCRUBBER) {
            ctx.fillStyle = '#E056FD';
            ctx.fillText(`TOPOGRAPHY: ${stats.current.topography}%`, uiX, 370);
        }


        if (deathBombTimer.current > 0) {
            ctx.fillStyle = "#FF0000"; ctx.fillText("!! DEATH !!", uiX, 350);
        }

        if (useInputStore.getState().isGhostMode) {
            ctx.fillStyle = '#FF003C';
            ctx.fillText("GHOST_NODE_ACTIVE", uiX, 380);
        } else if (useInputStore.getState().isRecording) {
            ctx.fillStyle = '#FF003C';
            ctx.fillText("REC_GHOST_DATA", uiX, 380);
        }
    };


    useGameLoop((dt) => { update(dt); draw(); }, !isPaused);


    const canvasClassNames = `w-full h-full object-contain ${mode === GameMode.AETHER_OVERLOAD && (stats.current.pressure || 0) > 80 ? 'chromatic-aberration-pulse'
        : mode === GameMode.TELLURIC_RESONANCE ? 'low-latency-grid shadow-[0_0_50px_rgba(255,0,60,0.5)]'
            : 'shadow-[0_0_30px_rgba(224,86,253,0.3)]'
        }`;


    return (
        <div className="relative w-full h-full flex justify-center items-center">
            {bomb.current.active && (
                <div className="absolute inset-0 luminescent-discharge pointer-events-none" />
            )}
            <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}
                className={canvasClassNames}
            />


            {/* MOBILE HARDWARE OVERRIDE */}
            {isMobile && (
                <>
                    {/* Left Haptic Node */}
                    <div className="absolute bottom-12 left-12 z-50">
                        <VirtualJoystick size={150} stickSize={60} />
                    </div>


                    {/* Right Logic Nodes */}
                    <div className="absolute bottom-16 right-16 flex flex-col gap-6 z-50">
                        <div className="flex gap-4">
                            <button
                                className="w-16 h-16 rounded-full bg-[#E056FD]/30 border-2 border-[#E056FD] active:bg-[#E056FD] text-white font-bold flex flex-col items-center justify-center select-none touch-none"
                                onTouchStart={(e) => { e.preventDefault(); useInputStore.getState().setCommand('FOCUS', true); }}
                                onTouchEnd={(e) => { e.preventDefault(); useInputStore.getState().setCommand('FOCUS', false); }}
                            >
                                <Target size={20} />
                                <span className="text-[8px]">FOCUS</span>
                            </button>
                            <button
                                className="w-16 h-16 rounded-full bg-[#FF003C]/30 border-2 border-[#FF003C] active:bg-[#FF003C] text-white font-bold flex flex-col items-center justify-center select-none touch-none"
                                onTouchStart={(e) => { e.preventDefault(); useInputStore.getState().setCommand('BOMB', true); }}
                                onTouchEnd={(e) => { e.preventDefault(); useInputStore.getState().setCommand('BOMB', false); }}
                            >
                                <Zap size={20} />
                                <span className="text-[8px]">BOMB</span>
                            </button>
                        </div>
                        <button
                            className="w-full h-20 rounded-full bg-white/10 border-2 border-white active:bg-white active:text-black text-white font-bold flex flex-col items-center justify-center select-none touch-none"
                            onTouchStart={(e) => { e.preventDefault(); useInputStore.getState().setCommand('ACTION', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); useInputStore.getState().setCommand('ACTION', false); }}
                        >
                            <Crosshair size={24} className="mb-1" />
                            <span className="text-[10px] tracking-widest">FIRE</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};