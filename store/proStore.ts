import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProStore {
  isPro: boolean;
  setIsPro: (value: boolean) => void;
}

export const useProStore = create<ProStore>()(
  persist(
    (set) => ({
      isPro: false,
      setIsPro: (value) => set({ isPro: value }),
    }),
    {
      name: 'brecise-pro-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);