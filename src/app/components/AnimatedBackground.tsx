import { useInterfaceMode } from "../hooks/useInterfaceMode";

const BACKGROUNDS = {
  lite:
    "linear-gradient(180deg, #a1e7ee 0%, #cdecef 34%, #eff3f6 100%)",
  pro:
    "linear-gradient(180deg, #ff3c82 0%, #ff8db4 28%, #eff3f6 100%)",
} as const;

export default function AnimatedBackground() {
  const { mode } = useInterfaceMode();

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
      style={{
        background: BACKGROUNDS[mode],
      }}
    />
  );
}
