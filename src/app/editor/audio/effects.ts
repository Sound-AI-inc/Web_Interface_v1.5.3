import * as Tone from "tone";
import type { EffectsParams } from "../core/types";

/**
 * Tone.js effects chain for the wavesurfer preview signal. WaveSurfer owns
 * audio playback through its own <audio> element, so for effect preview we
 * route a dedicated Tone.Player fed with the same buffer when the user is
 * auditioning an effect. This keeps WaveSurfer's deterministic scrub/visuals
 * in sync with the editable source of truth (the buffer).
 */
export class EffectsChain {
  player: Tone.Player | null = null;
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  chorus: Tone.Chorus;
  compressor: Tone.Compressor;
  eqLow: Tone.Filter;
  eqMid: Tone.Filter;
  eqHigh: Tone.Filter;
  output: Tone.Gain;

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2, wet: 0 });
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0, wet: 0 });
    this.chorus = new Tone.Chorus({ frequency: 1.5, depth: 0, wet: 0 }).start();
    this.compressor = new Tone.Compressor({ threshold: 0, ratio: 4 });
    this.eqLow = new Tone.Filter({ type: "lowshelf", frequency: 200, gain: 0 });
    this.eqMid = new Tone.Filter({ type: "peaking", frequency: 1000, gain: 0, Q: 1 });
    this.eqHigh = new Tone.Filter({ type: "highshelf", frequency: 4000, gain: 0 });
    this.output = new Tone.Gain(1).toDestination();

    this.chainAll();
  }

  private chainAll() {
    this.eqLow.chain(
      this.eqMid,
      this.eqHigh,
      this.compressor,
      this.chorus,
      this.delay,
      this.reverb,
      this.output,
    );
  }

  async loadBuffer(buffer: AudioBuffer) {
    if (this.player) {
      this.player.dispose();
    }
    const toneBuf = new Tone.ToneAudioBuffer();
    toneBuf.set(buffer as unknown as AudioBuffer);
    this.player = new Tone.Player(toneBuf);
    this.player.connect(this.eqLow);
  }

  apply(p: EffectsParams) {
    this.reverb.wet.value = p.reverbEnabled ? p.reverbWet : 0;
    this.delay.delayTime.value = p.delayTime;
    this.delay.feedback.value = p.delayEnabled ? p.delayFeedback : 0;
    this.delay.wet.value = p.delayEnabled ? 0.5 : 0;
    this.chorus.depth = p.chorusEnabled ? p.chorusDepth : 0;
    this.chorus.wet.value = p.chorusEnabled ? 1 : 0;
    this.compressor.threshold.value = p.compressorEnabled ? p.compressorThreshold : 0;
    this.compressor.ratio.value = p.compressorEnabled ? 4 : 1;
    this.eqLow.gain.value = p.eqEnabled ? p.eqLow : 0;
    this.eqMid.gain.value = p.eqEnabled ? p.eqMid : 0;
    this.eqHigh.gain.value = p.eqEnabled ? p.eqHigh : 0;
  }

  async play() {
    if (!this.player) return;
    await Tone.start();
    this.player.start();
  }

  stop() {
    this.player?.stop();
  }

  dispose() {
    this.player?.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.chorus.dispose();
    this.compressor.dispose();
    this.eqLow.dispose();
    this.eqMid.dispose();
    this.eqHigh.dispose();
    this.output.dispose();
  }
}
