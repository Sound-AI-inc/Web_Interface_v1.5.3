import { create } from "zustand";
import { persist } from "zustand/middleware";
import { library as seedLibrary, type AudioResult, type LibraryAsset } from "../data/mock";

export interface LibraryFolder {
  id: string;
  name: string;
}

export type ViewMode = "grid" | "list";

interface LibraryState {
  assets: LibraryAsset[];
  folders: LibraryFolder[];
  assetFolder: Record<string, string>;
  assetProject: Record<string, string | null>;
  favoriteIds: string[];
  viewMode: ViewMode;

  addFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveAsset: (assetId: string, folderId: string) => void;
  assignAssetProject: (assetId: string, projectId: string | null) => void;
  renameAsset: (assetId: string, title: string) => void;
  deleteAsset: (assetId: string) => void;
  toggleFavorite: (assetId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  assetsInFolder: (folderId: string) => LibraryAsset[];
  addFromResult: (item: AudioResult) => void;
}

const ROOT_ID = "root";

const initialAssetFolder: Record<string, string> = {};
for (const a of seedLibrary) initialAssetFolder[a.id] = ROOT_ID;

const initialFolders: LibraryFolder[] = [
  { id: ROOT_ID, name: "All files" },
];

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      assets: seedLibrary,
      folders: initialFolders,
      assetFolder: initialAssetFolder,
      assetProject: {},
      favoriteIds: [],
      viewMode: "grid",

      addFolder: (name) => {
        const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ folders: [...s.folders, { id, name: name.trim() || "New folder" }] }));
        return id;
      },

      renameFolder: (id, name) => {
        if (id === ROOT_ID) return;
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)),
        }));
      },

      deleteFolder: (id) => {
        if (id === ROOT_ID) return;
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          assetFolder: Object.fromEntries(
            Object.entries(s.assetFolder).map(([aid, fid]) => [aid, fid === id ? ROOT_ID : fid]),
          ),
        }));
      },

      moveAsset: (assetId, folderId) => {
        set((s) => ({ assetFolder: { ...s.assetFolder, [assetId]: folderId } }));
      },

      assignAssetProject: (assetId, projectId) => {
        set((s) => ({ assetProject: { ...s.assetProject, [assetId]: projectId } }));
      },

      renameAsset: (assetId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          assets: s.assets.map((a) => (a.id === assetId ? { ...a, title: trimmed } : a)),
        }));
      },

      deleteAsset: (assetId) => {
        set((s) => {
          const { [assetId]: _folder, ...assetFolder } = s.assetFolder;
          const { [assetId]: _project, ...assetProject } = s.assetProject;
          return {
            assets: s.assets.filter((a) => a.id !== assetId),
            assetFolder,
            assetProject,
            favoriteIds: s.favoriteIds.filter((id) => id !== assetId),
          };
        });
      },

      toggleFavorite: (assetId) => {
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(assetId)
            ? s.favoriteIds.filter((id) => id !== assetId)
            : [...s.favoriteIds, assetId],
        }));
      },

      setViewMode: (viewMode) => set({ viewMode }),

      assetsInFolder: (folderId) => {
        const { assets, assetFolder } = get();
        return assets.filter((a) => (assetFolder[a.id] ?? ROOT_ID) === folderId);
      },

      addFromResult: (item) => {
        set((s) => {
          if (s.assets.some((a) => a.id === item.id)) return s;
          const asset: LibraryAsset = {
            id: item.id,
            title: item.title,
            kind: item.kind,
            format: item.format,
            durationSeconds: item.durationSeconds,
            tags: item.tags ?? [],
            createdAt: new Date().toISOString().slice(0, 10),
            audioSeed: item.audioSeed,
            notes: item.notes,
            preset: item.preset,
            waveformHue: item.waveformHue,
            metadata: item.metadata,
          };
          return {
            assets: [asset, ...s.assets],
            assetFolder: { ...s.assetFolder, [item.id]: ROOT_ID },
          };
        });
      },
    }),
    { name: "soundai-library-v1" },
  ),
);

export const LIBRARY_ROOT_ID = ROOT_ID;
