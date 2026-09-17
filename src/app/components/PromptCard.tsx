import { Play, Pencil, Copy, Music, FileAudio, Settings } from "lucide-react";
import type { PromptItem } from "../data/mock";
import type { ViewMode } from "../state/promptsStore";
import { useLanguage } from "../i18n/LanguageProvider";

interface PromptCardProps {
  prompt: PromptItem;
  variant?: ViewMode;
  onEdit?: () => void;
  onCopy?: () => void;
  onGenerate?: () => void;
}

function getAssetTypeInfo(genre: string) {
  const g = genre.toLowerCase();
  if (g === "midi" || g.includes("midi")) return { icon: Music, labelKey: "prompts.type.midi", color: "text-primary" };
  if (g === "vst" || g.includes("vst") || g.includes("preset")) return { icon: Settings, labelKey: "prompts.type.preset", color: "text-primary" };
  return { icon: FileAudio, labelKey: "prompts.type.audio", color: "text-primary" };
}

export default function PromptCard({
  prompt,
  variant = "grid",
  onEdit,
  onCopy,
  onGenerate,
}: PromptCardProps) {
  const { t } = useLanguage();
  const isList = variant === "list";
  const assetType = getAssetTypeInfo(prompt.genre);
  const AssetIcon = assetType.icon;

  return (
    <article
      className={`premium-prompt-card ${isList ? "premium-prompt-card--list flex flex-row items-start gap-4 p-4" : "flex flex-col"}`}
      tabIndex={0}
    >
      <div className={isList ? "min-w-0 flex-1" : "flex-1"}>
        <header className={`premium-prompt-card-header ${isList ? "mb-2" : "mb-3"}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <AssetIcon className={`h-4 w-4 shrink-0 ${assetType.color}`} aria-hidden="true" />
              <span className="font-codec text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {t(assetType.labelKey as Parameters<typeof t>[0])}
              </span>
              {!isList && (
                <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                  {prompt.updatedAt}
                </span>
              )}
            </div>
            <h3 className="font-poppins text-[16px] font-semibold text-[var(--text-primary)] truncate">
              {prompt.title}
            </h3>
            <p className="mt-1 font-codec text-[12px] text-[var(--text-secondary)]">
              {prompt.genre} · {prompt.mood} · {prompt.useCase}
            </p>
          </div>
        </header>

        <p className={`premium-prompt-card-body ${isList ? "line-clamp-2" : ""} font-codec text-[13px] leading-6 text-[var(--text-secondary)]`}>
          {prompt.body}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {prompt.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="premium-chip font-codec text-[11px]">
              {tag}
            </span>
          ))}
          {prompt.tags.length > 5 && (
            <span className="premium-chip font-codec text-[11px] text-[var(--text-muted)]">
              +{prompt.tags.length - 5}
            </span>
          )}
        </div>
      </div>

      <footer className={`premium-prompt-card-footer ${isList ? "shrink-0 w-auto flex-col items-end gap-2 border-0 p-0 pt-2" : "flex items-center justify-between border-t border-[var(--border-primary)] pt-3 mt-auto"}`}>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{prompt.runs} {t("prompts.runs")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="premium-icon-btn"
            aria-label={t("prompts.edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="premium-icon-btn"
            aria-label={t("prompts.copy")}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onGenerate}
            className={`app-btn-primary h-9 px-4 font-poppins text-sm font-medium ${isList ? "w-full justify-center" : ""}`}
          >
            <Play className="h-4 w-4" /> {t("prompts.usePrompt")}
          </button>
        </div>
      </footer>
    </article>
  );
}