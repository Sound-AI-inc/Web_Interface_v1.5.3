/** Seed-based audio buffer for editor import (matches preview synthesis). */
export async function synthesizeAssetBuffer(
  seed: number,
  durationSeconds: number,
): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * Math.min(durationSeconds, 12));
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const baseFreq = 72 + (seed * 19) % 96;
  const beatLength = 60 / (82 + (seed % 6) * 11);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let noiseState = (seed * 9301 + channel * 49297 + 233280) >>> 0;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const arc = Math.sin((Math.PI * i) / length) ** 0.72;
      const beatPhase = (t % beatLength) / beatLength;
      const kickEnv = Math.exp(-beatPhase * 11);
      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const noise = (noiseState / 4294967296 - 0.5) * 2;
      const sub = Math.sin(2 * Math.PI * baseFreq * t) * 0.24;
      const kick = Math.sin(2 * Math.PI * (42 + kickEnv * 54) * t) * kickEnv * 0.18;
      data[i] = Math.tanh((sub + kick + noise * 0.08) * arc * 0.82) * 0.78;
    }
  }

  await ctx.close();
  return buffer;
}
