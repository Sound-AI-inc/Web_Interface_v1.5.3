import { Play, Pencil, Copy } from "lucide-react";
import type { PromptItem } from "../data/mock";

interface PromptCardProps {
  prompt: PromptItem;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  return (
    <article className="group flex flex-col gap-4 rounded-card border border-surface bg-white p-5 shadow-flat-sm transition-colors hover:border-primary/30">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-poppins text-sm font-semibold text-text">{prompt.title}</h3>
          <p className="app-meta mt-1">
            {prompt.genre} · {prompt.mood} · {prompt.useCase}
          </p>
        </div>
        <span className="app-meta whitespace-nowrap">{prompt.updatedAt}</span>
      </header>

      <p className="font-codec text-sm leading-relaxed text-text/80">{prompt.body}</p>

      <div className="flex flex-wrap gap-1.5">
        {prompt.tags.map((t) => (
          <span key={t} className="app-chip">
            #{t}
          </span>
        ))}
      </div>

      <footer className="mt-1 flex items-center justify-between border-t border-surface pt-3">
        <span className="app-meta">{prompt.runs} runs</span>
        <div className="flex items-center gap-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 hover:bg-surface hover:text-text" aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 hover:bg-surface hover:text-text" aria-label="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="app-btn-primary h-8 px-3 text-xs">
            <Play className="h-3.5 w-3.5" /> Generate
          </button>
        </div>
      </footer>
    </article>
  );
}
