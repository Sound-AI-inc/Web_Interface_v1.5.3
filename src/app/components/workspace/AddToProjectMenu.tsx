import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, Plus } from "lucide-react";
import type { WorkspaceProject } from "../../state/workspaceStore";
import { useLanguage } from "../../i18n/LanguageProvider";

interface AddToProjectMenuProps {
  projects: WorkspaceProject[];
  onAssign: (projectId: string) => void;
  onCreateProject: () => void;
}

export default function AddToProjectMenu({
  projects,
  onAssign,
  onCreateProject,
}: AddToProjectMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const upward = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const measured = menuRef.current?.getBoundingClientRect().height ?? estimatedHeight;
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      minWidth: 200,
      top: upward ? rect.top - measured - 6 : rect.bottom + 6,
      zIndex: "var(--z-dropdown)",
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, projects.length]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className="token-menu max-h-64 overflow-auto rounded-[12px] p-1 shadow-[var(--ui-shadow-floating)]"
          style={menuStyle}
        >
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left font-codec text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => {
                onAssign(p.id);
                setOpen(false);
              }}
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-button border-t border-[var(--border-primary)] px-2.5 py-2 text-left font-codec text-xs text-primary hover:bg-[var(--surface-secondary)]"
            onClick={() => {
              onCreateProject();
              setOpen(false);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("workspace.newProject")}
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="composer-control inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-codec text-[11px] font-semibold"
      >
        <FolderPlus className="h-3 w-3" />
        {t("workspace.addToProject")}
      </button>
      {menu}
    </>
  );
}
