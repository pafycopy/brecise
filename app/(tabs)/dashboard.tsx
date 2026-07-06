import React, { useEffect } from 'react';
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

  // Cek status Pro setiap kali dashboard dibuka
  useEffect(() => {
    checkProStatus();
  }, []);

  const handleTipPress = () => {
    openTopic(tip.topicId);
    router.navigate('/(tabs)/education' as any);
  };

  return (
    <View style={styles.container}>
      <Header title="Home" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TipsCard tip={tip} onPress={handleTipPress} />

        {hasActivePlan && (
          <>
            <MonitoringProgress
              consistencyPercent={consistencyPercent}
              message={consistencyMsg}
            />
            <WeeklyPlanCard
              currentWeek={currentWeek}
              totalWeeks={4}
              completedSessions={completedSessions}
              totalSessions={totalSessions}
              milestone={`Minggu ${currentWeek} dari 4`}
              onViewPlan={() => router.push('/(tabs)/training')}
            />
          </>
        )}

        <StatsRow
          totalWorkout={dataByPeriod.minggu.workout}
          totalDistance={dataByPeriod.minggu.distance}
          dataByPeriod={dataByPeriod}
        />

        <WeeklyActivityLabel
          sublabel="AKTIVITAS MINGGUAN"
          label={weeklyLabel}
        />

        <RecentActivityCard
          activities={recentActivities}
          onSeeAll={() => router.push('/(tabs)/training')}
        />
      </ScrollView>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 14,
  },
});