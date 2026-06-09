import { useMemo } from "react";
import { ArrowLeft, FolderKanban, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import {
  selectActiveChat,
  selectVisibleProjects,
  useWorkspaceStore,
} from "../../state/workspaceStore";

interface EditorContextBarProps {
  assetTitle?: string;
}

export default function EditorContextBar({ assetTitle }: EditorContextBarProps) {
  const activeChatId = useWorkspaceStore((s) => s.activeChatId);
  const chats = useWorkspaceStore((s) => s.chats);
  const projects = useWorkspaceStore((s) => s.projects);
  const activeChat = useMemo(
    () => selectActiveChat({ chats, activeChatId }),
    [chats, activeChatId],
  );
  const visibleProjects = useMemo(() => selectVisibleProjects({ projects }), [projects]);
  const project = activeChat?.projectId
    ? visibleProjects.find((p) => p.id === activeChat.projectId)
    : undefined;

  return (
    <div className="premium-editor-context mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3">
      <Link
        to="/app/generator"
        className="composer-control inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-codec text-[11px] font-semibold"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Create
      </Link>
      {activeChat && (
        <span className="inline-flex items-center gap-1.5 font-codec text-[12px] text-[var(--text-secondary)]">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[200px] truncate">{activeChat.title}</span>
        </span>
      )}
      {project && (
        <Link
          to={`/app/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 font-codec text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <FolderKanban className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[160px] truncate">{project.name}</span>
        </Link>
      )}
      {assetTitle && (
        <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]">
          Editing: <span className="text-[var(--text-primary)]">{assetTitle}</span>
        </span>
      )}
    </div>
  );
}
