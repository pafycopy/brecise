import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

type UserStore = {
  name: string;
  location: string;
  avatarUri: string | null;
  isPremium: boolean;
  birthDate: string | null;   // format: "YYYY-MM-DD"
  gender: string | null;      // 'Pria' | 'Wanita'
  weightKg: string | null;    // string untuk input

  setName: (name: string) => void;
  setLocation: (location: string) => void;
  setAvatarUri: (uri: string) => void;
  setPremium: (val: boolean) => void;
  setBirthDate: (val: string) => void;
  setGender: (val: string) => void;
  setWeightKg: (val: string) => void;

  syncFromSupabase: () => Promise<void>;
  saveToSupabase: (data: Partial<{
    name: string;
    location: string;
    avatarUri: string | null;
    birthDate: string | null;
    gender: string | null;
    weightKg: string | null;
  }>) => Promise<void>;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      name: '',
      location: '',
      avatarUri: null,
      isPremium: false,
      birthDate: null,
      gender: null,
      weightKg: null,

      setName: (name) => set({ name }),
      setLocation: (location) => set({ location }),
      setAvatarUri: (uri) => set({ avatarUri: uri }),
      setPremium: (val) => set({ isPremium: val }),
      setBirthDate: (val) => set({ birthDate: val }),
      setGender: (val) => set({ gender: val }),
      setWeightKg: (val) => set({ weightKg: val }),

      // Fetch dari Supabase → update local store
      syncFromSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('name, location, avatar_url, is_premium, birth_date, gender, weight_kg')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !data) return;

        set({
          name: data.name ?? '',
          location: data.location ?? '',
          avatarUri: data.avatar_url ?? null,
          isPremium: data.is_premium ?? false,
          birthDate: data.birth_date ?? null,
          gender: data.gender ?? null,
          weightKg: data.weight_kg ? String(data.weight_kg) : null,
        });
      },

      // Simpan ke Supabase
      saveToSupabase: async (data) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            location: data.location,
            avatar_url: data.avatarUri,
            birth_date: data.birthDate,
            gender: data.gender,
            weight_kg: data.weightKg ? parseFloat(data.weightKg) : null,
          })
          .eq('id', user.id);

        if (error) console.error('Error saving profile:', error);
      },
    }),
    {
      name: 'pacer-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);