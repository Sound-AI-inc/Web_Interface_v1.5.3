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
          "radial-gradient(76% 44% at 50% 12%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.22) 42%, rgba(255,255,255,0) 74%)",
          "radial-gradient(80% 52% at 20% 34%, rgba(161,231,238,0.5) 0%, rgba(161,231,238,0.12) 38%, rgba(161,231,238,0) 66%)",
          "radial-gradient(80% 52% at 82% 34%, rgba(161,231,238,0.42) 0%, rgba(161,231,238,0.1) 36%, rgba(161,231,238,0) 64%)",
          "radial-gradient(74% 50% at 50% 58%, rgba(118,149,255,0.48) 0%, rgba(118,149,255,0.18) 32%, rgba(118,149,255,0) 60%)",
          "radial-gradient(110% 82% at 50% 100%, rgba(255,152,168,0.88) 0%, rgba(255,152,168,0.54) 30%, rgba(255,152,168,0.1) 56%, rgba(255,152,168,0) 78%)",
          "linear-gradient(180deg, #eff3f6 0%, #ddecf6 24%, #7f9eff 56%, #de84df 78%, #a1e7ee 100%)",
        ].join(", ")
      : [
          "radial-gradient(76% 44% at 50% 12%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.22) 42%, rgba(255,255,255,0) 74%)",
          "radial-gradient(80% 52% at 18% 34%, rgba(112,144,255,0.46) 0%, rgba(112,144,255,0.14) 40%, rgba(112,144,255,0) 68%)",
          "radial-gradient(80% 52% at 82% 34%, rgba(112,144,255,0.42) 0%, rgba(112,144,255,0.12) 38%, rgba(112,144,255,0) 66%)",
          "radial-gradient(74% 50% at 50% 58%, rgba(136,106,255,0.46) 0%, rgba(136,106,255,0.18) 32%, rgba(136,106,255,0) 60%)",
          "radial-gradient(110% 82% at 50% 100%, rgba(255,60,130,0.92) 0%, rgba(255,60,130,0.58) 30%, rgba(255,152,168,0.18) 56%, rgba(255,60,130,0) 78%)",
          "linear-gradient(180deg, #eff3f6 0%, #dfe8f8 24%, #6788ff 56%, #d885df 78%, #ff3c82 100%)",
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
