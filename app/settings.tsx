import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotificationStore } from '@/store/notificationStore';
import {
  scheduleWorkoutReminders,
  scheduleWeeklyReport,
  cancelWorkoutReminders,
  cancelWeeklyReport,
  requestNotificationPermission,
  WorkoutReminderInfo,
} from '@/lib/notifications';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { supabase } from '@/lib/supabase';

// ⚠️ WAJIB diubah ke false sebelum build untuk Play Store!
// DEV_MODE = true menampilkan section "Developer Testing" di Pengaturan,
// dipakai untuk mengirim contoh notifikasi instan (5 detik) tanpa harus
// menunggu jadwal asli (jam tertentu / hari Minggu).
const DEV_MODE = false;

export default function SettingsScreen() {
  const {
    workoutReminderEnabled,
    weeklyReportEnabled,
    reminderHour,
    reminderMinute,
    setWorkoutReminder,
    setWeeklyReport,
    setReminderTime,
  } = useNotificationStore();

  const { workoutsByDate } = useWorkoutStore();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(reminderHour);
  const [tempMinute, setTempMinute] = useState(reminderMinute);

  const getAllWorkouts = () => {
    return Object.values(workoutsByDate).flat();
  };

  // Ambil hanya workout dalam 7 hari terakhir (termasuk hari ini).
  // Dipakai untuk "Laporan Mingguan" (toggle asli & tombol test) agar
  // datanya benar-benar mencerminkan aktivitas minggu ini, bukan akumulasi
  // sejak awal pakai app.
  const getWeeklyWorkouts = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // termasuk hari ini = total 7 hari
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const result: ReturnType<typeof getAllWorkouts> = [];
    Object.entries(workoutsByDate).forEach(([dateKey, workouts]) => {
      const date = new Date(dateKey);
      if (date >= sevenDaysAgo && date <= now) {
        result.push(...(workouts ?? []));
      }
    });
    return result;
  };

  const getWorkoutWeekdays = (): number[] => {
    const weekdaySet = new Set<number>();
    Object.keys(workoutsByDate).forEach(dateKey => {
      if (workoutsByDate[dateKey]?.length > 0) {
        const date = new Date(dateKey);
        const day = date.getDay(); // JS native: 0=Minggu, 1=Senin, ..., 6=Sabtu
        weekdaySet.add(day); // ✅ TIDAK ditambah 1 — konversi ke format Expo dilakukan di notifications.ts
      }
    });
    return Array.from(weekdaySet);
  };

  // Peta hari (0=Minggu..6=Sabtu) → workout yang dijadwalkan pada hari itu.
  // Karena program latihan berulang tiap minggu dengan pola yang sama,
  // dipakai tanggal TERBARU untuk masing-masing weekday sebagai representasi
  // workout yang relevan untuk notifikasi pengingat ke depannya.
  const getWorkoutsByWeekday = (): Record<number, WorkoutReminderInfo[]> => {
    const latestDateForWeekday: Record<number, string> = {};

    Object.keys(workoutsByDate).forEach(dateKey => {
      if (!workoutsByDate[dateKey]?.length) return;
      const day = new Date(dateKey).getDay();
      if (!latestDateForWeekday[day] || dateKey > latestDateForWeekday[day]) {
        latestDateForWeekday[day] = dateKey;
      }
    });

    const result: Record<number, WorkoutReminderInfo[]> = {};
    Object.entries(latestDateForWeekday).forEach(([dayStr, dateKey]) => {
      const day = Number(dayStr);
      const workouts = workoutsByDate[dateKey] ?? [];
      result[day] = workouts.map(w => ({
        workoutName: w.workoutName,
        workoutType: w.workoutType,
      }));
    });

    return result;
  };

  const handleWorkoutReminderToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Izin Diperlukan',
          'Aktifkan izin notifikasi di pengaturan perangkat untuk menerima pengingat latihan.',
        );
        return;
      }

      const weekdays = getWorkoutWeekdays();
      if (weekdays.length === 0) {
        Alert.alert(
          'Belum Ada Jadwal',
          'Buat program latihan terlebih dahulu agar pengingat dapat dijadwalkan.',
        );
        return;
      }

      const workoutsByWeekday = getWorkoutsByWeekday();
      const success = await scheduleWorkoutReminders(weekdays, reminderHour, reminderMinute, workoutsByWeekday);
      if (success) {
        setWorkoutReminder(true);
        Alert.alert(
          'Pengingat Aktif',
          `Kamu akan diingatkan setiap hari latihan pukul ${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}, lengkap dengan jenis latihannya.`,
        );
      }
    } else {
      await cancelWorkoutReminders();
      setWorkoutReminder(false);
    }
  };

  const handleWeeklyReportToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Izin Diperlukan', 'Aktifkan izin notifikasi di pengaturan perangkat.');
        return;
      }

      // ✅ FIX: pakai data 7 hari terakhir, bukan seluruh histori.
      const weekly = getWeeklyWorkouts();
      const completed = weekly.filter(w => w.status === 'completed');
      const totalSessions = completed.length;
      const totalDistance = completed.reduce(
        (sum, w) => sum + (w.trackingResult?.actualDistance ?? 0),
        0
      );

      const success = await scheduleWeeklyReport(
        totalSessions,
        Math.round(totalDistance * 10) / 10,
        0
      );
      if (success) {
        setWeeklyReport(true);
        Alert.alert(
          'Laporan Mingguan Aktif',
          'Kamu akan menerima ringkasan latihan setiap Minggu pukul 08:00.',
        );
      }
    } else {
      await cancelWeeklyReport();
      setWeeklyReport(false);
    }
  };

  const handleSaveTime = async () => {
    setReminderTime(tempHour, tempMinute);
    setShowTimePicker(false);

    if (workoutReminderEnabled) {
      const weekdays = getWorkoutWeekdays();
      const workoutsByWeekday = getWorkoutsByWeekday();
      await scheduleWorkoutReminders(weekdays, tempHour, tempMinute, workoutsByWeekday);
      Alert.alert('Waktu Diperbarui', `Pengingat diperbarui ke pukul ${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}.`);
    }
  };

  // ── DEV: Test notif ───────────────────────────────────────────────────────
  // Trigger TIME_INTERVAL (5 detik) supaya notif langsung muncul tanpa
  // menunggu jadwal asli. Identifier beda dari notif asli (diawali
  // 'dev-test-'), jadi tidak akan menimpa/mengganggu jadwal yang aktif.
  const handleTestWorkoutNotif = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) { Alert.alert('Izin notifikasi belum diberikan'); return; }

    await Notifications.scheduleNotificationAsync({
      identifier: 'dev-test-workout',
      content: {
        title: '🏃 Easy Run & Strength Training',
        body: 'Latihan hari ini: Easy Run & Strength. Ayo siapkan diri dan jaga konsistensi Anda!',
        sound: true,
        data: { type: 'workout_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
    Alert.alert('✅ Test dikirim', 'Notifikasi pengingat latihan akan muncul dalam 5 detik.\nKeluar dari app untuk melihatnya.');
  };

  const handleTestWeeklyReport = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) { Alert.alert('Izin notifikasi belum diberikan'); return; }

    // ✅ Pakai data mingguan yang sama dengan yang dipakai toggle asli,
    // supaya hasil test merepresentasikan apa yang akan benar-benar
    // diterima user, bukan angka all-time yang bisa menyesatkan.
    const weekly = getWeeklyWorkouts();
    const completed = weekly.filter(w => w.status === 'completed');
    const totalSessions = completed.length;
    const totalDistance = completed.reduce(
      (sum, w) => sum + (w.trackingResult?.actualDistance ?? 0), 0
    );

    await Notifications.scheduleNotificationAsync({
      identifier: 'dev-test-weekly-report',
      content: {
        title: '📊 Laporan Mingguan Anda Sudah Siap',
        body: `Minggu yang luar biasa! Anda telah menyelesaikan ${totalSessions} sesi latihan dengan total jarak ${Math.round(totalDistance * 10) / 10} km. Lihat progres lengkap sekarang.`,
        sound: true,
        data: { type: 'weekly_report' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
    Alert.alert(
      '✅ Test dikirim',
      `Data minggu ini: ${totalSessions} sesi, ${Math.round(totalDistance * 10) / 10} km.\nNotifikasi muncul dalam 5 detik. Keluar dari app untuk melihatnya.`
    );
  };

  // Lihat semua notifikasi yang sedang terjadwal di device — untuk
  // memastikan tidak ada duplikat/identifier nyasar setelah berkali-kali test.
  const handleDebugScheduled = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length === 0) {
      Alert.alert('Tidak Ada Notifikasi Terjadwal', 'Belum ada notifikasi yang dijadwalkan di device ini.');
      return;
    }
    const summary = scheduled
      .map(n => `• ${n.identifier}\n  "${n.content.title}"`)
      .join('\n\n');
    Alert.alert(`Terjadwal (${scheduled.length})`, summary);
  };

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── NOTIFIKASI ── */}
        <Text style={styles.sectionLabel}>Notifikasi</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Pengingat Latihan</Text>
            <Text style={styles.rowSub}>Notifikasi berisi jenis latihan yang akan dikerjakan hari itu</Text>
          </View>
          <Switch
            value={workoutReminderEnabled}
            onValueChange={handleWorkoutReminderToggle}
            trackColor={{ false: '#E0E0E0', true: '#2E7D32' }}
            thumbColor="#FFF"
          />
        </View>

        {workoutReminderEnabled && (
          <TouchableOpacity style={styles.row} onPress={() => {
            setTempHour(reminderHour);
            setTempMinute(reminderMinute);
            setShowTimePicker(true);
          }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Waktu Pengingat</Text>
              <Text style={styles.rowSub}>Setiap hari latihan pukul {formatTime(reminderHour, reminderMinute)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        )}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Laporan Mingguan</Text>
            <Text style={styles.rowSub}>Ringkasan aktivitas dan progress mingguan</Text>
          </View>
          <Switch
            value={weeklyReportEnabled}
            onValueChange={handleWeeklyReportToggle}
            trackColor={{ false: '#E0E0E0', true: '#2E7D32' }}
            thumbColor="#FFF"
          />
        </View>

        {/* ── DEV TESTING ── */}
        {DEV_MODE && (
          <>
            <Text style={styles.sectionLabel}>🛠 Developer Testing</Text>

            <TouchableOpacity style={styles.devBtn} onPress={handleTestWorkoutNotif}>
              <Ionicons name="fitness-outline" size={18} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={styles.devBtnTitle}>Test Notif Pengingat Latihan</Text>
                <Text style={styles.devBtnSub}>Muncul 5 detik setelah tap</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.devBtn} onPress={handleTestWeeklyReport}>
              <Ionicons name="bar-chart-outline" size={18} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={styles.devBtnTitle}>Test Laporan Mingguan</Text>
                <Text style={styles.devBtnSub}>Pakai data 7 hari terakhir — muncul 5 detik</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.devBtn} onPress={handleDebugScheduled}>
              <Ionicons name="list-outline" size={18} color="#666" />
              <View style={{ flex: 1 }}>
                <Text style={styles.devBtnTitle}>Lihat Notifikasi Terjadwal</Text>
                <Text style={styles.devBtnSub}>Cek identifier & isi notif aktif di device</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>
          </>
        )}

        {/* ── INFORMASI ── */}
        <Text style={styles.sectionLabel}>Informasi</Text>

        <TouchableOpacity style={styles.row} onPress={() => router.push('/about' as any)}>
          <Text style={styles.rowTitleBold}>Tentang BRECISE</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => router.push('/privacy' as any)}>
          <Text style={styles.rowTitleBold}>Kebijakan Privasi</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        {/* ── AKUN ── */}
        <Text style={styles.sectionLabel}>Akun</Text>

        <TouchableOpacity style={styles.row} onPress={() => {
          Alert.alert('Keluar', 'Apakah kamu yakin ingin keluar?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Keluar', style: 'destructive', onPress: () => supabase.auth.signOut() },
          ]);
        }}>
          <Text style={[styles.rowTitleBold, { color: '#E53935' }]}>Keluar</Text>
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Time Picker Modal ── */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Waktu Pengingat</Text>
            <Text style={styles.modalSub}>Pilih jam untuk pengingat latihan harian</Text>

            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <TouchableOpacity onPress={() => setTempHour(h => (h + 1) % 24)}>
                  <Ionicons name="chevron-up" size={24} color="#2E7D32" />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{String(tempHour).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setTempHour(h => (h - 1 + 24) % 24)}>
                  <Ionicons name="chevron-down" size={24} color="#2E7D32" />
                </TouchableOpacity>
              </View>

              <Text style={styles.timeSep}>:</Text>

              <View style={styles.timeCol}>
                <TouchableOpacity onPress={() => setTempMinute(m => (m + 5) % 60)}>
                  <Ionicons name="chevron-up" size={24} color="#2E7D32" />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{String(tempMinute).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setTempMinute(m => (m - 5 + 60) % 60)}>
                  <Ionicons name="chevron-down" size={24} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveTime}>
                <Text style={styles.modalBtnSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 0,
  },
  backBtn: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold' },

  content: { paddingHorizontal: 16, paddingTop: 8 },

  sectionLabel: {
    fontSize: 13, color: '#999',
    marginTop: 20, marginBottom: 8, fontFamily: 'Lexend-Regular',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold' },
  rowTitleBold: { fontSize: 15, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold' },
  rowSub: { fontSize: 12, color: '#999', marginTop: 2, fontFamily: 'Lexend-Regular' },

  devBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#F0FFF4',
    borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#CDE9D2',
  },
  devBtnTitle: { fontSize: 14, fontWeight: '700', color: '#1B2E1F', fontFamily: 'Lexend-Bold' },
  devBtnSub: { fontSize: 11, color: '#666', marginTop: 1, fontFamily: 'Lexend-Regular' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111', textAlign: 'center', fontFamily: 'Lexend-Black' },
  modalSub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 28, fontFamily: 'Lexend-Regular' },

  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 32 },
  timeCol: { alignItems: 'center', gap: 12 },
  timeValue: { fontSize: 48, fontWeight: '800', color: '#111', width: 80, textAlign: 'center' },
  timeSep: { fontSize: 40, fontWeight: '800', color: '#111', marginBottom: 8 },

  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F5F5F5', alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#666', fontFamily: 'Lexend-Bold' },
  modalBtnSave: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#6BFF8F', alignItems: 'center',
  },
  modalBtnSaveText: { fontSize: 15, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
});