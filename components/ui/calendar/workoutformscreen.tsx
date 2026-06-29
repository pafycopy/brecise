import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getFormConfig, WorkoutField,
  calcEstimatedTime, calcIntervalTime,
  calcEstimatedTimeRange,
  PACE_RANGE_LIMITS,
  formatPaceDisplay,
} from '@/constants/workoutformconfig';
import TempoRunForm from '@/components/ui/calendar/temporunform';
import StrengthTrainingForm from '@/components/ui/calendar/strengthtrainingform';

type WorkoutCategory = {
  id: number;
  label: string;
  icon: string;
  iconBg: string;
};

export type WorkoutFormValues = {
  workoutType: string;
  workoutName: string;
  distance: string;
  pace: string;       // legacy / dipakai Tempo & Interval
  paceMin: number;    // batas bawah range (menit desimal), 0 jika tidak pakai range
  paceMax: number;    // batas atas range (menit desimal), 0 jika tidak pakai range
  sets: string;
  reps: string;
  restTime: string;
  weight: string;
  isGenerated?: boolean;
  duration: { hour: number; min: number; sec: number };
  
  warmup?: { distance: string; pace: string };
  tempo?: { distance: string; targetPace: string; actualPace: string };
  cooldown?: { distance: string; pace: string };
  trainingCategory?: string;
  selectedExercises?: Array<{
    id: string;
    name: string;
    // ✅ FIX: ditambahkan supaya konsisten dengan data yang dibutuhkan
    // StrengthTracker.tsx (GIF & timer untuk exercise bertipe 'duration').
    // Optional, supaya tidak breaking untuk data lama yang belum punya field ini.
    inputType?: 'reps' | 'duration';
    gifUrl?: string;
    sets: Array<{
      set: number;
      reps: string;
      // ✅ FIX: ditambahkan agar exercise bertipe 'duration' (misal Plank,
      // Single Leg Balance) bisa membawa durasi targetnya, bukan cuma reps.
      duration?: string;
    }>;
  }>;
};

export type Props = {
  workout: WorkoutCategory;
  initialValues?: WorkoutFormValues;
  onBack: () => void;
  onSave: (values: WorkoutFormValues) => void;
};

type ValidationErrors = Partial<Record<WorkoutField, string>>;

const makeDefault = (workoutType: string): WorkoutFormValues => ({
  workoutType,
  workoutName: `${workoutType} Session`,
  distance: '',
  pace: '',
  paceMin: 0,
  paceMax: 0,
  sets: '',
  reps: '',
  restTime: '90',
  weight: '',
  duration: { hour: 0, min: 0, sec: 0 },
});

const FieldLabel = ({ text }: { text: string }) => (
  <Text style={styles.fieldLabel}>{text}</Text>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <Text style={styles.errorText}>{message}</Text> : null;

const TimeSpinner = ({
  value, onChange, label, max = 99,
}: {
  value: number; onChange: (v: number) => void; label: string; max?: number;
}) => (
  <View style={styles.spinnerCol}>
    <TouchableOpacity style={styles.spinnerBtn} onPress={() => onChange(Math.min(max, value + 1))}>
      <Ionicons name="chevron-up" size={16} color="#444" />
    </TouchableOpacity>
    <View style={styles.spinnerValueBox}>
      <Text style={styles.spinnerValue}>{String(value).padStart(2, '0')}</Text>
    </View>
    <TouchableOpacity style={styles.spinnerBtn} onPress={() => onChange(Math.max(0, value - 1))}>
      <Ionicons name="chevron-down" size={16} color="#444" />
    </TouchableOpacity>
    <Text style={styles.spinnerLabel}>{label}</Text>
  </View>
);

const validate = (values: WorkoutFormValues, fields: WorkoutField[]): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (fields.includes('distance')) {
    const d = parseFloat(values.distance);
    if (!values.distance || isNaN(d) || d <= 0) errors.distance = 'Distance harus lebih dari 0';
  }
  if (fields.includes('pace')) {
    const p = parseFloat(values.pace);
    if (!values.pace || isNaN(p) || p <= 0) errors.pace = 'Pace harus lebih dari 0';
  }
  if (fields.includes('paceRange')) {
    if (values.paceMin <= 0 || values.paceMax <= 0) errors.paceRange = 'Isi pace min & max terlebih dahulu';
    else if (values.paceMin >= values.paceMax) errors.paceRange = 'Pace min harus lebih kecil dari pace max';
  }
  if (fields.includes('reps')) {
    const r = parseInt(values.reps);
    if (!values.reps || isNaN(r) || r <= 0) errors.reps = 'Reps harus lebih dari 0';
  }
  if (fields.includes('restTime')) {
    const rt = parseInt(values.restTime);
    if (!values.restTime || isNaN(rt) || rt <= 0) errors.restTime = 'Waktu rest harus lebih dari 0';
  }
  if (fields.includes('sets')) {
    const s = parseInt(values.sets);
    if (!values.sets || isNaN(s) || s <= 0) errors.sets = 'Sets harus lebih dari 0';
  }
  if (fields.includes('duration')) {
    const total = values.duration.hour * 3600 + values.duration.min * 60 + values.duration.sec;
    if (total === 0) errors.duration = 'Duration tidak boleh 0';
  }
  return errors;
};

const FORM_REGISTRY: Partial<Record<string, React.ComponentType<any>>> = {
  'Tempo Run': TempoRunForm,
  'Strength Training': StrengthTrainingForm,
};

export default function WorkoutFormScreen({ workout, initialValues, onBack, onSave }: Props) {
  const SpecialForm = FORM_REGISTRY[workout.label];
  if (SpecialForm) {
    return <SpecialForm initialValues={initialValues} onBack={onBack} onSave={onSave} />;
  }

  const config    = getFormConfig(workout.label);
  const isEditing = !!initialValues;
  const hasPaceRange = config.fields.includes('paceRange');

  // Inisialisasi paceMin/paceMax:
  // Kalau ada initialValues.paceMin → pakai itu
  // Kalau tidak (user baru buka form) → default 0
  const [values, setValues] = useState<WorkoutFormValues>(() => {
    const base = initialValues ?? makeDefault(workout.label);
    return {
      ...base,
      paceMin: base.paceMin ?? 0,
      paceMax: base.paceMax ?? 0,
    };
  });

  // Text buffer terpisah untuk input pace min/max supaya user bebas mengetik
  // (mis. "5." saat masih mengetik desimal) tanpa kehilangan karakter.
  const [paceMinText, setPaceMinText] = useState<string>(
    values.paceMin > 0 ? String(values.paceMin) : ''
  );
  const [paceMaxText, setPaceMaxText] = useState<string>(
    values.paceMax > 0 ? String(values.paceMax) : ''
  );

  const [errors,    setErrors]    = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof WorkoutFormValues>(field: K, value: WorkoutFormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (submitted) setErrors(validate(next, config.fields));
      return next;
    });
  };

  const handlePaceMinChange = (text: string) => {
    setPaceMinText(text);
    const num = parseFloat(text.replace(',', '.'));
    update('paceMin', isNaN(num) ? 0 : num);
  };

  const handlePaceMaxChange = (text: string) => {
    setPaceMaxText(text);
    const num = parseFloat(text.replace(',', '.'));
    update('paceMax', isNaN(num) ? 0 : num);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const errs = validate(values, config.fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(values);
  };

  const has = (field: WorkoutField) => config.fields.includes(field);

  // Estimated time: pakai range untuk Easy/Long Run, single untuk lainnya
  const estimatedTime = hasPaceRange && values.paceMin > 0 && values.paceMax > 0 && values.distance
    ? calcEstimatedTimeRange(values.distance, values.paceMin, values.paceMax, config.distanceUnit)
    : has('distance') && has('pace')
      ? config.workoutType === 'Interval Run'
        ? calcIntervalTime(values.distance, values.pace, values.reps, config.distanceUnit)
        : calcEstimatedTime(values.distance, values.pace, config.distanceUnit)
      : null;

  const paceRangeLimits = PACE_RANGE_LIMITS[workout.label] ?? { min: 5.0, max: 13.0 };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout.label.toUpperCase()}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── DISTANCE ── */}
        {has('distance') && (
          <View style={styles.fieldGroup}>
            <FieldLabel text={config.workoutType === 'Interval Run' ? 'JARAK PER INTERVAL' : 'DISTANCE'} />
            <View style={[styles.inputRow, errors.distance && styles.inputError]}>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#BBB"
                value={values.distance}
                onChangeText={(v) => update('distance', v)}
              />
              <Text style={styles.unit}>{config.distanceUnit ?? 'km'}</Text>
            </View>
            <FieldError message={errors.distance} />
          </View>
        )}

        {/* ── PACE RANGE (Easy Run & Long Run) — input biasa ── */}
        {hasPaceRange && (
          <View style={styles.fieldGroup}>
            <FieldLabel text="TARGET PACE RANGE" />
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.subLabel}>MIN (tercepat)</Text>
                <View style={[styles.inputRow, errors.paceRange && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#BBB"
                    value={paceMinText}
                    onChangeText={handlePaceMinChange}
                  />
                  <Text style={styles.unit}>/km</Text>
                </View>
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.subLabel}>MAX (terlambat)</Text>
                <View style={[styles.inputRow, errors.paceRange && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#BBB"
                    value={paceMaxText}
                    onChangeText={handlePaceMaxChange}
                  />
                  <Text style={styles.unit}>/km</Text>
                </View>
              </View>
            </View>
            <Text style={styles.hintText}>
              Rentang disarankan: {formatPaceDisplay(paceRangeLimits.min)} – {formatPaceDisplay(paceRangeLimits.max)} /km
            </Text>
            <FieldError message={errors.paceRange} />
          </View>
        )}

        {/* ── PACE tunggal (Interval Run, dll) ── */}
        {has('pace') && !hasPaceRange && (
          <View style={styles.fieldGroup}>
            <FieldLabel text={config.workoutType === 'Interval Run' ? 'TARGET PACE' : 'AVG PACE'} />
            <View style={[styles.inputRow, errors.pace && styles.inputError]}>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#BBB"
                value={values.pace}
                onChangeText={(v) => update('pace', v)}
              />
              <Text style={styles.unit}>{config.paceUnit ?? '/km'}</Text>
            </View>
            <FieldError message={errors.pace} />
          </View>
        )}

        {/* ── REPS & REST TIME ── */}
        {has('reps') && config.workoutType === 'Interval Run' && (
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <FieldLabel text="REPETISI" />
              <View style={[styles.inputRow, errors.reps && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#BBB"
                  value={values.reps}
                  onChangeText={(v) => update('reps', v)}
                />
                <Text style={styles.unit}>x</Text>
              </View>
              <FieldError message={errors.reps} />
            </View>

            {has('restTime') && (
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <FieldLabel text="WAKTU REST" />
                <View style={[styles.inputRow, errors.restTime && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="90"
                    placeholderTextColor="#BBB"
                    value={values.restTime}
                    onChangeText={(v) => update('restTime', v)}
                  />
                  <Text style={styles.unit}>dtk</Text>
                </View>
                <FieldError message={errors.restTime} />
              </View>
            )}
          </View>
        )}

        {/* ── ESTIMATED TIME ── */}
        {estimatedTime && estimatedTime !== '--' && (
          <View style={styles.estTimeBox}>
            <View>
              <Text style={styles.estTimeLabel}>EST. TIME</Text>
              <Text style={styles.estTimeValue}>{estimatedTime}</Text>
            </View>
            <Text style={styles.estTimeInfo}>
              {hasPaceRange
                ? ``
                : config.workoutType === 'Interval Run'
                  ? `Dihitung otomatis\ndari jarak × pace × reps`
                  : `Dihitung otomatis\ndari jarak × pace`}
            </Text>
          </View>
        )}

        {/* ── SETS & WEIGHT ── */}
        {has('sets') && config.workoutType !== 'Interval Run' && (
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <FieldLabel text="SETS" />
              <View style={[styles.inputRow, errors.sets && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#BBB"
                  value={values.sets}
                  onChangeText={(v) => update('sets', v)}
                />
              </View>
              <FieldError message={errors.sets} />
            </View>
            {has('weight') && (
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <FieldLabel text="WEIGHT" />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#BBB"
                    value={values.weight}
                    onChangeText={(v) => update('weight', v)}
                  />
                  <Text style={styles.unit}>kg</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── DURATION ── */}
        {has('duration') && (
          <View style={styles.fieldGroup}>
            <FieldLabel text="DURATION" />
            <View style={styles.spinnerRow}>
              <TimeSpinner
                value={values.duration.hour}
                onChange={(v) => update('duration', { ...values.duration, hour: v })}
                label="HOUR"
              />
              <TimeSpinner
                value={values.duration.min}
                onChange={(v) => update('duration', { ...values.duration, min: v })}
                label="MIN" max={59}
              />
              <TimeSpinner
                value={values.duration.sec}
                onChange={(v) => update('duration', { ...values.duration, sec: v })}
                label="SEC" max={59}
              />
            </View>
            <FieldError message={errors.duration} />
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Simpan Perubahan' : 'Simpan Latihan'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', letterSpacing: 1 },
  form: { padding: 20, gap: 24, paddingBottom: 32 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  subLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F4F4F4', borderRadius: 12, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputError: { borderColor: '#FF3B30' },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1A1A2E', paddingVertical: 14 },
  unit: { fontSize: 14, fontWeight: '600', color: '#999' },
  errorText: { fontSize: 12, color: '#FF3B30', marginTop: 2 },
  hintText: { fontSize: 11, color: '#AAA', marginTop: 2 },
  estTimeBox: {
    backgroundColor: '#F0FFF4', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#C8F5C8',
  },
  estTimeLabel: { fontSize: 11, fontWeight: '700', color: '#2E7D32', letterSpacing: 0.8 },
  estTimeValue: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginTop: 2 },
  estTimeInfo: { fontSize: 11, color: '#2E7D32', textAlign: 'right', lineHeight: 16 },
  spinnerRow: { flexDirection: 'row', gap: 12 },
  spinnerCol: { alignItems: 'center', gap: 4 },
  spinnerBtn: {
    width: 44, height: 32, backgroundColor: '#F4F4F4',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  spinnerValueBox: {
    width: 44, height: 40, backgroundColor: '#F4F4F4',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  spinnerValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  spinnerLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', letterSpacing: 0.5, marginTop: 2 },
  textArea: {
    backgroundColor: '#F4F4F4', borderRadius: 12, padding: 14,
    fontSize: 14, color: '#1A1A2E', minHeight: 100, textAlignVertical: 'top',
  },
  footer: { padding: 20, paddingBottom: 28 },
  saveButton: {
    backgroundColor: '#2E7D32', borderRadius: 50, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});