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
  setAssessment:        (data: AssessmentData) => Promise<void>;
  resetAssessment:      () => void;
  syncFromSupabase:     () => Promise<void>;
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      isCompleted: false,
      assessment:  null,

      // Simpan ke AsyncStorage (via persist) DAN ke Supabase
      setAssessment: async (data: AssessmentData) => {
        // 1. Update lokal dulu agar UI langsung responsif
        set({ assessment: data, isCompleted: true });

        // 2. Simpan/update ke Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Cek apakah sudah ada row untuk user ini
          const { data: existing } = await supabase
            .from('assessments')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (existing) {
            // Update row yang sudah ada
            const { error } = await supabase
              .from('assessments')
              .update({ data })
              .eq('user_id', user.id);

            if (error) console.error('[assessmentStore] update error:', error);
          } else {
            // Insert row baru
            const { error } = await supabase
              .from('assessments')
              .insert({ user_id: user.id, data });

            if (error) console.error('[assessmentStore] insert error:', error);
          }
        } catch (err) {
          console.error('[assessmentStore] setAssessment error:', err);
        }
      },

      // Reset lokal (tidak hapus dari Supabase — data historis tetap aman)
      resetAssessment: () => set({ assessment: null, isCompleted: false }),

      // Hydrate dari Supabase saat login / install ulang
      // Panggil ini setelah user berhasil login
      syncFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('assessments')
            .select('data')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error || !data) {
            // Belum ada assessment di Supabase → biarkan isCompleted: false
            return;
          }

          // Hydrate ke store lokal
          set({ assessment: data.data as AssessmentData, isCompleted: true });
        } catch (err) {
          console.error('[assessmentStore] syncFromSupabase error:', err);
        }
      },
    }),
    {
      name: 'brecise-assessment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);