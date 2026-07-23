import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/header';
import { Colors } from '@/constants/theme';

import TipsCard            from '@/components/ui/dashboard/tipscard';
import MonitoringProgress  from '@/components/ui/dashboard/monitoringprogress';
import WeeklyPlanCard      from '@/components/ui/dashboard/weeklyplancard';
import StatsRow            from '@/components/ui/dashboard/statsrow';
import WeeklyActivityLabel from '@/components/ui/dashboard/weeklyactivitylabel';
import RecentActivityCard  from '@/components/ui/dashboard/recentactivitycard';
import { useDashboardStats } from '@/hooks/usedashboardstats';
import { useUIEducationStore } from '@/store/uieducationstore';
import { useProStore } from '@/store/proStore';
import { checkProStatus } from '@/lib/proService';

import { useCoachMark, CoachMarkStep } from '@/components/ui/coachmark/CoachMarkProvider';
import CoachMarkTarget from '@/components/ui/coachmark/CoachMarkTarget';
import { useCoachMarkScrollView } from '@/components/ui/coachmark/useCoachMarkScrollView';
import { useCoachMarkStore } from '@/store/coachMarkStore';

const Dashboard = () => {
  const router = useRouter();
  const { openTopic } = useUIEducationStore();
  const isPro = useProStore((s) => s.isPro);

  const {
    dataByPeriod,
    consistencyPercent,
    consistencyMsg,
    completedSessions,
    totalSessions,
    currentWeek,
    hasActivePlan,
    recentActivities,
    weeklyLabel,
    tip,
  } = useDashboardStats();

  useEffect(() => {
    checkProStatus();
  }, []);

  const { startTour } = useCoachMark();
  const hasSeenTour  = useCoachMarkStore((s) => s.hasSeenTour);
  const markTourSeen = useCoachMarkStore((s) => s.markTourSeen);
  const { scrollRef, onScroll } = useCoachMarkScrollView('dashboard');

  const dashboardTourSteps = useMemo<CoachMarkStep[]>(() => {
    const steps: CoachMarkStep[] = [
      {
        id: 'dashboard-tips',
        title: 'Tips Harian',
        description: 'Setiap hari ada tips baru buat bantu latihan larimu. Tap kartu ini buat baca artikel lengkapnya di tab Edukasi.',
      },
    ];

    if (hasActivePlan) {
      steps.push(
        {
          id: 'dashboard-progress',
          title: 'Progress Program',
          description: 'Di sini kamu bisa pantau seberapa konsisten kamu menjalankan program lari minggu ini.',
        },
        {
          id: 'dashboard-weekly-plan',
          title: 'Program Minggu Ini',
          description: 'Ringkasan jadwal latihan minggu ini. Tap "Lihat Program" untuk buka jadwal lengkap di tab Plan.',
        },
      );
    }

    steps.push(
      {
        id: 'dashboard-stats',
        title: 'Statistik Latihan',
        description: 'Total latihan & jarak tempuh kamu — bisa dilihat per minggu maupun per bulan.',
         paddingTop: 2,
        paddingBottom: 4,
        paddingSide: 4,
        offsetY: 40,
       
      },
      {
        id: 'dashboard-weekly-activity',
        title: 'Aktivitas Mingguan',
        description: 'Ringkasan singkat soal aktivitas lari kamu selama seminggu terakhir.',
        paddingTop: 2,
        paddingBottom: 4,
        paddingSide: 4,
        offsetY: 30,
        // ✅ tooltip dipaksa di ATAS kotak (bukan di bawah), digeser lebih
        // ke atas lagi biar gak numpuk nutupin kotak highlight.
        forceTooltipPosition: 'above',
        tooltipOffsetY: -80,
      },
      {
        id: 'dashboard-recent-activity',
        title: 'Riwayat Terbaru',
        description: 'Sesi lari terakhir kamu muncul di sini. Tap "Lihat Semua" untuk cek seluruh riwayat di tab Plan.',
        paddingTop: 4,
        paddingBottom: 4,
        paddingSide: 4,
        offsetY: 30,
        // ✅ tooltip dipaksa di ATAS kotak (bukan di bawah), digeser lebih
        // ke atas lagi biar gak numpuk nutupin kotak highlight.
        forceTooltipPosition: 'above',
        tooltipOffsetY: -80,
      },
    );

    return steps;
  }, [hasActivePlan]);

  useEffect(() => {
    if (hasSeenTour('dashboard')) return;
    const timer = setTimeout(() => {
      startTour('dashboard', dashboardTourSteps, {
        scrollViewId: 'dashboard',
        onFinish: () => markTourSeen('dashboard'),
      });
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTipPress = () => {
    // ✅ ikut kirim lessonId (kalau ada) biar layar topic-nya bisa langsung
    // auto-scroll ke lesson yang lagi jadi tips hari ini (mis. "Butt Kicks"),
    // bukan cuma buka topic-nya dari paling atas.
    openTopic(tip.topicId, tip.lessonId);
    router.navigate('/(tabs)/education' as any);
  };

  return (
    <View style={styles.container}>
      <Header title="Home" />

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tipsLabel}>Tips</Text>
        <CoachMarkTarget id="dashboard-tips">
          <TipsCard tip={tip} onPress={handleTipPress} />
        </CoachMarkTarget>

        {hasActivePlan && (
          <>
            <CoachMarkTarget id="dashboard-progress">
              <MonitoringProgress
                consistencyPercent={consistencyPercent}
                message={consistencyMsg}
              />
            </CoachMarkTarget>
            <CoachMarkTarget id="dashboard-weekly-plan">
              <WeeklyPlanCard
                currentWeek={currentWeek}
                totalWeeks={4}
                completedSessions={completedSessions}
                totalSessions={totalSessions}
                milestone={`Minggu ${currentWeek} dari 4`}
                onViewPlan={() => router.push('/(tabs)/training')}
              />
            </CoachMarkTarget>
          </>
        )}

        <CoachMarkTarget id="dashboard-stats">
          <StatsRow
            totalWorkout={dataByPeriod.minggu.workout}
            totalDistance={dataByPeriod.minggu.distance}
            dataByPeriod={dataByPeriod}
          />
        </CoachMarkTarget>

        <CoachMarkTarget id="dashboard-weekly-activity">
          <WeeklyActivityLabel
            sublabel="AKTIVITAS MINGGUAN"
            label={weeklyLabel}
          />
        </CoachMarkTarget>

        <CoachMarkTarget id="dashboard-recent-activity">
          <RecentActivityCard
            activities={recentActivities}
            onSeeAll={() => router.push('/(tabs)/training')}
          />
        </CoachMarkTarget>
      </ScrollView>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', },
  scrollContent: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 14,
  },
  tipsLabel: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});