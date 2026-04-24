import { useInterfaceMode } from "../hooks/useInterfaceMode";

export default function AnimatedBackground() {
  const { mode } = useInterfaceMode();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <BackgroundLayer mode="pro" active={mode === "pro"} />
      <BackgroundLayer mode="lite" active={mode === "lite"} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_24%,rgba(255,255,255,0.06)_100%)]" />
    </div>
  );
}

function BackgroundLayer({
  mode,
  active,
}: {
  mode: "pro" | "lite";
  active: boolean;
}) {
  const background =
    mode === "lite"
      ? [
          "radial-gradient(120% 74% at 50% 100%, rgba(161,231,238,0.68) 0%, rgba(161,231,238,0.28) 28%, rgba(161,231,238,0) 58%)",
          "radial-gradient(96% 54% at 50% 84%, rgba(255,152,168,0.44) 0%, rgba(255,152,168,0.16) 34%, rgba(255,152,168,0) 64%)",
          "radial-gradient(85% 48% at 18% 34%, rgba(161,231,238,0.22) 0%, rgba(161,231,238,0) 62%)",
          "radial-gradient(90% 46% at 82% 36%, rgba(255,152,168,0.18) 0%, rgba(255,152,168,0) 58%)",
          "linear-gradient(180deg, #eff3f6 0%, #eef3f6 18%, #f6d7de 56%, #a1e7ee 100%)",
        ].join(", ")
      : [
          "radial-gradient(120% 74% at 50% 100%, rgba(255,60,130,0.72) 0%, rgba(255,60,130,0.34) 28%, rgba(255,60,130,0) 58%)",
          "radial-gradient(98% 56% at 50% 82%, rgba(255,152,168,0.5) 0%, rgba(255,152,168,0.22) 34%, rgba(255,152,168,0) 64%)",
          "radial-gradient(86% 48% at 18% 34%, rgba(255,152,168,0.22) 0%, rgba(255,152,168,0) 62%)",
          "radial-gradient(94% 50% at 82% 34%, rgba(255,60,130,0.18) 0%, rgba(255,60,130,0) 60%)",
          "linear-gradient(180deg, #eff3f6 0%, #f2edf0 18%, #ffc0cd 56%, #ff3c82 100%)",
        ].join(", ");

  return (
    <div
      className="absolute inset-0 transition-all duration-700 ease-out"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "scale(1)" : "scale(1.03)",
        background,
      }}
    />
  );
}
