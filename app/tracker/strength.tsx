import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Image,
} from 'react-native';
import { showInterstitialAd } from '@/services/interstitialAdService';
import { useProStore } from '@/store/proStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';

type SetStatus = 'pending' | 'done';
type ScreenState = 'preview' | 'exercise' | 'rest' | 'finished';
type InputType = 'reps' | 'duration';

type ExerciseProgress = {
  id: string;
  name: string;
  inputType: InputType;
  gifUrl?: string;
  sets: Array<{ set: number; reps: string; duration: string; status: SetStatus }>;
};

const REST_DURATION = 30;

export default function StrengthTracker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uid, dateKey, workoutName, selectedExercises } = useLocalSearchParams<{
    uid: string; dateKey: string; workoutName: string; selectedExercises: string;
  }>();
  const { saveTrackingResult } = useWorkoutStore();

  // ── Audio: suara saat tekan "Mulai" ─────────────────────────────────────
  const countdownPlayer = useAudioPlayer(require('@/assets/sounds/countdown.mp3'));

  // ── Parse exercises ──────────────────────────────────────────────────────
  const exercises: ExerciseProgress[] = (() => {
    try {
      const parsed = JSON.parse(selectedExercises ?? '[]');
      return parsed.map((e: any) => ({
        id: e.id,
        name: e.name,
        inputType: (e.inputType ?? 'reps') as InputType,
        gifUrl: e.gifUrl ?? null,
        sets: e.sets.map((s: any) => ({
          set: s.set,
          reps: s.reps ?? '10',
          duration: s.duration ?? '30',
          status: 'pending' as SetStatus,
        })),
      }));
    } catch { return []; }
  })();

  // ── State ────────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState<ExerciseProgress[]>(exercises);
  const [screen, setScreen] = useState<ScreenState>('preview');
  const [isTraining, setIsTraining] = useState(false);
  const [restCountdown, setRestCountdown] = useState(REST_DURATION);
  const [totalTime, setTotalTime] = useState(0);
  const [countdown, setCountdown] = useState(0); // State baru untuk hitung mundur
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  // State khusus set timer (untuk exercise inputType === 'duration')
  const [activeSetCountdown, setActiveSetCountdown] = useState(0);
  const [setTimerActive, setSetTimerActive] = useState(false);

  const totalTimerRef = useRef<any>(null);
  const restTimerRef = useRef<any>(null);
  const setTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null); // Ref baru untuk timer hitung mundur


  // Refs untuk hindari stale closure di interval
  const exerciseIndexRef = useRef(0);
  const setIndexRef = useRef(0);
  const progressRef = useRef<ExerciseProgress[]>(exercises);
  exerciseIndexRef.current = currentExerciseIndex;
  setIndexRef.current = currentSetIndex;
  progressRef.current = progress;

  const currentExercise = progress[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];

  // ── Actions ──────────────────────────────────────────────────────────────

  // completeSetAuto dipanggil saat set timer habis otomatis
  const completeSetAuto = useCallback(() => {
    const exIdx = exerciseIndexRef.current;
    const setIdx = setIndexRef.current;
    const prog = progressRef.current;

    const updated = prog.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, status: 'done' as SetStatus } : s)),
      };
    });
    setProgress(updated);

    const exercise = prog[exIdx];
    const isLastSet = setIdx === exercise.sets.length - 1;
    const isLastExercise = exIdx === prog.length - 1;

    setIsTraining(false);
    if (isLastSet && isLastExercise) {
      setScreen('finished');
      return;
    }
    setScreen('rest');
  }, []);

  // Logika sebenarnya untuk memulai set, dipanggil setelah hitung mundur selesai
  const _startSetLogic = useCallback(() => {
    setCountdown(0); // Pastikan hitung mundur direset
    setIsTraining(true);
    // Jika exercise pakai durasi → mulai countdown set timer
    if (currentExercise.inputType === 'duration') {
      const secs = parseInt(currentSet.duration ?? '30');
      setActiveSetCountdown(secs);
      setSetTimerActive(true);
      setTimerRef.current = setInterval(() => {
        setActiveSetCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(setTimerRef.current);
            setTimerRef.current = null;
            setSetTimerActive(false);
            // Auto complete saat waktu habis
            completeSetAuto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [currentExercise, currentSet, completeSetAuto]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown > 0) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && screen === 'exercise' && !isTraining) {
      // Hitung mundur selesai, dan kita di layar exercise, dan belum training
      // Ini saatnya untuk benar-benar memulai set.
      _startSetLogic();
    }

    return () => {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    };
  }, [countdown, screen, isTraining, _startSetLogic]);

  // ── Auto-start duration timer setelah rest ─────────────────────────────
  // Saat isTraining=true tapi setTimerActive=false (baru masuk exercise screen),
  // dan exercise bertipe duration → langsung jalankan timer
  useEffect(() => {
    if (
      screen === 'exercise' &&
      isTraining &&
      !setTimerActive &&
      currentExercise?.inputType === 'duration'
    ) {
      const secs = parseInt(currentSet?.duration ?? '30');
      setActiveSetCountdown(secs);
      setSetTimerActive(true);
      setTimerRef.current = setInterval(() => {
        setActiveSetCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(setTimerRef.current);
            setTimerRef.current = null;
            setSetTimerActive(false);
            completeSetAuto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [screen, isTraining, currentExercise, currentSet, setTimerActive, completeSetAuto]);

  // ── Total timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'exercise' || screen === 'rest') {
      if (!totalTimerRef.current) {
        totalTimerRef.current = setInterval(() => setTotalTime((p) => p + 1), 1000);
      }
    } else {
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  }, [screen]);

  // ── Rest timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'rest') {
      setRestCountdown(REST_DURATION);
      restTimerRef.current = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
            goToNextFromRef();
            return REST_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    return () => { clearInterval(restTimerRef.current); restTimerRef.current = null; };
  }, [screen]);

  // Cleanup unmount
  // NOTE: useAudioPlayer dari expo-audio sudah otomatis me-release player-nya
  // sendiri saat komponen unmount. Memanggil countdownPlayer.remove() secara
  // manual di sini menyebabkan error:
  // "Cannot use shared object that was already released" karena player
  // sudah di-release lebih dulu oleh hook-nya sebelum baris ini jalan.
  // Jadi baris itu dihapus — cukup bersihkan interval saja.
  useEffect(() => {
    return () => {
      clearInterval(totalTimerRef.current);
      clearInterval(restTimerRef.current);
      clearInterval(setTimerRef.current);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} Jam ${m} Menit`;
    if (m > 0) return `${m} Menit ${s} Detik`;
    return `${s} Detik`;
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalSets = progress.reduce((acc, e) => acc + e.sets.length, 0);
  const doneSets = progress.reduce((acc, e) => acc + e.sets.filter((s) => s.status === 'done').length, 0);

  const startSetCountdown = () => {
    // Putar suara setiap kali tombol "Mulai" / "Start Set" ditekan
    try {
      countdownPlayer.seekTo(0);
      countdownPlayer.play();
    } catch (_) {}

    setCountdown(3); // Mulai hitung mundur 3 detik
    setScreen('exercise'); // Pastikan kita di layar exercise
  };

  const completeSet = () => {
    // Hentikan set timer jika masih jalan (tap manual sebelum habis)
    clearInterval(setTimerRef.current);
    setTimerRef.current = null;
    setSetTimerActive(false);
    setIsTraining(false);

    const updated = progress.map((ex, ei) => {
      if (ei !== currentExerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, si) => si === currentSetIndex ? { ...s, status: 'done' as SetStatus } : s),
      };
    });
    setProgress(updated);

    const isLastSet = currentSetIndex === currentExercise.sets.length - 1;
    const isLastExercise = currentExerciseIndex === progress.length - 1;
    if (isLastSet && isLastExercise) { setScreen('finished'); return; }
    setScreen('rest');
  };

  // goToNext dari ref — aman dipanggil dari interval
  const goToNextFromRef = () => {
    const exIdx = exerciseIndexRef.current;
    const setIdx = setIndexRef.current;
    const prog = progressRef.current;
    const exercise = prog[exIdx];
    const isLastSet = setIdx === exercise.sets.length - 1;
    if (!isLastSet) { setCurrentSetIndex(setIdx + 1); }
    else { setCurrentExerciseIndex(exIdx + 1); setCurrentSetIndex(0); }
    // Trigger hitung mundur sebelum memulai set berikutnya
    startSetCountdown();
  };

  const goToNext = () => {
    const isLastSet = currentSetIndex === currentExercise.sets.length - 1;
    if (!isLastSet) { setCurrentSetIndex((p) => p + 1); }
    else { setCurrentExerciseIndex((p) => p + 1); setCurrentSetIndex(0); }
    // Trigger hitung mundur sebelum memulai set berikutnya
    startSetCountdown();
  };


  const skipRest = () => {
    clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    goToNext();
  };

  // Tambah 15 detik ke countdown istirahat
  const addRestTime = () => {
    setRestCountdown((prev) => prev + 15);
  };

  const isPro = useProStore((s) => s.isPro);

const handleFinish = async () => {
  clearInterval(totalTimerRef.current);
  clearInterval(restTimerRef.current);
  clearInterval(setTimerRef.current);
  await saveTrackingResult(dateKey, uid, {
    actualDistance: 0, actualDuration: totalTime, actualPace: '--', completedAt: Date.now(),
  });
  if (!isPro) {
    showInterstitialAd();
  }
  router.back();
};

  const getUpNext = () => {
    const isLastSet = currentSetIndex === (currentExercise?.sets.length ?? 0) - 1;
    if (!isLastSet) return { name: currentExercise?.name, label: `Set ${currentSetIndex + 2} / ${currentExercise?.sets.length}`, gifUrl: currentExercise?.gifUrl };
    const nextEx = progress[currentExerciseIndex + 1]; // Ambil exercise berikutnya
    return nextEx ? { name: nextEx.name, label: 'Set 1', gifUrl: nextEx.gifUrl } : null;
  };
  const upNext = getUpNext();

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'preview') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.previewScroll} showsVerticalScrollIndicator={false}>
          <View style={s.previewHero}>
            <View style={s.previewBadge}><Text style={s.previewBadgeText}>FOUNDATION</Text></View>
            <Text style={s.previewTitle}>{workoutName}</Text>
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}><Text style={s.statLabel}>DURASI EST.</Text><Text style={s.statValue}>~{Math.round(totalSets * 1.5)} Min</Text></View>
            <View style={s.statDivider} />
            <View style={s.statItem}><Text style={s.statLabel}>EXERCISES</Text><Text style={s.statValue}>{progress.length}</Text></View>
            <View style={s.statDivider} />
            <View style={s.statItem}><Text style={s.statLabel}>TOTAL SETS</Text><Text style={s.statValue}>{totalSets}</Text></View>
          </View>
          {progress.map((exercise) => (
            <View key={exercise.id} style={s.previewCard}>
              <View style={s.previewThumb}>
                {exercise.gifUrl ? (
                  <Image source={{ uri: exercise.gifUrl }} style={s.previewGif} resizeMode="cover" />
                ) : (
                  <Ionicons name="barbell-outline" size={22} color="#CCC" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewCardTitle}>{exercise.name}</Text>
                <Text style={s.previewCardSub}>
                  {exercise.sets.length} set ×{' '}
                  {exercise.inputType === 'reps'
                    ? `${exercise.sets[0]?.reps} reps`
                    : `${exercise.sets[0]?.duration} dtk`}
                </Text>
              </View>
              {/* Badge tipe */}
              <View style={[s.typeBadge, exercise.inputType === 'duration' && s.typeBadgeDuration]}>
                <Ionicons name={exercise.inputType === 'duration' ? 'timer-outline' : 'repeat-outline'} size={12} color={exercise.inputType === 'duration' ? '#007AFF' : '#FF6B35'} />
                <Text style={[s.typeBadgeText, exercise.inputType === 'duration' && { color: '#007AFF' }]}>
                  {exercise.inputType === 'duration' ? 'Waktu' : 'Reps'}
                </Text>
              </View>
            </View>
          ))}
          <Text style={s.previewQuote}>"Istirahat juga bagian dari progres"</Text>
          <TouchableOpacity style={s.startBtn} onPress={startSetCountdown} activeOpacity={0.88}>
            <Text style={s.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXERCISE SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'exercise') {
    const isDuration = currentExercise.inputType === 'duration';
    const targetValue = isDuration ? parseInt(currentSet.duration ?? '30') : parseInt(currentSet.reps ?? '0');

    return (
      <SafeAreaView style={s.safe}>
        <View style={s.exScreen}>
          {countdown > 0 && (
            <View style={s.countdownOverlay}>
              <Text style={s.countdownText}>{countdown}</Text>
            </View>
          )}
          {/* Progress bar */}
          <View style={s.progressBarWrap}>
            <View style={[s.progressBarFill, { width: `${(doneSets / totalSets) * 100}%` as any }]} />
          </View>

          {/* Label + Nama Exercise */}
          <Text style={s.exCurrentLabel}>CURRENT EXERCISE</Text>
          <Text style={s.exTitle}>{currentExercise.name}</Text>

          {/* GIF / placeholder */}
          {currentExercise.gifUrl ? (
            <Image
              source={{ uri: currentExercise.gifUrl }}
              style={s.videoPlaceholder}
              resizeMode="contain"
            />
          ) : (
            <View style={s.videoPlaceholder}>
              <Ionicons name="barbell-outline" size={48} color="#555" />
            </View>
          )}

          {/* Stat cards — sesuai referensi */}
          <View style={s.exStatsRow}>
            <View style={s.exStatCard}>
              <Text style={s.exStatLabel}>CURRENT PROGRESS</Text>
              <View style={s.exSetRow}>
                <Text style={s.exSetWord}>Set </Text>
                <Text style={s.exSetNum}>{currentSetIndex + 1}</Text>
                <Text style={s.exSetSlash}> / </Text>
                <Text style={s.exSetTotal}>{currentExercise.sets.length}</Text>
              </View>
            </View>
            <View style={s.exStatCard}>
              <Text style={s.exStatLabel}>{isDuration ? 'DURASI' : 'TARGET REPS'}</Text>
              {isDuration ? (
                <View style={s.exSetRow}>
                  <Text style={[s.exSetNum, setTimerActive && { color: '#FF6B35' }]}>
                    {setTimerActive ? activeSetCountdown : targetValue}
                  </Text>
                  <Text style={s.exSetWord}>{' '}Detik</Text>
                </View>
              ) : (
                <View style={s.exSetRow}>
                  <Text style={s.exSetNum}>{currentSet.reps}</Text>
                  <Text style={s.exSetWord}>{' '}Reps</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tombol bawah: START SET (atas) + SKIP SET (bawah) */}
          <View style={s.exBtnGroup}>
            <TouchableOpacity
              style={[s.ctaBtn, (isTraining || countdown > 0) && s.ctaBtnActive]}
              onPress={isTraining ? completeSet : startSetCountdown}
              disabled={countdown > 0} // Disable tombol saat hitung mundur aktif
              activeOpacity={0.88}
            >
              <Ionicons
                name={isTraining ? 'checkmark' : (isDuration ? 'timer-outline' : 'play')}
                size={20} color="#111"
              />
              <Text style={s.ctaBtnText}>
                {countdown > 0 ? `STARTING... (${countdown})` : isTraining
                  ? (isDuration ? `SELESAI (${activeSetCountdown} dtk)` : 'COMPLETE SET')
                  : (isDuration ? 'MULAI TIMER' : 'START SET')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.exSecondaryBtn} onPress={completeSet} activeOpacity={0.8}>
              <Text style={s.exSecondaryText}>SKIP SET</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REST SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'rest') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.restScroll} showsVerticalScrollIndicator={false}>
        <View style={s.restHeader}>
  <View style={s.restBadge}>
    <Text style={s.restBadgeText}>FASE ISTIRAHAT</Text>
  </View>

  <Text style={s.restTitle}>
    Waktunya Istirahat
  </Text>

  <Text style={s.restSubtitle}>
    Istirahat juga bagian dari progres
  </Text>
</View>
          <View style={s.restCircle}>
            <Text style={s.restCountdownText}>{formatCountdown(restCountdown)}</Text>
            <Text style={s.restCountdownSub}>detik tersisa</Text>
          </View>
          {upNext && (
  <View style={s.upNextCard}>
    {upNext.gifUrl ? (
      <Image
        source={{ uri: upNext.gifUrl }}
        style={s.upNextPreview}
        resizeMode="cover"
      />
    ) : (
      <View style={s.upNextPreviewPlaceholder}>
        <Ionicons name="barbell-outline" size={40} color="#666" />
      </View>
    )}

    <View style={s.upNextInfo}>
      <Text style={s.upNextLabel}>UP NEXT</Text>

      <Text style={s.upNextTitle}>
        {upNext.name}
      </Text>

      <View style={s.upNextMeta}>
        <Ionicons name="time-outline" size={14} color="#666" />
        <Text style={s.upNextMetaText}>
          {upNext.label}
        </Text>
      </View>
    </View>
  </View>
)}
          {/* Dua tombol: +15 SEC dan SKIP REST */}
          <View style={s.restBtnRow}>
            <TouchableOpacity style={s.addTimeBtn} onPress={addRestTime} activeOpacity={0.88}>
              <Ionicons name="add" size={16} color="#111" />
              <Text style={s.addTimeBtnText}>+15 SEC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.skipBtn} onPress={skipRest} activeOpacity={0.88}>
              <Text style={s.skipBtnText}>SKIP REST ▶</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINISHED SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.finishedScreen}>
        {/* Icon dengan centang hijau — sesuai referensi */}
        <View style={s.finishedIconWrap}>
          <View style={s.finishedIconCircle}>
            <Ionicons name="barbell" size={40} color="#fff" />
          </View>
          <View style={s.finishedCheckBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#5BFF7A" />
          </View>
        </View>
        <Text style={s.finishedTitle}>Workout{' '}Selesai!</Text>
        <Text style={s.finishedSub}>Pelan tidak apa-apa, yang penting konsisten</Text>
        <View style={s.durationCard}>
          <Text style={s.durationLabel}>DURASI TOTAL</Text>
          <Text style={s.durationValue}>{formatTime(totalTime)}</Text>
        </View>
        <View style={s.finStatsRow}>
          <View style={s.finStatCard}><Ionicons name="barbell" size={18} color="#4D7CFE" /><Text style={s.finStatLabel}>LATIHAN</Text><Text style={s.finStatValue}>{progress.length}</Text></View>
          <View style={s.finStatCard}><Ionicons name="layers" size={18} color="#A78BFA" /><Text style={s.finStatLabel}>TOTAL SETS</Text><Text style={s.finStatValue}>{totalSets}</Text></View>
        </View>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish} activeOpacity={0.88}>
          <Text style={s.finishBtnText}>Kembali ke Dashboard</Text>
          <Ionicons name="arrow-forward" size={18} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  // Preview
  previewScroll: { padding: 20, gap: 14, paddingBottom: 40 },
  previewHero: { backgroundColor: '#111', borderRadius: 24, padding: 24, height: 180, justifyContent: 'flex-end', gap: 8 },
  previewBadge: { alignSelf: 'flex-start', backgroundColor: '#5BFF7A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  previewBadgeText: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1, fontFamily: 'Lexend-Black' },
  previewTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', fontFamily: 'Lexend-Black' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5, fontFamily: 'Lexend-Bold' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  previewCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewThumb: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewGif: { width: 56, height: 56, borderRadius: 14 },
  previewCardTitle: { fontSize: 16, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold' },
  previewCardSub: { fontSize: 13, color: '#888', marginTop: 4, fontFamily: 'Lexend-Regular' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF1EC', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeDuration: { backgroundColor: '#EEF4FF' },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF6B35', fontFamily: 'Lexend-Bold' },
  previewQuote: { textAlign: 'center', fontSize: 13, color: '#AAA', fontStyle: 'italic', paddingVertical: 4, fontFamily: 'Lexend-Regular' },
  startBtn: { backgroundColor: '#5BFF7A', borderRadius: 50, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  // Exercise
  exScreen: { flex: 1, padding: 20, gap: 14 },
  progressBarWrap: { height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#5BFF7A', borderRadius: 3 },
  exCurrentLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8, fontFamily: 'Lexend-Bold' },
  exTitle: { fontSize: 28, fontWeight: '800', color: '#111', marginTop: -4, fontFamily: 'Lexend-Black' },
  videoPlaceholder: { flex: 1, },
  exStatsRow: { flexDirection: 'row', gap: 12 },
  exStatCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16, gap: 6 },
  exStatLabel: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.5, fontFamily: 'Lexend-Bold' },
  exSetRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  exSetWord: { fontSize: 20, fontWeight: '700', color: '#111', paddingBottom: 2, fontFamily: 'Lexend-Bold' },
  exSetNum: { fontSize: 38, fontWeight: '800', color: '#111', lineHeight: 44, fontFamily: 'Lexend-Black' },
  exSetSlash: { fontSize: 22, fontWeight: '600', color: '#AAA', paddingBottom: 2, fontFamily: 'Lexend-Bold' },
  exSetTotal: { fontSize: 22, fontWeight: '600', color: '#AAA', paddingBottom: 2, fontFamily: 'Lexend-Bold' },
  ctaBtn: { backgroundColor: '#5BFF7A', borderRadius: 50, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaBtnActive: { backgroundColor: '#FFD84D' },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: 0.5, fontFamily: 'Lexend-Black' },
  exBtnGroup: { gap: 10, marginTop: 'auto' as any },
  exSecondaryBtn: { backgroundColor: '#F0F0F0', borderRadius: 50, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  exSecondaryText: { fontSize: 13, fontWeight: '700', color: '#555', letterSpacing: 0.5, fontFamily: 'Lexend-Bold' },
  // Rest
  restScroll: { flexGrow: 1, padding: 20, gap: 20, alignItems: 'center', paddingBottom: 40 },
  restTopRow: { alignItems: 'center', gap: 2 },
  restTopTimer: { fontSize: 28, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  restTopLabel: { fontSize: 12, color: '#888', fontFamily: 'Lexend-Regular' },
  restHeader: {
  alignItems: 'center',
  marginTop: 0,
  marginBottom: 0,
},

restBadge: {
  backgroundColor: '#67F28A',
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 999,
  marginBottom: 1,
},

restBadgeText: {
  fontSize: 10,
  fontWeight: '700',
    color: '#1A4D2E', fontFamily: 'Lexend-Bold',
  letterSpacing: 1,
},

restTitle: {
  fontSize: 26,
  fontWeight: '900',
    color: '#111', fontFamily: 'Lexend-Black',
  textAlign: 'center',
},

restSubtitle: {
  marginTop: 2,
  fontSize: 16,
    color: '#666', fontFamily: 'Lexend-Regular',
  textAlign: 'center',
},
  restHeading: { fontSize: 22, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  restCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 8, borderColor: '#5BFF7A', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  restCountdownText: { fontSize: 54, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  restCountdownSub: { fontSize: 13, color: '#888', fontWeight: '500', fontFamily: 'Lexend-Regular' },
  upNextCard: {
  width: '100%',
  backgroundColor: '#FFF',
  borderRadius: 18,
  overflow: 'hidden',
},

upNextPreview: {
  width: '100%',
  height: 180,
  backgroundColor: '#EEE',
},

upNextPreviewPlaceholder: {
  width: '100%',
  height: 180,
  backgroundColor: '#2F2F38',
  alignItems: 'center',
  justifyContent: 'center',
},

upNextInfo: {
  padding: 16,
},

upNextLabel: {
  fontSize: 10,
  fontWeight: '700',
    color: '#5BFF7A', fontFamily: 'Lexend-Bold',
  letterSpacing: 1,
  marginBottom: 6,
},

upNextTitle: {
  fontSize: 22,
  fontWeight: '800',
    color: '#111', fontFamily: 'Lexend-Black',
  marginBottom: 8,
},

upNextMeta: {
  flexDirection: 'row',
  alignItems: 'center',
},

upNextMetaText: {
    marginLeft: 4, fontFamily: 'Lexend-Regular',
  fontSize: 13,
  color: '#666',
},
  skipBtn: { flex: 1, backgroundColor: '#5BFF7A', borderRadius: 40, paddingVertical: 18, alignItems: 'center' },
  skipBtnText: { fontWeight: '800', color: '#111', fontSize: 14, fontFamily: 'Lexend-Black' },
  restBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF', borderRadius: 40, paddingVertical: 18, paddingHorizontal: 20, borderWidth: 1.5, borderColor: '#E0E0E0' },
  addTimeBtnText: { fontWeight: '800', color: '#111', fontSize: 14, fontFamily: 'Lexend-Black' },
  // Finished
  finishedScreen: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 4 },
  finishedIconWrap: { position: 'relative', marginBottom: 4 },
  finishedIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  finishedCheckBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 14, padding: 1 },
  trophyWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  finishedTitle: { fontSize: 36, fontWeight: '800', color: '#111', marginTop: 20, textAlign: 'center', lineHeight: 44, fontFamily: 'Lexend-Black' },
  finishedSub: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22, fontFamily: 'Lexend-Regular' },
  durationCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginTop: 20, gap: 6 },
  durationLabel: { fontSize: 11, fontWeight: '700', color: '#888', fontFamily: 'Lexend-Bold' },
  durationValue: { fontSize: 34, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  finStatsRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  finStatCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 14, gap: 4 },
  finStatLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginTop: 8, fontFamily: 'Lexend-Bold' },
  finStatValue: { fontSize: 26, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  finishBtn: { width: '100%', backgroundColor: '#5BFF7A', paddingVertical: 18, borderRadius: 40, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  finishBtnText: { fontSize: 16, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  // Countdown Overlay
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', // Ubah kegelapan background di sini
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: { fontSize: 120, fontWeight: '900', color: '#6BFF8F', fontFamily: 'Lexend-Black' }, // Ubah ukuran atau warna angka di sini
});