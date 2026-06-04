import { useEffect, useState } from "react";

const EXAMPLES = [
  "Generate dark techno kick sample",
  "Generate ambient cinematic texture",
  "Create serum bass preset",
  "Generate MIDI chord progression",
  "Design melodic house pluck preset",
  "Create layered trap hi-hat loop",
  "Generate analog synth stab",
  "Build atmospheric transition effect",
];

const TYPING_MS = 42;
const PAUSE_MS = 2200;
const DELETE_MS = 24;

export default function TypewriterPlaceholder() {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = EXAMPLES[lineIndex];
    let timer: number;

    if (!deleting && text === target) {
      timer = window.setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && text === "") {
      setDeleting(false);
      setLineIndex((i) => (i + 1) % EXAMPLES.length);
    } else if (deleting) {
      timer = window.setTimeout(
        () => setText(target.slice(0, text.length - 1)),
        DELETE_MS,
      );
    } else {
      timer = window.setTimeout(
        () => setText(target.slice(0, text.length + 1)),
        TYPING_MS,
      );
    }

    return () => window.clearTimeout(timer);
  }, [text, deleting, lineIndex]);

  return (
    <p className="typewriter-line font-codec text-[15px] text-[var(--text-muted)]">
      <span className="text-[var(--text-secondary)]">{text}</span>
      <span className="typewriter-cursor" aria-hidden>
        |
      </span>
    </p>
  );
}
