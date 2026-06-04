import { useState } from "react";
import { ChevronDown, Heart, KeyboardMusic, Music2, SlidersHorizontal } from "lucide-react";
import type { AudioResult } from "../../data/mock";

interface WorkspaceAssetPanelProps {
  sessionAssets: AudioResult[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
}

function kindIcon(kind: AudioResult["kind"]) {
  if (kind === "midi") return KeyboardMusic;
  if (kind === "preset") return SlidersHorizontal;
  return Music2;
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--border-primary)] pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]"
      >
        <span>
          {title} <span className="text-[var(--text-secondary)]">({count})</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function AssetRow({
  item,
  favorited,
  onToggleFavorite,
}: {
  item: AudioResult;
  favorited: boolean;
  onToggleFavorite: () => void;
}) {
  const Icon = kindIcon(item.kind);
  return (
    <div className="asset-panel-row group flex items-center gap-2 rounded-[10px] px-2 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-codec text-[12px] font-medium text-[var(--text-primary)]">
          {item.title}
        </div>
        <div className="truncate font-mono text-[10px] text-[var(--text-muted)]">{item.format}</div>
      </div>
      <button
        type="button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        onClick={onToggleFavorite}
        className="opacity-0 transition-opacity group-hover:opacity-100 data-[active=true]:opacity-100"
        data-active={favorited ? "true" : "false"}
      >
        <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-primary text-primary" : "text-[var(--text-muted)]"}`} />
      </button>
    </div>
  );
}

export default function WorkspaceAssetPanel({
  sessionAssets,
  favoriteIds,
  onToggleFavorite,
}: WorkspaceAssetPanelProps) {
  const audio = sessionAssets.filter((a) => a.kind === "audio");
  const midi = sessionAssets.filter((a) => a.kind === "midi");
  const preset = sessionAssets.filter((a) => a.kind === "preset");
  const favorites = sessionAssets.filter((a) => favoriteIds.has(a.id));
  const recent = [...sessionAssets].reverse().slice(0, 8);

  return (
    <aside className="workspace-assets hidden w-[min(360px,100%)] shrink-0 flex-col border-l border-[var(--border-primary)] bg-[var(--background-secondary)] lg:flex">
      <div className="border-b border-[var(--border-primary)] px-4 py-4">
        <h2 className="font-syne text-[15px] font-bold text-[var(--text-primary)]">Assets</h2>
        <p className="mt-1 font-codec text-[12px] text-[var(--text-secondary)]">
          Session library · updates live
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <CollapsibleSection title="Recent" count={recent.length}>
          {recent.length === 0 ? (
            <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">No assets yet</p>
          ) : (
            recent.map((item) => (
              <AssetRow
                key={item.id}
                item={item}
                favorited={favoriteIds.has(item.id)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))
          )}
        </CollapsibleSection>
        <CollapsibleSection title="Favorites" count={favorites.length}>
          {favorites.length === 0 ? (
            <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">Star results to save</p>
          ) : (
            favorites.map((item) => (
              <AssetRow
                key={item.id}
                item={item}
                favorited
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))
          )}
        </CollapsibleSection>
        <CollapsibleSection title="Audio Samples" count={audio.length} defaultOpen={false}>
          {audio.map((item) => (
            <AssetRow
              key={item.id}
              item={item}
              favorited={favoriteIds.has(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
            />
          ))}
        </CollapsibleSection>
        <CollapsibleSection title="MIDI Files" count={midi.length} defaultOpen={false}>
          {midi.map((item) => (
            <AssetRow
              key={item.id}
              item={item}
              favorited={favoriteIds.has(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
            />
          ))}
        </CollapsibleSection>
        <CollapsibleSection title="VST Presets" count={preset.length} defaultOpen={false}>
          {preset.map((item) => (
            <AssetRow
              key={item.id}
              item={item}
              favorited={favoriteIds.has(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
            />
          ))}
        </CollapsibleSection>
      </div>
    </aside>
  );
}
