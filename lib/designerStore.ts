import { create } from "zustand";

export type RelBox = { x: number; y: number; width: number; height: number; angle?: number };

export type QueueItem = {
  id: string;
  productId: string;
  zoneId: string;
  printifyImageId: string;
  cloudinaryUrl: string;
  position: RelBox;
  previewDataUrl?: string;
  title?: string;
  price?: string;
};

type DesignerState = {
  cloudinaryUrl?: string;
  printifyImageId?: string;
  box?: RelBox;
  queue: QueueItem[];
  setCloudinaryUrl: (url?: string) => void;
  setPrintifyId: (id?: string) => void;
  setBox: (b?: RelBox) => void;
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, patch: Partial<QueueItem>) => void;
  clearQueue: () => void;
};

export const useDesignerStore = create<DesignerState>((set) => ({
  cloudinaryUrl: undefined,
  printifyImageId: undefined,
  box: undefined,
  queue: [],
  setCloudinaryUrl: (cloudinaryUrl) => set({ cloudinaryUrl }),
  setPrintifyId: (printifyImageId) => set({ printifyImageId }),
  setBox: (box) => set({ box }),
  addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
  removeFromQueue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
  updateQueueItem: (id, patch) =>
    set((s) => ({ queue: s.queue.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
  clearQueue: () => set({ queue: [] }),
}));
