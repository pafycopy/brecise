import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CoachMarkStore = {
  seenTours: Record<string, boolean>;
  hasSeenTour: (tourId: string) => boolean;
  markTourSeen: (tourId: string) => void;
  // dipakai kalau nanti mau tambah tombol "Lihat tutorial lagi" di Settings
  resetTour: (tourId: string) => void;
  // dipanggil pas logout, biar akun lain/baru tetap dapat tutorial dari awal
  resetStore: () => void;
};

export const useCoachMarkStore = create<CoachMarkStore>()(
  persist(
    (set, get) => ({
      seenTours: {},

      hasSeenTour: (tourId) => !!get().seenTours[tourId],

      markTourSeen: (tourId) =>
        set((state) => ({ seenTours: { ...state.seenTours, [tourId]: true } })),

      resetTour: (tourId) =>
        set((state) => {
          const next = { ...state.seenTours };
          delete next[tourId];
          return { seenTours: next };
        }),

      resetStore: () => set({ seenTours: {} }),
    }),
    {
      name: 'brecise-coachmark-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);