import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EducationLesson, EducationTopic } from '@/constants/educationdata';

type Props = {
  lesson: EducationLesson;
  topic: EducationTopic;
  onBack: () => void;
};

export default function InjuryDetailScreen({ lesson, topic, onBack }: Props) {
  const beristirahat = lesson.detail?.kapanBeristirahat ?? [];
  const konsultasi   = lesson.detail?.segeraKonsultasi  ?? [];

  return (
    <SafeAreaView style={styles.safe}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* ── 1. HERO CARD ──────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTitleRow}>
            <Ionicons name="bandage" size={22} color="#DC2626" />
            <Text style={styles.heroTitle}>{lesson.title}</Text>
          </View>

          {lesson.subtitle ? (
            <Text style={styles.heroSubtitle}>{lesson.subtitle}</Text>
          ) : null}

          {lesson.description ? (
            <Text style={styles.heroDesc}>{lesson.description}</Text>
          ) : null}
        </View>

        {/* ── 2. KAPAN HARUS BERISTIRAHAT ───────────────────── */}
        {beristirahat.length > 0 && (
          <View style={styles.sectionCard}>
            {/* Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="moon" size={16} color="#16A34A" />
              </View>
              <Text style={styles.sectionTitle}>Kapan Harus Beristirahat</Text>
            </View>

            {/* Items dengan divider */}
            {beristirahat.map((item, i) => (
              <View key={i}>
                {i > 0 && <View style={styles.itemDivider} />}
                <View style={styles.itemRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#006E2F"
                    style={styles.itemIcon}
                  />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── 3. SEGERA KONSULTASI KE AHLI ─────────────────── */}
        {konsultasi.length > 0 && (
          <View style={styles.sectionCard}>
            {/* Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="medkit" size={16} color="#DC2626" />
              </View>
              <Text style={styles.sectionTitle}>Segera Konsultasi ke Ahli</Text>
            </View>

            {/* Items tanpa divider, bullet segitiga merah */}
            {konsultasi.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Ionicons
                  name="warning"
                  size={18}
                  color="#DC2626"
                  style={styles.itemIcon}
                />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EBEBEB',
    alignItems: 'center', justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 14,
  },

  // ── Hero card ──────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  heroIcon: { fontSize: 18, fontFamily: 'Lexend-Regular' },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: '#111', flex: 1, lineHeight: 28, fontFamily: 'Lexend-Black',
  },
  heroSubtitle: { fontFamily: 'Lexend-Regular',
    fontSize: 13, color: '#666', fontStyle: 'italic', 
  },
  heroDesc: {
    fontSize: 14, lineHeight: 24, color: '#444', fontFamily: 'Lexend-Regular',
  },

  // ── Section card (beristirahat & konsultasi) ───────────────
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black',
  },

  // ── Item row ───────────────────────────────────────────────
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  itemIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#333', fontFamily: 'Lexend-Regular',
  },
});