import { useInterfaceMode } from "../hooks/useInterfaceMode";

/**
 * Static full-viewport gradient background that shifts colour palette when
 * the user toggles between Lite and Pro interface modes.
 *
 * Lite → #A1E7EE → #EFF3F6
 * Pro  → #FF3C82 → #EFF3F6
 *
 * The previous implementation rendered five large SVG ellipses with
 * GaussianBlur filters and infinite keyframe animations. GaussianBlur
 * filters at that radius are extremely expensive to composite and ran on
 * every frame, which caused visible stutter during interaction. A flat
 * CSS gradient is free to render and matches the design direction.
 *
 * CSS cannot interpolate between `linear-gradient()` image values, so the
 * fade between Lite and Pro is implemented by stacking both gradients and
 * cross-fading their `opacity` — which IS animatable.
 */
export default function AnimatedBackground() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const lite = "linear-gradient(135deg, #A1E7EE 0%, #EFF3F6 100%)";
  const pro = "linear-gradient(135deg, #FF3C82 0%, #EFF3F6 100%)";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{ background: lite, opacity: isPro ? 0 : 1 }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{ background: pro, opacity: isPro ? 1 : 0 }}
      />
    </div>
  );
}
