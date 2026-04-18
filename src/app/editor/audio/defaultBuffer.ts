/**
 * Synthesize a short default sample so Editor Mode works out-of-the-box
 * without shipping binary audio assets. A descending minor arpeggio on a
 * warm sine+triangle pad, ~4 seconds.
 */
export async function generateDefaultAudioBuffer(): Promise<AudioBuffer> {
  const sampleRate = 44100;
  const durationSec = 4;
  const length = Math.floor(sampleRate * durationSec);
  const offline = new OfflineAudioContext(2, length, sampleRate);

  // Root Am chord arpeggio: A2, E3, A3, C4, E4, A4
  const freqs = [110, 164.81, 220, 261.63, 329.63, 440];
  const noteLen = durationSec / freqs.length;

  freqs.forEach((f, i) => {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    const filter = offline.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;

    osc.type = i % 2 === 0 ? "sine" : "triangle";
    osc.frequency.value = f;

    const start = i * noteLen;
    const end = start + noteLen;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, end - 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offline.destination);
    osc.start(start);
    osc.stop(end);
  });

  return await offline.startRendering();
}
