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
 */
export default function AnimatedBackground() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const background = isPro
    ? "linear-gradient(135deg, #FF3C82 0%, #EFF3F6 100%)"
    : "linear-gradient(135deg, #A1E7EE 0%, #EFF3F6 100%)";

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background, transition: "background 400ms ease-out" }}
      aria-hidden
    />
  );
}
