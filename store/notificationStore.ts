import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationStore {
  workoutReminderEnabled: boolean;
  weeklyReportEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  setWorkoutReminder: (enabled: boolean) => void;
  setWeeklyReport: (enabled: boolean) => void;
  setReminderTime: (hour: number, minute: number) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      workoutReminderEnabled: false,
      weeklyReportEnabled: false,
      reminderHour: 7,
      reminderMinute: 0,
      setWorkoutReminder: (enabled) => set({ workoutReminderEnabled: enabled }),
      setWeeklyReport: (enabled) => set({ weeklyReportEnabled: enabled }),
      setReminderTime: (hour, minute) => set({ reminderHour: hour, reminderMinute: minute }),
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);