import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TempoRunValues = {
  workoutType: 'Tempo Run';
  workoutName: string;
  warmup: { distance: string; pace: string };
  tempo: { distance: string; targetPace: string; actualPace: string };
  cooldown: { distance: string; pace: string };
  notes: string;
  // field kosong agar kompatibel dengan WorkoutFormValues di training.tsx
  distance: string;
  pace: string;
  sets: string;
  restTime: string;
  reps: string;
  weight: string;
  duration: { hour: number; min: number; sec: number };
};

type Props = {
  initialValues?: TempoRunValues;
  onBack: () => void;
  onSave: (values: TempoRunValues) => void;
};

const makeDefault = (): TempoRunValues => ({
  workoutType: 'Tempo Run',
  workoutName: 'Tempo Run Session',
  warmup: { distance: '', pace: '' },
  tempo: { distance: '', targetPace: '', actualPace: '' },
  cooldown: { distance: '', pace: '' },
  notes: '',
  // kompatibilitas
  distance: '',
  pace: '',
  restTime: '',
  sets: '',
  reps: '',
  weight: '',
  duration: { hour: 0, min: 0, sec: 0 },
});

// Hitung EST. TIME dari jarak (km) × pace (min/km)
const calcTime = (distance: string, pace: string): number => {
  const d = parseFloat(distance);
  const p = parseFloat(pace);
  if (!d || !p || isNaN(d) || isNaN(p) || d <= 0 || p <= 0) return 0;
  return d * p;
};

const formatMinutes = (totalMin: number): string => {
  if (totalMin <= 0) return '--';
  const hours = Math.floor(totalMin / 60);
  const mins = Math.floor(totalMin % 60);
  const secs = Math.round((totalMin % 1) * 60);
  if (hours > 0) return `${hours}j ${mins}m`;
  if (secs > 0) return `${mins}m ${secs}s`;
  return `${mins} menit`;
};

type ValidationErrors = {
  warmupDistance?: string;
  warmupPace?: string;
  tempoDistance?: string;
  tempoTargetPace?: string;
  cooldownDistance?: string;
  cooldownPace?: string;
};

const validate = (values: TempoRunValues): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.warmup.distance || parseFloat(values.warmup.distance) <= 0)
    errors.warmupDistance = 'Wajib diisi';
  if (!values.warmup.pace || parseFloat(values.warmup.pace) <= 0)
    errors.warmupPace = 'Wajib diisi';
  if (!values.tempo.distance || parseFloat(values.tempo.distance) <= 0)
    errors.tempoDistance = 'Wajib diisi';
  if (!values.tempo.targetPace || parseFloat(values.tempo.targetPace) <= 0)
    errors.tempoTargetPace = 'Wajib diisi';
  if (!values.cooldown.distance || parseFloat(values.cooldown.distance) <= 0)
    errors.cooldownDistance = 'Wajib diisi';
  if (!values.cooldown.pace || parseFloat(values.cooldown.pace) <= 0)
    errors.cooldownPace = 'Wajib diisi';
  return errors;
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <Text style={styles.errorText}>{message}</Text> : null;

type PhaseInputProps = {
  label: string;
  color: string;
  distance: string;
  pace: string;
  paceLabel?: string;
  estTime: number;
  onDistanceChange: (v: string) => void;
  onPaceChange: (v: string) => void;
  distanceError?: string;
  paceError?: string;
  // slot extra untuk actual pace
  extra?: React.ReactNode;
};

const PhaseInput = ({
  label, color, distance, pace, paceLabel = 'PACE',
  estTime, onDistanceChange, onPaceChange,
  distanceError, paceError, extra,
}: PhaseInputProps) => (
  <View style={[styles.phaseCard, { borderLeftColor: color }]}>
    <Text style={[styles.phaseTitle, { color }]}>{label}</Text>

    <View style={styles.phaseRow}>
      {/* Distance */}
      <View style={[styles.fieldGroup, { flex: 1 }]}>
        <Text style={styles.fieldLabel}>DISTANCE</Text>
        <View style={[styles.inputRow, distanceError && styles.inputError]}>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#BBB"
            value={distance}
            onChangeText={onDistanceChange}
          />
          <Text style={styles.unit}>km</Text>
        </View>
        <FieldError message={distanceError} />
      </View>

      {/* Pace */}
      <View style={[styles.fieldGroup, { flex: 1 }]}>
        <Text style={styles.fieldLabel}>{paceLabel}</Text>
        <View style={[styles.inputRow, paceError && styles.inputError]}>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#BBB"
            value={pace}
            onChangeText={onPaceChange}
          />
          <Text style={styles.unit}>/km</Text>
        </View>
        <FieldError message={paceError} />
      </View>
    </View>

    {/* Extra slot (actual pace untuk tempo) */}
    {extra}

    {/* EST. TIME per fase */}
    {estTime > 0 && (
      <View style={styles.phaseEstTime}>
        <Ionicons name="time-outline" size={13} color={color} />
        <Text style={[styles.phaseEstTimeText, { color }]}>
          EST. {formatMinutes(estTime)}
        </Text>
      </View>
    )}
  </View>
);

export default function TempoRunForm({ initialValues, onBack, onSave }: Props) {
  const [values, setValues] = useState<TempoRunValues>(initialValues ?? makeDefault());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const updateWarmup = (field: keyof TempoRunValues['warmup'], val: string) => {
    setValues((prev) => {
      const next = { ...prev, warmup: { ...prev.warmup, [field]: val } };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  const updateTempo = (field: keyof TempoRunValues['tempo'], val: string) => {
    setValues((prev) => {
      const next = { ...prev, tempo: { ...prev.tempo, [field]: val } };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  const updateCooldown = (field: keyof TempoRunValues['cooldown'], val: string) => {
    setValues((prev) => {
      const next = { ...prev, cooldown: { ...prev.cooldown, [field]: val } };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const errs = validate(values);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Isi field distance & pace utama dari tempo session
    // agar kompatibel dengan resolveStats di training.tsx
    onSave({
      ...values,
      distance: values.tempo.distance,
      pace: values.tempo.targetPace,
    });
  };

  const warmupTime = calcTime(values.warmup.distance, values.warmup.pace);
  const tempoTime = calcTime(values.tempo.distance, values.tempo.targetPace);
  const cooldownTime = calcTime(values.cooldown.distance, values.cooldown.pace);
  const totalTime = warmupTime + tempoTime + cooldownTime;

  const totalDistance = (
    (parseFloat(values.warmup.distance) || 0) +
    (parseFloat(values.tempo.distance) || 0) +
    (parseFloat(values.cooldown.distance) || 0)
  ).toFixed(2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TEMPO RUN</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* WARM UP */}
        <PhaseInput
          label="🔥 WARM UP"
          color="#FF9500"
          distance={values.warmup.distance}
          pace={values.warmup.pace}
          estTime={warmupTime}
          onDistanceChange={(v) => updateWarmup('distance', v)}
          onPaceChange={(v) => updateWarmup('pace', v)}
          distanceError={errors.warmupDistance}
          paceError={errors.warmupPace}
        />

        {/* TEMPO SESSION */}
        <PhaseInput
          label="⚡ TEMPO SESSION"
          color="#2E7D32"
          distance={values.tempo.distance}
          pace={values.tempo.targetPace}
          paceLabel="TARGET PACE"
          estTime={tempoTime}
          onDistanceChange={(v) => updateTempo('distance', v)}
          onPaceChange={(v) => updateTempo('targetPace', v)}
          distanceError={errors.tempoDistance}
          paceError={errors.tempoTargetPace}
          extra={
            <View style={styles.fieldGroup}>
              {/* Tampilkan perbandingan target vs actual */}
              {values.tempo.actualPace && values.tempo.targetPace && (
                <View style={styles.paceCompare}>
                  {parseFloat(values.tempo.actualPace) <= parseFloat(values.tempo.targetPace) ? (
                    <Text style={styles.paceHit}>✅ Target pace tercapai!</Text>
                  ) : (
                    <Text style={styles.paceMiss}>
                      ⚠️ {(parseFloat(values.tempo.actualPace) - parseFloat(values.tempo.targetPace)).toFixed(2)} min/km di atas target
                    </Text>
                  )}
                </View>
              )}
            </View>
          }
        />

        {/* COOL DOWN */}
        <PhaseInput
          label="❄️ COOL DOWN"
          color="#007AFF"
          distance={values.cooldown.distance}
          pace={values.cooldown.pace}
          estTime={cooldownTime}
          onDistanceChange={(v) => updateCooldown('distance', v)}
          onPaceChange={(v) => updateCooldown('pace', v)}
          distanceError={errors.cooldownDistance}
          paceError={errors.cooldownPace}
        />

        {/* TOTAL SUMMARY */}
        {totalTime > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>TOTAL SESI</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>JARAK</Text>
                <Text style={styles.summaryValue}>{totalDistance} km</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>EST. TIME</Text>
                <Text style={styles.summaryValue}>{formatMinutes(totalTime)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* NOTES */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOTES</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Bagaimana rasanya mempertahankan pace? Angin? Elevasi?"
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={4}
            value={values.notes}
            onChangeText={(v) => setValues((prev) => ({ ...prev, notes: v }))}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>
            {initialValues ? 'Simpan Perubahan' : 'Simpan Latihan'}
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
  form: { padding: 16, gap: 16, paddingBottom: 32 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  optional: { fontSize: 10, fontWeight: '400', color: '#BBB' },
  phaseCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderLeftWidth: 4,
  },
  phaseTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  phaseRow: { flexDirection: 'row', gap: 12 },
  phaseEstTime: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 4,
  },
  phaseEstTimeText: { fontSize: 12, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputError: { borderColor: '#FF3B30' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A2E', paddingVertical: 12 },
  unit: { fontSize: 13, fontWeight: '600', color: '#999' },
  errorText: { fontSize: 11, color: '#FF3B30', marginTop: 2 },
  paceCompare: { marginTop: 6 },
  paceHit: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  paceMiss: { fontSize: 12, fontWeight: '600', color: '#FF9500' },
  summaryBox: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 11, fontWeight: '700', color: '#FFFFFF99', letterSpacing: 0.8,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#FFFFFF22' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#FFFFFF88', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
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