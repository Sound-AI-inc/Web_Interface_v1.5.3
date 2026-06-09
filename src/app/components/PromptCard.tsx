import { Play, Pencil, Copy } from "lucide-react";
import type { PromptItem } from "../data/mock";

interface PromptCardProps {
  prompt: PromptItem;
  onEdit?: () => void;
  onCopy?: () => void;
  onGenerate?: () => void;
}

export default function PromptCard({ prompt, onEdit, onCopy, onGenerate }: PromptCardProps) {
  return (
    <article className="premium-prompt-card group flex flex-col gap-4 rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 shadow-[var(--ui-shadow-soft)] transition-all hover:border-[var(--border-secondary)] hover:shadow-[var(--ui-shadow-floating)]">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-poppins text-[15px] font-semibold text-[var(--text-primary)]">
            {prompt.title}
          </h3>
          <p className="app-meta mt-1">
            {prompt.genre} · {prompt.mood} · {prompt.useCase}
          </p>
        </div>
        <span className="app-meta shrink-0 whitespace-nowrap">{prompt.updatedAt}</span>
      </header>

      <p className="line-clamp-3 font-codec text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {prompt.body}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {prompt.tags.map((t) => (
          <span key={t} className="premium-chip">
            #{t}
          </span>
        ))}
      </div>

      <footer className="mt-auto flex items-center justify-between border-t border-[var(--border-primary)] pt-3">
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{prompt.runs} runs</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="premium-icon-btn"
            aria-label="Edit prompt"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="premium-icon-btn"
            aria-label="Copy prompt"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onGenerate} className="app-btn-primary h-8 px-3 text-xs">
            <Play className="h-3.5 w-3.5" /> Generate
          </button>
        </div>
      </footer>
    </article>
  );
}
