import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import ProfileTopBar from '@/components/ui/profile/profiletopbar';
import ProfileHeader from '@/components/ui/profile/profilheader';
import PremiumCard from '@/components/ui/profile/premiumcard';
import StatsCard from '@/components/ui/profile/statscard';
import ActivityCalendar from '@/components/ui/profile/activitycalendar';
import ActivityHistoryCard from '@/components/ui/profile/activityhistorycard';

import AssessmentFlow from '@/components/ui/assessment/assessmentflow';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { supabase } from '@/lib/supabase';

// ✅ coach mark / spotlight tutorial
import { useCoachMark, CoachMarkStep } from '@/components/ui/coachmark/CoachMarkProvider';
import CoachMarkTarget from '@/components/ui/coachmark/CoachMarkTarget';
import { useCoachMarkScrollView } from '@/components/ui/coachmark/useCoachMarkScrollView';
import { useCoachMarkStore } from '@/store/coachMarkStore';

// ─────────────────────────────────────────────
// LABELS
// ─────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const GOAL_LABEL: Record<string, string> = {
  weight_loss: 'Turunkan Berat Badan',
  stamina: 'Tingkatkan Stamina',
  target_5k: 'Target 5K',
  target_10k: 'Target 10K',
};

// ─────────────────────────────────────────────
// COACH MARK TOUR STEPS
// ─────────────────────────────────────────────
// ✅ Step "profile-program" sengaja dipakai buat DUA kondisi berbeda
// (programCard kalau assessment sudah selesai, assessmentCTA kalau
// belum) — keduanya dibungkus dengan id yang SAMA, jadi tour-nya tetap
// jalan konsisten gak peduli user udah isi assessment atau belum.
//
// ⚠️ Angka padding di bawah ini masih PERKIRAAN AWAL — sesuaikan lagi
// setelah lihat hasil aslinya di device (paddingTop/Bottom/Side buat
// ukuran kotak, offsetY/offsetX buat geser posisi kotak, kalau tooltip
// numpuk pakai forceTooltipPosition + tooltipOffsetY).
const profileTourSteps: CoachMarkStep[] = [
  {
    id: 'profile-topbar',
    title: 'Pengaturan',
    description: 'Tap ikon di pojok kanan atas buat akses pengaturan akun kamu.',
    // topbar biasanya cuma sebaris tipis (judul + ikon settings),
    // dikecilin biar kotak gak kelebaran dari kontennya.
    paddingTop: 2,
    paddingBottom: 4,
     offsetY: 30,
  },
  {
    id: 'profile-header',
    title: 'Profil Kamu',
    description: 'Info dasar akun kamu ditampilkan di sini.',
    paddingTop: 0,
    paddingBottom: 0,
     offsetY: 40,
  },
  {
    id: 'profile-premium',
    title: 'Brecise Pro',
    description: 'Upgrade ke Pro untuk menghilangkan iklan.',
    paddingTop: 2,
    paddingBottom: 4,
     offsetY: 30,
  },
  {
    id: 'profile-stats',
    title: 'Statistik Kamu',
    description: 'Data lari kamu secara keseluruhan.',
    paddingTop: 2,
    paddingBottom: 4,
     offsetY: 30,
  },
  {
    id: 'profile-program',
    title: 'Program Latihan',
    description: 'Di sini kamu bisa buat atau kelola program lari otomatis sesuai level dan tujuan kamu.',
    paddingTop: 2,
    paddingBottom: 4,
     offsetY: 40,
  },
  {
    id: 'profile-activity-calendar',
    title: 'Kalender Aktivitas',
    description: 'Lihat rekap hari-hari kamu aktif berlatih dalam bentuk kalender.',
    paddingTop: 2,
    paddingBottom: 4,
     offsetY: 30,
  },
  {
    id: 'profile-activity-history',
    title: 'Riwayat Aktivitas',
    description: 'Semua sesi latihan yang udah kamu selesaikan tercatat di sini.',
    paddingTop: 2,
    paddingBottom: 4,
     offsetY: 30,
     forceTooltipPosition: 'above',
     tooltipOffsetY: -80,
  },
];

// ─────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────

const ProfileScreen = () => {
  const [showAssessment, setShowAssessment] = useState(false);

  const {
    isCompleted,
    assessment,
    resetAssessment,
  } = useAssessmentStore();
  const { clearGeneratedWorkouts } = useWorkoutStore();

  // ✅ coach mark setup
  const { startTour } = useCoachMark();
  const hasSeenTour  = useCoachMarkStore((s) => s.hasSeenTour);
  const markTourSeen = useCoachMarkStore((s) => s.markTourSeen);
  const { scrollRef, onScroll } = useCoachMarkScrollView('profile');

  useEffect(() => {
    if (hasSeenTour('profile')) return;
    const timer = setTimeout(() => {
      startTour('profile', profileTourSteps, {
        scrollViewId: 'profile',
        onFinish: () => markTourSeen('profile'),
      });
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetProgram = () => {
    Alert.alert(
      'Hapus Program',
      'Apakah Anda yakin ingin menghapus program latihan otomatis ini? Riwayat lari manual Anda tetap aman.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearGeneratedWorkouts();
              await resetAssessment();
            } catch (err) {
              console.error("Gagal menghapus program:", err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Top Bar: "Anda" + Settings */}
        <CoachMarkTarget id="profile-topbar">
          <ProfileTopBar />
        </CoachMarkTarget>

        {/* Profile */}
        <CoachMarkTarget id="profile-header">
          <ProfileHeader />
        </CoachMarkTarget>

        {/* Premium */}
        <CoachMarkTarget id="profile-premium">
          <PremiumCard />
        </CoachMarkTarget>

        {/* Stats */}
        <CoachMarkTarget id="profile-stats">
          <StatsCard />
        </CoachMarkTarget>

        {/* ───────────────────────── */}
        {/* Assessment Section */}
        {/* ───────────────────────── */}

        <CoachMarkTarget id="profile-program">
          {isCompleted && assessment ? (
            <View style={styles.programCard}>

              <View style={styles.programHeader}>
                <View style={styles.programIconBox}>
                  <Ionicons
                    name="calendar"
                    size={18}
                    color="#2E7D32"
                  />
                </View>

                <View style={{ flex: 1,}}>
                  <Text style={styles.programTitle}>
                    Program Aktif
                  </Text>

                  <Text style={styles.programSub} >
                    {LEVEL_LABEL[assessment.level]} ·{' '}
                    {GOAL_LABEL[assessment.goal]}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, }}>
                  <TouchableOpacity
                    style={styles.programDeleteBtn}
                    onPress={handleResetProgram}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.programEditBtn}
                    onPress={() => setShowAssessment(true)}
                  >
                    <Text style={styles.programEditText}>
                      Ubah
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.programStats} >

                <View style={styles.programStat}>
                  <Text style={styles.programStatValue}>
                    {assessment.daysPerWeek}x
                  </Text>

                  <Text style={styles.programStatLabel}>
                    Per Minggu
                  </Text>
                </View>

                <View style={styles.programDivider} />

                <View style={styles.programStat}>
                  <Text style={styles.programStatValue}>
                    4
                  </Text>

                  <Text style={styles.programStatLabel}>
                    Minggu
                  </Text>
                </View>

                <View style={styles.programDivider} />

                <View style={styles.programStat}>
                  <Text style={styles.programStatValue}>
                    {assessment.preferredTime.charAt(0).toUpperCase() +
                      assessment.preferredTime.slice(1)}
                  </Text>

                  <Text style={styles.programStatLabel}>
                    Waktu
                  </Text>
                </View>

              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.assessmentCTA}
              activeOpacity={0.85}
              onPress={() => setShowAssessment(true)}
            >

              <View style={styles.assessmentLeft}>
                <View style={styles.assessmentIcon}>
                  <Ionicons
                    name="fitness"
                    size={22}
                    color="#2E7D32"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.assessmentTitle}>
                    Buat Program Lari
                  </Text>

                  <Text style={styles.assessmentSub}>
                    Isi assessment untuk program otomatis
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#2E7D32"
              />
            </TouchableOpacity>
          )}
        </CoachMarkTarget>

        {/* Activity Calendar */}
        <CoachMarkTarget id="profile-activity-calendar">
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Aktivitas Kalender
              </Text>
            </View>

            <ActivityCalendar />
          </View>
        </CoachMarkTarget>

        {/* Activity History */}
        <CoachMarkTarget id="profile-activity-history">
          <ActivityHistoryCard />
        </CoachMarkTarget>

        <View style={{ height: 32 }} />

      </ScrollView>

      {/* Assessment Modal */}
      <AssessmentFlow
        visible={showAssessment}
        onClose={() => setShowAssessment(false)}
        onDone={() => setShowAssessment(false)}
      />

    </SafeAreaView>
  );
};

export default ProfileScreen;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 16,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },

  sectionTitle: {
    fontSize: 15, fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // ─────────────────────────
  // Program Card
  // ─────────────────────────

  programCard: {
    marginHorizontal: 16,
    marginTop: 12,

    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,

    borderWidth: 1,
    borderColor: '#DDEFE0',

    gap: 14,
  },

  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  programIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: '#ECFDF3',

    alignItems: 'center',
    justifyContent: 'center',
  },

  programTitle: {
    fontSize: 14, fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: '#111',
  },

  programSub: {
    fontSize: 12, fontFamily: 'Lexend-Regular',
    color: '#777',
    marginTop: 2,
  },

  programEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: '#F0FFF4',
  },

  programDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  programEditText: {
    fontSize: 12, fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: '#2E7D32',
  },

  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  programStat: {
    flex: 1,
    alignItems: 'center',
  },

  programStatValue: {
    fontSize: 18, fontFamily: 'Lexend-Black',
    fontWeight: '800',
    color: '#111',
  },

  programStatLabel: {
    fontSize: 11, fontFamily: 'Lexend-Regular',
    color: '#888',
    marginTop: 2,
  },

  programDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EEE',
  },

  // ─────────────────────────
  // Assessment CTA
  // ─────────────────────────

  assessmentCTA: {
    marginHorizontal: 16,
    marginTop: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    padding: 16,

    borderRadius: 16,

    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#CDE9D2',
  },

  assessmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,

    flex: 1,
  },

  assessmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: '#DCFCE7',

    alignItems: 'center',
    justifyContent: 'center',
  },

  assessmentTitle: {
    fontSize: 14, fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: '#111',
  },

  assessmentSub: {
    fontSize: 12, fontFamily: 'Lexend-Regular',
    color: '#666',
    marginTop: 2,
  },

  // ─────────────────────────
  // Reset
  // ─────────────────────────

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 6,

    marginHorizontal: 16,
    marginTop: 12,

    paddingVertical: 10,
  },

  resetText: {
    fontSize: 13, fontFamily: 'Lexend-Regular',
    color: '#888',
  },

  // ─────────────────────────
  // Logout
  // ─────────────────────────

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    marginHorizontal: 16,
    marginTop: 10,

    backgroundColor: '#FFF0F0',

    borderRadius: 12,
    paddingVertical: 14,

    borderWidth: 1,
    borderColor: '#FFCDD2',
  },

  logoutText: {
    fontSize: 14, fontFamily: 'Lexend-Bold',
    fontWeight: '600',
    color: '#E53935',
  },
});