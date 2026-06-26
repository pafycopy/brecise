import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import {
  useWorkoutStore,
  SavedWorkout,
} from '@/store/supabaseWorkoutStore';

// =========================
// ICON META
// =========================

type IconLibrary = 'material' | 'ionicons';

const getWorkoutMeta = (type: string) => {
  switch (type) {
    case 'Easy Run':
      return {
        iconName: 'directions-run',
        iconLib: 'material' as IconLibrary,
        color: '#111',
        bg: '#E8E8E8',
      };

    case 'Long Run':
      return {
        iconName: 'sync',
        iconLib: 'material' as IconLibrary,
        color: '#111',
        bg: '#cfc9f1',
      };

    case 'Interval Run':
      return {
        iconName: 'timer',
        iconLib: 'material' as IconLibrary,
        color: '#111',
        bg: '#f3c0c0',
      };

    case 'Tempo Run':
      return {
        iconName: 'speed',
        iconLib: 'material' as IconLibrary,
        color: '#111',
        bg: '#C8F5C8',
      };

    case 'Strength Training':
      return {
        iconName: 'barbell',
        iconLib: 'ionicons' as IconLibrary,
        color: '#111',
        bg: '#FFE8D6',
      };

    default:
      return {
        iconName: 'directions-run',
        iconLib: 'material' as IconLibrary,
        color: '#4CAF50',
        bg: '#E8F5E9',
      };
  }
};

// =========================
// DATE FORMAT
// =========================

const formatDateLabel = (dateKey: string): string => {
  const date = new Date(dateKey);

  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// =========================
// ICON RENDER
// =========================

function WorkoutIcon({
  iconName,
  iconLib,
  color,
}: {
  iconName: string;
  iconLib: IconLibrary;
  color: string;
}) {
  if (iconLib === 'ionicons') {
    return (
      <Ionicons
        name={iconName as any}
        size={22}
        color={color}
      />
    );
  }

  return (
    <MaterialIcons
      name={iconName as any}
      size={22}
      color={color}
    />
  );
}

// =========================
// WORKOUT ROW
// =========================

const WorkoutRow = ({
  workout,
  dateLabel,
}: {
  workout: SavedWorkout;
  dateLabel: string;
}) => {
  const meta = getWorkoutMeta(workout.workoutType);

  const isStrength =
    workout.workoutType === 'Strength Training';

  const exerciseCount =
    workout.selectedExercises?.length ?? 0;

  const totalSets =
    workout.selectedExercises?.reduce(
      (acc, ex) => acc + (ex.sets?.length ?? 0),
      0
    ) ?? 0;

  const distance =
    !isStrength &&
    workout.trackingResult?.actualDistance
      ? `${workout.trackingResult.actualDistance.toFixed(2)} km`
      : null;

  const pace =
    !isStrength &&
    workout.trackingResult?.actualPace
      ? `${workout.trackingResult.actualPace}/km`
      : null;

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: meta.bg },
        ]}
      >
        <WorkoutIcon
          iconName={meta.iconName}
          iconLib={meta.iconLib}
          color={meta.color}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text
            style={styles.workoutName}
            numberOfLines={2}
          >
            {workout.workoutName}
          </Text>

          <Text style={styles.dateLabel}>
            {dateLabel}
          </Text>
        </View>

        <Text style={styles.detail}>
          {isStrength
            ? `${exerciseCount} exercise · ${totalSets} sets`
            : [distance, pace]
                .filter(Boolean)
                .join(' · ') || 'Belum ada data'}
        </Text>
      </View>
    </View>
  );
};

// =========================
// MAIN COMPONENT
// =========================

const ActivityHistoryCard = () => {
  const { workoutsByDate } = useWorkoutStore();

  const history: {
    workout: SavedWorkout;
    dateKey: string;
  }[] = [];

  Object.entries(workoutsByDate).forEach(
    ([dateKey, workouts]) => {
      workouts.forEach((w) => {
        if (w.status === 'completed') {
          history.push({
            workout: w,
            dateKey,
          });
        }
      });
    }
  );

  history.sort((a, b) =>
    b.dateKey.localeCompare(a.dateKey)
  );

  const displayed = history.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Activity History
        </Text>

        {/* Tombol "View All" selalu muncul */}
          <TouchableOpacity
  style={styles.viewAllButton}
  onPress={() => router.push('/activityhistory')}
>
  <Text style={styles.viewAll}>
    Lihat Semua
  </Text>

  <Ionicons
    name="chevron-forward"
    size={20}
    color="#1F2A44"
  />
</TouchableOpacity>
        
      </View>
      {displayed.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="fitness-outline"
            size={32}
            color="#ccc"
          />

          <Text style={styles.emptyText}>
            Belum ada aktivitas selesai
          </Text>
        </View>
      ) : (
        displayed.map(({ workout, dateKey }) => (
          <WorkoutRow
            key={workout.uid}
            workout={workout}
            dateLabel={formatDateLabel(dateKey)}
          />
        ))
      )}
    </View>
  );
};

export default ActivityHistoryCard;

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 26,
    marginTop: 8,
    marginBottom: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  viewAllButton: {
  flexDirection: 'row',
  alignItems: 'center',
},

  viewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#Fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  workoutName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    paddingRight: 8,
  },

  detail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
});