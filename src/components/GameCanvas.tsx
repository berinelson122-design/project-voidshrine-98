import React, { useRef, useEffect, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import {
    PALETTE, SCREEN_WIDTH, SCREEN_HEIGHT, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT, PLAY_AREA_X, PLAY_AREA_Y,
    MAX_BULLETS, MAX_ITEMS, MAX_PARTICLES, PLAYER_SPEED, PLAYER_FOCUS_SPEED,
    PLAYER_HITBOX_RADIUS, PLAYER_GRAZE_RADIUS, PLAYER_COLLECT_RADIUS, BOSS_MAX_HEALTH, BOSS_TOTAL_PHASES, POC_THRESHOLD_Y, DEATHBOMB_WINDOW, SCORE_EXTEND_1
} from '../constants';
import { Entity, EntityType, GameStats, GameMode, NULL_OMENS, NullOmenDefinition } from '../types';
import { audioSynth } from '../services/AudioSynth';
import { Zap, Target, Crosshair, Sparkles } from 'lucide-react';
import { useInputStore } from '../store/useInputStore';
import { VirtualJoystick } from './ui/VirtualJoystick';
import { generateInfinitePattern } from '../utils/PatternEngine';

// --- ENTITY POOL ARCHITECTURE ---
class EntityPool {
    pool: Entity[];
    constructor(size: number, defaultType: EntityType) {
        this.pool = new Array(size).fill(null).map((_, i) => ({
            id: i, active: false, x: 0, y: 0, dx: 0, dy: 0, width: 0, height: 0, color: '#fff', type: defaultType, homing: false
        }));
    }
    spawn(x: number, y: number, dx: number, dy: number, color: string = '#fff', w: number = 8, h: number = 8, type: EntityType = EntityType.BULLET_ENEMY, life = 0) {
        const e = this.pool.find(i => !i.active);
        if (e) {
            e.active = true; e.x = x; e.y = y; e.dx = dx; e.dy = dy;
            e.color = color; e.width = w; e.height = h; e.grazed = false; e.type = type; e.homing = false;
            e.rotation = Math.atan2(dy, dx);
            e.life = life;
            e.maxLife = life;
        }
    }
    clear(particlePool: ParticlePool, itemPool?: EntityPool) {
        this.pool.forEach(e => {
            if (e.active && e.type === EntityType.BULLET_ENEMY) {
                e.active = false;
                particlePool.spawn(e.x, e.y, e.color, 2, 2);
                if (itemPool && Math.random() < 0.3) {
                    itemPool.spawn(e.x, e.y, 0, -2, PALETTE.ITEM_POINT, 8, 8, EntityType.ITEM_POINT);
                }
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
const spellPool = new EntityPool(200, EntityType.SPELL_SHARD);
const particlePool = new ParticlePool();

export const GameCanvas: React.FC<{
    customAudioSrc: string | null;
    setStats: (s: GameStats) => void;
    onGameOver: () => void;
    isPaused: boolean;
    mode: GameMode;
}> = ({ setStats, onGameOver, isPaused, mode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [availableOmen, setAvailableOmen] = useState<NullOmenDefinition | null>(null);

    // GAME REFS
    const player = useRef<Entity>({ id: -1, active: true, type: EntityType.PLAYER, x: 320, y: 400, dx: 0, dy: 0, width: 0, height: 0, color: PALETTE.PLAYER_CORE });
    const boss = useRef({
        active: true, x: 320, y: 100, health: BOSS_MAX_HEALTH, phase: 0, timer: 0, rotation: 0, currentPattern: null as any, scale: 1
    });
    const bomb = useRef({ active: false, radius: 0, timer: 0 });
    const shake = useRef(0);
    const invuln = useRef(0);
    const deathBombTimer = useRef(0);
    const bgScroll = useRef(0);
    const scoreExtends = useRef([false, false]);
    const stats = useRef<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60, hiscore: 0, pressure: 0, topography: 0, activeOmen: null });
    const frames = useRef(0);

    // --- NULL OMEN ACTIVE STATE ---
    const activeSpell = useRef<{
        omen: NullOmenDefinition | null;
        timer: number;
        bannerSlide: number;
        stasisActive: boolean;
    }>({
        omen: null,
        timer: 0,
        bannerSlide: 0,
        stasisActive: false,
    });

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

    // Compute highest unlocked Null Omen based on Power milestones (32, 64, 96, 128)
    const getHighestUnlockedOmen = (pwr: number): NullOmenDefinition | null => {
        const eligible = NULL_OMENS.filter(o => pwr >= o.requiredPower);
        if (eligible.length === 0) return null;
        return eligible[eligible.length - 1];
    };

    const triggerBomb = () => {
        if (stats.current.bombs > 0 && !bomb.current.active) {
            stats.current.bombs--;
            bomb.current.active = true; bomb.current.timer = 120; bomb.current.radius = 10;
            shake.current = 15;
            audioSynth.playBomb();
            bulletPool.clear(particlePool, itemPool);
            if (deathBombTimer.current > 0) {
                deathBombTimer.current = 0;
                invuln.current = 120;
            }
        }
    };

    // --- START NEW CODE: LAUNCH NULL OMEN SPELL CARD PROTOCOL ---
    const launchNullOmen = () => {
        if (activeSpell.current.timer > 0) return; // Spell currently in execution
        const omen = getHighestUnlockedOmen(stats.current.power);
        if (!omen) return;

        // Deduct power points cost
        stats.current.power = Math.max(0, stats.current.power - omen.powerCost);
        activeSpell.current.omen = omen;
        activeSpell.current.timer = omen.duration;
        activeSpell.current.bannerSlide = 0;
        activeSpell.current.stasisActive = omen.id === 'thermodynamic_shatter';

        stats.current.activeOmen = `${omen.sign} [${omen.name}]`;
        stats.current.score += 250000;

        audioSynth.playSpellCard();
        shake.current = 25;
        bulletPool.clear(particlePool, itemPool);
        invuln.current = omen.duration + 60;

        // Trigger unique mechanical payload
        switch (omen.id) {
            case 'hollow_abyss':
                boss.current.health = Math.max(1, boss.current.health - 800);
                particlePool.spawn(boss.current.x, boss.current.y, omen.color, 40, 8);
                break;

            case 'tearing_darkness':
                audioSynth.playLaser();
                boss.current.health = Math.max(1, boss.current.health - 1600);
                shake.current = 35;
                break;

            case 'byte_basher':
                for (let i = 0; i < 32; i++) {
                    const a = (Math.PI * 2 / 32) * i;
                    spellPool.spawn(player.current.x, player.current.y, Math.cos(a) * 12, Math.sin(a) * 12, omen.color, 6, 18, EntityType.SPELL_SHARD, 120);
                }
                boss.current.health = Math.max(1, boss.current.health - 2500);
                break;

            case 'thermodynamic_shatter':
                audioSynth.playShatter();
                boss.current.health = Math.max(1, boss.current.health - 4500);
                shake.current = 50;
                particlePool.spawn(PLAY_AREA_X + PLAY_AREA_WIDTH / 2, PLAY_AREA_Y + PLAY_AREA_HEIGHT / 2, '#FFFFFF', 80, 15);
                break;
        }
    };
    // --- END NEW CODE ---

    const handlePlayerDeath = () => {
        if (deathBombTimer.current > 0) return;
        deathBombTimer.current = DEATHBOMB_WINDOW;
        audioSynth.playHit();
        shake.current = 30;
    };

    const finalizeDeath = () => {
        if (mode !== GameMode.ENDLESS) {
            stats.current.lives--;
        }
        stats.current.power = Math.max(0, stats.current.power - 20);
        stats.current.bombs = 3;
        invuln.current = 180;
        particlePool.spawn(player.current.x, player.current.y, PALETTE.PLAYER_AURA, 50, 6);
        bulletPool.clear(particlePool, itemPool);

        for (let k = 0; k < 5; k++) itemPool.spawn(boss.current.x, boss.current.y, (Math.random() - 0.5) * 5, -5, PALETTE.ITEM_POWER, 8, 8, EntityType.ITEM_POWER);

        player.current.x = PLAY_AREA_X + PLAY_AREA_WIDTH / 2;
        player.current.y = PLAY_AREA_Y + PLAY_AREA_HEIGHT - 30;

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

    const update = () => {
        if (isPaused || !player.current.active) return;
        frames.current++;

        const inputState = useInputStore.getState();
        let cmds = inputState.commands;

        // Update available omen for Mobile HUD Button
        const activeOmenForUi = getHighestUnlockedOmen(stats.current.power);
        setAvailableOmen(activeOmenForUi);

        if (inputState.isGhostMode && inputState.ghostData.length > 0) {
            if (frames.current < inputState.ghostData.length) {
                cmds = inputState.ghostData[frames.current];
            } else {
                cmds = { UP: false, DOWN: false, LEFT: false, RIGHT: false, ACTION: false, BOMB: false, FOCUS: false, SPELL: false };
            }
        } else if (inputState.isRecording) {
            inputState.recordFrame(cmds);
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

        // --- START NEW CODE: NULL OMEN TRIGGER POLLING ---
        if (cmds.SPELL) {
            launchNullOmen();
            useInputStore.getState().setCommand('SPELL', false);
        }
        // --- END NEW CODE ---

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

        // --- UPDATE ACTIVE NULL OMEN DURATION & EFFECTS ---
        if (activeSpell.current.timer > 0) {
            activeSpell.current.timer--;
            activeSpell.current.bannerSlide = Math.min(1, activeSpell.current.bannerSlide + 0.1);

            const omen = activeSpell.current.omen;
            if (omen) {
                // Hollow Abyss: Pull enemy bullets towards center and vacuum them
                if (omen.id === 'hollow_abyss' && frames.current % 3 === 0) {
                    bulletPool.pool.forEach(b => {
                        if (b.active && b.type === EntityType.BULLET_ENEMY) {
                            const dx = boss.current.x - b.x;
                            const dy = boss.current.y - b.y;
                            const dist = Math.hypot(dx, dy);
                            if (dist < 180) {
                                b.x += (dx / dist) * 8;
                                b.y += (dy / dist) * 8;
                                if (dist < 25) {
                                    b.active = false;
                                    itemPool.spawn(b.x, b.y, 0, -2, PALETTE.ITEM_POINT, 8, 8, EntityType.ITEM_POINT);
                                }
                            }
                        }
                    });
                }
            }

            if (activeSpell.current.timer <= 0) {
                activeSpell.current.omen = null;
                stats.current.activeOmen = null;
            }
        }

        // --- BOSS PATTERN LOGIC ---
        // If thermodynamic shatter is active, freeze boss patterns
        if (!activeSpell.current.stasisActive || activeSpell.current.timer <= 0) {
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
                        bulletPool.clear(particlePool, itemPool);
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
                } else {
                    // Standard Boss Phase Pattern
                    switch (phase) {
                        case 0:
                            if (t % 20 === 0) {
                                for (let i = 0; i < 20; i++) {
                                    const a = (Math.PI * 2 / 20) * i + t * 0.05;
                                    bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 3, Math.sin(a) * 3, PALETTE.BULLET_ENEMY, 8, 8);
                                }
                            }
                            break;
                        case 1:
                            if (t % 4 === 0) {
                                const a = t * 0.2;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a) * 4, Math.sin(a) * 4, '#FF00FF', 8, 8);
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a + 2) * 4, Math.sin(a + 2) * 4, '#00FFFF', 8, 8);
                            }
                            break;
                        case 2:
                            if (t % 50 === 0) {
                                const aim = Math.atan2(player.current.y - boss.current.y, player.current.x - boss.current.x);
                                for (let i = -2; i <= 2; i++) {
                                    bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(aim + i * 0.12) * 4.8, Math.sin(aim + i * 0.12) * 4.8, '#FF003C', 10, 10);
                                }
                            }
                            break;
                        default:
                            if (t % 2 === 0) {
                                const a1 = t * 0.2;
                                bulletPool.spawn(boss.current.x, boss.current.y, Math.cos(a1) * 6.5, Math.sin(a1) * 6.5, '#FF003C', 8, 8);
                            }
                            break;
                    }
                }
            }
        }

        // --- BULLET POOL TICK ---
        bulletPool.pool.forEach(b => {
            if (!b.active) return;
            b.x += b.dx; b.y += b.dy;
            if (b.x < PLAY_AREA_X - 20 || b.x > PLAY_AREA_X + PLAY_AREA_WIDTH + 20 || b.y < PLAY_AREA_Y - 20 || b.y > PLAY_AREA_Y + PLAY_AREA_HEIGHT + 20) {
                b.active = false;
            }

            if (bomb.current.active && b.type === EntityType.BULLET_ENEMY) {
                const dx = b.x - player.current.x; const dy = b.y - player.current.y;
                if (Math.hypot(dx, dy) < bomb.current.radius) {
                    b.active = false;
                    itemPool.spawn(b.x, b.y, 0, -2, PALETTE.ITEM_POINT, 8, 8, EntityType.ITEM_POINT);
                }
            }

            if (b.type === EntityType.BULLET_ENEMY && player.current.active && invuln.current <= 0 && deathBombTimer.current <= 0) {
                const dx = b.x - player.current.x; const dy = b.y - player.current.y;
                const dist = Math.hypot(dx, dy);

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

        // --- SPELL SHARD PROJECTILES ---
        spellPool.pool.forEach(s => {
            if (!s.active) return;
            const dx = boss.current.x - s.x;
            const dy = boss.current.y - s.y;
            const dist = Math.hypot(dx, dy);
            s.x += (dx / dist) * 16;
            s.y += (dy / dist) * 16;
            if (dist < 30) {
                s.active = false;
                boss.current.health = Math.max(0, boss.current.health - 50);
                stats.current.score += 5000;
                particlePool.spawn(s.x, s.y, s.color, 4, 4);
            }
        });

        // --- ITEM POOL TICK ---
        itemPool.pool.forEach(i => {
            if (!i.active) return;
            if (pocActive || i.homing) {
                i.homing = true;
                const dx = player.current.x - i.x;
                const dy = player.current.y - i.y;
                const dist = Math.hypot(dx, dy);
                i.x += (dx / dist) * 12;
                i.y += (dy / dist) * 12;
            } else {
                i.y += 2.5;
            }

            const dx = i.x - player.current.x; const dy = i.y - player.current.y;
            if (Math.hypot(dx, dy) < PLAYER_COLLECT_RADIUS) {
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

        // --- PLAYER BULLETS HIT DETECTION ---
        bulletPool.pool.forEach(b => {
            if (b.active && b.type === EntityType.BULLET_PLAYER) {
                const dx = b.x - boss.current.x; const dy = b.y - boss.current.y;
                if (Math.hypot(dx, dy) < 30) {
                    b.active = false;
                    boss.current.health -= 10;
                    stats.current.score += 100;
                    particlePool.spawn(b.x, b.y, PALETTE.BOSS_AURA, 1, 2);

                    const hpPerPhase = BOSS_MAX_HEALTH / BOSS_TOTAL_PHASES;
                    const currentPhase = Math.floor((BOSS_MAX_HEALTH - boss.current.health) / hpPerPhase);
                    if (currentPhase > boss.current.phase && currentPhase < BOSS_TOTAL_PHASES) {
                        boss.current.phase = currentPhase;
                        bulletPool.clear(particlePool, itemPool);
                        shake.current = 15;
                    }

                    if (boss.current.health <= 0) {
                        boss.current.health = BOSS_MAX_HEALTH;
                        stats.current.score += 1000000;
                        bulletPool.clear(particlePool, itemPool);
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

        const cmds = useInputStore.getState().commands;
        const sx = (Math.random() - 0.5) * shake.current;
        const sy = (Math.random() - 0.5) * shake.current;
        ctx.save();
        ctx.translate(sx, sy);

        // BACKGROUND
        ctx.fillStyle = PALETTE.BG_VOID; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = "rgba(10, 0, 16, 0.85)"; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

        ctx.strokeStyle = PALETTE.BG_GRID; ctx.lineWidth = 1;
        for (let y = bgScroll.current; y < SCREEN_HEIGHT; y += 40) {
            ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, y); ctx.lineTo(PLAY_AREA_X + PLAY_AREA_WIDTH, y); ctx.stroke();
        }
        ctx.strokeRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

        // POINT OF COLLECTION (PoC) LINE
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(PLAY_AREA_X, POC_THRESHOLD_Y); ctx.lineTo(PLAY_AREA_X + PLAY_AREA_WIDTH, POC_THRESHOLD_Y); ctx.stroke();
        ctx.setLineDash([]);

        // --- RENDER ACTIVE NULL OMEN VISUAL SPELLS ---
        if (activeSpell.current.timer > 0 && activeSpell.current.omen) {
            const omen = activeSpell.current.omen;
            ctx.save();

            if (omen.id === 'hollow_abyss') {
                ctx.strokeStyle = omen.color;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(boss.current.x, boss.current.y, 80 + Math.sin(frames.current * 0.1) * 20, 0, Math.PI * 2);
                ctx.stroke();
            } else if (omen.id === 'tearing_darkness') {
                ctx.strokeStyle = omen.color;
                ctx.lineWidth = 14;
                ctx.shadowColor = omen.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.moveTo(player.current.x - 30, PLAY_AREA_Y + PLAY_AREA_HEIGHT);
                ctx.lineTo(player.current.x - 30, PLAY_AREA_Y);
                ctx.moveTo(player.current.x + 30, PLAY_AREA_Y + PLAY_AREA_HEIGHT);
                ctx.lineTo(player.current.x + 30, PLAY_AREA_Y);
                ctx.stroke();
            } else if (omen.id === 'thermodynamic_shatter') {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
                ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);
            }

            ctx.restore();
        }

        // FOCUS HITBOX
        if (cmds.FOCUS) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#FF003C'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PLAYER_HITBOX_RADIUS + 1, 0, Math.PI * 2); ctx.stroke();
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

        // HP BAR
        const hpWidth = PLAY_AREA_WIDTH;
        const phaseMax = BOSS_MAX_HEALTH / BOSS_TOTAL_PHASES;
        const phaseCurrent = boss.current.health % phaseMax || phaseMax;
        const pct = phaseCurrent / phaseMax;
        ctx.fillStyle = "#330000"; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth, 5);
        ctx.fillStyle = '#39FF14'; ctx.fillRect(PLAY_AREA_X, PLAY_AREA_Y, hpWidth * pct, 5);

        // PLAYER VESSEL
        if (player.current.active && (invuln.current % 4 < 2)) {
            ctx.fillStyle = PALETTE.PLAYER_AURA;
            ctx.beginPath(); ctx.moveTo(player.current.x, player.current.y - 15); ctx.lineTo(player.current.x + 10, player.current.y + 10); ctx.lineTo(player.current.x - 10, player.current.y + 10); ctx.fill();
            ctx.fillStyle = PALETTE.PLAYER_CORE; ctx.fillRect(player.current.x - 3, player.current.y - 12, 6, 6);
        }

        if (bomb.current.active) {
            ctx.fillStyle = `rgba(255, 255, 255, ${bomb.current.timer / 120})`;
            ctx.beginPath(); ctx.arc(player.current.x, player.current.y, bomb.current.radius, 0, Math.PI * 2); ctx.fill();
        }

        particlePool.updateAndDraw(ctx);

        // ITEMS
        itemPool.pool.forEach(i => {
            if (!i.active) return;
            ctx.fillStyle = i.color; ctx.fillRect(i.x - 4, i.y - 4, 8, 8);
            ctx.fillStyle = '#000'; ctx.font = "8px monospace";
            ctx.fillText(i.type === EntityType.ITEM_POWER ? "P" : "S", i.x - 2, i.y + 2);
        });

        // BULLETS
        bulletPool.pool.forEach(b => {
            if (!b.active) return;
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
        });

        // SPELL SHARDS
        spellPool.pool.forEach(s => {
            if (!s.active) return;
            ctx.fillStyle = s.color;
            ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.fill();
        });

        // --- RENDER SPELL CARD TOUHOU-STYLE BANNER CUT-IN ---
        if (activeSpell.current.timer > 0 && activeSpell.current.omen) {
            const omen = activeSpell.current.omen;
            const bannerX = PLAY_AREA_X + PLAY_AREA_WIDTH - (activeSpell.current.bannerSlide * 340);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.strokeStyle = omen.color;
            ctx.lineWidth = 2;
            ctx.fillRect(bannerX, PLAY_AREA_Y + 40, 320, 48);
            ctx.strokeRect(bannerX, PLAY_AREA_Y + 40, 320, 48);

            ctx.fillStyle = omen.color;
            ctx.font = "10px monospace";
            ctx.fillText(`// NULL OMEN DEPLOYED`, bannerX + 12, PLAY_AREA_Y + 56);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = "bold 13px monospace";
            ctx.fillText(`${omen.sign} [${omen.name}]`, bannerX + 12, PLAY_AREA_Y + 74);
        }

        ctx.restore();

        // RIGHT SIDEBAR HUD
        const uiX = PLAY_AREA_X + PLAY_AREA_WIDTH + 20;
        ctx.font = "24px monospace"; ctx.fillStyle = PALETTE.TEXT_PRIMARY; ctx.fillText("SHRINE-98", uiX, 40);
        ctx.font = "18px monospace"; ctx.fillStyle = "#fff";
        ctx.fillText(`SCORE:`, uiX, 80);
        ctx.fillText(`${stats.current.score.toString().padStart(9, '0')}`, uiX, 100);
        ctx.fillText(`HISCORE:`, uiX, 130);
        ctx.fillText(`${stats.current.hiscore.toString().padStart(9, '0')}`, uiX, 150);
        ctx.fillText(`LIVES: ${"♥".repeat(Math.max(0, stats.current.lives))}`, uiX, 190);
        ctx.fillText(`BOMBS: ${"★".repeat(Math.max(0, stats.current.bombs))}`, uiX, 220);

        // POWER POINT GAUGE WITH MILESTONES
        ctx.fillText(`POWER: ${stats.current.power}/128`, uiX, 260);
        ctx.fillStyle = "#222"; ctx.fillRect(uiX, 270, 100, 8);
        ctx.fillStyle = PALETTE.ITEM_POWER; ctx.fillRect(uiX, 270, (stats.current.power / 128) * 100, 8);

        // Milestone notches (32, 64, 96, 128)
        ctx.fillStyle = '#FFD700';
        [32, 64, 96, 128].forEach(m => {
            ctx.fillRect(uiX + (m / 128) * 100 - 1, 268, 2, 12);
        });

        ctx.font = "14px monospace"; ctx.fillStyle = "#fff";
        ctx.fillText(`GRAZE: ${stats.current.graze}`, uiX, 310);
        ctx.fillStyle = "#E056FD";
        ctx.fillText(`PHASE: ${boss.current.phase + 1}/${BOSS_TOTAL_PHASES}`, uiX, 335);

        // SPELL CARD STATUS DISPLAY
        const nextOmen = getHighestUnlockedOmen(stats.current.power);
        if (nextOmen) {
            ctx.fillStyle = '#FFD700';
            ctx.font = "bold 11px monospace";
            ctx.fillText(`[P] OMEN READY:`, uiX, 370);
            ctx.fillStyle = nextOmen.color;
            ctx.font = "10px monospace";
            ctx.fillText(`${nextOmen.name}`, uiX, 388);
        } else {
            ctx.fillStyle = '#666';
            ctx.font = "10px monospace";
            ctx.fillText(`NEXT OMEN: 32 PWR`, uiX, 370);
        }
    };

    useGameLoop(() => { update(); draw(); }, !isPaused);

    return (
        <div className="relative w-full h-full flex justify-center items-center font-mono">
            {bomb.current.active && (
                <div className="absolute inset-0 luminescent-discharge pointer-events-none" />
            )}
            <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}
                className="w-full h-full object-contain shadow-[0_0_30px_rgba(224,86,253,0.3)]"
            />

            {/* MOBILE HARDWARE CONTROLS & DYNAMIC SPELL CARD BUTTON */}
            {isMobile && (
                <>
                    <div className="absolute bottom-12 left-12 z-50">
                        <VirtualJoystick size={150} stickSize={60} />
                    </div>

                    <div className="absolute bottom-16 right-16 flex flex-col gap-4 z-50">
                        {/* --- START NEW CODE: MOBILE NULL OMEN POPUP BUTTON --- */}
                        {availableOmen && (
                            <button
                                className="w-full h-14 rounded-lg bg-black/90 border-2 border-[#FFD700] text-[#FFD700] font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.6)] animate-pulse active:scale-95 touch-none select-none"
                                onTouchStart={(e) => { e.preventDefault(); launchNullOmen(); }}
                                onClick={(e) => { e.preventDefault(); launchNullOmen(); }}
                            >
                                <Sparkles size={18} />
                                <span className="text-[10px] tracking-wider">{availableOmen.name.toUpperCase()}</span>
                            </button>
                        )}
                        {/* --- END NEW CODE --- */}

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
                            className="w-full h-16 rounded-full bg-white/10 border-2 border-white active:bg-white active:text-black text-white font-bold flex flex-col items-center justify-center select-none touch-none"
                            onTouchStart={(e) => { e.preventDefault(); useInputStore.getState().setCommand('ACTION', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); useInputStore.getState().setCommand('ACTION', false); }}
                        >
                            <Crosshair size={22} className="mb-1" />
                            <span className="text-[10px] tracking-widest">FIRE</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};