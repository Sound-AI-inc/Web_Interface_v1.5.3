import { useEffect, useState } from "react";
import { consumeEditorIntent, kindToEditorTab } from "../../lib/editorIntent";
import { useLibraryStore } from "../../state/libraryStore";
import { selectActiveChat, useWorkspaceStore } from "../../state/workspaceStore";
import type { AudioResult } from "../../data/mock";
import { useEditor } from "../core/store";
import type { MidiNote } from "../core/types";

function findAsset(assetId: string, sessionAssets: AudioResult[]) {
  const fromSession = sessionAssets.find((a) => a.id === assetId);
  if (fromSession) return fromSession;
  return useLibraryStore.getState().assets.find((a) => a.id === assetId) ?? null;
}

export function useEditorBootstrap() {
  const [assetTitle, setAssetTitle] = useState<string | undefined>();
  const setTab = useEditor((s) => s.setTab);
  const replaceNotes = useEditor((s) => s.replaceNotes);
  const setSynth = useEditor((s) => s.setSynth);

  useEffect(() => {
    const intent = consumeEditorIntent();
    if (!intent) return;

    const { chats, activeChatId } = useWorkspaceStore.getState();
    const activeChat = selectActiveChat({ chats, activeChatId });
    const asset = findAsset(intent.assetId, activeChat?.sessionAssets ?? []);
    const title = asset?.title ?? intent.title;
    setAssetTitle(title);
    setTab(kindToEditorTab(intent.kind));

    if (!asset) return;

    if (asset.kind === "midi" && asset.notes) {
      const notes: MidiNote[] = asset.notes.map((n, i) => ({
        id: `edit-${asset.id}-${i}`,
        pitch: n.pitch,
        start: n.start,
        duration: n.duration,
        velocity: n.velocity ?? 0.8,
      }));
      replaceNotes(notes, `Load ${title}`);
    }

    if (asset.kind === "preset" && asset.preset) {
      setSynth({
        attack: asset.preset.attack,
        decay: asset.preset.decay,
        sustain: asset.preset.sustain,
        release: asset.preset.release,
        filterCutoff: asset.preset.filterCutoff,
        filterResonance: asset.preset.filterResonance,
      });
    }
  }, [replaceNotes, setSynth, setTab]);

  return { assetTitle };
}
