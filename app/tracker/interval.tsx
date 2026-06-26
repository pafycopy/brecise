import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, Easing,
} from 'react-native-reanimated';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Pressable, Vibration, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';

const MIN_SPEED_MS       = 1.0;
const MIN_ACCURACY_M     = 15;
const MIN_DIST_THRESHOLD = 0.003;
const HOLD_DURATION      = 2000;

type RepPhase = 'idle' | 'running' | 'rest' | 'done';

type RepResult = {
  rep: number;
  distance: number;
  duration: number;
  pace: string;
  hit: boolean;
};

// ─── Full Circular Progress ───────────────────────────────────────────────
const RING_SIZE    = 220;
const STROKE       = 14;
const RADIUS       = (RING_SIZE - STROKE) / 2;
const CENTER       = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularProgress({
  progress,
  color,
  currentDist,
  targetDist,
}: {
  progress: number;
  color: string;
  currentDist: number;
  targetDist: number;
}) {
  const clamped          = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - clamped);

  return (
    <View style={ringStyles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS}
          stroke="#EBEBEB" strokeWidth={STROKE} fill="none" />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS}
          stroke={color} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      </Svg>
      <View style={ringStyles.centerContent}>
        <Text style={ringStyles.progressLabel}>
          {currentDist.toFixed(2)} km / {targetDist} km
        </Text>
        <Text style={ringStyles.label}>DISTANCE</Text>
        <Text style={[ringStyles.distanceValue, { color }]}>
          {currentDist.toFixed(2)}
        </Text>
        <Text style={ringStyles.distanceUnit}>KM</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE, height: RING_SIZE,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  centerContent: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 2 },
  label:         { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 1.5 },
  distanceValue: { fontSize: 44, fontWeight: '900', lineHeight: 52, letterSpacing: -1 },
  distanceUnit:  { fontSize: 16, fontWeight: '700', color: '#888' },
});

// ─── Main Component ───────────────────────────────────────────────────────
export default function IntervalTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutName, distance, pace, reps, restTime } =
    useLocalSearchParams<{
      uid: string; dateKey: string; workoutName: string;
      distance: string; pace: string; reps: string; restTime: string;
    }>();

  const totalReps    = parseInt(reps ?? '1');
  const targetDistKm = parseFloat(distance ?? '0');
  const restDuration = parseInt(restTime ?? '0');

  const [currentRep,    setCurrentRep]    = useState(1);
  const [phase,         setPhase]         = useState<RepPhase>('idle');
  const [isHolding,     setIsHolding]     = useState(false);
  const [repDist,       setRepDist]       = useState(0);
  const [repTime,       setRepTime]       = useState(0);
  const [repMovingTime, setRepMovingTime] = useState(0);
  const [restCountdown, setRestCountdown] = useState(restDuration);
  const [totalTime,     setTotalTime]     = useState(0);
  const [repResults,    setRepResults]    = useState<RepResult[]>([]);

  const subscription     = useRef<any>(null);
  const repTimerRef      = useRef<any>(null);
  const restTimerRef     = useRef<any>(null);
  const totalTimerRef    = useRef<any>(null);
  const holdTimeout      = useRef<any>(null);
  const lastLocationRef  = useRef<any>(null);
  const isMovingRef      = useRef<boolean>(false);
  const phaseRef         = useRef<RepPhase>('idle');
  const repDistRef       = useRef<number>(0);
  const repMovingTimeRef = useRef<number>(0);
  const repTimeRef       = useRef<number>(0);
  const currentRepRef    = useRef<number>(1);

  const kalmanRef = useRef({
    lat: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
    lon: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
  });

  const holdProgress = useSharedValue(0);

  const { finish } = useFinishWorkout(
    dateKey, uid,
    [repTimerRef, restTimerRef, totalTimerRef],
    subscription,
    { hasOwnDoneScreen: true, onAfterSave: () => setPhase('done') },
  );

  useEffect(() => { phaseRef.current         = phase;         }, [phase]);
  useEffect(() => { repDistRef.current       = repDist;       }, [repDist]);
  useEffect(() => { repMovingTimeRef.current = repMovingTime; }, [repMovingTime]);
  useEffect(() => { repTimeRef.current       = repTime;       }, [repTime]);
  useEffect(() => { currentRepRef.current    = currentRep;   }, [currentRep]);

  useEffect(() => {
    if (phase === 'running' || phase === 'rest') {
      totalTimerRef.current = setInterval(() => setTotalTime((p) => p + 1), 1000);
    } else { clearInterval(totalTimerRef.current); }
    return () => clearInterval(totalTimerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running') {
      repTimerRef.current = setInterval(() => {
        setRepTime((p) => p + 1);
        if (isMovingRef.current) setRepMovingTime((p) => p + 1);
      }, 1000);
    } else { clearInterval(repTimerRef.current); }
    return () => clearInterval(repTimerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'rest') {
      restTimerRef.current = setInterval(() => {
        setRestCountdown((p) => {
          if (p <= 1) { clearInterval(restTimerRef.current); startNextRep(); return restDuration; }
          return p - 1;
        });
      }, 1000);
    } else { clearInterval(restTimerRef.current); }
    return () => clearInterval(restTimerRef.current);
  }, [phase]);

  const kalmanUpdate = (axis: 'lat' | 'lon', measurement: number): number => {
    const k = kalmanRef.current[axis];
    if (!k.initialized) { k.estimate = measurement; k.initialized = true; return measurement; }
    k.errorEstimate += 0.0001;
    k.gain          = k.errorEstimate / (k.errorEstimate + k.errorMeasure);
    k.estimate      = k.estimate + k.gain * (measurement - k.estimate);
    k.errorEstimate = (1 - k.gain) * k.errorEstimate;
    return k.estimate;
  };

  const resetKalman = () => {
    kalmanRef.current = {
      lat: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
      lon: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
    };
  };

  const toRad = (v: number) => (v * Math.PI) / 180;

  const getDistance = (loc1: any, loc2: any): number => {
    const R = 6371;
    const dLat = toRad(loc2.latitude  - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 *
      Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude));
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calcPace = (dist: number, movingTime: number): string => {
    if (dist === 0 || movingTime === 0) return '--:--';
    const s = movingTime / dist;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const formatTargetPace = (p: string): string => {
    const val = parseFloat(p);
    if (isNaN(val)) return p;
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isPaceHit = (actualPace: string): boolean => {
    const targetPaceVal = parseFloat(pace ?? '0');
    const parts = actualPace.split(':');
    if (parts.length !== 2) return false;
    const actualSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return actualSec <= targetPaceVal * 60;
  };

  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 2 },
      (loc) => {
        const coord    = loc.coords;
        const accuracy = coord.accuracy ?? 999;
        const speed    = coord.speed ?? 0;
        if (accuracy > MIN_ACCURACY_M) return;
        isMovingRef.current = speed >= MIN_SPEED_MS;
        const filteredLat   = kalmanUpdate('lat', coord.latitude);
        const filteredLon   = kalmanUpdate('lon', coord.longitude);
        const filteredCoord = { latitude: filteredLat, longitude: filteredLon };
        setRepDist((prev) => {
          const last = lastLocationRef.current;
          if (!last) { lastLocationRef.current = filteredCoord; return prev; }
          const dist = getDistance(last, filteredCoord);
          if (dist < MIN_DIST_THRESHOLD) return prev;
          if (dist > 0.1)               return prev;
          if (!isMovingRef.current)     return prev;
          lastLocationRef.current = filteredCoord;
          const newDist = prev + dist;
          if (newDist >= targetDistKm && phaseRef.current === 'running') {
            setTimeout(() => triggerAutoComplete(newDist), 0);
          }
          return newDist;
        });
      }
    );
  };

  const triggerAutoComplete = async (finalDist: number) => {
    if (phaseRef.current !== 'running') return;
    subscription.current?.remove();
    subscription.current = null;
    clearInterval(repTimerRef.current);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 150, 100, 150]);
    const actualPace = calcPace(finalDist, repMovingTimeRef.current);
    const hit        = isPaceHit(actualPace) && finalDist >= targetDistKm;
    const result: RepResult = {
      rep: currentRepRef.current, distance: finalDist,
      duration: repTimeRef.current, pace: actualPace, hit,
    };
    setRepResults((prev) => {
      const updated = [...prev, result];
      if (currentRepRef.current >= totalReps) {
        finishWorkout(updated);
      } else {
        setPhase('rest');
        setRestCountdown(restDuration);
      }
      return updated;
    });
  };

  const startNextRep = async () => {
    clearInterval(restTimerRef.current);
    setCurrentRep((p) => p + 1);
    setRepDist(0); setRepTime(0); setRepMovingTime(0);
    lastLocationRef.current = null;
    resetKalman();
    await startLocationWatch();
    setPhase('running');
  };

  const skipRest = () => { clearInterval(restTimerRef.current); startNextRep(); };

  const finishWorkout = (results: RepResult[]) => {
    const totalDist     = results.reduce((a, r) => a + r.distance, 0);
    const totalDuration = results.reduce((a, r) => a + r.duration, 0);
    finish({
      actualDistance: totalDist, actualDuration: totalDuration,
      actualPace: calcPace(totalDist, totalDuration),
      completedAt: Date.now(), repResults: results,
    });
  };

  const handleStart = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { alert('Izin lokasi ditolak.'); return; }
    resetKalman();
    await startLocationWatch();
    setPhase('running');
  };

  const handleDiscard = () => {
    Alert.alert('Keluar?', 'Progress akan hilang.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive',
        onPress: () => {
          subscription.current?.remove();
          clearInterval(totalTimerRef.current);
          clearInterval(restTimerRef.current);
          router.back();
        },
      },
    ]);
  };

  const distProgress = Math.min(repDist / (targetDistKm || 1), 1);

  const handleHoldStart = () => {
    if (phase !== 'running') return;
    setIsHolding(true);
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
    holdTimeout.current = setTimeout(() => {
      triggerAutoComplete(repDistRef.current);
      setIsHolding(false);
      holdProgress.value = withTiming(0, { duration: 200 });
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    if (!isHolding) return;
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
    clearTimeout(holdTimeout.current);
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255,149,0,${0.3 + holdProgress.value * 0.7})`,
    transform:   [{ scale: 1 + holdProgress.value * 0.03 }],
  }));
  const animatedFillStyle = useAnimatedStyle(() => ({ opacity: holdProgress.value * 0.2 }));
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  const currentPace = calcPace(repDist, repMovingTime);

  // ─── Done screen ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    const hitCount  = repResults.filter((r) => r.hit).length;
    const allHit    = hitCount === totalReps;
    const totalDist = repResults.reduce((a, r) => a + r.distance, 0);

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]}>
        <ScrollView contentContainerStyle={styles.doneContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.trophyWrapper}>
            <Ionicons name="trophy" size={36} color="#5BFF7A" />
          </View>
          <Text style={styles.doneTitle}>Workout{'\n'}Selesai!</Text>
          <Text style={styles.doneSub}>
            {allHit ? 'Semua target tercapai, kerja bagus!' : `${hitCount}/${totalReps} target tercapai, terus tingkatkan!`}
          </Text>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>DURASI TOTAL</Text>
            <Text style={styles.durationValue}>{formatTime(totalTime)}</Text>
            <Text style={styles.durationUnit}>Menit</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxEmoji}>📍</Text>
              <Text style={styles.statBoxLabel}>JARAK</Text>
              <Text style={styles.statBoxValue}>{totalDist.toFixed(2)}</Text>
              <Text style={styles.statBoxUnit}>km</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxEmoji}>⚡</Text>
              <Text style={styles.statBoxLabel}>REP TERCAPAI</Text>
              <Text style={styles.statBoxValue}>{hitCount}/{totalReps}</Text>
              <Text style={styles.statBoxUnit}>rep</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>HASIL PER REPETISI</Text>
          {repResults.map((result) => (
            <View key={result.rep} style={[styles.repResultCard, { borderLeftColor: result.hit ? '#4CD964' : '#FF3B30' }]}>
              <View style={styles.repResultHeader}>
                <Text style={styles.repResultNum}>REP {result.rep}</Text>
                <View style={[styles.hitBadge, { backgroundColor: result.hit ? '#F0FFF4' : '#FFF5F5' }]}>
                  <Ionicons name={result.hit ? 'checkmark-circle' : 'close-circle'} size={12} color={result.hit ? '#2E7D32' : '#FF3B30'} />
                  <Text style={[styles.hitBadgeText, { color: result.hit ? '#2E7D32' : '#FF3B30' }]}>
                    {result.hit ? 'Target Tercapai' : 'Belum Tercapai'}
                  </Text>
                </View>
              </View>
              <View style={styles.repResultStats}>
                <View style={styles.repResultStat}>
                  <Text style={styles.repStatLabel}>JARAK</Text>
                  <Text style={styles.repStatValue}>{result.distance.toFixed(2)} km</Text>
                  <Text style={styles.repStatTarget}>target {targetDistKm} km</Text>
                </View>
                <View style={styles.repResultStat}>
                  <Text style={styles.repStatLabel}>PACE</Text>
                  <Text style={[styles.repStatValue, { color: result.hit ? '#2E7D32' : '#FF3B30' }]}>{result.pace}/km</Text>
                  <Text style={styles.repStatTarget}>target {formatTargetPace(pace ?? '0')}/km</Text>
                </View>
                <View style={styles.repResultStat}>
                  <Text style={styles.repStatLabel}>WAKTU</Text>
                  <Text style={styles.repStatValue}>{formatTime(result.duration)}</Text>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Kembali ke Dashboard →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Running screen ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <Text style={styles.workoutSub}>REP {currentRep}/{totalReps} · {formatTime(totalTime)}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Rep indicators */}
      <View style={styles.repIndicators}>
        {Array.from({ length: totalReps }).map((_, i) => {
          const done   = i < repResults.length;
          const active = i === currentRep - 1 && phase === 'running';
          const result = repResults[i];
          return (
            <View key={i} style={[
              styles.repDot,
              done   && { backgroundColor: result?.hit ? '#4CD964' : '#FF3B30' },
              active && { backgroundColor: '#FF9500', transform: [{ scale: 1.2 }] },
            ]} />
          );
        })}
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>

        {/* Rest overlay */}
        {phase === 'rest' && (
          <View style={styles.restOverlay}>
            <Text style={styles.restLabel}>ISTIRAHAT</Text>
            <Text style={styles.restCountdown}>{restCountdown}</Text>
            <Text style={styles.restSub}>detik</Text>
            <Text style={styles.restNext}>Rep {currentRep + 1} berikutnya</Text>
            <TouchableOpacity style={styles.skipBtn} onPress={skipRest}>
              <Text style={styles.skipText}>SKIP ▶</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase label */}
        <View style={styles.phaseTitleRow}>
          <Text style={styles.phaseTitle}>
            {phase === 'idle' ? 'Siap Mulai' : phase === 'running' ? `Rep ${currentRep}` : 'Istirahat'}
          </Text>
          {phase === 'running' && (
            <View style={[styles.badge, { backgroundColor: isMovingRef.current ? '#FF9500' : '#AAA' }]}>
              <Text style={styles.badgeText}>{isMovingRef.current ? 'TRACKING' : 'DIAM'}</Text>
            </View>
          )}
        </View>

        {/* Circular ring */}
        <CircularProgress
          progress={distProgress}
          color="#FF9500"
          currentDist={repDist}
          targetDist={targetDistKm}
        />

        {/* Target hint */}
        <Text style={styles.targetHint}>
          Target: {targetDistKm} km @ {formatTargetPace(pace ?? '0')}/km
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{formatTime(repTime)}</Text>
            <Text style={styles.statSub}>MM:SS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG PACE</Text>
            <Text style={[
              styles.statValue,
              currentPace !== '--:--'
                ? isPaceHit(currentPace) ? { color: '#2E7D32' } : { color: '#FF3B30' }
                : {},
            ]}>
              {currentPace}
            </Text>
            <Text style={styles.statSub}>MIN/KM</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          {phase === 'idle' && (
            <TouchableOpacity style={styles.mainBtn} onPress={handleStart}>
              <Text style={styles.mainBtnText}>MULAI INTERVAL</Text>
            </TouchableOpacity>
          )}

          {phase === 'running' && (
            <>
              <Text style={styles.bottomHint}>
                {isHolding ? 'Tahan untuk selesaikan rep...' : 'Otomatis berhenti saat target jarak tercapai'}
              </Text>
              <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
                <Animated.View style={[styles.holdBtn, animatedBorderStyle]}>
                  <Animated.View style={[styles.holdBtnFill, animatedFillStyle]} />
                  <Animated.Text style={[styles.holdBtnText, animatedTextStyle]}>
                    {isHolding ? '⏹ SELESAIKAN REP...' : 'HOLD TO FINISH REP'}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerCenter: { alignItems: 'center' },
  workoutName:  { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: '#111' },
  workoutSub:   { fontSize: 11, color: '#888', marginTop: 2 },

  repIndicators: {
    flexDirection: 'row', gap: 6, justifyContent: 'center',
    paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    flexWrap: 'wrap', paddingHorizontal: 16,
  },
  repDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' },

  // View biasa (bukan ScrollView) untuk layout yang rapi
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  phaseTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  phaseTitle: { fontSize: 20, fontWeight: '800', color: '#111', textAlign: 'center' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  targetHint: { textAlign: 'center', fontSize: 12, color: '#999', fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#F7F7F7', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', gap: 3,
  },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '700', letterSpacing: 0.8 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111' },
  statSub:   { fontSize: 10, color: '#BBB', fontWeight: '600' },

  buttonGroup:  { gap: 10 },
  bottomHint:   { textAlign: 'center', color: '#AAA', fontSize: 12 },
  mainBtn: {
    borderRadius: 999, height: 56,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#63EA7B',
  },
  mainBtnText: { color: '#111', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  holdBtn: {
    height: 56, borderRadius: 999, borderWidth: 2,
    borderColor: 'rgba(255,149,0,0.3)', backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  holdBtnFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FF9500', borderRadius: 999,
  },
  holdBtnText: { color: '#FF9500', fontWeight: '700', letterSpacing: 1, fontSize: 14 },

  restOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1A1A2Eee', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  restLabel:     { fontSize: 14, fontWeight: '700', color: '#FFFFFF88', letterSpacing: 2 },
  restCountdown: { fontSize: 80, fontWeight: '800', color: '#4CD964' },
  restSub:       { fontSize: 16, color: '#FFFFFF88' },
  restNext:      { fontSize: 13, color: '#FFFFFF66', marginTop: 4 },
  skipBtn:  { marginTop: 16, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30, borderWidth: 1, borderColor: '#FFFFFF44' },
  skipText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 },

  // Done screen
  doneContainer: { padding: 24, gap: 20, paddingBottom: 48, alignItems: 'center' },
  trophyWrapper: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  doneTitle: { fontSize: 36, fontWeight: '900', color: '#1A1A2E', textAlign: 'center', lineHeight: 42 },
  doneSub:   { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  durationBox: { width: '100%', backgroundColor: '#F4F4F4', borderRadius: 16, padding: 20, gap: 2 },
  durationLabel: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.8 },
  durationValue: { fontSize: 36, fontWeight: '900', color: '#1A1A2E' },
  durationUnit:  { fontSize: 14, color: '#888', fontWeight: '600' },
  statRow:  { flexDirection: 'row', gap: 12, width: '100%' },
  statBox:  { flex: 1, backgroundColor: '#F4F4F4', borderRadius: 16, padding: 16, gap: 2 },
  statBoxEmoji: { fontSize: 22, marginBottom: 4 },
  statBoxLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  statBoxValue: { fontSize: 24, fontWeight: '900', color: '#1A1A2E' },
  statBoxUnit:  { fontSize: 12, color: '#888', fontWeight: '500' },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  repResultCard: { width: '100%', backgroundColor: '#F9F9F9', borderRadius: 14, padding: 14, borderLeftWidth: 4, gap: 10 },
  repResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repResultNum:    { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  hitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  hitBadgeText: { fontSize: 11, fontWeight: '700' },
  repResultStats: { flexDirection: 'row', justifyContent: 'space-between' },
  repResultStat:  { alignItems: 'center', gap: 2 },
  repStatLabel:   { fontSize: 10, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  repStatValue:   { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  repStatTarget:  { fontSize: 10, color: '#BBB' },
  doneBtn: { width: '100%', backgroundColor: '#63EA7B', borderRadius: 40, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#111', fontWeight: '800', fontSize: 16 },
});