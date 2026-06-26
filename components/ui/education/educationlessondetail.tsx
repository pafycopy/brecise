import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  EXERCISES, CATEGORY_CONFIG,
  ExerciseCategory, Exercise,
} from '@/constants/strengthdata';

// ─── Config per kategori ──────────────────────────────────────────────────────
const CATEGORY_META: Record<ExerciseCategory, {
  accentColor: string;
  dotColor: string;
  level: string;
  freq: string;
  benefits: string[];
}> = {
  Strength: {
    accentColor: '#FF6B35',
    dotColor: '#4CD964',
    level: 'Pemula',
    freq: '2-3x per week',
    benefits: [
      'Meningkatkan stabilitas lutut',
      'Membantu efisiensi langkah kaki',
      'Membangun kekuatan dasar kaki',
    ],
  },
  Core: {
    accentColor: '#4CD964',
    dotColor: '#4CD964',
    level: 'Pemula',
    freq: '3-4x per week',
    benefits: [
      'Menjaga postur tubuh saat berlari',
      'Mencegah cedera punggung bawah',
      'Meningkatkan keseimbangan tubuh',
    ],
  },
  Mobility: {
    accentColor: '#007AFF',
    dotColor: '#007AFF',
    level: 'Semua Level',
    freq: 'Setiap hari',
    benefits: [
      'Meningkatkan rentang gerak sendi',
      'Mengurangi kekakuan otot',
      'Mencegah cedera saat berlari',
    ],
  },
  Recovery: {
    accentColor: '#9C27B0',
    dotColor: '#9C27B0',
    level: 'Semua Level',
    freq: 'Setelah latihan',
    benefits: [
      'Mempercepat pemulihan otot',
      'Mengurangi kekakuan pasca lari',
      'Merelaksasi otot yang tegang',
    ],
  },
};

// ─── Meta per group (tab) — override card saat tab dipilih ──────────────────
const GROUP_META: Record<string, {
  title: string;
  level: string;
  dotColor: string;
  freq: string;
  benefits: string[];
}> = {
  'Lower Body': {
    title: 'Otot Kaki & Inti',
    level: 'Pemula',
    dotColor: '#4CD964',
    freq: '2-3x per week',
    benefits: [
      'Meningkatkan stabilitas lutut',
      'Membantu efisiensi langkah kaki',
      'Membangun kekuatan dasar kaki',
    ],
  },
  'Balance': {
    title: 'Otot Kaki & Inti',
    level: 'Pemula',
    dotColor: '#4CD964',
    freq: '1-2x per week',
    benefits: [
      'Tingkatkan stabilitas & kendali',
    ],
  },
  'Plyometric': {
    title: 'Otot Kaki & Inti',
    level: 'Menengah',
    dotColor: '#FCD53F',
    freq: '1-2x per week',
    benefits: [
      'Melatih respon dan kecepatan kaki',
      'Meningkatkan effesiensi langkah lari',
      'Mengembangkan elastisitas otot',
    ],
  },
};

// ─── Exercise Detail Modal ────────────────────────────────────────────────────
function ExerciseDetailModal({
  exercise, onClose,
}: { exercise: Exercise | null; onClose: () => void }) {
  if (!exercise) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={d.safe}>
        <View style={d.header}>
          <TouchableOpacity onPress={onClose} style={d.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={d.content} showsVerticalScrollIndicator={false}>
          <Text style={d.exerciseName}>{exercise.name}</Text>

          {exercise.gifUrl ? (
            <Image source={{ uri: exercise.gifUrl }} style={d.mediaImage} resizeMode="cover" />
          ) : (
            <View style={d.mediaBox}>
              <Ionicons name="image-outline" size={40} color="#BBB" />
            </View>
          )}

          {exercise.description ? (
            <View style={d.card}>
              <Text style={d.description}>
                <Text style={d.descBold}>{exercise.name} </Text>
                {exercise.description.replace(exercise.name, '').trimStart()}
              </Text>
            </View>
          ) : null}

          {exercise.muscles && exercise.muscles.length > 0 && (
            <View style={d.card}>
              <View style={d.sectionLabelRow}>
                <Ionicons name="body-outline" size={14} color="#888" />
                <Text style={d.sectionLabel}>AREA FOKUS</Text>
              </View>
              <View style={d.tagWrap}>
                {exercise.muscles.map((m) => (
                  <View key={m} style={d.tag}>
                    <Text style={d.tagText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {exercise.benefits && exercise.benefits.length > 0 && (
            <View style={d.section}>
              <Text style={d.sectionLabel}>MANFAAT BAGI PELARI</Text>
              {exercise.benefits.map((b, i) => (
                <View key={i} style={d.benefitRow}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#006E2F" />
                  <Text style={d.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
import { EducationLesson, EducationTopic } from '@/constants/educationdata';

type Props = {
  category?: ExerciseCategory;
  title?: string;
  subtitle?: string;
  lesson?: EducationLesson;
  topic?: EducationTopic;
  onBack: () => void;
};

export default function EducationLessonDetail({ category, title, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const allExercises = category ? EXERCISES.filter((e) => e.category === category) : [];
  // Ambil meta group yang sedang aktif (saat tab dipilih)
  const activeGroupMeta = activeTab ? GROUP_META[activeTab] ?? null : null;
  const groups = Array.from(new Set(allExercises.map((e) => e.group).filter(Boolean))) as string[];
  const filtered = activeTab ? allExercises.filter((e) => e.group === activeTab) : allExercises;

  const meta = category ? CATEGORY_META[category] : null;
  const cfg  = category ? CATEGORY_CONFIG[category] : null;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Card — putih, teks gelap, dekorasi hijau muda ── */}
        {meta && cfg && (
          <View style={s.heroCard}>
            {/* Dekorasi lingkaran sudut kanan atas */}
            <View style={[s.decoCircle1, { backgroundColor: meta.dotColor + '22' }]} pointerEvents="none" />
            <View style={[s.decoCircle2, { backgroundColor: meta.dotColor + '15' }]} pointerEvents="none" />

            {/* Nama kategori — berubah sesuai tab aktif */}
            <Text style={s.heroTitle}>{activeGroupMeta?.title ?? title ?? cfg.desc}</Text>

            {/* Badge level & frekuensi */}
            <View style={s.heroBadgeRow}>
              <View style={s.heroBadgeLevel}>
                <View style={[s.heroBadgeDot, { backgroundColor: activeGroupMeta?.dotColor ?? meta.dotColor }]} />
                <Text style={s.heroBadgeLevelText}>{activeGroupMeta?.level ?? meta.level}</Text>
              </View>
              <View style={s.heroBadgeFreq}>
                <Text style={s.heroBadgeFreqText}>{activeGroupMeta?.freq ?? meta.freq}</Text>
              </View>
            </View>

            {/* List manfaat — berubah sesuai tab aktif */}
            <View style={s.heroBenefits}>
              {(activeGroupMeta?.benefits ?? meta.benefits).map((b, i) => (
                <Text key={i} style={s.heroBenefitText}>{b}</Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Tab filter group ── */}
        {groups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
            <View style={s.tabRow}>
              {groups.map((group) => {
                const active = activeTab === group;
                return (
                  <TouchableOpacity
                    key={group}
                    style={[s.tabBtn, active && s.tabBtnActive]}
                    onPress={() => setActiveTab(active ? null : group)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.tabText, active && s.tabTextActive]}>{group}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ── List exercise ── */}
        {filtered.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={s.exerciseRow}
            onPress={() => setSelectedExercise(exercise)}
            activeOpacity={0.75}
          >
            <View style={s.exerciseLeft}>
              <Text style={s.exerciseName}>{exercise.name}</Text>
            </View>
            <View style={s.viewDetailBtn}>
              <Text style={s.viewDetailText}>Lihat Detail</Text>
              <Ionicons name="chevron-forward" size={14} color="#888" />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>

      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles — Detail Modal ────────────────────────────────────────────────────
const d = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },
  exerciseName: { fontSize: 34, fontWeight: '900', color: '#111', textAlign: 'center' },
  mediaBox: {
    height: 200, borderRadius: 16, backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaImage: { width: '100%', height: 200, borderRadius: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  description: { fontSize: 15, lineHeight: 24, color: '#444', textAlign: 'center' },
  descBold: { fontWeight: '700', color: '#111' },
  section: { gap: 14, alignItems: 'center' },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 1, textAlign: 'center' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tag: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: '#E0E0E0' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#333' },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '100%', paddingHorizontal: 30 },
  benefitText: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
});

// ─── Styles — List Screen ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F5F5F5',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8E8E8', alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  // Hero card — putih, light style
  heroCard: {
    borderRadius: 20, padding: 24, overflow: 'hidden',
    backgroundColor: '#FFFFFF', marginBottom: 4, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  decoCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    top: -40, right: -30,
  },
  decoCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    top: 30, right: 80,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#111', lineHeight: 30 },
  heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroBadgeLevel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  heroBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  heroBadgeLevelText: { fontSize: 13, fontWeight: '600', color: '#111' },
  heroBadgeFreq: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#fff',
  },
  heroBadgeFreqText: { fontSize: 13, fontWeight: '600', color: '#333' },
  heroBenefits: { gap: 10, marginTop: 2 },
  heroBenefitText: { fontSize: 14, color: '#555', lineHeight: 22 },

  // Tab
  tabScroll: { marginBottom: 4 },
  tabRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  tabBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 999, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  tabBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#FFF' },

  // Exercise row — simple sesuai referensi
  exerciseRow: {
    backgroundColor: '#FFF', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  exerciseLeft: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#111' },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailText: { fontSize: 13, fontWeight: '500', color: '#888' },
});