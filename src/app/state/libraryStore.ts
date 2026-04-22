import { create } from "zustand";
import { library as seedLibrary, type LibraryAsset } from "../data/mock";

export interface LibraryFolder {
  id: string;
  name: string;
}

interface LibraryState {
  assets: LibraryAsset[];
  folders: LibraryFolder[];
  /** assetId → folderId ("root" for top-level) */
  assetFolder: Record<string, string>;

  addFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveAsset: (assetId: string, folderId: string) => void;
  assetsInFolder: (folderId: string) => LibraryAsset[];
}

const ROOT_ID = "root";

const initialAssetFolder: Record<string, string> = {};
for (const a of seedLibrary) initialAssetFolder[a.id] = ROOT_ID;

const initialFolders: LibraryFolder[] = [
  { id: ROOT_ID, name: "All files" },
];

export const useLibraryStore = create<LibraryState>((set, get) => ({
  assets: seedLibrary,
  folders: initialFolders,
  assetFolder: initialAssetFolder,

  addFolder: (name) => {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ folders: [...s.folders, { id, name: name.trim() || "New folder" }] }));
    return id;
  },

  renameFolder: (id, name) => {
    if (id === ROOT_ID) return;
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === id ? { ...f, name: name.trim() || f.name } : f,
      ),
    }));
  },

  deleteFolder: (id) => {
    if (id === ROOT_ID) return;
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      assetFolder: Object.fromEntries(
        Object.entries(s.assetFolder).map(([aid, fid]) => [
          aid,
          fid === id ? ROOT_ID : fid,
        ]),
      ),
    }));
  },

  moveAsset: (assetId, folderId) => {
    set((s) => ({ assetFolder: { ...s.assetFolder, [assetId]: folderId } }));
  },

  assetsInFolder: (folderId) => {
    const { assets, assetFolder } = get();
    return assets.filter((a) => (assetFolder[a.id] ?? ROOT_ID) === folderId);
  },
}));

export const LIBRARY_ROOT_ID = ROOT_ID;
