import { useCallback, useEffect, useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  Save,
  Music,
  Waves,
  SlidersHorizontal,
} from "lucide-react";
import { useEditor } from "../core/store";
import WaveformEditor from "./WaveformEditor";
import MidiEditor from "./MidiEditor";
import SynthEditor from "./SynthEditor";
import EffectsPanel from "./EffectsPanel";
import MidiToolsPanel from "./MidiToolsPanel";
import SynthPresetsPanel from "./SynthPresetsPanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { decodeArrayBuffer } from "../audio/engine";
import { generateDefaultAudioBuffer } from "../audio/defaultBuffer";

const TABS = [
  { id: "audio" as const, label: "Audio", icon: Waves },
  { id: "midi" as const, label: "MIDI", icon: Music },
  { id: "synth" as const, label: "Synth", icon: SlidersHorizontal },
];

export default function EditorPanel() {
  const tab = useEditor((s) => s.tab);
  const setTab = useEditor((s) => s.setTab);
  const buffer = useEditor((s) => s.buffer);
  const setBuffer = useEditor((s) => s.setBuffer);
  const replaceBuffer = useEditor((s) => s.replaceBuffer);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.canUndo());
  const canRedo = useEditor((s) => s.canRedo());
  const dirty = useEditor((s) => s.dirty);
  const markSaved = useEditor((s) => s.markSaved);

  const playToggleRef = useRef<() => void>(() => {});
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // Bootstrap default audio once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const buf = await generateDefaultAudioBuffer();
      if (!cancelled) {
        setBuffer(buf);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setBuffer]);

  const onSave = useCallback(() => {
    // Local "save" — mark clean and flash indicator. Hook for future
    // backend persistence without changing callers.
    markSaved();
  }, [markSaved]);

  useKeyboardShortcuts({
    onPlayToggle: () => playToggleRef.current(),
    onUndo: () => canUndo && undo(),
    onRedo: () => canRedo && redo(),
    onSave,
  });

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".mid") || file.name.endsWith(".midi")) {
      // defer to MIDI editor's own upload flow by switching tab
      setTab("midi");
      return;
    }
    const ab = await file.arrayBuffer();
    const decoded = await decodeArrayBuffer(ab);
    replaceBuffer(decoded, "Import audio");
    setTab("audio");
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`relative ${dragOver ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-button border border-surface bg-white p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-poppins text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  active ? "bg-primary text-white" : "text-text/70 hover:text-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!canUndo}
          onClick={undo}
          className="app-btn-ghost h-9 px-3"
          title="Undo (Cmd/Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={redo}
          className="app-btn-ghost h-9 px-3"
          title="Redo (Cmd/Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" /> Redo
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="font-codec text-xs text-text/50">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <button type="button" onClick={onSave} className="app-btn-ghost h-9 px-3" title="Save (Cmd/Ctrl+S)">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {loading && !buffer ? (
        <div className="app-card flex h-60 items-center justify-center font-codec text-sm text-text/50">
          Generating default sample…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          <div className="app-card p-5">
            {tab === "audio" && (
              <WaveformEditor
                onReady={() => undefined}
                onPlayStateChange={() => undefined}
              />
            )}
            {tab === "midi" && <MidiEditor />}
            {tab === "synth" && <SynthEditor />}
          </div>
          <aside className="app-card p-5">
            {tab === "audio" && <EffectsPanel />}
            {tab === "midi" && <MidiToolsPanel />}
            {tab === "synth" && <SynthPresetsPanel />}
          </aside>
        </div>
      )}

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-card bg-primary/10 font-poppins text-sm font-medium text-primary">
          Drop audio or MIDI file to load
        </div>
      )}
    </div>
  );
}
