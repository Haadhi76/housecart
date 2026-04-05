import { create } from "zustand";

interface ListState {
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
}

export const useListStore = create<ListState>((set) => ({
  activeListId: null,
  setActiveListId: (id) => set({ activeListId: id }),
}));
