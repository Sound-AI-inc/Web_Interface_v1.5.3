import audioBufferToWav from "audiobuffer-to-wav";

/** Copy an AudioBuffer into a new one (to avoid mutating the source when we render). */
export function copyBuffer(source: AudioBuffer): AudioBuffer {
  const ctx = new OfflineAudioContext(
    source.numberOfChannels,
    source.length,
    source.sampleRate,
  );
  const out = ctx.createBuffer(source.numberOfChannels, source.length, source.sampleRate);
  for (let c = 0; c < source.numberOfChannels; c++) {
    out.copyToChannel(source.getChannelData(c), c);
  }
  return out;
}

/** Trim buffer to [startSec, endSec). */
export function trim(source: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const sr = source.sampleRate;
  const start = Math.max(0, Math.floor(startSec * sr));
  const end = Math.min(source.length, Math.floor(endSec * sr));
  const len = Math.max(1, end - start);
  const ctx = new OfflineAudioContext(source.numberOfChannels, len, sr);
  const out = ctx.createBuffer(source.numberOfChannels, len, sr);
  for (let c = 0; c < source.numberOfChannels; c++) {
    const data = source.getChannelData(c).subarray(start, start + len);
    out.copyToChannel(data, c);
  }
  return out;
}

/** Apply linear fade in over the first `seconds`. */
export function fadeIn(source: AudioBuffer, seconds: number): AudioBuffer {
  const out = copyBuffer(source);
  const n = Math.min(out.length, Math.floor(seconds * out.sampleRate));
  for (let c = 0; c < out.numberOfChannels; c++) {
    const data = out.getChannelData(c);
    for (let i = 0; i < n; i++) data[i] *= i / n;
  }
  return out;
}

/** Apply linear fade out over the last `seconds`. */
export function fadeOut(source: AudioBuffer, seconds: number): AudioBuffer {
  const out = copyBuffer(source);
  const n = Math.min(out.length, Math.floor(seconds * out.sampleRate));
  for (let c = 0; c < out.numberOfChannels; c++) {
    const data = out.getChannelData(c);
    for (let i = 0; i < n; i++) data[out.length - n + i] *= 1 - i / n;
  }
  return out;
}

/** Normalize the buffer peak to 1.0. */
export function normalize(source: AudioBuffer): AudioBuffer {
  const out = copyBuffer(source);
  let peak = 0;
  for (let c = 0; c < out.numberOfChannels; c++) {
    const data = out.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  if (peak === 0 || peak >= 0.999) return out;
  const gain = 1 / peak;
  for (let c = 0; c < out.numberOfChannels; c++) {
    const data = out.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] *= gain;
  }
  return out;
}

export function reverse(source: AudioBuffer): AudioBuffer {
  const out = copyBuffer(source);
  for (let c = 0; c < out.numberOfChannels; c++) {
    const data = out.getChannelData(c);
    data.reverse();
  }
  return out;
}

/** Encode an AudioBuffer as a WAV Blob. */
export function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const wav = audioBufferToWav(buffer);
  return new Blob([wav], { type: "audio/wav" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Decode an ArrayBuffer (uploaded file) into an AudioBuffer via a plain AudioContext. */
export async function decodeArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const Ctor: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();
  const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  await ctx.close();
  return buffer;
}
