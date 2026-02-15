export class AudioSynth {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  
  playExtend() { 
      this.playTone(1000, 'triangle', 0.5, 2000); // 1UP Sound
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.2;
    this.gainNode.connect(this.ctx.destination);
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

  playShoot() { this.playTone(880, 'square', 0.05, 440); }
  playGraze() { this.playTone(2000, 'sine', 0.03); }
  playHit() { this.playTone(150, 'sawtooth', 0.4, 10); }
  playItem() { this.playTone(1200, 'sine', 0.1, 2400); }
  playBomb() { this.playTone(500, 'sine', 0.1, 800)}
}
export const audioSynth = new AudioSynth();