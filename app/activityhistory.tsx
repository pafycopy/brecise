import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useWorkoutStore, SavedWorkout } from '@/store/supabaseWorkoutStore';
import DateTimePicker from '@react-native-community/datetimepicker';

// =========================
// UTILS
// =========================

type IconLibrary = 'material' | 'ionicons';

const getWorkoutMeta = (type: string) => {
  switch (type) {
    case 'Easy Run':        return { iconName: 'directions-run', iconLib: 'material'  as IconLibrary, color: '#111', bg: '#E8E8E8' };
    case 'Long Run':        return { iconName: 'sync',           iconLib: 'material'  as IconLibrary, color: '#111', bg: '#cfc9f1' };
    case 'Interval Run':    return { iconName: 'timer',          iconLib: 'material'  as IconLibrary, color: '#111', bg: '#f3c0c0' };
    case 'Tempo Run':       return { iconName: 'speed',          iconLib: 'material'  as IconLibrary, color: '#111', bg: '#C8F5C8' };
    case 'Strength Training': return { iconName: 'barbell',      iconLib: 'ionicons'  as IconLibrary, color: '#111', bg: '#FFE8D6' };
    default:                return { iconName: 'directions-run', iconLib: 'material'  as IconLibrary, color: '#4CAF50', bg: '#E8F5E9' };
  }
};

const formatDateLabel = (dateKey: string): string => {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDisplayDate = (date: Date | null): string => {
  if (!date) return 'dd-mm-yyyy';
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const formatLabelDate = (date: Date | null): string => {
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const getDefaultStart = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDefaultEnd = (): Date => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

// =========================
// SUB-COMPONENTS
// =========================

const WorkoutIcon = ({ iconName, iconLib, color }: { iconName: string; iconLib: IconLibrary; color: string }) => {
  if (iconLib === 'ionicons') return <Ionicons name={iconName as any} size={22} color={color} />;
  return <MaterialIcons name={iconName as any} size={22} color={color} />;
};

const WorkoutRow = ({ workout, dateLabel }: { workout: SavedWorkout; dateLabel: string }) => {
  const meta        = getWorkoutMeta(workout.workoutType);
  const isStrength  = workout.workoutType === 'Strength Training';
  const exerciseCnt = workout.selectedExercises?.length ?? 0;
  const totalSets   = workout.selectedExercises?.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0) ?? 0;
  const distance    = !isStrength && workout.trackingResult?.actualDistance
    ? `${workout.trackingResult.actualDistance.toFixed(2)} km` : null;
  const pace        = !isStrength && workout.trackingResult?.actualPace
    ? `${workout.trackingResult.actualPace}/km` : null;

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
        <WorkoutIcon iconName={meta.iconName} iconLib={meta.iconLib} color={meta.color} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.workoutName} numberOfLines={2}>{workout.workoutName}</Text>
          <Text style={styles.dateChip}>{dateLabel}</Text>
        </View>
        <Text style={styles.detail}>
          {isStrength
            ? `${exerciseCnt} latihan · ${totalSets} set`
            : [distance, pace].filter(Boolean).join(' · ') || 'No data'}
        </Text>
      </View>
    </View>
  );
};

// =========================
// INLINE FILTER CARD
// =========================

interface FilterCardProps {
  startDate: Date | null;
  endDate:   Date | null;
  onChange:  (start: Date | null, end: Date | null) => void;
}

const FilterCard = ({ startDate, endDate, onChange }: FilterCardProps) => {
  const [localStart,      setLocalStart]      = useState<Date | null>(startDate);
  const [localEnd,        setLocalEnd]        = useState<Date | null>(endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);

  // Sync local state when props change (especially for reset)
  React.useEffect(() => {
    setLocalStart(startDate);
    setLocalEnd(endDate);
  }, [startDate, endDate]);

  const handleReset = () => {
    setLocalStart(null);
    setLocalEnd(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
    onChange(null, null);
  };

  const handleApply = () => {
    setShowStartPicker(false);
    setShowEndPicker(false);
    onChange(localStart, localEnd);
  };

  return (
    <View style={styles.filterCard}>
      <Text style={styles.filterTitle}>Pilih Tanggal</Text>

      {/* Row: AWAL */}
      <View style={styles.dateFields}>
        {/* AWAL */}
        <View style={styles.dateCol}>
          <View style={styles.dateFieldHeader}>
            <Text style={styles.dateFieldLabel}>AWAL</Text>
            <Text style={styles.dateFieldValue}>
              {formatLabelDate(localStart)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
              setShowStartPicker(p => !p);
              setShowEndPicker(false);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#555"
              style={{ marginRight: 6 }}
            />

            <Text style={[styles.dateInputText, !localStart && styles.placeholderText]}>
              {formatDisplayDate(localStart)}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={localStart || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={localEnd || new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === 'android')
                  setShowStartPicker(false);

                if (selected)
                  setLocalStart(selected);
              }}
            />
          )}
        </View>

        {/* AKHIR */}
        <View style={styles.dateCol}>
          <View style={styles.dateFieldHeader}>
            <Text style={styles.dateFieldLabel}>AKHIR</Text>
            <Text style={styles.dateFieldValue}>
              {formatLabelDate(localEnd)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
              setShowEndPicker(p => !p);
              setShowStartPicker(false);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#555"
              style={{ marginRight: 6 }}
            />

            <Text style={[styles.dateInputText, !localEnd && styles.placeholderText]}>
              {formatDisplayDate(localEnd)}
            </Text>
          </TouchableOpacity>

          {showEndPicker && (
            <DateTimePicker
              value={localEnd || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={localStart || undefined}
              maximumDate={new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === 'android')
                  setShowEndPicker(false);

                if (selected)
                  setLocalEnd(selected);
              }}
            />
          )}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.resetBtn}  onPress={handleReset}  activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>ATUR ULANG</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn}  onPress={handleApply}  activeOpacity={0.8}>
          <Text style={styles.applyBtnText}>TERAPKAN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================
// SCREEN
// =========================

const ActivityHistoryScreen = () => {
  const { workoutsByDate } = useWorkoutStore();

  // Initialize with null to show all by default, or use getDefaultStart/End if you want a default range
  const [filterStart, setFilterStart] = useState<Date | null>(null);
  const [filterEnd,   setFilterEnd]   = useState<Date | null>(null);

  const allHistory = useMemo(() => {
    const list: { workout: SavedWorkout; dateKey: string }[] = [];
    Object.entries(workoutsByDate).forEach(([dateKey, workouts]) => {
      workouts.forEach((w) => {
        if (w.status === 'completed') list.push({ workout: w, dateKey });
      });
    });
    list.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return list;
  }, [workoutsByDate]);

  const filteredHistory = useMemo(() => {
    // If either start or end is null, show all history
    if (!filterStart || !filterEnd) return allHistory;

    const start = new Date(filterStart); start.setHours(0,  0,  0,   0);
    const end   = new Date(filterEnd);   end.setHours(23, 59, 59, 999);
    return allHistory.filter(({ dateKey }) => {
      const d = new Date(dateKey);
      return d >= start && d <= end;
    });
  }, [allHistory, filterStart, filterEnd]);

  const handleFilterChange = (start: Date | null, end: Date | null) => {
    setFilterStart(start);
    setFilterEnd(end);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Aktivitas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Fixed filter card */}
      <FilterCard
        startDate={filterStart}
        endDate={filterEnd}
        onChange={handleFilterChange}
      />

      {/* Scrollable list */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="fitness-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada aktivitas di rentang tanggal ini</Text>
          </View>
        ) : (
          filteredHistory.map(({ workout, dateKey }) => (
            <WorkoutRow
              key={workout.uid}
              workout={workout}
              dateLabel={formatDateLabel(dateKey)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ActivityHistoryScreen;

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios:     { paddingTop: 12 },
      android: { paddingTop: 40 },
    }),
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

  // Inline filter card (sticky, not scrollable)
  filterCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  dateFields: {
    gap: 14,
  },
  dateCol: {
    width: '100%',
  },
  dateFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dateFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.4,
  },
  dateFieldValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  dateInputText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#AAA',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  resetBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1B6B3A',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#1B6B3A',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#1B6B3A',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Scrollable workout list
  listContainer: { flex: 1 },
  listContent:   { padding: 16, paddingBottom: 40 },

  // Workout card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  workoutName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A', paddingRight: 8 },
  detail:      { fontSize: 12, color: '#666', lineHeight: 17 },
  dateChip:    { fontSize: 11, fontWeight: '600', color: '#888' },

  // Empty state
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
