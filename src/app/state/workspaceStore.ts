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
  projectId: string;
  title: string;
  history: GenerationBatch[];
  sessionAssets: AudioResult[];
  favoriteIds: string[];
  savedIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  createdAt: number;
}

interface WorkspaceState {
  projects: WorkspaceProject[];
  chats: WorkspaceChat[];
  activeProjectId: string;
  activeChatId: string;
  assetsPanelCollapsed: boolean;
  /** projectId → asset ids linked from generation results */
  projectAssetIds: Record<string, string[]>;

  setAssetsPanelCollapsed: (collapsed: boolean) => void;
  createProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  createChat: (projectId?: string, title?: string) => string;
  startNewSession: (projectId?: string) => string;
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
        projectId: DEFAULT_PROJECT_ID,
        title: "New session",
        history: [],
        sessionAssets: [],
        favoriteIds: [],
        savedIds: [],
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

function normalizeChat(chat: Partial<WorkspaceChat>, fallbackProjectId: string): WorkspaceChat {
  const now = Date.now();
  return {
    id: typeof chat.id === "string" ? chat.id : `chat-${now}`,
    projectId: typeof chat.projectId === "string" ? chat.projectId : fallbackProjectId,
    title: typeof chat.title === "string" ? chat.title : "New chat",
    history: Array.isArray(chat.history) ? chat.history : [],
    sessionAssets: Array.isArray(chat.sessionAssets) ? chat.sessionAssets : [],
    favoriteIds: Array.isArray(chat.favoriteIds) ? chat.favoriteIds : [],
    savedIds: Array.isArray(chat.savedIds) ? chat.savedIds : [],
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
    ? state.chats.map((c) =>
        normalizeChat(c as Partial<WorkspaceChat>, fallbackProjectId),
      )
    : seed.chats;

  chats = chats.filter((c) => projectIds.has(c.projectId));
  if (chats.length === 0) {
    chats = seed.chats.map((c) => ({ ...c, projectId: fallbackProjectId }));
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
          if (s.projects.length <= 1) return s;
          const projects = s.projects.filter((p) => p.id !== id);
          const chats = s.chats.filter((c) => c.projectId !== id);
          const { [id]: _removed, ...projectAssetIds } = s.projectAssetIds;
          void _removed;
          const activeProjectId =
            s.activeProjectId === id ? projects[0].id : s.activeProjectId;
          const projectChats = chats
            .filter((c) => c.projectId === activeProjectId)
            .sort((a, b) => b.updatedAt - a.updatedAt);
          const activeChatId = chats.some((c) => c.id === s.activeChatId)
            ? s.activeChatId
            : projectChats[0]?.id ?? chats[0]?.id ?? s.activeChatId;
          return {
            projects,
            chats,
            activeProjectId,
            activeChatId,
            projectAssetIds,
          };
        });
      },

      createChat: (projectId, title) => {
        const pid = projectId ?? get().activeProjectId;
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
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          chats: [...s.chats, chat],
          activeChatId: id,
          activeProjectId: pid,
        }));
        return id;
      },

      startNewSession: (projectId) => {
        return get().createChat(projectId);
      },

      setActiveProject: (id) => {
        const chats = get()
          .chats.filter((c) => c.projectId === id)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        set({
          activeProjectId: id,
          activeChatId: chats[0]?.id ?? get().activeChatId,
        });
      },

      setActiveChat: (id) => {
        const chat = get().chats.find((c) => c.id === id);
        if (!chat) return;
        set({ activeChatId: id, activeProjectId: chat.projectId });
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
      version: 2,
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

/** Stable selectors — never call store methods inside useWorkspaceStore(selector). */
export function selectActiveChat(state: {
  chats: WorkspaceChat[];
  activeChatId: string;
}): WorkspaceChat | undefined {
  return state.chats.find((c) => c.id === state.activeChatId);
}

export function selectProjectChats(
  state: { chats: WorkspaceChat[] },
  projectId: string,
): WorkspaceChat[] {
  return state.chats
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function selectRecentChats(state: { chats: WorkspaceChat[] }, limit = 6): WorkspaceChat[] {
  return [...state.chats].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}
