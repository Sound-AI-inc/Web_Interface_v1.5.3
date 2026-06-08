import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  KeyboardMusic,
  Music2,
  SlidersHorizontal,
} from "lucide-react";
import type { AudioResult } from "../../data/mock";
import { useLanguage } from "../../i18n/LanguageProvider";

interface WorkspaceAssetPanelProps {
  sessionAssets: AudioResult[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
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
  collapsed,
  flexGrow = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  collapsed: boolean;
  flexGrow?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (collapsed) return null;
  return (
    <div
      className={`flex min-h-0 flex-col border-b border-[var(--border-primary)] pb-2 ${
        flexGrow ? "min-h-0 flex-1" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between py-2 font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]"
      >
        <span>
          {title} <span className="text-[var(--text-secondary)]">({count})</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`token-scroll min-h-0 space-y-1 ${flexGrow ? "flex-1 overflow-y-auto" : ""}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function AssetRow({
  item,
  favorited,
  onToggleFavorite,
  iconOnly,
}: {
  item: AudioResult;
  favorited: boolean;
  onToggleFavorite: () => void;
  iconOnly?: boolean;
}) {
  const Icon = kindIcon(item.kind);
  if (iconOnly) {
    return (
      <button
        type="button"
        title={item.title}
        onClick={onToggleFavorite}
        className="flex h-10 w-10 items-center justify-center rounded-[10px] text-primary hover:bg-[var(--surface-secondary)]"
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }
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
  collapsed,
  onToggleCollapsed,
}: WorkspaceAssetPanelProps) {
  const { t } = useLanguage();
  const audio = sessionAssets.filter((a) => a.kind === "audio");
  const midi = sessionAssets.filter((a) => a.kind === "midi");
  const preset = sessionAssets.filter((a) => a.kind === "preset");
  const favorites = sessionAssets.filter((a) => favoriteIds.has(a.id));
  const recent = [...sessionAssets].reverse().slice(0, 8);

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className="workspace-assets hidden h-full min-h-0 shrink-0 flex-col border-l border-[var(--border-primary)] bg-[var(--background-secondary)] lg:flex"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-3 py-3">
        {!collapsed && (
          <div className="min-w-0 px-1">
            <h2 className="font-syne text-[15px] font-bold text-[var(--text-primary)]">
              {t("workspace.assets")}
            </h2>
            <p className="mt-0.5 font-codec text-[11px] text-[var(--text-secondary)]">
              {t("workspace.liveSession")}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand assets panel" : "Collapse assets panel"}
          className="composer-control flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            {recent.length === 0 ? (
              <Music2 className="h-4 w-4 text-[var(--text-muted)]" />
            ) : (
              recent.slice(0, 5).map((item) => (
                <AssetRow
                  key={item.id}
                  item={item}
                  favorited={favoriteIds.has(item.id)}
                  onToggleFavorite={() => onToggleFavorite(item.id)}
                  iconOnly
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <CollapsibleSection title={t("workspace.recent")} count={recent.length} collapsed={collapsed} flexGrow>
              {recent.length === 0 ? (
                <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">
                  {t("workspace.noAssets")}
                </p>
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
            <CollapsibleSection title={t("workspace.favorites")} count={favorites.length} collapsed={collapsed}>
              {favorites.length === 0 ? (
                <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">
                  {t("workspace.starToSave")}
                </p>
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
            <CollapsibleSection
              title={t("workspace.audioSamples")}
              count={audio.length}
              defaultOpen={false}
              collapsed={collapsed}
            >
              {audio.length === 0 ? (
                <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">—</p>
              ) : (
                audio.map((item) => (
                  <AssetRow
                    key={item.id}
                    item={item}
                    favorited={favoriteIds.has(item.id)}
                    onToggleFavorite={() => onToggleFavorite(item.id)}
                  />
                ))
              )}
            </CollapsibleSection>
            <CollapsibleSection
              title={t("workspace.midiFiles")}
              count={midi.length}
              defaultOpen={false}
              collapsed={collapsed}
            >
              {midi.length === 0 ? (
                <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">—</p>
              ) : (
                midi.map((item) => (
                  <AssetRow
                    key={item.id}
                    item={item}
                    favorited={favoriteIds.has(item.id)}
                    onToggleFavorite={() => onToggleFavorite(item.id)}
                  />
                ))
              )}
            </CollapsibleSection>
            <CollapsibleSection
              title={t("workspace.vstPresets")}
              count={preset.length}
              defaultOpen={false}
              collapsed={collapsed}
              flexGrow
            >
              {preset.length === 0 ? (
                <p className="px-2 py-1 font-codec text-[12px] text-[var(--text-muted)]">—</p>
              ) : (
                preset.map((item) => (
                  <AssetRow
                    key={item.id}
                    item={item}
                    favorited={favoriteIds.has(item.id)}
                    onToggleFavorite={() => onToggleFavorite(item.id)}
                  />
                ))
              )}
            </CollapsibleSection>
          </div>
        )}
      </div>
    </aside>
  );
}
