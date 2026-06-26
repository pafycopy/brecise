import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

type AssessmentStore = {
  isCompleted:     boolean;
  assessment:      AssessmentData | null;
  setAssessment:   (data: AssessmentData) => void;
  resetAssessment: () => void;
};

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      isCompleted:     false,
      assessment:      null,
      setAssessment:   (data) => set({ assessment: data, isCompleted: true }),
      resetAssessment: () => set({ assessment: null, isCompleted: false }),
    }),
    {
      name: 'pacer-assessment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);