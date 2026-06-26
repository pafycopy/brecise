import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

// ── Icon meta — identik dengan ActivityHistoryCard ────────────────────────
type IconLibrary = 'material' | 'ionicons';

const getWorkoutIconMeta = (workoutType: string) => {
  switch (workoutType) {
    case 'Easy Run':
      return { iconName: 'directions-run', iconLib: 'material' as IconLibrary, color: '#111', iconBg: '#E8E8E8' };
    case 'Long Run':
      return { iconName: 'sync',           iconLib: 'material' as IconLibrary, color: '#111', iconBg: '#cfc9f1' };
    case 'Interval Run':
      return { iconName: 'timer',          iconLib: 'material' as IconLibrary, color: '#111', iconBg: '#f3c0c0' };
    case 'Tempo Run':
      return { iconName: 'speed',          iconLib: 'material' as IconLibrary, color: '#111', iconBg: '#C8F5C8' };
    case 'Strength Training':
      return { iconName: 'barbell',        iconLib: 'ionicons' as IconLibrary, color: '#111', iconBg: '#FFE8D6' };
    case 'Rest Day':
      return { iconName: 'bedtime',        iconLib: 'material' as IconLibrary, color: '#111', iconBg: '#ECEFF1' };
    default:
      return { iconName: 'directions-run', iconLib: 'material' as IconLibrary, color: '#111', iconBg: '#E8E8E8' };
  }
};

function WorkoutIcon({ iconName, iconLib, color }: { iconName: string; iconLib: IconLibrary; color: string }) {
  if (iconLib === 'ionicons') {
    return <Ionicons name={iconName as any} size={18} color={color} />;
  }
  return <MaterialIcons name={iconName as any} size={18} color={color} />;
}

type Activity = {
  id: string;
  workoutType: string;
  type: string;
  label: string;
  stat: string;
  statSub?: string;
  icon?: string;
  iconBg?: string;
};

type Props = {
  activities: Activity[];
  onSeeAll?: () => void;
};

export default function RecentActivityCard({ activities, onSeeAll }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>Lihat semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {activities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Belum ada aktivitas</Text>
        </View>
      ) : (
        activities.map((activity) => {
          const meta = getWorkoutIconMeta(activity.workoutType);
          return (
            <View key={activity.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: meta.iconBg }]}>
                <WorkoutIcon iconName={meta.iconName} iconLib={meta.iconLib} color={meta.color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>{activity.type}</Text>
                <Text style={styles.activityLabel}>{activity.label}</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={styles.activityStatValue}>{activity.stat}</Text>
                {activity.statSub && (
                  <Text style={styles.activityStatSub}>{activity.statSub}</Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 20, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#4CD964' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityInfo: { flex: 1 },
  activityType: { fontSize: 14, fontWeight: '700', color: '#111' },
  activityLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  activityStat: { alignItems: 'flex-end' },
  activityStatValue: { fontSize: 14, fontWeight: '800', color: '#111' },
  activityStatSub: { fontSize: 11, color: '#888', marginTop: 1 },
  empty: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#BBB' },
});