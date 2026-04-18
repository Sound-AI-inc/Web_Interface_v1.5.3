import PageContainer from "../components/PageContainer";
import EditorPanel from "../editor/components/EditorPanel";

export default function EditorMode() {
  return (
    <PageContainer
      title="Editor Mode"
      subtitle="Lightweight editing layer for generated audio, MIDI, and preset assets."
    >
      <EditorPanel />
    </PageContainer>
  );
}
