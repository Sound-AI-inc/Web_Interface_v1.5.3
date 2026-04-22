import { useInterfaceMode } from "../hooks/useInterfaceMode";

/**
 * Full-viewport animated wavy background that shifts colour palette when the
 * user toggles between Lite and Pro interface modes.
 *
 * Pro  → pink (#FF3C82) / coral / magenta flowing waves
 * Lite → steel-blue / cool-gray minimal waves
 *
 * Uses CSS keyframe animations on SVG blobs so it's GPU-composited and
 * doesn't block the main thread. Blur radii are intentionally large so the
 * movement reads as ambient colour rather than distinct shapes.
 */
export default function AnimatedBackground() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const transition = { transition: "fill 1.2s ease-in-out" };

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="blurSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="130" />
          </filter>
          <filter id="blurHeavy" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="160" />
          </filter>
        </defs>

        {/* Wave 1 — large slow drift, primary accent */}
        <ellipse
          className="animate-wave-drift-1"
          cx="380"
          cy="620"
          rx="680"
          ry="360"
          fill={isPro ? "rgba(255,60,130,0.22)" : "rgba(140,170,200,0.18)"}
          filter="url(#blurSoft)"
          style={transition}
        />

        {/* Wave 2 — medium counter-drift, secondary accent */}
        <ellipse
          className="animate-wave-drift-2"
          cx="1120"
          cy="280"
          rx="560"
          ry="320"
          fill={isPro ? "rgba(255,152,168,0.22)" : "rgba(161,231,238,0.18)"}
          filter="url(#blurHeavy)"
          style={transition}
        />

        {/* Wave 3 — center float, magenta/cool accent */}
        <ellipse
          className="animate-wave-drift-3"
          cx="720"
          cy="460"
          rx="460"
          ry="240"
          fill={isPro ? "rgba(215,60,180,0.16)" : "rgba(180,195,210,0.12)"}
          filter="url(#blurSoft)"
          style={transition}
        />

        {/* Wave 4 — bottom right warm tail */}
        <ellipse
          className="animate-wave-drift-4"
          cx="1250"
          cy="780"
          rx="520"
          ry="260"
          fill={isPro ? "rgba(255,100,140,0.18)" : "rgba(150,180,205,0.14)"}
          filter="url(#blurHeavy)"
          style={transition}
        />

        {/* Wave 5 — top left cool tail */}
        <ellipse
          className="animate-wave-drift-5"
          cx="160"
          cy="140"
          rx="480"
          ry="220"
          fill={isPro ? "rgba(255,180,190,0.16)" : "rgba(170,200,220,0.14)"}
          filter="url(#blurSoft)"
          style={transition}
        />
      </svg>

      <style>{`
        @keyframes waveDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(70px, -50px) scale(1.06); }
          66%  { transform: translate(-50px, 40px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(-60px, 60px) scale(1.05); }
          66%  { transform: translate(50px, -40px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(40px, -30px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveDrift4 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-40px, -20px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveDrift5 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, 30px) scale(1.04); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-wave-drift-1 { animation: waveDrift1 22s ease-in-out infinite; }
        .animate-wave-drift-2 { animation: waveDrift2 26s ease-in-out infinite; }
        .animate-wave-drift-3 { animation: waveDrift3 18s ease-in-out infinite; }
        .animate-wave-drift-4 { animation: waveDrift4 30s ease-in-out infinite; }
        .animate-wave-drift-5 { animation: waveDrift5 24s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
