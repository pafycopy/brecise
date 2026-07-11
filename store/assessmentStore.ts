import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
export type RunningLevel   = 'beginner' | 'intermediate' | 'advanced';
export type RunningGoal    = 'weight_loss' | 'stamina' | 'target_5k' | 'target_10k';
export type FurthestRun    = 'less_1k' | '1_3k' | 'more_3k' | 'unknown';
export type TrainingTime   = 'pagi' | 'siang' | 'malam';
export type ActivityLevel  = 'sedentary' | 'active' | 'very_active';
export type InjuryHistory  = 'none' | 'knee' | 'ankle' | 'shin_splints' | 'other';

export type AssessmentData = {
  level:         RunningLevel;
  goal:          RunningGoal;
  furthestRun:   FurthestRun;
  daysPerWeek:   number;
  preferredTime: TrainingTime;
  activityLevel: ActivityLevel;
  injury:        InjuryHistory;
};

// ─── Store Type ───────────────────────────────────────────────────────────────
type AssessmentStore = {
  isCompleted:          boolean;
  assessment:           AssessmentData | null;
  // simpan userId pemilik data ini, dipakai sebagai pengaman
  // tambahan supaya data akun lama nggak pernah "nyangkut" ke akun baru,
  // independen dari tracking lastUserId di _layout.tsx.
  userId:               string | null;
  // ✅ FIX: penanda apakah syncFromSupabase untuk SESI SEKARANG sudah selesai
  // (sukses ataupun gagal). Dipakai _layout.tsx supaya popup assessment
  // TIDAK muncul berdasarkan timer sembarangan — harus nunggu hasil fetch
  // yang sebenarnya dulu, biar gak "flash" muncul padahal akun itu
  // sebenarnya sudah punya program/assessment.
  hasSynced:            boolean;
  setAssessment:        (data: AssessmentData) => Promise<void>;
  resetAssessment:      () => Promise<void>;
  syncFromSupabase:     () => Promise<void>;
  resetStore:           () => void; // dipanggil pas ganti/logout akun
};

const initialState = {
  isCompleted: false,
  assessment:  null as AssessmentData | null,
  userId:      null as string | null,
  hasSynced:   false,
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Simpan ke AsyncStorage (via persist) DAN ke Supabase
      setAssessment: async (data: AssessmentData) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // 1. Update lokal dulu agar UI langsung responsif
          set({ assessment: data, isCompleted: true, userId: user.id });

          // 2. Simpan/update ke Supabase
          const { data: existing } = await supabase
            .from('assessments')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (existing) {
            const { error } = await supabase
              .from('assessments')
              .update({ data })
              .eq('user_id', user.id);

            if (error) console.error('[assessmentStore] update error:', error);
          } else {
            const { error } = await supabase
              .from('assessments')
              .insert({ user_id: user.id, data });

            if (error) console.error('[assessmentStore] insert error:', error);
          }
        } catch (err) {
          console.error('[assessmentStore] setAssessment error:', err);
        }
      },

      // Reset lokal DAN hapus dari Supabase — program benar-benar dihapus,
      // bukan cuma disembunyikan di device ini. Ini mencegah data lama
      // "nyangkut" lagi setelah logout/login (di-fetch ulang oleh
      // syncFromSupabase dan bikin card "Program Aktif" muncul lagi).
      resetAssessment: async () => {
        // 1. Update lokal dulu agar UI langsung responsif
        set({ assessment: null, isCompleted: false });

        // 2. Hapus dari Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('assessments')
            .delete()
            .eq('user_id', user.id);

          if (error) console.error('[assessmentStore] resetAssessment delete error:', error);
        } catch (err) {
          console.error('[assessmentStore] resetAssessment error:', err);
        }
      },

      // Hydrate dari Supabase saat login / install ulang / token refresh
      syncFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ hasSynced: true });
            return;
          }

          // pengaman lapis kedua — kalau data lokal ternyata
          // kepunyaan user LAIN (misalnya karena resetAllUserStores gagal
          // jalan tepat waktu saat switch akun), paksa reset dulu sebelum
          // memutuskan apa-apa lagi.
          const current = get();
          if (current.userId && current.userId !== user.id) {
            set({ ...initialState });
          }

          const { data, error } = await supabase
            .from('assessments')
            .select('data')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // PGRST116 = "no rows found" → ini satu-satunya kondisi
          // yang berarti user BENAR-BENAR belum punya assessment.
          // Untuk error lain (network timeout, koneksi putus, dll),
          // JANGAN timpa isCompleted yang sudah benar — biarkan state
          // lokal (hasil persist) tetap dipakai.
          if (error) {
            if (error.code === 'PGRST116') {
              set({ assessment: null, isCompleted: false, userId: user.id, hasSynced: true });
            } else {
              console.error('[assessmentStore] syncFromSupabase fetch error (kept local state):', error);
              set({ hasSynced: true });
            }
            return;
          }

          if (!data) {
            set({ assessment: null, isCompleted: false, userId: user.id, hasSynced: true });
            return;
          }

          // Hydrate ke store lokal
          set({ assessment: data.data as AssessmentData, isCompleted: true, userId: user.id, hasSynced: true });
        } catch (err) {
          // Error jaringan/exception lain → JANGAN reset, cukup log.
          console.error('[assessmentStore] syncFromSupabase error (kept local state):', err);
          // ✅ FIX: tetap tandai hasSynced = true walau error, supaya
          // _layout.tsx gak nunggu selamanya dan popup assessment tetap
          // bisa dievaluasi (pakai state lokal yang ada) bukan macet nunggu.
          set({ hasSynced: true });
        }
      },

      // Reset total state ke kondisi awal, dipanggil pas ganti/logout akun
      resetStore: () => set({ ...initialState }),
    }),
    {
      name: 'brecise-assessment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);