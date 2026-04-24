import { useEffect, useRef, useState } from "react";
import { Lightbulb, Shuffle } from "lucide-react";
import { randomIdeas, type GenerationType, type PromptIdea } from "../lib/promptGeneration";

interface IdeasMenuProps {
  onPick: (text: string) => void;
  type: GenerationType;
}

/**
 * Floating prompt-idea picker. Opens a card of 5 curated prompt seeds that
 * the user can click to populate the main prompt field. A shuffle button
 * reshuffles the selection without closing the menu.
 */
export default function IdeasMenu({ onPick, type }: IdeasMenuProps) {
  const [open, setOpen] = useState(false);
  const [ideas, setIdeas] = useState<PromptIdea[]>(() => randomIdeas(type, 5));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    setIdeas(randomIdeas(type, 5));
  }, [type]);

  const handleOpen = () => {
    setIdeas(randomIdeas(type, 5));
    setOpen((v) => !v);
  };

  const handlePick = (idea: PromptIdea) => {
    onPick(idea.text);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="app-btn-ghost h-9 px-3 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Ideas <Lightbulb className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-[320px] rounded-card border border-surface bg-white p-2 shadow-lg"
        >
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="font-poppins text-[10px] font-bold uppercase tracking-[0.12em] text-text/60">
              Prompt ideas
            </span>
            <button
              type="button"
              onClick={() => setIdeas(randomIdeas(type, 5))}
              className="flex items-center gap-1 rounded-button px-1.5 py-0.5 font-poppins text-[10px] font-medium text-text/60 transition-colors hover:bg-surface hover:text-primary"
            >
              <Shuffle className="h-3 w-3" /> Shuffle
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <button
                  type="button"
                  onClick={() => handlePick(idea)}
                  className="flex w-full items-start gap-2 rounded-button p-2 text-left transition-colors hover:bg-surface"
                >
                  <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-1.5 py-[1px] font-poppins text-[9px] font-bold uppercase tracking-wider text-primary">
                    {idea.category}
                  </span>
                  <span className="font-codec text-[12px] leading-snug text-text/80">
                    {idea.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
