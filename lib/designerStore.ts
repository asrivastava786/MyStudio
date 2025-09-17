
//If your dashboard page renders both Designer and Create tabs under the same parent, you can absolutely skip Zustand and just lift state to that parent. 
// If you want, I’ll refactor your current page to the “lift state up” pattern so you can drop Zustand entirely.

// lib/designerStore.ts
import { create } from "zustand";

export type RelBox = { x: number; y: number; width: number; height: number; angle?: number };

type DesignerState = {
  cloudinaryUrl?: string;
  printifyImageId?: string;
  box?: RelBox;
  setCloudinaryUrl: (url?: string) => void;
  setPrintifyId: (id?: string) => void;
  setBox: (b?: RelBox) => void;
};

export const useDesignerStore = create<DesignerState>((set) => ({
  cloudinaryUrl: undefined,
  printifyImageId: undefined,
  box: undefined,
  setCloudinaryUrl: (cloudinaryUrl) => set({ cloudinaryUrl }),
  setPrintifyId: (printifyImageId) => set({ printifyImageId }),
  setBox: (box) => set({ box }),
}));

