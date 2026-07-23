import React, { useEffect, useRef } from "react";

import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { EducationTopic } from "@/constants/educationdata";

type Props = {
  topic: EducationTopic;
  onBack: () => void;
  // Lesson yang harus langsung di-scroll begitu layar ini
  // kebuka (dikirim dari tips card di dashboard).
  scrollToLessonId?: number | null;
};

const RunningTechniqueScreen = ({ topic, onBack, scrollToLessonId }: Props) => {
  const scrollRef = useRef<any>(null);
  const lessonPositions = useRef<Record<number, number>>({});

  useEffect(() => {
    if (scrollToLessonId == null) return;
    const timer = setTimeout(() => {
      const y = lessonPositions.current[scrollToLessonId];
      if (y !== undefined) {
        (scrollRef.current as any)?.scrollTo?.({ y: Math.max(y - 20, 0), animated: true });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToLessonId]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

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

      {/* CONTENT */}
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {
            useNativeDriver: true,
          },
        )}
      >
        {/* HERO */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: topic.color,
              },
            ]}
          >
            <Ionicons name={topic.icon as any} size={16} color="#111" />

            <Text style={styles.heroBadgeText}>Running Teknik</Text>
          </View>

          <Text style={styles.heroTitle}>{topic.title}</Text>

          <Text style={styles.heroDescription}>{topic.heroDescription}</Text>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* LESSONS */}
        {topic.lessons.map((lesson, index) => (
          <View
            key={lesson.id}
            onLayout={(e) => {
              lessonPositions.current[lesson.id] = e.nativeEvent.layout.y;
            }}
            style={styles.lessonCard}
          >
            {/* ICON */}
            <View style={styles.iconWrapper}>
              <Ionicons name={topic.icon as any} size={18} color="#222" />
            </View>

            {/* CONTENT */}
            <View style={styles.lessonContent}>
              <Text style={styles.lessonLabel}>LANGKAH {index + 1}</Text>

              <Text style={styles.lessonTitle}>{lesson.title}</Text>

              <Text style={styles.lessonDescription}>{lesson.description}</Text>
            </View>
          </View>
        ))}

        {/* FOOTER */}
        <View style={styles.footerSection}>
          <View style={styles.footerIcon}>
            <Ionicons name="checkmark-circle" size={40} color="#4ADE80" />
          </View>

          <Text style={styles.footerTitle}>
            Kamu sudah siap untuk turun ke lintasan.
          </Text>

          <Text style={styles.footerDescription}>
            Fokuslah pada satu hal saja setiap kali Anda berlari.
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default RunningTechniqueScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 16,
    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",

    backgroundColor: "#F3F4F6",
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,

    textAlign: "center",

    marginHorizontal: 8,

    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Lexend-Bold",
    color: "#111827",
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  heroSection: {
    gap: 14,
    marginBottom: 28,
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,

    alignSelf: "flex-start",

    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 999,
  },

  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Lexend-Bold",
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    fontFamily: "Lexend-Black",

    lineHeight: 40,
  },

  heroDescription: {
    fontSize: 15,
    lineHeight: 28,
    fontFamily: "Lexend-Regular",
    color: "#6B7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 24,
  },

  lessonCard: {
    flexDirection: "row",

    backgroundColor: "#F7F7F7",

    borderRadius: 28,

    padding: 22,

    marginBottom: 18,

    gap: 18,
  },

  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,

    backgroundColor: "#ECECEC",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,
  },

  lessonContent: {
    flex: 1,
  },

  lessonLabel: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "Lexend-Black",
    letterSpacing: 1.4,

    color: "#4ADE80",

    marginBottom: 8,
  },

  lessonTitle: {
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "Lexend-Black",
    color: "#111827",

    lineHeight: 30,

    marginBottom: 16,
  },

  lessonDescription: {
    fontSize: 16,
    fontFamily: "Lexend-Regular",
    lineHeight: 32,

    color: "#374151",
  },

  footerSection: {
    alignItems: "center",

    marginTop: 3,
    marginBottom: 0,

    paddingHorizontal: 20,
  },

  footerIcon: {
    marginBottom: 18,
  },

  footerTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Lexend-Black",
    color: "#111827",

    textAlign: "center",

    marginBottom: 12,
  },

  footerDescription: {
    fontSize: 16,
    lineHeight: 28,
    fontFamily: "Lexend-Regular",

    color: "#4B5563",

    textAlign: "center",
  },
});