import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  EducationTopic,
  EducationLesson,
} from '@/constants/educationdata';

import InjuryDetailScreen from './injurydetailscreen';

type Props = {
  topic: EducationTopic;
  onBack: () => void;
};

const InjuryPreventionScreen = ({
  topic,
  onBack,
}: Props) => {

  const scrollY =
    useRef(new Animated.Value(0)).current;

  const [selectedLesson, setSelectedLesson] =
    useState<EducationLesson | null>(null);

  const headerTitleOpacity =
    scrollY.interpolate({
      inputRange: [60, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111"
          />
        </TouchableOpacity>

      </View>

      {/* CONTENT */}
      <Animated.ScrollView
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
          }
        )}
      >

        {/* TOP LABEL */}
        <View style={styles.topLabel}>

          <Ionicons
            name="walk-outline"
            size={11}
            color="#111"
          />

          <Text style={styles.topLabelText}>
            Panduan Pencegahan Cedera
          </Text>

        </View>

        {/* HERO */}
        <View style={styles.heroSection}>

          <Text style={styles.heroTitle}>
            {topic.title}
          </Text>

          <Text style={styles.heroDescription}>
            {topic.heroDescription}
          </Text>

        </View>

        {/* LESSON LIST */}
        {topic.lessons.map((lesson, index) => (

          <TouchableOpacity
            key={lesson.id}
            activeOpacity={0.85}
            style={styles.lessonCard}
            onPress={() =>
              setSelectedLesson(lesson)
            }
          >

            {/* NUMBER */}
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>
                {index + 1}
              </Text>
            </View>

            {/* TITLE */}
            <Text style={styles.lessonTitle}>
              {lesson.title}
            </Text>

            {/* SUBTITLE */}
            {lesson.subtitle ? (
              <Text style={styles.lessonSubtitle}>
                ({lesson.subtitle})
              </Text>
            ) : null}

            {/* KARAKTERISTIK */}
            {lesson.detail?.karakteristik?.[0] && (
              <View style={styles.infoRow}>

                <Ionicons
                  name="search-outline"
                  size={13}
                  color="#16A34A"
                  style={styles.infoIcon}
                />

                <View style={{ flex: 1 }}>

                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: '#16A34A',
                      },
                    ]}
                  >
                    KARAKTERISTIK
                  </Text>

                  <Text style={styles.infoText}>
                    {
                      lesson.detail
                        .karakteristik[0]
                    }
                  </Text>

                </View>

              </View>
            )}

            {/* PEMICU */}
            {lesson.detail?.pemicu?.[0] && (
              <View style={styles.infoRow}>

                <Ionicons
                  name="flash-outline"
                  size={13}
                  color="#F97316"
                  style={styles.infoIcon}
                />

                <View style={{ flex: 1 }}>

                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: '#F97316',
                      },
                    ]}
                  >
                    PEMICU
                  </Text>

                  <Text style={styles.infoText}>
                    {
                      lesson.detail
                        .pemicu[0]
                    }
                  </Text>

                </View>

              </View>
            )}

          </TouchableOpacity>

        ))}

      </Animated.ScrollView>

      {/* MODAL DETAIL */}
      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() =>
          setSelectedLesson(null)
        }
      >

        {selectedLesson && (
          <InjuryDetailScreen
            lesson={selectedLesson}
            topic={topic}
            onBack={() =>
              setSelectedLesson(null)
            }
          />
        )}

      </Modal>

    </SafeAreaView>
  );
};

export default InjuryPreventionScreen;

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 20,
    paddingVertical: 12,

    backgroundColor: '#F7F7F7',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',
  },

  profileBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,

    backgroundColor: '#1F2937',

    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
 fontFamily: 'Lexend-Bold',
    textAlign: 'center',

    marginHorizontal: 10,

    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

 topLabel: {
  flexDirection: 'row',
  alignItems: 'center',

  alignSelf: 'flex-start',

  backgroundColor: '#EFEFEF',

  borderRadius: 999,

  paddingHorizontal: 16,
  paddingVertical: 6,

  gap: 8,

},
  topLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#444', fontFamily: 'Lexend-Bold',
  },

  heroSection: {
    marginBottom: 24,
  },

  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#111', fontFamily: 'Lexend-Black',

    lineHeight: 42,

    marginBottom: 16,
  },

  heroDescription: {
    fontSize: 16, fontFamily: 'Lexend-Regular',
    lineHeight: 28,
    color: '#5F5F5F',
  },

  lessonCard: {
    backgroundColor: '#EFEFEF',

    borderRadius: 20,

    padding: 18,

    marginBottom: 18,
  },

  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,

    backgroundColor: '#111827',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 14,
  },

  numberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6BFF8F', fontFamily: 'Lexend-Black',
  },

  lessonTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111',

    marginBottom: 4, fontFamily: 'Lexend-Black',
  },

  lessonSubtitle: {
    fontSize: 12,
    color: '#666',
 fontFamily: 'Lexend-Regular',
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 14,
  },

  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
 fontFamily: 'Lexend-Black',
    letterSpacing: 0.5,

    marginBottom: 4,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 23, fontFamily: 'Lexend-Regular',
    color: '#333',

    fontWeight: '500', 
  },

});