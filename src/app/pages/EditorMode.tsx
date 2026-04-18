import { Play, Pause, Scissors, Undo2, Redo2, Save } from "lucide-react";
import PageContainer from "../components/PageContainer";
import WaveformThumb from "../components/WaveformThumb";

const tracks = [
  { id: "audio", label: "Audio · Summer Lo-fi Sketch", hue: "from-[#3b1a6b] via-[#ff3c82] to-[#ff98a8]", type: "Audio" },
  { id: "midi", label: "MIDI · Rhodes chords", hue: "from-[#0fd3b8] via-[#0891b2] to-[#a1e7ee]", type: "MIDI" },
  { id: "preset", label: "Preset · Warm pad", hue: "from-[#1e1e2a] via-[#ff3c82] to-[#a1e7ee]", type: "Preset" },
];

export default function EditorMode() {
  return (
    <PageContainer
      title="Editor Mode"
      subtitle="Light-weight control layer for generated assets"
      actions={
        <div className="flex items-center gap-2">
          <button className="app-btn-ghost h-9 px-3">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button className="app-btn-ghost h-9 px-3">
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <button className="app-btn-primary h-9">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Timeline */}
        <div className="rounded-card border border-surface bg-white p-5 shadow-flat-sm">
          <div className="mb-4 flex items-center gap-2">
            <button className="app-btn-primary h-9 w-9 !px-0">
              <Play className="h-4 w-4" />
            </button>
            <button className="app-btn-ghost h-9 w-9 !px-0">
              <Pause className="h-4 w-4" />
            </button>
            <button className="app-btn-ghost h-9 px-3">
              <Scissors className="h-3.5 w-3.5" /> Split
            </button>
            <div className="ml-auto flex items-center gap-4 font-codec text-xs text-text/60">
              <span>Tempo: 92 BPM</span>
              <span>Key: Am</span>
              <span>Length: 1:24</span>
            </div>
          </div>

          {/* Ruler */}
          <div className="mb-2 grid grid-cols-8 border-b border-surface pb-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="font-codec text-[10px] text-text/40">
                {i + 1}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-40 shrink-0">
                  <div className="font-poppins text-xs font-medium text-text">{t.label}</div>
                  <div className="app-meta">{t.type}</div>
                </div>
                <WaveformThumb hue={t.hue} className="h-14 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Parameters panel */}
        <aside className="rounded-card border border-surface bg-white p-5 shadow-flat-sm">
          <h3 className="app-section-title mb-4">Parameters</h3>
          <div className="flex flex-col gap-5">
            <ParamSlider label="Volume" value={78} />
            <ParamSlider label="Reverb" value={34} />
            <ParamSlider label="Compression" value={52} />
            <ParamSlider label="EQ · Low" value={60} />
            <ParamSlider label="EQ · High" value={45} />
          </div>
          <div className="mt-6 border-t border-surface pt-5">
            <h3 className="app-section-title mb-3">Mix</h3>
            <label className="flex items-center justify-between font-codec text-sm text-text/80">
              Stereo width
              <input type="range" className="accent-[#FF3C82]" defaultValue={70} />
            </label>
            <label className="mt-3 flex items-center justify-between font-codec text-sm text-text/80">
              Pan
              <input type="range" className="accent-[#FF3C82]" defaultValue={50} />
            </label>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function ParamSlider({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-codec text-xs font-medium text-text/70">{label}</span>
        <span className="font-codec text-xs text-text/50">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
