import { useMemo, useState } from "react";
import { MessageSquare, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import ItemContextMenu, { type ContextMenuTarget } from "../components/workspace/ItemContextMenu";
import { focusComposerInput } from "../lib/focusComposer";
import {
  selectProjectChats,
  useWorkspaceStore,
} from "../state/workspaceStore";
import { useLanguage } from "../i18n/LanguageProvider";

export default function ProjectWorkspace() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const projects = useWorkspaceStore((s) => s.projects);
  const chats = useWorkspaceStore((s) => s.chats);
  const activeChatId = useWorkspaceStore((s) => s.activeChatId);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);
  const setActiveChat = useWorkspaceStore((s) => s.setActiveChat);
  const createChat = useWorkspaceStore((s) => s.createChat);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const deleteChat = useWorkspaceStore((s) => s.deleteChat);
  const renameChat = useWorkspaceStore((s) => s.renameChat);
  const moveChatToProject = useWorkspaceStore((s) => s.moveChatToProject);
  const togglePinChat = useWorkspaceStore((s) => s.togglePinChat);
  const toggleArchiveChat = useWorkspaceStore((s) => s.toggleArchiveChat);
  const togglePinProject = useWorkspaceStore((s) => s.togglePinProject);
  const toggleArchiveProject = useWorkspaceStore((s) => s.toggleArchiveProject);
  const renameProject = useWorkspaceStore((s) => s.renameProject);

  const [menuTarget, setMenuTarget] = useState<ContextMenuTarget | null>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const project = projects.find((p) => p.id === projectId);
  const projectChats = useMemo(
    () => (projectId ? selectProjectChats({ chats }, projectId) : []),
    [chats, projectId],
  );

  if (!project) {
    return (
      <PageContainer title={t("project.notFound")} subtitle="">
        <Link to="/app/generator" className="text-primary hover:underline">
          {t("project.backToCreate")}
        </Link>
      </PageContainer>
    );
  }

  const openMenu = (target: ContextMenuTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuTarget(target);
    setMenuRect((e.currentTarget as HTMLElement).getBoundingClientRect());
  };

  const closeMenu = () => {
    setMenuTarget(null);
    setMenuRect(null);
  };

  const handleShare = (target: ContextMenuTarget) => {
    const label = target.kind === "chat" ? target.title : target.name;
    const link = `${window.location.origin}/app/generator?share=${target.id}`;
    void navigator.clipboard?.writeText(link);
    window.alert(`${t("context.shareCopied")}\n${label}`);
  };

  const handleDelete = (target: ContextMenuTarget) => {
    if (target.kind === "project") {
      if (!window.confirm(t("project.deleteConfirm"))) return;
      deleteProject(target.id);
      navigate("/app/generator", { replace: true });
      return;
    }
    if (!window.confirm(t("context.deleteChatConfirm"))) return;
    deleteChat(target.id);
  };

  const commitRename = () => {
    if (!renamingId) return;
    if (renamingId === project.id) renameProject(renamingId, renameDraft);
    else renameChat(renamingId, renameDraft);
    setRenamingId(null);
    setRenameDraft("");
  };

  const openChat = (chatId: string) => {
    setActiveProject(project.id);
    setActiveChat(chatId);
    navigate("/app/generator");
    focusComposerInput();
  };

  const startNewChat = () => {
    setActiveProject(project.id);
    createChat(project.id);
    navigate("/app/generator");
    focusComposerInput();
  };

  return (
    <PageContainer
      title={renamingId === project.id ? renameDraft : project.name}
      subtitle={t("project.subtitle")}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={startNewChat} className="app-btn-primary h-9 px-4">
            <Plus className="h-4 w-4" />
            {t("workspace.create")}
          </button>
          <button
            type="button"
            onClick={(e) => openMenu({ kind: "project", id: project.id, name: project.name }, e)}
            className="composer-control flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="Project options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(t("project.deleteConfirm"))) return;
              deleteProject(project.id);
              navigate("/app/generator", { replace: true });
            }}
            className="composer-control inline-flex h-9 items-center gap-2 rounded-full px-3 font-codec text-[12px] text-[var(--error)]"
          >
            <Trash2 className="h-4 w-4" />
            {t("project.delete")}
          </button>
        </div>
      }
    >
      {menuTarget && menuRect && (
        <ItemContextMenu
          target={menuTarget}
          anchorRect={menuRect}
          projects={projects}
          onClose={closeMenu}
          onRename={() => {
            if (menuTarget.kind === "chat") {
              setRenamingId(menuTarget.id);
              setRenameDraft(menuTarget.title);
            } else {
              setRenamingId(menuTarget.id);
              setRenameDraft(menuTarget.name);
            }
          }}
          onDelete={() => handleDelete(menuTarget)}
          onShare={() => handleShare(menuTarget)}
          onMoveToProject={(pid) => {
            if (menuTarget.kind === "chat") moveChatToProject(menuTarget.id, pid);
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

      {renamingId === project.id && (
        <div className="mb-4">
          <input
            autoFocus
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenamingId(null);
            }}
            className="app-input max-w-md"
          />
        </div>
      )}

      <div className="pb-10">
        {projectChats.length === 0 ? (
          <div className="token-card rounded-card p-8 text-center">
            <p className="font-codec text-[var(--text-secondary)]">{t("workspace.noChatsInProject")}</p>
            <button type="button" onClick={startNewChat} className="app-btn-primary mt-4 h-10 px-5">
              {t("workspace.create")}
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {projectChats.map((chat) => (
              <li key={chat.id} className="group flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openChat(chat.id)}
                  className={`token-card flex min-w-0 flex-1 items-center gap-4 rounded-card p-4 text-left transition-colors hover:border-[var(--border-secondary)] ${
                    chat.id === activeChatId ? "ring-1 ring-primary/20" : ""
                  }`}
                >
                  <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-codec text-[14px] font-semibold text-[var(--text-primary)]">
                      {chat.title}
                    </div>
                    <div className="mt-1 font-codec text-[12px] text-[var(--text-muted)]">
                      {chat.history.length} {t("project.generations")} · {chat.sessionAssets.length}{" "}
                      {t("project.assetsCount")}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) =>
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
                  className="composer-control flex h-9 w-9 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
