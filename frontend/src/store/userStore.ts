import { create } from 'zustand';

interface UserStore {
  referrer: string | null;
  setReferrer: (address: string) => void;
  clearReferrer: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  referrer: null,
  setReferrer: (address) => set({ referrer: address }),
  clearReferrer: () => set({ referrer: null }),
}));