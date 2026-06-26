import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';

type BaseResult = {
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  completedAt: number;
  [key: string]: any; // untuk field tambahan (repResults, phaseResults, dll)
};

type Options = {
  /**
   * Kalau true: setelah save, TIDAK langsung router.back().
   * Gunakan ini kalau tracker punya "done screen" sendiri (contoh: IntervalTracker).
   * Kalau false (default): langsung router.back() setelah save.
   */
  hasOwnDoneScreen?: boolean;

  /** Callback opsional setelah save selesai */
  onAfterSave?: () => void;
};

export function useFinishWorkout(
  dateKey: string,
  uid: string,
  timers: React.MutableRefObject<any>[],
  subscription: React.MutableRefObject<any>,
  options: Options = {},
) {
  const router = useRouter();
  const { saveTrackingResult } = useWorkoutStore();
  const { hasOwnDoneScreen = false, onAfterSave } = options;

  const finish = (result: BaseResult) => {
    // 1. Bersihkan semua timer
    timers.forEach((t) => clearInterval(t.current));

    // 2. Hentikan GPS subscription
    subscription.current?.remove();
    subscription.current = null;

    // 3. Simpan ke store — dibungkus setTimeout agar tidak
    //    bentrok dengan render cycle komponen lain (WeekCalendar, dll)
    setTimeout(() => {
      saveTrackingResult(dateKey, uid, result);
      onAfterSave?.();
    }, 0);

    // 4. Navigasi balik — hanya kalau tidak punya done screen sendiri
    if (!hasOwnDoneScreen) {
      router.back();
    }
  };

  return { finish };
}