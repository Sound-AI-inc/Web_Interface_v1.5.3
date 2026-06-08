import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  ChevronRight,
  FolderInput,
  FolderX,
  Pin,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useInterfaceMode } from "../../hooks/useInterfaceMode";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { WorkspaceProject } from "../../state/workspaceStore";

export type ContextMenuTarget =
  | { kind: "chat"; id: string; title: string; projectId: string | null }
  | { kind: "project"; id: string; name: string };

interface ItemContextMenuProps {
  target: ContextMenuTarget;
  anchorRect: DOMRect;
  projects: WorkspaceProject[];
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
  onMoveToProject: (projectId: string | null) => void;
  onPin?: () => void;
  onArchive?: () => void;
}

export default function ItemContextMenu({
  target,
  anchorRect,
  projects,
  onClose,
  onRename,
  onDelete,
  onShare,
  onMoveToProject,
  onPin,
  onArchive,
}: ItemContextMenuProps) {
  const { t } = useLanguage();
  const { mode } = useInterfaceMode();
  const themeClass = mode === "lite" ? "theme-lite" : "theme-pro";
  const menuRef = useRef<HTMLDivElement>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const menuRect = menu.getBoundingClientRect();
    let top = anchorRect.bottom + 6;
    let left = anchorRect.left;
    if (top + menuRect.height > window.innerHeight - 8) {
      top = anchorRect.top - menuRect.height - 6;
    }
    if (left + menuRect.width > window.innerWidth - 8) {
      left = window.innerWidth - menuRect.width - 8;
    }
    setStyle({ position: "fixed", top, left, zIndex: "calc(var(--z-dropdown) + 2)" });
  }, [anchorRect]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const otherProjects = projects.filter((p) => target.kind !== "project" || p.id !== target.id);

  return createPortal(
    <div
      ref={menuRef}
      data-theme={mode}
      className={`token-menu ${themeClass} w-[240px] rounded-card p-1.5 shadow-[var(--ui-shadow-floating)]`}
      style={style}
    >
      <button type="button" className="menu-row" onClick={() => { onShare(); onClose(); }}>
        <Share2 className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="flex-1 text-left">{t("context.share")}</span>
      </button>
      <button type="button" className="menu-row" onClick={() => { onRename(); onClose(); }}>
        <Pencil className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="flex-1 text-left">{t("context.rename")}</span>
      </button>

      {target.kind === "chat" && (
        <div
          className="relative"
          onMouseEnter={() => setMoveOpen(true)}
          onMouseLeave={() => setMoveOpen(false)}
        >
          <button type="button" className="menu-row">
            <FolderInput className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="flex-1 text-left">{t("context.moveToProject")}</span>
            <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
          </button>
          {moveOpen && (
            <div
              className={`token-menu ${themeClass} absolute bottom-0 left-full ml-1 w-[200px] rounded-card p-1.5 shadow-[var(--ui-shadow-floating)]`}
              style={{ zIndex: "calc(var(--z-dropdown) + 3)" }}
            >
              <button
                type="button"
                className="menu-row"
                onClick={() => { onMoveToProject(null); onClose(); }}
              >
                <span className="flex-1 text-left">{t("context.noProject")}</span>
              </button>
              {otherProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="menu-row"
                  onClick={() => { onMoveToProject(p.id); onClose(); }}
                >
                  <span className="flex-1 truncate text-left">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {target.kind === "chat" && target.projectId && (
        <button
          type="button"
          className="menu-row"
          onClick={() => { onMoveToProject(null); onClose(); }}
        >
          <FolderX className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="flex-1 text-left">{t("context.removeFromProject")}</span>
        </button>
      )}

      {target.kind === "chat" && onPin && (
        <>
          <div className="my-1 mx-1 h-px bg-[var(--border-primary)]" />
          <button type="button" className="menu-row" onClick={() => { onPin(); onClose(); }}>
            <Pin className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="flex-1 text-left">{t("context.pinChat")}</span>
          </button>
          {onArchive && (
            <button type="button" className="menu-row" onClick={() => { onArchive(); onClose(); }}>
              <Archive className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("context.archive")}</span>
            </button>
          )}
        </>
      )}

      <div className="my-1 mx-1 h-px bg-[var(--border-primary)]" />
      <button
        type="button"
        className="menu-row text-[var(--error)] hover:bg-[var(--error)]/10"
        onClick={() => { onDelete(); onClose(); }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="flex-1 text-left">{t("context.delete")}</span>
      </button>
    </div>,
    document.body,
  );
}
