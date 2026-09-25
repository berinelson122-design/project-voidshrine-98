// --- START NEW CODE: TELLURIC RHYTHM & BEAT ANALYSIS TYPES ---
import { BinauralState, DynamicRhythmSyncState, RhythmSyncHarmonic, CrossfadeConfig, MasterSyncState } from '../types';

export interface AudioRhythmData {
  bass: number;          // 0.0 to 1.0 (sub-bass / kick drum energy)
  mid: number;           // 0.0 to 1.0 (snare / mid synth energy)
  treble: number;        // 0.0 to 1.0 (hi-hat / cymbal energy)
  energy: number;        // 0.0 to 1.0 (overall weighted acoustic energy)
  isBeat: boolean;       // true if an energetic kick/bass transient hit on this frame
  isSnare: boolean;      // true if a mid-frequency transient hit on this frame
  beatIntensity: number; // 0.0 to 1.0 relative strength of the beat
  bpm: number;           // real-time detected or calculated musical BPM
  isBpmLocked: boolean;  // true if tempo has stabilized
  rawSpectrum: Uint8Array<ArrayBuffer> | null;
  isExternalTrack: boolean; // true if processing loaded user track
}
// --- END NEW CODE: TELLURIC RHYTHM & BEAT ANALYSIS TYPES ---

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isConnected: boolean = false;
  private currentVolume: number = 0.5;
  private isMuted: boolean = false;

  // --- START NEW CODE: SECONDARY VOLUME & BINAURAL FOCUS ENGINE ---
  private binauralGainNode: GainNode | null = null;
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralSubOsc: OscillatorNode | null = null;
  private binauralNoiseSource: AudioBufferSourceNode | null = null;
  private binauralNoiseGain: GainNode | null = null;
  private isBinauralPlaying: boolean = false;
  private binauralVolume: number = 0.5;
  private isBinauralMuted: boolean = false;
  private activePresetId: string | null = 'focus-10';
  private currentCarrierFreq: number = 136.1;
  private currentBeatFreq: number = 7.0;
  private currentWaveform: OscillatorType = 'sine';
  private currentNoiseLevel: number = 0.12;
  private currentSubHarmonics: boolean = true;

  // --- START NEW CODE: SMOOTH CROSSFADE & MASTER SYNC FIELDS ---
  private masterSyncEnabled: boolean = false;
  private baseCarrierFreq: number = 136.1;
  private syncedCarrierFreq: number = 136.1;
  private crossfadeEnabled: boolean = true;
  private crossfadeDurationMs: number = 350;
  private isCrossfading: boolean = false;
  private crossfadeTimer: number | null = null;
  // --- END NEW CODE: SMOOTH CROSSFADE & MASTER SYNC FIELDS ---
  // --- END NEW CODE: SECONDARY VOLUME & BINAURAL FOCUS ENGINE ---

  // --- START NEW CODE: BEAT DETECTION AND RHYTHM BUFFERS ---
  private bassHistory: number[] = [];
  private midHistory: number[] = [];
  private beatCooldown: number = 0;
  private snareCooldown: number = 0;
  private lastBeatTime: number = 0;
  private beatIntervals: number[] = [];
  private lastBeatTimestamp: number = 0;
  private estimatedBpm: number = 120;
  private isBpmLocked: boolean = false;
  private rhythmSyncEnabled: boolean = false;
  private rhythmSyncHarmonic: RhythmSyncHarmonic = 'ALPHA_5X';
  private isManualBpmOverride: boolean = false;
  private tapTimestamps: number[] = [];
  // --- END NEW CODE: BEAT DETECTION AND RHYTHM BUFFERS ---

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.ctx.createGain();
    const effectiveGain = this.isMuted ? 0 : this.currentVolume;
    this.gainNode.gain.value = effectiveGain;

    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // --- START NEW CODE: SECONDARY BINAURAL GAIN BUS ---
    this.binauralGainNode = this.ctx.createGain();
    const effectiveBinauralGain = this.isBinauralMuted ? 0 : this.binauralVolume;
    this.binauralGainNode.gain.setValueAtTime(effectiveBinauralGain, this.ctx.currentTime);
    this.binauralGainNode.connect(this.ctx.destination);
    // --- END NEW CODE: SECONDARY BINAURAL GAIN BUS ---

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  }

  setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      const effectiveGain = this.isMuted ? 0 : this.currentVolume;
      this.gainNode.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      const effectiveGain = this.isMuted ? 0 : this.currentVolume;
      this.gainNode.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getVolume(): number {
    return this.currentVolume;
  }

  // --- START NEW CODE: SECONDARY VOLUME & BINAURAL ENGINE CONTROLS ---
  setBinauralVolume(vol: number) {
    this.binauralVolume = Math.max(0, Math.min(1, vol));
    if (this.binauralGainNode && this.ctx) {
      const effectiveGain = this.isBinauralMuted ? 0 : this.binauralVolume;
      this.binauralGainNode.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  getBinauralVolume(): number {
    return this.binauralVolume;
  }

  setBinauralMuted(muted: boolean) {
    this.isBinauralMuted = muted;
    if (this.binauralGainNode && this.ctx) {
      const effectiveGain = this.isBinauralMuted ? 0 : this.binauralVolume;
      this.binauralGainNode.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  toggleBinauralMute(): boolean {
    this.setBinauralMuted(!this.isBinauralMuted);
    return this.isBinauralMuted;
  }

  getIsBinauralMuted(): boolean {
    return this.isBinauralMuted;
  }

  isBinauralActive(): boolean {
    return this.isBinauralPlaying;
  }

  getBinauralState(): BinauralState {
    return {
      isPlaying: this.isBinauralPlaying,
      activePresetId: this.activePresetId,
      carrierFreq: this.currentCarrierFreq,
      beatFreq: this.currentBeatFreq,
      waveform: this.currentWaveform,
      noiseLevel: this.currentNoiseLevel,
      subHarmonics: this.currentSubHarmonics,
      volume: this.binauralVolume,
      isMuted: this.isBinauralMuted,
    };
  }

  stopBinaural() {
    if (!this.ctx) return;
    try {
      if (this.binauralLeftOsc) {
        this.binauralLeftOsc.stop();
        this.binauralLeftOsc.disconnect();
        this.binauralLeftOsc = null;
      }
      if (this.binauralRightOsc) {
        this.binauralRightOsc.stop();
        this.binauralRightOsc.disconnect();
        this.binauralRightOsc = null;
      }
      if (this.binauralSubOsc) {
        this.binauralSubOsc.stop();
        this.binauralSubOsc.disconnect();
        this.binauralSubOsc = null;
      }
      if (this.binauralNoiseSource) {
        this.binauralNoiseSource.stop();
        this.binauralNoiseSource.disconnect();
        this.binauralNoiseSource = null;
      }
      if (this.binauralNoiseGain) {
        this.binauralNoiseGain.disconnect();
        this.binauralNoiseGain = null;
      }
    } catch (e) {
      console.warn("--> [AUDIO_WARNING]: Error stopping binaural oscillators:", e);
    }
    this.isBinauralPlaying = false;
  }

  startBinaural(
    carrierFreq: number = 136.1,
    beatFreq: number = 7.0,
    waveform: OscillatorType = 'sine',
    noiseLevel: number = 0.12,
    subHarmonics: boolean = true,
    presetId: string | null = null
  ) {
    this.init();
    if (!this.ctx || !this.binauralGainNode) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Stop any existing binaural nodes before spawning fresh channels
    this.stopBinaural();

    this.baseCarrierFreq = carrierFreq;
    if (this.masterSyncEnabled) {
      const tempoRatio = this.estimatedBpm / 120;
      carrierFreq = Math.max(30, Math.min(800, Math.round(carrierFreq * tempoRatio * 10) / 10));
      this.syncedCarrierFreq = carrierFreq;
      beatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
    } else {
      this.syncedCarrierFreq = carrierFreq;
    }

    this.currentCarrierFreq = carrierFreq;
    this.currentBeatFreq = beatFreq;
    this.currentWaveform = waveform;
    this.currentNoiseLevel = noiseLevel;
    this.currentSubHarmonics = subHarmonics;
    this.activePresetId = presetId;

    try {
      // Create Stereo Channel Merger for Left/Right separation
      const merger = this.ctx.createChannelMerger(2);

      // Left Channel Oscillator (Carrier - Beat/2)
      const leftFreq = Math.max(20, carrierFreq - beatFreq / 2);
      const leftOsc = this.ctx.createOscillator();
      leftOsc.type = waveform;
      leftOsc.frequency.setValueAtTime(leftFreq, this.ctx.currentTime);

      const leftGain = this.ctx.createGain();
      leftGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      leftOsc.connect(leftGain);
      leftGain.connect(merger, 0, 0); // Route to Left Channel

      // Right Channel Oscillator (Carrier + Beat/2)
      const rightFreq = Math.max(20, carrierFreq + beatFreq / 2);
      const rightOsc = this.ctx.createOscillator();
      rightOsc.type = waveform;
      rightOsc.frequency.setValueAtTime(rightFreq, this.ctx.currentTime);

      const rightGain = this.ctx.createGain();
      rightGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      rightOsc.connect(rightGain);
      rightGain.connect(merger, 0, 1); // Route to Right Channel

      merger.connect(this.binauralGainNode);

      leftOsc.start();
      rightOsc.start();
      this.binauralLeftOsc = leftOsc;
      this.binauralRightOsc = rightOsc;

      // Optional Sub-harmonic Grounding Drone (one octave down)
      if (subHarmonics && carrierFreq >= 60) {
        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(carrierFreq * 0.5, this.ctx.currentTime);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        subOsc.connect(subGain);
        subGain.connect(this.binauralGainNode);

        subOsc.start();
        this.binauralSubOsc = subOsc;
      }

      // Optional Soothing Pink/Brown Noise Bed (masked sensory floor)
      if (noiseLevel > 0) {
        const sampleRate = this.ctx.sampleRate;
        const bufferLength = sampleRate * 3; // 3 seconds looped
        const noiseBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
          const data = noiseBuffer.getChannelData(channel);
          let b0 = 0, b1 = 0, b2 = 0;
          for (let i = 0; i < bufferLength; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.035;
          }
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(450, this.ctx.currentTime);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(noiseLevel * 0.25, this.ctx.currentTime);

        noiseSource.connect(lowpass);
        lowpass.connect(noiseGain);
        noiseGain.connect(this.binauralGainNode);

        noiseSource.start();
        this.binauralNoiseSource = noiseSource;
        this.binauralNoiseGain = noiseGain;
      }

      this.isBinauralPlaying = true;
    } catch (e) {
      console.error("--> [AUDIO_ERROR]: Failed to start binaural tune generator:", e);
      this.isBinauralPlaying = false;
    }
  }

  // --- START NEW CODE: SMOOTH VOLUME CROSSFADE PROTOCOL ---
  switchPresetWithCrossfade(
    carrierFreq: number,
    beatFreq: number,
    waveform: OscillatorType = 'sine',
    noiseLevel: number = 0.12,
    subHarmonics: boolean = true,
    presetId: string | null = null,
    durationMs?: number
  ) {
    this.baseCarrierFreq = carrierFreq;
    const duration = (durationMs ?? this.crossfadeDurationMs) / 1000;

    if (!this.isBinauralPlaying || !this.crossfadeEnabled || duration <= 0.05) {
      this.startBinaural(carrierFreq, beatFreq, waveform, noiseLevel, subHarmonics, presetId);
      return;
    }

    if (!this.ctx || !this.binauralGainNode) {
      this.startBinaural(carrierFreq, beatFreq, waveform, noiseLevel, subHarmonics, presetId);
      return;
    }

    if (this.crossfadeTimer !== null) {
      window.clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    this.isCrossfading = true;
    const baseEffectiveGain = this.isBinauralMuted ? 0 : this.binauralVolume;
    const halfDuration = duration * 0.45;
    const now = this.ctx.currentTime;

    // Fade down gain to avoid sudden frequency jump / audio fatigue click
    try {
      this.binauralGainNode.gain.cancelScheduledValues(now);
      this.binauralGainNode.gain.setValueAtTime(this.binauralGainNode.gain.value, now);
      this.binauralGainNode.gain.linearRampToValueAtTime(0.0001, now + halfDuration);
    } catch {
      // Ignore
    }

    this.crossfadeTimer = window.setTimeout(() => {
      this.startBinaural(carrierFreq, beatFreq, waveform, noiseLevel, subHarmonics, presetId);

      if (this.ctx && this.binauralGainNode) {
        // Frequency-adaptive intensity softening to prevent ear fatigue on higher frequencies
        let fatigueDampener = 1.0;
        if (beatFreq > 30) fatigueDampener = 0.82; // Gamma
        else if (beatFreq > 14) fatigueDampener = 0.88; // Beta
        else if (beatFreq > 8) fatigueDampener = 0.94; // Alpha
        if (carrierFreq > 320) fatigueDampener *= 0.92;

        const targetGain = baseEffectiveGain * fatigueDampener;
        const rampUpNow = this.ctx.currentTime;
        try {
          this.binauralGainNode.gain.cancelScheduledValues(rampUpNow);
          this.binauralGainNode.gain.setValueAtTime(0.0001, rampUpNow);
          this.binauralGainNode.gain.linearRampToValueAtTime(targetGain, rampUpNow + (duration - halfDuration));
        } catch {
          // Ignore
        }
      }

      this.crossfadeTimer = window.setTimeout(() => {
        this.isCrossfading = false;
        this.crossfadeTimer = null;
      }, (duration - halfDuration) * 1000);
    }, halfDuration * 1000);
  }

  setCrossfadeConfig(enabled: boolean, durationMs?: number) {
    this.crossfadeEnabled = enabled;
    if (durationMs !== undefined) {
      this.crossfadeDurationMs = Math.max(50, Math.min(2000, durationMs));
    }
  }

  getCrossfadeConfig(): CrossfadeConfig {
    return {
      enabled: this.crossfadeEnabled,
      durationMs: this.crossfadeDurationMs,
      intensityCurve: 'SMOOTH',
    };
  }

  getIsCrossfading(): boolean {
    return this.isCrossfading;
  }
  // --- END NEW CODE: SMOOTH VOLUME CROSSFADE PROTOCOL ---

  updateBinaural(
    carrierFreq: number,
    beatFreq: number,
    waveform?: OscillatorType,
    noiseLevel?: number,
    subHarmonics?: boolean
  ) {
    if (!this.isBinauralPlaying) {
      this.currentCarrierFreq = carrierFreq;
      this.currentBeatFreq = beatFreq;
      if (waveform) this.currentWaveform = waveform;
      if (noiseLevel !== undefined) this.currentNoiseLevel = noiseLevel;
      if (subHarmonics !== undefined) this.currentSubHarmonics = subHarmonics;
      return;
    }

    if (!this.ctx) return;

    // If waveform or subHarmonics structural state changed, restart cleanly
    if (
      (waveform && waveform !== this.currentWaveform) ||
      (subHarmonics !== undefined && subHarmonics !== this.currentSubHarmonics)
    ) {
      this.startBinaural(
        carrierFreq,
        beatFreq,
        waveform ?? this.currentWaveform,
        noiseLevel ?? this.currentNoiseLevel,
        subHarmonics ?? this.currentSubHarmonics,
        this.activePresetId
      );
      return;
    }

    this.currentCarrierFreq = carrierFreq;
    this.currentBeatFreq = beatFreq;
    if (noiseLevel !== undefined) this.currentNoiseLevel = noiseLevel;

    // Smooth real-time frequency interpolation
    const leftFreq = Math.max(20, carrierFreq - beatFreq / 2);
    const rightFreq = Math.max(20, carrierFreq + beatFreq / 2);

    if (this.binauralLeftOsc) {
      this.binauralLeftOsc.frequency.setTargetAtTime(leftFreq, this.ctx.currentTime, 0.05);
    }
    if (this.binauralRightOsc) {
      this.binauralRightOsc.frequency.setTargetAtTime(rightFreq, this.ctx.currentTime, 0.05);
    }
    if (this.binauralSubOsc) {
      this.binauralSubOsc.frequency.setTargetAtTime(carrierFreq * 0.5, this.ctx.currentTime, 0.05);
    }
    if (this.binauralNoiseGain && noiseLevel !== undefined) {
      this.binauralNoiseGain.gain.setTargetAtTime(noiseLevel * 0.25, this.ctx.currentTime, 0.05);
    }
  }

  // --- START NEW CODE: DYNAMIC RHYTHM SYNC & MASTER SYNC PROTOCOLS ---
  getDynamicRhythmSyncBeatFreq(bpm: number, harmonic: RhythmSyncHarmonic): number {
    const baseFreq = bpm / 60; // 1 beat per second
    let multiplier = 5; // Default Alpha
    switch (harmonic) {
      case 'DELTA_1X': multiplier = 1; break;
      case 'THETA_2X': multiplier = 2; break;
      case 'THETA_3X': multiplier = 3; break;
      case 'ALPHA_5X': multiplier = 5; break;
      case 'BETA_7X': multiplier = 7; break;
      case 'GAMMA_20X': multiplier = 20; break;
    }
    return Math.max(0.5, Math.min(45, Math.round(baseFreq * multiplier * 10) / 10));
  }

  setRhythmSync(enabled: boolean, harmonic?: RhythmSyncHarmonic) {
    this.rhythmSyncEnabled = enabled;
    if (harmonic) this.rhythmSyncHarmonic = harmonic;
    if (enabled && this.isBinauralPlaying) {
      const syncFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
      this.updateBinaural(this.currentCarrierFreq, syncFreq);
    }
  }

  getRhythmSyncState(): DynamicRhythmSyncState {
    const calculated = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
    return {
      enabled: this.rhythmSyncEnabled,
      harmonic: this.rhythmSyncHarmonic,
      detectedBpm: this.estimatedBpm,
      calculatedBeatFreq: calculated,
      isLocked: this.isBpmLocked,
      isManualOverride: this.isManualBpmOverride,
      tapCount: this.tapTimestamps.length,
    };
  }

  // --- START NEW CODE: TAP TEMPO & MANUAL BPM OVERRIDE PROTOCOL ---
  tapTempo(): { bpm: number; tapCount: number; isManualOverride: boolean } {
    const now = performance.now();
    // Reset tap chain if idle for > 2.5 seconds
    if (this.tapTimestamps.length > 0) {
      const lastTap = this.tapTimestamps[this.tapTimestamps.length - 1];
      if (now - lastTap > 2500) {
        this.tapTimestamps = [];
      }
    }
    this.tapTimestamps.push(now);
    if (this.tapTimestamps.length > 8) {
      this.tapTimestamps.shift();
    }

    if (this.tapTimestamps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.tapTimestamps.length; i++) {
        intervals.push(this.tapTimestamps[i] - this.tapTimestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const instantBpm = Math.round(60000 / avgInterval);
        const clampedBpm = Math.max(40, Math.min(240, instantBpm));
        this.estimatedBpm = clampedBpm;
        this.isBpmLocked = true;
        this.isManualBpmOverride = true;

        if (this.masterSyncEnabled && this.isBinauralPlaying) {
          const tempoRatio = this.estimatedBpm / 120;
          this.syncedCarrierFreq = Math.max(30, Math.min(800, Math.round(this.baseCarrierFreq * tempoRatio * 10) / 10));
          const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
          this.updateBinaural(this.syncedCarrierFreq, targetBeatFreq);
        } else if (this.rhythmSyncEnabled && this.isBinauralPlaying) {
          const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
          this.updateBinaural(this.currentCarrierFreq, targetBeatFreq);
        }
      }
    }

    return {
      bpm: this.estimatedBpm,
      tapCount: this.tapTimestamps.length,
      isManualOverride: this.isManualBpmOverride,
    };
  }

  setManualBpm(bpm: number) {
    const clamped = Math.max(40, Math.min(240, Math.round(bpm)));
    this.estimatedBpm = clamped;
    this.isBpmLocked = true;
    this.isManualBpmOverride = true;

    if (this.masterSyncEnabled && this.isBinauralPlaying) {
      const tempoRatio = this.estimatedBpm / 120;
      this.syncedCarrierFreq = Math.max(30, Math.min(800, Math.round(this.baseCarrierFreq * tempoRatio * 10) / 10));
      const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
      this.updateBinaural(this.syncedCarrierFreq, targetBeatFreq);
    } else if (this.rhythmSyncEnabled && this.isBinauralPlaying) {
      const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
      this.updateBinaural(this.currentCarrierFreq, targetBeatFreq);
    }
  }

  resetManualBpm() {
    this.isManualBpmOverride = false;
    this.tapTimestamps = [];
    this.beatIntervals = [];
    this.isBpmLocked = false;
    if (!this.isConnected) {
      this.estimatedBpm = 130;
      this.isBpmLocked = true;
    }
  }

  getManualBpmState(): { isManualOverride: boolean; tapCount: number; bpm: number } {
    return {
      isManualOverride: this.isManualBpmOverride,
      tapCount: this.tapTimestamps.length,
      bpm: this.estimatedBpm,
    };
  }
  // --- END NEW CODE: TAP TEMPO & MANUAL BPM OVERRIDE PROTOCOL ---

  // --- START NEW CODE: MASTER SYNC ENGINE ---
  setMasterSync(enabled: boolean) {
    this.masterSyncEnabled = enabled;
    if (enabled) {
      this.rhythmSyncEnabled = true; // Linking Master Sync engages both carrier proportional scaling & beat rhythm sync
      if (this.isBinauralPlaying) {
        const tempoRatio = this.estimatedBpm / 120;
        this.syncedCarrierFreq = Math.max(30, Math.min(800, Math.round(this.baseCarrierFreq * tempoRatio * 10) / 10));
        const syncBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
        this.updateBinaural(this.syncedCarrierFreq, syncBeatFreq);
      }
    } else {
      if (this.isBinauralPlaying) {
        this.syncedCarrierFreq = this.baseCarrierFreq;
        this.updateBinaural(this.baseCarrierFreq, this.currentBeatFreq);
      }
    }
  }

  getMasterSyncState(): MasterSyncState {
    const tempoRatio = Math.round((this.estimatedBpm / 120) * 100) / 100;
    const syncedCarrier = Math.max(30, Math.min(800, Math.round(this.baseCarrierFreq * tempoRatio * 10) / 10));
    return {
      enabled: this.masterSyncEnabled,
      baseCarrierFreq: this.baseCarrierFreq,
      syncedCarrierFreq: this.masterSyncEnabled ? syncedCarrier : this.baseCarrierFreq,
      tempoRatio,
      detectedBpm: this.estimatedBpm,
      isLocked: this.isBpmLocked,
    };
  }
  // --- END NEW CODE: MASTER SYNC ENGINE ---

  getDetectedBpm(): { bpm: number; isLocked: boolean; isExternalTrack: boolean } {
    return {
      bpm: this.estimatedBpm,
      isLocked: this.isBpmLocked,
      isExternalTrack: this.isConnected,
    };
  }
  // --- END NEW CODE: DYNAMIC RHYTHM SYNC & MASTER SYNC PROTOCOLS ---
  // --- END NEW CODE: SECONDARY VOLUME & BINAURAL ENGINE CONTROLS ---


  async resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  connectExternalAudio(audioElement: HTMLMediaElement) {
    if (!this.ctx || !this.analyser || this.isConnected) return;
    try {
      const track = this.ctx.createMediaElementSource(audioElement);
      track.connect(this.analyser);
      this.isConnected = true;
    } catch (e) {
      console.warn("--> [AUDIO_WARNING]: Node already connected.", e);
    }
  }

  getSpectrum(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.dataArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  // --- START NEW CODE: REAL-TIME RHYTHM & BEAT TRACKER ---
  getRhythmData(): AudioRhythmData {
    if (this.beatCooldown > 0) this.beatCooldown--;
    if (this.snareCooldown > 0) this.snareCooldown--;

    const spectrum = this.getSpectrum();
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let isBeat = false;
    let isSnare = false;
    let beatIntensity = 0;
    let hasSignal = false;

    if (spectrum && spectrum.length > 0) {
      // Calculate Sub-bass / Bass (bins 1..7: ~86Hz - 600Hz)
      let bassSum = 0;
      for (let i = 1; i <= 7; i++) bassSum += spectrum[i] || 0;
      bass = bassSum / (7 * 255);

      // Calculate Mids / Snare / Vocals (bins 8..28: ~680Hz - 2400Hz)
      let midSum = 0;
      for (let i = 8; i <= 28; i++) midSum += spectrum[i] || 0;
      mid = midSum / (21 * 255);

      // Calculate Highs / Cymbals / Hi-hats (bins 29..90: ~2500Hz - 7700Hz)
      let trebleSum = 0;
      for (let i = 29; i <= 90; i++) trebleSum += spectrum[i] || 0;
      treble = trebleSum / (62 * 255);

      if (bass > 0.04 || mid > 0.04 || treble > 0.04) {
        hasSignal = true;
      }
    }

    if (hasSignal) {
      // User's chosen song is playing through the analyzer
      this.bassHistory.push(bass);
      if (this.bassHistory.length > 30) this.bassHistory.shift();

      this.midHistory.push(mid);
      if (this.midHistory.length > 30) this.midHistory.shift();

      const avgBass = this.bassHistory.reduce((a, b) => a + b, 0) / this.bassHistory.length;
      const avgMid = this.midHistory.reduce((a, b) => a + b, 0) / this.midHistory.length;

      // Onset detection for kick / downbeat
      const dynamicBeatThreshold = Math.max(0.24, avgBass * 1.34);
      if (bass > dynamicBeatThreshold && this.beatCooldown <= 0) {
        isBeat = true;
        beatIntensity = Math.min(1.0, Math.max(0.3, (bass - avgBass) * 3.2));
        this.beatCooldown = 9; // ~150ms minimum spacing to prevent multiple hits per stroke

        // Real-time BPM estimation from inter-beat arrival times (only when not manually overridden)
        const now = performance.now();
        if (!this.isManualBpmOverride) {
          if (this.lastBeatTimestamp > 0) {
            const deltaSec = (now - this.lastBeatTimestamp) / 1000;
            if (deltaSec >= 0.27 && deltaSec <= 1.5) { // 40 - 222 BPM valid musical range
              const instantBpm = 60 / deltaSec;
              this.beatIntervals.push(instantBpm);
              if (this.beatIntervals.length > 8) this.beatIntervals.shift();
              const sorted = [...this.beatIntervals].sort((a, b) => a - b);
              const medianBpm = sorted[Math.floor(sorted.length / 2)];
              this.estimatedBpm = Math.round(this.estimatedBpm * 0.7 + medianBpm * 0.3);
              this.isBpmLocked = this.beatIntervals.length >= 4;
            }
          }
        }
        this.lastBeatTimestamp = now;

        // Auto-shift binaural beat frequency & carrier when Master Sync or Dynamic Rhythm Sync is active
        if (this.masterSyncEnabled && this.isBinauralPlaying) {
          const tempoRatio = this.estimatedBpm / 120;
          const targetCarrier = Math.max(30, Math.min(800, Math.round(this.baseCarrierFreq * tempoRatio * 10) / 10));
          this.syncedCarrierFreq = targetCarrier;
          const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
          if (Math.abs(targetBeatFreq - this.currentBeatFreq) >= 0.05 || Math.abs(targetCarrier - this.currentCarrierFreq) >= 0.5) {
            this.updateBinaural(targetCarrier, targetBeatFreq);
          }
        } else if (this.rhythmSyncEnabled && this.isBinauralPlaying) {
          const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(this.estimatedBpm, this.rhythmSyncHarmonic);
          if (Math.abs(targetBeatFreq - this.currentBeatFreq) >= 0.05) {
            this.updateBinaural(this.currentCarrierFreq, targetBeatFreq);
          }
        }
      }

      // Onset detection for snare / mid backbeat
      const dynamicSnareThreshold = Math.max(0.22, avgMid * 1.30);
      if (mid > dynamicSnareThreshold && this.snareCooldown <= 0) {
        isSnare = true;
        this.snareCooldown = 8;
      }

      const energy = Math.min(1.0, bass * 0.45 + mid * 0.35 + treble * 0.20);

      return {
        bass,
        mid,
        treble,
        energy,
        isBeat,
        isSnare,
        beatIntensity,
        bpm: this.estimatedBpm,
        isBpmLocked: this.isBpmLocked,
        rawSpectrum: spectrum,
        isExternalTrack: true,
      };
    } else {
      // Procedural synthetic rhythm fallback (130 BPM Metronome) when no song is active
      const nowSec = performance.now() / 1000;
      const bpm = 130;
      const beatPeriod = 60 / bpm;
      const beatIndex = Math.floor(nowSec / beatPeriod);
      const beatPhase = (nowSec / beatPeriod) % 1.0;

      if (beatIndex !== this.lastBeatTime && this.beatCooldown <= 0) {
        this.lastBeatTime = beatIndex;
        isBeat = true;
        beatIntensity = 0.85;
        this.beatCooldown = 6;

        if (this.rhythmSyncEnabled && this.isBinauralPlaying) {
          const targetBeatFreq = this.getDynamicRhythmSyncBeatFreq(130, this.rhythmSyncHarmonic);
          if (Math.abs(targetBeatFreq - this.currentBeatFreq) >= 0.05) {
            this.updateBinaural(this.currentCarrierFreq, targetBeatFreq);
          }
        }
      }

      if (beatPhase >= 0.45 && beatPhase <= 0.55 && this.snareCooldown <= 0) {
        isSnare = true;
        this.snareCooldown = 8;
      }

      bass = Math.max(0, Math.exp(-beatPhase * 6));
      mid = Math.max(0, Math.exp(-Math.abs(beatPhase - 0.5) * 7));
      treble = 0.25 + 0.45 * Math.pow(Math.sin(nowSec * Math.PI * (bpm / 15)), 2);
      const energy = Math.min(1.0, bass * 0.45 + mid * 0.35 + treble * 0.20);

      return {
        bass,
        mid,
        treble,
        energy,
        isBeat,
        isSnare,
        beatIntensity: isBeat ? beatIntensity : 0,
        bpm: 130,
        isBpmLocked: true,
        rawSpectrum: spectrum,
        isExternalTrack: false,
      };
    }
  }
  // --- END NEW CODE: REAL-TIME RHYTHM & BEAT TRACKER ---

  private playTone(freq: number, type: OscillatorType, duration: number, slide?: number) {
    if (this.isMuted) return;
    if (!this.ctx || !this.gainNode) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, this.ctx.currentTime + duration);
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.gainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playExtend() { this.playTone(1000, 'triangle', 0.5, 2000); }
  playShoot() { this.playTone(880, 'square', 0.05, 440); }
  playGraze() { this.playTone(2000, 'sine', 0.03); }
  playHit() { this.playTone(150, 'sawtooth', 0.4, 10); }
  playBomb() { this.playTone(500, 'sine', 0.1, 800); }
  playItem() { this.playTone(1500, 'sine', 0.1, 2000); }

  // --- START NEW CODE: NULL OMEN PROCEDURAL AUDIO SYNTHESIS ---
  playSpellCard() {
    if (!this.ctx || !this.gainNode) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Chime sweep + Bass burst
    this.playTone(440, 'sine', 0.6, 1760);
    setTimeout(() => this.playTone(880, 'triangle', 0.4, 3520), 80);
    setTimeout(() => this.playTone(120, 'sawtooth', 0.8, 40), 120);
  }

  playLaser() {
    this.playTone(1400, 'sawtooth', 0.25, 200);
  }

  playShatter() {
    if (!this.ctx || !this.gainNode) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(2000 + Math.random() * 2000, 'square', 0.15, 300);
      }, i * 40);
    }
  }
  // --- END NEW CODE ---
}

export const audioSynth = new AudioSynth();