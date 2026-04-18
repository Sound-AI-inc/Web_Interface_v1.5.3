interface WaveformThumbProps {
  hue: string;
  className?: string;
}

/**
 * Decorative waveform thumbnail rendered with CSS bars.
 * `hue` is a tailwind gradient class fragment like "from-[#...] via-[#...] to-[#...]".
 */
export default function WaveformThumb({ hue, className = "" }: WaveformThumbProps) {
  const bars = Array.from({ length: 48 });
  return (
    <div
      className={`relative overflow-hidden rounded-card bg-gradient-to-r ${hue} ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-3">
        {bars.map((_, i) => {
          const h = 20 + Math.abs(Math.sin(i * 0.45) * 70);
          return (
            <span
              key={i}
              className="w-[2px] rounded-full bg-white/70"
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
