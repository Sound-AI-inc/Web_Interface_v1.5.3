import * as Tone from "tone";
import type { SynthParams } from "../core/types";

export class SynthEngine {
  private synth: Tone.MonoSynth | null = null;
  private filter: Tone.Filter | null = null;
  private lfo: Tone.LFO | null = null;

  async ensureStarted() {
    await Tone.start();
    if (!this.synth) {
      this.filter = new Tone.Filter({ type: "lowpass", frequency: 1200, Q: 1 });
      this.synth = new Tone.MonoSynth({
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.4 },
        oscillator: { type: "sawtooth" },
      });
      this.synth.chain(this.filter, Tone.getDestination());
    }
  }

  applyParams(p: SynthParams) {
    if (!this.synth || !this.filter) return;
    this.synth.envelope.attack = p.attack;
    this.synth.envelope.decay = p.decay;
    this.synth.envelope.sustain = p.sustain;
    this.synth.envelope.release = p.release;
    this.filter.frequency.value = p.filterCutoff;
    this.filter.Q.value = p.filterResonance;

    // LFO → filter cutoff
    if (this.lfo) {
      this.lfo.stop();
      this.lfo.dispose();
      this.lfo = null;
    }
    if (p.lfoDepth > 0 && this.filter) {
      const depthHz = p.lfoDepth * 2000;
      this.lfo = new Tone.LFO({
        frequency: p.lfoRate,
        min: Math.max(60, p.filterCutoff - depthHz),
        max: Math.min(20000, p.filterCutoff + depthHz),
      }).start();
      this.lfo.connect(this.filter.frequency);
    }
  }

  async playTestNote(note = "C4", duration = 0.5) {
    await this.ensureStarted();
    if (!this.synth) return;
    this.synth.triggerAttackRelease(note, duration);
  }

  dispose() {
    this.lfo?.dispose();
    this.filter?.dispose();
    this.synth?.dispose();
    this.synth = null;
    this.filter = null;
    this.lfo = null;
  }
}
