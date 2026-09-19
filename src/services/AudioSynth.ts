// --- START NEW CODE: TELLURIC RHYTHM & BEAT ANALYSIS TYPES ---
export interface AudioRhythmData {
  bass: number;          // 0.0 to 1.0 (sub-bass / kick drum energy)
  mid: number;           // 0.0 to 1.0 (snare / mid synth energy)
  treble: number;        // 0.0 to 1.0 (hi-hat / cymbal energy)
  energy: number;        // 0.0 to 1.0 (overall weighted acoustic energy)
  isBeat: boolean;       // true if an energetic kick/bass transient hit on this frame
  isSnare: boolean;      // true if a mid-frequency transient hit on this frame
  beatIntensity: number; // 0.0 to 1.0 relative strength of the beat
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

  // --- START NEW CODE: BEAT DETECTION AND RHYTHM BUFFERS ---
  private bassHistory: number[] = [];
  private midHistory: number[] = [];
  private beatCooldown: number = 0;
  private snareCooldown: number = 0;
  private lastBeatTime: number = 0;
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