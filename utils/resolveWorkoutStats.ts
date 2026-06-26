import { SavedWorkout } from '@/store/supabaseWorkoutStore';
import {
  getFormConfig,
  calcEstimatedTime,
  calcEstimatedTimeRange,
  calcIntervalTime,
} from '@/constants/workoutformconfig';

export const calcTime = (distance: string, pace: string): number => {
  const d = parseFloat(distance);
  const p = parseFloat(pace);
  if (!d || !p || isNaN(d) || isNaN(p) || d <= 0 || p <= 0) return 0;
  return d * p;
};

export const formatMinutes = (totalMin: number): string => {
  if (totalMin <= 0) return '--';
  const hours = Math.floor(totalMin / 60);
  const mins  = Math.floor(totalMin % 60);
  const secs  = Math.round((totalMin % 1) * 60);
  if (hours > 0) return `${hours}j ${mins}m`;
  if (secs > 0)  return `${mins}m ${secs}s`;
  return `${mins} menit`;
};

const resolveEstTime = (workout: SavedWorkout): string => {
  const config = getFormConfig(workout.workoutType);

  // ── Easy Run / Long Run — pakai pace RANGE (paceMin/paceMax) ────────────
  if (config.fields.includes('paceRange')) {
    if (workout.paceMin > 0 && workout.paceMax > 0 && workout.distance) {
      const est = calcEstimatedTimeRange(
        workout.distance,
        workout.paceMin,
        workout.paceMax,
        config.distanceUnit,
      );
      return est === '--' ? '-' : est;
    }
    return '-';
  }

  // ── Tipe dengan pace tunggal (Tempo / Interval, dll) ─────────────────────
  if (config.fields.includes('distance') && config.fields.includes('pace')) {
    if (workout.workoutType === 'Interval Run') {
      const est = calcIntervalTime(workout.distance, workout.pace, workout.sets, config.distanceUnit);
      return est === '--' ? '-' : est;
    }
    const est = calcEstimatedTime(workout.distance, workout.pace, config.distanceUnit);
    return est === '--' ? '-' : est;
  }

  if (config.fields.includes('duration')) {
    const mins = workout.duration.hour * 60 + workout.duration.min;
    return mins > 0 ? `${mins} menit` : '-';
  }

  return '-';
};

export const resolveStats = (workout: SavedWorkout) => {
  const config = getFormConfig(workout.workoutType);
  const stats  = [];

  if (workout.workoutType === 'Strength Training') {
    stats.push({ label: 'CATEGORY',   value: workout.trainingCategory ?? '-' });
    stats.push({ label: 'EXERCISE',   value: String(workout.selectedExercises?.length ?? 0) });
    stats.push({ label: 'TOTAL SETS', value: workout.sets || '-' });
    return stats;
  }

  if (workout.workoutType === 'Tempo Run' && workout.warmup && workout.tempo && workout.cooldown) {
    const totalTime =
      calcTime(workout.warmup.distance, workout.warmup.pace) +
      calcTime(workout.tempo.distance,  workout.tempo.targetPace) +
      calcTime(workout.cooldown.distance, workout.cooldown.pace);
    const totalDistance = (
      (parseFloat(workout.warmup.distance)   || 0) +
      (parseFloat(workout.tempo.distance)    || 0) +
      (parseFloat(workout.cooldown.distance) || 0)
    ).toFixed(2);
    stats.push({ label: 'TOTAL JARAK', value: `${totalDistance} km` });
    stats.push({ label: 'TARGET PACE', value: `${workout.tempo.targetPace}/km` });
    stats.push({ label: 'EST. TIME',   value: formatMinutes(totalTime) });
    return stats;
  }

  // ── Interval Run — ganti EST. TIME dengan REPETISI ────────────────────────
  if (workout.workoutType === 'Interval Run') {
    stats.push({ label: 'DISTANCE',    value: `${workout.distance ?? '-'} km` });
    stats.push({ label: 'TARGET PACE', value: `${workout.pace ?? '-'}/km` });
    stats.push({ label: 'REPETISI',    value: `${workout.reps ?? '-'}x` });
    return stats;
  }

  // ── Generic (Easy Run, Long Run, dll) ────────────────────────────────────
  if (config.fields.includes('distance')) {
    stats.push({ label: 'DISTANCE',    value: `${workout.distance} ${config.distanceUnit ?? 'km'}` });
  }

  // Easy Run / Long Run pakai pace RANGE, bukan pace tunggal
  if (config.fields.includes('paceRange')) {
    if (workout.paceMin > 0 && workout.paceMax > 0) {
      stats.push({
        label: 'TARGET PACE',
        value: `${workout.paceMin.toFixed(2)}–${workout.paceMax.toFixed(2)}/km`,
      });
    }
  } else if (config.fields.includes('pace')) {
    stats.push({ label: 'TARGET PACE', value: `${workout.pace}/km` });
  }

  if (config.fields.includes('sets')) {
    stats.push({ label: 'SETS',        value: workout.sets || '-' });
  }
  if (config.fields.includes('weight')) {
    stats.push({ label: 'WEIGHT',      value: workout.weight ? `${workout.weight} kg` : '-' });
  }
  if (workout.workoutType !== 'Rest Day') {
    stats.push({ label: 'EST. TIME',   value: resolveEstTime(workout) });
  }

  return stats;
};