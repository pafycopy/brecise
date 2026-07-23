import WarmupCard from "@/components/ui/education/warmupcard";
import { EducationTopic } from "@/constants/educationdata";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  topic: EducationTopic;
  onBack: () => void;
  // Lesson yang harus langsung di-scroll begitu layar ini
  // kebuka (dikirim dari tips card di dashboard). Optional — kalau gak ada,
  // layar ini tampil seperti biasa dari paling atas.
  scrollToLessonId?: number | null;
};

const WarmupScreen = ({ topic, onBack, scrollToLessonId }: Props) => {
  // Kalau lesson tujuan ada di tab "cooldown", langsung buka di tab itu
  // dari awal — biar gak nampilin tab "warmup" dulu baru pindah tab.
  const [selectedTab, setSelectedTab] = useState<"warmup" | "cooldown">(() => {
    const target = topic.lessons.find((l) => l.id === scrollToLessonId);
    return target?.type === "cooldown" ? "cooldown" : "warmup";
  });

  const scrollRef = useRef<any>(null);
  // Nyimpen posisi Y tiap card lesson, diisi lewat onLayout pas card-nya
  // dirender — dipakai buat tau ke mana harus scroll.
  const lessonPositions = useRef<Record<number, number>>({});

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scrollToLessonId == null) return;
    // Kasih jeda dikit biar modal fullscreen selesai animasi masuk & semua
    // card udah kelar layout, baru discroll. Cuma scroll polos, tanpa efek
    // highlight/border apa pun di card tujuannya.
    const timer = setTimeout(() => {
      const y = lessonPositions.current[scrollToLessonId];
      if (y !== undefined) {
        (scrollRef.current as any)?.scrollTo?.({ y: Math.max(y - 20, 0), animated: true });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToLessonId]);

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const filteredLessons = topic.lessons.filter((lesson) =>
    selectedTab === "warmup"
      ? lesson.type === "warmup"
      : lesson.type === "cooldown",
  );

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
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* HERO */}
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: topic.color }]}>
            <Ionicons name={topic.icon as any} size={16} color="#111" />
            <Text style={styles.heroBadgeText}>Warm Up</Text>
          </View>
          <Text style={styles.heroTitle}>{topic.title}</Text>
          <Text style={styles.heroDescription}>{topic.heroDescription}</Text>
        </View>

        {/* TAB */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTab("warmup")}
            style={[
              styles.tabButton,
              selectedTab === "warmup" && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "warmup" && styles.activeTabText,
              ]}
            >
              WARM UP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTab("cooldown")}
            style={[
              styles.tabButton,
              selectedTab === "cooldown" && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "cooldown" && styles.activeTabText,
              ]}
            >
              POST RUN
            </Text>
          </TouchableOpacity>
        </View>

        {/* CARDS */}
        {filteredLessons.map((lesson) => (
          <View
            key={lesson.id}
            onLayout={(e) => {
              lessonPositions.current[lesson.id] = e.nativeEvent.layout.y;
            }}
          >
            <WarmupCard
              title={lesson.title}
              subtitle={lesson.subtitle} // "Mengapa Hal Ini Penting:"
              description={lesson.description}
              gif={lesson.gif}
            />
          </View>
        ))}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default WarmupScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    gap: 12,
    marginBottom: 24,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
    fontFamily: "Lexend-Bold",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111",
    lineHeight: 38,
    fontFamily: "Lexend-Black",
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 26,
    color: "#666",
    fontFamily: "Lexend-Regular",
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
  },
  activeTab: { backgroundColor: "#B9F5C7" },
  tabText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#666",
    fontFamily: "Lexend-Black",
  },
  activeTabText: { color: "#0F8A39", fontFamily: "Lexend-Black" },
});