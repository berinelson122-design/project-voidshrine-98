class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  public initialized = false;

  init() {
    if (this.initialized) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.gainNode = this.ctx!.createGain();
    this.gainNode.gain.value = 0.3; 
    this.gainNode.connect(this.ctx!.destination);
    this.initialized = true;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, slide?: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) {
        osc.frequency.exponentialRampToValueAtTime(slide, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playShoot() { this.playTone(880, 'square', 0.1, 440); }
  playHit() { this.playTone(100, 'sawtooth', 0.5, 10); } 
  playGraze() { this.playTone(2000, 'sine', 0.05); } 
  
  // -- THE MISSING METHODS --
  playItem() { this.playTone(1500, 'sine', 0.1, 2000); } 
  
  playBomb() { 
      if (!this.ctx || !this.gainNode) return;
      const bufferSize = this.ctx.sampleRate * 1.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
      noise.connect(noiseGain);
      noiseGain.connect(this.gainNode);
      noise.start();
  }
}

export const audioSynth = new AudioSynthesizer();