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

  setAssetsPanelCollapsed: (collapsed: boolean) => void;
  createProject: (name: string) => string;
  createChat: (projectId?: string, title?: string) => string;
  setActiveProject: (id: string) => void;
  setActiveChat: (id: string) => void;
  updateChat: (chatId: string, patch: Partial<WorkspaceChat>) => void;
  appendBatch: (chatId: string, batch: GenerationBatch, assets: AudioResult[]) => void;
  getActiveChat: () => WorkspaceChat | undefined;
  getProjectChats: (projectId: string) => WorkspaceChat[];
  getRecentChats: (limit?: number) => WorkspaceChat[];
}

const DEFAULT_PROJECT_ID = "project-default";

function seed(): Pick<WorkspaceState, "projects" | "chats" | "activeProjectId" | "activeChatId"> {
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
  };
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...seed(),
      assetsPanelCollapsed: false,

      setAssetsPanelCollapsed: (collapsed) => set({ assetsPanelCollapsed: collapsed }),

      createProject: (name) => {
        const id = `project-${Date.now()}`;
        set((s) => ({
          projects: [...s.projects, { id, name: name.trim() || "Untitled Project", createdAt: Date.now() }],
          activeProjectId: id,
        }));
        return id;
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

      setActiveProject: (id) => {
        const chats = get().getProjectChats(id);
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

      getActiveChat: () => get().chats.find((c) => c.id === get().activeChatId),

      getProjectChats: (projectId) =>
        get()
          .chats.filter((c) => c.projectId === projectId)
          .sort((a, b) => b.updatedAt - a.updatedAt),

      getRecentChats: (limit = 6) =>
        [...get().chats].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit),
    }),
    { name: "soundai-workspace-v1" },
  ),
);
