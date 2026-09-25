// --- START NEW CODE: BINAURAL PRESETS & BIOELECTRIC MATRIX PROTOCOL ---
import { FocusLevelPreset, BrainwaveBand } from '../types';

export const BRAINWAVE_BANDS: Record<BrainwaveBand, { min: number; max: number; label: string; color: string; desc: string }> = {
  DELTA: {
    min: 0.5,
    max: 4.0,
    label: 'DELTA (0.5 - 4.0 Hz)',
    color: '#00F3FF',
    desc: 'Deep autonomic restoration, biological grounding, vagus nerve stimulation'
  },
  THETA: {
    min: 4.0,
    max: 8.0,
    label: 'THETA (4.0 - 8.0 Hz)',
    color: '#E056FD',
    desc: 'Sensory recalibration, intuitive synthesis, non-linear timeless stillness'
  },
  ALPHA: {
    min: 8.0,
    max: 12.0,
    label: 'ALPHA (8.0 - 12.0 Hz)',
    color: '#39FF14',
    desc: 'Calm relaxed awareness, sensory overload filtering, inter-hemispheric balance'
  },
  BETA: {
    min: 12.0,
    max: 30.0,
    label: 'BETA (12.0 - 30.0 Hz)',
    color: '#FFD700',
    desc: 'Active task concentration, sharp reflex latency, bullet hell tactical focus'
  },
  GAMMA: {
    min: 30.0,
    max: 50.0,
    label: 'GAMMA (30.0 - 50.0 Hz)',
    color: '#FF003C',
    desc: 'Whole-brain synchronization, microglial activation, peak cognitive binding'
  }
};

export const FOCUS_PRESETS: FocusLevelPreset[] = [
  {
    id: 'focus-10',
    focusLevel: 'FOCUS 10',
    name: 'Mind Awake, Body Asleep',
    subtitle: 'Sensory Hyperexcitability Calming // 7.0 Hz Theta',
    carrierFreq: 136.1, // Earth Om frequency
    beatFreq: 7.0,
    band: 'THETA',
    waveform: 'sine',
    noiseLevel: 0.12,
    subHarmonics: true,
    description: 'Somatic motor system reaches deep rest while executive consciousness remains razor sharp. Bridges the gap between nervous system agitation and calm mental presence.',
    clinicalTarget: 'Dampens sympathetic fight-or-flight overdrive, calms autistic sensory overwhelm.'
  },
  {
    id: 'focus-12',
    focusLevel: 'FOCUS 12',
    name: 'Expanded Awareness',
    subtitle: 'Inter-Hemispheric Coherence // 10.0 Hz Alpha',
    carrierFreq: 144.0,
    beatFreq: 10.0,
    band: 'ALPHA',
    waveform: 'sine',
    noiseLevel: 0.08,
    subHarmonics: true,
    description: 'Consciousness expands beyond physical boundaries. Facilitates smooth cross-hemispheric communication and multi-sensory integration without sensory flooding.',
    clinicalTarget: 'Enhances cognitive flexibility, eases rigid sensory filters, elevates spatial awareness.'
  },
  {
    id: 'focus-15',
    focusLevel: 'FOCUS 15',
    name: 'State of No Time',
    subtitle: 'Deep Theta Stillness // 4.5 Hz Theta',
    carrierFreq: 108.0,
    beatFreq: 4.5,
    band: 'THETA',
    waveform: 'sine',
    noiseLevel: 0.15,
    subHarmonics: true,
    description: 'A stillness where time perception dissolves. Internal monologue slows into tranquil void-space, allowing complete bioelectric reset.',
    clinicalTarget: 'Silences persistent ruminative loops, resets overstimulated auditory networks.'
  },
  {
    id: 'focus-21',
    focusLevel: 'FOCUS 21',
    name: 'The Edge / The Bridge',
    subtitle: 'Threshold Boundary State // 3.8 Hz Delta/Theta',
    carrierFreq: 216.0,
    beatFreq: 3.8,
    band: 'DELTA',
    waveform: 'sine',
    noiseLevel: 0.10,
    subHarmonics: true,
    description: 'Operating at the doorway of physical and subtle fields. Subtle harmonic dissonance creates a portal sensation into high-dimensional calm.',
    clinicalTarget: 'Neurological threshold navigation, deep neural tension release.'
  },
  {
    id: 'focus-23',
    focusLevel: 'FOCUS 23',
    name: 'Somatic Re-alignment',
    subtitle: 'Deep Vagal Grounding // 2.8 Hz Delta',
    carrierFreq: 96.0,
    beatFreq: 2.8,
    band: 'DELTA',
    waveform: 'sine',
    noiseLevel: 0.14,
    subHarmonics: true,
    description: 'Deep resonant Delta pulse targeted at bioelectric recalibration. Stabilizes cardiac rhythm and somatic nervous tissue.',
    clinicalTarget: 'Stimulates parasympathetic vagus nerve, counters physical burnout and sensory shutdown.'
  },
  {
    id: 'focus-27',
    focusLevel: 'FOCUS 27',
    name: 'Bioelectric Sanctuary',
    subtitle: 'Planetary Resonance // 7.83 Hz Schumann + 432 Hz',
    carrierFreq: 432.0,
    beatFreq: 7.83,
    band: 'THETA',
    waveform: 'sine',
    noiseLevel: 0.08,
    subHarmonics: true,
    description: 'The healing reception center. Natural Verdi pitch tuned to the Earth ionospheric Schumann resonance, bathing neural pathways in restorative harmonics.',
    clinicalTarget: 'Cellular bioelectric repair, soothing electromagnetic sensitivity and autistic burnout.'
  },
  {
    id: 'focus-1',
    focusLevel: 'FOCUS 1',
    name: 'Tactical Precision Beta',
    subtitle: 'Reflex & Danmaku Evasion // 15.0 Hz Beta',
    carrierFreq: 220.0,
    beatFreq: 15.0,
    band: 'BETA',
    waveform: 'triangle',
    noiseLevel: 0.05,
    subHarmonics: false,
    description: 'High-speed cognitive tracking and motor coordination. Optimizes visual saccades and rapid decision-making under intense projectile pressure.',
    clinicalTarget: 'Increases dopaminergic alertness, sharpens micro-focus and reaction latency.'
  },
  {
    id: 'focus-gamma',
    focusLevel: 'GAMMA 40',
    name: 'Microglial Coherence',
    subtitle: 'Whole-Brain Binding // 40.0 Hz Gamma',
    carrierFreq: 250.0,
    beatFreq: 40.0,
    band: 'GAMMA',
    waveform: 'sine',
    noiseLevel: 0.06,
    subHarmonics: false,
    description: '40Hz bioelectric frequency recognized in cutting-edge neuroscience for microglial stimulation, neural clearance, and high-level sensory binding.',
    clinicalTarget: 'Promotes microglial cellular clearing, synchronizes cortical networks.'
  }
];

export function getBandForFrequency(freq: number): BrainwaveBand {
  if (freq < 4.0) return 'DELTA';
  if (freq < 8.0) return 'THETA';
  if (freq < 12.0) return 'ALPHA';
  if (freq < 30.0) return 'BETA';
  return 'GAMMA';
}

// --- START NEW CODE: SAVED FOCUS PRESETS & DYNAMIC RHYTHM SYNC PROTOCOL ---
import { SavedFocusPreset, RhythmSyncHarmonic } from '../types';

export const DEFAULT_SAVED_PRESETS: SavedFocusPreset[] = [
  {
    id: 'preset-deep-work',
    name: 'Deep Work',
    carrierFreq: 144.0,
    beatFreq: 10.0,
    band: 'ALPHA',
    waveform: 'sine',
    noiseLevel: 0.08,
    subHarmonics: true,
    isDefault: true,
    timestamp: 1700000000000,
  },
  {
    id: 'preset-meditation',
    name: 'Meditation',
    carrierFreq: 108.0,
    beatFreq: 4.5,
    band: 'THETA',
    waveform: 'sine',
    noiseLevel: 0.15,
    subHarmonics: true,
    isDefault: true,
    timestamp: 1700000000001,
  },
  {
    id: 'preset-high-energy',
    name: 'High-Energy',
    carrierFreq: 220.0,
    beatFreq: 16.0,
    band: 'BETA',
    waveform: 'triangle',
    noiseLevel: 0.05,
    subHarmonics: false,
    isDefault: true,
    timestamp: 1700000000002,
  },
  {
    id: 'preset-restorative-healing',
    name: 'Restorative Sanctuary',
    carrierFreq: 432.0,
    beatFreq: 7.83,
    band: 'THETA',
    waveform: 'sine',
    noiseLevel: 0.08,
    subHarmonics: true,
    isDefault: true,
    timestamp: 1700000000003,
  },
  {
    id: 'preset-somatic-reset',
    name: 'Somatic Reset',
    carrierFreq: 96.0,
    beatFreq: 2.8,
    band: 'DELTA',
    waveform: 'sine',
    noiseLevel: 0.14,
    subHarmonics: true,
    isDefault: true,
    timestamp: 1700000000004,
  }
];

export const RHYTHM_SYNC_HARMONICS: Record<RhythmSyncHarmonic, { label: string; ratio: string; band: BrainwaveBand; desc: string }> = {
  DELTA_1X: {
    label: '1x FUNDAMENTAL (DELTA)',
    ratio: '1:1 BEAT SYNC',
    band: 'DELTA',
    desc: 'Matches downbeat cycle (1.0 - 3.5 Hz) for deep somatic grounding'
  },
  THETA_2X: {
    label: '2x 8TH NOTES (THETA)',
    ratio: '2:1 HALF-BEAT',
    band: 'THETA',
    desc: 'Locks to 8th-note pulse (3.5 - 6.5 Hz) for inward meditative flow'
  },
  THETA_3X: {
    label: '3x TRIPLET (THETA)',
    ratio: '3:1 TRIPLET',
    band: 'THETA',
    desc: 'Locks to triplet groove (5.5 - 9.0 Hz) for timeless creative absorption'
  },
  ALPHA_5X: {
    label: '5x QUINTUPLE (ALPHA)',
    ratio: '5:1 HARMONIC',
    band: 'ALPHA',
    desc: 'Locks to 5x harmonic (8.0 - 13.0 Hz) for clear relaxed focus & flow'
  },
  BETA_7X: {
    label: '7x SEPTUPLE (BETA)',
    ratio: '7:1 DRIVE',
    band: 'BETA',
    desc: 'Locks to 7x drive (12.0 - 24.0 Hz) for rapid reflex & tactical dodging'
  },
  GAMMA_20X: {
    label: '20x BURST (GAMMA)',
    ratio: '20:1 COHERENCE',
    band: 'GAMMA',
    desc: 'High-frequency harmonic (30.0 - 45.0 Hz) for microglial sync & hyper-focus'
  }
};

const STORAGE_KEY = 'SHRINE98_SAVED_FOCUS_PRESETS';

export function getSavedFocusPresets(): SavedFocusPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_PRESETS));
      return DEFAULT_SAVED_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SAVED_PRESETS;
  } catch {
    return DEFAULT_SAVED_PRESETS;
  }
}

export function saveFocusPreset(preset: Omit<SavedFocusPreset, 'id' | 'timestamp'>): SavedFocusPreset[] {
  const current = getSavedFocusPresets();
  const newPreset: SavedFocusPreset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    isDefault: false
  };
  const updated = [newPreset, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save focus preset to localStorage", e);
  }
  return updated;
}

export function deleteFocusPreset(id: string): SavedFocusPreset[] {
  const current = getSavedFocusPresets();
  const updated = current.filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not update focus presets in localStorage", e);
  }
  return updated;
}
// --- END NEW CODE: SAVED FOCUS PRESETS & DYNAMIC RHYTHM SYNC PROTOCOL ---
// --- END NEW CODE: BINAURAL PRESETS & BIOELECTRIC MATRIX PROTOCOL ---
