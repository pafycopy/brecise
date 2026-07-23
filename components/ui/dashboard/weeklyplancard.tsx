import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  currentWeek: number;
  totalWeeks: number;
  completedSessions: number;
  totalSessions: number;
  milestone: string;
  onViewPlan?: () => void;
};

const RADIUS = 30;
const STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function WeeklyPlanCard({
  currentWeek,
  totalWeeks,
  completedSessions,
  totalSessions,
  milestone,
  onViewPlan,
}: Props) {
  const progress = totalSessions > 0 ? completedSessions / totalSessions : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Minggu ini</Text>

      <View style={styles.row}>
        {/* Donut chart */}
        <View style={styles.chartWrapper}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            {/* Background circle */}
            <Circle
              cx="40" cy="40" r={RADIUS}
              stroke="#E8E8E8" strokeWidth={STROKE}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx="40" cy="40" r={RADIUS}
              stroke="#4CD964" strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </Svg>
          <View style={styles.percentOverlay}>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.weekLabel}>
            Minggu {currentWeek} dari {totalWeeks}
          </Text>
          <Text style={styles.sessionLabel}>
            {totalSessions === 0 ? (
              `Belum ada jadwal sesi\nuntuk minggu ini.`
            ) : totalSessions - completedSessions > 0 ? (
              `Selesaikan ${totalSessions - completedSessions} sesi lagi\nminggu ini untuk\nmencapai milestone.`
            ) : (
              `Hebat! Semua target sesi\nminggu ini telah selesai.\nTetap konsisten!`
            )}
          </Text>
        </View>
      </View>

     

      <TouchableOpacity style={styles.btn} onPress={onViewPlan} activeOpacity={0.85}>
        <Text style={styles.btnText}>Lihat Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 20, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 10, elevation: 0,
    marginHorizontal: 4,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chartWrapper: { position: 'relative', width: 80, height: 80 },
  percentOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  percentText: { fontSize: 16, fontWeight: '900', color: '#111' },
  info: { flex: 1, gap: 4 },
  weekLabel: { fontSize: 12, fontWeight: '700', color: '#888' },
  sessionLabel: { fontSize: 13, lineHeight: 19, color: '#333' },
  milestoneRow: {
    backgroundColor: '#F4F4F4', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  milestoneText: { fontSize: 12, fontWeight: '600', color: '#555' },
  btn: {
    backgroundColor: '#1A1A2E', borderRadius: 40,
    paddingVertical: 12, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});