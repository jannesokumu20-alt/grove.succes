import { create } from 'zustand';
import type { Chama } from '@/types';
import { isDevMode, MOCK_DEV_MEMBER } from '@/lib/devMode';

// Mock chama for development
const MOCK_DEV_CHAMA: Chama = {
  id: MOCK_DEV_MEMBER.chama_id,
  user_id: MOCK_DEV_MEMBER.user_id,
  name: 'Developer Chama',
  invite_code: 'DEVMODE',
  contribution_amount: 0,
  meeting_day: 'Monday',
  savings_goal: 10000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface ChamaStore {
  chama: Chama | null;
  setChama: (chama: Chama | null) => void;
  updateChama: (updates: Partial<Chama>) => void;
}

export const useChamaStore = create<ChamaStore>((set) => ({
  chama: isDevMode() ? MOCK_DEV_CHAMA : null,
  setChama: (chama) => set({ chama }),
  updateChama: (updates) =>
    set((state) => ({
      chama: state.chama ? { ...state.chama, ...updates } : null,
    })),
}));
