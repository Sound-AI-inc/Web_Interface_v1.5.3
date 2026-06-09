import { Lock } from "lucide-react";
import PageContainer from "../components/PageContainer";
import EditorPanel from "../editor/components/EditorPanel";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

export default function EditorMode() {
  const { mode } = useInterfaceMode();

  if (mode !== "pro") {
    return (
      <div className="premium-workspace pb-8">
        <PageContainer
          title="Editor Mode"
          subtitle="Lightweight editing layer for generated audio, MIDI, and preset assets."
        >
          <div className="premium-gate flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-8 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)]">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
              Pro workspace required
            </h2>
            <p className="mt-2 max-w-md font-codec text-sm text-[var(--text-secondary)]">
              Editor Mode unlocks audio trimming, MIDI piano roll, and synth preset editing.
              Switch to Pro using the toggle in the top bar to access the full editing workspace.
            </p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="premium-workspace premium-editor pb-6">
      <PageContainer
        title="Editor Mode"
        subtitle="Lightweight editing layer for generated audio, MIDI, and preset assets."
      >
        <EditorPanel />
      </PageContainer>
    </div>
  );
}
