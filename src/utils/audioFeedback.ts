/**
 * Reactive Electrical Audio Feedback Engine
 * Synthesizes subtle electrical humming and static noise that dynamically
 * scales in volume, pitch, and frequency based on the calculated current (I).
 */

class CircuitAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private staticGain: GainNode | null = null;

  private osc1: OscillatorNode | null = null; // Fundamental 55-110Hz
  private osc2: OscillatorNode | null = null; // 2nd Harmonic
  private osc3: OscillatorNode | null = null; // Sub/Odd Harmonic

  private noiseFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. HUM SYNTHESIS (Transformer / Mains Electrical Drone)
      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.humGain.connect(this.masterGain);

      // Fundamental oscillator (Sine wave)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      // 2nd harmonic (Triangle wave for rich transformer buzzing)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.osc2.connect(osc2Gain);
      osc2Gain.connect(this.humGain);

      // 3rd harmonic (subtle texture)
      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'sine';
      this.osc3.frequency.setValueAtTime(165, this.ctx.currentTime);

      const osc3Gain = this.ctx.createGain();
      osc3Gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.osc3.connect(osc3Gain);
      osc3Gain.connect(this.humGain);

      this.osc1.connect(this.humGain);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();

      // 2. ELECTRICAL STATIC & SIZZLE (Subtle filtered noise)
      this.staticGain = this.ctx.createGain();
      this.staticGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);
      this.noiseFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      // Create 2-second looped pink/white noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Soft pink noise filter
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.04;
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.noiseFilter);
      this.noiseFilter.connect(this.staticGain);
      this.staticGain.connect(this.masterGain);
      this.noiseSource.start();

      this.isInitialized = true;
    } catch {
      // AudioContext not allowed or not supported in environment
    }
  }

  /**
   * Update audio parameters reactively based on circuit current (I)
   */
  public update(current: number, isPaused: boolean, isEnabled: boolean) {
    if (!this.isInitialized || !this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended' && isEnabled) {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    if (!isEnabled || isPaused || current <= 0.001) {
      // Smooth fade to silence
      this.masterGain.gain.setTargetAtTime(0, now, 0.06);
      return;
    }

    // 1. PITCH SCALING:
    // Base frequency at 55Hz (low hum) scaling smoothly up to ~110Hz at 12A
    // Current typically 0.01A to 12.0A
    const normI = Math.min(1.0, current / 10.0); // 0 to 1
    const baseFreq = 50 + normI * 45; // 50Hz to 95Hz

    if (this.osc1 && this.osc2 && this.osc3) {
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
      this.osc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.08);
      this.osc3.frequency.setTargetAtTime(baseFreq * 3, now, 0.08);
    }

    // 2. STATIC FILTER FREQUENCY:
    // Filter frequency opens up with high current (more sizzle)
    if (this.noiseFilter) {
      const filterFreq = 1200 + normI * 1600; // 1200Hz to 2800Hz
      this.noiseFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    }

    // 3. VOLUME SCALING:
    // Master volume scales with current: subtle hum at low current,
    // audible electrical buzz at high current.
    // Capped at 0.14 for gentle, non-fatiguing listening.
    const targetMasterVolume = Math.max(0.015, Math.min(0.14, 0.02 + Math.pow(normI, 0.65) * 0.11));
    this.masterGain.gain.setTargetAtTime(targetMasterVolume, now, 0.08);

    // Static volume scales higher when current is large
    if (this.staticGain) {
      const targetStaticGain = Math.pow(normI, 1.2) * 0.35;
      this.staticGain.gain.setTargetAtTime(targetStaticGain, now, 0.08);
    }
  }

  public dispose() {
    try {
      if (this.osc1) this.osc1.stop();
      if (this.osc2) this.osc2.stop();
      if (this.osc3) this.osc3.stop();
      if (this.noiseSource) this.noiseSource.stop();
      if (this.ctx) this.ctx.close();
    } catch {
      // ignore
    }
    this.isInitialized = false;
  }
}

export const circuitAudio = new CircuitAudioEngine();
