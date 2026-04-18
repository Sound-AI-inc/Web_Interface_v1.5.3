import { useInterfaceMode } from "../hooks/useInterfaceMode";

/**
 * Full-viewport animated wavy background that shifts colour palette when the
 * user toggles between Lite and Pro interface modes.
 *
 * Pro  → pink (#FF3C82) / coral / magenta flowing waves
 * Lite → steel-blue / cool-gray minimal waves
 *
 * Uses CSS keyframe animations on SVG blobs so it's GPU-composited and
 * doesn't block the main thread.
 */
export default function AnimatedBackground() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-700"
      aria-hidden
    >
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="blur1">
            <feGaussianBlur in="SourceGraphic" stdDeviation="80" />
          </filter>
          <filter id="blur2">
            <feGaussianBlur in="SourceGraphic" stdDeviation="100" />
          </filter>
        </defs>

        {/* Wave 1 — large slow drift */}
        <ellipse
          className="animate-wave-drift-1"
          cx="400"
          cy="600"
          rx="600"
          ry="320"
          fill={isPro ? "rgba(255,60,130,0.10)" : "rgba(140,170,200,0.08)"}
          filter="url(#blur1)"
          style={{ transition: "fill 0.8s ease-in-out" }}
        />

        {/* Wave 2 — medium counter-drift */}
        <ellipse
          className="animate-wave-drift-2"
          cx="1100"
          cy="300"
          rx="500"
          ry="280"
          fill={isPro ? "rgba(255,152,168,0.09)" : "rgba(161,231,238,0.07)"}
          filter="url(#blur2)"
          style={{ transition: "fill 0.8s ease-in-out" }}
        />

        {/* Wave 3 — small accent float */}
        <ellipse
          className="animate-wave-drift-3"
          cx="720"
          cy="450"
          rx="380"
          ry="200"
          fill={isPro ? "rgba(255,60,130,0.06)" : "rgba(180,195,210,0.05)"}
          filter="url(#blur1)"
          style={{ transition: "fill 0.8s ease-in-out" }}
        />
      </svg>

      {/* Inject keyframes via a <style> block to keep everything self-contained */}
      <style>{`
        @keyframes waveDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(60px, -40px) scale(1.05); }
          66%  { transform: translate(-40px, 30px) scale(0.97); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(-50px, 50px) scale(1.04); }
          66%  { transform: translate(40px, -30px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, -20px) scale(1.06); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-wave-drift-1 { animation: waveDrift1 18s ease-in-out infinite; }
        .animate-wave-drift-2 { animation: waveDrift2 22s ease-in-out infinite; }
        .animate-wave-drift-3 { animation: waveDrift3 15s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
