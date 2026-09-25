export enum GameMode {
  NORMAL = 'NORMAL',
  TELLURIC_RESONANCE = 'TELLURIC_RESONANCE',
  AETHER_OVERLOAD = 'AETHER_OVERLOAD',
  OBSIDIAN_SCRUBBER = 'OBSIDIAN_SCRUBBER',
  PHASE_SHIFT = 'PHASE_SHIFT',
  ENDLESS = 'ENDLESS'
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

export interface NullOmenDefinition {
  id: string;
  name: string;
  sign: string;
  requiredPower: number;
  powerCost: number;
  color: string;
  secondaryColor: string;
  duration: number;
  description: string;
}

export interface RunRecord {
  id: string;
  timestamp: string;
  score: number;
  mode: GameMode;
  bossPhase: number;
  graze: number;
  maxPower: number;
  status: 'PURGED' | 'VICTORY' | 'ABORTED';
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
    description: 'Deploys a gravitational singularity that consumes hostile projectiles.'
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
    description: 'Fires twin cross-axial laser beams that pierce through all entity vectors.'
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
    description: 'Releases a swarm of 32 high-velocity homing digital needles.'
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
    description: 'Executes absolute screen-freeze stasis, shattering the Archon core.'
  }
];

// --- START NEW CODE: BINAURAL BEATS & FOCUS LEVELS PROTOCOL ---
export type BrainwaveBand = 'DELTA' | 'THETA' | 'ALPHA' | 'BETA' | 'GAMMA';

export interface FocusLevelPreset {
  id: string;
  focusLevel: string;
  name: string;
  subtitle: string;
  carrierFreq: number;
  beatFreq: number;
  band: BrainwaveBand;
  waveform: OscillatorType;
  noiseLevel: number;
  subHarmonics: boolean;
  description: string;
  clinicalTarget: string;
}

export interface BinauralState {
  isPlaying: boolean;
  activePresetId: string | null;
  carrierFreq: number;
  beatFreq: number;
  waveform: OscillatorType;
  noiseLevel: number;
  subHarmonics: boolean;
  volume: number;
  isMuted: boolean;
}

export type RhythmSyncHarmonic = 'DELTA_1X' | 'THETA_2X' | 'THETA_3X' | 'ALPHA_5X' | 'BETA_7X' | 'GAMMA_20X';

export interface DynamicRhythmSyncState {
  enabled: boolean;
  harmonic: RhythmSyncHarmonic;
  detectedBpm: number;
  calculatedBeatFreq: number;
  isLocked: boolean;
  isManualOverride?: boolean;
  tapCount?: number;
}

export interface SavedFocusPreset {
  id: string;
  name: string;
  carrierFreq: number;
  beatFreq: number;
  band: BrainwaveBand;
  waveform: OscillatorType;
  noiseLevel: number;
  subHarmonics: boolean;
  isDefault?: boolean;
  timestamp: number;
}

// --- START NEW CODE: SMOOTH CROSSFADE & MASTER SYNC PROTOCOLS ---
export interface CrossfadeConfig {
  enabled: boolean;
  durationMs: number;
  intensityCurve: 'SMOOTH' | 'EXPONENTIAL' | 'LINEAR';
}

export interface MasterSyncState {
  enabled: boolean;
  baseCarrierFreq: number;
  syncedCarrierFreq: number;
  tempoRatio: number;
  detectedBpm: number;
  isLocked: boolean;
}
// --- END NEW CODE: SMOOTH CROSSFADE & MASTER SYNC PROTOCOLS ---
// --- END NEW CODE: BINAURAL BEATS & FOCUS LEVELS PROTOCOL ---
