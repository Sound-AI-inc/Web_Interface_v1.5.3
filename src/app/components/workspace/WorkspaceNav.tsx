import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FolderKanban, MessageSquare, Plus } from "lucide-react";
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
  const createChat = useWorkspaceStore((s) => s.createChat);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);

  const activeProjectChats = useMemo(
    () => selectProjectChats({ chats }, activeProjectId),
    [chats, activeProjectId],
  );

  const handleNewChat = () => {
    createChat();
    navigate(GENERATOR_PATH);
    focusComposerInput();
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    const projectChats = selectProjectChats({ chats }, projectId);
    if (projectChats[0]) {
      openWorkspaceChat(projectChats[0].id, setActiveChat, navigate);
    }
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
        <button
          type="button"
          title={t("workspace.newChat")}
          onClick={handleNewChat}
          className="flex h-9 w-9 items-center justify-center rounded-button text-primary hover:bg-[var(--surface-secondary)]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
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
          <div className="mt-1 space-y-0.5">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProject(p.id)}
                className={`w-full truncate rounded-button px-3 py-2 text-left font-codec text-[12px] transition-colors ${
                  p.id === activeProjectId
                    ? "bg-[var(--surface-elevated)] font-semibold text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => createProject("New Project")}
              className="flex w-full items-center gap-2 px-3 py-2 font-codec text-[12px] text-[var(--text-muted)] hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("workspace.newProject")}
            </button>
          </div>
        )}
      </div>

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
          <div className="mt-1 space-y-0.5">
            {activeProjectChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => openWorkspaceChat(chat.id, setActiveChat, navigate)}
                className={`w-full truncate rounded-button px-3 py-2 text-left font-codec text-[12px] transition-colors ${
                  chat.id === activeChatId
                    ? "border-l-2 border-l-primary bg-[var(--surface-elevated)] font-semibold text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                {chat.title}
              </button>
            ))}
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center gap-2 px-3 py-2 font-codec text-[12px] text-[var(--text-muted)] hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("workspace.newChat")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
