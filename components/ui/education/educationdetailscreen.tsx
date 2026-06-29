import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EducationTopic, EducationLesson } from '@/constants/educationdata';
import { ExerciseCategory } from '@/constants/strengthdata';
import EducationLessonDetail from '@/components/ui/education/educationlessondetail';
import InjuryDetailScreen from '@/components/ui/education/injurydetailscreen';
import ExerciseCard from '@/components/ui/education/exercisecard';

type Props = {
  topic: EducationTopic;
  onBack: () => void;
};

export default function EducationDetailScreen({ topic, onBack }: Props) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedLesson, setSelectedLesson] = useState<EducationLesson | null>(null);

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [60, 100], outputRange: [0, 1], extrapolate: 'clamp',
  });

  const isRunning  = topic.type === 'running';
  const isInjury   = topic.type === 'injury';
  const isWarmup   = topic.type === 'warmup';
  const isStrength = topic.type === 'strength';

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Animated.Text style={[styles.headerTitle, { opacity: headerTitleOpacity }]} numberOfLines={1}>
          {topic.title}
        </Animated.Text>
        <View style={{ width: 36 }} />
      </View>

      {/* CONTENT */}
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        {/* HERO */}
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: topic.color }]}>
            <Ionicons name={topic.icon as any} size={16} color="#111" />
            <Text style={styles.heroBadgeText}>Panduan Teknis</Text>
          </View>
          <Text style={styles.heroTitle}>{topic.title}</Text>
          <Text style={styles.heroDescription}>{topic.heroDescription}</Text>
          {topic.hasVideo && (
            <TouchableOpacity style={styles.videoBtn} activeOpacity={0.8}>
              <View style={styles.videoBtnIcon}>
                <Ionicons name="play" size={14} color="#fff" />
              </View>
              <Text style={styles.videoBtnText}>Tonton Video</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* RUNNING */}
        {isRunning && topic.lessons.map((lesson, index) => (
          <View key={lesson.id} style={styles.lessonCard}>
            <View style={styles.lessonLeft}>
              <View style={[styles.lessonNum, { backgroundColor: topic.color }]}>
                <Text style={styles.lessonNumText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              {index < topic.lessons.length - 1 && <View style={styles.lessonLine} />}
            </View>
            <View style={styles.lessonRight}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonDescription}>{lesson.description}</Text>
            </View>
          </View>
        ))}

        {/* INJURY */}
        {isInjury && topic.lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.cardLesson}
            activeOpacity={lesson.hasDetail ? 0.8 : 1}
            onPress={() => lesson.hasDetail && setSelectedLesson(lesson)}
          >
            <View style={styles.cardLessonInner}>
              <View style={styles.cardLessonText}>
                <Text style={styles.cardLessonTitle}>{lesson.title}</Text>
                {lesson.subtitle ? (
                  <Text style={styles.cardLessonSubtitle}>{lesson.subtitle}</Text>
                ) : null}
                <Text style={styles.cardLessonDesc}>{lesson.description}</Text>
              </View>
              {lesson.hasDetail && (
                <Ionicons name="chevron-forward" size={18} color="#BBB" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* WARMUP — pakai WarmupScreen via education.tsx, di sini tidak ada card */}
        {isWarmup && topic.lessons.map((lesson) => (
          <ExerciseCard
            key={lesson.id}
            title={lesson.title}
            subtitle={lesson.subtitle}
            description={lesson.description}
            duration={lesson.duration}
            onPress={() => console.log('Open Warm Up')}
          />
        ))}

        {/* STRENGTH — klik buka EducationLessonDetail */}
        {isStrength && topic.lessons.map((lesson) => (
          <ExerciseCard
            key={lesson.id}
            title={lesson.title}
            subtitle={lesson.subtitle}
            description={lesson.description}
            icon={lesson.icon}
            iconColor={lesson.color}
            // Hitung jumlah exercise per category dari strengthdata via helper
            onPress={() => setSelectedLesson(lesson)}
          />
        ))}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Ionicons name="checkmark-circle" size={18} color="#4CD964" />
          <Text style={styles.footerText}>
            Kamu selalu bisa kembali dan tinjau kembali panduan ini.
          </Text>
        </View>
        <Text style={styles.footerSub}>
          Praktekan secara rutin agar teknik dan kualitas lari Anda semakin baik.
        </Text>

      </Animated.ScrollView>

      {/* MODAL — Injury detail */}
{isInjury && (
  <Modal
    visible={!!selectedLesson}
    animationType="slide"
    presentationStyle="fullScreen"
    onRequestClose={() => setSelectedLesson(null)}
  >
    {selectedLesson && (
      <InjuryDetailScreen
        lesson={selectedLesson}
        topic={topic}
        onBack={() => setSelectedLesson(null)}
      />
    )}
  </Modal>
)}

      {/* MODAL — Strength detail */}
      {isStrength && (
        <Modal
          visible={!!selectedLesson}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setSelectedLesson(null)}
        >
          {selectedLesson && (
            <EducationLessonDetail
              category={selectedLesson.title as ExerciseCategory}  // ✅ untuk strength
              title={selectedLesson.title}
              subtitle={selectedLesson.subtitle}
              onBack={() => setSelectedLesson(null)}
            />
          )}
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', marginHorizontal: 8,
    fontSize: 15, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold',
  },
  content: { padding: 20, paddingBottom: 48 },
  heroSection: { gap: 12, marginBottom: 24 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#111', lineHeight: 32, fontFamily: 'Lexend-Black' },
  heroDescription: { fontSize: 14, lineHeight: 22, color: '#555', fontFamily: 'Lexend-Regular' },
  videoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', backgroundColor: '#111',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginTop: 4,
  },
  videoBtnIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  videoBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: 'Lexend-Bold' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginBottom: 24 },
  lessonCard: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  lessonLeft: { alignItems: 'center', width: 36 },
  lessonNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  lessonNumText: { fontSize: 11, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  lessonLine: { width: 2, flex: 1, backgroundColor: '#EEEEEE', marginTop: 4, marginBottom: 4, minHeight: 32 },
  lessonRight: { flex: 1, paddingBottom: 28 },
  lessonTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 8, lineHeight: 22, fontFamily: 'Lexend-Black' },
  lessonDescription: { fontSize: 14, lineHeight: 22, color: '#555', marginBottom: 10, fontFamily: 'Lexend-Regular' },
  cardLesson: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardLessonInner: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLessonText: { flex: 1, gap: 2 },
  cardLessonTitle: { fontSize: 16, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold' },
  cardLessonSubtitle: { fontSize: 12, color: '#999', fontStyle: 'italic', fontFamily: 'Lexend-Regular' },
  cardLessonDesc: { fontSize: 13, lineHeight: 20, color: '#666', marginTop: 4, fontFamily: 'Lexend-Regular' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 6 },
  footerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#333', fontFamily: 'Lexend-Bold' },
  footerSub: { fontSize: 12, color: '#AAA', lineHeight: 18, fontFamily: 'Lexend-Regular' },
});