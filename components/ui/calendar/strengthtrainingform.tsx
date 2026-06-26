import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';
import {
  EXERCISES, CATEGORY_CONFIG, CATEGORIES,
  ExerciseCategory, Exercise, SelectedExercise,
  makeDefaultSet, getSetsLabel,
} from '@/constants/strengthdata';
import { WorkoutFormValues } from '@/components/ui/calendar/workoutformscreen';


// ── Icon SVG inline ──────────────────────────────────────────────────────────
type IconProps = { color?: string; size?: number };

const StrengthIcon = ({ color = '#000', size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs><ClipPath id="cl_s"><Rect width="24" height="24" fill="white" /></ClipPath></Defs>
    <G clipPath="url(#cl_s)">
      <Path d="M2 12H3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 8H4C3.73 8 3.48 8.1 3.29 8.29C3.1 8.48 3 8.73 3 9V15C3 15.26 3.1 15.52 3.29 15.7C3.48 15.89 3.73 16 4 16H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 7V17C6 17.26 6.1 17.52 6.29 17.7C6.48 17.89 6.73 18 7 18H8C8.26 18 8.52 17.89 8.7 17.7C8.89 17.52 9 17.26 9 17V7C9 6.73 8.89 6.48 8.7 6.29C8.52 6.1 8.26 6 8 6H7C6.73 6 6.48 6.1 6.29 6.29C6.1 6.48 6 6.73 6 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 7V17C15 17.26 15.1 17.52 15.29 17.7C15.48 17.89 15.73 18 16 18H17C17.26 18 17.52 17.89 17.7 17.7C17.89 17.52 18 17.26 18 17V7C18 6.73 17.89 6.48 17.7 6.29C17.52 6.1 17.26 6 17 6H16C15.73 6 15.48 6.1 15.29 6.29C15.1 6.48 15 6.73 15 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 8H20C20.26 8 20.52 8.1 20.7 8.29C20.89 8.48 21 8.73 21 9V15C21 15.26 20.89 15.52 20.7 15.7C20.52 15.89 20.26 16 20 16H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

const CoreIcon = ({ color = '#000', size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs><ClipPath id="cl_c"><Rect width="24" height="24" fill="white" /></ClipPath></Defs>
    <G clipPath="url(#cl_c)">
      <Path d="M7 7C7 7.26 7.1 7.52 7.29 7.7C7.48 7.89 7.73 8 8 8C8.26 8 8.52 7.89 8.7 7.7C8.89 7.52 9 7.26 9 7C9 6.73 8.89 6.48 8.7 6.29C8.52 6.1 8.26 6 8 6C7.73 6 7.48 6.1 7.29 6.29C7.1 6.48 7 6.73 7 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 21L14 12L21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 11H9L14 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5 8.5L16 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

const MobilityIcon = ({ color = '#000', size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs><ClipPath id="cl_m"><Rect width="24" height="24" fill="white" /></ClipPath></Defs>
    <G clipPath="url(#cl_m)">
      <Path d="M6.5 21L10 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 11L12 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 21L12 14V9L19 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.59 7.41C9.21 7.03 9 6.53 9 6C9 5.46 9.21 4.96 9.59 4.58C9.96 4.21 10.47 4 11 4C11.53 4 12.04 4.21 12.42 4.58C12.79 4.96 13 5.46 13 6C13 6.53 12.79 7.03 12.42 7.41C12.04 7.78 11.53 8 11 8C10.47 8 9.96 7.78 9.59 7.41Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

const RecoveryIcon = ({ color = '#000', size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs><ClipPath id="cl_r"><Rect width="24" height="24" fill="white" /></ClipPath></Defs>
    <G clipPath="url(#cl_r)">
      <Path d="M15 5C15 5.26 15.1 5.52 15.29 5.7C15.48 5.89 15.73 6 16 6C16.26 6 16.52 5.89 16.7 5.7C16.89 5.52 17 5.26 17 5C17 4.73 16.89 4.48 16.7 4.29C16.52 4.1 16.26 4 16 4C15.73 4 15.48 4.1 15.29 4.29C15.1 4.48 15 4.73 15 5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 20L10 19.5L11 17.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 20V15H12.5L15 8.5L9.5 9.5L11 11.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

const CATEGORY_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  Strength: StrengthIcon,
  Core:     CoreIcon,
  Mobility: MobilityIcon,
  Recovery: RecoveryIcon,
};
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  initialValues?: WorkoutFormValues;
  onBack: () => void;
  onSave: (values: WorkoutFormValues) => void;
};

// ─── Preview Screen ───────────────────────────────────────────────────────────
type PreviewExercise = {
  id: string;
  name: string;
  setsLabel: string;
  inputType: 'reps' | 'duration';
  gifUrl?: string;
};

type IntensityLevel = 'Light' | 'Moderate' | 'High';

const getIntensity = (totalSets: number): { label: IntensityLevel; color: string } => {
  if (totalSets <= 6)  return { label: 'Light',    color: '#007AFF' };
  if (totalSets <= 12) return { label: 'Moderate', color: '#FF9500' };
  return               { label: 'High',     color: '#FF3B30' };
};

type PreviewProps = {
  badge: string; programTitle: string; durationMins: number;
  totalSets: number; exercises: PreviewExercise[];
  quote?: string; onBack: () => void; onStart: () => void;
};

function WorkoutPreview({ badge, programTitle, durationMins, totalSets, exercises, quote, onBack, onStart }: PreviewProps) {
  const intensity = getIntensity(totalSets);
  return (
    <SafeAreaView style={ps.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={ps.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={ps.headerTitle}>Strength Training</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={ps.scroll} showsVerticalScrollIndicator={false}>
        <View style={ps.heroCard}>
          <View style={ps.badge}><Text style={ps.badgeText}>{badge}</Text></View>
          <Text style={ps.heroTitle}>{programTitle}</Text>
        </View>
        <View style={ps.statsRow}>
          <View style={ps.statItem}>
            <Text style={ps.statLabel}>DURATION</Text>
            <Text style={ps.statValue}>{durationMins} Mins</Text>
          </View>
          <View style={ps.statDivider} />
          <View style={ps.statItem}>
            <Text style={ps.statLabel}>INTENSITY</Text>
            <Text style={[ps.statValue, { color: intensity.color }]}>{intensity.label}</Text>
          </View>
        </View>
        <View style={ps.exerciseList}>
          {exercises.map((ex) => (
            <View key={ex.id} style={ps.exerciseCard}>
              <View style={ps.thumbnail}>
                {ex.gifUrl ? (
                  <Image source={{ uri: ex.gifUrl }} style={ps.thumbnailImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="barbell-outline" size={22} color="#CCC" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ps.exerciseName}>{ex.name}</Text>
                <Text style={ps.exerciseSets}>{ex.setsLabel}</Text>
              </View>
              {/* Badge reps vs durasi */}
              <View style={[ps.typeBadge, ex.inputType === 'duration' && ps.typeBadgeDuration]}>
                <Ionicons
                  name={ex.inputType === 'duration' ? 'timer-outline' : 'repeat-outline'}
                  size={12}
                  color={ex.inputType === 'duration' ? '#007AFF' : '#FF6B35'}
                />
                <Text style={[ps.typeBadgeText, ex.inputType === 'duration' && { color: '#007AFF' }]}>
                  {ex.inputType === 'duration' ? 'Waktu' : 'Reps'}
                </Text>
              </View>
            </View>
          ))}
        </View>
        {!!quote && <Text style={ps.quote}>"{quote}"</Text>}
      </ScrollView>
      <View style={ps.footer}>
        <TouchableOpacity style={ps.startBtn} onPress={onStart} activeOpacity={0.88}>
          <Text style={ps.startBtnText}>Simpan Latihan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Form Screen ──────────────────────────────────────────────────────────────
export default function StrengthTrainingForm({ initialValues, onBack, onSave }: Props) {
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>(
    (initialValues?.trainingCategory as ExerciseCategory) ?? 'Strength'
  );
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(() => {
    if (!initialValues?.selectedExercises) return [];
    return initialValues.selectedExercises
      .map((saved) => {
        const exercise = EXERCISES.find((e) => e.id === saved.id);
        if (!exercise) return null;
        return { exercise, sets: saved.sets, expanded: false };
      })
      .filter(Boolean) as SelectedExercise[];
  });
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pendingValues, setPendingValues] = useState<WorkoutFormValues | null>(null);
  const isEditing = !!initialValues;

  const handleCategoryChange = (cat: ExerciseCategory) => {
    setActiveCategory(cat); setSelectedExercises([]); setError('');
  };

  const toggleExercise = (exercise: Exercise) => {
    setError('');
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.exercise.id === exercise.id);
      if (exists) return prev.filter((e) => e.exercise.id !== exercise.id);
      return [...prev, { exercise, sets: [makeDefaultSet(exercise, 1)], expanded: true }];
    });
  };

  const isSelected = (id: string) => selectedExercises.some((e) => e.exercise.id === id);

  const toggleExpand = (id: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => e.exercise.id === id ? { ...e, expanded: !e.expanded } : e)
    );
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'duration' | 'kg', value: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        return { ...e, sets: e.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s) };
      })
    );
  };

  const addSet = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        const exercise = e.exercise;
        return { ...e, sets: [...e.sets, makeDefaultSet(exercise, e.sets.length + 1)] };
      })
    );
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setSelectedExercises((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        if (e.sets.length <= 1) return e;
        return { ...e, sets: e.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, set: i + 1 })) };
      })
    );
  };

  const totalSets = selectedExercises.reduce((acc, e) => acc + e.sets.length, 0);

  const handlePreview = () => {
    if (selectedExercises.length === 0) { setError('Pilih minimal 1 exercise'); return; }
    const values: WorkoutFormValues = {
      workoutType: 'Strength Training',
      workoutName: `${activeCategory} Session`,
      distance: '', pace: '', sets: String(totalSets), reps: '',
      restTime: '60', weight: '',
      duration: { hour: 0, min: 0, sec: 0 },
      notes, trainingCategory: activeCategory,
      selectedExercises: selectedExercises.map((e) => ({
        id: e.exercise.id,
        name: e.exercise.name,
        inputType: e.exercise.inputType,
        gifUrl: e.exercise.gifUrl ?? null,   // ← kirim gifUrl ke tracker
        sets: e.sets.map((s) => ({ set: s.set, reps: s.reps, duration: s.duration, kg: s.kg })),
      })),
    };
    setPendingValues(values); setShowPreview(true);
  };

  const handleStart = () => { if (pendingValues) onSave(pendingValues); };

  // ── Preview screen ─────────────────────────────────────────────────────────
  if (showPreview && pendingValues) {
    const estimateMins = Math.round(totalSets * 1.5);
    const previewExercises: PreviewExercise[] = selectedExercises.map((e) => ({
      id: e.exercise.id,
      name: e.exercise.name,
      setsLabel: getSetsLabel(e.exercise, e.sets),
      inputType: e.exercise.inputType,
      gifUrl: e.exercise.gifUrl,
    }));
    return (
      <WorkoutPreview
        badge={activeCategory.toUpperCase()}
        programTitle={`${activeCategory} Session`}
        durationMins={estimateMins}
        totalSets={totalSets}
        exercises={previewExercises}
        quote="Istirahat juga bagian dari progres"
        onBack={() => setShowPreview(false)}
        onStart={handleStart}
      />
    );
  }

  // ── Form screen ────────────────────────────────────────────────────────────
  const exercisesInCategory = EXERCISES.filter((e) => e.category === activeCategory);
  const grouped = exercisesInCategory.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const key = ex.group ?? activeCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex); return acc;
  }, {});
  const catConfig = CATEGORY_CONFIG[activeCategory];

  return (
    <SafeAreaView style={fs.safeArea}>
      <View style={fs.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={fs.headerTitle}>STRENGTH TRAINING</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={fs.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={fs.sectionLabel}>TRAINING CONTEXT</Text>
        <View style={fs.contextList}>
          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const active = activeCategory === cat;
            return (
              <TouchableOpacity key={cat} style={[fs.contextItem, active && fs.contextItemActive]} onPress={() => handleCategoryChange(cat)} activeOpacity={0.75}>
                <View style={[fs.radio, active && { borderColor: '#2E7D32' }]}>
                  {active && <View style={fs.radioDot} />}
                </View>
                <View style={fs.categoryTabContent}>
                  {(() => {
                    const IconComp = CATEGORY_ICONS[cat];
                    return IconComp ? (
                      <IconComp size={16} color={cfg.color} />
                    ) : null;
                  })()}
                  <Text style={[fs.contextLabel, active && fs.contextLabelActive]}>{cat}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={fs.sectionLabel}>EXERCISES</Text>
        <View style={[fs.catDescBox, { borderLeftColor: catConfig.color }]}>
          <Text style={[fs.catDescText, { color: catConfig.color }]}>{catConfig.desc}</Text>
        </View>

        {Object.entries(grouped).map(([groupName, exercises]) => (
          <View key={groupName} style={fs.groupBlock}>
            {exercises[0].group && <Text style={fs.groupTitle}>{groupName}</Text>}
            {exercises.map((exercise) => {
              const selected = isSelected(exercise.id);
              const selData = selectedExercises.find((e) => e.exercise.id === exercise.id);
              const isDuration = exercise.inputType === 'duration';
              return (
                <View key={exercise.id}>
                  <TouchableOpacity
                    style={[fs.exerciseRow, selected && { borderColor: catConfig.color, backgroundColor: '#F9FFF9' }]}
                    onPress={() => toggleExercise(exercise)} activeOpacity={0.75}
                  >
                    <View style={fs.exerciseLeft}>
                      {/* Ikon kecil penanda tipe */}
                      <Ionicons
                        name={isDuration ? 'timer-outline' : 'repeat-outline'}
                        size={16} color={isDuration ? '#007AFF' : '#FF6B35'}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[fs.exerciseName, selected && { color: '#1A1A2E', fontWeight: '700' }]}>
                        {exercise.name}
                      </Text>
                    </View>
                    <View style={fs.exerciseRight}>
                      {selected && selData && (
                        <Text style={[fs.setsBadge, { color: catConfig.color }]}>{selData.sets.length} Sets</Text>
                      )}
                      {selected ? (
                        <TouchableOpacity onPress={() => toggleExpand(exercise.id)}>
                          <Ionicons name={selData?.expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="add-circle-outline" size={20} color="#BBB" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {selected && selData?.expanded && (
                    <View style={fs.setsContainer}>
                      {/* Header kolom — berubah sesuai tipe */}
                      <View style={fs.setsHeader}>
                        <Text style={[fs.setsHeaderCell, { width: 36 }]}>SET</Text>
                        <Text style={[fs.setsHeaderCell, { flex: 1 }]}>
                          {isDuration ? 'DURASI (detik)' : 'REPETISI'}
                        </Text>
                        <View style={{ width: 44 }} />
                      </View>

                      {selData.sets.map((s, idx) => (
                        <View key={idx} style={fs.setRow}>
                          <View style={[fs.setNumberBox, { backgroundColor: catConfig.color + '22' }]}>
                            <Text style={[fs.setNumber, { color: catConfig.color }]}>{s.set}</Text>
                          </View>
                          <View style={fs.setInputBox}>
                            <TextInput
                              style={fs.setInput}
                              keyboardType="number-pad"
                              value={isDuration ? s.duration : s.reps}
                              onChangeText={(v) => updateSet(exercise.id, idx, isDuration ? 'duration' : 'reps', v)}
                            />
                          </View>
                          {/* Satuan */}
                          <Text style={fs.setUnitLabel}>{isDuration ? 'dtk' : 'reps'}</Text>
                          {/* Hapus */}
                          <TouchableOpacity onPress={() => removeSet(exercise.id, idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={selData.sets.length <= 1}>
                            <Ionicons name="trash-outline" size={16} color={selData.sets.length <= 1 ? '#DDD' : '#FF3B30'} />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity style={fs.addSetBtn} onPress={() => addSet(exercise.id)}>
                        <Ionicons name="add" size={16} color={catConfig.color} />
                        <Text style={[fs.addSetText, { color: catConfig.color }]}>Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {error ? <Text style={fs.errorText}>{error}</Text> : null}

        <View style={fs.fieldGroup}>
          <Text style={fs.fieldLabel}>NOTES</Text>
          <TextInput style={fs.textArea} placeholder="Otot mana yang dilatih? Tingkat kelelahan?" placeholderTextColor="#BBB" multiline numberOfLines={3} value={notes} onChangeText={setNotes} />
        </View>

        {selectedExercises.length > 0 && (
          <View style={fs.summaryBox}>
            <Text style={fs.summaryTitle}>RINGKASAN</Text>
            <View style={fs.summaryRow}>
              <View style={fs.summaryItem}>
                <Text style={fs.summaryLabel}>EXERCISE</Text>
                <Text style={fs.summaryValue}>{selectedExercises.length}</Text>
              </View>
              <View style={fs.summaryDivider} />
              <View style={fs.summaryItem}>
                <Text style={fs.summaryLabel}>TOTAL SETS</Text>
                <Text style={fs.summaryValue}>{totalSets}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={fs.footer}>
        <TouchableOpacity style={fs.saveButton} onPress={handlePreview} activeOpacity={0.85}>
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={fs.saveButtonText}>{isEditing ? 'Lihat & Simpan Perubahan' : 'Lihat Preview'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles Preview ───────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F3F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  heroCard: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 20, paddingBottom: 24, gap: 10 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#4CD964', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#1A1A2E', letterSpacing: 1 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.6 },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  exerciseList: { gap: 10 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 },
  thumbnail: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  thumbnailImage: { width: '100%', height: '100%', borderRadius: 12 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  exerciseSets: { fontSize: 13, color: '#888', fontWeight: '500', marginTop: 2 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF1EC', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeDuration: { backgroundColor: '#EEF4FF' },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF6B35' },
  quote: { textAlign: 'center', fontSize: 13, color: '#AAA', fontStyle: 'italic', paddingHorizontal: 16, paddingVertical: 8 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: '#F2F3F5' },
  startBtn: { backgroundColor: '#4CD964', borderRadius: 50, paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.3 },
});

// ─── Styles Form ──────────────────────────────────────────────────────────────
const fs = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', letterSpacing: 1 },
  form: { padding: 16, gap: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  contextList: { gap: 8 },
  contextItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#EEEEEE', backgroundColor: '#FFFFFF' },
  contextItemActive: { borderColor: '#2E7D32', backgroundColor: '#F0FFF4' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCCCCC', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  categoryTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contextLabel: { fontSize: 15, fontWeight: '500', color: '#555' },
  contextLabelActive: { fontWeight: '700', color: '#1A1A2E' },
  catDescBox: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4 },
  catDescText: { fontSize: 13, fontWeight: '600' },
  groupBlock: { gap: 0 },
  groupTitle: { fontSize: 11, fontWeight: '700', color: '#AAA', paddingVertical: 8, paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#F0F0F0', marginBottom: 6 },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: '500', color: '#555' },
  exerciseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setsBadge: { fontSize: 12, fontWeight: '700' },
  setsContainer: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, marginBottom: 8, marginTop: -4, gap: 8 },
  setsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  setsHeaderCell: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNumberBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  setNumber: { fontSize: 14, fontWeight: '800' },
  setInputBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E8E8E8' },
  setInput: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#1A1A2E', paddingVertical: 10 },
  setUnitLabel: { fontSize: 12, color: '#AAA', fontWeight: '600', width: 36, textAlign: 'center' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: '#DDD', borderRadius: 8 },
  addSetText: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 12, color: '#FF3B30', textAlign: 'center' },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  textArea: { backgroundColor: '#F4F4F4', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A1A2E', minHeight: 80, textAlignVertical: 'top' },
  summaryBox: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, gap: 12 },
  summaryTitle: { fontSize: 11, fontWeight: '700', color: '#FFFFFF99', letterSpacing: 0.8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#FFFFFF22' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#FFFFFF88', letterSpacing: 0.5 },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  footer: { padding: 20, paddingBottom: 28 },
  saveButton: { backgroundColor: '#1A1A2E', borderRadius: 50, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});