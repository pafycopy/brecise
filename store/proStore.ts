import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProStore {
  isPro: boolean;
  setIsPro: (value: boolean) => void;
  resetStore: () => void; // ✅ BARU
}

export const useProStore = create<ProStore>()(
  persist(
    (set) => ({
      isPro: false,
      setIsPro: (value) => set({ isPro: value }),
      resetStore: () => set({ isPro: false }), // ✅ BARU
    }),
    {
      name: 'brecise-pro-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);