import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AssessmentData } from '@/store/assessmentStore';
import { generateProgram, GeneratedDay } from '@/utils/generateProgram';

type Props = {
  assessment: AssessmentData;
  onConfirm:  (days: GeneratedDay[]) => void;
};

const GOAL_LABEL: Record<string, string> = {
  weight_loss: 'Turunkan Berat Badan',
  stamina:     'Tingkatkan Stamina',
  target_5k:  'Target 5K',
  target_10k: 'Target 10K',
};

const LEVEL_LABEL: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
};

const DAYS_LABEL: Record<string, string> = {
  '2': '2x', '3': '3x', '4': '4x', '5': '5x', '6': '6x',
};

const WORKOUT_COLOR: Record<string, string> = {
  'Easy Run':          '#D9E2FF',
  'Long Run':          '#DDFFE2',
  'Tempo Run':         '#C8F5C8',
  'Interval Run':      '#f3c0c0',
  'Strength Training': '#FFE5D6',
};

const WORKOUT_ICON: Record<string, string> = {
  'Easy Run':          'walk',
  'Long Run':          'walk',
  'Tempo Run':         'speedometer',
  'Interval Run':      'timer',
  'Strength Training': 'barbell',
};

export default function ProgramResultScreen({ assessment, onConfirm }: Props) {
  const [program, setProgram] = useState<GeneratedDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading generate
    const timer = setTimeout(() => {
      // Urutkan berdasarkan tanggal agar diffDays tidak negatif
      const generated = generateProgram(assessment).sort(
        (a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
      );
      setProgram(generated);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Group by minggu
  const byWeek: Record<number, GeneratedDay[]> = { 1: [], 2: [], 3: [], 4: [] };
  program.forEach((day) => {
    const startDate = new Date(program[0]?.dateKey);
    const thisDate  = new Date(day.dateKey);
    const diffDays  = Math.floor((thisDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const week      = Math.max(1, Math.min(4, Math.floor(diffDays / 7) + 1));
    
    if (byWeek[week]) {
      byWeek[week].push(day);
    }
  });

  const firstRun = program.find((d) => d.workout.workoutType !== 'Strength Training');
  const firstDist = firstRun?.workout.distance ?? '-';

  // Hitung weekly preview
  const weeklyCount = assessment.daysPerWeek;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingTitle}>Rencana Anda{'\n'}Sedang Dibuat...</Text>
          <Text style={styles.loadingDesc}>
            Kami akan mulai dengan lari ringan sejauh {firstDist} km,{' '}
            sebanyak {weeklyCount} kali seminggu. Program ini menggunakan
            metode run-walk agar tubuh Anda bisa beradaptasi dengan aman
            dan mengurangi risiko cedera.
          </Text>
          <View style={styles.loadingDots}>
            <Ionicons name="checkmark-circle" size={16} color="#4CD964" />
            <Text style={styles.loadingDotText}>Safety</Text>
          </View>
          <View style={styles.loadingDots}>
            <Ionicons name="trending-up" size={16} color="#4CD964" />
            <Text style={styles.loadingDotText}>Progression</Text>
          </View>
          <View style={styles.loadingDots}>
            <Ionicons name="refresh" size={16} color="#4CD964" />
            <Text style={styles.loadingDotText}>Adaptivity</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Text style={styles.heroTitle}>Program 4 Minggu{'\n'}Anda Siap! 🎉</Text>
        <Text style={styles.heroDesc}>
          Disesuaikan untuk {LEVEL_LABEL[assessment.level]} · {GOAL_LABEL[assessment.goal]}
        </Text>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar" size={18} color="#2E7D32" />
              <Text style={styles.summaryLabel}>WEEKLY PREVIEW</Text>
              <Text style={styles.summaryValue}>{weeklyCount}x Seminggu</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="walk" size={18} color="#2E7D32" />
              <Text style={styles.summaryLabel}>ESTIMATED FIRST RUN</Text>
              <Text style={styles.summaryValue}>{firstDist} km</Text>
              <Text style={styles.summaryNote}>Pace Santai</Text>
            </View>
          </View>

          {assessment.injury !== 'none' && (
            <View style={styles.injuryNote}>
              <Ionicons name="information-circle" size={14} color="#F97316" />
              <Text style={styles.injuryNoteText}>
                Program disesuaikan dengan riwayat cedera Anda.
              </Text>
            </View>
          )}
        </View>

        {/* Preview per minggu */}
        {([1, 2, 3, 4] as const).map((week) => (
          <View key={week} style={styles.weekBlock}>
            <Text style={styles.weekTitle}>Minggu {week}</Text>
            {byWeek[week].map((day, i) => {
              const date = new Date(day.dateKey);
              const dayName = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
              const type    = day.workout.workoutType;
              return (
                <View key={i} style={styles.dayRow}>
                  <View style={[styles.dayIcon, { backgroundColor: WORKOUT_COLOR[type] ?? '#F4F4F4' }]}>
                    <Ionicons name={WORKOUT_ICON[type] as any ?? 'fitness'} size={14} color="#111" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayType}>{type}</Text>
                    <Text style={styles.dayDate}>{dayName}</Text>
                  </View>
                  {day.workout.distance ? (
                    <Text style={styles.dayDist}>{day.workout.distance} km</Text>
                  ) : (
                    <Text style={styles.dayDist}>{day.workout.duration?.min} min</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Features */}
        <View style={styles.featuresCard}>
          {[
            { icon: 'shield-checkmark', label: 'Safety',      desc: 'Dirancang khusus untuk ' + LEVEL_LABEL[assessment.level] },
            { icon: 'trending-up',      label: 'Progression', desc: 'Akan meningkat secara bertahap setiap minggu' },
            { icon: 'refresh',          label: 'Adaptivity',  desc: 'Program akan menyesuaikan dengan performa Anda' },
          ].map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Ionicons name={f.icon as any} size={16} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => onConfirm(program)}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>MULAI PROGRAM SAYA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 120 },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  loadingTitle:     { fontSize: 28, fontWeight: '800', color: '#111', textAlign: 'center', lineHeight: 36 },
  loadingDesc:      { fontSize: 14, lineHeight: 22, color: '#666', textAlign: 'center' },
  loadingDots:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingDotText:   { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  // Hero
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#111', lineHeight: 36, marginBottom: 8 },
  heroDesc:  { fontSize: 14, color: '#666', marginBottom: 24 },

  // Summary
  summaryCard: { backgroundColor: '#F0FFF4', borderRadius: 20, padding: 20, marginBottom: 24, gap: 12 },
  summaryRow:  { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, height: 60, backgroundColor: '#C8E6C9' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#2E7D32', letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#111' },
  summaryNote:  { fontSize: 11, color: '#888' },
  injuryNote:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10 },
  injuryNoteText: { fontSize: 12, color: '#F97316', flex: 1 },

  // Week
  weekBlock: { marginBottom: 20 },
  weekTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 10, letterSpacing: 0.3 },
  dayRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dayIcon:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayType:   { fontSize: 13, fontWeight: '700', color: '#111' },
  dayDate:   { fontSize: 11, color: '#888', marginTop: 1 },
  dayDist:   { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  // Features
  featuresCard: { backgroundColor: '#F4F4F4', borderRadius: 16, padding: 16, gap: 14 },
  featureRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  featureDesc:  { fontSize: 12, color: '#666', marginTop: 2 },

  // Footer
  footer:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  startBtn: { backgroundColor: '#2E7D32', borderRadius: 40, paddingVertical: 16, alignItems: 'center' },
  startBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});