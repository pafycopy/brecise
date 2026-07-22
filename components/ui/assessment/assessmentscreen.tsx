import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, TextInput,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AssessmentData, RunningLevel, RunningGoal,
  FurthestRun, TrainingTime, ActivityLevel, InjuryHistory,
} from '@/store/assessmentStore';

type Props = {
  onComplete: (data: AssessmentData) => void;
  onClose?: () => void;
};

const TOTAL_STEPS = 6;

// ─── Progress bar ─────────────────────────────────────────────────────────
const ProgressBar = ({ step }: { step: number }) => (
  <View style={pb.container}>
    <Text style={pb.label}>LANGKAH {step} DARI {TOTAL_STEPS}</Text>
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
    </View>
  </View>
);

const pb = StyleSheet.create({
  container: { gap: 6, marginBottom: 24 },
  label:     { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.8, fontFamily: 'Lexend-Bold' },
  track:     { height: 4, backgroundColor: '#EEEEEE', borderRadius: 2, overflow: 'hidden' },
  fill:      { height: '100%', backgroundColor: '#2E7D32', borderRadius: 2 },
});

// ─── Option card ──────────────────────────────────────────────────────────
const OptionCard = ({
  selected, onPress, title, subtitle, icon,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
}) => (
  <TouchableOpacity
    style={[oc.card, selected && oc.cardSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={oc.left}>
      {icon && (
        <View style={[oc.iconBox, selected && oc.iconBoxSelected]}>
          <Ionicons name={icon as any} size={18} color={selected ? '#2E7D32' : '#888'} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[oc.title, selected && oc.titleSelected]}>{title}</Text>
        {subtitle && <Text style={oc.subtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={[oc.radio, selected && oc.radioSelected]}>
      {selected && <View style={oc.radioDot} />}
    </View>
  </TouchableOpacity>
);

const oc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#EEEEEE',
  },
  cardSelected: { borderColor: '#2E7D32', backgroundColor: '#F0FFF4' },
  left:         { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  iconBoxSelected: { backgroundColor: '#DCFCE7' },
  title:        { fontSize: 15, fontWeight: '600', color: '#111', fontFamily: 'Lexend-Bold' },
  titleSelected: { fontWeight: '700', color: '#1A1A2E', fontFamily: 'Lexend-Bold' },
  subtitle:     { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 17, fontFamily: 'Lexend-Regular' },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#2E7D32' },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
});

// ─── Injury grid options ────────────────────────────────────────────────────
// 6 opsi (dulu 4) — nambah "Pinggul" & "Punggung" sesuai desain baru.
const INJURY_OPTIONS: { key: InjuryHistory; label: string }[] = [
  { key: 'knee',         label: 'Lutut' },
  { key: 'hip',          label: 'Pinggul' },
  { key: 'shin_splints', label: 'Tulang Kering' },
  { key: 'ankle',        label: 'Pergelangan Kaki' },
  { key: 'back',         label: 'Punggung' },
  { key: 'other',        label: 'Lainnya' },
];

// ─── Main component ───────────────────────────────────────────────────────
export default function AssessmentScreen({ onComplete, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const [step, setStep]               = useState(1);
  const [level, setLevel]             = useState<RunningLevel | null>(null);
  const [goal, setGoal]               = useState<RunningGoal | null>(null);
  const [furthestRun, setFurthestRun] = useState<FurthestRun | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [preferredTime, setPreferredTime] = useState<TrainingTime | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [injury, setInjury]           = useState<InjuryHistory | null>(null);
  // ✅ NEW: catatan bebas soal cedera, ditampilkan setelah user pilih salah
  // satu opsi cedera (selain "Tidak Ada Cedera").
  const [injuryNote, setInjuryNote]   = useState('');
  const [injuryNoteFocused, setInjuryNoteFocused] = useState(false);

  const canContinue = () => {
    if (step === 1) return !!level;
    if (step === 2) return !!goal;
    if (step === 3) return !!furthestRun;
    if (step === 4) return !!preferredTime;
    if (step === 5) return !!activityLevel;
    if (step === 6) return !!injury;
    return false;
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      onComplete({
        level:         level!,
        goal:          goal!,
        furthestRun:   furthestRun!,
        daysPerWeek,
        preferredTime: preferredTime!,
        activityLevel: activityLevel!,
        injury:        injury!,
        injuryNote:    injuryNote.trim() ? injuryNote.trim() : undefined,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose?.();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        {step > 1 || onClose ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name={step > 1 ? 'arrow-back' : 'close'} size={22} color="#111" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProgressBar step={step} />

        {/* ── STEP 1: Level ─────────────────────────────────── */}
        {step === 1 && (
          <>
            <Text style={styles.title}>Choose Your Level</Text>
            <Text style={styles.subtitle}>
              We'll build a plan that fits your current ability
            </Text>
            <View style={styles.options}>
              <OptionCard
                selected={level === 'beginner'}
                onPress={() => setLevel('beginner')}
                icon="walk"
                title="Beginner"
                subtitle="New to running or building consistency"
              />
              <OptionCard
                selected={level === 'intermediate'}
                onPress={() => setLevel('intermediate')}
                icon="bicycle"
                title="Intermediate"
                subtitle="Running regularly and improving pace"
              />
              <OptionCard
                selected={level === 'advanced'}
                onPress={() => setLevel('advanced')}
                icon="flash"
                title="Advanced"
                subtitle="Experienced runner, focused on performance"
              />
            </View>
          </>
        )}

        {/* ── STEP 2: Tujuan ────────────────────────────────── */}
        {step === 2 && (
          <>
            <Text style={styles.title}>Apa tujuan utama{'\n'}Anda?</Text>
            <Text style={styles.subtitle}>
              Pilih satu target agar kami dapat menyesuaikan program latihan Anda.
            </Text>
            <View style={styles.options}>
              <OptionCard
                selected={goal === 'start_running'}
                onPress={() => setGoal('start_running')}
                icon="walk"
                title="Mulai Berlari"
                subtitle="pemula yang belum pernah berlari atau baru memulai"
              />
              <OptionCard
                selected={goal === 'weight_loss'}
                onPress={() => setGoal('weight_loss')}
                icon="scale"
                title="Turunkan berat badan"
                subtitle="Fokus pembakaran kalori & konsistensi ringan"
              />
              <OptionCard
                selected={goal === 'stamina'}
                onPress={() => setGoal('stamina')}
                icon="trending-up"
                title="Tingkatkan stamina"
                subtitle="Bangun daya tahan untuk lari lebih lama"
              />
              <OptionCard
                selected={goal === 'target_5k'}
                onPress={() => setGoal('target_5k')}
                icon="flag"
                title="Target 5K"
                subtitle="Siap lari 5 km tanpa berhenti (±4–8 minggu)"
              />
              <OptionCard
                selected={goal === 'target_10k'}
                onPress={() => setGoal('target_10k')}
                icon="trophy"
                title="Target 10K"
                subtitle="Program bertahap menuju 10 km (butuh komitmen lebih)"
              />
            </View>
          </>
        )}

        {/* ── STEP 3: Titik tempuh ──────────────────────────── */}
        {step === 3 && (
          <>
            <Text style={styles.title}>Sejauh mana Anda mampu{'\n'}berlari saat ini?</Text>
            <Text style={styles.subtitle}>
              Tidak perlu sempurna. Kami hanya ingin tahu titik awal Anda.
            </Text>
            <View style={styles.options}>
              {([
                { key: 'less_1k',  label: 'Belum sampai 1 km' },
                { key: '1_3k',    label: 'Sekitar 1–3 km' },
                { key: 'more_3k', label: 'Lebih dari 3 km' },
                { key: 'unknown', label: 'Saya belum tahu', sub: 'Tidak yakin? Kami akan membantu menentukan kemampuan awal Anda bersama.' },
              ] as { key: FurthestRun; label: string; sub?: string }[]).map((opt) => (
                <OptionCard
                  key={opt.key}
                  selected={furthestRun === opt.key}
                  onPress={() => setFurthestRun(opt.key)}
                  title={opt.label}
                  subtitle={opt.sub}
                />
              ))}
            </View>
          </>
        )}

        {/* ── STEP 4: Preferensi latihan ────────────────────── */}
        {step === 4 && (
          <>
            <Text style={styles.title}>Preferensi{'\n'}Latihan Anda</Text>
            <Text style={styles.subtitle}>
              Sesuaikan rutinitas agar sesuai dengan gaya hidup Anda.
            </Text>

            {/* Hari per minggu */}
            <Text style={styles.sectionLabel}>Hari per minggu</Text>
            <View style={styles.dayRow}>
              {[2, 3, 4, 5, 6].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, daysPerWeek === d && styles.dayBtnSelected]}
                  onPress={() => setDaysPerWeek(d)}
                >
                  <Text style={[styles.dayBtnText, daysPerWeek === d && styles.dayBtnTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Waktu pilihan */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Waktu pilihan</Text>
            <View style={styles.timeRow}>
              {([
                { key: 'pagi',   label: 'Pagi',  icon: 'sunny' },
                { key: 'siang',  label: 'Siang', icon: 'partly-sunny' },
                { key: 'malam',  label: 'Malam', icon: 'moon' },
              ] as { key: TrainingTime; label: string; icon: string }[]).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.timeBtn, preferredTime === t.key && styles.timeBtnSelected]}
                  onPress={() => setPreferredTime(t.key)}
                >
                  <Ionicons name={t.icon as any} size={20} color={preferredTime === t.key ? '#2E7D32' : '#888'} />
                  <Text style={[styles.timeBtnText, preferredTime === t.key && styles.timeBtnTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── STEP 5: Aktivitas harian ──────────────────────── */}
        {step === 5 && (
          <>
            <Text style={styles.title}>Tingkat Aktivitas{'\n'}Harian</Text>
            <Text style={styles.subtitle}>
              Seberapa aktif Anda dalam sehari-hari?
            </Text>
            <View style={styles.options}>
              <OptionCard
                selected={activityLevel === 'sedentary'}
                onPress={() => setActivityLevel('sedentary')}
                icon="desktop"
                title="Kurang Aktif"
                subtitle="Sebagian besar waktu dihabiskan untuk duduk atau bekerja di depan meja."
              />
              <OptionCard
                selected={activityLevel === 'active'}
                onPress={() => setActivityLevel('active')}
                icon="walk"
                title="Cukup Aktif"
                subtitle="Banyak berjalan atau bergerak selama bekerja maupun beraktivitas sehari-hari."
              />
              <OptionCard
                selected={activityLevel === 'very_active'}
                onPress={() => setActivityLevel('very_active')}
                icon="barbell"
                title="Sangat Aktif"
                subtitle="Pekerjaan fisik berat atau rutin melakukan aktivitas fisik hampir setiap hari"
              />
            </View>
          </>
        )}

        {/* ── STEP 6: Riwayat cedera ─────────────────────────── */}
        {step === 6 && (
          <>
            <Text style={styles.title}>Riwayat Cedera</Text>
            <Text style={styles.subtitle}>
              Apakah Anda sedang mengalami cedera atau masih memiliki keluhan saat berolahraga?
            </Text>

            {/* Tidak ada cedera — highlight */}
            <TouchableOpacity
              style={[styles.noInjuryCard, injury === 'none' && styles.noInjuryCardSelected]}
              onPress={() => { setInjury('none'); setInjuryNote(''); }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={22} color={injury === 'none' ? '#2E7D32' : '#888'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noInjuryTitle, injury === 'none' && { color: '#2E7D32' }]}>
                  Tidak Ada Cedera
                </Text>
                <Text style={styles.noInjurySub}>Saya dalam kondisi sehat dan siap berolahraga.</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.orLabel}>— ATAU PILIH JIKA ADA —</Text>

            <View style={styles.injuryGrid}>
              {INJURY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.injuryBtn, injury === opt.key && styles.injuryBtnSelected]}
                  onPress={() => setInjury(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.injuryLabel, injury === opt.key && styles.injuryLabelSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ✅ NEW: input penjelasan, muncul setelah pilih salah satu cedera */}
            {injury && injury !== 'none' && (
              <TextInput
                style={[styles.injuryInput, injuryNoteFocused && styles.injuryInputFocused]}
                placeholder="Jelaskan cedera Anda"
                placeholderTextColor="#AAA"
                value={injuryNote}
                onChangeText={setInjuryNote}
                onFocus={() => setInjuryNoteFocused(true)}
                onBlur={() => setInjuryNoteFocused(false)}
                multiline
              />
            )}

            <Text style={styles.injuryNote}>
              Kami akan menyesuaikan latihan agar tetap aman untuk Anda.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Continue button */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue() && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue()}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {step === TOTAL_STEPS ? 'BUAT PROGRAM SAYA' : 'CONTINUE'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#FFFFFF' },
  header:  { paddingHorizontal: 20, paddingBottom: 4, zIndex: 10, position: 'relative' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 100 },

  title:      { fontSize: 28, fontWeight: '800', color: '#111', lineHeight: 36, marginBottom: 8, fontFamily: 'Lexend-Black' },
  titleLarge: { fontSize: 26, fontWeight: '800', color: '#111', lineHeight: 34, marginBottom: 8, fontFamily: 'Lexend-Black' },
  subtitle:   { fontSize: 14, lineHeight: 22, color: '#666', marginBottom: 24, fontFamily: 'Lexend-Regular' },
  options:    { gap: 0 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12, fontFamily: 'Lexend-Bold' },

  // Days selector
  dayRow:    { flexDirection: 'row', gap: 10 },
  dayBtn:    { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  dayBtnSelected: { backgroundColor: '#2E7D32' },
  dayBtnText: { fontSize: 16, fontWeight: '700', color: '#555', fontFamily: 'Lexend-Bold' },
  dayBtnTextSelected: { color: '#FFFFFF', fontFamily: 'Lexend-Bold' },

  // Time selector
  timeRow:   { flexDirection: 'row', gap: 10 },
  timeBtn:   { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F4F4F4', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'transparent' },
  timeBtnSelected: { backgroundColor: '#F0FFF4', borderColor: '#2E7D32' },
  timeBtnText: { fontSize: 12, fontWeight: '600', color: '#888', fontFamily: 'Lexend-Bold' },
  timeBtnTextSelected: { color: '#2E7D32', fontWeight: '700', fontFamily: 'Lexend-Bold' },

  // No injury card
  noInjuryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F4F4F4', borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: 'transparent', marginBottom: 16,
  },
  noInjuryCardSelected: { backgroundColor: '#F0FFF4', borderColor: '#2E7D32' },
  noInjuryTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2, fontFamily: 'Lexend-Bold' },
  noInjurySub:   { fontSize: 12, color: '#888', fontFamily: 'Lexend-Regular' },
  orLabel: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#BBB', letterSpacing: 0.5, marginBottom: 14, fontFamily: 'Lexend-Bold' },

  // Injury grid — sekarang teks polos tanpa icon, 6 opsi 2 kolom
  injuryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  injuryBtn:  {
    width: '47%', backgroundColor: '#F4F4F4', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  injuryBtnSelected: { backgroundColor: '#F0FFF4', borderColor: '#2E7D32' },
  injuryLabel: { fontSize: 13, fontWeight: '600', color: '#555', textAlign: 'center', fontFamily: 'Lexend-Bold' },
  injuryLabelSelected: { color: '#2E7D32', fontWeight: '700', fontFamily: 'Lexend-Bold' },
  injuryNote:  { fontSize: 12, color: '#AAA', textAlign: 'center', lineHeight: 18, fontFamily: 'Lexend-Regular' },

  // ✅ NEW: input penjelasan cedera
  injuryInput: {
    borderWidth: 1.5, borderColor: '#EEEEEE', borderRadius: 14,
    padding: 14, fontSize: 14, color: '#111', marginBottom: 16,
    fontFamily: 'Lexend-Regular', minHeight: 52, textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  injuryInputFocused: { borderColor: '#2E7D32', backgroundColor: '#FFFFFF' },

  // Footer
  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  continueBtn: { backgroundColor: '#2E7D32', borderRadius: 40, paddingVertical: 16, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: '#C8E6C9' },
  continueBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'Lexend-Black' },
});