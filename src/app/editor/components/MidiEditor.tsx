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
import BrandSelect from "../../components/BrandSelect";

const LOW = 24;
const HIGH = 108;
const ROW_H = 12;
const PX_PER_SEC = 110;
const BASE_DURATION = 8;
const VIEWPORT_H = 280;
const GRID_OPTIONS = [
  { value: "0.0625", label: "1/16 grid" },
  { value: "0.125", label: "1/8 grid" },
  { value: "0.25", label: "1/4 grid" },
  { value: "0.5", label: "1/2 grid" },
];

export default function MidiEditor() {
  const notes = useEditor((state) => state.notes);
  const setNotes = useEditor((state) => state.setNotes);
  const replaceNotes = useEditor((state) => state.replaceNotes);

  const engineRef = useRef<MidiEngine | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [grid, setGrid] = useState(0.25);
  const [playheadTime, setPlayheadTime] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const playbackStartedAtRef = useRef<number>(0);

  useEffect(() => {
    engineRef.current = new MidiEngine();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const pitches = useMemo(() => {
    const values: number[] = [];
    for (let pitch = HIGH; pitch >= LOW; pitch -= 1) values.push(pitch);
    return values;
  }, []);

  const lastNoteEnd = notes.reduce(
    (maxValue, note) => Math.max(maxValue, note.start + note.duration),
    0,
  );
  const duration = Math.max(BASE_DURATION, Math.ceil(lastNoteEnd + 4));
  const cols = Math.ceil(duration / grid);
  const playbackDuration = Math.max(lastNoteEnd, 0.1);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const row = HIGH - 60;
    element.scrollTop = row * ROW_H - VIEWPORT_H / 2;
  }, []);

  const scrollToPitch = (pitch: number) => {
    const element = scrollerRef.current;
    if (!element) return;
    const row = HIGH - pitch;
    const y = Math.max(0, row * ROW_H - VIEWPORT_H / 2 + ROW_H / 2);
    element.scrollTo({ top: y, behavior: "smooth" });
  };

  const octaveJump = (direction: 1 | -1) => {
    const element = scrollerRef.current;
    if (!element) return;
    const delta = 12 * ROW_H * direction;
    element.scrollTo({ top: element.scrollTop + delta, behavior: "smooth" });
  };

  const stop = () => {
    engineRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    rafRef.current = null;
    stopTimerRef.current = null;
    setPlaying(false);
    setPlayheadTime(0);
  };

  const clearAll = () => {
    if (notes.length === 0) return;
    stop();
    replaceNotes([], "Clear notes");
  };

  void scrollToPitch;

  const onGridClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
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
    event: React.MouseEvent<HTMLDivElement>,
    note: MidiNote,
  ) => {
    event.stopPropagation();
    const target = event.currentTarget;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const original = { ...note };
    const isResize = event.nativeEvent.offsetX > target.clientWidth - 8;

    const move = (nativeEvent: MouseEvent) => {
      const dx = nativeEvent.clientX - startClientX;
      const dy = nativeEvent.clientY - startClientY;
      const deltaSeconds = dx / PX_PER_SEC;
      const deltaPitch = -Math.round(dy / ROW_H);

      const updated: MidiNote = isResize
        ? {
            ...original,
            duration: Math.max(grid, original.duration + deltaSeconds),
          }
        : {
            ...original,
            start: Math.max(0, original.start + deltaSeconds),
            pitch: Math.max(LOW, Math.min(HIGH, original.pitch + deltaPitch)),
          };

      setNotes(notes.map((value) => (value.id === note.id ? updated : value)));
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      replaceNotes(
        useEditor.getState().notes,
        isResize ? "Resize note" : "Move note",
      );
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const deleteNote = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    stop();
    replaceNotes(notes.filter((note) => note.id !== id), "Delete note");
  };

  const play = async () => {
    const engine = engineRef.current;
    if (!engine || notes.length === 0) return;

    stop();
    await engine.play(notes);
    playbackStartedAtRef.current = performance.now();
    setPlaying(true);

    const tick = (now: number) => {
      const elapsed = (now - playbackStartedAtRef.current) / 1000;
      setPlayheadTime(Math.min(elapsed, playbackDuration));
      if (elapsed < playbackDuration) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    stopTimerRef.current = window.setTimeout(stop, playbackDuration * 1000 + 150);
  };

  const doQuantize = () => replaceNotes(quantizeNotes(notes, grid), "Quantize");
  const doTranspose = (value: number) =>
    replaceNotes(
      transposeNotes(notes, value),
      `Transpose ${value > 0 ? "+" : ""}${value}`,
    );

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stop();
    const parsed = await parseMidiFile(file);
    if (parsed.length > 0) replaceNotes(parsed, "Import MIDI");
  };

  const onImportFromLibrary = (libraryNotes: MidiNote[]) => {
    if (libraryNotes.length === 0) return;
    stop();
    replaceNotes(libraryNotes, "Import from library");
  };

  const playheadLeft = playheadTime * PX_PER_SEC;

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

        <BrandSelect
          value={String(grid)}
          options={GRID_OPTIONS}
          onChange={(value) => setGrid(Number(value))}
          className="min-w-[112px]"
          menuClassName="w-[148px] border-primary/20 p-1.5 shadow-xl"
        />

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
          -1
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
        className="overflow-auto rounded-card border border-surface bg-white"
        style={{ maxHeight: VIEWPORT_H }}
      >
        <div className="flex">
          <div className="sticky left-0 z-10 w-12 shrink-0 border-r border-surface bg-white">
            {pitches.map((pitch) => {
              const name = midiToNoteName(pitch);
              const isBlack = name.includes("#");
              const isC = name.startsWith("C") && !name.includes("#");
              return (
                <div
                  key={pitch}
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

          <div className="flex-1">
            <div
              className="relative"
              style={{ width: PX_PER_SEC * duration, height: pitches.length * ROW_H }}
              onClick={onGridClick}
            >
              {pitches.map((pitch, index) => {
                const isBlack = midiToNoteName(pitch).includes("#");
                return (
                  <div
                    key={pitch}
                    className={`absolute left-0 right-0 border-b border-surface/80 ${
                      isBlack ? "bg-surface-muted" : "bg-white"
                    }`}
                    style={{ top: index * ROW_H, height: ROW_H }}
                  />
                );
              })}

              {Array.from({ length: cols + 1 }).map((_, index) => (
                <div
                  key={index}
                  className="absolute bottom-0 top-0 w-px bg-surface"
                  style={{ left: index * grid * PX_PER_SEC }}
                />
              ))}

              {isPlaying && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-20 w-[2px] bg-primary/90 shadow-[0_0_0_1px_rgba(255,60,130,0.08)]"
                  style={{ left: playheadLeft }}
                />
              )}

              {notes.map((note) => {
                const row = HIGH - note.pitch;
                if (row < 0 || row >= pitches.length) return null;

                return (
                  <div
                    key={note.id}
                    onMouseDown={(event) => onNoteMouseDown(event, note)}
                    onDoubleClick={(event) => deleteNote(event, note.id)}
                    className="absolute cursor-grab rounded bg-primary/80 text-white hover:bg-primary"
                    style={{
                      left: note.start * PX_PER_SEC,
                      top: row * ROW_H + 1,
                      width: Math.max(6, note.duration * PX_PER_SEC),
                      height: ROW_H - 2,
                    }}
                    title={`${midiToNoteName(note.pitch)} - double-click to delete`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="app-meta">
        Click empty grid to add a note. Drag to move. Drag the right edge to resize. Double-click a note to delete it.
      </p>
    </div>
  );
}
