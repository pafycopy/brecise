import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Header from '@/components/header';
import WeekCalendar from '@/components/ui/calendar/weekcalendar';

import { Colors } from '@/constants/theme';

import TrainingType, {
  WorkoutType,
} from '@/components/ui/calendar/trainingtype';

import TodayWorkoutCard from '@/components/ui/calendar/todaytrainingcard';

import WorkoutFormScreen, {
  WorkoutFormValues,
  Props as FormProps,
} from '@/components/ui/calendar/workoutformscreen';

import TempoRunForm from '@/components/ui/calendar/temporunform';
import StrengthTrainingForm from '@/components/ui/calendar/strengthtrainingform';

// ✅ tetap pakai supabase store lama
import {
  useWorkoutStore,
  toDateKey,
  SavedWorkout,
} from '@/store/supabaseWorkoutStore';

import { resolveStats } from '@/utils/resolveWorkoutStats';

// ─────────────────────────────────────────────
// FORM REGISTRY
// ─────────────────────────────────────────────

interface BaseFormProps {
  workout: any;
  initialValues?: any;
  onBack: () => void;
  onSave: (values: any) => void;
}

const FORM_REGISTRY: Record<
  string,
  React.ComponentType<BaseFormProps>
> = {
  'Tempo Run':
    TempoRunForm as React.ComponentType<BaseFormProps>,

  'Strength Training':
    StrengthTrainingForm as React.ComponentType<BaseFormProps>,
};

// ─────────────────────────────────────────────
// TRACKER REGISTRY
// ─────────────────────────────────────────────

const TRACKER_REGISTRY: Record<string, string> = {
  'Easy Run': '/tracker/running',
  'Long Run': '/tracker/running',
  'Tempo Run': '/tracker/tempo',
  'Interval Run': '/tracker/interval',
  'Strength Training': '/tracker/strength',
};

// Tipe workout yang sudah pakai range pace (paceMin/paceMax), bukan single pace
const RANGE_PACE_TYPES = ['Easy Run', 'Long Run'];

// ─────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────

const Training = () => {

  const router = useRouter();

  const {
    selectedDate,
    workoutsByDate, // <-- TAMBAHKAN INI agar halaman re-render saat data berubah
    getWorkoutsByDate,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    fetchWorkouts,
  } = useWorkoutStore();

  // ✅ fetch supabase
  useEffect(() => {
    fetchWorkouts();
  }, []);

  const dateKey = toDateKey(selectedDate);

  const todayWorkouts =
    getWorkoutsByDate(dateKey);

  // ✅ fitur baru:
  // workout hanya bisa dimainkan hari ini

  const todayKey = toDateKey(new Date());

  const isSelectedToday =
    todayKey === dateKey;

  // ─────────────────────────

  const [formVisible, setFormVisible] =
    useState(false);

  const [selectedWorkout, setSelectedWorkout] =
    useState<WorkoutType | null>(null);

  const [editingWorkout, setEditingWorkout] =
    useState<SavedWorkout | null>(null);

  // ─────────────────────────
  // SELECT TRAINING
  // ─────────────────────────

  const handleSelectTraining = (
    workout: WorkoutType
  ) => {

    setEditingWorkout(null);

    setSelectedWorkout(workout);

    setFormVisible(true);
  };

  // ─────────────────────────
  // SAVE
  // ─────────────────────────

  const handleSave = (
    data: WorkoutFormValues
  ) => {

    if (editingWorkout) {

      updateWorkout(
        dateKey,
        editingWorkout.uid,
        data
      );

    } else {

      addWorkout(dateKey, data);

    }

    setFormVisible(false);

    setEditingWorkout(null);
  };

  // ─────────────────────────
  // EDIT
  // ─────────────────────────

  const handleEdit = (
    workout: SavedWorkout
  ) => {

    setEditingWorkout(workout);

    setSelectedWorkout({
      id: 0,
      label: workout.workoutType,
      iconName: 'directions-run',
      iconLib: 'material',
      iconBg: '#E8E8E8',
      icon: 'directions-run',
    });

    setFormVisible(true);
  };

  // ─────────────────────────
  // DELETE
  // ─────────────────────────

  const handleDelete = (uid: string) => {
    deleteWorkout(dateKey, uid);
  };

  // ─────────────────────────
  // START WORKOUT
  // ─────────────────────────

  const handleStartWorkout = (
    workout: SavedWorkout
  ) => {

    const trackerPath =
      TRACKER_REGISTRY[workout.workoutType];

    if (!trackerPath) return;

    router.push({
      pathname: trackerPath as any,

      params: {
        uid: workout.uid,
        dateKey,
        paceMin: String(workout.paceMin),  // ← tambah ini
        paceMax: String(workout.paceMax),  // ← tambah ini
        workoutType: workout.workoutType,
        workoutName: workout.workoutName,

        ...(workout.workoutType ===
          'Interval Run' && {

          distance: workout.distance,
          pace: workout.pace,
          reps: workout.reps,
          restTime: workout.restTime,
        }),

        ...(workout.workoutType ===
          'Tempo Run' &&

          workout.warmup &&
          workout.tempo &&
          workout.cooldown && {

          warmupDistance:
            workout.warmup.distance,

          warmupPace:
            workout.warmup.pace,

          tempoDistance:
            workout.tempo.distance,

          targetPace:
            workout.tempo.targetPace,

          cooldownDistance:
            workout.cooldown.distance,

          cooldownPace:
            workout.cooldown.pace,
        }),

        ...(workout.workoutType ===
          'Strength Training' && {

          selectedExercises: JSON.stringify(
            workout.selectedExercises ?? []
          ),
        }),
      },
    });
  };

  // ─────────────────────────

  const ActiveForm =
    selectedWorkout
      ? (
          FORM_REGISTRY[
            selectedWorkout.label
          ] ?? WorkoutFormScreen
        ) as React.ComponentType<FormProps>
      : null;

  // ─────────────────────────
  // DATE LOGIC
  // ─────────────────────────

  const isToday =
    selectedDate.toDateString() ===
    new Date().toDateString();

  const todayMidnight = new Date();

  todayMidnight.setHours(0, 0, 0, 0);

  const selMidnight = new Date(selectedDate);

  selMidnight.setHours(0, 0, 0, 0);

  const isPastDate =
    selMidnight < todayMidnight;

  const sectionTitle = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString(
        'id-ID',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }
      );

  // ─────────────────────────
  // RENDER
  // ─────────────────────────

  return (
    <View style={styles.container}>

      <Header title="Calendar" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        <WeekCalendar />

        <View style={styles.todaySection}>

          <Text style={styles.sectionTitle}>
            {sectionTitle}
          </Text>

          {todayWorkouts.length === 0 ? (

            <TodayWorkoutCard isEmpty />

          ) : (

            todayWorkouts.map((workout) => (

              <TodayWorkoutCard
                key={workout.uid}

                workoutType={workout.workoutType}

                workoutName={workout.workoutName}

                stats={resolveStats(workout)}

                status={
                  workout.status === 'completed'
                    ? 'completed'
                    : isPastDate
                    ? 'missed'
                    : 'planned'
                }

                // ✅ fitur baru
                onStartPress={
                  isSelectedToday &&
                  workout.status !== 'completed'
                    ? () =>
                        handleStartWorkout(workout)
                    : undefined
                }

                startDisabled={
                  !isSelectedToday ||
                  workout.status === 'completed'
                }

                // pace tunggal — HANYA untuk tipe yang masih pakai target pace
                // tunggal (bukan Tempo/Interval yang punya komponen sendiri,
                // dan bukan Easy Run/Long Run yang sekarang pakai range pace)
                paceResult={
                  workout.trackingResult &&
                  workout.pace &&
                  workout.distance &&
                  workout.workoutType !== 'Tempo Run' &&
                  workout.workoutType !== 'Interval Run' &&
                  !RANGE_PACE_TYPES.includes(workout.workoutType)
                    ? {
                        targetPace:
                          workout.pace,

                        actualPace:
                          workout.trackingResult.actualPace,

                        targetDistance:
                          workout.distance,

                        actualDistance:
                          workout.trackingResult.actualDistance,
                      }
                    : undefined
                }

                // pace range — Easy Run & Long Run (cek masuk range atau tidak,
                // bukan dibandingkan ke satu target pace tunggal)
                paceRangeResult={
                  workout.trackingResult &&
                  workout.paceMin != null &&
                  workout.paceMax != null &&
                  workout.distance &&
                  RANGE_PACE_TYPES.includes(workout.workoutType)
                    ? {
                        paceMin:
                          workout.paceMin,

                        paceMax:
                          workout.paceMax,

                        actualPace:
                          workout.trackingResult.actualPace,

                        targetDistance:
                          workout.distance,

                        actualDistance:
                          workout.trackingResult.actualDistance,
                      }
                    : undefined
                }

                // tempo — 3 fase lengkap: warmup, tempo session, cooldown
                tempoResult={
                  workout.workoutType ===
                    'Tempo Run' &&
                  workout.trackingResult
                    ?.phaseResults &&
                  workout.warmup &&
                  workout.tempo &&
                  workout.cooldown
                    ? {
                        phases: [
                          {
                            label:
                              '🔥 WARM UP',

                            targetDistance:
                              workout.warmup.distance,

                            actualDistance:
                              workout
                                .trackingResult
                                .phaseResults
                                .warmup
                                .actualDistance,

                            targetPace:
                              workout.warmup.pace,

                            actualPace:
                              workout
                                .trackingResult
                                .phaseResults
                                .warmup
                                .actualPace,
                          },
                          {
                            label:
                              '⚡ TEMPO SESSION',

                            targetDistance:
                              workout.tempo.distance,

                            actualDistance:
                              workout
                                .trackingResult
                                .phaseResults
                                .tempo
                                .actualDistance,

                            targetPace:
                              workout.tempo.targetPace,

                            actualPace:
                              workout
                                .trackingResult
                                .phaseResults
                                .tempo
                                .actualPace,
                          },
                          {
                            label:
                              '❄️ COOL DOWN',

                            targetDistance:
                              workout.cooldown.distance,

                            actualDistance:
                              workout
                                .trackingResult
                                .phaseResults
                                .cooldown
                                .actualDistance,

                            targetPace:
                              workout.cooldown.pace,

                            actualPace:
                              workout
                                .trackingResult
                                .phaseResults
                                .cooldown
                                .actualPace,
                          },
                        ],
                      }
                    : undefined
                }

                // interval
                intervalResult={
                  workout.workoutType ===
                    'Interval Run' &&
                  workout.trackingResult
                    ?.repResults
                    ? {
                        targetDistance:
                          parseFloat(
                            workout.distance ?? '0'
                          ),

                        targetPace:
                          workout.pace ?? '0',

                        reps:
                          workout.trackingResult
                            .repResults,
                      }
                    : undefined
                }

                onEdit={() =>
                  handleEdit(workout)
                }

                onDelete={() =>
                  handleDelete(workout.uid)
                }
              />

            ))
          )}
        </View>

        <Text style={styles.title}>
          <Ionicons
            name="add-sharp"
            size={24}
            color="#000"
          />

          {' '}Tambah latihan
        </Text>

        <TrainingType
          onSelect={handleSelectTraining}
        />

      </ScrollView>

      {/* FORM MODAL */}

      <Modal
        visible={formVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() =>
          setFormVisible(false)
        }
      >

        {selectedWorkout &&
          ActiveForm && (

          <ActiveForm
            workout={selectedWorkout}

            initialValues={
              editingWorkout ?? undefined
            }

            onBack={() => {
              setFormVisible(false);
              setEditingWorkout(null);
            }}

            onSave={handleSave}
          />
        )}

      </Modal>

    </View>
  );
};

export default Training;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  todaySection: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },

  sectionTitle: {
    fontSize: 22, fontFamily: 'Lexend-Black',
    fontWeight: '800',
    color: '#1A1A2E',

    letterSpacing: -0.5,

    marginBottom: 4,
  },

  title: {
    padding: 12, fontFamily: 'Lexend-Bold',

    marginLeft: 16,
    marginTop: 16,

    textAlign: 'left',

    fontSize: 16,
    fontWeight: 'bold',
  },
});