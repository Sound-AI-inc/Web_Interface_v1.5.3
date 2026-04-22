interface WaveformThumbProps {
  hue: string;
  className?: string;
}

/**
 * Static visual placeholder used for legacy thumbs (kept for compatibility).
 * New result cards use AudioPreview / MidiPreview / PresetPreview instead.
 */
export default function WaveformThumb({ hue, className = "" }: WaveformThumbProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-input bg-gradient-to-br ${hue} ${className}`}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 120 40"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const h = 6 + Math.abs(Math.sin(i * 0.42 + i * 0.11)) * 28;
          return (
            <rect
              key={i}
              x={i * 2}
              y={20 - h / 2}
              width={1.2}
              height={h}
              fill="rgba(255,255,255,0.85)"
              rx={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
}
