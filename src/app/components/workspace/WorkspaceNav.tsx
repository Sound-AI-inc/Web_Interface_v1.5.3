import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";
import ItemContextMenu, { type ContextMenuTarget } from "./ItemContextMenu";
import {
  selectProjectChats,
  selectStandaloneChats,
  selectVisibleProjects,
  useWorkspaceStore,
} from "../../state/workspaceStore";
import { focusComposerInput } from "../../lib/focusComposer";
import { useLanguage } from "../../i18n/LanguageProvider";

const GENERATOR_PATH = "/app/generator";

function openWorkspaceChat(
  chatId: string,
  setActiveChat: (id: string) => void,
  navigate: (path: string) => void,
) {
  setActiveChat(chatId);
  navigate(GENERATOR_PATH);
  focusComposerInput();
}

function ChatRow({
  chat,
  activeChatId,
  onOpen,
  onContextMenu,
}: {
  chat: { id: string; title: string; pinned?: boolean };
  activeChatId: string;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`group mb-0.5 flex items-center gap-0.5 rounded-button pr-1 transition-colors ${
        chat.id === activeChatId
          ? "border-l-2 border-l-primary bg-[var(--surface-elevated)]"
          : "hover:bg-[var(--surface-secondary)]"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`flex min-w-0 flex-1 items-center gap-2 truncate px-2 py-1.5 text-left font-codec text-[11px] ${
          chat.id === activeChatId
            ? "font-semibold text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
      >
        <MessageSquare className="h-3 w-3 shrink-0 opacity-60" />
        <span className="truncate">{chat.title}</span>
        {chat.pinned && <span className="text-[9px] text-primary">•</span>}
      </button>
      <button
        type="button"
        onClick={onContextMenu}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-button text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Chat options"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function WorkspaceNav({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const projects = useWorkspaceStore((s) => s.projects);
  const chats = useWorkspaceStore((s) => s.chats);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const activeChatId = useWorkspaceStore((s) => s.activeChatId);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);
  const setActiveChat = useWorkspaceStore((s) => s.setActiveChat);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const startNewSession = useWorkspaceStore((s) => s.startNewSession);
  const renameProject = useWorkspaceStore((s) => s.renameProject);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const deleteChat = useWorkspaceStore((s) => s.deleteChat);
  const renameChat = useWorkspaceStore((s) => s.renameChat);
  const moveChatToProject = useWorkspaceStore((s) => s.moveChatToProject);
  const togglePinChat = useWorkspaceStore((s) => s.togglePinChat);
  const toggleArchiveChat = useWorkspaceStore((s) => s.toggleArchiveChat);
  const togglePinProject = useWorkspaceStore((s) => s.togglePinProject);
  const toggleArchiveProject = useWorkspaceStore((s) => s.toggleArchiveProject);

  const [chatsOpen, setChatsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    () => new Set([activeProjectId]),
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [menuTarget, setMenuTarget] = useState<ContextMenuTarget | null>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      next.add(activeProjectId);
      return next;
    });
  }, [activeProjectId]);

  const visibleProjects = useMemo(() => selectVisibleProjects({ projects }), [projects]);
  const standaloneChats = useMemo(() => selectStandaloneChats({ chats }), [chats]);

  const chatsByProject = useMemo(() => {
    const map = new Map<string, ReturnType<typeof selectProjectChats>>();
    for (const project of visibleProjects) {
      map.set(project.id, selectProjectChats({ chats }, project.id));
    }
    return map;
  }, [visibleProjects, chats]);

  const openMenu = (target: ContextMenuTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuTarget(target);
    setMenuRect(rect);
  };

  const closeMenu = () => {
    setMenuTarget(null);
    setMenuRect(null);
  };

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameDraft(current);
  };

  const commitRename = () => {
    if (!renamingId) return;
    if (renamingId.startsWith("project-")) {
      renameProject(renamingId, renameDraft);
    } else {
      renameChat(renamingId, renameDraft);
    }
    setRenamingId(null);
    setRenameDraft("");
  };

  const handleShare = (target: ContextMenuTarget) => {
    const label = target.kind === "chat" ? target.title : target.name;
    const link = `${window.location.origin}/app/generator?share=${target.id}`;
    void navigator.clipboard?.writeText(link);
    window.alert(`${t("context.shareCopied")}\n${label}`);
  };

  const handleDeleteTarget = (target: ContextMenuTarget) => {
    if (target.kind === "project") {
      if (!window.confirm(t("project.deleteConfirm"))) return;
      deleteProject(target.id);
      navigate(GENERATOR_PATH);
      return;
    }
    if (!window.confirm(t("context.deleteChatConfirm"))) return;
    deleteChat(target.id);
    if (activeChatId === target.id) navigate(GENERATOR_PATH);
  };

  if (collapsed) {
    return (
      <div className="mb-3 flex flex-col items-center gap-2 px-1">
        <button
          type="button"
          title={t("workspace.chats")}
          onClick={() => setChatsOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-button text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t("workspace.projects")}
          onClick={() => setProjectsOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-button text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
        >
          <FolderKanban className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      {menuTarget && menuRect && (
        <ItemContextMenu
          target={menuTarget}
          anchorRect={menuRect}
          projects={projects}
          onClose={closeMenu}
          onRename={() => {
            if (menuTarget.kind === "chat") startRename(menuTarget.id, menuTarget.title);
            else startRename(menuTarget.id, menuTarget.name);
          }}
          onDelete={() => handleDeleteTarget(menuTarget)}
          onShare={() => handleShare(menuTarget)}
          onMoveToProject={(projectId) => {
            if (menuTarget.kind === "chat") moveChatToProject(menuTarget.id, projectId);
          }}
          onPin={() =>
            menuTarget.kind === "chat"
              ? togglePinChat(menuTarget.id)
              : togglePinProject(menuTarget.id)
          }
          onArchive={() =>
            menuTarget.kind === "chat"
              ? toggleArchiveChat(menuTarget.id)
              : toggleArchiveProject(menuTarget.id)
          }
        />
      )}

      {/* Standalone chats */}
      <div>
        <button
          type="button"
          onClick={() => setChatsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-1.5 font-codec text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            {t("workspace.chats")}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${chatsOpen ? "rotate-180" : ""}`} />
        </button>
        {chatsOpen && (
          <div className="mt-1 px-1">
            {standaloneChats.length === 0 ? (
              <p className="px-2 py-1.5 font-codec text-[11px] text-[var(--text-muted)]">
                {t("workspace.noChats")}
              </p>
            ) : (
              standaloneChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  activeChatId={activeChatId}
                  onOpen={() => openWorkspaceChat(chat.id, setActiveChat, navigate)}
                  onContextMenu={(e) =>
                    openMenu(
                      { kind: "chat", id: chat.id, title: chat.title, projectId: chat.projectId },
                      e,
                    )
                  }
                />
              ))
            )}
            <button
              type="button"
              onClick={() => {
                startNewSession();
                navigate(GENERATOR_PATH);
                focusComposerInput();
              }}
              className="mt-1 flex w-full items-center gap-2 px-2 py-1.5 font-codec text-[11px] text-[var(--text-muted)] hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("workspace.newChat")}
            </button>
          </div>
        )}
      </div>

      {/* Projects */}
      <div>
        <button
          type="button"
          onClick={() => setProjectsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-1.5 font-codec text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]"
        >
          <span className="flex items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5" />
            {t("workspace.projects")}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${projectsOpen ? "rotate-180" : ""}`} />
        </button>

        {projectsOpen && (
          <div className="mt-1 space-y-1">
            {visibleProjects.map((project) => {
              const expanded = expandedProjectIds.has(project.id);
              const projectChats = chatsByProject.get(project.id) ?? [];
              const isActiveProject = project.id === activeProjectId;

              return (
                <div key={project.id} className="rounded-button">
                  <div
                    className={`group flex items-center gap-1 rounded-button pr-1 transition-colors ${
                      isActiveProject ? "bg-[var(--surface-secondary)]" : "hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProjectIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(project.id)) next.delete(project.id);
                          else next.add(project.id);
                          return next;
                        })
                      }
                      className="flex h-8 w-7 shrink-0 items-center justify-center text-[var(--text-muted)]"
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {renamingId === project.id ? (
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="min-w-0 flex-1 rounded-[6px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-2 py-1 font-codec text-[12px] outline-none focus:border-primary"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveProject(project.id);
                          navigate(`/app/projects/${project.id}`);
                        }}
                        onDoubleClick={() => startRename(project.id, project.name)}
                        className={`min-w-0 flex-1 truncate py-2 text-left font-codec text-[12px] ${
                          isActiveProject
                            ? "font-semibold text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {project.name}
                      </button>
                    )}

                    <button
                      type="button"
                      title={t("workspace.renameProject")}
                      onClick={() => startRename(project.id, project.name)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-[var(--text-muted)] opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
                        openMenu({ kind: "project", id: project.id, name: project.name }, e)
                      }
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-[var(--text-muted)] opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {expanded && (
                    <div className="ml-4 border-l border-[var(--border-primary)] pl-2">
                      <Link
                        to={`/app/projects/${project.id}`}
                        onClick={() => setActiveProject(project.id)}
                        className="mb-1 block px-2 py-1 font-codec text-[10px] font-semibold uppercase tracking-[0.04em] text-primary hover:underline"
                      >
                        {t("project.openPage")}
                      </Link>
                      {projectChats.length === 0 ? (
                        <p className="px-2 py-1.5 font-codec text-[11px] text-[var(--text-muted)]">
                          {t("workspace.noChatsInProject")}
                        </p>
                      ) : (
                        projectChats.map((chat) => (
                          <ChatRow
                            key={chat.id}
                            chat={chat}
                            activeChatId={activeChatId}
                            onOpen={() => openWorkspaceChat(chat.id, setActiveChat, navigate)}
                            onContextMenu={(e) =>
                              openMenu(
                                {
                                  kind: "chat",
                                  id: chat.id,
                                  title: chat.title,
                                  projectId: chat.projectId,
                                },
                                e,
                              )
                            }
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => createProject(t("workspace.newProject"))}
              className="flex w-full items-center gap-2 px-3 py-2 font-codec text-[12px] text-[var(--text-muted)] hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("workspace.newProject")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
