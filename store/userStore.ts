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
  // ✅ FIX: simpan userId pemilik data ini, dipakai sebagai pengaman
  // supaya nama/data profil akun lama nggak pernah "nyangkut" ke akun baru,
  // sama seperti pola yang sudah dipakai di assessmentStore.
  userId: string | null;

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

  // Reset total state ke kondisi awal, dipanggil pas ganti/logout akun
  resetStore: () => void;
};

const initialState = {
  name: '',
  location: '',
  avatarUri: null as string | null,
  isPremium: false,
  birthDate: null as string | null,
  gender: null as string | null,
  weightKg: null as string | null,
  userId: null as string | null,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setName: (name) => set({ name }),
      setLocation: (location) => set({ location }),
      setAvatarUri: (uri) => set({ avatarUri: uri }),
      setPremium: (val) => set({ isPremium: val }),
      setBirthDate: (val) => set({ birthDate: val }),
      setGender: (val) => set({ gender: val }),
      setWeightKg: (val) => set({ weightKg: val }),

      // Fetch dari Supabase → update local store
      syncFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // ✅ FIX: pengaman lapis kedua — kalau data lokal ternyata
          // kepunyaan user LAIN (misalnya karena resetAllUserStores gagal
          // jalan tepat waktu saat switch akun), paksa reset dulu sebelum
          // memutuskan apa-apa lagi. Sama seperti pola di assessmentStore.
          const current = get();
          if (current.userId && current.userId !== user.id) {
            set({ ...initialState });
          }

          const { data, error } = await supabase
            .from('profiles')
            .select('name, location, avatar_url, is_premium, birth_date, gender, weight_kg')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('[userStore] syncFromSupabase fetch error (kept local state):', error);
            return;
          }

          // ✅ FIX: kalau row Supabase-nya gak ada / field kosong, JANGAN biarkan
          // field lama (dari akun sebelumnya) tetap nempel — set eksplisit ke default.
          set({
            name: data?.name ?? '',
            location: data?.location ?? '',
            avatarUri: data?.avatar_url ?? null,
            isPremium: data?.is_premium ?? false,
            birthDate: data?.birth_date ?? null,
            gender: data?.gender ?? null,
            weightKg: data?.weight_kg ? String(data.weight_kg) : null,
            userId: user.id,
          });
        } catch (err) {
          console.error('[userStore] syncFromSupabase error (kept local state):', err);
        }
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

      resetStore: () => set({ ...initialState }),
    }),
    {
      name: 'pacer-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);