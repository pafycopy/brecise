import EducationLessonDetail from "@/components/ui/education/educationlessondetail";
import ExerciseCard from "@/components/ui/education/exercisecard";
import { EducationLesson, EducationTopic } from "@/constants/educationdata";
import { ExerciseCategory, EXERCISES } from "@/constants/strengthdata";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  topic: EducationTopic;
  onBack: () => void;
};

const StrengthScreen = ({ topic, onBack }: Props) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedLesson, setSelectedLesson] = useState<EducationLesson | null>(
    null,
  );

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const getExerciseCount = (lessonTitle: string): string => {
    const categoryMap: Record<string, ExerciseCategory> = {
      Strength: "Strength",
      Core: "Core",
      Mobility: "Mobility",
      Recovery: "Recovery",
    };
    const cat = categoryMap[lessonTitle];
    if (!cat) return "";
    const count = EXERCISES.filter((e) => e.category === cat).length;
    return `${count} Exercises`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Animated.Text
          numberOfLines={1}
          style={[styles.headerTitle, { opacity: headerTitleOpacity }]}
        >
          {topic.title}
        </Animated.Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* HERO CARD — dark background */}
        <View style={styles.heroCard}>
          {/* Badge */}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>SERI KURSUS</Text>
          </View>

          {/* Judul & Deskripsi */}
          <Text style={styles.heroTitle}>{topic.title}</Text>
          <Text style={styles.heroDescription}>{topic.heroDescription}</Text>
        </View>

        {/* MODUL LABEL */}
        <Text style={styles.modulLabel}>Modul</Text>

        {/* EXERCISE CARDS */}
        {topic.lessons.map((lesson) => (
          <ExerciseCard
            key={lesson.id}
            title={lesson.title}
            subtitle={lesson.subtitle}
            description={lesson.description}
            icon={lesson.icon}
            iconColor={lesson.color}
            exercise={getExerciseCount(lesson.title)}
            onPress={() => setSelectedLesson(lesson)}
          />
        ))}
      </Animated.ScrollView>

      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedLesson(null)}
      >
        {selectedLesson && (
          <EducationLessonDetail
            category={selectedLesson.title as ExerciseCategory}
            title={selectedLesson.title}
            subtitle={selectedLesson.subtitle}
            onBack={() => setSelectedLesson(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default StrengthScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#F5F5F5",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    fontFamily: "Lexend-Bold",
  },

  content: { padding: 16, paddingBottom: 40, gap: 16 },

  // ── Hero Card ──────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    paddingBottom: 28,
    gap: 12,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#6BFF8F",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#006E2F",
    letterSpacing: 1,
    fontFamily: "Lexend-Black",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
    lineHeight: 36,
    fontFamily: "Lexend-Black",
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#111",
    fontFamily: "Lexend-Regular",
  },

  // ── Modul label ────────────────────────────────────────────────────────────
  modulLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    fontFamily: "Lexend-Black",
  },
});
