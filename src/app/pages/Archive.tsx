import { useMemo, useState } from "react";
import { Archive as ArchiveIcon, FolderKanban, MessageSquare, Trash2, RotateCcw } from "lucide-react";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import { useWorkspaceStore } from "../state/workspaceStore";
import { useLanguage } from "../i18n/LanguageProvider";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function Archive() {
  const { t } = useLanguage();
  const chats = useWorkspaceStore((s) => s.chats);
  const projects = useWorkspaceStore((s) => s.projects);
  const restoreChat = useWorkspaceStore((s) => s.restoreChat);
  const restoreProject = useWorkspaceStore((s) => s.restoreProject);
  const deleteChat = useWorkspaceStore((s) => s.deleteChat);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);

  const archivedChats = useMemo(() => chats.filter((c) => c.archived), [chats]);
  const archivedProjects = useMemo(() => projects.filter((p) => p.archived), [projects]);

  const { notify } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<{ kind: "chat" | "project"; id: string; name: string } | null>(null);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "chat") {
      deleteChat(deleteTarget.id);
      notify("Chat permanently deleted.", "success");
    } else {
      deleteProject(deleteTarget.id);
      notify("Project permanently deleted.", "success");
    }
    setDeleteTarget(null);
  };

  return (
    <WorkspacePageShell
      title={t("archive.title")}
      subtitle={t("archive.subtitle")}
    >
      <div className="space-y-8">
        {/* Archived Chats */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArchiveIcon className="h-5 w-5 text-primary" />
              <h2 className="font-syne text-[18px] font-semibold text-[var(--text-primary)]">
                {t("archive.chats")}
              </h2>
              <span className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {archivedChats.length}
              </span>
            </div>
          </div>

          {archivedChats.length === 0 ? (
            <div className="premium-empty rounded-[18px] border border-dashed border-[var(--border-primary)] p-10 text-center font-codec text-sm text-[var(--text-secondary)]">
              {t("archive.noChats")}
            </div>
          ) : (
            <div className="space-y-2">
              {archivedChats.map((chat) => (
                <ArchivedItem
                  key={chat.id}
                  item={{ id: chat.id, name: chat.title, kind: "chat" }}
                  onRestore={() => {
                    restoreChat(chat.id);
                    notify("Chat restored.", "success");
                  }}
                  onDelete={() => setDeleteTarget({ kind: "chat", id: chat.id, name: chat.title })}
                />
              ))}
            </div>
          )}
        </section>

        {/* Archived Projects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <h2 className="font-syne text-[18px] font-semibold text-[var(--text-primary)]">
                {t("archive.projects")}
              </h2>
              <span className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {archivedProjects.length}
              </span>
            </div>
          </div>

          {archivedProjects.length === 0 ? (
            <div className="premium-empty rounded-[18px] border border-dashed border-[var(--border-primary)] p-10 text-center font-codec text-sm text-[var(--text-secondary)]">
              {t("archive.noProjects")}
            </div>
          ) : (
            <div className="space-y-2">
              {archivedProjects.map((project) => (
                <ArchivedItem
                  key={project.id}
                  item={{ id: project.id, name: project.name, kind: "project" }}
                  onRestore={() => {
                    restoreProject(project.id);
                    notify("Project restored.", "success");
                  }}
                  onDelete={() => setDeleteTarget({ kind: "project", id: project.id, name: project.name })}
                />
              ))}
            </div>
          )}
        </section>

        {(archivedChats.length === 0 && archivedProjects.length === 0) && (
          <div className="premium-empty rounded-[18px] border border-dashed border-[var(--border-primary)] p-10 text-center">
            <ArchiveIcon className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
            <p className="font-syne text-lg font-medium text-[var(--text-secondary)]">
              {t("archive.emptyTitle")}
            </p>
            <p className="mt-2 font-codec text-sm text-[var(--text-muted)]">
              {t("archive.emptyDesc")}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.kind === "project" ? t("archive.deleteProjectTitle") : t("archive.deleteChatTitle")}
        body={deleteTarget?.kind === "project"
          ? `${t("archive.deleteProjectConfirm")} "${deleteTarget?.name ?? ""}"`
          : `${t("archive.deleteChatConfirm")} "${deleteTarget?.name ?? ""}"`}
        confirmLabel={t("archive.deleteForever")}
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </WorkspacePageShell>
  );
}

function ArchivedItem({
  item,
  onRestore,
  onDelete,
}: {
  item: { id: string; name: string; kind: "chat" | "project" };
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const Icon = item.kind === "chat" ? MessageSquare : FolderKanban;

  return (
    <div className="premium-archive-item flex items-center gap-3 rounded-[14px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 transition-colors hover:bg-[var(--surface-secondary)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-poppins text-sm font-medium text-[var(--text-primary)]">
          {item.name}
        </p>
        <p className="font-codec text-[11px] text-[var(--text-muted)]">
          {item.kind === "chat" ? t("archive.typeChat") : t("archive.typeProject")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onRestore}
          className="premium-icon-btn h-8 w-8 text-[var(--text-secondary)] hover:text-primary hover:bg-[var(--surface-secondary)]"
          aria-label={t("archive.restore")}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="premium-icon-btn h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--surface-secondary)]"
          aria-label={t("archive.deleteForever")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}