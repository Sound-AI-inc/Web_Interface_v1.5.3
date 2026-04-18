import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Download, Upload } from "lucide-react";
import { useEditor } from "../core/store";
import {
  MidiEngine,
  exportMidi,
  midiToNoteName,
  parseMidiFile,
  quantizeNotes,
  transposeNotes,
} from "../midi/engine";
import type { MidiNote } from "../core/types";

const LOW = 48; // C3
const HIGH = 84; // C6
const ROW_H = 14;
const PX_PER_SEC = 120;
const DURATION = 4; // seconds of the grid

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

  const cols = Math.ceil(DURATION / grid);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
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
          className="app-input h-9 w-auto py-0 pr-8 text-xs"
        >
          <option value={0.0625}>Grid 1/16</option>
          <option value={0.125}>Grid 1/8</option>
          <option value={0.25}>Grid 1/4</option>
          <option value={0.5}>Grid 1/2</option>
        </select>
        <button type="button" onClick={doQuantize} className="app-btn-ghost h-9 px-3">
          Quantize
        </button>
        <button type="button" onClick={() => doTranspose(1)} className="app-btn-ghost h-9 px-3">
          +1 st
        </button>
        <button type="button" onClick={() => doTranspose(-1)} className="app-btn-ghost h-9 px-3">
          −1 st
        </button>
        <button type="button" onClick={() => doTranspose(12)} className="app-btn-ghost h-9 px-3">
          +Octave
        </button>

        <label className="app-btn-ghost h-9 cursor-pointer px-3">
          <Upload className="h-3.5 w-3.5" /> Import MIDI
          <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="hidden" />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportMidi(notes)}
            className="app-btn-primary h-9 px-3"
          >
            <Download className="h-3.5 w-3.5" /> Export .mid
          </button>
        </div>
      </div>

      <div className="rounded-card border border-surface bg-white">
        <div className="flex">
          {/* keys */}
          <div className="sticky left-0 w-12 shrink-0 border-r border-surface">
            {pitches.map((p) => {
              const name = midiToNoteName(p);
              const isBlack = name.includes("#");
              return (
                <div
                  key={p}
                  style={{ height: ROW_H }}
                  className={`flex items-center justify-center font-codec text-[9px] ${
                    isBlack ? "bg-surface text-text/50" : "bg-white text-text/70"
                  }`}
                >
                  {name}
                </div>
              );
            })}
          </div>

          {/* grid area */}
          <div ref={scrollerRef} className="flex-1 overflow-x-auto">
            <div
              className="relative"
              style={{ width: PX_PER_SEC * DURATION, height: pitches.length * ROW_H }}
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
