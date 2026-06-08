import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudioResult } from "../data/mock";

export interface GenerationBatch {
  id: string;
  prompt: string;
  count: number;
  type: string;
  model: string;
  format: string;
  createdAt: string;
  items: AudioResult[];
}

export interface WorkspaceChat {
  id: string;
  projectId: string | null;
  title: string;
  history: GenerationBatch[];
  sessionAssets: AudioResult[];
  favoriteIds: string[];
  savedIds: string[];
  pinned?: boolean;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  createdAt: number;
  pinned?: boolean;
  archived?: boolean;
}

interface WorkspaceState {
  projects: WorkspaceProject[];
  chats: WorkspaceChat[];
  activeProjectId: string;
  activeChatId: string;
  assetsPanelCollapsed: boolean;
  projectAssetIds: Record<string, string[]>;

  setAssetsPanelCollapsed: (collapsed: boolean) => void;
  createProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  createChat: (projectId?: string | null, title?: string) => string;
  startNewSession: () => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  moveChatToProject: (chatId: string, projectId: string | null) => void;
  togglePinChat: (id: string) => void;
  toggleArchiveChat: (id: string) => void;
  togglePinProject: (id: string) => void;
  toggleArchiveProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  setActiveChat: (id: string) => void;
  updateChat: (chatId: string, patch: Partial<WorkspaceChat>) => void;
  appendBatch: (chatId: string, batch: GenerationBatch, assets: AudioResult[]) => void;
  assignAssetToProject: (projectId: string, assetId: string) => void;
}

type PersistedWorkspaceState = Pick<
  WorkspaceState,
  | "projects"
  | "chats"
  | "activeProjectId"
  | "activeChatId"
  | "assetsPanelCollapsed"
  | "projectAssetIds"
>;

const DEFAULT_PROJECT_ID = "project-default";

function createSeed(): PersistedWorkspaceState & { assetsPanelCollapsed: boolean } {
  const now = Date.now();
  const chatId = `chat-${now}`;
  return {
    projects: [
      { id: DEFAULT_PROJECT_ID, name: "Techno EP", createdAt: now },
      { id: "project-ambient", name: "Ambient Pack", createdAt: now - 1000 },
      { id: "project-serum", name: "Serum Presets", createdAt: now - 2000 },
    ],
    chats: [
      {
        id: chatId,
        projectId: null,
        title: "New chat",
        history: [],
        sessionAssets: [],
        favoriteIds: [],
        savedIds: [],
        pinned: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    activeProjectId: DEFAULT_PROJECT_ID,
    activeChatId: chatId,
    assetsPanelCollapsed: false,
    projectAssetIds: {},
  };
}

function normalizeChat(
  chat: Partial<WorkspaceChat>,
  projectIds: Set<string>,
): WorkspaceChat {
  const now = Date.now();
  const rawProjectId = chat.projectId;
  const projectId =
    typeof rawProjectId === "string" && projectIds.has(rawProjectId) ? rawProjectId : null;

  return {
    id: typeof chat.id === "string" ? chat.id : `chat-${now}`,
    projectId,
    title: typeof chat.title === "string" ? chat.title : "New chat",
    history: Array.isArray(chat.history) ? chat.history : [],
    sessionAssets: Array.isArray(chat.sessionAssets) ? chat.sessionAssets : [],
    favoriteIds: Array.isArray(chat.favoriteIds) ? chat.favoriteIds : [],
    savedIds: Array.isArray(chat.savedIds) ? chat.savedIds : [],
    pinned: Boolean(chat.pinned),
    archived: Boolean(chat.archived),
    createdAt: typeof chat.createdAt === "number" ? chat.createdAt : now,
    updatedAt: typeof chat.updatedAt === "number" ? chat.updatedAt : now,
  };
}

function repairPersistedState(
  state: Partial<PersistedWorkspaceState> | undefined,
): PersistedWorkspaceState & { assetsPanelCollapsed: boolean } {
  const seed = createSeed();
  if (!state) return seed;

  const projects =
    Array.isArray(state.projects) && state.projects.length > 0 ? state.projects : seed.projects;

  const projectIds = new Set(projects.map((p) => p.id));
  const fallbackProjectId = projects[0]?.id ?? DEFAULT_PROJECT_ID;

  let chats = Array.isArray(state.chats)
    ? state.chats.map((c) => normalizeChat(c as Partial<WorkspaceChat>, projectIds))
    : seed.chats;

  if (chats.length === 0) {
    chats = seed.chats;
  }

  const activeProjectId = projectIds.has(state.activeProjectId ?? "")
    ? (state.activeProjectId as string)
    : fallbackProjectId;

  const activeChatId = chats.some((c) => c.id === state.activeChatId)
    ? (state.activeChatId as string)
    : chats[0].id;

  return {
    projects,
    chats,
    activeProjectId,
    activeChatId,
    assetsPanelCollapsed: Boolean(state.assetsPanelCollapsed),
    projectAssetIds:
      state.projectAssetIds && typeof state.projectAssetIds === "object"
        ? state.projectAssetIds
        : {},
  };
}

function sortChats(chats: WorkspaceChat[]): WorkspaceChat[] {
  return [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

function pickNextActiveChat(chats: WorkspaceChat[], excludeId: string): string {
  const remaining = sortChats(chats.filter((c) => c.id !== excludeId && !c.archived));
  return remaining[0]?.id ?? chats.find((c) => c.id !== excludeId)?.id ?? excludeId;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...createSeed(),

      setAssetsPanelCollapsed: (collapsed) => set({ assetsPanelCollapsed: collapsed }),

      createProject: (name) => {
        const id = `project-${Date.now()}`;
        set((s) => ({
          projects: [...s.projects, { id, name: name.trim() || "Untitled Project", createdAt: Date.now() }],
          activeProjectId: id,
        }));
        return id;
      },

      renameProject: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        }));
      },

      deleteProject: (id) => {
        set((s) => {
          const projects = s.projects.filter((p) => p.id !== id);
          const chats = s.chats.filter((c) => c.projectId !== id);
          const { [id]: _removed, ...projectAssetIds } = s.projectAssetIds;
          void _removed;
          const activeProjectId =
            s.activeProjectId === id ? (projects[0]?.id ?? "") : s.activeProjectId;
          const activeChatId = chats.some((c) => c.id === s.activeChatId)
            ? s.activeChatId
            : chats[0]?.id ?? s.activeChatId;
          return { projects, chats, activeProjectId, activeChatId, projectAssetIds };
        });
      },

      createChat: (projectId, title) => {
        const pid = projectId === undefined ? null : projectId;
        const id = `chat-${Date.now()}`;
        const now = Date.now();
        const chat: WorkspaceChat = {
          id,
          projectId: pid,
          title: title?.trim() || "New chat",
          history: [],
          sessionAssets: [],
          favoriteIds: [],
          savedIds: [],
          pinned: false,
          archived: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          chats: [...s.chats, chat],
          activeChatId: id,
          activeProjectId: pid ?? s.activeProjectId,
        }));
        return id;
      },

      startNewSession: () => get().createChat(null),

      deleteChat: (id) => {
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id);
          const activeChatId =
            s.activeChatId === id
              ? (pickNextActiveChat(s.chats, id) || chats[0]?.id || "")
              : s.activeChatId;
          return { chats, activeChatId };
        });
      },

      renameChat: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c,
          ),
        }));
      },

      moveChatToProject: (chatId, projectId) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId ? { ...c, projectId, updatedAt: Date.now() } : c,
          ),
          activeProjectId: projectId ?? s.activeProjectId,
        }));
      },

      togglePinChat: (id) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c,
          ),
        }));
      },

      toggleArchiveChat: (id) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, archived: !c.archived, updatedAt: Date.now() } : c,
          ),
        }));
      },

      togglePinProject: (id) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, pinned: !p.pinned } : p,
          ),
        }));
      },

      toggleArchiveProject: (id) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, archived: !p.archived } : p,
          ),
        }));
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      setActiveChat: (id) => {
        const chat = get().chats.find((c) => c.id === id);
        if (!chat) return;
        set({
          activeChatId: id,
          activeProjectId: chat.projectId ?? get().activeProjectId,
        });
      },

      updateChat: (chatId, patch) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId ? { ...c, ...patch, updatedAt: Date.now() } : c,
          ),
        }));
      },

      appendBatch: (chatId, batch, assets) => {
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c;
            const mergedAssets = [...c.sessionAssets];
            for (const asset of assets) {
              if (!mergedAssets.some((a) => a.id === asset.id)) mergedAssets.push(asset);
            }
            return {
              ...c,
              history: [...c.history, batch],
              sessionAssets: mergedAssets,
              title: c.history.length === 0 ? batch.prompt.slice(0, 48) : c.title,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      assignAssetToProject: (projectId, assetId) => {
        set((s) => {
          const current = s.projectAssetIds[projectId] ?? [];
          if (current.includes(assetId)) return s;
          return {
            projectAssetIds: {
              ...s.projectAssetIds,
              [projectId]: [...current, assetId],
            },
          };
        });
      },
    }),
    {
      name: "soundai-workspace-v1",
      version: 3,
      partialize: (state): PersistedWorkspaceState & { assetsPanelCollapsed: boolean } => ({
        projects: state.projects,
        chats: state.chats,
        activeProjectId: state.activeProjectId,
        activeChatId: state.activeChatId,
        assetsPanelCollapsed: state.assetsPanelCollapsed,
        projectAssetIds: state.projectAssetIds,
      }),
      migrate: (persisted) => repairPersistedState(persisted as Partial<PersistedWorkspaceState>),
      merge: (persisted, current) => ({
        ...current,
        ...repairPersistedState(persisted as Partial<PersistedWorkspaceState>),
      }),
    },
  ),
);

export function selectActiveChat(state: {
  chats: WorkspaceChat[];
  activeChatId: string;
}): WorkspaceChat | undefined {
  return state.chats.find((c) => c.id === state.activeChatId);
}

export function selectVisibleProjects(state: { projects: WorkspaceProject[] }): WorkspaceProject[] {
  return [...state.projects]
    .filter((p) => !p.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
}

export function selectProjectChats(
  state: { chats: WorkspaceChat[] },
  projectId: string,
): WorkspaceChat[] {
  return sortChats(
    state.chats.filter((c) => c.projectId === projectId && !c.archived),
  );
}

export function selectStandaloneChats(state: { chats: WorkspaceChat[] }): WorkspaceChat[] {
  return sortChats(state.chats.filter((c) => !c.projectId && !c.archived));
}

export function selectRecentChats(state: { chats: WorkspaceChat[] }, limit = 6): WorkspaceChat[] {
  return sortChats(state.chats.filter((c) => !c.archived)).slice(0, limit);
}
