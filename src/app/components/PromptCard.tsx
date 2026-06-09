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
    <article className="premium-prompt-card">
      <header className="premium-prompt-card-header">
        <div className="min-w-0">
          <h3 className="truncate font-poppins text-[15px] font-semibold text-[var(--text-primary)]">
            {prompt.title}
          </h3>
          <p className="mt-1 font-codec text-[11px] text-[var(--text-muted)]">
            {prompt.genre} · {prompt.mood} · {prompt.useCase}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">{prompt.updatedAt}</span>
      </header>

      <p className="premium-prompt-card-body">{prompt.body}</p>

      <div className="flex flex-wrap gap-1.5">
        {prompt.tags.map((t) => (
          <span key={t} className="premium-chip">
            #{t}
          </span>
        ))}
      </div>

      <footer className="premium-prompt-card-footer">
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{prompt.runs} runs</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onEdit} className="premium-icon-btn" aria-label="Edit prompt">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onCopy} className="premium-icon-btn" aria-label="Copy prompt">
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
