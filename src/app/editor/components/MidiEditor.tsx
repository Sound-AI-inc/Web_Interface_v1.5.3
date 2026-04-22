import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  Upload,
  Trash2,
  ChevronsUp,
  ChevronsDown,
  FolderOpen,
} from "lucide-react";
import { useEditor } from "../core/store";
import {
  MidiEngine,
  midiToNoteName,
  parseMidiFile,
  quantizeNotes,
  transposeNotes,
} from "../midi/engine";
import type { MidiNote } from "../core/types";
import LibraryImportMenu from "./LibraryImportMenu";

// Full MIDI piano range C0 (24) — C8 (108). The viewport is scrollable so
// pitches outside the visible window are reachable with the octave jump
// controls or by dragging the scrollbar.
const LOW = 24; // C0
const HIGH = 108; // C8
const ROW_H = 12;
const PX_PER_SEC = 110;
const BASE_DURATION = 8; // minimum seconds of grid
// Matches the combined height of the Audio waveform + timeline so the three
// editor tabs feel the same size visually.
const VIEWPORT_H = 280;

export default function MidiEditor() {
  const notes = useEditor((s) => s.notes);
  const setNotes = useEditor((s) => s.setNotes);
  const replaceNotes = useEditor((s) => s.replaceNotes);

  const engineRef = useRef<MidiEngine | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [grid, setGrid] = useState(0.25);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    engineRef.current = new MidiEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const pitches = useMemo(() => {
    const arr: number[] = [];
    for (let p = HIGH; p >= LOW; p--) arr.push(p);
    return arr;
  }, []);

  // The grid extends past the last note so the timeline is effectively
  // unbounded — users can scroll horizontally forever and keep adding notes.
  const lastNoteEnd = notes.reduce((m, n) => Math.max(m, n.start + n.duration), 0);
  const duration = Math.max(BASE_DURATION, Math.ceil(lastNoteEnd + 4));
  const cols = Math.ceil(duration / grid);

  // Scroll the viewport to a specific pitch (centered).
  const scrollToPitch = (pitch: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const row = HIGH - pitch;
    const y = Math.max(0, row * ROW_H - VIEWPORT_H / 2 + ROW_H / 2);
    el.scrollTo({ top: y, behavior: "smooth" });
  };

  // Center on C4 (MIDI 60) the first time the component mounts.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const row = HIGH - 60;
    el.scrollTop = row * ROW_H - VIEWPORT_H / 2;
  }, []);

  const octaveJump = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = 12 * ROW_H * dir;
    el.scrollTo({ top: el.scrollTop + delta, behavior: "smooth" });
  };

  const clearAll = () => {
    if (notes.length === 0) return;
    replaceNotes([], "Clear notes");
  };

  void scrollToPitch; // reserved for future "go to note" UX

  const onGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const start = Math.max(0, Math.round((x / PX_PER_SEC) / grid) * grid);
    const rowIndex = Math.floor(y / ROW_H);
    const pitch = HIGH - rowIndex;
    if (pitch < LOW || pitch > HIGH) return;
    const newNote: MidiNote = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pitch,
      start,
      duration: grid,
      velocity: 0.8,
    };
    replaceNotes([...notes, newNote], "Add note");
  };

  const onNoteMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    note: MidiNote,
  ) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLDivElement;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const original = { ...note };
    const isResize = e.nativeEvent.offsetX > target.clientWidth - 8;

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      const dSec = (dx / PX_PER_SEC);
      const dPitch = -Math.round(dy / ROW_H);
      const updated: MidiNote = isResize
        ? {
            ...original,
            duration: Math.max(grid, original.duration + dSec),
          }
        : {
            ...original,
            start: Math.max(0, original.start + dSec),
            pitch: Math.max(LOW, Math.min(HIGH, original.pitch + dPitch)),
          };
      setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      // Commit to history after drag.
      replaceNotes(useEditor.getState().notes, isResize ? "Resize note" : "Move note");
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    replaceNotes(notes.filter((n) => n.id !== id), "Delete note");
  };

  const play = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.play(notes);
    setPlaying(true);
  };
  const stop = () => {
    engineRef.current?.stop();
    setPlaying(false);
  };

  const doQuantize = () => replaceNotes(quantizeNotes(notes, grid), "Quantize");
  const doTranspose = (n: number) =>
    replaceNotes(transposeNotes(notes, n), `Transpose ${n > 0 ? "+" : ""}${n}`);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = await parseMidiFile(file);
    if (parsed.length > 0) replaceNotes(parsed, "Import MIDI");
  };

  const onImportFromLibrary = (libraryNotes: MidiNote[]) => {
    if (libraryNotes.length > 0) replaceNotes(libraryNotes, "Import from library");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={isPlaying ? stop : play}
          className="app-btn-primary h-9 w-9 !px-0"
          aria-label={isPlaying ? "Stop" : "Play"}
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <select
          value={grid}
          onChange={(e) => setGrid(Number(e.target.value))}
          className="app-input h-9 py-0 pr-7 text-[11px]"
        >
          <option value={0.0625}>1/16</option>
          <option value={0.125}>1/8</option>
          <option value={0.25}>1/4</option>
          <option value={0.5}>1/2</option>
        </select>
        <button type="button" onClick={doQuantize} className="app-btn-ghost h-9 px-2 text-[11px]">
          Quantize
        </button>
        <button
          type="button"
          onClick={() => doTranspose(1)}
          className="app-btn-ghost h-9 px-2 text-[11px]"
          title="Up one semitone"
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => doTranspose(-1)}
          className="app-btn-ghost h-9 px-2 text-[11px]"
          title="Down one semitone"
        >
          −1
        </button>
        <button
          type="button"
          onClick={() => doTranspose(12)}
          className="app-btn-ghost h-9 px-2 text-[11px]"
          title="Up one octave"
        >
          +8va
        </button>

        <button
          type="button"
          onClick={() => octaveJump(-1)}
          className="app-btn-ghost h-9 w-9 !px-0"
          aria-label="Scroll up one octave"
          title="Scroll up"
        >
          <ChevronsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => octaveJump(1)}
          className="app-btn-ghost h-9 w-9 !px-0"
          aria-label="Scroll down one octave"
          title="Scroll down"
        >
          <ChevronsDown className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={clearAll}
          className="app-btn-ghost h-9 px-2 text-[11px]"
          title="Remove all notes"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>

        <label className="app-btn-ghost h-9 cursor-pointer px-2 text-[11px]">
          <Upload className="h-3.5 w-3.5" /> Import
          <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="hidden" />
        </label>
        <LibraryImportMenu
          kind="midi"
          trigger={
            <span className="app-btn-ghost h-9 px-2 text-[11px]">
              <FolderOpen className="h-3.5 w-3.5" /> Library
            </span>
          }
          onImportMidi={onImportFromLibrary}
        />
      </div>

      <div
        ref={scrollerRef}
        className="rounded-card border border-surface bg-white overflow-auto"
        style={{ maxHeight: VIEWPORT_H }}
      >
        <div className="flex">
          {/* keys */}
          <div className="sticky left-0 z-10 w-12 shrink-0 border-r border-surface bg-white">
            {pitches.map((p) => {
              const name = midiToNoteName(p);
              const isBlack = name.includes("#");
              const isC = name.startsWith("C") && !name.includes("#");
              return (
                <div
                  key={p}
                  style={{ height: ROW_H }}
                  className={`flex items-center justify-center font-codec text-[9px] ${
                    isBlack ? "bg-surface text-text/50" : "bg-white text-text/70"
                  } ${isC ? "font-semibold text-text" : ""}`}
                >
                  {name}
                </div>
              );
            })}
          </div>

          {/* grid area */}
          <div className="flex-1">
            <div
              className="relative"
              style={{ width: PX_PER_SEC * duration, height: pitches.length * ROW_H }}
              onClick={onGridClick}
            >
              {/* bg rows */}
              {pitches.map((p, idx) => {
                const name = midiToNoteName(p);
                const isBlack = name.includes("#");
                return (
                  <div
                    key={p}
                    className={`absolute left-0 right-0 border-b border-surface/80 ${
                      isBlack ? "bg-surface-muted" : "bg-white"
                    }`}
                    style={{ top: idx * ROW_H, height: ROW_H }}
                  />
                );
              })}
              {/* bg columns */}
              {Array.from({ length: cols + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-surface"
                  style={{ left: i * grid * PX_PER_SEC }}
                />
              ))}

              {/* notes */}
              {notes.map((n) => {
                const row = HIGH - n.pitch;
                if (row < 0 || row >= pitches.length) return null;
                return (
                  <div
                    key={n.id}
                    onMouseDown={(e) => onNoteMouseDown(e, n)}
                    onDoubleClick={(e) => deleteNote(e, n.id)}
                    className="absolute cursor-grab rounded bg-primary/80 text-white hover:bg-primary"
                    style={{
                      left: n.start * PX_PER_SEC,
                      top: row * ROW_H + 1,
                      width: Math.max(6, n.duration * PX_PER_SEC),
                      height: ROW_H - 2,
                    }}
                    title={`${midiToNoteName(n.pitch)} • double-click to delete`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <p className="app-meta">
        Click empty grid to add a note. Drag to move. Drag right edge to resize. Double-click to delete.
      </p>
    </div>
  );
}
