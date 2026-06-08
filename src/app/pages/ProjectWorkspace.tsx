import { useMemo } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/PageContainer";
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

  const handleDeleteProject = () => {
    if (!window.confirm(t("project.deleteConfirm"))) return;
    deleteProject(project.id);
    navigate("/app/generator", { replace: true });
  };

  return (
    <PageContainer
      title={project.name}
      subtitle={t("project.subtitle")}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={startNewChat} className="app-btn-primary h-9 px-4">
            <Plus className="h-4 w-4" />
            {t("workspace.create")}
          </button>
          {projects.length > 1 && (
            <button
              type="button"
              onClick={handleDeleteProject}
              className="composer-control inline-flex h-9 items-center gap-2 rounded-full px-3 font-codec text-[12px] text-[var(--error)]"
            >
              <Trash2 className="h-4 w-4" />
              {t("project.delete")}
            </button>
          )}
        </div>
      }
    >
      <div className="pb-10">
        {projectChats.length === 0 ? (
          <div className="token-card rounded-card p-8 text-center">
            <p className="font-codec text-[var(--text-secondary)]">{t("workspace.noChats")}</p>
            <button type="button" onClick={startNewChat} className="app-btn-primary mt-4 h-10 px-5">
              {t("workspace.create")}
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {projectChats.map((chat) => {
              const batches = chat.history.length;
              const assets = chat.sessionAssets.length;
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => openChat(chat.id)}
                    className={`token-card flex w-full items-center gap-4 rounded-card p-4 text-left transition-colors hover:border-[var(--border-secondary)] ${
                      chat.id === activeChatId ? "ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-codec text-[14px] font-semibold text-[var(--text-primary)]">
                        {chat.title}
                      </div>
                      <div className="mt-1 font-codec text-[12px] text-[var(--text-muted)]">
                        {batches} {t("project.generations")} · {assets} {t("project.assetsCount")}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
