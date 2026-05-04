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
          "radial-gradient(78% 44% at 50% 12%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.26) 42%, rgba(255,255,255,0) 74%)",
          'radial-gradient(68% 48% at 18% 34%, rgba(161,231,238,0.58) 0%, rgba(161,231,238,0.18) 34%, rgba(161,231,238,0) 66%)',
          'radial-gradient(68% 48% at 82% 34%, rgba(161,231,238,0.54) 0%, rgba(161,231,238,0.16) 34%, rgba(161,231,238,0) 66%)',
          'radial-gradient(76% 52% at 50% 58%, rgba(255,152,168,0.42) 0%, rgba(255,152,168,0.18) 34%, rgba(255,152,168,0) 64%)',
          'radial-gradient(116% 82% at 50% 100%, rgba(255,152,168,0.92) 0%, rgba(255,152,168,0.56) 28%, rgba(161,231,238,0.22) 54%, rgba(255,152,168,0) 76%)',
          "linear-gradient(180deg, #eff3f6 0%, #edf3f5 26%, #f2dce3 58%, #ff98a8 80%, #a1e7ee 100%)",
        ].join(", ")
      : [
          "radial-gradient(78% 44% at 50% 12%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.26) 42%, rgba(255,255,255,0) 74%)",
          'radial-gradient(68% 48% at 18% 34%, rgba(255,152,168,0.36) 0%, rgba(255,152,168,0.14) 34%, rgba(255,152,168,0) 66%)',
          'radial-gradient(68% 48% at 82% 34%, rgba(255,152,168,0.34) 0%, rgba(255,152,168,0.12) 34%, rgba(255,152,168,0) 66%)',
          'radial-gradient(76% 52% at 50% 58%, rgba(255,60,130,0.42) 0%, rgba(255,60,130,0.18) 34%, rgba(255,60,130,0) 64%)',
          'radial-gradient(116% 82% at 50% 100%, rgba(255,60,130,0.96) 0%, rgba(255,60,130,0.62) 28%, rgba(255,152,168,0.24) 54%, rgba(255,60,130,0) 76%)',
          "linear-gradient(180deg, #eff3f6 0%, #f1eef3 24%, #f6d4df 58%, #ff98a8 80%, #ff3c82 100%)",
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
