import EditorPanel from "../editor/components/EditorPanel";
import { useEditorBootstrap } from "../editor/hooks/useEditorBootstrap";
import ProGate from "../components/ProGate";
import EditorContextBar from "../components/workspace/EditorContextBar";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { useLanguage } from "../i18n/LanguageProvider";

function EditorWorkspace() {
  const { assetTitle } = useEditorBootstrap();

  return (
    <WorkspacePageShell
      title="Editor Mode"
      subtitle="Lightweight editing layer for generated audio, MIDI, and preset assets."
    >
      <EditorContextBar assetTitle={assetTitle} />
      <div className="premium-editor-workspace rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 shadow-[var(--ui-shadow-soft)] md:p-5">
        <EditorPanel />
      </div>
    </WorkspacePageShell>
  );
}

export default function EditorMode() {
  const { mode } = useInterfaceMode();
  const { t } = useLanguage();

  if (mode !== "pro") {
    return (
      <ProGate
        title={t("editor.title")}
        subtitle={t("editor.subtitle")}
        feature="Editor Mode unlocks audio trimming, MIDI piano roll, and synth preset editing."
      />
    );
  }

  return <EditorWorkspace />;
}
