export type WorkoutField =
  | 'distance'
  | 'pace'
  | 'paceRange'   // ← NEW: untuk Easy Run & Long Run
  | 'reps'
  | 'restTime'
  | 'sets'
  | 'weight'
  | 'duration'
  | 'notes';

export type WorkoutFormConfig = {
  workoutType: string;
  fields: WorkoutField[];
  distanceUnit?: 'km' | 'm';
  paceUnit?: '/km' | '/100m';
  notesPlaceholder?: string;
};

export const WORKOUT_FORM_CONFIGS: Record<string, WorkoutFormConfig> = {
  'Easy Run': {
    workoutType: 'Easy Run',
    fields: ['distance', 'paceRange', 'notes'],   // ← pakai paceRange
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Bagaimana perasaanmu? Cuaca? Terrain?',
  },
  'Long Run': {
    workoutType: 'Long Run',
    fields: ['distance', 'paceRange', 'notes'],   // ← pakai paceRange
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Total jarak, nutrisi, bagaimana kaki terasa?',
  },
  'Interval Run': {
    workoutType: 'Interval Run',
    fields: ['distance', 'pace', 'reps', 'restTime', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Berapa reps selesai? Pace tiap interval? Recovery time?',
  },
  'Tempo Run': {
    workoutType: 'Tempo Run',
    fields: ['distance', 'pace', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Bagaimana rasanya mempertahankan pace? Angin? Elevasi?',
  },
  'Strength Training': {
    workoutType: 'Strength Training',
    fields: ['sets', 'reps', 'weight', 'duration', 'notes'],
    notesPlaceholder: 'Otot mana yang dilatih? Tingkat kelelahan?',
  },
};

export const getFormConfig = (workoutType: string): WorkoutFormConfig =>
  WORKOUT_FORM_CONFIGS[workoutType] ?? {
    workoutType,
    fields: ['distance', 'pace', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
  };

// ── Pace range limits per workout type (menit/km) ──────────────────────────
// Slider bergerak dalam batas ini
export const PACE_RANGE_LIMITS: Record<string, { min: number; max: number }> = {
  'Easy Run':  { min: 5.0, max: 12.0 },
  'Long Run':  { min: 5.0, max: 13.0 },
};

// Default pace range dari assessment level
// Output: [paceMin, paceMax] dalam menit/km
export const getDefaultPaceRange = (
  workoutType: 'Easy Run' | 'Long Run',
  level: 'beginner' | 'intermediate' | 'advanced'
): [number, number] => {
  const defaults: Record<string, Record<string, [number, number]>> = {
    'Easy Run': {
      beginner:     [9.0,  11.0],
      intermediate: [7.0,  8.5],
      advanced:     [5.5,  7.0],
    },
    'Long Run': {
      beginner:     [10.0, 12.0],
      intermediate: [7.5,  9.0],
      advanced:     [6.0,  7.5],
    },
  };
  return defaults[workoutType]?.[level] ?? [7.0, 9.0];
};

// Format menit desimal → "M:SS"
export const formatPaceDisplay = (pace: number): string => {
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Parse "M:SS" → menit desimal
export const parsePaceString = (paceStr: string): number => {
  const parts = paceStr.split(':');
  if (parts.length !== 2) return parseFloat(paceStr) || 0;
  return parseInt(parts[0]) + parseInt(parts[1]) / 60;
};

const formatMinutes = (totalMin: number): string => {
  const hours = Math.floor(totalMin / 60);
  const mins = Math.floor(totalMin % 60);
  const secs = Math.round((totalMin % 1) * 60);
  if (hours > 0) return `${hours}j ${mins}m`;
  if (secs > 0) return `${mins}m ${secs}s`;
  return `${mins} menit`;
};

// Estimated time pakai paceMin (best case) dan paceMax (worst case)
export const calcEstimatedTimeRange = (
  distance: string,
  paceMin: number,
  paceMax: number,
  unit: 'km' | 'm' = 'km'
): string => {
  const d = parseFloat(distance);
  if (!d || isNaN(d) || d <= 0 || paceMin <= 0 || paceMax <= 0) return '--';
  const distKm = unit === 'm' ? d / 1000 : d;
  const fast = formatMinutes(distKm * paceMin);
  const slow = formatMinutes(distKm * paceMax);
  return `${fast} – ${slow}`;
};

export const calcEstimatedTime = (
  distance: string,
  pace: string,
  unit: 'km' | 'm' = 'km'
): string => {
  const d = parseFloat(distance);
  const p = parseFloat(pace);
  if (!d || !p || isNaN(d) || isNaN(p) || d <= 0 || p <= 0) return '--';
  const distanceInKm = unit === 'm' ? d / 1000 : d;
  return formatMinutes(distanceInKm * p);
};

export const calcIntervalTime = (
  distance: string,
  pace: string,
  reps: string,
  unit: 'km' | 'm' = 'm'
): string => {
  const d = parseFloat(distance);
  const p = parseFloat(pace);
  const r = parseInt(reps);
  if (!d || !p || !r || isNaN(d) || isNaN(p) || isNaN(r) || d <= 0 || p <= 0 || r <= 0) return '--';
  const distanceInKm = unit === 'm' ? d / 1000 : d;
  return formatMinutes(distanceInKm * p * r);
};