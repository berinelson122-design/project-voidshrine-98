export enum GameMode {
  NORMAL,
  TELLURIC_RESONANCE,
  ENDLESS,
  AETHER_OVERLOAD,
  OBSIDIAN_SCRUBBER,
  PHASE_SHIFT,
}

export enum EntityType {
  PLAYER,
  BOSS,
  BULLET_PLAYER,
  BULLET_ENEMY,
  ITEM_POWER,
  ITEM_POINT,
  ITEM_LIFE,
  ITEM_BIOCHAR,
  SPELL_SHARD,
  SPELL_LASER
}

export interface Entity {
  id: number;
  active: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  color: string;
  type: EntityType;
  rotation?: number;
  grazed?: boolean;
  scale?: number;
  homing?: boolean;
  life?: number;
  maxLife?: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  focus: boolean;
  shoot: boolean;
  bomb: boolean;
  spell: boolean;
}

export interface GameStats {
  score: number;
  lives: number;
  bombs: number;
  power: number;
  graze: number;
  bossHealth: number;
  bossPhase: number;
  fps: number;
  hiscore: number;
  pressure?: number;
  topography?: number;
  activeOmen?: string | null;
}

export interface PatternConfig {
  count: number;
  speed: number;
  spread: number;
  rotationSpeed: number;
  color: string;
  type: 'FAN' | 'SPIRAL' | 'AIMED' | 'BURST';
}

// --- NULL OMEN SPELL CARD SYSTEM ---
export interface NullOmenDefinition {
  id: string;
  name: string;
  sign: string;
  requiredPower: number;
  powerCost: number;
  color: string;
  secondaryColor: string;
  duration: number; // frames
  description: string;
}

export const NULL_OMENS: NullOmenDefinition[] = [
  {
    id: 'hollow_abyss',
    sign: 'Void Sign',
    name: 'Hollow Abyss',
    requiredPower: 32,
    powerCost: 16,
    color: '#E056FD',
    secondaryColor: '#FFFFFF',
    duration: 180,
    description: 'Deploys a gravitational singularity that consumes hostile projectiles and converts them to points.'
  },
  {
    id: 'tearing_darkness',
    sign: 'Entropy Sign',
    name: 'Tearing Darkness',
    requiredPower: 64,
    powerCost: 24,
    color: '#FF003C',
    secondaryColor: '#FF0055',
    duration: 200,
    description: 'Fires twin cross-axial laser beams that pierce through all entity layers and disintegrate incoming vectors.'
  },
  {
    id: 'byte_basher',
    sign: 'Virus Sign',
    name: 'Byte Basher',
    requiredPower: 96,
    powerCost: 32,
    color: '#00F3FF',
    secondaryColor: '#39FF14',
    duration: 220,
    description: 'Releases a swarm of 32 high-velocity homing digital needles targeting the Archon core.'
  },
  {
    id: 'thermodynamic_shatter',
    sign: 'Void Sign',
    name: 'Thermodynamic Shatter',
    requiredPower: 128,
    powerCost: 48,
    color: '#FFFFFF',
    secondaryColor: '#FFD700',
    duration: 240,
    description: 'Executes absolute screen-freeze stasis, neutralizing all enemy bullets and shattering the boss core.'
  }
];