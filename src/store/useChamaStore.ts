import { create } from 'zustand';
import type { Chama } from '@/types';

interface ChamaStore {
  chama: Chama | null;
  setChama: (chama: Chama | null) => void;
  updateChama: (updates: Partial<Chama>) => void;
}

export const useChamaStore = create<ChamaStore>((set) => ({
  chama: null,
  setChama: (chama) => set({ chama }),
  updateChama: (updates) =>
    set((state) => ({
      chama: state.chama ? { ...state.chama, ...updates } : null,
    })),
}));
