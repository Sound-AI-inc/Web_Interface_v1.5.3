import { LayoutGrid, Lock } from "lucide-react";
import PageContainer from "../components/PageContainer";

export default function Arrangement() {
  return (
    <PageContainer title="Arrangement" subtitle="AI-assisted song arrangement (preview)">
      <div className="relative overflow-hidden rounded-card border border-surface bg-white">
        {/* Blurred preview of a fake arrangement grid */}
        <div className="pointer-events-none select-none p-8 [filter:blur(6px)_saturate(0.9)] opacity-60">
          <div className="mb-4 flex gap-2">
            {["Intro", "Verse", "Chorus", "Bridge", "Outro"].map((s, i) => (
              <div
                key={s}
                className={`h-16 flex-1 rounded-card border border-surface bg-gradient-to-br ${
                  i % 2 === 0
                    ? "from-primary/20 to-primary-soft/30"
                    : "from-accent-light/30 to-surface"
                }`}
              />
            ))}
          </div>
          <div className="space-y-2">
            {["Drums", "Bass", "Keys", "Lead", "FX"].map((row) => (
              <div key={row} className="flex items-center gap-2">
                <div className="w-20 font-poppins text-xs font-medium text-text/70">{row}</div>
                <div className="flex h-8 flex-1 gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded bg-surface-muted"
                      style={{ opacity: 0.3 + ((i * 7) % 10) / 15 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="max-w-md rounded-card border border-surface bg-white p-8 text-center shadow-flat">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-poppins text-lg font-semibold text-text">Arrangement · Coming soon</h2>
            <p className="mt-2 font-codec text-sm text-text/60">
              AI-assisted arrangement tools are coming soon. Build full-song
              structure from a single prompt — verses, drops, bridges and more.
            </p>
            <button disabled className="app-btn-primary mt-6 h-10 gap-2">
              <Lock className="h-3.5 w-3.5" /> Locked
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
