/**
 * Procedural Web Audio Sound Synthesizer for Sommet Blanc Ski Game
 * No external sound files, 100% synthesized in real time.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Continuous sound nodes
  private skiNoiseNode: AudioBufferSourceNode | null = null;
  private skiFilterNode: BiquadFilterNode | null = null;
  private skiGainNode: GainNode | null = null;

  private windNoiseNode: AudioBufferSourceNode | null = null;
  private windFilterNode: BiquadFilterNode | null = null;
  private windGainNode: GainNode | null = null;

  private isCarvingPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.setupContinuousSounds();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      // Brownish / pink noise for soft snow friction
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  private setupContinuousSounds() {
    if (!this.ctx || !this.masterGain) return;

    try {
      // 1. Ski Carving / Snow glide
      const noiseBuffer = this.createNoiseBuffer();
      this.skiNoiseNode = this.ctx.createBufferSource();
      this.skiNoiseNode.buffer = noiseBuffer;
      this.skiNoiseNode.loop = true;

      this.skiFilterNode = this.ctx.createBiquadFilter();
      this.skiFilterNode.type = 'bandpass';
      this.skiFilterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.skiFilterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.skiGainNode = this.ctx.createGain();
      this.skiGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      this.skiNoiseNode.connect(this.skiFilterNode);
      this.skiFilterNode.connect(this.skiGainNode);
      this.skiGainNode.connect(this.masterGain);
      this.skiNoiseNode.start();

      // 2. Wind whoosh at high speeds
      this.windNoiseNode = this.ctx.createBufferSource();
      this.windNoiseNode.buffer = noiseBuffer;
      this.windNoiseNode.loop = true;

      this.windFilterNode = this.ctx.createBiquadFilter();
      this.windFilterNode.type = 'lowpass';
      this.windFilterNode.frequency.setValueAtTime(250, this.ctx.currentTime);

      this.windGainNode = this.ctx.createGain();
      this.windGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      this.windNoiseNode.connect(this.windFilterNode);
      this.windFilterNode.connect(this.windGainNode);
      this.windGainNode.connect(this.masterGain);
      this.windNoiseNode.start();

      this.isCarvingPlaying = true;
    } catch {
      // Ignore audio init issues before gesture
    }
  }

  public updateContinuousSounds(speedKmh: number, isCarving: boolean, isGrounded: boolean) {
    if (!this.ctx || !this.skiGainNode || !this.skiFilterNode || !this.windGainNode || !this.windFilterNode) return;
    if (this.isMuted) return;

    const now = this.ctx.currentTime;
    const speedRatio = Math.min(Math.max(speedKmh / 90, 0), 1.4);

    if (isGrounded) {
      // Ski sound active on ground
      const targetSkiGain = isCarving ? (0.15 + speedRatio * 0.25) : (0.05 + speedRatio * 0.12);
      const targetFreq = isCarving ? (900 + speedRatio * 800) : (450 + speedRatio * 500);
      this.skiGainNode.gain.setTargetAtTime(targetSkiGain, now, 0.05);
      this.skiFilterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);
    } else {
      // In air - ski friction silent
      this.skiGainNode.gain.setTargetAtTime(0, now, 0.08);
    }

    // Wind sound scales with high speed
    const targetWindGain = Math.max(0, (speedRatio - 0.2) * 0.22);
    const targetWindFreq = 200 + speedRatio * 700;
    this.windGainNode.gain.setTargetAtTime(targetWindGain, now, 0.1);
    this.windFilterNode.frequency.setTargetAtTime(targetWindFreq, now, 0.1);
  }

  public stopContinuousSounds() {
    if (this.skiGainNode && this.ctx) {
      this.skiGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    if (this.windGainNode && this.ctx) {
      this.windGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playJump() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playLand() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Soft snow crunch: short low noise burst + sine thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playGatePass(comboCount: number = 1) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Musical bell chime, ascending pitch with combo!
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const noteIndex = Math.min(comboCount - 1, baseFreqs.length - 1);
    const baseFreq = baseFreqs[Math.max(0, noteIndex)];

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, now); // 1 octave higher overtone

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  public playTrickSuccess() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Quick celebratory high arpeggio
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playBoost() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playCrash() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy impact thud + distorted crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playVictory() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Majestic alpine brass fanfare
    const chords = [
      { t: 0, notes: [440, 554.37, 659.25] },      // A maj
      { t: 0.22, notes: [493.88, 622.25, 739.99] }, // B maj
      { t: 0.44, notes: [554.37, 659.25, 880] },    // C#m / A high
      { t: 0.72, notes: [659.25, 830.61, 987.77, 1318.51] }, // E maj triumphant
    ];

    chords.forEach(({ t, notes }) => {
      notes.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);
        const duration = t === 0.72 ? 1.0 : 0.25;
        gain.gain.setValueAtTime(0.14, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + duration);
      });
    });
  }

  public playGameOver() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [330, 311.13, 293.66, 261.63];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playClick() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const sounds = new SoundManager();
