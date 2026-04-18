import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { Play, Pause, Scissors, Trash2, FastForward, Upload } from "lucide-react";
import { useEditor } from "../core/store";
import {
  bufferToWavBlob,
  decodeArrayBuffer,
  downloadBlob,
  fadeIn,
  fadeOut,
  normalize,
  reverse,
  trim,
} from "../audio/engine";
import { generateDefaultAudioBuffer } from "../audio/defaultBuffer";

interface Props {
  onReady?: () => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export default function WaveformEditor({ onReady, onPlayStateChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
  const buffer = useEditor((s) => s.buffer);
  const replaceBuffer = useEditor((s) => s.replaceBuffer);
  const setSelection = useEditor((s) => s.setSelection);
  const selection = useEditor((s) => s.selection);
  const [zoom, setZoom] = useState(60);
  const [isPlaying, setPlaying] = useState(false);
  const readyRef = useRef(false);

  // Init wavesurfer once
  useEffect(() => {
    if (!ref.current) return;
    const regions = RegionsPlugin.create();
    regionsRef.current = regions;
    const ws = WaveSurfer.create({
      container: ref.current,
      waveColor: "#FF98A8",
      progressColor: "#FF3C82",
      cursorColor: "#1D1D1D",
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 120,
      minPxPerSec: zoom,
      plugins: [regions, TimelinePlugin.create({ height: 18 })],
    });
    wsRef.current = ws;

    const enableDragSelection = () => {
      regions.clearRegions();
      regions.enableDragSelection({ color: "rgba(255, 60, 130, 0.18)" });
    };

    ws.on("ready", () => {
      readyRef.current = true;
      try {
        ws.zoom(zoom);
      } catch {
        // ignore
      }
      enableDragSelection();
      onReady?.();
    });
    ws.on("destroy", () => {
      readyRef.current = false;
    });

    regions.on("region-created", (region: Region) => {
      // Only allow one region at a time.
      regions.getRegions().forEach((r) => {
        if (r.id !== region.id) r.remove();
      });
      setSelection({ start: region.start, end: region.end });
    });
    regions.on("region-updated", (region: Region) => {
      setSelection({ start: region.start, end: region.end });
    });
    regions.on("region-removed", () => setSelection(null));

    ws.on("play", () => {
      setPlaying(true);
      onPlayStateChange?.(true);
    });
    ws.on("pause", () => {
      setPlaying(false);
      onPlayStateChange?.(false);
    });
    ws.on("finish", () => {
      setPlaying(false);
      onPlayStateChange?.(false);
    });

    return () => {
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load buffer whenever it changes.
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !buffer) return;
    const blob = bufferToWavBlob(buffer);
    ws.loadBlob(blob);
  }, [buffer]);

  // Apply zoom (only after audio has been decoded).
  useEffect(() => {
    if (!readyRef.current) return;
    try {
      wsRef.current?.zoom(zoom);
    } catch {
      // wavesurfer throws if buffer is not ready yet
    }
  }, [zoom]);

  const playToggle = useCallback(() => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.isPlaying()) ws.pause();
    else ws.play();
  }, []);

  const applyEdit = async (
    fn: (b: AudioBuffer) => AudioBuffer,
    label: string,
  ) => {
    if (!buffer) return;
    const next = fn(buffer);
    replaceBuffer(next, label);
  };

  const doTrim = async () => {
    if (!buffer || !selection) return;
    const next = trim(buffer, selection.start, selection.end);
    replaceBuffer(next, "Trim");
    regionsRef.current?.clearRegions();
    setSelection(null);
  };

  const doFadeIn = () => {
    if (!buffer) return;
    const duration = selection ? selection.end - selection.start : 0.5;
    applyEdit((b) => fadeIn(b, Math.min(duration, b.duration / 2)), "Fade in");
  };
  const doFadeOut = () => {
    if (!buffer) return;
    const duration = selection ? selection.end - selection.start : 0.5;
    applyEdit((b) => fadeOut(b, Math.min(duration, b.duration / 2)), "Fade out");
  };
  const doNormalize = () => applyEdit(normalize, "Normalize");
  const doReverse = () => applyEdit(reverse, "Reverse");

  const exportWav = () => {
    if (!buffer) return;
    downloadBlob(bufferToWavBlob(buffer), "soundai-edit.wav");
  };

  const onLoadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ab = await file.arrayBuffer();
    const decoded = await decodeArrayBuffer(ab);
    replaceBuffer(decoded, "Load audio");
    regionsRef.current?.clearRegions();
    setSelection(null);
  };

  const clearAudio = async () => {
    const fresh = await generateDefaultAudioBuffer();
    replaceBuffer(fresh, "Clear audio");
    regionsRef.current?.clearRegions();
    setSelection(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playToggle}
          className="app-btn-primary h-9 w-9 !px-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={doTrim} disabled={!selection} className="app-btn-ghost h-9 px-3">
          <Scissors className="h-3.5 w-3.5" /> Trim
        </button>
        <button type="button" onClick={doFadeIn} className="app-btn-ghost h-9 px-3">
          Fade in
        </button>
        <button type="button" onClick={doFadeOut} className="app-btn-ghost h-9 px-3">
          Fade out
        </button>
        <button type="button" onClick={doNormalize} className="app-btn-ghost h-9 px-3">
          Normalize
        </button>
        <button type="button" onClick={doReverse} className="app-btn-ghost h-9 px-3">
          <FastForward className="h-3.5 w-3.5 rotate-180" /> Reverse
        </button>
        <button
          type="button"
          onClick={() => {
            regionsRef.current?.clearRegions();
            setSelection(null);
          }}
          disabled={!selection}
          className="app-btn-ghost h-9 px-3"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear selection
        </button>
        <button
          type="button"
          onClick={clearAudio}
          className="app-btn-ghost h-9 px-3"
          title="Reset audio to default sample"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>
        <label className="app-btn-ghost h-9 cursor-pointer px-3">
          <Upload className="h-3.5 w-3.5" /> Load audio
          <input
            type="file"
            accept="audio/*"
            onChange={onLoadAudio}
            className="hidden"
          />
        </label>
        <div className="ml-auto flex items-center gap-2 font-codec text-xs text-text/60">
          Zoom
          <input
            type="range"
            min={10}
            max={400}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32 accent-[#FF3C82]"
          />
          <button type="button" onClick={exportWav} className="app-btn-primary h-9 px-3">
            Export WAV
          </button>
        </div>
      </div>

      <div ref={ref} className="rounded-card border border-surface bg-white p-3" />

      {selection ? (
        <p className="app-meta">
          Selection: {selection.start.toFixed(2)}s – {selection.end.toFixed(2)}s
          {" · "}
          {(selection.end - selection.start).toFixed(2)}s
        </p>
      ) : (
        <p className="app-meta">Drag on the waveform to select a region.</p>
      )}
    </div>
  );
}
