import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Konfigurasi tampilan notifikasi saat app foreground ──────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // legacy, tetap ada
    shouldShowBanner: true,   // ← wajib di SDK 54+
    shouldShowList: true,     // ← wajib di SDK 54+
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Request permission ────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Info workout ringkas yang ditampilkan di body notifikasi
export type WorkoutReminderInfo = {
  workoutName: string;   // mis. "Easy Run Session" atau "Long Run 10km"
  workoutType?: string;  // mis. "Easy Run"
};

// Bangun body notifikasi berdasarkan workout yang dijadwalkan hari itu.
// Kalau ada lebih dari satu workout di hari yang sama, gabungkan namanya.
function buildReminderBody(workouts?: WorkoutReminderInfo[]): string {
  if (!workouts || workouts.length === 0) {
    return 'Waktunya lari! Jaga konsistensi Anda. Tubuh Anda sedang beradaptasi.';
  }
  const names = workouts.map(w => w.workoutType ?? w.workoutName).join(' & ');
  return `Latihan hari ini: ${names}. Ayo siapkan diri dan jaga konsistensi Anda!`;
}

// ── Schedule workout reminder ─────────────────────────────────────────────────
// Kirim notif di hari-hari tertentu (0=Minggu, 1=Sen, ..., 6=Sab)
// workoutsByWeekday: peta hari (0-6, format JS Date.getDay()) → daftar workout yang
// dijadwalkan pada hari tersebut, supaya isi notifikasi bisa menyebutkan latihan
// apa yang akan dikerjakan, bukan teks generik.
export async function scheduleWorkoutReminders(
  workoutDays: number[], // array hari dalam seminggu [1,3,5] = Senin, Rabu, Jumat (format JS: 0=Minggu)
  hour: number,
  minute: number,
  workoutsByWeekday?: Record<number, WorkoutReminderInfo[]>
) {
  // Batalkan semua reminder lama dulu
  await cancelWorkoutReminders();

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  for (const day of workoutDays) {
    const dayWorkouts = workoutsByWeekday?.[day];
    const body = buildReminderBody(dayWorkouts);
    const title = dayWorkouts && dayWorkouts.length > 0
      ? `🏃 ${dayWorkouts.map(w => w.workoutType ?? w.workoutName).join(' & ')}`
      : '🏃 Sesi Latihan Hari Ini';

    await Notifications.scheduleNotificationAsync({
      identifier: `workout-reminder-day-${day}`,
      content: {
        title,
        body,
        data: {
          type: 'workout_reminder',
          workouts: dayWorkouts ?? [],
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day === 0 ? 1 : day + 1, // Expo: 1=Minggu, 2=Senin, ..., 7=Sabtu
        hour,
        minute,
      },
    });
  }

  return true;
}

// ── Schedule weekly report ────────────────────────────────────────────────────
// Kirim setiap Minggu jam 08:00
export async function scheduleWeeklyReport(
  totalSessions: number,
  totalDistance: number,
  progressPercent: number
) {
  await cancelWeeklyReport();

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-report',
    content: {
      title: '📊 Laporan Mingguan Anda Sudah Siap',
      body: `Minggu yang luar biasa! Anda telah menyelesaikan ${totalSessions} sesi latihan dengan total jarak ${totalDistance} km. Lihat progres lengkap sekarang.`,
      data: { type: 'weekly_report' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = Minggu di Expo
      hour: 8,
      minute: 0,
    },
  });

  return true;
}

// ── Cancel helpers ────────────────────────────────────────────────────────────
export async function cancelWorkoutReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith('workout-reminder-day-')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function cancelWeeklyReport() {
  await Notifications.cancelScheduledNotificationAsync('weekly-report').catch(() => {});
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Helper: konversi hari workout dari weekly plan ────────────────────────────
// Input: array string ['monday', 'wednesday', 'friday']
// Output: array number [2, 4, 6] (format Expo: 1=Minggu, 2=Senin, ..., 7=Sabtu)
export function workoutDaysToWeekday(days: string[]): number[] {
  const map: Record<string, number> = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };
  return days.map(d => map[d.toLowerCase()]).filter(Boolean);
}