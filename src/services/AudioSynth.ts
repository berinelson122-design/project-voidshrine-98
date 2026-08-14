export class AudioSynth {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isConnected: boolean = false;

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.3;

    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
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

  private playTone(freq: number, type: OscillatorType, duration: number, slide?: number) {
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