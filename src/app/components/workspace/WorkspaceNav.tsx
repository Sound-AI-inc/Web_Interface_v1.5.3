import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, FolderKanban, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import {
  selectProjectChats,
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
  const renameProject = useWorkspaceStore((s) => s.renameProject);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    () => new Set([activeProjectId]),
  );
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      next.add(activeProjectId);
      return next;
    });
  }, [activeProjectId]);

  const chatsByProject = useMemo(() => {
    const map = new Map<string, ReturnType<typeof selectProjectChats>>();
    for (const project of projects) {
      map.set(project.id, selectProjectChats({ chats }, project.id));
    }
    return map;
  }, [projects, chats]);

  const toggleExpanded = (projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const openProjectPage = (projectId: string) => {
    setActiveProject(projectId);
    navigate(`/app/projects/${projectId}`);
  };

  const startRename = (projectId: string, currentName: string) => {
    setRenamingProjectId(projectId);
    setRenameDraft(currentName);
  };

  const commitRename = () => {
    if (renamingProjectId) renameProject(renamingProjectId, renameDraft);
    setRenamingProjectId(null);
    setRenameDraft("");
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) return;
    if (!window.confirm(t("project.deleteConfirm"))) return;
    deleteProject(projectId);
    navigate(GENERATOR_PATH);
  };

  if (collapsed) {
    return (
      <div className="mb-3 flex flex-col items-center gap-2 px-1">
        <button
          type="button"
          title={t("workspace.projects")}
          onClick={() => setProjectsOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-button text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
        >
          <FolderKanban className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
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
          {projects.map((project) => {
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
                    onClick={() => toggleExpanded(project.id)}
                    className="flex h-8 w-7 shrink-0 items-center justify-center text-[var(--text-muted)]"
                    aria-label={expanded ? "Collapse" : "Expand"}
                  >
                    {expanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {renamingProjectId === project.id ? (
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") {
                          setRenamingProjectId(null);
                          setRenameDraft("");
                        }
                      }}
                      className="min-w-0 flex-1 rounded-[6px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-2 py-1 font-codec text-[12px] text-[var(--text-primary)] outline-none focus:border-primary"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => openProjectPage(project.id)}
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
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      title={t("project.delete")}
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-[var(--text-muted)] opacity-0 transition-opacity hover:text-[var(--error)] group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
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
                        {t("workspace.noChats")}
                      </p>
                    ) : (
                      projectChats.map((chat) => (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => openWorkspaceChat(chat.id, setActiveChat, navigate)}
                          className={`mb-0.5 flex w-full items-center gap-2 truncate rounded-button px-2 py-1.5 text-left font-codec text-[11px] transition-colors ${
                            chat.id === activeChatId
                              ? "border-l-2 border-l-primary bg-[var(--surface-elevated)] font-semibold text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <MessageSquare className="h-3 w-3 shrink-0 opacity-60" />
                          <span className="truncate">{chat.title}</span>
                        </button>
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
  );
}
