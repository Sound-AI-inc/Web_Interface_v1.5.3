declare module "audiobuffer-to-wav" {
  export default function audioBufferToWav(
    buffer: AudioBuffer,
    opt?: { float32?: boolean },
  ): ArrayBuffer;
}
