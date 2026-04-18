import { useMemo } from "react";
import { Music, Layers, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useEditor } from "../core/store";
import { midiToNoteName, quantizeNotes, transposeNotes } from "../midi/engine";

/**
 * Contextual side panel for the MIDI tab: surfaces grid selection,
 * quantize / transpose, and a summary of the current pattern.
 */
export default function MidiToolsPanel() {
  const notes = useEditor((s) => s.notes);
  const replaceNotes = useEditor((s) => s.replaceNotes);

  const stats = useMemo(() => {
    if (notes.length === 0) {
      return { count: 0, min: "—", max: "—", length: "0.00" };
    }
    const pitches = notes.map((n) => n.pitch);
    const ends = notes.map((n) => n.start + n.duration);
    return {
      count: notes.length,
      min: midiToNoteName(Math.min(...pitches)),
      max: midiToNoteName(Math.max(...pitches)),
      length: Math.max(...ends).toFixed(2),
    };
  }, [notes]);

  const quantize = (grid: number, label: string) =>
    replaceNotes(quantizeNotes(notes, grid), `Quantize · ${label}`);
  const transpose = (delta: number, label: string) =>
    replaceNotes(transposeNotes(notes, delta), `Transpose · ${label}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="app-section-title">MIDI tools</h3>
        <span className="inline-flex items-center gap-1 font-codec text-[11px] text-text/50">
          <Music className="h-3 w-3" />
          {stats.count} notes
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-card border border-surface p-3 font-codec text-xs text-text/70">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text/40">Range</div>
          <div className="font-poppins text-sm text-text">
            {stats.min} – {stats.max}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text/40">Length</div>
          <div className="font-poppins text-sm text-text">{stats.length}s</div>
        </div>
      </div>

      <div className="rounded-card border border-surface p-3">
        <div className="mb-2 flex items-center gap-2 font-poppins text-[11px] font-bold uppercase tracking-wider text-text">
          <Layers className="h-3.5 w-3.5" /> Quantize
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { g: 0.0625, l: "1/16" },
            { g: 0.125, l: "1/8" },
            { g: 0.25, l: "1/4" },
            { g: 0.5, l: "1/2" },
          ].map((q) => (
            <button
              key={q.l}
              type="button"
              onClick={() => quantize(q.g, q.l)}
              className="app-btn-ghost h-8 px-2 text-[11px]"
            >
              {q.l}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-surface p-3">
        <div className="mb-2 font-poppins text-[11px] font-bold uppercase tracking-wider text-text">
          Transpose
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => transpose(-12, "-1 oct")}
            className="app-btn-ghost h-8 px-2 text-[11px]"
          >
            <ArrowDown className="h-3 w-3" /> 8va
          </button>
          <button
            type="button"
            onClick={() => transpose(-1, "-1 st")}
            className="app-btn-ghost h-8 px-2 text-[11px]"
          >
            −1
          </button>
          <button
            type="button"
            onClick={() => transpose(1, "+1 st")}
            className="app-btn-ghost h-8 px-2 text-[11px]"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => transpose(12, "+1 oct")}
            className="app-btn-ghost h-8 px-2 text-[11px]"
          >
            <ArrowUp className="h-3 w-3" /> 8va
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => replaceNotes([], "Clear notes")}
        disabled={notes.length === 0}
        className="app-btn-ghost h-9 w-full"
      >
        <Trash2 className="h-3.5 w-3.5" /> Clear pattern
      </button>
    </div>
  );
}
